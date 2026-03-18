# 网关权限

MolanDev Cloud 在网关层实现了完整的认证和权限校验机制，提供统一的安全保障。

## 架构设计

### 过滤器链

网关使用两个核心过滤器实现认证授权：

1. **GatewayAuthFilter** - 认证过滤器（Order=1）
   - 验证 Token 有效性
   - 解析用户信息
   - 白名单检查
   - Token 续期

2. **PermissionCheckGatewayFilter** - 权限过滤器（Order=后）
   - 路径与权限映射
   - 用户权限校验
   - 权限码匹配

### 处理流程

```
请求进入
  ↓
GatewayAuthFilter（认证）
  ↓ Token验证
  ↓ 白名单检查
  ↓ 用户信息解析
  ↓ 自动续期
  ↓
PermissionCheckGatewayFilter（授权）
  ↓ 获取权限映射
  ↓ 路径匹配
  ↓ 权限校验
  ↓
后端服务
```

## 认证过滤器

### 核心功能

**GatewayAuthFilter** 负责验证用户身份。

**处理逻辑：**

1. **Swagger 绕过**
   ```java
   if (swaggerEnabled && originHeaders.contains("Knife4j")) {
       return chain.filter(exchange);
   }
   ```

2. **白名单检查**
   ```java
   if (checkWhite(path)) {
       return chain.filter(exchange);
   }
   ```

3. **Token 提取**
   ```java
   List<String> authHeaders = headers.get(AuthConst.HEADER_AUTHORIZATION);
   String token = authHeaders.get(0);
   ```

4. **Token 验证**
   - 从 Redis 获取 Token 信息
   - 检查 Token 是否存在
   - 检查是否被踢出（`kickout=1`）
   - 检查是否为临时 Token（`temp=1`）

5. **自动续期**
   ```java
   if (expireIn < effectiveSeconds / 2) {
       reactiveRedisTemplate.expire(token, effectiveSeconds);
   }
   ```

6. **用户信息传递**
   ```java
   String encodeUser = URLEncoder.encode(userJson, UTF-8);
   newRequest.header(AuthConst.HEADER_USER_INFO, encodeUser);
   ```

### 白名单配置

**配置文件：** `application.yml`

```yaml
auth:
  white-uris:
    - /sys/login          # 登录接口
    - /sys/captcha        # 验证码
    - /sys/logout         # 登出接口
    - /doc.html           # API文档
    - /swagger-ui/**      # Swagger UI
    - /v3/api-docs/**     # OpenAPI文档
```

**匹配规则：**
- 使用 `AntPathMatcher` 进行路径匹配
- 支持通配符：`*` 和 `**`
- `/sys/user/*` - 匹配一级路径
- `/sys/user/**` - 匹配所有子路径

### 临时 Token 限制

临时 Token 只能访问特定接口：

**配置：**
```yaml
auth:
  temp-uris:
    - /sys/personal/updatePassword    # 修改密码
    - /sys/personal/info              # 个人信息
```

**检查逻辑：**
```java
if (userSessionObj.getTemp() == 1) {
    if (!checkTempUri(path)) {
        return ResponseUtils.writeJson(JsonResult.notLogin());
    }
}
```

## 权限过滤器

### 核心功能

**PermissionCheckGatewayFilter** 负责校验用户权限。

**处理逻辑：**

1. **获取权限映射**
   ```java
   permissionMaps = webClientBuilder.build()
       .get()
       .uri(serviceUri + "/_permission/mapping")
       .retrieve()
       .bodyToMono(String.class);
   ```

2. **路径匹配**
   - 提取请求路径：`/sys/user/add`
   - 提取请求方法：`POST`
   - 使用 AntPathMatcher 匹配路径模式
   - 匹配 HTTP 方法

3. **权限校验**
   ```java
   reactiveRedisTemplate.opsForSet()
       .members(AuthConst.AUTH_PERMISSION_CACHE_PREFIX + token)
       .filter(code -> permissionCode.contains(code))
       .count();
   ```

4. **结果判断**
   - `count > 0` - 有权限，放行
   - `count = 0` - 无权限，返回 403

### 权限映射

后端微服务启动时自动扫描 `@HasPermission` 注解，构建权限映射关系。

**扫描机制：**
1. `PermissionMetadataCollector` 扫描 RequestMappingHandlerMapping
2. 提取所有标注了 `@HasPermission` 的方法
3. 收集路径、HTTP 方法、权限码的对应关系
4. 缓存到内存

**暴露接口：** `GET /_permission/mapping`

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
```

**实现类：**
- `PermissionMetadataCollector` - 扫描 `@HasPermission` 注解
- `PermissionMappingEndpoint` - 暴露 `/_permission/mapping` 接口

**网关使用：**
- `PermissionCheckGatewayFilter` 初始化时调用此接口
- 缓存权限映射关系
- 用于匹配请求路径与权限码

### 路径匹配优先级

当多个路径模式都匹配时，选择最具体的：

**优先级规则：**
1. `/` 分隔符越多，优先级越高
2. 不含通配符的优先于含通配符的

**示例：**
```
/sys/user/add           # 优先级最高
/sys/user/*             # 优先级中
/sys/**                 # 优先级最低
```

**实现：**
```java
matchedPaths.keySet().stream()
    .min(Comparator.comparingLong(p -> p.chars().filter(ch -> ch == '/').count())
        .reversed()
        .thenComparing(p -> p.contains("*") ? 1 : 0))
    .map(matchedPaths::get)
    .orElse(null);
```

### 权限缓存

**缓存结构：**
- Key：`auth:permission:{token}`
- Type：Set
- Value：权限码列表
- TTL：与 Token 一致

**缓存时机：**
- 用户登录成功后
- Token 续期时同步续期

### 权限刷新

当微服务重启或权限配置变更时，网关会自动刷新权限映射。

**自动刷新机制：**

1. **微服务上线监听**
   - `ServiceChangeListener4Permission` 监听 Nacos 服务上线事件
   - 服务上线时自动调用 `clearPermissionMap()`
   - 下次请求时重新调用 `/_permission/mapping`

2. **配置触发刷新**
   - 在 Nacos 路由配置中设置 `PermissionCheck` 过滤器
   - `key: Always` - 启用自动监听服务上线
   - 修改 `key` 的值 - 手动触发刷新

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

**刷新逻辑：**
```java
public void clearPermissionMap() {
    this.permissionMaps = null;
    // 下次请求时重新加载
}
```

**刷新场景：**
- 微服务重启后新增/修改了 `@HasPermission` 注解
- 服务扩容、缩容后
- 手动触发刷新

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
用户刷新页面时，前端会重新请求权限接口，后端会重新查询数据库并更新 Redis 缓存，从而实现权限刷新，无需重新登录。
:::

## 请求头传递

网关将用户信息通过请求头传递给后端服务：

**传递内容：**
```java
ServerHttpRequest newRequest = request.mutate()
    .header(AuthConst.HEADER_AUTHORIZATION, token)
    .header(AuthConst.HEADER_USER_INFO, encodeUser)
    .build();
```

**请求头：**
- `Authorization` - Token
- `User-Info` - URL 编码的用户信息 JSON

**后端获取：**
```java
ContextUser user = AuthUtils.getContextUser();
```

## 单体模式支持

单体模式使用 `LocalAuthFilter` 实现相同功能。

**差异：**
- 使用 Servlet Filter 而非 Gateway Filter
- 同步代码而非响应式
- 直接从 Redisson 获取数据

**核心逻辑：**
```java
@Override
protected void doFilterInternal(HttpServletRequest request, 
                                HttpServletResponse response, 
                                FilterChain filterChain) {
    String token = extractToken(request);
    UserSessionObj sessionObj = getUserFromRedis(token);
    
    if (checkWhite(path) || sessionObj != null) {
        AuthUtils.setContextUser(sessionObj.getContextUser());
        filterChain.doFilter(request, response);
    } else {
        ResponseUtils.responseJson(response, JsonResult.notLogin());
    }
}
```

## 特殊处理

### 1. WebSocket 支持

WebSocket 连接的特殊处理：

```java
if (isWebSocket) {
    exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
    return exchange.getResponse().setComplete();
}
```

- 不返回 JSON，直接设置 401 状态码
- 避免 WebSocket 连接收到非协议消息

### 2. WebService 绕过

SOAP WebService 请求绕过认证：

```java
if (request.getURI().getPath().contains("webservice")) {
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
    enabled: true  # 开发环境设置为true
```

**生产环境必须关闭！**

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

### 3. 权限校验

- 前端权限控制仅用于 UI
- 后端必须进行实际校验
- 关键操作增加二次验证
- 权限变更及时刷新

### 4. 监控审计

- 记录所有认证失败
- 监控异常访问模式
- 定期审查权限配置
- 追踪权限变更历史

## 总结

MolanDev Cloud 的网关权限提供了：

- ✅ 统一的认证入口
- ✅ 两层权限校验
- ✅ 灵活的白名单机制
- ✅ 自动 Token 续期
- ✅ 路径权限映射
- ✅ 权限动态刷新
- ✅ 单体/微服务双模支持
