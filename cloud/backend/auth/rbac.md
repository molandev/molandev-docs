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
- 后端通过权限过滤器校验操作权限

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

**注解作用：**

`@HasPermission` 注解是**权限元数据声明**，而非触发校验的标记：

1. **声明作用** - 标注此接口需要什么权限
2. **扫描收集** - 启动时被 `PermissionMetadataCollector` 扫描
3. **提供映射** - 通过 `/_permission/mapping` 接口暴露给网关
4. **网关校验** - 网关根据映射关系进行权限校验

### 权限校验机制

**重要说明：系统不使用 AOP 方式进行权限校验。**

**校验位置：**

- **微服务模式** - 在网关的 `PermissionCheckGatewayFilter` 中统一校验
- **单体模式** - 在 `LocalAuthFilter` 中统一校验
- **后端服务** - 请求到达时已通过权限验证，无需再次校验

**设计理由：**

1. **统一入口，避免重复**
   - 权限校验集中在网关/Filter 层
   - 避免网关校验一次、后端 AOP 再校验一次的性能浪费

2. **职责分离更清晰**
   - 网关职责：认证 + 授权（权限校验）
   - 后端职责：业务逻辑处理
   - `@HasPermission` 仅作为元数据声明

3. **性能优化**
   - Filter/Gateway Filter 在请求链路的更前端
   - 无权限的请求更早被拒绝，不进入业务层

4. **双模兼容**
   - 微服务和单体模式都能正常工作
   - 统一的权限标注方式

**工作流程：**

```
微服务模式：
请求 → Gateway 
     → GatewayAuthFilter(认证) 
     → PermissionCheckGatewayFilter(授权，读取 @HasPermission 元数据)
     → 后端服务 Controller(无需再校验)

单体模式：
请求 → LocalAuthFilter(认证+授权，读取 @HasPermission 元数据)
     → Controller(无需再校验)
```

**扫描机制：**
- 微服务启动时，`PermissionMetadataCollector` 扫描所有 `@HasPermission` 注解
- 收集 RequestMapping 路径、HTTP 方法、权限码的映射关系
- 通过 `/_permission/mapping` 接口暴露给网关

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
// ❌ 不推荐：角色硬编码
@HasRole("admin")
public void deleteUser() { }
// 问题：如果增加"超级管理员"角色也需要此权限，需要修改代码

// ✅ 推荐：功能权限
@HasPermission("sys:user:delete")
public void deleteUser() { }
// 优势：任何角色只要分配了 sys:user:delete 权限即可访问
```

## 权限查询

### 获取用户菜单

```java
// 根据用户ID查询所有菜单
List<SysMenuEntity> menus = sysPermissionService.getMenusByUserId(userId);
```

**查询逻辑：**
1. 查询用户的所有角色
2. 查询这些角色关联的所有菜单
3. 过滤掉禁用的菜单
4. 构建树形结构

### 获取用户权限码

```java
// 根据用户ID查询所有权限码
Set<String> permissions = sysPermissionService.getPermissionsByUserId(userId);
```

**查询逻辑：**
1. 查询用户的所有角色
2. 查询这些角色关联的所有菜单
3. 提取菜单中的权限码（`permission_code` 字段）
4. 去重返回

## 权限映射

### 映射机制

微服务启动时自动扫描 `@HasPermission` 注解，构建路径与权限码的映射关系。

**映射接口：** `GET /_permission/mapping`

**返回格式：**
```json
[
  {
    "path": ["/sys/user/add"],
    "method": ["POST"],
    "permissionCode": ["sys:user:add"]
  },
  {
    "path": ["/sys/user/delete"],
    "method": ["POST"],
    "permissionCode": ["sys:user:delete"]
  }
]
```

**实现类：**
- `PermissionMetadataCollector` - 扫描注解
- `PermissionMappingEndpoint` - 暴露接口

**网关使用：**
- `PermissionCheckGatewayFilter` 启动时调用此接口
- 缓存权限映射关系
- 用于请求路径与权限码的匹配

## 权限缓存

### 用户登录时缓存

用户登录成功后，将权限信息缓存到 Redis：

- `auth:permission:{token}` - Set 结构，存储用户的所有权限码
- 过期时间与 Token 一致

### 权限刷新

当角色权限变更或微服务重启时，网关会自动刷新权限映射。

**自动刷新机制：**

1. **微服务上线监听**
   - `ServiceChangeListener4Permission` 监听 Nacos 服务上线事件
   - 服务上线时自动调用 `clearPermissionMap()`
   - 下次请求时重新加载权限映射

2. **配置触发**
   - 在 Nacos 路由配置中，将 `PermissionCheck` 过滤器的 `key` 属性设为 `Always`
   - 启用自动监听服务上线
   - 或者修改 `key` 的值来手动触发刷新

**配置示例：**
```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: system-service
          uri: lb://system-service
          filters:
            - name: PermissionCheck
              args:
                key: Always  # 自动监听服务上线
```

**核心方法：**
```java
// PermissionCheckGatewayFilter.java
public void clearPermissionMap() {
    this.permissionMaps = null;
    // 下次请求时会重新调用 /_permission/mapping
}
```

**用户权限刷新：**

用户的权限码缓存会在以下时机自动更新：

1. **页面刷新时**
   - 前端调用 `POST /sys/me/funcs` 接口
   - 后端重新查询数据库获取最新权限码
   - 调用 `customTokenStore.restorePermission()` 更新 Redis 缓存
   - 用户无需重新登录即可获得最新权限

2. **用户重新登录**
   - 登录时写入最新的权限码到 Redis

::: tip 注意
- 用户的权限码缓存（`auth:permission:{token}`）在用户刷新页面时会自动更新
- 前端刷新时会调用权限接口，后端重新查询并更新 Redis 缓存
- 权限映射（路径与权限码关系）会自动刷新
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

## 总结

MolanDev Backend 的 RBAC 模型提供了：

- ✅ 清晰的权限层级结构
- ✅ 灵活的角色管理
- ✅ 菜单和操作两级权限控制
- ✅ 基于 Redis 的权限缓存
- ✅ 权限动态刷新机制
