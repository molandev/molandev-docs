# IO 工具

`IOUtils` 提供便捷的 IO 流操作方法。

## 类信息

- **包名**: `com.molandev.framework.util`
- **类名**: `IOUtils`
- **类型**: 静态工具类

## 核心方法

### readToString - 读取为字符串

```java
public static String readToString(InputStream in)
public static String readToString(InputStream in, String charset)
```

**示例**:
```java
FileInputStream fis = new FileInputStream("file.txt");
String content = IOUtils.readToString(fis);
```

---

### readToBytes - 读取为字节数组

```java
public static byte[] readToBytes(InputStream in)
```

**示例**:
```java
FileInputStream fis = new FileInputStream("image.png");
byte[] bytes = IOUtils.readToBytes(fis);
```

---

### writeToStream - 写入流

```java
public static void writeToStream(String content, OutputStream out)
public static void writeToStream(String content, OutputStream out, String charset)
public static void writeToStream(byte[] bytes, OutputStream out)
```

**示例**:
```java
FileOutputStream fos = new FileOutputStream("output.txt");
IOUtils.writeToStream("Hello World", fos);
```

---

### readAndWrite - 流复制

```java
public static void readAndWrite(InputStream in, OutputStream out)
```

**示例**:
```java
FileInputStream fis = new FileInputStream("source.txt");
FileOutputStream fos = new FileOutputStream("dest.txt");
IOUtils.readAndWrite(fis, fos);
```

---

### toInputStream - 字符串转流

```java
public static InputStream toInputStream(String input, String charsetName)
```

**示例**:
```java
InputStream is = IOUtils.toInputStream("Hello", "UTF-8");
```

---

### readFromClassPath - 读取类路径文件

```java
public static String readFromClassPath(String templatePath)
```

**示例**:
```java
String content = IOUtils.readFromClassPath("classpath:template.txt");
```

---

### closeQuietly - 安静关闭

```java
public static void closeQuietly(Closeable closeable)
```

自动关闭流，忽略异常。

**示例**:
```java
InputStream is = null;
try {
    is = new FileInputStream("file.txt");
    // 处理...
} finally {
    IOUtils.closeQuietly(is); // 安全关闭
}
```

## 完整示例

### 示例 1：文件复制

```java
import com.molandev.framework.util.IOUtils;
import java.io.*;

public class FileCopy {
    
    public static void copyFile(String source, String dest) {
        try {
            FileInputStream fis = new FileInputStream(source);
            FileOutputStream fos = new FileOutputStream(dest);
            IOUtils.readAndWrite(fis, fos);
            System.out.println("文件复制成功");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    
    public static void main(String[] args) {
        copyFile("source.txt", "backup.txt");
    }
}
```

### 示例 2：读取配置文件

```java
import com.molandev.framework.util.IOUtils;

public class ConfigReader {
    
    public static String loadTemplate(String name) {
        return IOUtils.readFromClassPath("templates/" + name);
    }
    
    public static void main(String[] args) {
        String emailTemplate = loadTemplate("email.html");
        System.out.println(emailTemplate);
    }
}
```

### 示例 3：下载文件

```java
import com.molandev.framework.util.IOUtils;
import java.io.*;
import java.net.URL;

public class FileDownloader {
    
    public static void download(String url, String savePath) {
        try {
            InputStream is = new URL(url).openStream();
            FileOutputStream fos = new FileOutputStream(savePath);
            IOUtils.readAndWrite(is, fos);
            System.out.println("下载完成: " + savePath);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    
    public static void main(String[] args) {
        download("http://example.com/file.pdf", "download.pdf");
    }
}
```

## 注意事项

### ⚠️ 资源关闭

```java
// ✅ 方法内部已自动关闭流
String content = IOUtils.readToString(fis); // fis会被关闭

// ⚠️ 多次使用同一个流需注意
InputStream is = ...;
IOUtils.readToString(is); // is已关闭
IOUtils.readToString(is); // 错误！流已关闭
```

### ⚠️ 大文件处理

```java
// ❌ 不适合超大文件（会全部读入内存）
byte[] bigFile = IOUtils.readToBytes(hugeFileStream);

// ✅ 大文件使用流式处理
IOUtils.readAndWrite(bigFileInput, output);
```

## 相关工具

- [文件工具](/modules/util/common/file) - 文件信息处理
- [Base64 工具](/modules/util/encrypt/base64) - 二进制编码
