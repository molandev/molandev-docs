# Encrypt 加密模块概览

molandev-encrypt 是 MolanDev Framework 的加密模块，提供了**多层次、多场景的数据加密解决方案**，涵盖数据库字段加密、接口通信加密、签名校验和敏感信息脱敏等功能。

## 核心功能

| 功能 | 说明 | 项目使用频率 | 文档 |
|-----|------|-------------|------|
| **请求参数加密** | `@EncryptedParam` 注解自动解密 | ⭐⭐⭐ 登录密码加密 | [详细说明](./param-encrypt.md) |
| **密码编码器** | `MolanPasswordEncoder` 密码校验 | ⭐⭐⭐⭐ 登录密码验证 | [详细说明](./password.md) |
| 数据库字段加密 | `@Enc` 注解透明加解密 | 暂未使用 | [详细说明](./db-encrypt.md) |
| 混合加密通信 | RSA + AES 双层加密 | 暂未使用 | [详细说明](./hybrid-encrypt.md) |
| 签名校验 | 防篡改、防重放攻击 | 暂未使用 | [详细说明](./sign.md) |
| 敏感信息脱敏 | `@Sensitive` 注解脱敏 | 暂未使用 | [详细说明](./sensitive.md) |

## 快速开始

### 1. 引入依赖

```xml
<dependency>
    <groupId>com.molandev</groupId>
    <artifactId>molandev-encrypt</artifactId>
    <version>${molandev.version}</version>
</dependency>
```

### 2. 请求参数加密（项目中实际使用）

前端使用 RSA 公钥加密密码传输，后端使用 `@EncryptedParam` 注解自动解密：

```java
// 登录接口
@PostMapping("/login")
public JsonResult<LoginResult> login(String account,
                                     @EncryptedParam String password,
                                     String imgId, String imgCode) {
    return loginService.doLogin(account, password);
}
```

**前端加密：**
```javascript
import { encrypt } from '@/utils/crypto'

const encryptedPassword = encrypt(password)  // RSA 公钥加密
```

**后端自动解密：** `@EncryptedParam` 注解会在参数绑定时自动解密，业务代码拿到的是明文密码。

### 3. 密码编码器（项目中实际使用）

使用 `MolanPasswordEncoder` 进行密码加密和验证：

```java
@Service
public class LoginService {
    private final MolanPasswordEncoder passwordEncoder;

    public JsonResult<LoginResult> doLogin(String account, String password) {
        // 查询用户
        UserDetail userDetail = sysPermissionService.getUserDetail(account);

        // 密码校验
        if (passwordEncoder.notMatch(password, userDetail.getPassword())) {
            return JsonResult.invalid("用户名或密码错误");
        }

        // 登录成功...
    }
}
```

**特性：**
- 使用 BCrypt 算法
- 自动加盐，每次加密结果不同
- 无法反向解密，只能通过比对验证

## 项目中的实际应用

### 登录密码加密与验证

**代码位置：** `molandev-base/.../auth/controller/LoginController.java`、`LoginService.java`

```java
// Controller 层 - 参数自动解密
@PostMapping("/login")
public JsonResult<LoginResult> login(String account,
                                     @EncryptedParam String password,
                                     String imgId, String imgCode) {
    return loginService.doLogin(account, password);
}

// Service 层 - 密码校验
if (passwordEncoder.notMatch(password, userDetail.getPassword())) {
    return JsonResult.invalid("用户名或密码错误");
}
```

**完整流程：**
1. 前端使用 RSA 公钥加密密码
2. 后端 `@EncryptedParam` 自动解密为明文
3. `MolanPasswordEncoder` 与数据库中的密文比对
4. 验证通过则登录成功

> 📖 **详细说明** → [登录策略文档](/cloud/backend/auth/login)

## 配置说明

```yaml
molandev:
  encrypt:
    # 请求参数加密（已启用）
    params:
      enabled: true
      key: MIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBAJQFN20fM4oIkLKk...  # RSA 私钥

    # 密码编码器
    password:
      key: 123456  # BCrypt 盐值
```

> ⚠️ **安全建议**：RSA 私钥和 BCrypt 盐值应从环境变量或配置中心读取，不要硬编码在配置文件中。

## 其他功能（项目中暂未使用）

以下功能模块代码已实现，但当前项目中未启用。如需使用，请参考对应子文档。

### 数据库字段加密

使用 `@Enc` 注解标记实体字段，MyBatis 拦截器自动加解密：

```java
@Data
@TableName("t_user")
public class User {
    private Long id;

    @Enc  // 插入时自动加密，查询时自动解密
    private String idCard;

    @Enc
    private String phone;
}
```

> 📖 **详细说明** → [数据库加密文档](./db-encrypt.md)

### 混合加密通信

RSA + AES 混合加密，保护 HTTP 请求/响应：

```java
// 后端配置启用
molandev:
  encrypt:
    hybrid:
      enabled: true
      public-key: ${RSA_PUBLIC_KEY}
      private-key: ${RSA_PRIVATE_KEY}
```

前端使用随机 AES 密钥加密数据，再用 RSA 公钥加密 AES 密钥传输。后端自动解密。

> 📖 **详细说明** → [混合加密文档](./hybrid-encrypt.md)

### 签名校验

防止请求被篡改和重放攻击：

```yaml
molandev:
  encrypt:
    sign:
      enabled: true
      secret: ${SIGN_SECRET}
      expire-time: 300  # 5分钟有效期
```

前端生成签名（MD5 + 时间戳 + nonce），后端自动校验。

> 📖 **详细说明** → [签名校验文档](./sign.md)

### 敏感信息脱敏

使用 `@Sensitive` 注解在 JSON 序列化时自动脱敏：

```java
@Data
public class UserVO {
    private Long id;

    @Sensitive(type = SensitiveTypes.PHONE)
    private String phone;  // 138****5678

    @Sensitive(type = SensitiveTypes.EMAIL)
    private String email;  // a***@example.com
}
```

> 📖 **详细说明** → [脱敏文档](./sensitive.md)

## 异常处理

`molandev-encrypt` 模块的 Filter（如签名校验、混合加解密）在验证失败时会抛出自定义异常（`SignException`、`HybridEncryptException`）。

**建议做法：** 编写一个优先级更高的 Filter 捕获这些异常，并根据业务需求构造统一的响应 JSON：

```java
@Component
@Order(Integer.MIN_VALUE)
public class GlobalErrorFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            filterChain.doFilter(request, response);
        } catch (SignException | HybridEncryptException e) {
            // 自定义响应格式
            Result<Void> result = Result.fail(401, e.getMessage());
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(JSONUtils.toJson(result));
        }
    }
}
```

## 总结

molandev-encrypt 提供了：

- ✅ 请求参数自动解密（`@EncryptedParam`，项目已使用）
- ✅ 密码编码器（`MolanPasswordEncoder`，项目已使用）
- ✅ 数据库字段透明加解密（`@Enc`，暂未使用）
- ✅ 混合加密通信（RSA + AES，暂未使用）
- ✅ 签名校验防篡改（暂未使用）
- ✅ 敏感信息自动脱敏（暂未使用）
