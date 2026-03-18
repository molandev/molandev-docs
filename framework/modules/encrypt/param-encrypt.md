# 请求参数加密

请求参数加密通过 **@EncryptedParam 注解**实现单个参数的自动解密，适用于需要对特定参数进行加密传输的场景。

## 功能说明

参数加密基于 **Spring MVC 参数解析器**实现，在 Controller 参数绑定前自动解密，对业务代码透明。

## 核心特性

### ✅ 简单易用

- **注解驱动**：只需一个 @EncryptedParam 注解
- **自动解密**：参数绑定时自动解密
- **类型转换**：支持所有基本类型和对象类型

### ✅ 灵活配置

- **选择性加密**：只加密敏感参数
- **配置化密钥**：密钥统一管理
- **多种算法**：支持 AES、RSA

## 配置

### 基础配置

```yaml
# application.yml
molandev:
  encrypt:
    params:
      enabled: true                    # 启用参数加密，必填
      type: AES                        # 加密类型：AES 或 RSA，默认 AES
      key: your-param-key-16           # 加密密钥，必填（AES 需 16 字节，RSA 使用公钥）
      algorithm: AES/ECB/PKCS5Padding  # 加密算法，默认 AES/ECB/PKCS5Padding
```

### 配置项说明

| 配置项 | 类型 | 默认值 | 必填 | 说明 |
|-------|------|--------|------|------|
| enabled | boolean | false | ✅ | 是否启用参数加密 |
| type | enum | AES | ❌ | 加密类型：AES 或 RSA |
| key | String | - | ✅ | 加密密钥，AES 需 16 字节，RSA 使用公钥 |
| algorithm | String | AES/ECB/PKCS5Padding | ❌ | 加密算法 |

## 使用示例

### 示例 1：基础用法

#### Controller

```java
import com.molandev.framework.encrypt.params.EncryptedParam;

@RestController
@RequestMapping("/api/user")
public class UserController {
    
    // ✅ 单个参数解密（显式指定参数名）
    @GetMapping("/query")
    public User query(@EncryptedParam("userId") Long userId) {
        // userId 已自动解密
        return userService.getById(userId);
    }
    
    // ✅ 参数名自动推断（推荐方式）
    @GetMapping("/info")
    public User info(@EncryptedParam String userId) {
        // 自动使用方法参数名 userId 作为请求参数名
        return userService.getById(userId);
    }
    
    // ✅ 多个参数解密
    @PostMapping("/login")
    public Result login(
        @EncryptedParam String username,  // 自动推断
        @EncryptedParam String password   // 自动推断
    ) {
        // username 和 password 已自动解密
        return authService.login(username, password);
    }
}
```

**注意**：
- 如果未显式指定 `@EncryptedParam` 的 `value` 参数，框架会自动使用方法参数名作为请求参数名
- 需要确保编译时包含参数名信息（Maven 默认已配置 `-parameters`）
- 当请求参数名与方法参数名不一致时，才需要显式指定 `value`

#### 前端加密

```javascript
import CryptoJS from 'crypto-js';

/**
 * AES 加密
 */
function aesEncrypt(text, key) {
    const encrypted = CryptoJS.AES.encrypt(text, CryptoJS.enc.Utf8.parse(key), {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
}

// 加密参数
const encryptedUserId = aesEncrypt('12345', 'your-param-key-16');
const encryptedUsername = aesEncrypt('zhangsan', 'your-param-key-16');
const encryptedPassword = aesEncrypt('password123', 'your-param-key-16');

// 发送请求
fetch(`/api/user/query?userId=${encodeURIComponent(encryptedUserId)}`);

fetch('/api/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
        username: encryptedUsername,
        password: encryptedPassword
    })
});
```

### 示例 2：混合使用

```java
@RestController
@RequestMapping("/api/order")
public class OrderController {
    
    @GetMapping("/query")
    public Order query(
        @EncryptedParam String orderId,      // 自动推断：请求参数名 = orderId
        @RequestParam String status,         // 普通参数
        @EncryptedParam("uid") Long userId   // 显式指定：请求参数名 = uid
    ) {
        // orderId 和 userId 已解密，status 保持原样
        return orderService.query(orderId, status, userId);
    }
}
```

### 示例 3：对象类型

```java
@Data
public class LoginRequest {
    private String username;
    private String password;
}

@RestController
public class AuthController {
    
    // ❌ 不支持：@EncryptedParam 不能用于对象
    @PostMapping("/login")
    public Result login(@EncryptedParam("request") LoginRequest request) {
        // 这种方式不支持
    }
    
    // ✅ 正确：分别解密每个字段
    @PostMapping("/login")
    public Result login(
        @EncryptedParam("username") String username,
        @EncryptedParam("password") String password
    ) {
        LoginRequest request = new LoginRequest();
        request.setUsername(username);
        request.setPassword(password);
        return authService.login(request);
    }
}
```

### 示例 4：封装工具类

```javascript
// encrypt-utils.js
import CryptoJS from 'crypto-js';

export class ParamEncryptUtils {
    
    constructor(key) {
        this.key = CryptoJS.enc.Utf8.parse(key);
    }
    
    /**
     * 加密单个参数
     */
    encrypt(value) {
        if (value === null || value === undefined) {
            return value;
        }
        
        const str = typeof value === 'string' ? value : String(value);
        const encrypted = CryptoJS.AES.encrypt(str, this.key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        });
        return encrypted.toString();
    }
    
    /**
     * 批量加密参数
     */
    encryptParams(params, encryptKeys) {
        const result = { ...params };
        
        encryptKeys.forEach(key => {
            if (result[key] !== undefined) {
                result[key] = this.encrypt(result[key]);
            }
        });
        
        return result;
    }
    
    /**
     * GET 请求（加密指定参数）
     */
    async get(url, params, encryptKeys = []) {
        const encryptedParams = this.encryptParams(params, encryptKeys);
        const queryString = new URLSearchParams(encryptedParams).toString();
        
        const response = await fetch(`${url}?${queryString}`);
        return response.json();
    }
    
    /**
     * POST 请求（加密指定参数）
     */
    async post(url, params, encryptKeys = []) {
        const encryptedParams = this.encryptParams(params, encryptKeys);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(encryptedParams)
        });
        
        return response.json();
    }
}

// 使用
const encryptUtils = new ParamEncryptUtils('your-param-key-16');

// GET 请求 - 加密 userId
await encryptUtils.get('/api/user/query', {
    userId: '12345',
    status: 'active'
}, ['userId']);

// POST 请求 - 加密 username 和 password
await encryptUtils.post('/api/user/login', {
    username: 'zhangsan',
    password: 'password123'
}, ['username', 'password']);
```

### 示例 5：Vue.js 集成

```javascript
// plugins/param-encrypt.js
import { ParamEncryptUtils } from '@/utils/encrypt-utils';

const encryptUtils = new ParamEncryptUtils(process.env.VUE_APP_PARAM_KEY);

export default {
    install(app) {
        // 全局方法
        app.config.globalProperties.$encryptParam = (value) => {
            return encryptUtils.encrypt(value);
        };
        
        // Axios 拦截器 - 自动加密指定参数
        app.config.globalProperties.$axios.interceptors.request.use(config => {
            // 从配置中获取需要加密的参数列表
            const encryptKeys = config.encryptParams || [];
            
            if (encryptKeys.length > 0) {
                if (config.method === 'get' && config.params) {
                    config.params = encryptUtils.encryptParams(config.params, encryptKeys);
                } else if (config.data) {
                    config.data = encryptUtils.encryptParams(config.data, encryptKeys);
                }
            }
            
            return config;
        });
    }
};

// 使用
export default {
    methods: {
        async login() {
            // ✅ 自动加密 username 和 password
            const response = await this.$axios.post('/api/user/login', {
                username: 'zhangsan',
                password: 'password123'
            }, {
                encryptParams: ['username', 'password']
            });
        }
    }
};
```

## 技术细节

### 参数解析器

```java
public class EncryptedParamHandlerMethodArgumentResolver 
    implements HandlerMethodArgumentResolver {
    
    @Autowired
    private EncryptProperties encryptProperties;
    
    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        // 支持带 @EncryptedParam 注解的参数
        return parameter.hasParameterAnnotation(EncryptedParam.class);
    }
    
    @Override
    public Object resolveArgument(
        MethodParameter parameter,
        ModelAndViewContainer mavContainer,
        NativeWebRequest webRequest,
        WebDataBinderFactory binderFactory
    ) throws Exception {
        
        // 1. 获取注解
        EncryptedParam annotation = parameter.getParameterAnnotation(EncryptedParam.class);
        String paramName = annotation.value();
        
        // 2. 获取加密的参数值
        String encryptedValue = webRequest.getParameter(paramName);
        if (encryptedValue == null) {
            return null;
        }
        
        // 3. 解密
        String decryptedValue = decrypt(encryptedValue);
        
        // 4. 类型转换
        Class<?> parameterType = parameter.getParameterType();
        return convertValue(decryptedValue, parameterType);
    }
    
    private String decrypt(String encryptedValue) {
        EncryptProperties.ParamsProperties config = encryptProperties.getParams();
        
        if (config.getType() == EncryptProperties.EncryptType.AES) {
            return AesUtil.decrypt(encryptedValue, config.getKey(), config.getAlgorithm());
        } else {
            return RsaUtil.decrypt(encryptedValue, config.getPrivateKey());
        }
    }
}
```

### 类型转换

支持的参数类型：

- **基本类型**：int, long, boolean, etc.
- **包装类型**：Integer, Long, Boolean, etc.
- **字符串**：String
- **日期类型**：Date, LocalDateTime, etc.

```java
private Object convertValue(String value, Class<?> targetType) {
    if (targetType == String.class) {
        return value;
    } else if (targetType == Integer.class || targetType == int.class) {
        return Integer.valueOf(value);
    } else if (targetType == Long.class || targetType == long.class) {
        return Long.valueOf(value);
    } else if (targetType == Boolean.class || targetType == boolean.class) {
        return Boolean.valueOf(value);
    }
    // ... 其他类型转换
}
```

## 注意事项

### ⚠️ 仅支持简单类型

@EncryptedParam 只支持简单类型，不支持对象：

```java
// ✅ 支持
@EncryptedParam("userId") Long userId
@EncryptedParam("username") String username

// ❌ 不支持
@EncryptedParam("user") User user
```

### ⚠️ URL 编码

加密后的字符串需要 URL 编码：

```javascript
const encrypted = aesEncrypt('value', key);
const encoded = encodeURIComponent(encrypted);  // ✅ URL 编码
fetch(`/api/user?id=${encoded}`);
```

### ⚠️ 与 @RequestParam 配合

```java
// ✅ 正确：使用 @EncryptedParam
@GetMapping("/query")
public User query(@EncryptedParam("userId") Long userId) {
}

// ❌ 错误：同时使用两个注解
@GetMapping("/query")
public User query(
    @EncryptedParam("userId") 
    @RequestParam("userId") Long userId
) {
}
```

### ⚠️ POST 请求内容类型

参数加密只支持 `application/x-www-form-urlencoded`：

```javascript
// ✅ 正确
fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: encrypted })
});

// ❌ 错误：JSON 格式不支持
fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: encrypted })
});
```

如需 JSON 格式，请使用[混合加密](./hybrid-encrypt.md)。

## 常见问题

### Q1: 为什么不支持对象类型？

**A**: 因为参数解析器是针对单个参数设计的。如需对象加密，建议：

1. 使用[混合加密](./hybrid-encrypt.md)（推荐）
2. 分别加密对象的每个字段

### Q2: 如何与签名配合使用？

**A**: 加密后的参数值参与签名：

```javascript
// 1. 先加密参数
const encryptedUserId = aesEncrypt('12345', paramKey);

// 2. 用加密后的值生成签名
const params = {
    userId: encryptedUserId,  // 加密后的值
    timestamp: Date.now(),
    nonce: 'abc123'
};
params.sign = generateSign(params, signSecret);
```

### Q3: 可以混合使用加密和普通参数吗？

**A**: 可以。

```java
@GetMapping("/query")
public Result query(
    @EncryptedParam("userId") Long userId,  // 加密
    @RequestParam String status              // 普通
) {
    // userId 会解密，status 保持原样
}
```

### Q4: 性能影响大吗？

**A**: 影响很小。AES 解密单个参数耗时约 1-2ms，RSA 解密耗时略高但也在可接受范围内。

### Q5: 测试环境如何调试？

**A**: 临时关闭参数加密：

```yaml
# application-dev.yml
molandev:
  encrypt:
    params:
      enabled: false
```

## 相关工具

- [AES 加密工具](../util/encrypt/aes.md) - 底层实现
- [混合加密通信](./hybrid-encrypt.md) - 更强大的加密方案

## 参考资料

- [Spring MVC 参数解析](https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#mvc-ann-arguments)
