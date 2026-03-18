# File 文件存储模块

`molandev-file` 是一个文件存储解决方案，提供统一的文件操作接口，支持**本地文件系统**和 **S3 对象存储**的无缝切换。开发环境使用本地存储快速调试，生产环境一键切换到 S3 云存储，业务代码无需任何改动。

## 核心特性

- ✅ **多种存储方式**：本地文件系统、AWS S3、阿里云OSS、腾讯云COS、MinIO等
- ✅ **统一接口**：无论使用哪种存储，API 完全一致
- ✅ **Bucket 支持**：支持多租户文件隔离
- ✅ **流式处理**：大文件上传下载不占用内存
- ✅ **配置驱动**：一行配置切换存储方式

## 快速开始

### 1. 添加依赖

```xml
<dependency>
    <groupId>com.molandev</groupId>
    <artifactId>molandev-file</artifactId>
    <version>${molan.version}</version>
</dependency>
```

### 2. 配置存储方式

#### 开发环境 - 本地存储

```yaml
molandev:
  file:
    type: local
    local:
      base-path: ./files
```

#### 生产环境 - S3 存储

```yaml
molandev:
  file:
    type: s3
    s3:
      endpoint: https://s3.amazonaws.com
      region: us-east-1
      access-key: ${AWS_ACCESS_KEY}
      secret-key: ${AWS_SECRET_KEY}
      bucket: prod-app-files
```

### 3. 使用示例

```java
@Service
public class FileService {
    
    @Autowired
    private FileStorage fileStorage;
    
    // 上传文件
    public String uploadFile(MultipartFile file) throws IOException {
        String path = "uploads/" + file.getOriginalFilename();
        long fileSize = file.getSize();
        
        // 自动根据配置选择本地或 S3
        return fileStorage.upload(
            file.getInputStream(), 
            "default", 
            path, 
            fileSize
        );
    }
    
    // 下载文件（流式传输）
    public InputStream downloadFile(String path) {
        return fileStorage.download(path);
    }
}
```

## 配置说明

### 通用配置

| 配置项 | 说明 | 类型 | 默认值 | 必填 |
|-------|------|------|--------|------|
| `type` | 存储类型：`local`或`s3` | String | local | 否 |
| `default-bucket` | 默认bucket名称 | String | default | 否 |

### 本地存储配置

| 配置项 | 说明 | 类型 | 默认值 | 必填 |
|-------|------|------|--------|------|
| `local.base-path` | 本地存储根目录 | String | ./files | 否 |

**文件存储路径规则**：
- 默认bucket：`{base-path}/{default-bucket}/{path}`
- 指定bucket：`{base-path}/{bucket}/{path}`

### S3 存储配置

| 配置项 | 说明 | 类型 | 默认值 | 必填 |
|-------|------|------|--------|------|
| `s3.endpoint` | S3服务端点 | String | 无 | 是 |
| `s3.region` | S3区域 | String | us-east-1 | 否 |
| `s3.access-key` | 访问密钥 | String | 无 | 是 |
| `s3.secret-key` | 密钥 | String | 无 | 是 |
| `s3.bucket` | 默认bucket | String | 无 | 否 |
| `s3.path-style-access` | 是否使用路径风格访问 | boolean | false | 否 |

## 多云存储配置示例

### AWS S3

```yaml
molandev:
  file:
    type: s3
    s3:
      endpoint: https://s3.amazonaws.com
      region: us-east-1
      access-key: ${AWS_ACCESS_KEY}
      secret-key: ${AWS_SECRET_KEY}
      bucket: my-app-files
      path-style-access: false
```

**常用区域代码**：
- `us-east-1` - 美国东部（弗吉尼亚北部）
- `us-west-2` - 美国西部（俄勒冈）
- `ap-northeast-1` - 亚太地区（东京）
- `ap-southeast-1` - 亚太地区（新加坡）

### 阿里云 OSS

```yaml
molandev:
  file:
    type: s3
    s3:
      endpoint: https://oss-cn-hangzhou.aliyuncs.com
      region: cn-hangzhou
      access-key: ${ALIYUN_ACCESS_KEY}
      secret-key: ${ALIYUN_SECRET_KEY}
      bucket: my-app-files
      path-style-access: false
```

**常用区域代码**：
- `cn-hangzhou` - 华东1（杭州）
- `cn-shanghai` - 华东2（上海）
- `cn-beijing` - 华北2（北京）
- `cn-shenzhen` - 华南1（深圳）

### 腾讯云 COS

```yaml
molandev:
  file:
    type: s3
    s3:
      endpoint: https://cos.ap-guangzhou.myqcloud.com
      region: ap-guangzhou
      access-key: ${TENCENT_SECRET_ID}
      secret-key: ${TENCENT_SECRET_KEY}
      bucket: my-app-files-1234567890  # 需带APPID后缀
      path-style-access: false
```

**常用区域代码**：
- `ap-guangzhou` - 广州
- `ap-shanghai` - 上海
- `ap-beijing` - 北京
- `ap-chengdu` - 成都

### MinIO（私有部署）

```yaml
molandev:
  file:
    type: s3
    s3:
      endpoint: http://minio:9000
      region: us-east-1
      access-key: minioadmin
      secret-key: minioadmin
      bucket: test-files
      path-style-access: true  # MinIO 必须设置为 true
```

## 环境配置对比

### 开发环境（本地存储）

**适用场景**：本地开发、快速调试

```yaml
# application-dev.yml
molandev:
  file:
    type: local
    default-bucket: default
    local:
      base-path: ./files
```

**优点**：
- ✅ 无需额外服务，开箱即用
- ✅ 文件直接存储在本地，方便查看和调试
- ✅ 零成本

**缺点**：
- ❌ 不支持分布式部署
- ❌ 文件容量受限于磁盘大小

---

### 测试环境（MinIO）

**适用场景**：测试环境、CI/CD

```yaml
# application-test.yml
molandev:
  file:
    type: s3
    default-bucket: test-files
    s3:
      endpoint: http://minio:9000
      region: us-east-1
      access-key: minioadmin
      secret-key: minioadmin
      bucket: test-files
      path-style-access: true
```

**优点**：
- ✅ 完全兼容 S3 API，可模拟生产环境
- ✅ 私有部署，数据安全可控
- ✅ 支持分布式存储

**Docker 快速启动**：
```bash
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"
```

---

### 生产环境（云存储）

**适用场景**：生产环境、高可用部署

```yaml
# application-prod.yml
molandev:
  file:
    type: s3
    default-bucket: prod-app-files
    s3:
      endpoint: https://s3.amazonaws.com  # 或阿里云、腾讯云
      region: us-east-1
      access-key: ${AWS_ACCESS_KEY}  # 从环境变量读取
      secret-key: ${AWS_SECRET_KEY}
      bucket: prod-app-files
      path-style-access: false
```

**优点**：
- ✅ 高可用、高可靠（99.99%）
- ✅ 海量存储容量
- ✅ 支持 CDN 加速
- ✅ 按量付费，弹性伸缩

**安全建议**：
- ✅ 使用环境变量或密钥管理服务（KMS）
- ✅ 开启 bucket 访问日志
- ✅ 配置 bucket 权限策略（最小权限原则）

## 使用示例

### 上传用户头像

```java
@Service
public class UserService {
    
    @Autowired
    private FileStorage fileStorage;
    
    public String uploadAvatar(Long userId, MultipartFile file) throws IOException {
        String path = "avatars/" + userId + "/" + file.getOriginalFilename();
        return fileStorage.upload(file.getInputStream(), path);
    }
}
```

### 大文件上传（性能优化）

```java
@PostMapping("/upload")
public Result<String> uploadFile(MultipartFile file) throws IOException {
    String path = "uploads/" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
    long fileSize = file.getSize();
    
    // 提供文件大小可以优化上传性能，避免 SDK 需要缓冲整个流
    return Result.success(fileStorage.upload(
        file.getInputStream(), 
        "default", 
        path, 
        fileSize  // 传入文件大小
    ));
}
```

### 多租户文件隔离

```java
@Service
public class TenantFileService {
    
    @Autowired
    private FileStorage fileStorage;
    
    // 每个租户使用独立的 bucket
    public String uploadTenantFile(String tenantId, MultipartFile file) throws IOException {
        String bucket = "tenant-" + tenantId;
        String path = "documents/" + file.getOriginalFilename();
        return fileStorage.upload(file.getInputStream(), bucket, path);
    }
    
    // 列出租户的所有文件
    public List<String> listTenantFiles(String tenantId, String folder) {
        String bucket = "tenant-" + tenantId;
        return fileStorage.list(bucket, folder);
    }
}
```

### 文件下载（流式传输）

```java
@GetMapping("/download")
public void downloadFile(@RequestParam String path, HttpServletResponse response) 
        throws IOException {
    
    // 1. 权限校验（业务层实现）
    if (!hasDownloadPermission(path)) {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        return;
    }
    
    // 2. 检查文件是否存在
    if (!fileStorage.exists(path)) {
        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
        return;
    }
    
    // 3. 流式传输文件
    String fileName = path.substring(path.lastIndexOf('/') + 1);
    response.setContentType("application/octet-stream");
    response.setHeader("Content-Disposition", "attachment; filename=" + fileName);
    
    try (InputStream inputStream = fileStorage.download(path);
         OutputStream outputStream = response.getOutputStream()) {
        
        byte[] buffer = new byte[8192];
        int bytesRead;
        while ((bytesRead = inputStream.read(buffer)) != -1) {
            outputStream.write(buffer, 0, bytesRead);
        }
    }
}
```



## 常见问题

### 上传大文件如何避免内存溢出？

框架已内置流式上传，只需注意：
1. 使用 `MultipartFile.getInputStream()` 获取流，不要使用 `getBytes()`
2. 如果知道文件大小，使用带 `contentLength` 参数的 upload 方法
3. 配置 Spring Boot 的文件上传大小限制

```yaml
spring:
  servlet:
    multipart:
      max-file-size: 100MB
      max-request-size: 100MB
```

### 本地存储的 bucket 是如何工作的？

本地存储使用子目录模拟 bucket：
- 默认 bucket：`{basePath}/{defaultBucket}/{path}`
- 指定 bucket：`{basePath}/{bucket}/{path}`

例如：
```java
// 存储到：./files/default/avatars/user1.jpg
fileStorage.upload(inputStream, "avatars/user1.jpg");

// 存储到：./files/tenant-001/avatars/user1.jpg
fileStorage.upload(inputStream, "tenant-001", "avatars/user1.jpg");
```

### S3 的 bucket 需要提前创建吗？

是的，S3 的 bucket 需要在云服务商控制台或通过 API 提前创建。框架不会自动创建 bucket。

### 如何切换不同的云存储服务商？

只需修改 `endpoint`、`region` 和密钥配置即可，代码无需改动。参考上面的"多云存储配置示例"。

### 密钥如何安全管理？

**推荐方式**：
1. ✅ 使用环境变量：`access-key: ${AWS_ACCESS_KEY}`
2. ✅ 使用配置中心（Nacos、Apollo）
3. ✅ 使用云服务商的密钥管理服务（AWS KMS、阿里云KMS）
4. ✅ 使用 IAM 角色（适用于云服务器）

**禁止方式**：
- ❌ 硬编码在配置文件中
- ❌ 提交到版本控制系统

### 环境变量如何配置？

**Linux/Mac**：
```bash
export AWS_ACCESS_KEY=your-access-key
export AWS_SECRET_KEY=your-secret-key
java -jar app.jar
```

**Docker**：
```yaml
services:
  app:
    image: your-app:latest
    environment:
      - AWS_ACCESS_KEY=your-access-key
      - AWS_SECRET_KEY=your-secret-key
```

**Kubernetes**：
```yaml
env:
- name: AWS_ACCESS_KEY
  valueFrom:
    secretKeyRef:
      name: aws-credentials
      key: access-key
```

## 注意事项

### ⚠️ 安全建议

1. **密钥管理**：使用环境变量或配置中心，不要硬编码
2. **Bucket 权限**：合理配置云存储 Bucket 的访问策略
3. **文件校验**：上传文件前进行类型和大小校验

### ⚠️ 性能优化

1. **提供文件大小**：上传时提供 contentLength 可以提升性能
2. **流式处理**：避免一次性读取大文件到内存
3. **异步上传**：大文件上传考虑使用异步处理
4. **CDN 加速**：生产环境建议配置 CDN
