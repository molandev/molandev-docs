# 项目结构

MolanDev Backend 采用 Maven 多模块结构，清晰的模块划分便于开发和维护。

## 整体结构

```
molandev-backend/
├── molandev-apis/                     # API 接口定义（Feign 接口）
├── molandev-common/                   # 公共模块
├── molandev-base/                     # 基础服务（用户/角色/菜单/部门/文件/消息/任务）
├── molandev-ai/                       # AI 服务（知识库管理）
├── molandev-gateway/                  # 微服务网关
├── molandev-standalone-service/       # 单体模式启动入口
└── deploy/                            # 部署配置
    ├── compose/                       # Docker Compose 配置
    ├── configs/                       # 配置文件
    └── sql/                           # 数据库脚本
```

::: tip 设计理念
服务拆分不再按功能垂直划分，而是按业务域聚合。`molandev-base` 整合了系统管理、文件、消息、任务等基础能力，`molandev-ai` 专注于 AI 相关业务。单体模式通过 `molandev-standalone-service` 启动，微服务模式通过 `molandev-gateway` + 各服务独立部署。
:::

## 后端模块详解

### 1. API 模块 (molandev-apis)

**职责：** 定义服务间调用的 Feign 接口和 DTO。

**特点：**
- ✅ 接口定义与实现分离
- ✅ 支持单体和微服务双模
- ✅ 统一的 API 规范

**目录结构：**

```
molandev-apis/
└── src/main/java/com/molandev/api/
    ├── sys/                        # 系统相关 API
    │   └── user/
    │       └── SysUserApi.java     # 用户服务接口
    ├── msg/                        # 消息相关 API
    │   └── MsgSendApi.java         # 消息发送接口
    └── dto/                        # 数据传输对象
        └── UserDto.java
```

**示例代码：**

```java
// Feign 接口定义
@FeignClient(
    name = "${molandev.service.base:molandev-base}", 
    contextId = "sysUserApi", 
    path = "/feign/user"
)
public interface SysUserApi {

    @GetMapping("/admin")
    UserDto getAdmin(@RequestParam("id") String id);
}
```

::: tip 接口即服务
通过 `molandev-rpc` 框架，Feign 接口在单体模式下自动转为本地调用，微服务模式下为远程 HTTP 调用，业务代码无需感知差异。
:::

### 2. 应用服务模块

#### 2.1 基础服务 (molandev-base)

**职责：** 基础业务服务，整合了系统管理、文件、消息、任务等功能。

**包含功能：**
- 用户管理、角色管理、菜单管理、部门管理
- 文件上传下载、回收站机制
- 消息发送、站内信、WebSocket 推送
- 定时任务调度

**目录结构：**

```
molandev-base/
├── src/main/java/com/molandev/base/
│   ├── sys/                      # 系统管理
│   │   ├── controller/
│   │   │   ├── SysUserController.java
│   │   │   ├── SysRoleController.java
│   │   │   └── SysMenuController.java
│   │   ├── service/
│   │   └── mapper/
│   ├── file/                     # 文件管理
│   │   ├── controller/
│   │   └── service/
│   ├── msg/                      # 消息管理
│   │   ├── controller/
│   │   └── service/
│   ├── task/                     # 定时任务
│   │   ├── controller/
│   │   └── service/
│   └── BaseApp.java              # 启动类（微服务模式）
└── src/main/resources/
    └── application.yml
```

**启动类：**

```java
@SpringBootApplication
public class BaseApp {
    public static void main(String[] args) {
        SpringApplication.run(BaseApp.class, args);
    }
}
```

::: tip 服务整合
`molandev-base` 整合了原 `sys-service`、`file-service`、`msg-service`、`task-service` 的所有功能，减少服务间通信开销，简化部署和运维。
:::

#### 2.2 AI 服务 (molandev-ai)

**职责：** AI 相关业务，包括知识库管理、AI 对话等。

**目录结构：**

```
molandev-ai/
├── src/main/java/com/molandev/ai/
│   ├── library/                   # 知识库管理
│   │   ├── controller/
│   │   └── service/
│   └── AiApp.java                 # 启动类
└── src/main/resources/
    └── application.yml
```

#### 2.3 网关服务 (molandev-gateway)

**职责：** 微服务模式的统一入口、路由转发、认证鉴权。

**技术栈：**
- Spring Cloud Gateway (WebFlux)
- Redis Reactive
- Knife4j Gateway

**目录结构：**

```
molandev-gateway/
├── src/main/java/com/molandev/gateway/
│   ├── config/                    # 配置类
│   │   └── GatewayConfig.java
│   ├── filter/                    # 过滤器
│   │   ├── GatewayAuthFilter.java
│   │   └── PermissionCheckGatewayFilter.java
│   └── GatewayApp.java            # 启动类
└── src/main/resources/
    └── application.yml
```

**核心功能：**

```java
// 认证过滤器
@Component
public class GatewayAuthFilter implements GlobalFilter, Ordered {
    
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
            // ... Token 验证逻辑
            return chain.filter(exchange);
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

#### 2.4 单体模式入口 (molandev-standalone-service)

**职责：** 单体模式的启动入口，合并 base 和 ai 模块。

**实现方式：**
- 通过 `@ComponentScan` 合并扫描多个模块
- 排除微服务相关依赖（Nacos、Feign、RabbitMQ）
- 共享数据库连接

**启动类：**

```java
@Slf4j
@SpringBootApplication
@ComponentScan({
    "com.molandev.base",
    "com.molandev.ai"
})
public class StandaloneApp {

    public static void main(String[] args) {
        SpringApplication.run(StandaloneApp.class, args);
    }
}
```

**pom.xml 配置：**

```xml
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
            <exclusion>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-starter-openfeign</artifactId>
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

**配置示例：**

```yaml
# application-local.yml
molandev:
  run-mode: single          # 单体模式
  lock:
    type: memory            # 使用内存锁
  datasource:
    sys:                     # 系统数据源
      url: jdbc:mysql://localhost:3306/molandev_base
      username: root
      password: 123456
    ai:                      # AI 数据源
      url: jdbc:mysql://localhost:3306/molandev_ai
      username: root
      password: 123456
  security:
    mode: LOCAL             # 本地认证模式
```

### 3. 公共模块 (molandev-common)

**职责：** 公共工具类、基础配置、统一响应等。

**目录结构：**

```
molandev-common/
├── src/main/java/com/molandev/common/
│   ├── annotation/                # 自定义注解
│   │   ├── HasPermission.java    # 权限注解
│   │   └── OpLog.java            # 操作日志注解
│   ├── config/                    # 配置类
│   │   ├── MybatisPlusConfig.java
│   │   └── RedisConfig.java
│   ├── constant/                  # 常量定义
│   ├── core/                      # 核心类
│   │   ├── JsonResult.java       # 统一响应
│   │   └── PageQuery.java        # 分页查询
│   ├── enums/                     # 枚举类
│   ├── exception/                 # 异常定义
│   │   ├── BusinessException.java
│   │   └── GlobalExceptionHandler.java
│   └── utils/                     # 工具类
└── src/main/resources/
    └── application-common.yml     # 公共配置
```

**核心类：**

```java
// 统一响应
@Data
public class JsonResult<T> implements Serializable {
    
    private String code;    // 状态码
    private String msg;     // 消息
    private T data;         // 数据
    
    public static <T> JsonResult<T> success() {
        return success(null);
    }
    
    public static <T> JsonResult<T> success(T data) {
        JsonResult<T> r = new JsonResult<>();
        r.setCode("0000");
        r.setData(data);
        return r;
    }
    
    public static <T> JsonResult<T> failed(String message) {
        JsonResult<T> r = new JsonResult<>();
        r.setCode("1000");
        r.setMsg(message);
        return r;
    }
}
```

### 4. MolanDev Framework 依赖

项目依赖 `molandev-framework`（已发布到 Maven 中央仓库），提供核心能力：

| 模块 | 功能 |
|------|------|
| `molandev-rpc` | 双模切换核心 - 接口即服务、智能路由 |
| `molandev-event` | 统一事件总线 - 单体内存/微服务 RabbitMQ |
| `molandev-datasource` | 智能多数据源 - 包名自动路由 |
| `molandev-encrypt` | 全链路安全 - 混合加密、签名、脱敏 |
| `molandev-lock` | 分布式锁 - Redis/内存双策略 |
| `molandev-file` | 文件存储 - 本地/S3 切换 |
| `molandev-util` | 底层工具库 |
| `molandev-spring` | Spring 增强组件 |

**Maven 依赖：**

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.molandev</groupId>
            <artifactId>molandev-dependencies</artifactId>
            <version>1.0.1</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

## 包命名规范

```
com.molandev.{module}
├── controller      # 控制器
├── service         # 服务类（直接继承 ServiceImpl）
├── mapper          # 数据访问
├── entity          # 实体类
├── dto             # 数据传输对象
├── enums           # 枚举
├── constant        # 常量
├── config          # 配置类
└── utils           # 工具类
```

**命名示例：**

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| 实体类 | {Name}Entity | `SysUserEntity` |
| 服务类 | {Name}Service | `SysUserService` |
| Mapper | {Name}Mapper | `SysUserMapper` |
| Controller | {Name}Controller | `SysUserController` |

## 依赖关系

```
molandev-standalone-service / molandev-gateway (应用入口)
    ↓ 依赖
molandev-base / molandev-ai (业务服务)
    ↓ 依赖
molandev-apis (API 层)
    ↓ 依赖
molandev-common (公共层)
    ↓ 依赖
molandev-framework (框架层)
```

## 配置文件

### application.yml 结构

**微服务模式（molandev-base）：**

```yaml
server:
  port: 8081

spring:
  application:
    name: molandev-base
  
  # Nacos 配置（微服务模式）
  cloud:
    nacos:
      discovery:
        server-addr: localhost:8848
      config:
        server-addr: localhost:8848

molandev:
  run-mode: cloud           # 微服务模式
  datasource:
    sys:
      url: jdbc:mysql://localhost:3306/molandev_base
      username: root
      password: 123456
      driver-class-name: com.mysql.cj.jdbc.Driver
      primary: true
      packages:
        - com.molandev.base
  security:
    mode: CLOUD             # 云端认证模式
```

**单体模式（molandev-standalone-service）：**

```yaml
server:
  port: 8080

molandev:
  run-mode: single          # 单体模式
  lock:
    type: memory            # 内存锁
  datasource:
    sys:
      url: jdbc:mysql://localhost:3306/molandev_base
      username: root
      password: 123456
      packages:
        - com.molandev.base
    ai:
      url: jdbc:mysql://localhost:3306/molandev_ai
      username: root
      password: 123456
      packages:
        - com.molandev.ai
  security:
    mode: LOCAL             # 本地认证模式
```

## 双模部署

### 单体模式

```yaml
molandev:
  run-mode: single
```

- **特点**：
  - 本地方法调用
  - 多数据源事务统一
  - 简单部署
  - 快速开发

### 微服务模式

```yaml
molandev:
  run-mode: cloud
```

- **特点**：
  - HTTP 远程调用
  - 服务独立部署
  - 弹性扩展
  - 故障隔离

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

MolanDev Backend 的项目结构特点：

- ✅ **模块化设计**：清晰的模块划分
- ✅ **分层架构**：Controller-Service-Mapper
- ✅ **双模支持**：单体和微服务
- ✅ **统一规范**：包命名、代码风格
- ✅ **易于扩展**：新增模块简单
- ✅ **便于维护**：职责清晰、解耦合理

::: tip 双模架构优势
通过 `molandev.run-mode` 配置项，项目可以在单体模式和微服务模式之间自由切换，无需修改业务代码。单体模式适合快速开发和中小规模部署，微服务模式适合大规模和高可用场景。
:::
