# Base64 工具

`Base64Utils` 提供 Base64 编码和解码功能。

## 类信息

- **包名**: `com.molandev.framework.util.encrypt`
- **类名**: `Base64Utils`
- **类型**: 静态工具类

## 使用场景

- ✅ 二进制数据传输
- ✅ 图片数据嵌入
- ✅ URL 参数编码
- ✅ 邮件附件编码
- ✅ 加密结果编码

## 核心方法

### encode - 编码

```java
public static String encode(byte[] bytes)
```

将字节数组编码为 Base64 字符串。

**示例**:
```java
byte[] data = "Hello".getBytes();
String encoded = Base64Utils.encode(data);
// SGVsbG8=
```

---

### decode - 解码

```java
public static byte[] decode(String encoded)
```

将 Base64 字符串解码为字节数组。

**示例**:
```java
byte[] decoded = Base64Utils.decode("SGVsbG8=");
String text = new String(decoded);
// Hello
```

## 完整示例

### 示例 1：字符串编码

```java
import com.molandev.framework.util.encrypt.Base64Utils;

public class StringEncoding {
    
    public static void main(String[] args) {
        String text = "Hello, 世界!";
        
        // 编码
        byte[] bytes = text.getBytes("UTF-8");
        String encoded = Base64Utils.encode(bytes);
        System.out.println("编码: " + encoded);
        
        // 解码
        byte[] decoded = Base64Utils.decode(encoded);
        String original = new String(decoded, "UTF-8");
        System.out.println("解码: " + original);
    }
}
```

### 示例 2：图片转 Base64

```java
import com.molandev.framework.util.encrypt.Base64Utils;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;

public class ImageToBase64 {
    
    public static String imageToBase64(File imageFile) throws IOException {
        FileInputStream fis = new FileInputStream(imageFile);
        byte[] imageBytes = fis.readAllBytes();
        fis.close();
        
        return Base64Utils.encode(imageBytes);
    }
    
    public static void main(String[] args) throws IOException {
        File image = new File("photo.jpg");
        String base64 = imageToBase64(image);
        
        System.out.println("Base64 长度: " + base64.length());
        System.out.println("数据 URI: data:image/jpeg;base64," + base64);
    }
}
```

### 示例 3：URL 安全编码

```java
import com.molandev.framework.util.encrypt.Base64Utils;

public class UrlSafeEncoding {
    
    /**
     * URL 安全的 Base64 编码
     */
    public static String urlEncode(String text) {
        byte[] bytes = text.getBytes();
        String base64 = Base64Utils.encode(bytes);
        
        // 替换 URL 不安全字符
        return base64.replace("+", "-")
                    .replace("/", "_")
                    .replace("=", "");
    }
    
    /**
     * URL 安全的 Base64 解码
     */
    public static String urlDecode(String encoded) {
        // 还原字符
        String base64 = encoded.replace("-", "+")
                              .replace("_", "/");
        
        // 补充 padding
        while (base64.length() % 4 != 0) {
            base64 += "=";
        }
        
        byte[] bytes = Base64Utils.decode(base64);
        return new String(bytes);
    }
    
    public static void main(String[] args) {
        String text = "user=admin&token=abc123";
        
        String encoded = urlEncode(text);
        System.out.println("URL编码: " + encoded);
        
        String decoded = urlDecode(encoded);
        System.out.println("URL解码: " + decoded);
    }
}
```

## 技术细节

### 编码规则

Base64 将 3 个字节（24位）转换为 4 个可打印字符：
- 输入：3 字节 = 24 位
- 输出：4 个字符（每个 6 位）

### 字符集

```
A-Z, a-z, 0-9, +, /
(共 64 个字符，加上填充字符 =)
```

### 长度计算

```java
// 编码后长度约为原始数据的 4/3
原始 3 字节 → Base64 4 字符
原始 100 字节 → Base64 约 134 字符
```

## 注意事项

### ⚠️ 不是加密

```java
// ❌ Base64 不是加密，任何人都可以解码
String encoded = Base64Utils.encode("password".getBytes());
// 不安全！

// ✅ 需要加密请使用 AES
String encrypted = AesUtil.encrypt("password", "key");
```

### ⚠️ 编码增加长度

```java
// 编码后数据变大约 33%
byte[] original = new byte[100];  // 100 字节
String encoded = Base64Utils.encode(original);
// 约 134 字符
```

### ⚠️ URL 安全性

```java
// ❌ 标准 Base64 包含 +、/、= 在 URL 中不安全
String base64 = Base64Utils.encode(data);
String url = "http://api.com?data=" + base64; // 可能出错

// ✅ 使用 URL 安全编码
String urlSafe = urlEncode(data);
String url = "http://api.com?data=" + urlSafe;
```

## 性能说明

- **编码速度**: 非常快
- **内存占用**: 编码后约增加 33%
- **线程安全**: 是

## 常见问题

### Q: Base64 能保护数据安全吗？

A: 不能。Base64 是编码方式，不是加密。任何人都可以解码。

### Q: 为什么要用 Base64？

A: 将二进制数据转换为文本格式，便于在文本协议中传输（如 HTTP、Email）。

### Q: Base64 编码后为什么有 = 号？

A: `=` 是填充字符，用于补齐长度为 4 的倍数。

## 相关工具

- [AES 加密](/modules/util/encrypt/aes) - 真正的加密
- [十六进制转换](/modules/util/encrypt/hex) - 另一种编码方式
- [文件工具](/modules/util/common/file) - 文件操作
