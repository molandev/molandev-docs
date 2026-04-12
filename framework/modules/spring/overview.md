# Spring 模块概览

molandev-spring 是 MolanDev Framework 的 Spring 集成模块，**专为 Spring Boot 项目设计**，提供了一系列开箱即用的工具类和自动配置功能。

## 模块定位

与 [molandev-util](../util/overview.md) 的零依赖设计不同，**molandev-spring 是基于 Spring 生态的增强模块**：

- **依赖 Spring Boot**：集成 Spring Boot Starter 和相关组件
- **自动配置支持**：提供 Spring Boot AutoConfiguration 机制
- **按需启用**：部分自动配置默认开启（如 XSS 防护），不影响现有项目
- **生产级工具**：面向企业级 Spring 应用的实际需求

## 核心功能

### 🛠️ 核心工具类

| 工具类 | 说明 | 项目使用频率 |
|-------|------|-------------|
| [JSONUtils](./json.md) | JSON 序列化/反序列化 | ⭐⭐⭐⭐⭐ Redis序列化、操作日志、请求日志 |
| [TreeUtil](./tree.md) | 列表转树形结构 | ⭐⭐⭐⭐⭐ 菜单树、部门树构建 |
| [SpringUtils](./spring.md) | Spring 容器工具 | ⭐⭐⭐⭐ Bean获取、配置读取 |
| [TaskUtil](./task.md) | 任务调度工具 | ⭐⭐⭐ 延迟执行、异步任务 |
| [UserAgentUtil](./user-agent.md) | UA 解析工具 | ⭐⭐ 浏览器/OS识别 |
| [MultipartFileBuilder](#multipartfilebuilder) | 构造 MultipartFile | ⭐⭐⭐ Feign文件上传 |

### ⚙️ 自动配置

| 配置项 | 说明 | 默认状态 |
|-------|------|---------|
| XSS 防护 | 防止跨站脚本攻击 | ✅ 默认开启 |
| JSON 配置 | 统一 JSON 序列化行为 | 关闭（需配置启用） |

## 快速开始

### 1. 引入依赖

```xml
<dependency>
    <groupId>com.molandev</groupId>
    <artifactId>molandev-spring</artifactId>
    <version>${molandev.version}</version>
</dependency>
```

### 2. 使用核心工具

```java
import com.molandev.framework.spring.json.JSONUtils;
import com.molandev.framework.spring.util.SpringUtils;
import com.molandev.framework.spring.tree.TreeUtil;

// JSON 序列化
String json = JSONUtils.toJsonString(user);
User user = JSONUtils.toObject(json, User.class);

// 获取 Spring Bean
UserService userService = SpringUtils.getBean(UserService.class);

// 读取配置
String appName = SpringUtils.getProperty("spring.application.name");

// 构建树形结构
List<MenuTreeVo> tree = TreeUtil.buildTree(menuList, MenuTreeVo.class);
```

## 项目中的实际应用

### JSONUtils - 统一 JSON 序列化

**使用场景：** Redis 序列化、操作日志、请求日志、异常处理

```java
// Redis 序列化配置
config.setCodec(new JsonJacksonCodec(JSONUtils.getJsonMapperWithType()));

// 请求日志记录
log.info("Request: {} {}", request.getMethod(), JSONUtils.toJsonString(params));

// 操作日志参数记录
opLog.setParams(JSONUtils.toJsonString(args));

// 异常包装
String json = JSONUtils.toJsonString(JsonResult.failed(e.getMessage()));
```

**核心方法：**

| 方法 | 说明 |
|------|------|
| `toJsonString(obj)` | 对象转 JSON 字符串 |
| `toObject(json, Class)` | JSON 转对象 |
| `toList(json, Class)` | JSON 转 List |
| `toMap(json)` | JSON 转 Map |
| `getJsonMapperWithType()` | 获取带类型信息的 ObjectMapper（用于 Redis） |

**默认配置：**
- 时区：GMT+8
- Locale：CHINA
- Java 8 时间自动格式化

### TreeUtil - 树形结构构建

**使用场景：** 菜单树、部门树构建

```java
// 菜单树构建
List<SysMenuEntity> list = sysMenuService.list();
List<SysMenuTreeVo> tree = TreeUtil.buildTree(list, SysMenuTreeVo.class);

// 树节点过滤（搜索）
TreeUtil.filterTree(tree, vo -> vo.getMenuName().contains(keyword));

// 查找子节点 ID
List<String> childIds = TreeUtil.findChildIds(tree, parentId);
```

**核心方法：**

| 方法 | 说明 |
|------|------|
| `buildTree(list, clazz)` | 扁平列表转树形结构 |
| `filterTree(tree, predicate)` | 过滤树节点（支持 Predicate） |
| `findChildIds(tree, id)` | 查找所有子节点 ID |
| `findChildren(tree, id)` | 查找所有子节点对象 |
| `expandTree(tree)` | 展开树（扁平化） |

**TreeUtil 使用的注解：**

| 注解 | 说明 |
|------|------|
| `@TreeId` | 标记节点 ID 字段 |
| `@TreeParentId` | 标记父节点 ID 字段 |
| `@TreeChildren` | 标记子节点集合字段 |
| `@TreeSort` | 标记排序字段 |

> 📖 **详细说明** → [菜单管理文档](/cloud/backend/menu)

### XSS 防护

**默认开启**，自动过滤请求参数中的 XSS 攻击：

```yaml
# 默认启用（matchIfMissing = true）
molandev:
  autoconfig:
    xss:
      enabled: true
```

**跳过 XSS 过滤：** 使用 `@XssIgnore` 注解

```java
// 跳过某个接口的 XSS 过滤
@XssIgnore
@PostMapping("/upload/rich-text")
public JsonResult<Void> uploadRichText(@RequestBody String content) {
    // 富文本内容不过滤
}

// 跳过整个类的 XSS 过滤
@XssIgnore
@RestController
public class HtmlController {
    // 所有接口都不过 XSS 过滤
}
```

### SpringUtils - Spring 容器工具

**使用场景：** 非 Spring 管理的类中获取 Bean、动态发布事件

```java
// 获取 Bean
UserService userService = SpringUtils.getBean(UserService.class);

// 获取配置
String appName = SpringUtils.getProperty("spring.application.name");

// 发布事件
SpringUtils.publishEvent(new CustomEvent(this));

// 获取原始类（绕过代理）
Object target = SpringUtils.getOriginClass(proxyBean);
```

### TaskUtil - 任务调度

**使用场景：** 延迟执行、异步任务

```java
// 延迟执行
TaskUtil.invokeLater(() -> {
    notificationService.sendEmail(user);
}, Duration.ofMinutes(5));

// 立即执行
TaskUtil.invokeNow(() -> {
    asyncTask.process();
});

// Java 21+ 自动使用虚拟线程
```

### MultipartFileBuilder

**使用场景：** 在非 HTTP 环境下构造 MultipartFile（如定时任务、Feign 转发）

```java
// 小文件（< 10MB）
MultipartFile file = MultipartFileBuilder.fromString(content, "hello.txt");
MultipartFile file1 = MultipartFileBuilder.fromBytes(bytes, "file.txt");

// 大文件（流式传输，避免 OOM）
MultipartFile file2 = MultipartFileBuilder.fromFile(Paths.get("/path/to/video.mp4"));
MultipartFile file3 = MultipartFileBuilder.fromInputStream(stream, "file.pdf", "application/pdf", size);
```

**API 参考：**

| 方法 | 适用场景 | 内存安全 |
|------|----------|----------|
| `fromString(content, filename)` | 小文件（< 10MB） | ✅ |
| `fromBytes(bytes, filename, contentType)` | 小文件（< 10MB） | ✅ |
| `fromFile(Path/File)` | 任意大小，流式传输 | ✅ |
| `fromInputStream(stream, filename, type, size)` | 任意大小，流式传输 | ✅ |

> 📖 **详细说明** → [RPC 文档](/modules/rpc) 文件上传章节

## 配置说明

```yaml
molandev:
  autoconfig:
    xss:
      enabled: true                    # 默认开启
      # 使用 @XssIgnore 注解跳过特定接口的过滤
```

## 与 Util 模块的对比

| 特性 | molandev-util | molandev-spring |
|-----|--------------|----------------|
| 依赖 | 零依赖 | 依赖 Spring Boot |
| 适用场景 | 任何 Java 项目 | Spring Boot 项目 |
| 功能定位 | 基础工具类 | Spring 增强工具 |
| 自动配置 | 无 | 有 |
| 容器集成 | 无 | 与 Spring 容器深度集成 |

## 总结

molandev-spring 提供了：

- ✅ JSONUtils - 统一 JSON 序列化（项目高频使用）
- ✅ TreeUtil - 列表转树形结构（菜单/部门树）
- ✅ XSS 防护 - 自动过滤跨站脚本攻击（默认开启）
- ✅ SpringUtils - Spring 容器工具类
- ✅ TaskUtil - 任务调度（支持虚拟线程）
- ✅ MultipartFileBuilder - 安全构造 MultipartFile
- ✅ UserAgentUtil - 浏览器/操作系统识别
