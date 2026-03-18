# RSA 加密工具

`RsaUtil` 提供 RSA 非对称加密功能，支持公钥加密私钥解密、私钥加密公钥解密等操作。

## 类信息

- **包名**: `com.molandev.framework.util.encrypt`
- **类名**: `RsaUtil`
- **类型**: 静态工具类

## 使用场景

- ✅ 密钥交换
- ✅ 数字签名
- ✅ 敏感数据加密传输
- ✅ 授权验证
- ✅ 许可证加密

## 核心概念

RSA 是非对称加密算法，有两个密钥：
- **公钥**：可以公开，用于加密
- **私钥**：必须保密，用于解密

## 核心方法

### createKeys - 生成密钥对

```java
public static String[] createKeys(int keySize)
```

生成 RSA 公私钥对。

**参数**:
- `keySize`: 密钥长度（推荐 1024 或 2048）

**返回值**: String[] - [0]=公钥, [1]=私钥

**示例**:
```java
String[] keys = RsaUtil.createKeys(1024);
String publicKey = keys[0];
String privateKey = keys[1];
```

---

### publicEncrypt - 公钥加密

```java
public static String publicEncrypt(String data, String publicKey)
```

使用公钥加密数据。

**示例**:
```java
String encrypted = RsaUtil.publicEncrypt("敏感数据", publicKey);
```

---

### privateDecrypt - 私钥解密

```java
public static String privateDecrypt(String data, String privateKey)
```

使用私钥解密数据。

**示例**:
```java
String decrypted = RsaUtil.privateDecrypt(encrypted, privateKey);
```

---

### privateEncrypt - 私钥加密

```java
public static String privateEncrypt(String data, RSAPrivateKey privateKey)
```

使用私钥加密（通常用于数字签名）。

---

### publicDecrypt - 公钥解密

```java
public static String publicDecrypt(String data, RSAPublicKey publicKey)
```

使用公钥解密私钥加密的数据。

## 完整示例

### 示例 1：数据加密传输

```java
import com.molandev.framework.util.encrypt.RsaUtil;

public class DataTransfer {
    
    public static void main(String[] args) {
        // 1. 生成密钥对
        String[] keys = RsaUtil.createKeys(1024);
        String publicKey = keys[0];
        String privateKey = keys[1];
        
        System.out.println("公钥: " + publicKey);
        System.out.println("私钥: " + privateKey);
        
        // 2. 公钥加密
        String data = "用户ID:12345,金额:1000元";
        String encrypted = RsaUtil.publicEncrypt(data, publicKey);
        System.out.println("加密: " + encrypted);
        
        // 3. 私钥解密
        String decrypted = RsaUtil.privateDecrypt(encrypted, privateKey);
        System.out.println("解密: " + decrypted);
    }
}
```

### 示例 2：数字签名

```java
import com.molandev.framework.util.encrypt.RsaUtil;

public class DigitalSignature {
    
    private String privateKey;
    private String publicKey;
    
    public DigitalSignature() {
        String[] keys = RsaUtil.createKeys(1024);
        this.publicKey = keys[0];
        this.privateKey = keys[1];
    }
    
    /**
     * 签名数据
     */
    public String sign(String data) {
        return RsaUtil.privateEncrypt(data, 
            RsaUtil.getPrivateKey(privateKey));
    }
    
    /**
     * 验证签名
     */
    public boolean verify(String data, String signature) {
        try {
            String decrypted = RsaUtil.publicDecrypt(signature, 
                RsaUtil.getPublicKey(publicKey));
            return data.equals(decrypted);
        } catch (Exception e) {
            return false;
        }
    }
    
    public static void main(String[] args) {
        DigitalSignature ds = new DigitalSignature();
        
        String data = "重要文件内容";
        String signature = ds.sign(data);
        System.out.println("签名: " + signature);
        
        boolean valid = ds.verify(data, signature);
        System.out.println("验证结果: " + valid); // true
        
        boolean invalid = ds.verify("篡改的内容", signature);
        System.out.println("篡改验证: " + invalid); // false
    }
}
```

### 示例 3：前后端加密通信

```java
import com.molandev.framework.util.encrypt.RsaUtil;

public class SecureCommunication {
    
    // 服务端密钥
    static class Server {
        private static String[] keys = RsaUtil.createKeys(2048);
        private static String publicKey = keys[0];
        private static String privateKey = keys[1];
        
        public static String getPublicKey() {
            return publicKey;
        }
        
        public static String decrypt(String encryptedData) {
            return RsaUtil.privateDecrypt(encryptedData, privateKey);
        }
    }
    
    // 客户端
    static class Client {
        private String serverPublicKey;
        
        public Client(String serverPublicKey) {
            this.serverPublicKey = serverPublicKey;
        }
        
        public String encrypt(String data) {
            return RsaUtil.publicEncrypt(data, serverPublicKey);
        }
    }
    
    public static void main(String[] args) {
        // 1. 客户端获取服务端公钥
        String publicKey = Server.getPublicKey();
        
        // 2. 客户端加密敏感数据
        Client client = new Client(publicKey);
        String password = "user@password123";
        String encrypted = client.encrypt(password);
        System.out.println("客户端加密: " + encrypted);
        
        // 3. 服务端解密
        String decrypted = Server.decrypt(encrypted);
        System.out.println("服务端解密: " + decrypted);
    }
}
```

## 技术细节

### 密钥长度

- **512位**: 已不安全，不推荐
- **1024位**: 一般安全性，性能较好
- **2048位**: 高安全性（推荐）
- **4096位**: 最高安全性，性能较慢

### 数据长度限制

RSA 加密有数据长度限制：
- 加密数据长度 < (密钥长度/8 - 11) 字节
- 1024位密钥最多加密 117 字节
- 2048位密钥最多加密 245 字节

工具类已自动处理分块加密，支持任意长度数据。

## 注意事项

### ⚠️ 密钥保存

```java
// ❌ 不要硬编码私钥
public static final String PRIVATE_KEY = "MIICd...";

// ✅ 从配置文件或密钥管理系统读取
String privateKey = loadFromConfig();
```

### ⚠️ RSA vs AES

```java
// ❌ 不要用 RSA 加密大量数据
String bigData = "...10MB数据...";
RsaUtil.publicEncrypt(bigData, publicKey); // 慢且不安全

// ✅ 混合加密：RSA 加密 AES 密钥，AES 加密数据
String aesKey = RandomUtils.randomString(16);
String encryptedKey = RsaUtil.publicEncrypt(aesKey, rsaPublicKey);
String encryptedData = AesUtil.encrypt(bigData, aesKey);
```

### ⚠️ 公私钥配对

```java
// ❌ 加密和解密必须使用配对的密钥
String encrypted = RsaUtil.publicEncrypt(data, publicKey1);
RsaUtil.privateDecrypt(encrypted, privateKey2); // 失败

// ✅ 使用同一密钥对
String[] keys = RsaUtil.createKeys(1024);
String encrypted = RsaUtil.publicEncrypt(data, keys[0]);
String decrypted = RsaUtil.privateDecrypt(encrypted, keys[1]); // 成功
```

## 性能说明

- **密钥生成**: 较慢（1024位约50ms，2048位约200ms）
- **加密速度**: 慢于对称加密（约为 AES 的 1/1000）
- **适用场景**: 小数据加密、密钥交换、数字签名

## 常见问题

### Q: RSA 和 AES 如何选择？

A:
- **RSA**: 非对称，安全性高，适合密钥交换和小数据
- **AES**: 对称，速度快，适合大数据加密
- **推荐**: 混合使用，RSA 传输 AES 密钥，AES 加密数据

### Q: 公钥可以公开吗？

A: 可以。公钥用于加密，即使被截获也无法解密数据。

### Q: 为什么加密速度这么慢？

A: RSA 基于大数分解，计算复杂度高。大量数据应使用 AES。

## 相关工具

- [AES 加密](/modules/util/encrypt/aes) - 对称加密
- [MD5 工具](/modules/util/encrypt/md5) - 数据摘要
- [Base64 工具](/modules/util/encrypt/base64) - 编码转换
