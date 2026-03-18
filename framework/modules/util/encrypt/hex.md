# 十六进制转换工具

`Hex2Util` 提供字节数组与十六进制字符串的相互转换功能。

## 类信息

- **包名**: `com.molandev.framework.util.encrypt`
- **类名**: `Hex2Util`
- **类型**: 静态工具类

## 使用场景

- ✅ 加密结果展示
- ✅ 二进制数据可视化
- ✅ 调试输出
- ✅ 协议数据传输
- ✅ 哈希值显示

## 核心方法

### parseByte2HexStr - 字节转十六进制

```java
public static String parseByte2HexStr(byte[] buf)
```

将字节数组转换为十六进制字符串。

**示例**:
```java
byte[] bytes = {15, 255, 0, 127};
String hex = Hex2Util.parseByte2HexStr(bytes);
// 0FFF007F
```

---

### parseHexStr2Byte - 十六进制转字节

```java
public static byte[] parseHexStr2Byte(String hexStr)
```

将十六进制字符串转换为字节数组。

**示例**:
```java
byte[] bytes = Hex2Util.parseHexStr2Byte("0FFF007F");
// {15, -1, 0, 127}
```

## 完整示例

### 示例 1：加密结果显示

```java
import com.molandev.framework.util.encrypt.Hex2Util;
import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;

public class EncryptDisplay {
    
    public static void main(String[] args) throws Exception {
        String data = "Hello";
        String key = "1234567890123456";
        
        // AES 加密
        SecretKeySpec keySpec = new SecretKeySpec(key.getBytes(), "AES");
        Cipher cipher = Cipher.getInstance("AES");
        cipher.init(Cipher.ENCRYPT_MODE, keySpec);
        byte[] encrypted = cipher.doFinal(data.getBytes());
        
        // 转换为十六进制显示
        String hex = Hex2Util.parseByte2HexStr(encrypted);
        System.out.println("加密结果(Hex): " + hex);
        
        // 从十六进制恢复
        byte[] recovered = Hex2Util.parseHexStr2Byte(hex);
        // 可用于解密...
    }
}
```

### 示例 2：哈希值格式化

```java
import com.molandev.framework.util.encrypt.Hex2Util;
import java.security.MessageDigest;

public class HashFormatter {
    
    public static String formatHash(byte[] hashBytes) {
        String hex = Hex2Util.parseByte2HexStr(hashBytes);
        
        // 格式化为易读形式
        StringBuilder formatted = new StringBuilder();
        for (int i = 0; i < hex.length(); i += 2) {
            if (i > 0 && i % 8 == 0) {
                formatted.append(" ");
            }
            formatted.append(hex.substring(i, i + 2));
        }
        
        return formatted.toString();
    }
    
    public static void main(String[] args) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] hash = md.digest("password".getBytes());
        
        String formatted = formatHash(hash);
        System.out.println("SHA-256: " + formatted);
        // 5E884898 DA280471 51D1F6EC D9998D9D 23D9852B...
    }
}
```

### 示例 3：二进制数据调试

```java
import com.molandev.framework.util.encrypt.Hex2Util;

public class BinaryDebugger {
    
    /**
     * 打印字节数组的十六进制表示
     */
    public static void printHex(byte[] data, String label) {
        String hex = Hex2Util.parseByte2HexStr(data);
        
        System.out.println(label + ":");
        System.out.println("Length: " + data.length + " bytes");
        System.out.println("Hex: " + hex);
        System.out.println("Hex(formatted): " + formatHex(hex));
    }
    
    /**
     * 格式化输出（每16字节一行）
     */
    private static String formatHex(String hex) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < hex.length(); i += 32) {
            int end = Math.min(i + 32, hex.length());
            sb.append(hex.substring(i, end)).append("\n");
        }
        return sb.toString();
    }
    
    public static void main(String[] args) {
        byte[] data = "Hello World, 你好世界!".getBytes();
        printHex(data, "测试数据");
    }
}
```

## 技术细节

### 转换规则

```
十进制 → 十六进制
0-9   → 0-9
10-15 → A-F

示例：
255 (十进制) = 0xFF (十六进制)
16  (十进制) = 0x10 (十六进制)
```

### 大小写

工具类输出大写十六进制（`0-9A-F`）：

```java
Hex2Util.parseByte2HexStr(new byte[]{255}); // "FF"
```

## 注意事项

### ⚠️ 字符串长度

```java
// 十六进制字符串长度必须是偶数
Hex2Util.parseHexStr2Byte("0FFF");   // 正确（4字符）
Hex2Util.parseHexStr2Byte("0FFF0"); // 可能出错（5字符）
```

### ⚠️ 空值处理

```java
// 空字符串返回空数组
byte[] empty = Hex2Util.parseHexStr2Byte("");
// empty.length == 0

// null 返回空数组
byte[] nullArray = Hex2Util.parseHexStr2Byte(null);
// nullArray.length == 0
```

## 性能说明

- **转换速度**: 非常快
- **内存占用**: 低
- **线程安全**: 是

## 常见问题

### Q: Hex 和 Base64 如何选择？

A:
- **Hex**: 更直观，长度是原数据的 2 倍
- **Base64**: 更紧凑，长度约是原数据的 1.33 倍
- **使用场景**: Hex 用于调试和展示，Base64 用于传输

### Q: 为什么输出是大写？

A: 为了统一和规范，工具类统一输出大写十六进制。

## 相关工具

- [Base64 工具](/modules/util/encrypt/base64) - 另一种编码方式
- [MD5 工具](/modules/util/encrypt/md5) - 返回十六进制哈希
- [SHA 工具](/modules/util/encrypt/sha) - 返回十六进制哈希
