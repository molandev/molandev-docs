# SHA 工具

`ShaUtil` 提供 SHA（Secure Hash Algorithm）系列摘要算法，支持 SHA-1、SHA-256、SHA-512。

## 类信息

- **包名**: `com.molandev.framework.util.encrypt`
- **类名**: `ShaUtil`
- **类型**: 静态工具类

## 使用场景

- ✅ 密码存储（配合盐值）
- ✅ 文件完整性校验
- ✅ 数据签名
- ✅ 区块链应用
- ✅ 数字指纹

## 核心方法

### sha1 - SHA-1 加密

```java
public static String sha1(String input)
```

**示例**:
```java
String hash = ShaUtil.sha1("password");
// 输出 40 位十六进制字符串
```

---

### sha256 - SHA-256 加密

```java
public static String sha256(String input)
```

**示例**:
```java
String hash = ShaUtil.sha256("password");
// 输出 64 位十六进制字符串
```

---

### sha512 - SHA-512 加密

```java
public static String sha512(String input)
```

**示例**:
```java
String hash = ShaUtil.sha512("password");
// 输出 128 位十六进制字符串
```

---

### encryptFile - 文件加密

```java
public static String encryptFile(File file, String algorithm)
```

计算文件的 SHA 值。

**参数**:
- `file`: 文件对象
- `algorithm`: 算法（SHA_1、SHA_256、SHA_512）

**示例**:
```java
File file = new File("document.pdf");
String hash = ShaUtil.encryptFile(file, ShaUtil.SHA_256);
```

## 完整示例

### 示例 1：密码加密存储

```java
import com.molandev.framework.util.encrypt.ShaUtil;
import com.molandev.framework.util.RandomUtils;

public class PasswordService {
    
    /**
     * 注册用户（密码加密）
     */
    public static String[] register(String password) {
        // 生成随机盐值
        String salt = RandomUtils.randomString(16);
        
        // SHA-256 + 盐值
        String hash = ShaUtil.sha256(password + salt);
        
        return new String[]{hash, salt};
    }
    
    /**
     * 验证密码
     */
    public static boolean verify(String password, String hash, String salt) {
        String computedHash = ShaUtil.sha256(password + salt);
        return computedHash.equals(hash);
    }
    
    public static void main(String[] args) {
        String password = "User@123456";
        
        // 注册
        String[] result = register(password);
        String hash = result[0];
        String salt = result[1];
        
        System.out.println("密码哈希: " + hash);
        System.out.println("盐值: " + salt);
        
        // 登录验证
        boolean valid = verify("User@123456", hash, salt);
        System.out.println("验证结果: " + valid); // true
        
        boolean invalid = verify("WrongPassword", hash, salt);
        System.out.println("错误密码: " + invalid); // false
    }
}
```

### 示例 2：文件完整性校验

```java
import com.molandev.framework.util.encrypt.ShaUtil;
import java.io.File;
import java.util.HashMap;
import java.util.Map;

public class FileIntegrityChecker {
    
    // 存储文件哈希值
    private static Map<String, String> fileHashes = new HashMap<>();
    
    /**
     * 记录文件哈希
     */
    public static void recordFile(File file) {
        String hash = ShaUtil.encryptFile(file, ShaUtil.SHA_256);
        fileHashes.put(file.getName(), hash);
        System.out.println("记录文件: " + file.getName());
        System.out.println("SHA-256: " + hash);
    }
    
    /**
     * 验证文件是否被篡改
     */
    public static boolean verifyFile(File file) {
        String originalHash = fileHashes.get(file.getName());
        if (originalHash == null) {
            System.out.println("文件未记录");
            return false;
        }
        
        String currentHash = ShaUtil.encryptFile(file, ShaUtil.SHA_256);
        boolean valid = originalHash.equals(currentHash);
        
        System.out.println("文件: " + file.getName());
        System.out.println("原始哈希: " + originalHash);
        System.out.println("当前哈希: " + currentHash);
        System.out.println("完整性: " + (valid ? "通过" : "失败"));
        
        return valid;
    }
    
    public static void main(String[] args) {
        File file = new File("important.doc");
        
        // 记录原始文件
        recordFile(file);
        
        // 验证文件（未修改）
        verifyFile(file);
        
        // 如果文件被修改，验证会失败
    }
}
```

### 示例 3：数据签名

```java
import com.molandev.framework.util.encrypt.ShaUtil;
import com.molandev.framework.util.DateUtils;

public class DataSigner {
    
    private static final String SECRET_KEY = "MySecretKey2024";
    
    /**
     * 生成数据签名
     */
    public static String sign(String data) {
        // 数据 + 时间戳 + 密钥
        String timestamp = DateUtils.now();
        String combined = data + "|" + timestamp + "|" + SECRET_KEY;
        
        return ShaUtil.sha256(combined);
    }
    
    /**
     * 生成带签名的数据包
     */
    public static String createPacket(String data) {
        String timestamp = DateUtils.now();
        String signature = sign(data + "|" + timestamp);
        
        return data + "|" + timestamp + "|" + signature;
    }
    
    /**
     * 验证数据包签名
     */
    public static boolean verifyPacket(String packet) {
        String[] parts = packet.split("\\|");
        if (parts.length != 3) {
            return false;
        }
        
        String data = parts[0];
        String timestamp = parts[1];
        String signature = parts[2];
        
        String expectedSign = ShaUtil.sha256(
            data + "|" + timestamp + "|" + SECRET_KEY
        );
        
        return expectedSign.equals(signature);
    }
    
    public static void main(String[] args) {
        String data = "TransferAmount:1000";
        
        // 创建数据包
        String packet = createPacket(data);
        System.out.println("数据包: " + packet);
        
        // 验证数据包
        boolean valid = verifyPacket(packet);
        System.out.println("签名验证: " + valid); // true
        
        // 篡改数据包
        String tampered = packet.replace("1000", "9999");
        boolean invalid = verifyPacket(tampered);
        System.out.println("篡改验证: " + invalid); // false
    }
}
```

## 算法对比

| 算法 | 输出长度 | 安全性 | 速度 | 推荐场景 |
|------|---------|--------|------|---------|
| SHA-1 | 160位(40字符) | 低 | 快 | 不推荐使用 |
| SHA-256 | 256位(64字符) | 高 | 中 | **推荐** |
| SHA-512 | 512位(128字符) | 最高 | 慢 | 高安全场景 |

## 技术细节

### 特性

- **固定长度**: 任意长度输入→固定长度输出
- **不可逆**: 无法从哈希值反推原文
- **雪崩效应**: 输入微小变化→输出巨大变化
- **确定性**: 相同输入→相同输出

```java
ShaUtil.sha256("hello");  // 始终相同
ShaUtil.sha256("Hello");  // 完全不同（大小写敏感）
```

## 注意事项

### ⚠️ SHA-1 已不安全

```java
// ❌ SHA-1 存在碰撞漏洞
ShaUtil.sha1("password");

// ✅ 使用 SHA-256 或 SHA-512
ShaUtil.sha256("password");
```

### ⚠️ 密码存储必须加盐

```java
// ❌ 直接哈希密码容易被彩虹表攻击
String hash = ShaUtil.sha256("password");

// ✅ 加盐后哈希
String salt = RandomUtils.randomString(16);
String hash = ShaUtil.sha256("password" + salt);
```

### ⚠️ 不要用于加密

```java
// ❌ SHA 是哈希算法，不是加密算法
// 无法解密，不要用于需要还原的场景

// ✅ 需要加解密请使用 AES
String encrypted = AesUtil.encrypt("data", "key");
```

## 性能说明

- **SHA-1**: 最快，但不安全
- **SHA-256**: 速度与安全平衡（推荐）
- **SHA-512**: 最安全，但较慢
- **文件哈希**: 大文件采用流式处理，内存占用低

## 常见问题

### Q: SHA 和 MD5 有什么区别？

A:
- **SHA-256**: 256位，更安全
- **MD5**: 128位，已被破解
- **建议**: 使用 SHA-256

### Q: 为什么密码要加盐？

A: 防止彩虹表攻击。相同密码加盐后哈希值不同，提高安全性。

### Q: SHA-256 能解密吗？

A: 不能。SHA 是单向哈希，不可逆。

## 相关工具

- [MD5 工具](/modules/util/encrypt/md5) - 另一种摘要算法
- [AES 加密](/modules/util/encrypt/aes) - 可逆加密
- [随机数工具](/modules/util/common/random) - 生成盐值
