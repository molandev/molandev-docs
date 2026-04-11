# 核心概念

MolanDev Backend 基于一些核心设计理念构建，理解这些概念有助于更好地使用和扩展系统。

## 双模部署

### 什么是双模部署

**双模部署**是 MolanDev Backend 的核心创新，指同一套代码可以以**单体模式**或**微服务模式**部署运行。

```
同一套代码
    ↓
┌───────────────┬───────────────┐
│   单体模式     │   微服务模式    │
│  (开发/小规模) │  (生产/大规模)  │
└───────────────┴───────────────┘
```

### 为什么需要双模部署

**传统困境：**
- 微服务：架构复杂，初期成本高
- 单体：简单快速，但扩展困难

**双模部署优势：**
- ✅ **初期快速开发**：单体模式，极简部署
- ✅ **后期平滑演进**：切换到微服务，无需重构
- ✅ **灵活切换**：根据业务规模自由选择
- ✅ **降低风险**：避免过度设计

### 实现原理

#### 1. 接口即服务

**核心思想：** 所有服务间调用都通过 Feign 接口。

```java
// 定义 Feign 接口
@FeignClient(name = "${molandev.service-name.molandev-base:molandev-base}", path = "/feign/user")
public interface SysUserApi {
    
    @GetMapping("/{id}")
    UserDto getById(@PathVariable String id);
}

// 业务代码调用（单体/微服务完全一致）
@Service
public class OrderService {
    
    @Autowired
    private SysUserApi userApi;  // 注入接口
    
    public void createOrder(OrderDTO order) {
        // 获取用户信息
        UserDto user = userApi.getById(order.getUserId());
        // 业务逻辑...
    }
}
```

**单体模式：** Feign 接口通过 `molandev-rpc` 框架自动转为本地调用
**微服务模式：** Feign 接口通过 HTTP 远程调用

#### 2. 配置隔离

通过配置文件控制部署模式。

**单体模式配置：**
```yaml
# application.yml
molandev:
  run-mode: single    # 单体模式
  lock:
    type: memory      # 使用内存锁
  security:
    mode: LOCAL       # 本地认证模式

spring:
  cloud:
    nacos:
      discovery:
        enabled: false  # 不需要注册中心
```

**微服务模式配置：**
```yaml
# application.yml
molandev:
  run-mode: cloud    # 微服务模式
  security:
    mode: CLOUD      # 云端认证模式

spring:
  application:
    name: molandev-base
  cloud:
    nacos:
      discovery:
        enabled: true
        server-addr: localhost:8848
```

#### 3. 单体合并

单体模式通过 `molandev-standalone-service` 模块启动，合并 base 和 ai 模块。

```xml
<!-- molandev-standalone-service/pom.xml -->
<dependencies>
    <!-- 引入基础服务，排除微服务依赖 -->
    <dependency>
        <groupId>com.molandev</groupId>
        <artifactId>molandev-base</artifactId>
        <exclusions>
            <exclusion>
                <groupId>com.alibaba.cloud</groupId>
                <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
            </exclusion>
            <exclusion>
                <groupId>com.alibaba.cloud</groupId>
                <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
            </exclusion>
        </exclusions>
    </dependency>
    <!-- 引入 AI 服务 -->
    <dependency>
        <groupId>com.molandev</groupId>
        <artifactId>molandev-ai</artifactId>
    </dependency>
</dependencies>
```

### 架构对比

**单体模式架构：**

```
┌─────────────────────────────────┐
│   molandev-standalone-service  │
│  ┌───────┬───────────────────┐  │
│  │ base  │        ai         │  │
│  │(系统/文件/消息/任务) │(知识库)│
│  └───────┴───────────────────┘  │
│         ↓                       │
│    ┌──────────┐                │
│    │  数据库   │                │
│    └──────────┘                │
└─────────────────────────────────┘
```

**微服务模式架构：**

```
             ┌──────────┐
             │ Gateway  │
             └─────┬────┘
       ┌───────────┼───────────┐
       ↓           ↓           ↓
  ┌─────────┐ ┌─────────┐
  │  base   │ │    ai   │
  └────┬────┘ └────┬────┘
       │           │
       └───────────┼───────────┘
                   ↓
              ┌──────────┐
              │   Nacos  │
              └──────────┘
```

## 接口即服务

### 设计理念

**传统方式：**
```java
// 直接调用 Service（强耦合）
@Service
public class OrderService {
    @Autowired
    private UserService userService;  // 直接依赖实现类
}
```

**接口即服务：**
```java
// 通过接口调用（解耦）
@Service
public class OrderService {
    @Autowired
    private SysUserClient userClient;  // 依赖接口
}
```

### 优势

- ✅ **解耦合**：服务间通过接口通信
- ✅ **可测试**：易于 Mock 和单元测试
- ✅ **可扩展**：新增服务无需修改现有代码
- ✅ **双模支持**：同一接口适配单体和微服务

### 实现细节

#### Feign 配置

```java
// 单体模式：本地调用配置
@Configuration
@ConditionalOnProperty(
    name = "spring.cloud.nacos.discovery.enabled", 
    havingValue = "false"
)
public class LocalFeignConfig {
    
    @Bean
    public Contract feignContract() {
        // 使用 SpringMVC 注解
        return new SpringMvcContract();
    }
    
    @Bean
    public Client feignClient() {
        // 本地调用客户端
        return new LocalClient();
    }
}

// 微服务模式：远程调用配置
@Configuration
@ConditionalOnProperty(
    name = "spring.cloud.nacos.discovery.enabled", 
    havingValue = "true"
)
public class RemoteFeignConfig {
    
    @Bean
    public Client feignClient() {
        // HTTP 客户端
        return new OkHttpClient();
    }
}
```

## 事件驱动

### 设计理念

使用事件总线实现服务间的松耦合通信，由 `molandev-event` 框架提供支持。

**传统同步调用：**
```java
// 用户注册后，同步发送欢迎邮件
public void register(UserDTO user) {
    userService.save(user);
    emailService.sendWelcomeEmail(user.getEmail());  // 强依赖
}
```

**事件驱动：**
```java
// 用户注册后，发布事件
public void register(UserDTO user) {
    userService.save(user);
    // 发布用户注册事件
    EventUtil.publish(new UserRegisteredEvent(user));
}

// 邮件服务监听事件
@MolanListener
public void onUserRegistered(UserRegisteredEvent event) {
    emailService.sendWelcomeEmail(event.getUser().getEmail());
}
```

### 优势

- ✅ **解耦合**：发布者和订阅者互不依赖
- ✅ **异步处理**：提升响应速度
- ✅ **易扩展**：新增订阅者无需修改发布者
- ✅ **可靠性**：支持事件持久化和重试

### 实现方式

#### 本地事件总线

**单体模式**使用本地事件总线（基于 Spring Event），由 `molandev-event` 框架自动适配。

```java
// 发布事件
@Service
public class UserService {
    
    public void register(UserDTO user) {
        // 保存用户
        save(user);
        
        // 发布事件（使用框架提供的 EventUtil）
        EventUtil.publish(new UserRegisteredEvent(user));
    }
}

// 监听事件
@Component
public class EmailEventListener {
    
    @MolanListener
    @Async
    public void handleUserRegistered(UserRegisteredEvent event) {
        UserDTO user = event.getUser();
        sendWelcomeEmail(user.getEmail());
    }
}
```

#### 分布式事件总线

**微服务模式**使用 MQ（RabbitMQ）实现分布式事件，由 `molandev-event` 框架自动切换。

**配置切换：**

```yaml
# 单体模式
molandev:
  run-mode: single
  # 事件自动使用本地内存分发

# 微服务模式
molandev:
  run-mode: cloud
  # 事件自动切换为 RabbitMQ
```

### 事件设计规范

**事件命名：**
- 过去式：`UserRegisteredEvent`（用户已注册）
- 语义明确：表达已发生的事实

**事件结构：**
```java
@Data
public class UserRegisteredEvent implements Serializable {
    
    private Long userId;
    private String username;
    private String email;
    private LocalDateTime registeredTime;
    
    // 事件元数据
    private String eventId;      // 事件ID
    private String eventType;    // 事件类型
    private LocalDateTime occurTime;  // 发生时间
}
```

## 网关权限校验

### 设计理念

在网关层统一校验用户权限，避免在每个服务中重复实现权限逻辑。

### 权限校验流程

```
用户请求
  ↓
网关（Token 验证）
  ↓
获取后端服务的权限映射
  ↓
匹配请求路径对应的权限码
  ↓
从 Redis 获取用户权限列表
  ↓
校验是否包含所需权限
  ↓
通过 / 拒绝
```

### 实现方式

#### 1. 权限映射获取

网关启动时，从各个后端服务获取路径与权限码的映射关系。

```java
// PermissionCheckGatewayFilter.java
public class PermissionCheckGatewayFilter implements GatewayFilter {
    
    static final String PERMISSION_ENDPOINT = "/_permission/mapping";
    
    // 缓存请求路径与权限码的对应关系
    volatile Mono<List<PermissionPathMapping>> permissionMaps = null;
    
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, 
                            GatewayFilterChain chain) {
        // 初始化权限映射
        if (permissionMaps == null) {
            synchronized (this) {
                if (permissionMaps == null) {
                    permissionMaps = webClientBuilder.build()
                        .get()
                        .uri(realUri + PERMISSION_ENDPOINT)
                        .retrieve()
                        .bodyToMono(String.class)
                        .flatMap(body -> {
                            JsonResult<List<PermissionPathMapping>> result = 
                                JSONUtils.toObject(body, ...);
                            return Mono.just(result.getData());
                        })
                        .cache();
                }
            }
        }
        
        return permissionMaps.flatMap(pms -> 
            checkPermissionCode(exchange, chain, pms)
        );
    }
}
```

#### 2. 路径匹配

根据请求路径和 HTTP 方法，匹配最佳的权限规则。

```java
private PermissionPathMapping findBestMatchMapping(
    ServerWebExchange exchange, 
    List<PermissionPathMapping> mappings) {
    
    AntPathMatcher pathMatcher = new AntPathMatcher();
    ServerHttpRequest request = exchange.getRequest();
    String path = request.getURI().getPath();
    String httpMethod = request.getMethod().name();
    
    Map<String, PermissionPathMapping> matchedPaths = new HashMap<>();
    
    for (PermissionPathMapping mapping : mappings) {
        List<String> pathPatterns = mapping.getPath();
        List<String> methods = mapping.getMethod();
        
        for (String pattern : pathPatterns) {
            if (pathMatcher.match(pattern, path)) {
                // 路径匹配，检查方法是否匹配
                if (methods.contains(httpMethod) || methods.contains("*")) {
                    matchedPaths.put(pattern, mapping);
                }
            }
        }
    }
    
    // 按照路径匹配优先级排序（最具体的排在前面）
    return matchedPaths.keySet().stream()
        .min(Comparator.comparingLong(p -> 
            ((String) p).chars().filter(ch -> ch == '/').count())
            .reversed()
            .thenComparing(p -> ((String) p).contains("*") ? 1 : 0)
        )
        .map(matchedPaths::get)
        .orElse(null);
}
```

#### 3. 权限校验

从 Redis 缓存中获取用户权限，并判断是否包含当前请求的权限码。

```java
private Mono<Void> checkPermissionCode(
    ServerWebExchange exchange, 
    GatewayFilterChain chain, 
    String token, 
    PermissionPathMapping matchedMapping) {
    
    return reactiveRedisTemplate
        .opsForSet()
        .members(AuthConst.AUTH_PERMISSION_CACHE_PREFIX + token)
        .filter(code -> 
            matchedMapping.getPermissionCode().contains(code)
        )
        .distinct()
        .count()
        .flatMap(count -> {
            if (count > 0) {
                log.debug("用户权限匹配成功");
                return chain.filter(exchange);
            } else {
                return ResponseUtils.writeJson(
                    exchange, 
                    JSONUtils.toJsonString(JsonResult.noPermission())
                );
            }
        });
}
```

### 权限缓存

**Redis Key 结构：**

```
auth:permission:{token}  -> Set<String>  // 用户权限集合
```

**例子：**

```
auth:permission:abc123 -> {
  "system:user:query",
  "system:user:add",
  "system:role:query",
  "system:menu:query"
}
```

### 权限刷新

当后端服务重启或接口变更时，需要刷新权限映射。

```java
public void clearPermissionMap() {
    synchronized (this) {
        if (this.permissionMaps != null) {
            log.info("刷新PermissionMapping，对应uri:" + this.uri);
            this.permissionMaps = null;
        }
    }
}
```

## 统一响应

### 设计理念

所有接口返回统一的响应格式，便于前端处理。

### 响应结构

```java
@Data
public class JsonResult<T> implements Serializable {
    
    /**
     * 状态码
     */
    private String code;
    
    /**
     * 消息
     */
    private String msg;
    
    /**
     * 数据
     */
    private T data;
}
```

### 使用方式

```java
// 成功响应
return JsonResult.success();
return JsonResult.success(data);

// 失败响应
return JsonResult.failed("操作失败");
return JsonResult.invalid("参数不合法");

// 分页响应
Page<SysUserEntity> page = userService.page(query);
return JsonResult.success(DbQueryUtils.pageResult(page));
```

## 全局异常处理

### 异常分类

- **业务异常**：`BusinessException`
- **参数异常**：参数校验失败

### 异常处理

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    /**
     * 业务异常
     */
    @ExceptionHandler(BusinessException.class)
    public JsonResult<?> handleBusinessException(BusinessException e) {
        log.warn("业务异常: {}", e.getMessage());
        return JsonResult.failed(e.getMessage());
    }
    
    /**
     * 参数校验异常
     */
    @ExceptionHandler(BindException.class)
    public JsonResult<?> handleBindException(BindException e) {
        String message = e.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(FieldError::getDefaultMessage)
            .collect(Collectors.joining(", "));
        return JsonResult.invalid("参数校验失败: " + message);
    }
    
    /**
     * 系统异常
     */
    @ExceptionHandler(Exception.class)
    public JsonResult<?> handleException(Exception e) {
        log.error("系统异常", e);
        return JsonResult.failed("系统异常，请联系管理员");
    }
}
```

## 总结

MolanDev Backend 的核心概念：

- ✅ **双模部署**：单体/微服务自由切换，通过 `molandev.run-mode` 配置
- ✅ **接口即服务**：Feign 接口自动适配本地/远程调用
- ✅ **事件驱动**：松耦合的服务通信，自动适配内存/MQ
- ✅ **统一响应**：`JsonResult<T>` 标准格式
- ✅ **异常处理**：优雅的错误处理

::: tip 框架支持
双模切换、事件驱动、多数据源等核心能力由 `molandev-framework` 提供，业务代码无需感知底层实现差异。
:::
