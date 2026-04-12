# 网关认证与权限转发

MolanDev Backend 在网关层实现了认证和权限转发机制，权限校验由后端服务通过 AOP 完成。

## 架构设计

### 过滤器链

网关使用两个核心过滤器：

1. **GatewayAuthFilter** - 认证过滤器（GlobalFilter，Order=1）
   - 验证 Token 有效性
   - 解析用户信息
   - 白名单检查
   - 获取用户权限码
   - Token 续期

2. **PermissionForwardGatewayFilter** - 权限转发过滤器（Per-route GatewayFilter）
   - 从 exchange attribute 获取用户权限码
   - 按前缀过滤当前服务所需的权限码
   - 通过 Header 转发给后端服务

### 处理流程

```
请求进入
  ↓
GatewayAuthFilter（认证 + 加载权限）
  ↓ Token 验证
  ↓ 白名单检查
  ↓ 用户信息解析
  ↓ 获取用户权限码 → 存入 exchange attribute
  ↓ 自动续期
  ↓
PermissionForwardGatewayFilter（权限转发）
  ↓ 读取 exchange attribute 中的权限码
  ↓ 按前缀过滤
  ↓ 写入 USER_PERMISSIONS Header
  ↓
后端服务
  ↓ PermissionAopAspect（AOP 权限校验）
```

## 认证过滤器

### 核心功能

**GatewayAuthFilter** 负责验证用户身份并加载权限信息。

**处理逻辑：**

1. **WebService 绕过**
   ```java
   if (exchange.getRequest().getURI().getPath().contains("webservice")) {
       return chain.filter(exchange);
   }
   ```

2. **Swagger 开发模式**
   ```java
   if (swaggerEnabled && originHeaders.contains("Knife4j")) {
       return chain.filter(exchange);
   }
   ```

3. **无 Token 请求**
   - 白名单路径：放行
   - 非白名单路径：返回未登录

4. **Token 验证**
   - 从 Redis 获取 Token 信息（`AUTH_TOKEN:{token}`）
   - 检查 Token 是否存在
   - 检查是否被踢出（`kickout=1`）

5. **获取权限码**
   ```java
   Set<String> permissions = reactiveRedisTemplate.opsForSet()
       .members(AuthConst.AUTH_PERMISSION_CACHE_PREFIX + token)
       .collect(Collectors.toSet());
   // 存入 exchange attribute，供 PermissionForwardGatewayFilter 使用
   newExchange.getAttributes().put(ATTR_USER_PERMISSIONS, permissions);
   ```

6. **自动续期**
   ```java
   if (expireInSeconds > 0 && expireInSeconds < effectiveSeconds / 2) {
       reactiveRedisTemplate.expire(AUTH_TOKEN:{token}, effectiveSeconds);
       reactiveRedisTemplate.expire(AUTH_PERMISSION:{token}, effectiveSeconds);
   }
   ```

7. **用户信息传递**
   ```java
   String encodeUser = URLEncoder.encode(userJson, StandardCharsets.UTF_8);
   newRequest.header(AuthConst.HEADER_USER_INFO, encodeUser);
   ```

### 白名单配置

**配置类：** `GatewayAuthProperties`

**配置前缀：** `molandev.security`

**内部白名单（`innerWhiteUris`）：**

```java
List<String> innerWhiteUris = ListUtils.toList(
    "/sys/login",
    "/sys/captcha",
    "/sys/area/treeSimple",
    "/sys/area/children",
    "/sys/strategy/user/info",
    "/auth/qrcode/verify",
    "/file/upload",
    "/file/preview/**",
    "/file/download/**",
    "/*/v3/api-docs",
    "/v3/api-docs",
    "/doc.html",
    "/v3/api-docs/swagger-config",
    "/webjars/**"
);
```

**自定义白名单（`whiteUris`）：**

```yaml
molandev:
  security:
    white-uris:
      - /your/custom/path
```

**合并规则：** 自定义白名单与内部白名单合并，使用 `AntPathMatcher` 匹配。

**匹配规则：**
- 使用 `AntPathMatcher` 进行路径匹配
- 支持通配符：`*` 和 `**`
- `/sys/user/*` - 匹配一级路径
- `/sys/user/**` - 匹配所有子路径

### 临时 Token 限制

临时 Token 只能访问特定接口：

**配置：**
```yaml
molandev:
  security:
    temp-uris:
      - /sys/personal/updatePassword    # 修改密码
      - /sys/personal/info              # 个人信息
```

**检查逻辑：**
```java
if (UserSessionObj.TEMP_FLAG.equals(userSessionObj.getTemp())) {
    if (checkTempUri(path)) {
        return chain.filter(newExchange);
    } else {
        return handleUnauthorized(exchange);
    }
}
```

## 权限转发过滤器

### 核心功能

**PermissionForwardGatewayFilter** 负责将用户权限码按前缀过滤后转发给后端服务。

**设计思路：**

权限校验不再在网关层执行，而是由后端服务的 `PermissionAopAspect` 通过 AOP 完成。网关只负责将当前服务所需的权限码通过 Header 传递给后端，后端根据 `@HasPermission` 注解进行校验。

**处理逻辑：**

1. **获取权限码**
   ```java
   Set<String> userPermissions = exchange.getAttribute(GatewayAuthFilter.ATTR_USER_PERMISSIONS);
   ```

2. **按前缀过滤**
   ```java
   String filtered = permissions.stream()
       .filter(permission -> {
           for (String prefix : permissionPrefixes) {
               if (permission.startsWith(prefix)) {
                   return true;
               }
           }
           return false;
       })
       .collect(Collectors.joining(","));
   ```

3. **写入 Header**
   ```java
   ServerHttpRequest newRequest = exchange.getRequest().mutate()
       .header(AuthConst.HEADER_USER_PERMISSIONS, URLEncoder.encode(filtered, StandardCharsets.UTF_8))
       .build();
   ```

### 路由配置

**过滤器工厂：** `PermissionForwardGatewayFilterFactory`

**配置格式：** `PermissionForward=前缀1,前缀2,...`

**Nacos 路由配置示例：**
```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: system-service
          uri: lb://system-service
          filters:
            - PermissionForward=sys,task,msg
        - id: knowledge-service
          uri: lb://knowledge-service
          filters:
            - PermissionForward=sys,knowledge
```

**配置说明：**
- `PermissionForward=sys,task,msg` 表示只传递以 `sys`、`task`、`msg` 开头的权限码
- 不配置前缀时，传递所有权限码
- 前缀与权限码格式 `模块:功能:操作` 中的模块部分对应

### 为什么不在网关校验权限

旧版本在网关层通过 `PermissionCheckGatewayFilter` 执行权限校验，存在以下问题：

1. **映射维护复杂**
   - 网关需要从各服务拉取 `/_permission/mapping` 接口获取路径与权限码的映射
   - 服务上下线时需要刷新映射缓存
   - 路径匹配规则复杂，容易出错

2. **职责不清晰**
   - 网关需要理解业务权限语义
   - 权限码与路径的映射关系分散在网关和后端两处

3. **扩展性差**
   - 新增服务需要配置映射刷新监听
   - 权限变更需要网关侧同步刷新

新架构将权限校验回归到后端服务：
- 网关只做认证和权限转发
- 后端通过 AOP 直接读取 `@HasPermission` 注解进行校验
- 无需维护路径映射，无需 `/_permission/mapping` 接口

## 请求头传递

网关将用户信息和权限码通过请求头传递给后端服务：

**传递内容：**
```java
ServerHttpRequest newRequest = request.mutate()
    .header(AuthConst.HEADER_AUTHORIZATION, token)           // Admin-Token
    .header(AuthConst.HEADER_USER_INFO, encodeUser)          // URL 编码的用户信息 JSON
    .header(AuthConst.HEADER_USER_PERMISSIONS, encodePerms)  // URL 编码的权限码（逗号分隔）
    .build();
```

**请求头：**
| Header | 说明 | 示例 |
|--------|------|------|
| `Admin-Token` | 用户 Token | `uuid-string` |
| `USER_INFO` | URL 编码的用户信息 JSON | `%7B%22id%22%3A...%7D` |
| `USER_PERMISSIONS` | URL 编码的权限码（逗号分隔） | `sys%3Auser%3Aadd%2Csys%3Auser%3Aedit` |

**后端获取：**
```java
// 获取当前用户
ContextUser user = AuthUtils.contextUser();

// 获取权限码（由 PermissionAopAspect 内部处理，业务代码无需关心）
```

## 安全过滤器

### RemoveHeaderGlobalFilter

`RemoveHeaderGlobalFilter` 是一个全局过滤器，用于移除外部请求中的 `INNER` Header，防止外部请求伪造内部调用。

```java
if (headers.containsKey(AuthConst.HEADER_INNER)) {
    // 移除 INNER 头部字段，防止外部伪造
    exchangeBuilder.request(exchange.getRequest().mutate()
        .headers(httpHeaders -> httpHeaders.remove(AuthConst.HEADER_INNER))
        .build());
}
```

## 单体模式支持

单体模式使用 `LocalAuthFilter` 实现认证功能，权限校验由 `PermissionAopAspect` 完成。

### LocalAuthFilter

**差异：**
- 使用 Servlet Filter（`OncePerRequestFilter`）而非 Gateway Filter
- 同步代码而非响应式
- 直接从 Redisson 获取数据
- 不负责权限校验，仅做认证

**核心逻辑：**
```java
@Override
protected void doFilterInternal(HttpServletRequest request,
                                HttpServletResponse response,
                                FilterChain filterChain) {
    // 1. Swagger 绕过
    // 2. 提取 Token
    // 3. 从 Redis 获取用户会话
    // 4. 白名单检查
    // 5. 踢出检查
    // 6. 临时 Token 检查
    // 7. 正常用户：设置上下文 + 自动续期
    // 8. 权限校验由 PermissionAopAspect 负责
}
```

### 双模配置

通过 `AuthAutoConfiguration` 根据配置自动注册对应的 Bean：

**配置项：**
```yaml
molandev:
  security:
    mode: LOCAL          # LOCAL 或 GATEWAY
    check-permission: true  # 是否启用权限校验，默认 true
```

**LOCAL 模式：**
- 注册 `LocalAuthFilter`（认证）
- 注册 `PermissionAopAspect`（权限校验，从 Redis 读取权限码）

**GATEWAY 模式：**
- 不注册 `LocalAuthFilter`（认证由网关完成）
- 注册 `PermissionAopAspect`（权限校验，从 Header 读取权限码）

## 特殊处理

### 1. WebSocket 支持

WebSocket 连接在单体模式下返回 401 状态码：

```java
if (isWebSocket) {
    response.setStatus(401);
}
```

- 不返回 JSON，直接设置 401 状态码
- 避免 WebSocket 连接收到非协议消息

### 2. WebService 绕过

SOAP WebService 请求绕过认证：

```java
if (exchange.getRequest().getURI().getPath().contains("webservice")) {
    return chain.filter(exchange);
}
```

### 3. Swagger 开发模式

开发环境允许 Knife4j 绕过认证：

```java
if (swaggerEnabled && originHeaders.contains("Knife4j")) {
    return chain.filter(exchange);
}
```

**配置：**
```yaml
knife4j:
  gateway:
    enabled: true  # 开发环境设置为 true
```

**生产环境必须关闭！**

## Redis 缓存结构

### Token 缓存

- **Key：** `AUTH_TOKEN:{token}`
- **Type：** String（JSON 序列化的 `UserSessionObj`）
- **TTL：** 会话过期时间（默认 30 分钟）

### 权限码缓存

- **Key：** `AUTH_PERMISSION:{token}`
- **Type：** Set
- **Value：** 权限码列表
- **TTL：** 与 Token 一致

### 用户 Token 集合

- **Key：** `USERID_TO_ACCESS:{userId}`
- **Type：** Set
- **Value：** 该用户的所有有效 Token

## 安全建议

### 1. 白名单管理

- 最小化白名单范围
- 定期审查白名单配置
- 敏感接口不要加入白名单
- 生产环境关闭 Swagger

### 2. Token 安全

- 使用 HTTPS 传输
- Token 使用随机 UUID
- 设置合理的过期时间
- 定期清理过期 Token

### 3. 权限转发

- 每个路由只配置所需的前缀，避免传递过多权限码
- 前缀与权限码模块对应，确保覆盖完整
- 不配置前缀时传递全部权限码，适用于需要完整权限的服务

### 4. 监控审计

- 记录所有认证失败
- 监控异常访问模式
- 定期审查权限配置
- 追踪权限变更历史

## 总结

MolanDev Backend 的网关认证与权限转发提供了：

- 统一的认证入口
- 权限码按需转发，网关不执行权限校验
- 灵活的白名单机制
- 自动 Token 续期
- Per-route 权限前缀过滤
- 单体/微服务双模支持
