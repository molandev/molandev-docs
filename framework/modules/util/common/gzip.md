# 压缩工具

`GzipUtils` 提供 Gzip 压缩和解压缩功能。

## 类信息

- **包名**: `com.molandev.framework.util`
- **类名**: `GzipUtils`
- **类型**: 静态工具类

## 核心方法

### zip - 压缩

```java
public static byte[] zip(byte[] bs)
```

压缩字节数组。

**示例**:
```java
byte[] data = "Hello World".getBytes();
byte[] compressed = GzipUtils.zip(data);
```

---

### unzip - 解压

```java
public static byte[] unzip(byte[] bs)
```

解压缩字节数组。

**示例**:
```java
byte[] decompressed = GzipUtils.unzip(compressed);
String text = new String(decompressed); // Hello World
```

## 完整示例

### 示例 1：文本压缩

```java
import com.molandev.framework.util.GzipUtils;

public class TextCompression {
    
    public static void main(String[] args) {
        String text = "这是一段很长的文本...".repeat(100);
        
        // 压缩
        byte[] original = text.getBytes();
        byte[] compressed = GzipUtils.zip(original);
        
        System.out.println("原始大小: " + original.length + " bytes");
        System.out.println("压缩后: " + compressed.length + " bytes");
        System.out.println("压缩率: " + (100 - compressed.length * 100 / original.length) + "%");
        
        // 解压
        byte[] decompressed = GzipUtils.unzip(compressed);
        String result = new String(decompressed);
        
        System.out.println("解压成功: " + result.equals(text));
    }
}
```

### 示例 2：HTTP响应压缩

```java
import com.molandev.framework.util.GzipUtils;

public class HttpResponseCompression {
    
    public static byte[] compressResponse(String json) {
        return GzipUtils.zip(json.getBytes());
    }
    
    public static String decompressResponse(byte[] compressed) {
        byte[] decompressed = GzipUtils.unzip(compressed);
        return new String(decompressed);
    }
    
    public static void main(String[] args) {
        String json = "{\"users\":[...]}"; // 大JSON
        
        byte[] compressed = compressResponse(json);
        System.out.println("传输大小: " + compressed.length);
        
        String original = decompressResponse(compressed);
        System.out.println("解压后: " + original);
    }
}
```

## 注意事项

### ⚠️ 适用场景

```java
// ✅ 适合：大文本、重复数据
String bigText = "...很长的文本...";
GzipUtils.zip(bigText.getBytes()); // 压缩率高

// ❌ 不适合：小数据、已压缩数据
String small = "Hi";
GzipUtils.zip(small.getBytes()); // 反而变大
```

### ⚠️ 性能

压缩和解压都需要CPU计算，适合网络传输节省带宽。

## 相关工具

- [IO 工具](/modules/util/common/io) - 流操作
- [Base64 工具](/modules/util/encrypt/base64) - 编码传输
