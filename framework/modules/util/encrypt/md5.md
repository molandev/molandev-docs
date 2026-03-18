# MD5 工具

`Md5Utils` 提供 MD5 消息摘要算法，常用于数据签名、文件校验等场景。

## 类信息

- **包名**: `com.molandev.framework.util.encrypt`
- **类名**: `Md5Utils`
- **类型**: 静态工具类

## 使用场景

- ✅ 密码加密存储
- ✅ 文件完整性校验
- ✅ 数据签名验证
- ✅ 生成唯一标识
- ✅ API 签名

## 基础使用

```java
import com.molandev.framework.util.encrypt.Md5Utils;

// 字符串 MD5
String hash = Md5Utils.md5("password123");
System.out.println(hash);
// 输出: 482c811da5d5b4bc6d497ffa98491e38

// 文件 MD5
File file = new File("/path/to/file.txt");
String fileHash = Md5Utils.md5(file);
System.out.println(fileHash);
```

## 核心方法

### md5(String) - 字符串 MD5

```java
public static String md5(String content)
```

使用 UTF-8 编码计算字符串的 MD5 值。

**参数**:
- `content`: 待计算的字符串

**返回值**: 32位十六进制 MD5 字符串

**示例**:
```java
String hash = Md5Utils.md5("hello");
// 5d41402abc4b2a76b9719d911017c592
```

---

### md5(String, String) - 指定编码的 MD5

```java
public static String md5(String content, String charset)
```

使用指定字符集计算 MD5。

**参数**:
- `content`: 待计算的字符串
- `charset`: 字符集（如 "UTF-8"、"GBK"）

**示例**:
```java
String hash = Md5Utils.md5("你好", "UTF-8");
String hash2 = Md5Utils.md5("你好", "GBK");
// 不同编码产生不同的 MD5
```

---

### md5(File) - 文件 MD5

```java
public static String md5(File file)
```

计算文件的 MD5 值，用于文件完整性校验。

**参数**:
- `file`: 文件对象

**返回值**: 文件的 MD5 值

**示例**:
```java
File file = new File("document.pdf");
String fileMd5 = Md5Utils.md5(file);
System.out.println("文件MD5: " + fileMd5);
```

---

### md5(byte[]) - 字节数组 MD5

```java
public static String md5(byte[] bytes)
```

计算字节数组的 MD5 值。

**示例**:
```java
byte[] data = "hello".getBytes();
String hash = Md5Utils.md5(data);
```

## 完整示例

### 示例 1：用户密码加密

```java
import com.molandev.framework.util.encrypt.Md5Utils;

public class PasswordService {
    
    /**
     * 密码加密（加盐）
     */
    public static String encryptPassword(String password, String salt) {
        // 密码 + 盐值 后进行 MD5
        String combined = password + salt;
        return Md5Utils.md5(combined);
    }
    
    /**
     * 验证密码
     */
    public static boolean verifyPassword(String rawPassword, String salt, 
                                         String hashedPassword) {
        String hash = encryptPassword(rawPassword, salt);
        return hash.equals(hashedPassword);
    }
    
    public static void main(String[] args) {
        String password = "user@123";
        String salt = "randomSalt123";
        
        // 注册时加密
        String hashed = encryptPassword(password, salt);
        System.out.println("加密后: " + hashed);
        
        // 登录时验证
        boolean valid = verifyPassword("user@123", salt, hashed);
        System.out.println("验证结果: " + valid);  // true
        
        boolean invalid = verifyPassword("wrong", salt, hashed);
        System.out.println("错误密码: " + invalid); // false
    }
}
```

### 示例 2：文件上传校验

```java
import com.molandev.framework.util.encrypt.Md5Utils;
import java.io.File;
import java.util.HashMap;
import java.util.Map;

public class FileUploadService {
    
    // 模拟文件 MD5 数据库
    private static Map<String, String> fileDatabase = new HashMap<>();
    
    /**
     * 上传前检查文件是否已存在（秒传）
     */
    public static boolean isFileExists(File file) {
        String fileMd5 = Md5Utils.md5(file);
        return fileDatabase.containsKey(fileMd5);
    }
    
    /**
     * 保存文件记录
     */
    public static void saveFile(File file, String filePath) {
        String fileMd5 = Md5Utils.md5(file);
        fileDatabase.put(fileMd5, filePath);
        System.out.println("文件已保存，MD5: " + fileMd5);
    }
    
    /**
     * 验证文件完整性
     */
    public static boolean verifyFileIntegrity(File file, String expectedMd5) {
        String actualMd5 = Md5Utils.md5(file);
        return actualMd5.equals(expectedMd5);
    }
    
    public static void main(String[] args) {
        File file = new File("upload.txt");
        
        // 检查是否秒传
        if (isFileExists(file)) {
            System.out.println("文件已存在，秒传成功");
        } else {
            saveFile(file, "/uploads/upload.txt");
        }
        
        // 文件完整性校验
        String md5 = Md5Utils.md5(file);
        boolean valid = verifyFileIntegrity(file, md5);
        System.out.println("文件完整性: " + valid);
    }
}
```

### 示例 3：API 签名

```java
import com.molandev.framework.util.encrypt.Md5Utils;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

public class ApiSignature {
    
    private static final String API_SECRET = "your-api-secret";
    
    /**
     * 生成 API 签名
     */
    public static String generateSign(Map<String, String> params) {
        // 1. 参数按 key 排序
        TreeMap<String, String> sortedParams = new TreeMap<>(params);
        
        // 2. 拼接参数：key1=value1&key2=value2
        String paramStr = sortedParams.entrySet().stream()
            .map(e -> e.getKey() + "=" + e.getValue())
            .collect(Collectors.joining("&"));
        
        // 3. 加上密钥
        String signStr = paramStr + "&key=" + API_SECRET;
        
        // 4. MD5 加密
        return Md5Utils.md5(signStr).toUpperCase();
    }
    
    /**
     * 验证签名
     */
    public static boolean verifySign(Map<String, String> params, String sign) {
        String expectedSign = generateSign(params);
        return expectedSign.equals(sign);
    }
    
    public static void main(String[] args) {
        // 构建请求参数
        Map<String, String> params = new HashMap<>();
        params.put("appId", "10001");
        params.put("timestamp", "1705564800");
        params.put("userId", "12345");
        
        // 生成签名
        String sign = generateSign(params);
        System.out.println("签名: " + sign);
        
        // 服务端验证签名
        boolean valid = verifySign(params, sign);
        System.out.println("签名验证: " + valid);
    }
}
```

### 示例 4：生成唯一 ID

```java
import com.molandev.framework.util.encrypt.Md5Utils;

public class IdGenerator {
    
    /**
     * 根据内容生成唯一 ID
     */
    public static String generateId(String... contents) {
        String combined = String.join("|", contents);
        return Md5Utils.md5(combined);
    }
    
    public static void main(String[] args) {
        // 根据用户信息生成唯一标识
        String userId = generateId("user", "zhangsan@example.com", "13812345678");
        System.out.println("用户ID: " + userId);
        
        // 根据订单信息生成唯一标识
        String orderId = generateId("order", "20240118", "12345", "1000.00");
        System.out.println("订单ID: " + orderId);
    }
}
```

## 技术细节

### 算法特点

- **固定长度**: 无论输入多长，输出都是 128 位（32 字符十六进制）
- **不可逆**: 无法从 MD5 值反推原文
- **雪崩效应**: 输入微小变化会导致输出巨大变化
- **高效**: 计算速度快

```java
Md5Utils.md5("hello");   // 5d41402abc4b2a76b9719d911017c592
Md5Utils.md5("Hello");   // 8b1a9953c4611296a827abf8c47804d7
// 仅大小写不同，MD5 完全不同
```

## 安全建议

### ⚠️ 密码存储不要单独使用 MD5

```java
// ❌ 不安全：容易被彩虹表破解
String hash = Md5Utils.md5("password");

// ✅ 推荐：加盐后使用
String salt = generateRandomSalt();
String hash = Md5Utils.md5(password + salt);
```

### ⚠️ 不要用于加密

```java
// ❌ MD5 是摘要算法，不是加密算法
// 无法解密，不要用于需要还原的场景

// ✅ 需要加解密请使用 AES 或 RSA
String encrypted = AesUtil.encrypt("data", "key");
```

### ✅ 适用场景

- 文件完整性校验
- 数据签名（配合密钥）
- 生成唯一标识
- 密码存储（配合盐值）

## 性能说明

- **速度**: 非常快，约 500MB/s
- **内存**: 低内存占用
- **线程安全**: 是

## 常见问题

### Q: MD5 是否已被破解？

A: MD5 存在碰撞漏洞，不再适合安全要求高的场景。建议密码存储使用 BCrypt，文件校验可考虑 SHA-256。

### Q: 为什么相同内容的 MD5 值不同？

A: 检查字符编码是否一致。`Md5Utils.md5(String)` 默认使用 UTF-8。

### Q: 如何防止 MD5 彩虹表攻击？

A: 加盐（Salt）+ MD5，每个用户使用不同的盐值。

```java
// 每个用户独立的盐值
String salt = UUID.randomUUID().toString();
String hash = Md5Utils.md5(password + salt);
```

## 相关工具

- [SHA 工具](/modules/util/encrypt/sha) - 更安全的摘要算法
- [AES 加密](/modules/util/encrypt/aes) - 对称加密
- [RSA 加密](/modules/util/encrypt/rsa) - 非对称加密
