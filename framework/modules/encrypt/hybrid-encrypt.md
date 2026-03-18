# 混合加密通信

混合加密通信采用 **RSA + AES 双层加密**机制，解决了单一加密方式的安全隐患，实现真正安全的 HTTP 接口通信。

## 功能说明

混合加密使用 **RSA 加密传输 AES 密钥，再用 AES 密钥加密实际数据**。这不仅仅是为了性能，更重要的是**安全性**：

### 为什么需要双层加密？

#### ❌ 单一对称加密的问题

```javascript
// 前端代码（容易被扒拉出来）
const AES_KEY = 'my-secret-key-16';  // 密钥暴露在前端代码中
const encrypted = AES.encrypt(data, AES_KEY);
fetch('/api/order', { body: encrypted });
```

**安全隐患**：
- 密钥必须硬编码在前端代码中
- 前端代码可被轻易扒拉出来
- 攻击者获取密钥后可以解密所有通信
- 即使混淆也无法真正隐藏密钥

#### ❌ 单一非对称加密的问题

```javascript
// 前端只有公钥，可以加密但无法解密
const encrypted = RSA.encrypt(data, publicKey);
fetch('/api/order', { body: encrypted });

// 响应数据如何加密返回？
// 1. 用公钥加密？前端无法解密（只有私钥能解密）
// 2. 明文返回？不安全
// 3. 返回新密钥？如何安全传输？又回到了第一个问题
```

**安全隐患**：
- 前端只有公钥，无法解密服务端返回的数据
- 服务端无法安全地将响应数据加密返回
- RSA 加密大数据性能差（这是次要问题）

#### ✅ 双层加密的优势

```javascript
// 1. 每次请求生成随机 AES 密钥（16字节随机字符串）
const aesKey = generateRandom(16);  // 每次都不同！

// 2. 用服务器公钥加密 AES 密钥（只有服务器私钥能解密）
const encryptedKey = RSA.encrypt(aesKey, serverPublicKey);

// 3. 用随机 AES 密钥加密请求数据
const encryptedData = AES.encrypt(data, aesKey);

// 4. 发送请求
fetch('/api/order', {
    headers: { 'X-Encrypted-Key': encryptedKey },
    body: encryptedData
});

// 5. 响应用相同的 AES 密钥加密（前端可以解密）
const response = await fetch(...);
const decrypted = AES.decrypt(response, aesKey);  // 用自己的密钥解密
```

**安全保障**：
1. **密钥随机性**：每次请求的 AES 密钥都是随机生成的
2. **密钥不暴露**：AES 密钥通过 RSA 加密传输，前端代码中没有固定密钥
3. **私钥保护**：只有服务器持有 RSA 私钥，攻击者无法解密
4. **抓包无用**：即使抓包获取了加密数据，没有私钥也无法解密
5. **代码扒拉无用**：前端代码中只有公钥和加密逻辑，没有解密密钥
6. **响应安全**：服务器复用相同的 AES 密钥加密响应，前端可以解密

### 攻击者的困境

即使攻击者：
- ✅ 扒拉出了前端所有代码
- ✅ 抓包获取了所有加密数据
- ✅ 知道了加密算法和流程

**但是**：
- ❌ 每次请求的 AES 密钥都是随机的（无法预测）
- ❌ AES 密钥被 RSA 公钥加密（只有私钥能解密）
- ❌ 没有服务器的 RSA 私钥（私钥在服务器，永不泄露）
- ❌ 无法解密任何一次通信内容

## 核心特性

### ✅ 真正的安全

- **每次随机密钥**：每个请求的 AES 密钥都是随机生成的
- **非对称传输密钥**：AES 密钥通过 RSA 公钥加密，只有私钥能解密
- **对称加密数据**：实际数据用 AES 加密，性能高
- **私钥不泄露**：RSA 私钥永远在服务器端，不会传输或暴露

### ✅ 会话密钥复用

- 前端生成随机 AES 密钥
- 用 RSA 公钥加密后传给后端
- 后端用 RSA 私钥解密获取 AES 密钥
- **响应使用相同的 AES 密钥加密**（无需返回密钥）

### ✅ 无侵入设计

- **Filter 实现**：全局拦截，对业务代码透明
- **自动加解密**：请求自动解密，响应自动加密
- **白名单支持**：配置排除不需要加密的接口

### ✅ 高性能

- RSA 仅用于加密 AES 密钥（16字节）
- 大数据使用 AES 加密（性能高）
- 密钥复用，避免重复协商

## 工作原理

### 加密流程图

```text
┌─────────────────────────────────────────────────────────────┐
│                         前端                                 │
├─────────────────────────────────────────────────────────────┤
│  1. 生成随机 AES 密钥（16字节）                              │
│     aesKey = generateRandom(16)                             │
│                                                              │
│  2. 用服务器 RSA 公钥加密 AES 密钥                           │
│     encryptedKey = RSA.encrypt(aesKey, serverPublicKey)    │
│                                                              │
│  3. 用 AES 密钥加密请求数据                                  │
│     encryptedData = AES.encrypt(JSON.stringify(data), aesKey)│
│                                                              │
│  4. 发送请求                                                 │
│     POST /api/order/create                                  │
│     Header: X-Encrypted-Key = encryptedKey                  │
│     Body: encryptedData                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      后端 Filter                             │
├─────────────────────────────────────────────────────────────┤
│  5. 用 RSA 私钥解密 AES 密钥                                 │
│     aesKey = RSA.decrypt(encryptedKey, serverPrivateKey)   │
│                                                              │
│  6. 用 AES 密钥解密请求数据                                  │
│     data = AES.decrypt(encryptedData, aesKey)              │
│                                                              │
│  7. 将 AES 密钥保存到 ThreadLocal                            │
│     CURRENT_AES_KEY.set(aesKey)                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Controller 处理                           │
│     @PostMapping("/api/order/create")                       │
│     public Result create(@RequestBody Order order) {        │
│         // order 已自动解密                                  │
│         return orderService.create(order);                  │
│     }                                                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    后端 Filter（响应）                        │
├─────────────────────────────────────────────────────────────┤
│  8. 从 ThreadLocal 获取 AES 密钥                             │
│     aesKey = CURRENT_AES_KEY.get()                         │
│                                                              │
│  9. 用相同的 AES 密钥加密响应数据                            │
│     encryptedResponse = AES.encrypt(response, aesKey)      │
│                                                              │
│  10. 返回加密响应                                            │
│      Content-Type: text/plain                              │
│      Body: encryptedResponse                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                         前端                                 │
├─────────────────────────────────────────────────────────────┤
│  11. 用自己的 AES 密钥解密响应                               │
│      response = AES.decrypt(encryptedResponse, aesKey)     │
│                                                              │
│  12. 处理业务数据                                            │
│      result = JSON.parse(response)                         │
└─────────────────────────────────────────────────────────────┘
```

### 关键设计点

1. **前端生成密钥**：每次请求生成新的 AES 密钥
2. **RSA 传输密钥**：仅用于加密 AES 密钥（16字节）
3. **AES 加密数据**：加密实际的请求和响应数据
4. **密钥复用**：响应使用请求中的 AES 密钥，无需重新协商

## 配置

### 后端配置

```yaml
# application.yml
molandev:
  encrypt:
    hybrid:
      enabled: true                    # 启用混合加密，必填
      public-key: |                    # RSA 公钥，必填
        MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...
        ...
      private-key: |                   # RSA 私钥，必填
        MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwgg...
        ...
      aes-algorithm: AES/ECB/PKCS5Padding  # AES 算法，默认 AES/ECB/PKCS5Padding
      url-pattern: /*                  # 拦截路径，默认 /*
      order: -2147483638               # Filter 优先级，默认 Integer.MIN_VALUE + 10
      whitelist:                       # 白名单，默认空
        - /api/public/**
        - /health
        - /actuator/**
```

::: warning 注意
order 值越小优先级越高。默认值 `Integer.MIN_VALUE + 10` 保证最先执行，先解密再校验签名。
:::

### 配置项说明

| 配置项 | 类型 | 默认值 | 必填 | 说明 |
|-------|------|--------|------|------|
| enabled | boolean | false | ✅ | 是否启用混合加密 |
| public-key | String | - | ✅ | RSA 公钥（Base64 编码） |
| private-key | String | - | ✅ | RSA 私钥（Base64 编码） |
| aes-algorithm | String | AES/ECB/PKCS5Padding | ❌ | AES 加密算法 |
| url-pattern | String | /* | ❌ | 拦截路径模式 |
| order | int | Integer.MIN_VALUE + 10 | ❌ | Filter 执行顺序，值越小优先级越高，最先执行 |
| whitelist | List\<String> | [] | ❌ | 白名单路径，支持 Ant 匹配 |

### 生成 RSA 密钥对

```java
import com.molandev.framework.util.encrypt.RsaUtil;

public class KeyGenerator {
    public static void main(String[] args) {
        // 生成 2048 位密钥对
        RsaUtil.KeyPairString keyPair = RsaUtil.generateKeyPair(2048);
        
        System.out.println("=== RSA 公钥 ===");
        System.out.println(keyPair.getPublicKey());
        
        System.out.println("\n=== RSA 私钥 ===");
        System.out.println(keyPair.getPrivateKey());
    }
}
```

**输出示例**：

```text
=== RSA 公钥 ===
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC8kGa1pSjbSYZVebtTRBLxBz5H4i2p/llLCrEeQ...

=== RSA 私钥 ===
MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBALyQZrWlKNtJhlV5u1NEEvEHPkfi...
```

## 使用示例

### 示例 1: 前端完整实现（JavaScript）

```javascript
// crypto-utils.js
import CryptoJS from 'crypto-js';
import JSEncrypt from 'jsencrypt';

/**
 * 混合加密工具类
 */
export class HybridCrypto {
    
    constructor(serverPublicKey) {
        this.serverPublicKey = serverPublicKey;
        this.rsaEncrypt = new JSEncrypt();
        this.rsaEncrypt.setPublicKey(serverPublicKey);
    }
    
    /**
     * 生成随机 AES 密钥
     */
    generateAesKey() {
        const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
        let key = '';
        for (let i = 0; i < 16; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return key;
    }
    
    /**
     * RSA 加密 AES 密钥
     */
    encryptAesKey(aesKey) {
        return this.rsaEncrypt.encrypt(aesKey);
    }
    
    /**
     * AES 加密数据
     */
    aesEncrypt(data, key) {
        const encrypted = CryptoJS.AES.encrypt(data, CryptoJS.enc.Utf8.parse(key), {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        });
        return encrypted.toString();
    }
    
    /**
     * AES 解密数据
     */
    aesDecrypt(encryptedData, key) {
        const decrypted = CryptoJS.AES.decrypt(encryptedData, CryptoJS.enc.Utf8.parse(key), {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        });
        return decrypted.toString(CryptoJS.enc.Utf8);
    }
    
    /**
     * 发送加密请求
     */
    async request(url, data, options = {}) {
        // 1. 生成 AES 密钥
        const aesKey = this.generateAesKey();
        
        // 2. RSA 加密 AES 密钥
        const encryptedKey = this.encryptAesKey(aesKey);
        
        // 3. AES 加密请求数据
        const jsonData = JSON.stringify(data);
        const encryptedData = this.aesEncrypt(jsonData, aesKey);
        
        // 4. 发送请求
        const response = await fetch(url, {
            method: options.method || 'POST',
            headers: {
                'Content-Type': 'text/plain',
                'X-Encrypted-Key': encryptedKey,
                ...options.headers
            },
            body: encryptedData
        });
        
        // 5. 解密响应
        const encryptedResponse = await response.text();
        const decryptedResponse = this.aesDecrypt(encryptedResponse, aesKey);
        
        return JSON.parse(decryptedResponse);
    }
}

// 使用示例
const crypto = new HybridCrypto(SERVER_PUBLIC_KEY);

// 发送订单请求
const result = await crypto.request('/api/order/create', {
    orderId: '123456',
    amount: 100.00,
    products: [
        { id: 1, name: '商品A', price: 50.00 },
        { id: 2, name: '商品B', price: 50.00 }
    ]
});

console.log('订单创建结果:', result);
```

### 示例 2: Vue.js 集成

```javascript
// plugins/crypto.js
import { HybridCrypto } from '@/utils/crypto-utils';

const serverPublicKey = process.env.VUE_APP_RSA_PUBLIC_KEY;
const crypto = new HybridCrypto(serverPublicKey);

// Vue 插件
export default {
    install(app) {
        app.config.globalProperties.$crypto = crypto;
    }
};

// main.js
import cryptoPlugin from './plugins/crypto';
app.use(cryptoPlugin);

// 组件中使用
export default {
    methods: {
        async createOrder() {
            try {
                const result = await this.$crypto.request('/api/order/create', {
                    orderId: this.orderId,
                    amount: this.amount
                });
                
                this.$message.success('订单创建成功');
            } catch (error) {
                this.$message.error('订单创建失败');
            }
        }
    }
};
```

### 示例 3: 后端 Controller

```java
@RestController
@RequestMapping("/api")
public class OrderController {
    
    @Autowired
    private OrderService orderService;
    
    // 混合加密接口
    @PostMapping("/order/create")
    public Result<Long> createOrder(@RequestBody OrderRequest request) {
        // 1. 请求数据已自动解密
        // 2. 业务处理
        Long orderId = orderService.create(request);
        
        // 3. 响应会自动加密（使用请求中的 AES 密钥）
        return Result.success(orderId);
    }
    
    // 查询订单（加密）
    @GetMapping("/order/{id}")
    public Result<OrderVO> getOrder(@PathVariable Long id) {
        OrderVO order = orderService.getOrderVO(id);
        return Result.success(order);
    }
}
```

### 示例 4: 白名单配置

```yaml
molandev:
  encrypt:
    hybrid:
      enabled: true
      public-key: ${RSA_PUBLIC_KEY}
      private-key: ${RSA_PRIVATE_KEY}
      whitelist:
        # 公开接口
        - /api/public/**
        - /api/health
        
        # 监控端点
        - /actuator/**
        
        # 静态资源
        - /static/**
        - /images/**
        
        # 登录接口（可能使用其他加密方式）
        - /api/auth/login
```

### 示例 5: 错误处理

```javascript
export class HybridCrypto {
    
    async request(url, data, options = {}) {
        try {
            const aesKey = this.generateAesKey();
            const encryptedKey = this.encryptAesKey(aesKey);
            const encryptedData = this.aesEncrypt(JSON.stringify(data), aesKey);
            
            const response = await fetch(url, {
                method: options.method || 'POST',
                headers: {
                    'Content-Type': 'text/plain',
                    'X-Encrypted-Key': encryptedKey
                },
                body: encryptedData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const encryptedResponse = await response.text();
            
            try {
                const decryptedResponse = this.aesDecrypt(encryptedResponse, aesKey);
                return JSON.parse(decryptedResponse);
            } catch (decryptError) {
                console.error('解密失败:', decryptError);
                throw new Error('响应解密失败，可能是密钥不匹配');
            }
            
        } catch (error) {
            console.error('请求失败:', error);
            throw error;
        }
    }
}
```

## 技术细节

### Filter 实现

```java
@Override
public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
        throws IOException, ServletException {
    
    HttpServletRequest httpRequest = (HttpServletRequest) request;
    HttpServletResponse httpResponse = (HttpServletResponse) response;
    
    // 白名单检查
    if (isWhitelisted(httpRequest.getRequestURI())) {
        chain.doFilter(request, response);
        return;
    }
    
    try {
        // 1. 包装请求，解密数据
        HybridEncryptRequestWrapper requestWrapper = 
            new HybridEncryptRequestWrapper(httpRequest, encryptProperties, objectMapper);
        
        // 2. 保存 AES 密钥到 ThreadLocal
        if (requestWrapper.getAesKey() != null) {
            CURRENT_AES_KEY.set(requestWrapper.getAesKey());
        }
        
        // 3. 包装响应
        HybridEncryptResponseWrapper responseWrapper = 
            new HybridEncryptResponseWrapper(httpResponse);
        
        // 4. 处理请求
        chain.doFilter(requestWrapper, responseWrapper);
        
        // 5. 加密响应
        encryptResponse(responseWrapper, httpResponse);
        
    } finally {
        // 清除 ThreadLocal
        CURRENT_AES_KEY.remove();
    }
}
```

### 请求解密

```java
public class HybridEncryptRequestWrapper extends HttpServletRequestWrapper {
    
    private byte[] decryptedBody;
    private String aesKey;
    
    public HybridEncryptRequestWrapper(HttpServletRequest request, 
                                      EncryptProperties properties,
                                      ObjectMapper objectMapper) {
        super(request);
        
        try {
            // 1. 读取加密的 AES 密钥（从 Header）
            String encryptedKey = request.getHeader("X-Encrypted-Key");
            
            // 2. 用 RSA 私钥解密 AES 密钥
            this.aesKey = RsaUtil.decrypt(encryptedKey, properties.getHybrid().getPrivateKey());
            
            // 3. 读取加密的请求体
            String encryptedBody = IOUtils.toString(request.getInputStream(), StandardCharsets.UTF_8);
            
            // 4. 用 AES 密钥解密请求体
            String decryptedJson = AesUtil.decrypt(encryptedBody, aesKey, 
                properties.getHybrid().getAesAlgorithm());
            
            this.decryptedBody = decryptedJson.getBytes(StandardCharsets.UTF_8);
            
        } catch (Exception e) {
            throw new HybridEncryptException("请求解密失败", e);
        }
    }
    
    @Override
    public ServletInputStream getInputStream() {
        return new DelegatingServletInputStream(new ByteArrayInputStream(decryptedBody));
    }
}
```

### 响应加密

```java
private void encryptResponse(HybridEncryptResponseWrapper responseWrapper,
                             HttpServletResponse originalResponse) {
    
    byte[] responseData = responseWrapper.getResponseData();
    String responseBody = new String(responseData, StandardCharsets.UTF_8);
    
    // 1. 从 ThreadLocal 获取 AES 密钥
    String aesKey = CURRENT_AES_KEY.get();
    
    // 2. 用相同的 AES 密钥加密响应
    String encryptedData = AesUtil.encrypt(responseBody, aesKey, 
        encryptProperties.getHybrid().getAesAlgorithm());
    
    // 3. 返回加密响应
    originalResponse.setContentType("text/plain;charset=UTF-8");
    originalResponse.getWriter().write(encryptedData);
}
```

### 异常处理

`HybridEncryptFilter` 在解密失败（如 RSA 密钥错误、AES 数据损坏）时会抛出 `HybridEncryptException`。由于 Filter 层的异常无法被 `@ControllerAdvice` 捕获，建议编写一个优先级最高的 Filter 来统一处理：

```java
@Component
@Order(Integer.MIN_VALUE) 
public class GlobalErrorFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        try {
            chain.doFilter(request, response);
        } catch (HybridEncryptException e) {
            response.setStatus(500);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"code\": 500, \"msg\": \"解密失败\"}");
        }
    }
}
```

## 注意事项

### ⚠️ 密钥管理

- **RSA 密钥对**：使用环境变量或配置中心管理
- **密钥长度**：建议 2048 位或 4096 位
- **私钥安全**：严格控制私钥访问权限
- **定期更换**：建立密钥轮换机制

### ⚠️ 性能考虑

- **RSA 性能**：仅加密 16 字节 AES 密钥，影响很小
- **AES 性能**：对称加密性能高，适合大数据
- **密钥复用**：响应使用请求密钥，避免重复协商

### ⚠️ 前端实现

- **密钥随机性**：每次请求生成新的 AES 密钥
- **密钥长度**：AES 密钥 16 字节（128位）
- **库选择**：推荐 CryptoJS + JSEncrypt

### ⚠️ 白名单配置

- 公开接口加入白名单
- 监控端点加入白名单
- 静态资源加入白名单
- 登录接口根据需要配置

### ⚠️ 调试困难

- 加密后的数据不可读
- 建议提供开关，测试环境可关闭
- 使用日志记录加解密过程

## 常见问题

### Q1: 为什么使用混合加密？

**A**: 
- **RSA**: 安全但慢，适合加密小数据（密钥）
- **AES**: 快但需要密钥交换，适合加密大数据
- **混合**: 结合两者优势，RSA 传输 AES 密钥，AES 加密数据

### Q2: 响应为什么不返回新密钥？

**A**: 为了简化流程和提高性能：
- 前端已有 AES 密钥
- 无需重新协商
- 减少通信开销
- 保持密钥复用

### Q3: 如何在 Postman 中测试？

**A**: 需要编写脚本进行加解密：

```javascript
// Pre-request Script
const CryptoJS = require('crypto-js');
const JSEncrypt = require('jsencrypt');

// 生成 AES 密钥
const aesKey = 'your-random-key16';

// RSA 加密 AES 密钥
const encrypt = new JSEncrypt();
encrypt.setPublicKey(pm.environment.get('RSA_PUBLIC_KEY'));
const encryptedKey = encrypt.encrypt(aesKey);

// AES 加密请求数据
const data = JSON.stringify(pm.request.body.raw);
const encrypted = CryptoJS.AES.encrypt(data, CryptoJS.enc.Utf8.parse(aesKey), {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
}).toString();

// 设置 Header 和 Body
pm.request.headers.add({key: 'X-Encrypted-Key', value: encryptedKey});
pm.request.body.raw = encrypted;

// 保存 AES 密钥用于解密响应
pm.environment.set('AES_KEY', aesKey);
```

### Q4: 支持 GET 请求吗？

**A**: 建议使用 POST：
- GET 请求参数在 URL 中，不便加密
- POST 请求体可以完整加密
- 如需 GET，可以将参数放在请求体中

### Q5: 如何与签名校验配合使用？

**A**: 先解密再校验签名：

```yaml
molandev:
  encrypt:
    hybrid:
      enabled: true
      order: -2147483638          # 最先执行（先解密）
    sign:
      enabled: true
      order: -2147483628          # 其次执行（后校验）
```

执行顺序：请求 → 混合加密Filter（解密） → 签名Filter（校验） → Controller

::: tip 提示
order 值越小优先级越高，混合加密的 order 值更小，所以会最先执行解密。
:::

## 相关工具

- [RSA 加密工具](../util/encrypt/rsa.md) - RSA 实现
- [AES 加密工具](../util/encrypt/aes.md) - AES 实现
- [签名校验](./sign.md) - 配合使用防篡改

## 参考资料

- [混合加密系统](https://en.wikipedia.org/wiki/Hybrid_cryptosystem)
- [RSA 加密](https://en.wikipedia.org/wiki/RSA_(cryptosystem))
- [AES 加密](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard)
