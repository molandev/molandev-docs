# 架构说明

## 整体架构

MolanDev Backend 基于 **MolanDev Framework** 构建,采用现代化的分层架构设计,支持单体和微服务两种部署模式。

### 分层架构

```
┌─────────────────────────────────────────────────────────┐
│              表示层 (Presentation Layer)                  │
│                                                          │
│            Vue 3 + Element Plus + Pinia                 │
│    • 页面视图  • 组件封装  • 路由管理  • 状态管理          │
└────────────────────────────┬────────────────────────────┘
                             │ HTTP/JSON
┌────────────────────────────▼────────────────────────────┐
│           接口层 (API Gateway / Controller)               │
│                                                          │
│   Gateway (微服务) / FeignClient自动映射 (单体)            │
│         • 路由转发  • 认证鉴权  • 请求限流                 │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│                业务层 (Service Layer)                      │
│                                                          │
│  • 业务逻辑处理  • 事务管理  • 数据验证  • 服务编排         │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│            数据访问层 (Repository / Mapper)                │
│                                                          │
│          MyBatis Plus Mapper / Custom SQL               │
│        • CRUD操作  • 复杂查询  • 多数据源路由              │
└────────────────────────────┬────────────────────────────┘
                             │
                   ┌─────────┴─────────┐
                   │                   │
┌──────────────────▼──────┐  ┌─────────▼────────────────┐
│   持久化层 (Storage)     │  │  中间件层 (Middleware)    │
│                         │  │                          │
│  ┌────────┬─────────┐  │  │  ┌──────────┬────────┐  │
│  │ MySQL  │  Redis  │  │  │  │ RabbitMQ │ S3/OSS │  │
│  │(数据库)│ (缓存)   │  │  │  │  (消息)  │(文件)  │  │
│  └────────┴─────────┘  │  │  └──────────┴────────┘  │
└─────────────────────────┘  └──────────────────────────┘
```

### 跨层关注点

```
┌──────────────────────────────────────────┐
│          跨层关注点 (Cross-Cutting)          │
│                                          │
│  • 认证与授权 (Auth)                       │
│  • 日志记录 (Logging)                      │
│  • 异常处理 (Exception Handling)         │
│  • 数据验证 (Validation)                  │
│  • 缓存管理 (Caching)                     │
│  • 事务管理 (Transaction)                 │
│  • 分布式锁 (Distributed Lock)           │
│  • 事件总线 (Event Bus)                   │
└──────────────────────────────────────────┘
```

## 双模部署

MolanDev Backend 的核心特性是支持**双模部署**,一套代码可以在单体和微服务之间自由切换。

### 单体模式 (Single Mode)

**部署架构:**

```
┌─────────────────────────────────────┐
│    MolanDev Backend (单体应用 JAR)   │
│                                     │
│  ┌─────────────────────────────┐  │
│  │  基础模块 | AI模块            │  │
│  │  (系统/文件/消息/任务)        │  │
│  │  其他业务模块...             │  │
│  └─────────────────────────────┘  │
│                                     │
│  特点:                              │
│  • 接口调用走本地 Bean 注入        │
│  • 事件通信走进程内内存              │
│  • 支持本地事务                     │
│  • 资源占用少,运维简单           │
└─────────────────────────────────────┘
```

**配置:**

```yaml
molandev:
  run-mode: single
```

**适用场景:**
- 初期产品验证,快速迭代
- 中小规模业务,用户量不大
- 内部管理系统,并发量低
- 资源有限,需要降低成本

### 微服务模式 (Cloud Mode)

**部署架构:**

```
┌──────────────────────────────────────────────────────────┐
│                    Gateway (8080)                        │
│          • 路由转发  • 认证鉴权  • 限流熔断               │
└────────┬────────────┬─────────────────────┬──────────────┘
         │            │                     │
    ┌────▼─────┐ ┌───▼─────┐          ┌───▼─────┐
    │基础服务   │ │AI服务   │          │ 其他服务  │
    │ (8081)   │ │ (8082)  │          │ (808x)  │
    └────┬─────┘ └───┬─────┘          └───┬─────┘
         │           │                     │
         │       ┌───┴───────────────────────┘
         │       │    RabbitMQ               │
         │       │   (消息中间件)             │
         │       │   • 事件总线               │
         │       │   • 异步通信               │
         │       └───────────────────┘       │
         │                                   │
         └───────────────┬───────────────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
         ┌────▼────┐           ┌───▼─────┐
         │ MySQL   │           │ Redis   │
         │ (3306)  │           │ (6379)  │
         │(持久化) │           │ (缓存)  │
         └─────────┘           └─────────┘

特点:
• 服务独立部署，可独立扩展
• 接口调用走 HTTP 远程调用
• 事件通信走 RabbitMQ
• 支持服务治理、限流熔断
```

**配置:**

```yaml
molandev:
  run-mode: cloud

spring:
  rabbitmq:
    host: localhost
    port: 5672
```

**适用场景:**
- 业务快速增长,需要水平扩展
- 不同模块负载差异大,需独立扩展
- 团队规模较大,需要按模块分工
- 需要服务级别的高可用保障

### 切换流程

**从单体切换到微服务:**

1. 修改配置 `run-mode: single` → `run-mode: cloud`
2. 添加 RabbitMQ 配置
3. 打包各个服务模块
4. 部署各个服务
5. 业务代码**零改动**!

**从微服务切换到单体:**

1. 修改配置 `run-mode: cloud` → `run-mode: single`
2. 移除 RabbitMQ 配置(可选)
3. 使用 merge 模块打包为单体应用
4. 部署单个 JAR
5. 业务代码**零改动**!

详细原理请参考 [双模部署](/features/dual-mode)

## 模块结构

### 后端模块划分

```
molandev-backend/
├── molandev-apis/              # API 定义层
│   ├── base-api/               # 基础 API 定义
│   └── ai-api/                 # AI 服务 API
│
├── molandev-base/              # 基础服务实现
│   ├── sys/                    # 系统管理模块
│   ├── file/                   # 文件服务模块
│   ├── msg/                    # 消息服务模块
│   └── job/                    # 任务调度模块
│
├── molandev-ai/                # AI 服务实现
├── molandev-gateway/           # 网关服务
├── molandev-common/            # 公共模块
└── molandev-standalone-service/ # 单体模式合并模块
```

### API 分离设计

**为什么要分离 API?**

1. **服务契约**: API 定义作为服务间的契约
2. **依赖隔离**: 调用方只需依赖 API,不需依赖实现
3. **版本管理**: API 可独立版本化,避免稳定性问题
4. **循环依赖**: 避免服务间的循环依赖

**使用示例:**

```java
// 1. API 定义 (molandev-apis/base-api)
@FeignClient(name = "${molandev.service.base:molandev-base}", contextId = "user")
public interface UserApi {
    @GetMapping("/user/get")
    UserVO getUser(@RequestParam("id") Long id);
}

// 2. 服务实现 (molandev-base)
@Service
public class UserServiceImpl implements UserApi {
    @Override
    public UserVO getUser(Long id) {
        // 实现逻辑
    }
}

// 3. 其他服务调用 (molandev-ai)
@Service
public class AiService {
    @Autowired
    private UserApi userApi;  // 只依赖 API,不依赖实现
    
    public void process() {
        UserVO user = userApi.getUser(1L);
        // Single 模式: 本地调用
        // Cloud 模式: HTTP 远程调用
    }
}
```

### 服务边界划分

| 服务 | 职责 | 核心功能 |
|------|------|----------|
| **molandev-base** | 基础服务 | 用户、角色、菜单、字典、参数、日志、文件、消息、任务 |
| **molandev-ai** | AI服务 | AI对话、模型管理、知识库 |
| **Gateway** | 网关路由 | 路由转发、认证鉴权、限流熔断 |

### 公共模块设计

**molandev-common** 模块提供公共功能:

```java
// 1. Web 增强
com.molandev.common.web
  ├── result/        // 统一响应封装
  ├── auth/          // 认证授权
  ├── exception/     // 全局异常处理
  ├── log/           // 操作日志注解
  ├── dict/          // 字典翻译
  └── validation/    // 参数验证

// 2. 数据库增强
com.molandev.common.db
  ├── base/          // 基础实体类
  ├── handler/       // MyBatis 处理器
  ├── datasource/    // 多数据源(如需)
  └── injector/      // SQL 注入器

// 3. 缓存服务
com.molandev.common.cache
  ├── CacheService   // 缓存服务接口
  └── RedisCacheServiceImpl  // Redis 实现

// 4. Excel 导入导出
com.molandev.common.poi
  ├── ExcelUtil      // Excel 工具类
  └── ExcelListener  // 导入监听器
```

## 数据流转

### 请求处理流程

**单体模式:**

```
浏览器 
  │
  │ HTTP Request
  │
  ▼
Controller/FeignClient自动映射
  │
  │ 1. 参数验证
  │ 2. 权限校验
  │ 3. 请求日志
  │
  ▼
Service 业务层
  │
  │ 1. 业务逻辑处理
  │ 2. 事务管理
  │ 3. 调用其他 Service (本地)
  │
  ▼
Mapper 数据层
  │
  │ 1. SQL 执行
  │ 2. 结果映射
  │
  ▼
MySQL / Redis
  │
  ▼
返回响应
  │
  │ 1. 结果封装
  │ 2. 字典翻译
  │ 3. 敏感信息脱敏
  │ 4. 响应日志
  │
  ▼
浏览器
```

**微服务模式:**

```
浏览器
  │
  │ HTTP Request
  │
  ▼
Gateway 网关
  │
  │ 1. 路由匹配
  │ 2. 认证鉴权
  │ 3. 限流控制
  │ 4. 请求转发
  │
  ▼
Target Service (molandev-base / molandev-ai)
  │
  │ 1. Controller 接收请求
  │ 2. 参数验证
  │ 3. 业务处理
  │ 4. 调用其他服务 (Feign HTTP)
  │
  ▼
RabbitMQ (异步事件)
  │
  │ 1. 事件发布
  │ 2. 事件消费
  │
  ▼
MySQL / Redis / S3
  │
  ▼
返回响应
  │
  │ 1. 结果封装
  │ 2. 字典翻译
  │ 3. Gateway 返回
  │
  ▼
浏览器
```

## 核心组件

### 1. 认证与授权

```java
// 登录认证
LoginResult result = authService.login(username, password);

// 获取当前用户
LoginUser currentUser = AuthUtils.currentUser();

// 权限检查
@PreAuthorize("hasPermission('sys:user:list')")
public List<User> listUsers() {}

// 数据权限(根据业务需求定义)
@DataScope(userAlias = "u")
public List<User> listUsers() {}
```

详见 [认证授权系统](/features/auth-system)

### 2. 事件总线

```java
// 发布事件
EventUtil.publish(new UserLoginEvent(userId));

// 监听事件
@MolanListener
public void onUserLogin(UserLoginEvent event) {
    // 处理逻辑
}
```

- Single 模式: 进程内内存分发
- Cloud 模式: RabbitMQ 分发

### 3. 分布式锁

```java
// 编程式使用
LockUtils.runInLock("ORDER_" + orderId, () -> {
    // 业务逻辑
});

// 注解式使用
@GlobalLock(key = "'INVENTORY_' + #productId")
public void deductInventory(Long productId) {}
```

### 4. 缓存管理

```java
// 缓存操作
cacheService.set("key", "value", 3600);
String value = cacheService.get("key");

// Spring Cache
@Cacheable(value = "users", key = "#id")
public User getUser(Long id) {}
```

## 性能优化

### 1. 数据库优化

- **连接池**: 使用 HikariCP,默认配置已优化
- **索引**: 关键查询字段建立索引
- **分页**: 使用 MyBatis Plus 分页插件
- **批量操作**: 使用 `saveBatch()` 、`updateBatchById()`

### 2. 缓存策略

- **热点数据**: 字典、菜单、参数等静态数据缓存
- **用户会话**: 基于 Redis 存储,支持分布式
- **缓存穿透**: 使用布隆过滤器防护
- **缓存雪崩**: 使用分布式锁防护

### 3. 异步处理

- **操作日志**: 异步写入数据库
- **消息通知**: 异步发送邮件/短信
- **数据统计**: 异步计算和聚合

### 4. 前端优化

- **路由懒加载**: 按需加载页面组件
- **组件缓存**: `keep-alive` 缓存页面状态
- **请求防抖**: 防止重复提交
- **虚拟滚动**: 大数据量列表优化

## 安全设计

### 1. 认证安全

- **密码加密**: BCrypt 加密存储
- **Token 机制**: JWT Token,支持自动刷新
- **会话管理**: Redis 存储,支持单点登录
- **验证码**: 图形验证码防机器人

### 2. 授权安全

- **RBAC 模型**: 用户-角色-权限
- **数据权限**: 部门级、用户级数据隔离
- **按钮权限**: 前后端双重校验
- **接口鉴权**: 所有接口默认需要鉴权

### 3. 传输安全

- **HTTPS**: 生产环境强制 HTTPS
- **XSS 防护**: 自动过滤恶意脚本
- **CSRF 防护**: Token 机制防跨站攻击
- **SQL 注入**: MyBatis 预编译防注入

### 4. 数据安全

- **敏感信息加密**: 身份证、手机号等加密存储
- **日志脱敏**: 日志中自动脱敏
- **数据备份**: 定期备份数据库
- **操作审计**: 完整的操作日志记录

## 可扩展性

### 1. 水平扩展

- **无状态设计**: 服务无状态,支持任意扩展
- **会话外置**: Session 存储在 Redis
- **负载均衡**: Nginx 或 Gateway 负载均衡

### 2. 垂直扩展

- **服务拆分**: 按业务领域拆分服务
- **数据库分库**: 支持多数据源
- **读写分离**: 主从复制,读写分离

### 3. 功能扩展

- **插件化**: 基于 Spring Boot Starter 机制
- **SPI 机制**: 支持自定义实现替换
- **事件驱动**: 解耦模块间依赖

## 监控与运维

### 1. 日志管理

- **分级日志**: ERROR、WARN、INFO、DEBUG
- **日志聚合**: 统一日志收集(ELK 可选)
- **链路追踪**: TraceId 全链路追踪
- **业务日志**: 操作日志、登录日志

### 2. 健康检查

- **接口监控**: Spring Boot Actuator
- **数据库连接**: 自动检测连接状态
- **Redis 连接**: 自动检测连接状态
- **磁盘空间**: 监控磁盘使用情况

### 3. 性能监控

- **接口性能**: 响应时间、吞吐量
- **JVM 监控**: 内存、GC、线程
- **数据库性能**: 慢查询监控
- **缓存命中率**: Redis 命中率统计

### 4. 告警机制

- **异常告警**: 系统异常自动通知
- **性能告警**: 响应时间超阈值告警
- **资源告警**: CPU、内存、磁盘告警

## 最佳实践

### 1. 代码规范

- 遵循阿里巴巴 Java 开发手册
- 使用统一的代码风格配置
- 强制代码审查机制

### 2. 分支管理

- **main**: 生产环境分支
- **develop**: 开发分支
- **feature**: 功能分支
- **hotfix**: 紧急修复分支

### 3. 版本管理

- 使用语义化版本号
- 保持 API 版本兼容性
- 及时更新依赖版本

### 4. 部署策略

- **蓝绿部署**: 零停机部署
- **灰度发布**: 渐进式发布
- **回滚机制**: 快速回滚能力

## 下一步

- 📖 了解 [双模部署原理](/features/dual-mode)
- 🔐 学习 [认证授权系统](/features/auth-system)
- 👨‍💻 阅读 [API 开发指南](/development/api-development)
- 🚀 查看 [部署指南](/guide/deployment)
