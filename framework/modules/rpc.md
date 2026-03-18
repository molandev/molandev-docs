# RPC 远程调用

`molandev-rpc` 是对 Spring Cloud OpenFeign 的深度封装与增强。它旨在简化微服务开发中的远程调用代码，支持通过接口定义自动创建 MVC 映射，并提供强大的“单体/微服务”无缝切换能力。

---

## 核心特性

- **接口即服务**：只需定义 Feign 接口并实现它，无需编写冗余的 Controller。框架会自动根据 API 定义创建 MVC 映射（HandlerMapping）。
- **单体/微服务无缝切换**：同一套代码，在微服务模式下通过 Feign 远程调用，在单体模式下由于面向接口编程的特性，会自动注入本地实现类，实现零成本切换。
- **文件上传支持**：支持通过 Feign 进行文件上传，提供 `MultipartFileBuilder` 工具类，安全高效地构造 `MultipartFile` 对象。
- **自动降级支持**：完美集成 Feign 的降级（Fallback）机制，确保服务在高可用场景下的稳定性。
- **透明化调用**：调用方感知不到底层是本地 Bean 调用还是远程 HTTP 调用。

---

## 工作原理

1. **自动映射**：在 `cloud` 模式下，框架会扫描归属于当前服务的 Feign 接口，并自动将其实现类注册为 Spring MVC 的 Handler。
2. **极致性能**：在 `cloud` 模式下，如果 A 服务内部调用自身的 API 接口，框架通过 `ProxyFeignClientFactoryBean` 自动识别并重定向到本地实现，绕过网络 IO。
3. **零成本切换**：在 `single` 模式下，可以完全排除 Feign 依赖。由于业务代码始终面向接口编程，Spring 会自动将接口的本地实现类注入到调用方，无需任何 RPC 拦截逻辑，回归最纯粹的 Spring 调用方式。
4. **模式感知**：通过 `molandev.run-mode` 配置项配合条件注解（如 `@ConditionalOnCloudMode`），实现不同环境下组件的精细化加载。

---

## 适用场景

- **渐进式微服务化**：初期作为单体应用开发，后期只需拆分模块并调整配置，即可转为微服务架构。
- **开发效率提升**：省去了编写 Controller 这一步骤，使开发者专注于业务接口的设计与实现。
- **多端兼容**：同一份 API 定义，既可以给前端做 HTTP 接口，也可以给其他微服务做远程调用。

---

## 快速入门

### 1. 引入依赖

在您的项目 `pom.xml` 中引入 `molandev-rpc` 依赖：

```xml
<dependency>
    <groupId>com.molandev</groupId>
    <artifactId>molandev-rpc</artifactId>
    <version>${molan.version}</version>
</dependency>
```

> **注意**：
> 1. 该模块在 `cloud` 模式下依赖于 `Spring Cloud OpenFeign`，请确保项目中已正确配置 Spring Cloud 环境。
> 2. 如果您的项目仅以 `single` (单体) 模式运行，您可以安全地排除 Feign 依赖，框架将退化为纯粹的 Spring 本地注入模式。

### 2. 核心配置

在 `application.yml` 中配置运行模式：

```yaml
molandev:
  run-mode: cloud # 可选值：cloud (微服务) / single (单体)
```

### 3. 定义与实现接口

定义一个标准的 FeignClient 接口并直接实现它：

```java
// 1. 定义接口
@FeignClient(name = "user-service", fallback = UserApiFallback.class)
public interface UserApi {
    @GetMapping("/user/get")
    String getUserName(@RequestParam("id") Long id);
}

// 2. 实现接口（无需编写 Controller）
@Service
public class UserServiceImpl implements UserApi {
    @Override
    public String getUserName(Long id) {
        return "User_" + id;
    }
}
```

### 4. 开启 Feign 扫描

在启动类上开启 Feign 扫描：

```java
@SpringBootApplication
@EnableFeignClients(basePackages = "com.your.package")
public class YourApplication {
    public static void main(String[] args) {
        SpringApplication.run(YourApplication.class, args);
    }
}
```

---

## 核心特性详述

### 自动 MVC 映射 (Auto HandlerMapping)

在传统的 Spring Cloud 开发中，通常需要同时编写接口和 Controller。`molandev-rpc` 简化了这一过程：
- 框架启动时会自动识别归属于当前服务的 Feign 接口（通过 `spring.application.name` 与 `@FeignClient(name = "...")` 匹配）。
- 自动将接口上的映射信息注册到 Spring MVC 的 `RequestMappingHandlerMapping`。
- 将接口的本地实现类作为处理请求的 Handler。

这意味着 **不再需要编写 Controller 层**。您可以直接通过 HTTP 请求访问接口定义的路径。

### 混合模式切换 (Hybrid Mode)

- **Cloud 模式 (`cloud`)**：
    - **微服务场景**：跨服务调用走标准 Feign 的 HTTP 调用。
    - **本地服务逻辑**：如果 A 服务内部调用自身的 API 接口，框架会自动识别并走本地 Bean 调用（绕过网络 IO），提升性能。
- **Standalone 模式 (`single`)**：
    - **零依赖运行**：在单体场景下，甚至可以完全排除 Feign 相关的依赖包。
    - **天然解耦**：Spring 自动将接口的本地实现类注入到调用方，无拦截损耗，性能最优。

### 服务自动降级 (Automatic Fallback)

框架完全支持 Feign 的 `fallback` 和 `fallbackFactory`。

**降级类编写规范：**
建议为 Fallback 类添加条件注解，以防止在单体模式下与业务实现类产生 Bean 冲突：

```java
@Component
@ConditionalOnCloudMode // 仅在 Cloud 模式下生效
public class UserApiFallback implements UserApi {
    @Override
    public String getUserName(Long id) {
        return "Fallback: User information is temporarily unavailable";
    }
}
```

### 异常处理建议

框架不强制定义响应格式。在远程调用发生异常（如 404, 500, 超时等）时，建议业务方根据自身需求，通过标准的 Spring MVC `@RestControllerAdvice` 拦截 `FeignException` 并进行自定义处理。

---

## 文件上传支持

### 问题背景

在使用 Feign 客户端调用文件上传接口时，接口定义通常使用 `MultipartFile` 参数：

```java
@FeignClient(name = "file-service")
public interface FileServiceApi {
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    String uploadFile(@RequestPart("file") MultipartFile file, @RequestParam("info") String info);
}
```

但在非 HTTP 请求场景下（比如定时任务、消息队列消费者、内部服务调用等），需要构造 `MultipartFile` 对象。

### MultipartFileBuilder 工具类

`molandev-rpc` 提供了 `MultipartFileBuilder` 工具类，用于在多种场景下安全、高效地构造 `MultipartFile` 对象。

#### 内存安全设计

工具类提供了两套 API：

- **小文件 API**（`< 10MB`）：`fromBytes()` / `fromString()`，直接加载到内存
- **大文件 API**（`> 10MB`）：`fromFile()` / `fromInputStream(size)`，使用流式传输，避免内存溢出

### 使用示例

#### 1. 转发前端上传的文件

```java
@PostMapping("/upload/forward")
public String forwardUpload(@RequestPart("file") MultipartFile file) {
    // 直接传递给 Feign 客户端
    return fileServiceApi.uploadFile(file, "forwarded");
}
```

#### 2. 从字符串/字节数组构造（小文件）

```java
import com.molandev.framework.rpc.util.MultipartFileBuilder;

// 从字符串构造
String content = "Hello, World!";
MultipartFile file = MultipartFileBuilder.fromString(content, "hello.txt");
fileServiceApi.uploadFile(file, "generated");

// 从字节数组构造（指定 ContentType）
byte[] bytes = content.getBytes();
MultipartFile file1 = MultipartFileBuilder.fromBytes(bytes, "file.txt", "text/plain");

// 从字节数组构造（自动推断 ContentType）
MultipartFile file2 = MultipartFileBuilder.fromBytes(bytes, "document.pdf");
// 会自动识别为 "application/pdf"
```

**支持的文件类型自动识别**：

ContentType 自动识别基于 [`FileUtils.getContentType()`](/modules/util/common/file#getcontenttype-获取-contenttype-mime-类型) 方法，支持：
- 文本：.txt, .html, .css, .js, .json, .xml, .csv
- 图片：.jpg, .jpeg, .png, .gif, .bmp, .webp, .svg, .ico
- 视频：.mp4, .avi, .mov, .wmv, .flv, .webm
- 音频：.mp3, .wav, .ogg, .m4a, .flac
- 文档：.pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx
- 压缩：.zip, .rar, .7z, .tar, .gz

**适用场景**：动态生成的文件内容、从数据库读取的文件内容。

#### 3. 从本地文件构造（大文件安全）

```java
import java.nio.file.Paths;
import java.io.File;

// 方式1：使用 Path
Path filePath = Paths.get("/path/to/large-video.mp4");
MultipartFile file = MultipartFileBuilder.fromFile(filePath);
fileServiceApi.uploadFile(file, "local-file");

// 方式2：使用 File 对象
File file = new File("/path/to/large-video.mp4");
MultipartFile multipartFile = MultipartFileBuilder.fromFile(file);
fileServiceApi.uploadFile(multipartFile, "local-file");
```

**特性**：
- 支持 `Path` 和 `File` 两种方式
- 自动检测文件是否存在
- 自动识别 MIME 类型
- 使用流式传输，即使 GB 级文件也不会 OOM

**适用场景**：服务器本地文件上传、文件迁移。

#### 4. 从 InputStream 构造（大文件安全）

```java
// 从其他服务下载文件
ResponseEntity<Resource> response = otherServiceApi.downloadFile("file.pdf");
InputStream inputStream = response.getBody().getInputStream();
long size = response.getHeaders().getContentLength();

// 构造 MultipartFile（流式传输）
MultipartFile file = MultipartFileBuilder.fromInputStream(
    inputStream, "file.pdf", "application/pdf", size);
fileServiceApi.uploadFile(file, "relayed");
```

**重要**：必须提供 `size` 参数才能实现流式传输。

**适用场景**：从其他服务下载后转发、数据库 BLOB、OSS 对象存储。

### 如何获取文件大小？

为了实现流式传输，需要提供文件大小。常见获取方式：

```java
// 1. 从本地文件
long size = Files.size(filePath);

// 2. 从 HTTP 响应
long size = response.getHeaders().getContentLength();

// 3. 从数据库
long size = fileEntity.getFileSize();

// 4. 从 OSS 元数据
long size = ossClient.getObjectMetadata(bucket, key).getContentLength();

// 5. 从 S3
long size = s3Object.getObjectMetadata().getContentLength();
```

### 内存优化对比

| 场景 | 传统方式 | 优化后 | 内存占用 |
|------|----------|----------|----------|
| 1GB 视频文件 | `readAllBytes()` → **1GB 内存** | 流式传输 → **~8KB 缓冲区** | ↓ 99.9% |
| 100MB PDF | `readAllBytes()` → **100MB 内存** | 流式传输 → **~8KB 缓冲区** | ↓ 99.9% |
| 10MB 图片 | 读入内存 → 10MB | 读入内存 → 10MB | 无影响 |

### API 参考

| 方法 | 适用场景 | 内存安全 |
|------|----------|----------|
| `fromString(content, filename)` | 小文件（< 10MB） | ✅ |
| `fromBytes(bytes, filename, contentType)` | 小文件（< 10MB） | ✅ |
| `fromBytes(bytes, filename)` | 小文件，自动推断 ContentType | ✅ |
| `fromFile(Path filePath)` | 任意大小文件 | ✅ 流式传输 |
| `fromFile(File file)` | 任意大小文件 | ✅ 流式传输 |
| `fromInputStream(stream, filename, type, size)` | 任意大小文件 | ✅ 流式传输 |
| ~~`fromInputStreamUnsafe(stream, filename, type)`~~ | 已废弃 | ❌ 可能 OOM |

### 注意事项

1. **小文件**（< 10MB）：使用 `fromString()` / `fromBytes()`，简单方便
2. **大文件**（> 10MB）：使用 `fromFile()` / `fromInputStream(size)`，安全可靠
3. **必须提供 size**：`fromInputStream()` 需要 size 参数才能流式传输
4. **配置文件大小限制**：根据需要调整 Spring 和 Feign 配置：

```yaml
spring:
  servlet:
    multipart:
      max-file-size: 100MB
      max-request-size: 100MB
feign:
  client:
    config:
      default:
        connect-timeout: 60000
        read-timeout: 60000
```

---

## 示例项目 (Samples)

为了帮助您更好地理解使用细节，我们在代码库中提供了完整的示例项目：

- **`examples/molandev-rpc/service1`**: 调用方示例。
- **`examples/molandev-rpc/service2`**: 提供方示例（接口即服务）。
- **`examples/molandev-rpc/merge-service`**: 演示单体模式下如何将多个服务模块合并运行。

您可以通过查看这些示例代码来快速掌握模块的使用细节。
