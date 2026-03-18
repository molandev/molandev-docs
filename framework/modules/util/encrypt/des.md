# DES 加密工具

`DesUtil` 提供 DES（Data Encryption Standard）对称加密功能。

## 类信息

- **包名**: `com.molandev.framework.util.encrypt`
- **类名**: `DesUtil`
- **类型**: 静态工具类

## 使用场景

- ✅ 简单数据加密
- ✅ 兼容旧系统
- ✅ 性能要求不高的场景

::: warning 安全提示
DES 已不再安全，建议使用 [AES 加密](/modules/util/encrypt/aes)。仅在需要兼容旧系统时使用。
:::

## 核心方法

### encrypt - 加密

```java
public static String encrypt(String content, String password)
```

使用 DES 加密字符串。

**参数**:
- `content`: 待加密内容
- `password`: 密钥（1-8位字符）

**返回值**: 十六进制加密字符串

**示例**:
```java
String encrypted = DesUtil.encrypt("Hello", "mykey");
```

---

### decrypt - 解密

```java
public static String decrypt(String content, String password)
```

解密 DES 加密的数据。

**示例**:
```java
String decrypted = DesUtil.decrypt(encrypted, "mykey");
```

## 完整示例

### 示例 1：基础加密

```java
import com.molandev.framework.util.encrypt.DesUtil;

public class DesExample {
    
    public static void main(String[] args) {
        String key = "mykey123";
        String content = "敏感数据";
        
        // 加密
        String encrypted = DesUtil.encrypt(content, key);
        System.out.println("加密: " + encrypted);
        
        // 解密
        String decrypted = DesUtil.decrypt(encrypted, key);
        System.out.println("解密: " + decrypted);
    }
}
```

### 示例 2：配置文件加密

```java
import com.molandev.framework.util.encrypt.DesUtil;
import java.util.Properties;

public class ConfigEncryption {
    
    private static final String KEY = "config88";
    
    public static String encryptConfig(String value) {
        return "DES(" + DesUtil.encrypt(value, KEY) + ")";
    }
    
    public static String decryptConfig(String value) {
        if (value.startsWith("DES(") && value.endsWith(")")) {
            String encrypted = value.substring(4, value.length() - 1);
            return DesUtil.decrypt(encrypted, KEY);
        }
        return value;
    }
    
    public static void main(String[] args) {
        String password = "db@password";
        String encrypted = encryptConfig(password);
        System.out.println("配置值: " + encrypted);
        
        String decrypted = decryptConfig(encrypted);
        System.out.println("解密后: " + decrypted);
    }
}
```

## 技术细节

### 密钥要求

- **密钥长度**: 8 字节（64 位）
- **自动填充**: 不足 8 位自动补 '0'
- **超长报错**: 超过 8 位抛出异常

```java
// 自动填充
DesUtil.encrypt("data", "key"); // "key" → "key00000"

// 超长报错
DesUtil.encrypt("data", "verylongkey"); // 异常
```

### 加密模式

默认使用 `DES/ECB/PKCS5Padding` 模式。

## 注意事项

### ⚠️ 安全性

```java
// ❌ DES 已不安全，不推荐新项目使用
DesUtil.encrypt("重要数据", "key");

// ✅ 推荐使用 AES
AesUtil.encrypt("重要数据", "key");
```

### ⚠️ 密钥长度

```java
// ❌ 密钥过长会报错
DesUtil.encrypt("data", "toolongkey"); // 异常

// ✅ 密钥最多 8 位
DesUtil.encrypt("data", "key12345"); // 正确
```

## 性能说明

- **速度**: 快于 RSA，慢于 AES
- **安全性**: 低，不推荐
- **替代方案**: [AES 加密](/modules/util/encrypt/aes)

## 常见问题

### Q: DES 和 AES 有什么区别？

A:
- **DES**: 56位密钥，已不安全
- **AES**: 128/192/256位密钥，安全可靠
- **建议**: 使用 AES

### Q: 为什么还保留 DES？

A: 仅用于兼容旧系统，新项目应使用 AES。

## 相关工具

- [AES 加密](/modules/util/encrypt/aes) - 推荐的对称加密
- [RSA 加密](/modules/util/encrypt/rsa) - 非对称加密
