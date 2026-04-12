# RBAC 权限模型

MolanDev Backend 采用 RBAC（Role-Based Access Control，基于角色的访问控制）模型实现权限管理。

## 核心概念

### 基础实体

- **用户（User）** - 系统使用者
- **角色（Role）** - 权限的集合
- **菜单（Menu）** - 前端可访问的页面
- **权限（Permission）** - 操作权限码，控制按钮级别的操作

### 关系模型

```
用户 (sys_user)
  ↓ (N:N)
角色 (sys_role)
  ↓ (N:N)
菜单 (sys_menu) + 权限码 (permission_code)
```

**关系表：**
- `sys_user_role` - 用户与角色的关联
- `sys_role_menu` - 角色与菜单的关联

## 权限类型

### 1. 菜单权限

控制用户可以访问哪些页面（路由）。

**实现方式：**
- 角色关联菜单
- 前端根据用户菜单动态加载路由
- 左侧菜单根据权限动态显示

### 2. 操作权限

控制用户可以执行哪些操作（按钮）。

**权限码格式：** `模块:功能:操作`

**示例：**
```
sys:user:query   // 查询用户
sys:user:add     // 新增用户
sys:user:edit    // 编辑用户
sys:user:delete  // 删除用户
```

**实现方式：**
- 菜单中配置权限码
- 前端通过 `v-auth` 指令控制按钮显示
- 后端通过 `@HasPermission` 注解 + AOP 切面校验操作权限

## 数据表结构

### 用户表 (sys_user)

存储用户基本信息：账号、密码、姓名、部门等。

### 角色表 (sys_role)

存储角色信息：角色名称、角色代码、排序等。

### 菜单表 (sys_menu)

存储菜单和按钮信息：
- `type` - 类型（0=目录, 1=菜单, 2=按钮）
- `path` - 前端路由路径
- `component` - 前端组件路径
- `permission_code` - 权限码（用于按钮权限）
- `parent_id` - 父菜单ID（树形结构）

### 用户角色关联表 (sys_user_role)

- `user_id` - 用户ID
- `role_id` - 角色ID

### 角色菜单关联表 (sys_role_menu)

- `role_id` - 角色ID
- `menu_id` - 菜单ID

## 权限标注

### @HasPermission 注解

在 Controller 方法上使用 `@HasPermission` 标注需要的权限码：

```java
@PostMapping("/add")
@HasPermission("sys:user:add")
public JsonResult<String> add(@ParameterObject SysUserEntity user) {
    // ...
}

@PostMapping("/delete")
@HasPermission("sys:user:delete")
public JsonResult<Void> delete(@RequestParam String id) {
    // ...
}
```

**注解属性：**
- `value` - 权限码数组，满足其一即可访问
- 支持多个权限码：`@HasPermission({"sys:user:add", "sys:user:edit"})`

### 权限校验机制

系统使用 **AOP 切面** 进行权限校验，由 `PermissionAopAspect` 实现。

**校验流程：**

```
请求到达 Controller
  ↓
PermissionAopAspect（AOP 拦截 @HasPermission 注解）
  ↓ 检查是否 admin 角色（直接放行）
  ↓ 获取用户权限码集合
  ↓ 比对所需权限码与用户权限码
  ↓ 任一匹配 → 放行
  ↓ 全不匹配 → 抛出 NoPermissionException
  ↓
Controller 方法执行
```

**双模权限码获取：**

| 模式 | 权限码来源 | 说明 |
|------|-----------|------|
| GATEWAY | `USER_PERMISSIONS` Header | 网关通过 `PermissionForwardGatewayFilter` 转发 |
| LOCAL | Redis `AUTH_PERMISSION:{token}` | 直接从 Redis 读取 |

**GATEWAY 模式（从 Header 获取）：**
```java
private Set<String> getPermissionsFromHeader() {
    String header = MvcUtils.getHeader(AuthConst.HEADER_USER_PERMISSIONS);
    return Arrays.stream(header.split(","))
        .map(String::trim)
        .filter(StringUtils::isNotEmpty)
        .collect(Collectors.toSet());
}
```

**LOCAL 模式（从 Redis 获取）：**
```java
private Set<String> getPermissionsFromRedis() {
    ContextUser contextUser = AuthUtils.getUser();
    String token = contextUser.getAccessToken();
    String key = AuthConst.AUTH_PERMISSION_CACHE_PREFIX + token;
    RSet<String> permissionSet = redissonClient.getSet(key, StringCodec.INSTANCE);
    return permissionSet.readAll();
}
```

**Admin 角色放行：**
```java
if (AuthUtils.isAdmin()) {
    return pjp.proceed();
}
```
拥有 `admin` 角色的用户自动跳过所有权限校验。

**异常处理：**

权限不足时抛出 `NoPermissionException`，由 `PermissionExceptionAdvice` 统一捕获并返回无权限响应：

```java
@ExceptionHandler({NoPermissionException.class})
public Object serviceExceptionHandler(NoPermissionException ex) {
    return JsonResult.noPermission();
}
```

### 自动配置

`AuthAutoConfiguration` 根据认证模式自动注册权限校验组件：

**LOCAL 模式（`molandev.security.mode=LOCAL`）：**
- 注册 `LocalAuthFilter`（认证）
- 注册 `PermissionAopAspect`（权限校验）

**GATEWAY 模式（`molandev.security.mode=GATEWAY`）：**
- 注册 `PermissionAopAspect`（权限校验）
- 不注册 `LocalAuthFilter`（认证由网关完成）

**关闭权限校验：**
```yaml
molandev:
  security:
    check-permission: false
```

### 为什么不使用 @HasRole

系统**仅支持功能权限**（`@HasPermission`），**不支持角色权限**（`@HasRole`）。

**设计理由：**

1. **RBAC 模型的正确实践**
   - 角色是权限的容器，不应直接用于访问控制
   - 用户 → 角色 → 权限 → 资源，权限才是实际控制点

2. **灵活性**
   - 权限粒度更细，可以精确控制到每个操作
   - 同一权限可分配给多个角色，避免代码与角色耦合

3. **可维护性**
   - 修改角色权限时，不需要修改代码
   - 新增角色时，只需分配现有权限，无需改动代码

4. **避免硬编码**
   - 角色名称硬编码在代码中，难以适应组织架构变化
   - 权限码相对稳定，与业务功能绑定

**示例对比：**
```java
// 不推荐：角色硬编码
@HasRole("admin")
public void deleteUser() { }
// 问题：如果增加"超级管理员"角色也需要此权限，需要修改代码

// 推荐：功能权限
@HasPermission("sys:user:delete")
public void deleteUser() { }
// 优势：任何角色只要分配了 sys:user:delete 权限即可访问
```

## 权限查询

### 获取用户菜单

```java
List<SysMenuTreeVo> menus = sysPermissionService.listPermissionMenuTree(userId);
```

**查询逻辑：**
1. 查询用户的所有角色
2. 查询这些角色关联的所有菜单
3. 补充丢失的父级菜单（菜单移动后可能父级无权限）
4. 过滤掉禁用的菜单
5. 构建树形结构

### 获取用户权限码

```java
List<String> permissions = sysPermissionService.listPermissionCodes(userId);
```

**查询逻辑：**
1. 查询用户的所有角色
2. 查询这些角色关联的所有菜单
3. 提取菜单中的权限码（`permission_code` 字段）
4. 去重返回

### 获取用户详情（登录时）

```java
SysUserDetail userDetail = sysPermissionService.getUserDetail(account);
```

**查询逻辑：**
1. 根据账号/手机号/邮箱查询用户
2. 查询用户的所有权限码
3. 查询用户的所有角色编码
4. 组装 `SysUserDetail` 返回

## 权限缓存

### 用户登录时缓存

用户登录成功后，将权限信息缓存到 Redis：

- `AUTH_PERMISSION:{token}` - Set 结构，存储用户的所有权限码
- 过期时间与 Token 一致

### 权限刷新

用户的权限码缓存会在以下时机自动更新：

1. **页面刷新时**
   - 前端调用 `POST /sys/me/funcs` 接口
   - 后端重新查询数据库获取最新权限码
   - 调用 `customTokenStore.restorePermission()` 更新 Redis 缓存
   - 用户无需重新登录即可获得最新权限

2. **用户重新登录**
   - 登录时写入最新的权限码到 Redis

::: tip 注意
用户刷新页面时，前端会重新请求权限接口，后端会重新查询数据库并更新 Redis 缓存，从而实现权限刷新，无需重新登录。
:::

## 最佳实践

### 1. 权限粒度

- **页面级** - 控制菜单访问
- **功能级** - 控制按钮操作
- 避免过细的权限划分

### 2. 权限命名

- 统一使用 `模块:功能:操作` 格式
- 操作动词：query、add、edit、delete、export、import 等
- 保持命名一致性

### 3. 角色设计

- 按照实际岗位设计角色
- 避免一个用户过多角色
- 定期审查和清理无用角色

### 4. 权限分配

- 最小权限原则
- 通过角色分配权限，而非直接给用户
- 重要权限需要审批流程

### 5. 路由权限前缀配置

- 每个微服务路由只配置所需模块的前缀
- 前缀与权限码的模块部分对应
- 避免传递不必要的权限码

## 总结

MolanDev Backend 的 RBAC 模型提供了：

- 清晰的权限层级结构
- 灵活的角色管理
- 菜单和操作两级权限控制
- 基于 AOP 的权限校验
- GATEWAY/LOCAL 双模权限码获取
- 基于 Redis 的权限缓存
- 页面刷新自动更新权限
