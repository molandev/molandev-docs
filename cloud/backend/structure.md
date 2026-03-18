# 项目结构

MolanDev Cloud 采用 Maven 多模块结构，清晰的模块划分便于开发和维护。

## 整体结构

```
molandev-cloud/
├── cloud-backend/                     # 后端代码
│   ├── basic-apis/          # API 接口定义
│   │   ├── base-api/                  # 基础 API
│   │   ├── sys-api/                   # 系统服务 API
│   │   ├── file-api/                  # 文件服务 API
│   │   ├── msg-api/                   # 消息服务 API
│   │   └── task-api/                  # 任务服务 API
│   ├── basic-apps/          # 应用服务
│   │   ├── gateway-service/           # 网关服务
│   │   ├── sys-service/               # 系统服务
│   │   ├── file-service/              # 文件服务
│   │   ├── msg-service/               # 消息服务
│   │   └── task-service/              # 任务服务
│   ├── cloud-common/                  # 公共模块
│   ├── codegen-util/                  # 代码生成器
│   └── merge-service/                 # 单体合并模块
├── cloud-frontend/                    # 前端代码
├── cloud-deploy/                      # 部署配置
│   ├── configs/                       # 配置文件
│   └── middleware/                    # 中间件配置
└── docs/                              # 文档
```

## 后端模块详解

### 1. API 模块 (basic-apis)

**职责：** 定义服务间调用的 Feign 接口和 DTO。

**特点：**
- ✅ 接口定义与实现分离
- ✅ 支持单体和微服务模式
- ✅ 统一的 API 规范

**目录结构：**

```
base-api/
└── src/main/java/com/molandev/cloud/api/base/
    └── ... (基础 API 定义)
```

**sys-api 示例：**

```
sys-api/
├── src/main/java/com/molandev/cloud/api/sys/
│   ├── client/                      # Feign 客户端
│   │   ├── SysUserClient.java      # 用户服务接口
│   │   ├── SysRoleClient.java      # 角色服务接口
│   │   └── SysMenuClient.java      # 菜单服务接口
│   ├── dto/                         # 数据传输对象
│   │   ├── request/                # 请求 DTO
│   │   └── response/               # 响应 DTO
│   └── fallback/                    # 降级处理
│       └── SysUserClientFallback.java
└── pom.xml
```

**示例代码：**

```java
// Feign 接口定义
@FeignClient(
    name = "system-service",
    path = "/system/user",
    fallback = SysUserClientFallback.class
)
public interface SysUserClient {
    
    @GetMapping("/list")
    R<Page<SysUserDTO>> list(@RequestParam SysUserQuery query);
    
    @GetMapping("/{id}")
    R<SysUserDTO> getById(@PathVariable Long id);
    
    @PostMapping
    R<Void> save(@RequestBody SysUserDTO user);
    
    @PutMapping
    R<Void> update(@RequestBody SysUserDTO user);
    
    @DeleteMapping("/{id}")
    R<Void> delete(@PathVariable Long id);
}
```

### 2. 应用服务 (basic-apps)

**职责：** 具体的业务服务实现。

#### 2.1 网关服务 (gateway-service)

**职责：** 统一入口、路由转发、认证鉴权。

**技术栈：**
- Spring Cloud Gateway
- Spring Security
- Redis

**目录结构：**

```
gateway-service/
├── src/main/java/com/molandev/cloud/gateway/
│   ├── config/                      # 配置类
│   │   ├── SecurityConfig.java     # 安全配置
│   │   └── GatewayConfig.java      # 网关配置
│   ├── filter/                      # 过滤器
│   │   ├── AuthFilter.java         # 认证过滤器
│   │   └── LogFilter.java          # 日志过滤器
│   ├── handler/                     # 处理器
│   │   ├── AuthHandler.java        # 认证处理
│   │   └── ExceptionHandler.java   # 异常处理
│   └── GatewayApplication.java     # 启动类
└── src/main/resources/
    └── application.yml
```

**核心功能：**

```java
// 认证过滤器
@Component
public class AuthFilter implements GlobalFilter, Ordered {
    
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, 
                            GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        
        // 白名单检查
        if (isWhiteList(request.getPath().value())) {
            return chain.filter(exchange);
        }
        
        // Token 验证
        String token = getToken(request);
        if (StringUtils.isEmpty(token)) {
            return unauthorized(exchange);
        }
        
        // 验证 Token 并获取用户信息
        try {
            Claims claims = JwtUtils.parseToken(token);
            String userId = claims.getSubject();
            
            // 将用户信息放入请求头
            ServerHttpRequest newRequest = request.mutate()
                .header("X-User-Id", userId)
                .build();
            
            return chain.filter(exchange.mutate()
                .request(newRequest).build());
        } catch (Exception e) {
            return unauthorized(exchange);
        }
    }
    
    @Override
    public int getOrder() {
        return -100;
    }
}
```

#### 2.2 系统服务 (sys-service)

**职责：** 系统管理相关功能（用户、角色、菜单、部门等）。

**目录结构：**

```
sys-service/
├── src/main/java/com/molandev/cloud/system/
│   ├── controller/                  # 控制器
│   │   ├── SysUserController.java
│   │   ├── SysRoleController.java
│   │   └── SysMenuController.java
│   ├── service/                     # 服务层
│   │   ├── ISysUserService.java
│   │   └── impl/
│   │       └── SysUserServiceImpl.java
│   ├── mapper/                      # 数据访问层
│   │   └── SysUserMapper.java
│   ├── domain/                      # 实体类
│   │   └── SysUser.java
│   └── SystemApplication.java       # 启动类
└── src/main/resources/
    ├── mapper/                      # MyBatis XML
    │   └── SysUserMapper.xml
    └── application.yml
```

**分层架构：**

```
Controller (控制器) 
    ↓
Service (业务逻辑)
    ↓
Mapper (数据访问)
    ↓
Database (数据库)
```

**示例代码：**

```java
// Controller
@RestController
@RequestMapping("/system/user")
public class SysUserController {
    
    @Autowired
    private ISysUserService userService;
    
    @GetMapping("/list")
    public R<Page<SysUserVO>> list(SysUserQuery query) {
        Page<SysUserVO> page = userService.list(query);
        return R.ok(page);
    }
    
    @PostMapping
    public R<Void> save(@RequestBody @Validated SysUserDTO dto) {
        userService.save(dto);
        return R.ok();
    }
}

// Service
@Service
public class SysUserServiceImpl implements ISysUserService {
    
    @Autowired
    private SysUserMapper userMapper;
    
    @Override
    public Page<SysUserVO> list(SysUserQuery query) {
        Page<SysUser> page = userMapper.selectPage(
            new Page<>(query.getPageNum(), query.getPageSize()),
            new LambdaQueryWrapper<SysUser>()
                .like(StringUtils.hasText(query.getUsername()), 
                    SysUser::getUsername, query.getUsername())
        );
        return page.convert(this::toVO);
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void save(SysUserDTO dto) {
        SysUser user = toEntity(dto);
        userMapper.insert(user);
        // 保存用户角色关联
        saveUserRoles(user.getId(), dto.getRoleIds());
    }
}

// Mapper
@Mapper
public interface SysUserMapper extends BaseMapper<SysUser> {
    
    /**
     * 根据用户名查询用户
     */
    SysUser selectByUsername(@Param("username") String username);
    
    /**
     * 查询用户列表（包含角色信息）
     */
    List<SysUserVO> selectUserList(@Param("query") SysUserQuery query);
}
```

#### 2.3 文件服务 (file-service)

**职责：** 文件上传、下载、存储管理。

**支持的存储方式：**
- 本地存储
- 阿里云 OSS
- 七牛云
- MinIO

**目录结构：**

```
file-service/
├── src/main/java/com/molandev/cloud/file/
│   ├── controller/
│   │   └── FileController.java
│   ├── service/
│   │   ├── IFileService.java
│   │   └── impl/
│   │       ├── LocalFileServiceImpl.java
│   │       ├── OssFileServiceImpl.java
│   │       └── MinioFileServiceImpl.java
│   ├── strategy/                    # 存储策略
│   │   └── FileStorageStrategy.java
│   └── FileApplication.java
└── src/main/resources/
    └── application.yml
```

#### 2.4 消息服务 (msg-service)

**职责：** 站内消息、邮件、短信通知。

**功能：**
- 站内消息管理
- 邮件发送
- 短信发送
- 消息模板管理

#### 2.5 任务服务 (task-service)

**职责：** 定时任务调度和执行。

**技术方案：**
- 基于 DelayQueue 实现
- 支持 Cron 表达式
- 支持 HTTP 回调

### 3. 公共模块 (cloud-common)

**职责：** 公共工具类、基础配置、统一响应等。

**目录结构：**

```
cloud-common/
├── src/main/java/com/molandev/cloud/common/
│   ├── annotation/                  # 自定义注解
│   │   ├── Log.java                # 日志注解
│   │   └── DataScope.java          # 数据权限注解
│   ├── config/                      # 配置类
│   │   ├── MybatisPlusConfig.java  # MyBatis Plus 配置
│   │   ├── RedisConfig.java        # Redis 配置
│   │   └── WebMvcConfig.java       # Web 配置
│   ├── constant/                    # 常量定义
│   │   └── CommonConstant.java
│   ├── core/                        # 核心类
│   │   ├── R.java                  # 统一响应
│   │   └── PageQuery.java          # 分页查询
│   ├── enums/                       # 枚举类
│   │   └── StatusEnum.java
│   ├── exception/                   # 异常定义
│   │   ├── BusinessException.java
│   │   └── GlobalExceptionHandler.java
│   └── utils/                       # 工具类
│       ├── ServletUtils.java
│       └── SecurityUtils.java
└── src/main/resources/
    └── META-INF/spring.factories    # 自动配置
```

**核心类：**

```java
// 统一响应
@Data
public class R<T> implements Serializable {
    
    private Integer code;
    private String message;
    private T data;
    
    public static <T> R<T> ok() {
        return ok(null);
    }
    
    public static <T> R<T> ok(T data) {
        R<T> r = new R<>();
        r.setCode(200);
        r.setMessage("操作成功");
        r.setData(data);
        return r;
    }
    
    public static <T> R<T> error(String message) {
        R<T> r = new R<>();
        r.setCode(500);
        r.setMessage(message);
        return r;
    }
}

// 全局异常处理
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(BusinessException.class)
    public R<?> handleBusinessException(BusinessException e) {
        return R.error(e.getMessage());
    }
    
    @ExceptionHandler(Exception.class)
    public R<?> handleException(Exception e) {
        log.error("系统异常", e);
        return R.error("系统异常，请联系管理员");
    }
}
```

### 4. 单体合并模块 (merge-service)

**职责：** 将所有服务合并为一个单体应用。

**实现方式：**
- 依赖所有服务模块
- 统一启动类
- 共享数据库连接

**目录结构：**

```
merge-service/
├── src/main/java/com/molandev/cloud/merge/
│   └── MergeApplication.java        # 单体启动类
└── src/main/resources/
    └── application.yml               # 单体配置
```

### 5. 代码生成器 (codegen-util)

**职责：** 快速生成 CRUD 代码。

**生成内容：**
- Entity 实体类
- Mapper 接口和 XML
- Service 接口和实现
- Controller 控制器
- 前端页面（可选）

## 包命名规范

```
com.molandev.cloud.{module}
├── controller      # 控制器
├── service         # 服务接口
│   └── impl       # 服务实现
├── mapper          # 数据访问
├── domain          # 实体类
├── dto             # 数据传输对象
│   ├── request    # 请求 DTO
│   └── response   # 响应 DTO
├── vo              # 视图对象
├── enums           # 枚举
├── constant        # 常量
├── config          # 配置类
└── utils           # 工具类
```

## 依赖关系

```
basic-apps (应用层)
    ↓ 依赖
basic-apis (API 层)
    ↓ 依赖
molandev-cloud-common (公共层)
    ↓ 依赖
molandev-framework (框架层)
```

## 配置文件

### application.yml 结构

```yaml
server:
  port: 8080

spring:
  application:
    name: system-service
  
  # 数据源配置
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/molandev_cloud
    username: root
    password: 123456
  
  # Redis 配置
  redis:
    host: localhost
    port: 6379
  
  # 微服务配置（仅微服务模式）
  cloud:
    nacos:
      discovery:
        server-addr: localhost:8848
      config:
        server-addr: localhost:8848

# MyBatis Plus 配置
mybatis-plus:
  mapper-locations: classpath*:mapper/**/*.xml
  type-aliases-package: com.molandev.cloud.*.domain
  configuration:
    map-underscore-to-camel-case: true
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl

# 日志配置
logging:
  level:
    com.molandev.cloud: debug
```

## 最佳实践

### 1. 模块职责单一

每个模块只负责一个领域的功能，避免职责混乱。

### 2. 依赖管理

- API 模块不依赖具体实现
- 服务模块依赖 API 模块
- 避免循环依赖

### 3. 代码分层

严格遵循分层架构：Controller → Service → Mapper

### 4. 命名规范

- 类名：大驼峰
- 方法名：小驼峰
- 常量：全大写下划线分隔

### 5. 注释规范

- 类注释：说明职责
- 方法注释：说明参数、返回值、异常
- 复杂逻辑：添加行内注释

## 总结

MolanDev Cloud 的项目结构特点：

- ✅ **模块化设计**：清晰的模块划分
- ✅ **分层架构**：Controller-Service-Mapper
- ✅ **双模支持**：单体和微服务
- ✅ **统一规范**：包命名、代码风格
- ✅ **易于扩展**：新增模块简单
- ✅ **便于维护**：职责清晰、解耦合理

这为项目的长期发展奠定了坚实的基础！
