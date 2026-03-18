# 快速开始

本指南通过 5 个实战示例，帮助你在 **10 分钟内**掌握 molandev-encrypt 模块的核心功能。

::: tip 前置要求
- JDK 17+（推荐 JDK 21+）
- Spring Boot  3.x
- MyBatis 3.5+（使用数据库加密时）
:::

## 第一步：添加依赖

### Maven

```xml
<dependency>
    <groupId>com.molandev</groupId>
    <artifactId>molandev-encrypt</artifactId>
    <version>1.0.1</version>
</dependency>
```

### Gradle

```gradle
implementation 'com.molandev:molandev-encrypt:1.0.1'
```

::: warning 注意
数据库加密功能需要 MyBatis，混合加密需要 Spring Web。请根据需要添加对应依赖。
:::

## 第二步：选择使用场景

根据你的需求，选择一个或多个加密功能：

| 场景 | 推荐功能 | 快速导航 |
|------|----------|----------|
| 用户敏感信息存储 | 数据库字段加密 | [使用示例 1](#示例-1-数据库字段加密) |
| 支付、敏感 API 接口 | 混合加密通信 | [使用示例 2](#示例-2-混合加密通信) |
| 第三方 API 对接 | 签名校验 | [使用示例 3](#示例-3-签名校验) |
| 接口返回数据脱敏 | 敏感信息脱敏 | [使用示例 4](#示例-4-敏感信息脱敏) |

---

## 示例 1：数据库字段加密

### 场景

需要将用户的身份证号、手机号等敏感信息加密存储到数据库。

### 配置（3 行）

```yaml
molandev:
  encrypt:
    db:
      enabled: true
      type: AES
      key: your-secret-key-16  # 16字节密钥
```

### 代码（1 个注解）

```java
import com.molandev.framework.encrypt.db.Enc;

@Data
@TableName("t_user")
public class User {
    private Long id;
    private String username;
    
    @Enc  // ✅ 只需这一个注解！
    private String idCard;
    
    @Enc
    private String phone;
}
```

### 使用（透明无感）

```java
// 保存 - 自动加密
userMapper.insert(user);

// 查询 - 自动解密
User user = userMapper.selectById(1L);
```

::: tip 完成！
现在 idCard 和 phone 字段已经自动加密存储、自动解密查询了！
:::

详细文档：[数据库字段加密](./db-encrypt.md)

---

## 示例 2：混合加密通信

### 场景

需要对支付接口的请求和响应进行加密，防止数据被窃听。

### 第 1 步：生成 RSA 密钥对

```java
import com.molandev.framework.util.encrypt.RsaUtil;

public class KeyGenerator {
    public static void main(String[] args) {
        RsaUtil.KeyPairString keyPair = RsaUtil.generateKeyPair(2048);
        System.out.println("公钥: " + keyPair.getPublicKey());
        System.out.println("私钥: " + keyPair.getPrivateKey());
    }
}
```

### 第 2 步：后端配置

```yaml
molandev:
  encrypt:
    hybrid:
      enabled: true
      public-key: MIGfMA0GCSqGSIb3DQEBAQUAA...  # 公钥
      private-key: MIICdgIBADANBgkqhkiG9w0BA...  # 私钥
      whitelist:
        - /api/public/**  # 不加密的接口
```

### 第 3 步：前端加密

```javascript
import CryptoJS from 'crypto-js';
import JSEncrypt from 'jsencrypt';

// 1. 生成随机 AES 密钥（每次请求都不同！）
const aesKey = generateRandom(16);

// 2. 用服务器公钥加密 AES 密钥
const rsa = new JSEncrypt();
rsa.setPublicKey(serverPublicKey);
const encryptedKey = rsa.encrypt(aesKey);

// 3. 用 AES 密钥加密请求数据
const encryptedData = CryptoJS.AES.encrypt(
    JSON.stringify(data), 
    CryptoJS.enc.Utf8.parse(aesKey)
).toString();

// 4. 发送请求
fetch('/api/order/create', {
    method: 'POST',
    headers: { 'X-Encrypted-Key': encryptedKey },
    body: encryptedData
});

// 5. 解密响应（用自己的 AES 密钥）
const response = await fetch(...);
const encryptedResponse = await response.text();
const decrypted = CryptoJS.AES.decrypt(
    encryptedResponse, 
    CryptoJS.enc.Utf8.parse(aesKey)
).toString(CryptoJS.enc.Utf8);
```

### 第 4 步：后端 Controller（无需修改）

```java
@RestController
@RequestMapping("/api")
public class OrderController {
    
    @PostMapping("/order/create")
    public Result create(@RequestBody Order order) {
        // ✅ 请求已自动解密
        // ✅ 响应会自动加密
        return orderService.create(order);
    }
}
```

::: tip 安全保障
- 每次请求生成**随机 AES 密钥**，无法预测
- AES 密钥通过 **RSA 公钥加密**，只有服务器私钥能解密
- 即使抓包或扫拉出前端代码，**没有私钥也无法解密**
:::

详细文档：[混合加密通信](./hybrid-encrypt.md)

---

## 示例 3：签名校验

### 场景

需要防止 API 接口被篡改或重放攻击。

### 配置

```yaml
molandev:
  encrypt:
    sign:
      enabled: true
      secret: your-sign-secret  # 签名密钥
      expire-time: 300  # 5分钟有效期
```

### 前端生成签名

```javascript
import MD5 from 'crypto-js/md5';

function signRequest(params, secret) {
    // 1. 添加时间戳和随机数
    params.timestamp = Date.now();
    params.nonce = Math.random().toString(36).substring(2);
    
    // 2. 参数排序
    const keys = Object.keys(params).sort();
    
    // 3. 拼接字符串
    const str = keys.map(k => `${k}=${params[k]}`).join('&') + `&secret=${secret}`;
    
    // 4. MD5 加密
    params.sign = MD5(str).toString().toUpperCase();
    
    return params;
}

// 使用
const params = signRequest({
    orderId: '123456',
    amount: 100.00
}, 'your-sign-secret');

fetch('/api/order/query?' + new URLSearchParams(params));
```

### 后端自动校验

```java
// ✅ Filter 自动校验签名，Controller 无需修改
@GetMapping("/order/query")
public Order query(Long orderId) {
    return orderService.getById(orderId);
}
```

::: tip 安全机制
- **签名验证**：防止数据被篡改
- **时间戳**：防止过期请求
- **随机数**：防止重放攻击
:::

详细文档：[签名校验](./sign.md)

---

## 示例 4：敏感信息脱敏

### 场景

需要在接口返回时将手机号、身份证等敏感信息脱敏显示。

### 代码（1 个注解）

```java
import com.molandev.framework.encrypt.sensitive.Sensitive;
import com.molandev.framework.encrypt.sensitive.SensitiveTypes;

@Data
public class UserVO {
    private Long id;
    private String username;
    
    @Sensitive(type = SensitiveTypes.PHONE)  // 137****8888
    private String phone;
    
    @Sensitive(type = SensitiveTypes.ID_CARD)  // 110***********1234
    private String idCard;
    
    @Sensitive(type = SensitiveTypes.EMAIL)  // t***@example.com
    private String email;
}
```

### 效果

```json
{
    "id": 1,
    "username": "zhangsan",
    "phone": "137****8888",
    "idCard": "110***********1234",
    "email": "t***@example.com"
}
```

::: tip 支持的脱敏类型
- `PHONE`：手机号（137****8888）
- `ID_CARD`：身份证（110***********1234）
- `EMAIL`：邮箱（t***@example.com）
- `BANK_CARD`：银行卡（6222 **** **** 1234）
- `ADDRESS`：地址（保留前 6 个字）
:::

详细文档：[敏感信息脱敏](./sensitive.md)

---

## 综合示例：支付系统

一个完整的支付系统，同时使用多种加密功能：

### 配置

```yaml
molandev:
  encrypt:
    # 数据库加密：敏感信息存储
    db:
      enabled: true
      type: AES
      key: ${DB_ENCRYPT_KEY}
    
    # 混合加密：支付接口通信
    hybrid:
      enabled: true
      public-key: ${RSA_PUBLIC_KEY}
      private-key: ${RSA_PRIVATE_KEY}
      whitelist:
        - /api/public/**
    
    # 签名校验：防篡改
    sign:
      enabled: true
      secret: ${SIGN_SECRET}
      expire-time: 300
```

### 实体类

```java
@Data
@TableName("t_order")
public class Order {
    private Long id;
    private String orderNo;
    
    @Enc  // 数据库加密
    private String bankCard;
    
    @Enc
    private String payPassword;
    
    private BigDecimal amount;
    private Integer status;
}

@Data
public class OrderVO {
    private Long id;
    private String orderNo;
    
    @Sensitive(type = SensitiveTypes.BANK_CARD)  // 接口脱敏
    private String bankCard;
    
    private BigDecimal amount;
}
```

### Controller

```java
@RestController
@RequestMapping("/api/payment")
public class PaymentController {
    
    // ✅ 混合加密：请求/响应自动加解密
    // ✅ 签名校验：自动验证签名
    @PostMapping("/pay")
    public Result<Long> pay(@RequestBody PayRequest request) {
        // ✅ 数据库加密：自动加密存储
        Long orderId = paymentService.process(request);
        return Result.success(orderId);
    }
    
    @GetMapping("/order/{id}")
    public Result<OrderVO> getOrder(@PathVariable Long id) {
        // ✅ 数据库加密：自动解密查询
        // ✅ 敏感信息：自动脱敏返回
        OrderVO order = paymentService.getOrderVO(id);
        return Result.success(order);
    }
}
```

::: tip 多层安全保护
- **传输层**：混合加密 + 签名校验
- **存储层**：数据库字段加密
- **展示层**：敏感信息脱敏
:::

---

## 常见问题

### Q1：密钥如何管理？

**A**：使用环境变量或配置中心，不要硬编码在代码中。

```yaml
# ❌ 不推荐：硬编码
molandev:
  encrypt:
    db:
      key: 1234567890abcdef

# ✅ 推荐：环境变量
molandev:
  encrypt:
    db:
      key: ${DB_ENCRYPT_KEY}
```

### Q2：已有数据如何加密？

**A**：编写数据迁移脚本，批量加密现有数据。详见 [数据库字段加密 - 数据迁移](./db-encrypt.md#数据迁移)。

### Q3：测试环境如何关闭加密？

**A**：使用 Spring Profile 配置。

```yaml
# application-dev.yml（测试环境）
molandev:
  encrypt:
    db:
      enabled: false
    hybrid:
      enabled: false

# application-prod.yml（生产环境）
molandev:
  encrypt:
    db:
      enabled: true
    hybrid:
      enabled: true
```

### Q4：混合加密为什么要每次随机生成 AES 密钥？

**A**：这是安全设计的核心：

1. **防止密钥暴露**：前端代码中没有固定密钥，即使被扒拉出来也无法解密
2. **防止重放攻击**：每次请求的密钥都不同，旧请求无法重用
3. **防止抓包分析**：没有服务器私钥，无法解密 AES 密钥

详细原理见：[混合加密通信 - 为什么需要双层加密](./hybrid-encrypt.md#为什么需要双层加密)

### Q5：加密后性能影响大吗？

**A**：影响很小：

- **数据库加密**：只处理标记字段，缓存反射结果
- **混合加密**：RSA 只加密 16 字节，AES 性能高
- **签名校验**：MD5 计算很快

建议：仅加密敏感字段，使用缓存减少加解密次数。

### Q6：Filter 验证失败抛出异常后，前端收不到统一格式的响应体？

**A**：`molandev-encrypt` 的 Filter（签名、加解密）只负责业务逻辑校验，**不会主动包装响应格式**。

为了保持响应格式的自定义灵活性，建议你编写一个**优先级更高**（`Order` 值更小，如 `Integer.MIN_VALUE`）的 Filter，在 `try-catch` 中捕获异常并返回你项目定义的 JSON 格式（如包含 `code`, `data`, `message` 等）。

详细说明见：[模块概览 - 异常处理与响应包装](./overview.md#异常处理与响应包装)

---

## 下一步

恭喜你完成快速开始！现在可以：

1. **深入学习**：查看各功能的详细文档
   - [数据库字段加密](./db-encrypt.md) - MyBatis 拦截器原理、条件查询、数据迁移
   - [混合加密通信](./hybrid-encrypt.md) - 安全设计原理、前后端完整实现
   - [签名校验](./sign.md) - 防篡改和重放攻击
   - [敏感信息脱敏](./sensitive.md) - 多种脱敏类型

2. **查看安全廿议**：[模块概览 - 安全廿议](./overview.md#安全廿议)

3. **加入社区**：
   - GitHub: [molandev-framework](https://github.com/molandev/molandev-framework)
   - 问题反馈: [Issues](https://github.com/molandev/molandev-framework/issues)
