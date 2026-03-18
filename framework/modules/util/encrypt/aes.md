# AES 加密工具

`AesUtil` 提供 AES（Advanced Encryption Standard）对称加密功能，是目前最常用的对称加密算法之一。

## 类信息

- **包名**: `com.molandev.framework.util.encrypt`
- **类名**: `AesUtil`
- **类型**: 静态工具类

## 使用场景

- ✅ 敏感数据加密存储（如用户密码、身份证号）
- ✅ 数据传输加密
- ✅ 配置文件加密
- ✅ Token 加密
- ✅ 需要高性能加密场景

## 基础使用

### 简单加密解密

```java
import com.molandev.framework.util.encrypt.AesUtil;

public class AesExample {
    public static void main(String[] args) {
        String key = "mySecretKey";
        String content = "敏感数据";
        
        // 加密
        String encrypted = AesUtil.encrypt(content, key);
        System.out.println("加密后: " + encrypted);
        // 输出: jK8Xz... (Base64 编码的密文)
        
        // 解密
        String decrypted = AesUtil.decrypt(encrypted, key);
        System.out.println("解密后: " + decrypted);
        // 输出: 敏感数据
    }
}
```

## 核心方法

### encrypt

加密字符串内容。

```java
public static String encrypt(String content, String password)
```

**参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| content | String | 是 | 待加密的明文内容 |
| password | String | 是 | 加密密钥（1-16位字符） |

**返回值**：`String` - Base64 编码的密文

**异常**：
- `IllegalArgumentException` - 密钥为空或超出长度限制

**示例**：

```java
String encrypted = AesUtil.encrypt("Hello World", "key123");
```

---

### decrypt

解密字符串内容。

```java
public static String decrypt(String content, String password)
```

**参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| content | String | 是 | 待解密的密文（Base64 编码） |
| password | String | 是 | 解密密钥（必须与加密时一致） |

**返回值**：`String` - 解密后的明文

**异常**：
- `IllegalArgumentException` - 密钥错误或密文格式错误

**示例**：

```java
String decrypted = AesUtil.decrypt("jK8Xz...", "key123");
```

---

### encrypt (自定义算法)

使用自定义加密算法进行加密。

```java
public static String encrypt(String content, String password, String aesCipherAlgorithm)
```

**参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| content | String | 是 | 待加密的明文内容 |
| password | String | 是 | 加密密钥 |
| aesCipherAlgorithm | String | 是 | AES 加密算法（如 "AES/CBC/PKCS5Padding"） |

**返回值**：`String` - 加密后的密文

**示例**：

```java
String encrypted = AesUtil.encrypt("data", "key", "AES/CBC/PKCS5Padding");
```

---

### decrypt (自定义算法)

使用自定义算法进行解密。

```java
public static String decrypt(String content, String password, String aesCipherAlgorithm)
```

**参数**：同 `encrypt` 方法

## 完整示例

### 示例 1：用户密码加密

```java
import com.molandev.framework.util.encrypt.AesUtil;

public class PasswordEncryption {
    
    private static final String AES_KEY = "MyApp2024Secret!";
    
    /**
     * 加密用户密码
     */
    public String encryptPassword(String rawPassword) {
        return AesUtil.encrypt(rawPassword, AES_KEY);
    }
    
    /**
     * 验证密码
     */
    public boolean verifyPassword(String rawPassword, String encryptedPassword) {
        try {
            String decrypted = AesUtil.decrypt(encryptedPassword, AES_KEY);
            return rawPassword.equals(decrypted);
        } catch (Exception e) {
            return false;
        }
    }
    
    public static void main(String[] args) {
        PasswordEncryption pe = new PasswordEncryption();
        
        String password = "User@123456";
        String encrypted = pe.encryptPassword(password);
        System.out.println("加密后: " + encrypted);
        
        boolean valid = pe.verifyPassword("User@123456", encrypted);
        System.out.println("验证结果: " + valid); // true
    }
}
```

### 示例 2：配置文件敏感信息加密

```java
import com.molandev.framework.util.encrypt.AesUtil;
import java.util.Properties;

public class ConfigEncryption {
    
    private static final String KEY = "ConfigKey123456";
    
    /**
     * 加密配置项
     */
    public static String encryptConfig(String value) {
        return "ENC(" + AesUtil.encrypt(value, KEY) + ")";
    }
    
    /**
     * 解密配置项
     */
    public static String decryptConfig(String encryptedValue) {
        if (encryptedValue.startsWith("ENC(") && encryptedValue.endsWith(")")) {
            String encrypted = encryptedValue.substring(4, encryptedValue.length() - 1);
            return AesUtil.decrypt(encrypted, KEY);
        }
        return encryptedValue;
    }
    
    public static void main(String[] args) {
        // 加密数据库密码
        String dbPassword = "root@123";
        String encrypted = encryptConfig(dbPassword);
        System.out.println("application.yml 中配置: " + encrypted);
        // 输出: ENC(jK8Xz...)
        
        // 读取配置时解密
        String decrypted = decryptConfig(encrypted);
        System.out.println("解密后的密码: " + decrypted);
        // 输出: root@123
    }
}
```

### 示例 3：数据传输加密

```java
import com.molandev.framework.util.encrypt.AesUtil;
import com.molandev.framework.util.DateUtils;

public class DataTransfer {
    
    private static final String TRANSFER_KEY = "TransferKey@2024";
    
    /**
     * 加密传输数据
     */
    public static String encryptData(String data) {
        String timestamp = DateUtils.now();
        String content = data + "|" + timestamp;
        return AesUtil.encrypt(content, TRANSFER_KEY);
    }
    
    /**
     * 解密并验证数据
     */
    public static String decryptData(String encrypted) {
        String decrypted = AesUtil.decrypt(encrypted, TRANSFER_KEY);
        String[] parts = decrypted.split("\\|");
        
        if (parts.length == 2) {
            System.out.println("数据: " + parts[0]);
            System.out.println("时间戳: " + parts[1]);
            return parts[0];
        }
        
        throw new IllegalArgumentException("数据格式错误");
    }
    
    public static void main(String[] args) {
        String data = "用户ID:12345,订单金额:999.99";
        
        // 发送方：加密数据
        String encrypted = encryptData(data);
        System.out.println("传输的加密数据: " + encrypted);
        
        // 接收方：解密数据
        String original = decryptData(encrypted);
        System.out.println("原始数据: " + original);
    }
}
```

## 技术细节

### 加密算法

- **默认算法**: `AES/ECB/PKCS5Padding`
- **密钥长度**: 128 位（16 字节）
- **编码方式**: UTF-8
- **输出格式**: Base64

### 密钥处理

工具会自动处理密钥长度：
- 密钥长度 < 16: 自动补充 '0' 至 16 位
- 密钥长度 = 16: 直接使用
- 密钥长度 > 16: 抛出异常

```java
// 密钥 "key" 会被自动填充为 "key0000000000000"
String encrypted = AesUtil.encrypt("data", "key");
```

## 注意事项

### ⚠️ 密钥管理

```java
// ❌ 不要在代码中硬编码密钥
public static final String KEY = "mykey123";

// ✅ 推荐：从配置文件或环境变量读取
String key = System.getenv("AES_KEY");
```

### ⚠️ 密钥长度

```java
// ❌ 密钥过长会抛出异常
AesUtil.encrypt("data", "thisKeyIsLongerThan16Characters"); // 异常

// ✅ 密钥应在 1-16 字符之间
AesUtil.encrypt("data", "validKey123");
```

### ⚠️ 加解密一致性

```java
// ❌ 加密和解密必须使用相同的密钥
String encrypted = AesUtil.encrypt("data", "key1");
AesUtil.decrypt(encrypted, "key2"); // 解密失败

// ✅ 使用相同密钥
String encrypted = AesUtil.encrypt("data", "key1");
String decrypted = AesUtil.decrypt(encrypted, "key1"); // 成功
```

### ⚠️ 异常处理

```java
try {
    String encrypted = AesUtil.encrypt("data", "key");
} catch (IllegalArgumentException e) {
    // 处理加密异常（密钥错误等）
    logger.error("加密失败", e);
}
```

## 性能说明

- **加密速度**: 约 100MB/s（取决于硬件）
- **内存占用**: 低，无状态设计
- **线程安全**: 是

## 安全建议

1. **定期更换密钥**: 建议定期更换加密密钥
2. **密钥存储**: 密钥应存储在安全的地方，不要提交到版本控制
3. **使用强密钥**: 密钥应包含字母、数字、特殊字符
4. **加盐处理**: 对于密码加密，建议配合盐值使用

## 常见问题

### Q: AES 和 RSA 如何选择？

A: 
- **AES**: 对称加密，性能高，适合大量数据加密
- **RSA**: 非对称加密，适合密钥交换和数字签名

### Q: 为什么密钥最长只支持 16 字符？

A: 这是 AES-128 的标准，16 字节（128位）密钥已经足够安全。如需更高安全性，可以使用自定义算法方法。

### Q: 加密后的数据可以存储到数据库吗？

A: 可以，加密结果是 Base64 字符串，可以安全存储到 VARCHAR 字段。

## 相关工具

- [RSA 加密](/modules/util/encrypt/rsa) - 非对称加密
- [MD5 工具](/modules/util/encrypt/md5) - 摘要算法
- [敏感信息脱敏](/modules/util/encrypt/sensitive) - 数据脱敏
