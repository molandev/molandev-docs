# MolanDev Framework

MolanDev Framework 是一个轻量级的 Java 开发框架工具集，核心亮点是**一套代码，单体与微服务自由切换**，同时提供一系列开箱即用的企业级开发组件。

## 🎯 核心价值

### 🚀 解决架构演进痛点
**传统方案的两难困境：**
- 项目初期：微服务过度设计 → 开发效率低、调试困难 ❌
- 项目后期：单体重构微服务 → 推倒重来、风险巨大 ❌

**MolanDev 双模驱动方案：**
- 项目初期：单体模式极速开发，本地调试如丝般顺滑 ✅
- 业务扩展：一行配置切换微服务，业务代码零改动 ✅
- 持续演进：按需拆分服务，无需推翻重写 ✅
- 双向自由：微服务降本可切回单体，性能提升 10 倍 ✅

## 🌟 核心亮点

- **双模驱动架构**：独创双模驱动架构，一套代码通过配置即可在单体与微服务间自由切换。
- **轻量级**：最小化依赖原则，每个模块都可以独立使用
- **零配置**：提供合理的默认配置，开箱即用
- **高性能**：所有工具类都经过精心优化
- **易扩展**：良好的接口设计和清晰的代码结构
- **高可靠**：海量单元测试 + 详尽的代码注释
- **MIT 协议**：完全开源，可自由用于商业项目

## 📦 模块列表

### 🛠️ 通用工具类 (Util)

涵盖日常开发中的高频操作：

- **字符串处理**: 空值判断、驼峰转换、填充等
- **日期时间**: 格式化、转换、计算
- **文件操作**: 文件信息获取、MIME 类型判断
- **集合处理**: List、Map 操作增强
- **数学计算**: 精确计算、数值转换
- **随机生成**: 各类随机数、随机字符串
- **系统命令**: 跨平台命令执行、超时控制、异步执行
- **加密工具**: AES、RSA、DES、MD5、SHA、Base64 等
- **数据脱敏**: 手机号、身份证、银行卡等敏感信息脱敏

### 🔐 加密模块 (Encrypt)

提供企业级的全链路加密解决方案：

- **数据库字段加密**: MyBatis 拦截器实现透明加解密
- **请求参数加密**: 自动加解密 HTTP 请求/响应数据
- **混合加密通信**: RSA + AES 混合加密，兼顾安全与性能
- **签名校验**: 防止请求被篡改，保证数据完整性
- **敏感信息脱敏**: 注解式脱敏，支持多种脱敏策略

### 🔒 分布式锁 (Lock)

基于 Redis 的高性能分布式锁实现：

- **注解式使用**: `@Lock` 注解一键加锁
- **可重入锁**: 支持同一线程多次获取锁
- **自动续期**: Watchdog 机制防止业务执行超时
- **阻塞等待**: 支持 `waitTime` 配置，自动重试获取锁
- **防误删**: 确保只释放自己持有的锁
- **幂等性保证**: `@Idempotent` 注解防止重复提交

### 🗄️ 多数据源 (Datasource)

为微服务合并/拆分场景设计的动态数据源解决方案：

- **单体/微服务切换**: 开发一套代码，支持单体合并运行与微服务独立部署
- **包名路由**: 根据 Mapper 包名自动切换数据源
- **跨库事务支持**: 连接代理模式实现跨数据源事务
- **零侵入**: 无需在代码中添加任何注解

### 📁 文件存储 (File)

统一的文件存储解决方案，支持本地与云存储无缝切换：

- **多种存储方式**: 本地文件系统、AWS S3、阿里云 OSS、腾讯云 COS、MinIO 等
- **统一接口**: 无论使用哪种存储，API 完全一致
- **Bucket 支持**: 支持多租户文件隔离
- **流式处理**: 大文件上传下载不占用内存
- **配置驱动**: 一行配置切换存储方式

### 🌐 远程调用 (RPC)

基于 Feign 的深度增强，实现"接口即服务"：

- **接口自动映射**: 只需定义 Feign 接口并实现，框架自动注册为 MVC 接口
- **智能本地调用**: 同服务内调用自动走本地实现，无网络开销
- **跨服务远程调用**: 跨服务调用保持 Feign HTTP 远程调用
- **透明降级**: 完美集成 Fallback 机制

### 📩 事件发布 (Event)

统一的事件总线，支持本地与跨服务通信：

- **类型安全**: 直接使用类对象作为主题，支持继承冒泡
- **静态发布**: `EventUtil.publish(event)` 极致便捷
- **双模驱动**: 单体模式纯内存分发，微服务模式自动切换 RabbitMQ
- **广播/争抢**: 支持广播模式和争抢模式，灵活适配不同场景

### 🌲 Spring 集成 (Spring)

常用的业务功能组件：

- **树形结构**: 扁平数据一键转树形结构
- **XSS 防护**: 全局 Filter 自动清理 XSS 攻击
- **JSON 工具**: Jackson 封装，支持自定义配置
- **任务调度**: 简化的异步任务执行工具
- **Spring 工具**: 非 Spring 环境下获取 Bean 的工具类
- **UserAgent 解析**: 解析浏览器、操作系统等信息

## 技术栈

- **Java 8+ / Java 21+**: 完美支持 Java 21 虚拟线程感知
- **Spring Boot 2.7+ / 3.x**: 深度适配 Spring 生态
- **Redis**: 分布式锁与缓存依赖（可选）
- **MyBatis / MyBatis-Plus**: 数据库增强支持（可选）
- **Spring Cloud OpenFeign**: RPC 双模切换基础（可选）

## 设计理念

### 🔄 单体/微服务双模驱动 (Dual-mode Architecture)

这是 MolanDev Framework 最核心的设计哲学。我们认为架构应当是演进式的：
- **初创期**：使用单体模式，开发效率最高，部署最简。
- **扩展期**：无需修改业务代码，仅通过拆分模块和调整配置，即可将业务单元转化为独立的微服务。

通过 `molandev-rpc` 和 `molandev-datasource` 的协同工作，开发者可以真正实现“编写一次，到处运行（单体或集群）”。

### 🍃 轻量级

MolanDev Framework 坚持最小化依赖原则，每个模块都可以独立使用，不会引入不必要的第三方库。你可以根据实际需求选择性地引入模块。

### 零配置

大多数功能都提供了合理的默认配置，开箱即用。同时也支持灵活的自定义配置，满足不同场景需求。

### 高性能

所有工具类都经过精心优化，追求极致的性能表现。在保证功能完整的同时，最大限度地减少性能开销。

### 易扩展

良好的接口设计和清晰的代码结构，方便开发者进行二次开发和功能扩展。

### 🛡️ 高可靠性与稳定性

我们不仅关注功能的实现，更关注代码的质量：

- **海量单元测试**: 项目中包含了大量的测试类，对每一个工具方法都进行了详尽的测试，确保代码在各种场景下都能稳定运行。
- **详尽的代码注释**: 核心代码遵循 Javadoc 规范，并配有详细的中文注释，极大地降低了阅读源码和上手的门槛。

## 模块结构

```
molandev-framework
├── molandev-util        # 工具类模块 - 纯工具类，无依赖
├── molandev-encrypt     # 加密模块 - 企业级加密方案
├── molandev-lock        # 分布式锁模块 - Redis 分布式锁
├── molandev-datasource  # 多数据源模块 - 动态数据源切换
├── molandev-file        # 文件存储模块 - 本地/S3 无缝切换
├── molandev-rpc         # RPC 模块 - Feign 封装与双模切换
├── molandev-event       # 事件模块 - 统一事件总线与双模切换
└── molandev-spring      # Spring 集成模块 - Spring 生态增强
```

## 🔗 模块依赖关系

```
molandev-util (零依赖)
    ├── molandev-encrypt (依赖 util)
    ├── molandev-lock (依赖 util + Redis)
    ├── molandev-file (依赖 Spring Boot + AWS SDK)
    ├── molandev-rpc (依赖 util + Spring Cloud)
    ├── molandev-event (依赖 util + Spring Boot)
    └── molandev-spring (依赖 util + Spring Boot)

molandev-datasource (独立模块，需要 Spring + MyBatis)
```

## 📊 功能对比

| 功能 | Util | Encrypt | Lock | Datasource | Common |
|------|------|---------|------|------------|--------|
| 零依赖 | ✅ | ❌ | ❌ | ❌ | ❌ |
| 需要 Spring | ❌ | 可选 | ✅ | ✅ | ✅ |
| 需要 Redis | ❌ | ❌ | ✅ | ❌ | ❌ |
| 需要 MyBatis | ❌ | 可选 | ❌ | ✅ | ❌ |
| 加密解密 | 基础 | 企业级 | ❌ | ❌ | ❌ |
| 分布式锁 | ❌ | ❌ | ✅ | ❌ | ❌ |
| 多数据源 | ❌ | ❌ | ❌ | ✅ | ❌ |
| 树形结构 | ❌ | ❌ | ❌ | ❌ | ✅ |
| XSS 防护 | ❌ | ❌ | ❌ | ❌ | ✅ |

## 🎯 使用场景建议

### 场景一：纯工具类项目
**推荐模块**：`molandev-util`
- ✅ 零依赖，可在任何 Java 项目中使用
- ✅ 包含所有基础工具类

### 场景二：需要数据加密
**推荐模块**：`molandev-encrypt` + `molandev-util`
- ✅ 支持数据库字段加密
- ✅ 支持请求参数加密
- ✅ 支持混合加密通信

### 场景三：分布式系统
**推荐模块**：`molandev-lock` + `molandev-util`
- ✅ 基于 Redis 的分布式锁
- ✅ 支持幂等性控制
- ✅ 防止并发问题

### 场景四：文件存储需求
**推荐模块**：`molandev-file`
- ✅ 开发环境使用本地存储，快速调试
- ✅ 生产环境切换云存储，无需改代码
- ✅ 支持多租户文件隔离
- ✅ 大文件流式上传，避免内存溢出

### 场景五：渐进式微服务化
**推荐模块**：`molandev-rpc` + `molandev-event` + `molandev-datasource`
- ✅ 初期单体开发，后期零成本切换微服务
- ✅ 接口即服务，自动 MVC 映射
- ✅ 事件总线支持本地与跨服务通信
- ✅ 跨库事务支持，解决数据拆分难题

### 场景六：企业级全链路安全应用
**推荐模块**：全部模块
- `molandev-util`：基础工具类
- `molandev-encrypt`：数据加密
- `molandev-lock`：分布式锁
- `molandev-datasource`：多数据源
- `molandev-file`：文件存储
- `molandev-rpc`：接口即服务与双模切换
- `molandev-event`：统一事件总线
- `molandev-spring`：XSS 防护、树形结构等

## 🚀 快速开始

### 环境要求

- JDK 8 或更高版本
- Maven 3.x 或 Gradle 6.x+

### Maven 依赖

```xml
<dependencies>
    <!-- 工具类模块 - 零依赖 -->
    <dependency>
        <groupId>com.molandev</groupId>
        <artifactId>molandev-util</artifactId>
        <version>1.0.1</version>
    </dependency>
    
    <!-- 加密模块 -->
    <dependency>
        <groupId>com.molandev</groupId>
        <artifactId>molandev-encrypt</artifactId>
        <version>1.0.1</version>
    </dependency>
    
    <!-- 分布式锁模块 -->
    <dependency>
        <groupId>com.molandev</groupId>
        <artifactId>molandev-lock</artifactId>
        <version>1.0.1</version>
    </dependency>
    
    <!-- 多数据源模块 -->
    <dependency>
        <groupId>com.molandev</groupId>
        <artifactId>molandev-datasource</artifactId>
        <version>1.0.1</version>
    </dependency>
    
    <!-- 文件存储模块 -->
    <dependency>
        <groupId>com.molandev</groupId>
        <artifactId>molandev-file</artifactId>
        <version>1.0.1</version>
    </dependency>
    
    <!-- RPC 模块 -->
    <dependency>
        <groupId>com.molandev</groupId>
        <artifactId>molandev-rpc</artifactId>
        <version>1.0.1</version>
    </dependency>
    
    <!-- 事件模块 -->
    <dependency>
        <groupId>com.molandev</groupId>
        <artifactId>molandev-event</artifactId>
        <version>1.0.1</version>
    </dependency>
    
    <!-- Spring 集成模块 -->
    <dependency>
        <groupId>com.molandev</groupId>
        <artifactId>molandev-spring</artifactId>
        <version>1.0.1</version>
    </dependency>
</dependencies>
```

### 代码示例

#### 字符串工具
```java
import com.molandev.framework.util.StringUtils;

// 驼峰转换
String camel = StringUtils.underline2Camel("user_name");  // userName
```

#### 多数据源
```java
@Transactional
public void createOrder(Order order) {
    // 自动路由到 master 库
    userMapper.selectById(order.getUserId());
    
    // 自动路由到 order 库
    orderMapper.insert(order);
    
    // 异常时两个数据源都会回滚
}
```

#### 分布式锁
```java
@Lock(key = "#orderId", waitTime = 3000)
public void processOrder(String orderId) {
    // 同一 orderId 同时只能有一个线程执行
}
```

#### RPC 接口 (智能本地调用优化)
```java
@FeignClient(name = "user-service")
public interface UserApi {
    @GetMapping("/user/get")
    String getUserName(@RequestParam("id") Long id);
}

// 无需编写 Controller，直接实现接口即可
@Service
public class UserServiceImpl implements UserApi {
    @Override
    public String getUserName(Long id) {
        return "User_" + id;
    }
}

// 框架自动判断：
// - 同服务内调用：自动走本地实现，无网络开销
// - 跨服务调用：自动走 Feign HTTP 远程调用
// 无需任何配置！
```

#### 文件存储 (本地/云存储切换)
```java
import com.molandev.framework.file.FileStorage;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileService {
    @Autowired
    private FileStorage fileStorage;
    
    // 上传文件（自动根据配置选择本地或 S3）
    public String uploadFile(MultipartFile file) throws IOException {
        String path = "uploads/" + file.getOriginalFilename();
        return fileStorage.upload(
            file.getInputStream(), 
            "default", 
            path, 
            file.getSize()
        );
    }
    
    // 下载文件（流式传输）
    public InputStream downloadFile(String path) {
        return fileStorage.download(path);
    }
}
```

#### 事件发布 (双模驱动)
```java
import com.molandev.framework.event.core.EventUtil;
import com.molandev.framework.event.annotation.MolanListener;

// 发布事件
public class OrderService {
    public void createOrder(Order order) {
        // 业务逻辑...
        EventUtil.publish(new OrderCreatedEvent(order));
    }
}

// 监听事件
@Component
public class OrderEventListener {
    @MolanListener  // 广播模式
    public void onOrderCreated(OrderCreatedEvent event) {
        // 处理逻辑
    }
}
```

## 📚 下一步

准备好开始使用了吗？选择一个模块深入了解：

- [Util 工具类](/modules/util/overview) - 通用工具类库
- [Encrypt 加密](/modules/encrypt/overview) - 全链路加密方案
- [Lock 分布式锁](/modules/lock/overview) - Redis 分布式锁
- [Datasource 多数据源](/modules/datasource/overview) - 动态数据源切换
- [File 文件存储](/modules/file/) - 本地/云存储无缝切换
- [RPC 远程调用](/modules/rpc) - 接口即服务与双模切换
- [Event 事件发布](/modules/event) - 统一事件总线与双模切换
- [Spring 集成模块](/modules/spring/overview) - Spring 生态增强

或者查看 [GitHub 仓库](https://github.com/molandev/molandev-framework) 了解更多。
