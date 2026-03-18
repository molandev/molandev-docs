# 文件工具

`FileUtils` 提供文件信息获取和处理功能。

## 类信息

- **包名**: `com.molandev.framework.util`
- **类名**: `FileUtils`
- **类型**: 静态工具类

## 核心方法

### getFileName - 获取文件名

```java
public static String getFileName(String path)
```

从路径中提取文件名。

**示例**:
```java
FileUtils.getFileName("/path/to/file.txt");     // file.txt
FileUtils.getFileName("C:\\Users\\test.doc");   // test.doc
FileUtils.getFileName("document.pdf");          // document.pdf
```

---

### getDir - 获取目录

```java
public static String getDir(String path)
```

从路径中提取目录部分。

**示例**:
```java
FileUtils.getDir("/path/to/file.txt");    // /path/to
FileUtils.getDir("file.txt");             // ""
```

---

### getFileExt - 获取文件扩展名

```java
public static String getFileExt(String fileName)
```

获取文件扩展名，支持多重扩展名识别。

**示例**:
```java
FileUtils.getFileExt("document.pdf");      // pdf
FileUtils.getFileExt("archive.tar.gz");    // tar.gz
FileUtils.getFileExt("photo.JPG");         // JPG
FileUtils.getFileExt("noext");             // ""
```

**支持的多重扩展名**:
- `tar.gz`
- `tar.bz2`
- `tar.xz`
- `tar.zst`

---

### getContentType - 获取 ContentType/MIME 类型

```java
public static String getContentType(String filename)
public static String getContentType(Path file)
```

根据文件名或扩展名自动推断 MIME 类型。

**特性**：
- 支持 40+ 种常见文件格式
- 大小写不敏感
- 性能优化，无 IO 操作

**示例**：
```java
// 文本文件
FileUtils.getContentType("readme.txt");      // text/plain
FileUtils.getContentType("data.json");       // application/json
FileUtils.getContentType("style.css");       // text/css

// 图片文件
FileUtils.getContentType("photo.jpg");       // image/jpeg
FileUtils.getContentType("icon.png");        // image/png
FileUtils.getContentType("logo.svg");        // image/svg+xml

// 文档文件
FileUtils.getContentType("report.pdf");      // application/pdf
FileUtils.getContentType("data.xlsx");       // application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

// 视频文件
FileUtils.getContentType("video.mp4");       // video/mp4

// 压缩文件
FileUtils.getContentType("archive.zip");     // application/zip

// 未知类型
FileUtils.getContentType("unknown.xyz");     // application/octet-stream

// 使用 Path 对象
Path file = Paths.get("/path/to/document.pdf");
FileUtils.getContentType(file);               // application/pdf
```

**支持的文件类型**：

| 类别 | 支持的扩展名 |
|------|--------------|
| **文本** | .txt, .html, .htm, .css, .js, .json, .xml, .csv |
| **图片** | .jpg, .jpeg, .png, .gif, .bmp, .webp, .svg, .ico |
| **视频** | .mp4, .avi, .mov, .wmv, .flv, .webm |
| **音频** | .mp3, .wav, .ogg, .m4a, .flac |
| **文档** | .pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx |
| **压缩** | .zip, .rar, .7z, .tar, .gz |

---

### ~~getMimeType~~ - 获取 MIME 类型（已废弃）

```java
@Deprecated
public static String getMimeType(String filePath)
public static String getMimeType(Path file)
```

⚠️ **已废弃**：请使用 `getContentType()` 替代。新方法支持更多文件类型且性能更好。

根据文件路径或扩展名判断 MIME 类型（依赖 JDK 内置的 URLConnection 和 Files.probeContentType）。

**示例**：
```java
FileUtils.getMimeType("image.png");        // image/png
FileUtils.getMimeType("document.pdf");     // application/pdf
FileUtils.getMimeType("style.css");        // text/css
FileUtils.getMimeType("script.js");        // text/javascript
FileUtils.getMimeType("archive.rar");      // application/vnd.rar
```

---

### getFileSize - 格式化文件大小

```java
public static String getFileSize(long size)
```

将字节数转换为可读的文件大小格式。

**示例**:
```java
FileUtils.getFileSize(500);           // 500B
FileUtils.getFileSize(1024);          // 1.0KB
FileUtils.getFileSize(1048576);       // 1.0MB
FileUtils.getFileSize(1073741824);    // 1.0GB
FileUtils.getFileSize(2560000);       // 2.44MB
```

## 完整示例

### 示例 1：文件上传处理

```java
import com.molandev.framework.util.FileUtils;
import java.io.File;

public class FileUploadService {
    
    // 允许的文件类型
    private static final String[] ALLOWED_EXTS = {"jpg", "jpeg", "png", "pdf"};
    
    public static boolean isAllowedFile(String fileName) {
        String ext = FileUtils.getFileExt(fileName).toLowerCase();
        for (String allowed : ALLOWED_EXTS) {
            if (allowed.equals(ext)) {
                return true;
            }
        }
        return false;
    }
    
    public static void uploadFile(File file) {
        String fileName = file.getName();
        long fileSize = file.length();
        
        // 检查文件类型
        if (!isAllowedFile(fileName)) {
            System.out.println("不支持的文件类型");
            return;
        }
        
        // 显示文件信息
        System.out.println("文件名: " + fileName);
        System.out.println("扩展名: " + FileUtils.getFileExt(fileName));
        System.out.println("大小: " + FileUtils.getFileSize(fileSize));
        System.out.println("MIME: " + FileUtils.getContentType(fileName));
        
        // 执行上传...
    }
    
    public static void main(String[] args) {
        File file = new File("photo.jpg");
        uploadFile(file);
        // 文件名: photo.jpg
        // 扩展名: jpg
        // 大小: 2.5MB
        // MIME: image/jpeg
    }
}
```

### 示例 2：文件列表展示

```java
import com.molandev.framework.util.FileUtils;
import java.io.File;

public class FileListDisplay {
    
    public static void displayFileInfo(File[] files) {
        System.out.printf("%-30s %-10s %-20s%n", "文件名", "大小", "类型");
        System.out.println("-".repeat(60));
        
        for (File file : files) {
            if (file.isFile()) {
                String name = file.getName();
                String size = FileUtils.getFileSize(file.length());
                String type = FileUtils.getFileExt(name);
                
                System.out.printf("%-30s %-10s %-20s%n", name, size, type);
            }
        }
    }
    
    public static void main(String[] args) {
        File dir = new File(".");
        File[] files = dir.listFiles();
        if (files != null) {
            displayFileInfo(files);
        }
    }
}
```

### 示例 3：文件下载响应

```java
import com.molandev.framework.util.FileUtils;

public class FileDownloadController {
    
    public void download(String filePath) {
        String fileName = FileUtils.getFileName(filePath);
        String mimeType = FileUtils.getContentType(filePath);
        
        // 设置响应头
        System.out.println("Content-Type: " + mimeType);
        System.out.println("Content-Disposition: attachment; filename=" + fileName);
        
        // 返回文件流...
    }
    
    public static void main(String[] args) {
        FileDownloadController controller = new FileDownloadController();
        controller.download("/uploads/document.pdf");
        // Content-Type: application/pdf
        // Content-Disposition: attachment; filename=document.pdf
    }
}
```

## 支持的 MIME 类型

`getContentType()` 方法支持以下 MIME 类型：

### 文本文件
- `.txt` → `text/plain`
- `.html`, `.htm` → `text/html`
- `.css` → `text/css`
- `.js` → `application/javascript`
- `.json` → `application/json`
- `.xml` → `application/xml`
- `.csv` → `text/csv`

### 图片文件
- `.png` → `image/png`
- `.jpg`, `.jpeg` → `image/jpeg`
- `.gif` → `image/gif`
- `.bmp` → `image/bmp`
- `.webp` → `image/webp`
- `.svg` → `image/svg+xml`
- `.ico` → `image/x-icon`

### 视频文件
- `.mp4` → `video/mp4`
- `.avi` → `video/x-msvideo`
- `.mov` → `video/quicktime`
- `.wmv` → `video/x-ms-wmv`
- `.flv` → `video/x-flv`
- `.webm` → `video/webm`

### 音频文件
- `.mp3` → `audio/mpeg`
- `.wav` → `audio/wav`
- `.ogg` → `audio/ogg`
- `.m4a` → `audio/mp4`
- `.flac` → `audio/flac`

### 文档文件
- `.pdf` → `application/pdf`
- `.doc` → `application/msword`
- `.docx` → `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `.xls` → `application/vnd.ms-excel`
- `.xlsx` → `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `.ppt` → `application/vnd.ms-powerpoint`
- `.pptx` → `application/vnd.openxmlformats-officedocument.presentationml.presentation`

### 压缩文件
- `.zip` → `application/zip`
- `.rar` → `application/x-rar-compressed`
- `.7z` → `application/x-7z-compressed`
- `.tar` → `application/x-tar`
- `.gz` → `application/gzip`

## 注意事项

### ⚠️ 路径分隔符

支持 Windows 和 Unix 路径：

```java
FileUtils.getFileName("C:\\path\\file.txt");  // file.txt
FileUtils.getFileName("/path/to/file.txt");   // file.txt
```

### ⚠️ 文件大小精度

```java
// 保留两位小数
FileUtils.getFileSize(1536000);  // 1.46MB
```

## 相关工具

- [IO 工具](/modules/util/common/io) - IO 流处理
- [字符串工具](/modules/util/common/string) - 路径字符串处理
