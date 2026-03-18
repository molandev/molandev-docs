# 文件管理

## 解决的问题

业务系统中经常需要处理文件上传下载，如：

- 📄 **用户头像** - 个人中心上传头像
- 📎 **附件管理** - 工单、审批流程的附件
- 📊 **文件导入** - Excel 数据批量导入
- 📥 **文件导出** - 报表导出为 Excel/PDF

传统做法存在以下问题：

- ❌ **文件信息丢失** - 上传后不知道谁上传的、什么时候上传的
- ❌ **无法统一管理** - 文件散落各处，难以查询和统计
- ❌ **删除不可恢复** - 误删文件后无法找回
- ❌ **临时文件堆积** - 上传后未使用的文件不会自动清理

MolanDev Cloud 提供了**完整的文件管理服务**，记录文件元数据、支持回收站机制、自动清理临时文件。

## 核心特性

### ✅ 文件元数据管理
- 自动记录文件名、大小、类型、上传时间
- 支持按业务类型分类管理
- 可查询所有上传文件记录

### ✅ 回收站机制
- 临时文件自动进入回收站
- 回收站文件可恢复
- 超期后自动彻底删除

### ✅ 文件状态管理
- **临时状态（C）** - 刚上传，未持久化
- **永久状态（P）** - 已持久化，不会被自动清理
- **回收站（R）** - 已删除，等待彻底清理

### ✅ 存储双模支持
- 本地存储 / 云存储（S3）自动切换
- 具体实现请查看 [molandev-file 框架文档](/framework/modules/file)

## 快速开始

### 后端：使用 FileApi

**推荐方式**：使用 `FileApi` 接口上传文件，支持单体和微服务自动切换。

```java
@Service
public class BusinessService {
    
    @Autowired
    private FileApi fileApi;  // 注入 FileApi
    
    /**
     * 转发前端上传的文件
     */
    public String uploadFile(MultipartFile file) {
        // 直接传递给 FileApi（自动记录元数据）
        return fileApi.upload(file, "attachment", false);
    }
}
```

**FileApi 接口方法：**

```java
public interface FileApi {
    // 上传文件
    String upload(MultipartFile file, String biz, Boolean permanent);
    
    // 持久化单个文件
    void permanentFile(String path);
    
    // 持久化多个文件
    void permanentFiles(List<String> paths);
    
    // 删除单个文件
    void removeFile(String path);
    
    // 删除多个文件
    void removeFiles(List<String> paths);
    
    // 下载文件
    ResponseEntity<Resource> download(String path);
}
```

### 后端：使用 MultipartFileBuilder

在非 HTTP 请求场景（如定时任务、消息队列、内部调用）需要构造 `MultipartFile` 对象时，使用框架提供的 `MultipartFileBuilder`。

#### 1. 从字节数组构造（小文件 < 10MB）

```java
import com.molandev.framework.rpc.util.MultipartFileBuilder;

// 修改头像示例
public void changeAvatar(String avatarBase64) {
    // 解析 Base64
    byte[] bytes = Base64Utils.decode(avatarBase64);
    
    // 构造 MultipartFile（自动推断 MIME 类型）
    MultipartFile file = MultipartFileBuilder.fromBytes(bytes, "avatar.jpg");
    
    // 上传到文件服务
    String filePath = fileApi.upload(file, "avatar", true);
    
    // 更新用户信息
    userService.updateAvatar(userId, filePath);
}
```

#### 2. 从字符串构造（文本文件）

```java
// 生成日志文件并上传
String logContent = "任务执行成功\n处理了 100 条数据";
MultipartFile file = MultipartFileBuilder.fromString(logContent, "task.log");
String logPath = fileApi.upload(file, "logs", true);
```

#### 3. 从本地文件构造（大文件安全）

```java
import java.nio.file.Paths;
import java.io.File;

// 方式1：使用 Path
Path filePath = Paths.get("/path/to/large-video.mp4");
MultipartFile file = MultipartFileBuilder.fromFile(filePath);
fileApi.upload(file, "video", true);

// 方式2：使用 File 对象
File file = new File("/path/to/large-video.mp4");
MultipartFile multipartFile = MultipartFileBuilder.fromFile(file);
fileApi.upload(multipartFile, "video", true);
```

**特性：**
- ✅ 自动检测文件是否存在
- ✅ 自动识别 MIME 类型
- ✅ 使用流式传输，GB 级文件不会 OOM

#### 4. 从 InputStream 构造（大文件安全）

```java
// 从其他服务下载后转发
ResponseEntity<Resource> response = otherServiceApi.downloadFile("file.pdf");
InputStream inputStream = response.getBody().getInputStream();
long size = response.getHeaders().getContentLength();

// 构造 MultipartFile（流式传输）
MultipartFile file = MultipartFileBuilder.fromInputStream(
    inputStream, "file.pdf", "application/pdf", size
);
fileApi.upload(file, "documents", true);
```

**重要：** 必须提供 `size` 参数才能实现流式传输。

### 前端：使用 el-upload 组件

前端使用 Element Plus 的 `el-upload` 组件上传文件。

#### 方式 1：直接上传（推荐）

```vue
<template>
    <el-upload
        :action="uploadAction"
        :data="uploadData"
        name="file"
        :headers="uploadHeader"
        :on-success="handleUploadSuccess"
    >
        <el-button type="primary">上传文件</el-button>
    </el-upload>
</template>

<script setup>
import { Session } from '/@/utils/storage'

const uploadAction = ref('/api/file/upload')
const uploadData = ref({
    biz: 'default',        // 业务类型
    permanent: 'true',     // 永久化
})
const uploadHeader = ref({
    'Admin-Token': Session.get('token'),
})

const handleUploadSuccess = (res) => {
    console.log('上传成功，文件路径：', res.data)
    // res.data = "/default/2024/01/28/uuid_filename.jpg"
}
</script>
```

#### 方式 2：自定义上传（用于图片裁剪等场景）

```vue
<template>
    <el-upload
        action="#"
        :http-request="() => {}"
        :show-file-list="false"
        :before-upload="beforeUpload"
        accept="image/*"
    >
        <el-button type="primary">上传头像</el-button>
    </el-upload>
</template>

<script setup>
const beforeUpload = (file) => {
    // 读取文件为 Base64
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
        const base64 = reader.result
        // 可以先裁剪再上传
        uploadAvatar(base64)
    }
}

const uploadAvatar = (base64) => {
    // 调用 API 上传
    useUserSelfApi().changeAvatar({ avatarBase64: base64 })
}
</script>
```

### 文件下载和预览

```javascript
// 下载文件
const downloadFile = (filePath) => {
    window.location.href = `/api/file/download${filePath}?access_token=${Session.get('token')}`
}

// 预览文件（图片、PDF）
const previewFile = (filePath) => {
    window.open(`/api/file/preview${filePath}`)
}
```

## 实现原理

### 数据库设计

```sql
CREATE TABLE fs_file (
    id VARCHAR(36) PRIMARY KEY,
    file_name VARCHAR(255),      -- 原始文件名
    file_size BIGINT,             -- 文件大小（字节）
    bucket VARCHAR(255),          -- 存储桶
    full_path VARCHAR(500),       -- 文件完整路径
    mime_type VARCHAR(100),       -- MIME 类型
    status CHAR(1),               -- 状态：C-临时 P-永久 R-回收站
    biz_type VARCHAR(50),         -- 业务类型
    create_time TIMESTAMP,        -- 创建时间
    alive_time INT                -- 有效时间（秒）
);
```

### 文件上传流程

【TODO：建议插入流程图，展示：前端上传 → 后端接口 → 保存元数据 → 上传到存储】

```java
public String saveAndUpload(MultipartFile file, String biz, boolean permanent) {
    String originName = file.getOriginalFilename();
    
    // 1. 生成唯一文件名（UUID + 原始扩展名）
    String name = IdUtils.uuid() + originName.substring(originName.lastIndexOf("."));
    
    // 2. 构造文件路径：biz/yyyy/MM/dd/uuid.ext
    String path = createPath(name, biz);
    
    // 3. 保存元数据到数据库
    FsFileEntity entity = new FsFileEntity();
    entity.setBucket(FileConsts.BUCKET);
    entity.setFileSize(file.getSize());
    entity.setBizType(biz);
    entity.setFullPath("/" + path);
    entity.setStatus(permanent ? "P" : "C");
    entity.setMimeType(file.getContentType());
    entity.setFileName(originName);
    this.save(entity);
    
    // 4. 上传到存储（FileStorage 自动适配本地/云）
    fileStorage.upload(file.getInputStream(), FileConsts.BUCKET, path, file.getSize());
    
    return entity.getFullPath();
}
```

### 回收站机制

回收站服务自动运行，分为两个任务：

#### 1. 移入回收站（每 30 分钟）

```java
private void moveFileToRecycle() {
    // 查找超过有效期的临时文件
    LambdaQueryWrapper<FsFileEntity> wrapper = Wrappers.lambdaQuery(FsFileEntity.class);
    wrapper.eq(FsFileEntity::getStatus, "C");  // 临时状态
    wrapper.lt(FsFileEntity::getCreateTime, 
               LocalDateTime.now().minusSeconds(removeAfter));
    
    List<FsFileEntity> list = fileService.list(wrapper);
    for (FsFileEntity entity : list) {
        entity.setStatus("R");  // 标记为回收站
    }
    fileService.saveOrUpdateBatch(list);
}
```

**配置：**
```yaml
molandev:
  file:
    recycle:
      enabled: true
      remove-after: 86400  # 临时文件 24 小时后进回收站
```

#### 2. 彻底删除（每天凌晨 1 点）

```java
private void cleanRecycle() {
    // 删除回收站中超期的文件
    LambdaQueryWrapper<FsFileEntity> wrapper = Wrappers.lambdaQuery(FsFileEntity.class);
    wrapper.eq(FsFileEntity::getStatus, "R");  // 回收站状态
    wrapper.lt(FsFileEntity::getCreateTime, 
               LocalDateTime.now().minusSeconds(aliveTime));
    
    List<FsFileEntity> list = fileService.list(wrapper);
    // 删除数据库记录和实际文件
    fileService.removeBatchByIds(list.stream().map(FsFileEntity::getId).toList());
}
```

**配置：**
```yaml
molandev:
  file:
    recycle:
      alive-time: 2592000  # 回收站文件保留 30 天
```

### 文件持久化

对于确定需要长期保存的文件，需要手动持久化：

```java
// 单个文件持久化
fsFileService.permanentFile(filePath);

// 批量持久化
fsFileService.permanentFiles(List.of(path1, path2, path3));
```

持久化后的文件状态从 `C` 变为 `P`，不会被自动清理。

## 使用场景

### 1. 用户头像上传

前端先使用图片裁剪组件，裁剪后转为 Base64 上传：

```javascript
const uploadAvatar = (base64) => {
    useUserSelfApi().changeAvatar({ avatarBase64: base64 })
        .then(() => {
            ElMessage.success('更换头像成功')
        })
}
```

后端解析 Base64 并使用 `MultipartFileBuilder` 构造文件：

```java
import com.molandev.framework.rpc.util.MultipartFileBuilder;

public void changeAvatar(String avatarBase64) {
    // 解析 Base64（移除前缀）
    avatarBase64 = avatarBase64.replace("data:image/png;base64,", "");
    byte[] bytes = Base64Utils.decode(avatarBase64);
    
    // 使用 MultipartFileBuilder 构造文件
    MultipartFile file = MultipartFileBuilder.fromBytes(bytes, IdUtils.uuid() + ".jpg");
    
    // 上传到文件服务（永久化）
    String filePath = fileApi.upload(file, "avatar", true);
    
    // 更新用户信息
    userService.updateAvatar(userId, filePath);
}
```

### 2. 附件上传

前端使用 `el-upload` 直接上传：

```vue
<el-upload
    :action="uploadAction"
    :data="{ biz: 'attachment', permanent: 'false' }"
    :headers="uploadHeader"
    :on-success="handleUploadSuccess"
>
    <el-button type="primary">上传附件</el-button>
</el-upload>
```

上传成功后，将文件路径持久化：

```java
import com.molandev.cloud.api.file.FileApi;

@Service
public class TicketService {
    
    @Autowired
    private FileApi fileApi;
    
    // 保存业务数据时，将附件持久化
    @Transactional
    public void saveTicket(TicketDto dto) {
        // 保存工单
        Ticket ticket = new Ticket();
        ticket.setAttachments(dto.getAttachments());
        ticketService.save(ticket);
        
        // 持久化附件（防止被回收）
        fileApi.permanentFiles(dto.getAttachments());
    }
}
```

### 3. 定时任务上传日志

定时任务收集日志后，使用 `MultipartFileBuilder` 上传：

```java
import com.molandev.framework.rpc.util.MultipartFileBuilder;

private String uploadJobLog(TaskExecutionDto dto) {
    // 获取完整日志
    String logContent = taskLogCollector.endCollectAndGet(dto.getRecordId());
    
    if (logContent == null || logContent.isEmpty()) {
        return "";
    }
    
    // 转换为字节数组
    byte[] logBytes = logContent.getBytes(StandardCharsets.UTF_8);
    
    // 构建 MultipartFile
    String filename = "job_" + dto.getRecordId() + ".log";
    MultipartFile multipartFile = MultipartFileBuilder.fromBytes(
        logBytes, filename, "text/plain"
    );
    
    // 上传到文件服务（永久化）
    return fileApi.upload(multipartFile, "task-logs", true);
}
```

## 注意事项

### ❗ 临时文件必须持久化

如果上传时 `permanent=false`，文件会在 24 小时后进入回收站，30 天后彻底删除。

**解决方案：**

```java
// 方案 1：上传时直接永久化
fileApi.upload(file, "attachment", true);

// 方案 2：保存业务数据后持久化
fileApi.permanentFile(filePath);
fileApi.permanentFiles(List.of(path1, path2));
```

### ❗ 暂不支持分片上传

当前版本不支持分片上传，大文件上传需要注意：

1. **调整文件大小限制**：

```yaml
spring:
  servlet:
    multipart:
      max-file-size: 100MB      # 调整单文件限制
      max-request-size: 500MB   # 调整总请求限制
```

2. **使用流式处理**：

```java
// ✅ 正确：直接使用 InputStream
fileStorage.upload(file.getInputStream(), bucket, path, file.getSize());

// ❌ 错误：一次性读入内存（大文件会 OOM）
byte[] bytes = file.getBytes();
```

3. **后期规划**：

分片上传功能正在规划中，将支持：
- 大文件分片上传（> 100MB）
- 断点续传
- 秒传（MD5 去重）

### ❗ 存储切换请查看框架文档

文件存储的双模切换（本地 / 云存储）由 `molandev-file` 框架提供，详见：

🔗 [molandev-file 框架文档](/framework/modules/file)

简要说明：
- **本地存储** - `molandev.file.type=local`
- **S3 存储** - `molandev.file.type=s3`
- **自动适配** - `FileStorage` 接口自动适配实现

## 总结

MolanDev Cloud 的文件管理功能提供了：

- ✅ **元数据管理** - 记录文件信息到数据库，可查询、统计
- ✅ **回收站机制** - 临时文件自动进回收站，误删可恢复
- ✅ **状态管理** - 临时/永久/回收站三种状态
- ✅ **自动清理** - 超期文件自动彻底删除
- ✅ **存储双模** - 本地/云存储自动切换（由框架层实现）
- ✅ **前端集成** - 支持 el-upload 组件直接上传

**核心亮点：**

文件服务层不仅仅是上传存储，还负责管理文件的元数据和生命周期，避免了临时文件堆积和误删难恢复的问题。而具体的存储实现（本地/S3）由 `molandev-file` 框架层处理，业务层无需关心。
