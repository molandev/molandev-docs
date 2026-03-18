# Encrypt 模块概览

molandev-encrypt 是 MolanDev Framework 的加密模块，提供了**多层次、多场景的数据加密解决方案**，涵盖数据库字段加密、接口通信加密、签名校验和敏感信息脱敏等功能。

## 模块定位

molandev-encrypt 是基于 Spring Boot 的企业级加密模块，提供了**从存储到传输的全链路数据安全保护**：

- **存储层加密**：数据库字段透明加解密
- **传输层加密**：混合加密（RSA + AES）保护 HTTP 通信
- **防篡改保护**：签名校验防止数据被篡改和重放
- **展示层脱敏**：敏感信息在响应时自动脱敏

## 核心功能

| 功能 | 使用场景 | 安全级别 | 技术实现 |
|-----|---------|---------|----------|
| [数据库字段加密](./db-encrypt.md) | 用户敏感信息存储 | ⭐⭐⭐ | MyBatis 拦截器 + @Enc 注解 |
| [混合加密通信](./hybrid-encrypt.md) | 支付、敏感 API 接口 | ⭐⭐⭐⭐⭐ | RSA + AES 双层加密 |
| [签名校验](./sign.md) | 防篡改、防重放攻击 | ⭐⭐⭐⭐ | MD5 签名 + 时间戳 + nonce |
| [请求参数加密](./param-encrypt.md) | 单个参数加密传输 | ⭐⭐⭐ | @EncryptedParam 注解自动解密 |
| [敏感信息脱敏](./sensitive.md) | 日志、接口返回脱敏 | ⭐⭐ | @Sensitive 注解 + Jackson 序列化 |

## 快速了解

### 数据库加密：存储层安全

```java
@Data
@TableName("t_user")
public class User {
    private Long id;
    private String name;
    
    @Enc  // 自动加解密
    private String idCard;
    
    @Enc
    private String phone;
}

// 使用：对业务代码透明，自动加解密
userMapper.insert(user);  // 自动加密存储
User user = userMapper.selectById(1L);  // 自动解密返回
```

### 混合加密：传输层安全

```javascript
// 前端：每次随机密钥，安全传输
const aesKey = generateRandom(16);  // 随机 AES 密钥
const encryptedKey = RSA.encrypt(aesKey, publicKey);  // RSA 加密密钥
const encryptedData = AES.encrypt(data, aesKey);  // AES 加密数据

fetch('/api/order/create', {
    headers: { 'X-Encrypted-Key': encryptedKey },
    body: encryptedData
});
```

```java
// 后端：自动加解密，对业务代码透明
@PostMapping("/api/order/create")
public Result create(@RequestBody Order order) {
    // 请求已自动解密，响应会自动加密
    return orderService.create(order);
}
```

### 签名校验：防篡改与重放

```javascript
// 前端：生成签名
const params = {
    orderId: '123',
    amount: 100.00,
    timestamp: Date.now(),
    nonce: randomString(32)
};
params.sign = MD5(sortAndJoin(params) + '&secret=' + secret);
```

```yaml
# 后端：自动校验
molandev:
  encrypt:
    sign:
      enabled: true
      secret: your-secret
      expire-time: 300  # 5分钟有效期
```

## 模块特性

### ✅ 多层次加密

- **存储层**：数据库字段透明加密
- **传输层**：HTTP 通信混合加密
- **展示层**：敏感信息脱敏

### ✅ 高安全性

- **混合加密**：RSA + AES 双重保护
- **签名校验**：防篡改、防重放
- **密钥管理**：支持配置化管理
- **会话密钥**：每次请求独立密钥，复用加密响应

### ✅ 易于使用

- **注解驱动**：@Enc、@Sensitive、@EncryptedParam
- **自动配置**：Spring Boot AutoConfiguration
- **无侵入性**：Filter + 拦截器，对业务代码无影响
- **灵活配置**：白名单、加密类型、密钥等可配置

### ✅ 高性能

- **拦截器优化**：仅处理标记字段
- **密钥复用**：响应使用请求密钥
- **缓存机制**：反射结果缓存
- **按需加载**：所有功能默认关闭

## 异常处理与响应包装

`molandev-encrypt` 模块的 Filter（如签名校验、混合加解密）在验证失败或发生解密错误时，会直接抛出对应的自定义异常（如 `SignException`、`HybridEncryptException`），**不会主动包装响应体格式**。

由于不同项目对响应体格式（如 `code`, `data`, `message` 等字段名）有不同的规范，模块将响应包装的权利交还给开发者。

**建议做法**：
开发者应编写一个**优先级更高**（`Order` 值更小）的 Filter 来捕获这些异常，并根据业务需求构造统一的响应 JSON。

示例代码：
```java
@Component
@Order(Integer.MIN_VALUE) // 优先级最高，捕获后续 Filter 异常
public class GlobalErrorFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        try {
            filterChain.doFilter(request, response);
        } catch (SignException | HybridEncryptException e) {
            // 自定义响应体格式
            Result<Void> result = Result.fail(401, e.getMessage());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(JSONUtils.toJson(result));
        }
    }
}
```

## 应用场景

### 1. 金融支付系统

```java
// 订单信息加密存储
@Data
@TableName("t_order")
public class Order {
    private Long id;
    private String orderNo;
    
    @Enc  // 银行卡号加密
    private String bankCard;
    
    @Enc  // 支付密码加密
    private String payPassword;
    
    private BigDecimal amount;
}

// 支付接口混合加密
@RestController
@RequestMapping("/api/payment")
public class PaymentController {
    
    @PostMapping("/pay")
    public Result pay(@RequestBody PayRequest request) {
        // 请求自动解密，响应自动加密
        return paymentService.process(request);
    }
}
```

**配置**：

```yaml
molandev:
  encrypt:
    db:
      enabled: true
      type: AES
      key: ${ENCRYPT_KEY}  # 从环境变量读取
    hybrid:
      enabled: true
      public-key: ${RSA_PUBLIC_KEY}
      private-key: ${RSA_PRIVATE_KEY}
    sign:
      enabled: true
      secret: ${SIGN_SECRET}
```

### 2. 医疗健康系统

```java
@Data
@TableName("t_patient")
public class Patient {
    private Long id;
    
    @Enc  // 病历信息加密
    private String medicalRecord;
    
    @Enc  // 身份证加密
    private String idCard;
    
    @Sensitive(type = SensitiveTypes.PHONE)  // 查询时脱敏
    private String phone;
}
```

### 3. 电商用户系统

```java
@Data
public class UserVO {
    private Long id;
    private String nickname;
    
    @Sensitive(type = SensitiveTypes.PHONE)
    private String phone;
    
    @Sensitive(type = SensitiveTypes.EMAIL)
    private String email;
    
    @Sensitive(type = SensitiveTypes.ADDRESS)
    private String address;
}
```

### 4. 第三方 API 对接

```java
// 调用第三方接口时签名
@Service
public class ThirdPartyService {
    
    public void callApi(Map<String, Object> params) {
        params.put("timestamp", System.currentTimeMillis());
        params.put("nonce", UUID.randomUUID().toString());
        
        String sign = SignUtils.generateSign(params, secret);
        params.put("sign", sign);
        
        // 发送请求...
    }
}
```

## 技术架构

### 加密流程

```text
┌─────────────┐
│   前端      │
└─────┬───────┘
      │
      │ 1. 生成 AES 密钥
      │ 2. RSA 加密 AES 密钥
      │ 3. AES 加密请求数据
      │
      ▼
┌─────────────────────────────────────┐
│         HybridEncryptFilter         │
│  - 解密 AES 密钥（RSA 私钥）         │
│  - 解密请求数据（AES 密钥）          │
│  - 包装 Request                      │
└─────┬───────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│           SignFilter                │
│  - 校验签名                          │
│  - 校验时间戳                        │
│  - 防重放攻击                        │
└─────┬───────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│         Controller                  │
│  - @EncryptedParam 自动解密          │
│  - 业务处理                          │
└─────┬───────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│      MyBatis Interceptor            │
│  - @Enc 字段自动加密（写入）         │
│  - @Enc 字段自动解密（查询）         │
└─────┬───────────────────────────────┘
      │
      ▼
┌─────────────┐
│   数据库    │
└─────────────┘
```

### 数据库加密

```text
┌────────────────────┐
│  Application       │
│  ┌──────────────┐  │
│  │ Entity Object│  │
│  │ idCard:      │  │
│  │ "110101..." │  │
│  └──────┬───────┘  │
│         │          │
│         ▼          │
│  ┌──────────────┐  │
│  │ MyBatis      │  │
│  │ Interceptor  │  │
│  │ @Enc 加密    │  │
│  └──────┬───────┘  │
└─────────┼──────────┘
          │
          ▼
┌─────────────────────┐
│  Database           │
│  idCard:            │
│  "aX9kY2FyZA=="    │
│  (加密后的数据)      │
└─────────────────────┘
```

## 配置前缀

```yaml
molandev:
  encrypt:
    db:              # 数据库加密配置
    params:          # 参数加密配置
    sign:            # 签名校验配置
    hybrid:          # 混合加密配置
```

## 技术栈

- **Spring Boot**: 自动配置
- **MyBatis**: 数据库拦截器
- **Jackson**: JSON 序列化
- **molandev-util**: 加密工具（AES、RSA、MD5 等）

## 安全建议

### ⚠️ 密钥管理

1. **不要硬编码密钥**：使用环境变量或配置中心
2. **定期更换密钥**：建立密钥轮换机制
3. **密钥长度**：AES 至少 16 字节，RSA 至少 2048 位
4. **权限控制**：限制密钥访问权限

### ⚠️ 签名校验

1. **启用时间戳校验**：防止重放攻击
2. **合理设置过期时间**：平衡安全性和用户体验
3. **使用随机数**：增强签名唯一性
4. **白名单管理**：仅对敏感接口启用

### ⚠️ 性能考虑

1. **选择性加密**：仅加密敏感字段
2. **缓存优化**：使用缓存减少加解密次数
3. **异步处理**：大批量数据考虑异步加密
4. **监控告警**：监控加解密性能

## 与其他模块的关系

| 模块 | 关系 | 说明 |
|-----|------|------|
| molandev-util | 依赖 | 使用 AesUtil、RsaUtil 等加密工具 |
| molandev-spring | 可选 | 可配合 JSONUtils 使用 |
| Spring Boot | 集成 | 自动配置、Filter、拦截器 |
| MyBatis | 集成 | 数据库加密拦截器 |

## 下一步

- [快速开始](./getting-started.md) - 完整的配置和使用指南
- [数据库字段加密](./db-encrypt.md) - MyBatis 透明加解密
- [混合加密通信](./hybrid-encrypt.md) - RSA + AES 双层加密
- [签名校验](./sign.md) - 防篡改和重放攻击
- [敏感信息脱敏](./sensitive.md) - JSON 序列化脱敏

## 反馈与贡献

如果你在使用过程中遇到问题或有改进建议，欢迎通过以下方式联系我们：

- GitHub Issues: [提交问题](https://github.com/molandev/molandev-framework/issues)
- 邮件: support@molandev.com
