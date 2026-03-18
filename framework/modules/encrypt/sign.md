# 签名校验

签名校验通过 **MD5 签名 + 时间戳 + 随机数** 三重机制，防止 API 接口数据被篡改和重放攻击。

## 功能说明

签名校验基于 **Filter 全局拦截**实现，自动校验请求参数的签名、时间戳和随机数，无需修改业务代码。

## 核心特性

### ✅ 防篡改

- **参数签名**：所有参数按字典序排列后加密
- **密钥保护**：签名密钥不在请求中传输
- **MD5 校验**：任何参数被修改都会导致签名验证失败

### ✅ 防重放

- **时间戳校验**：请求超过有效期自动拒绝
- **随机数验证**：nonce 值只能使用一次
- **双重保护**：时间戳 + nonce 彻底防止重放攻击

### ✅ 灵活配置

- **白名单支持**：公开接口无需签名
- **自定义参数名**：可配置 sign、timestamp、nonce 参数名
- **可调整有效期**：根据业务需求配置过期时间

## 配置

### 基础配置

```yaml
# application.yml
molandev:
  encrypt:
    sign:
      enabled: true                    # 启用签名校验，必填
      secret: your-sign-secret         # 签名密钥，必填
      sign-name: sign                  # 签名参数名，默认 sign
      timestamp-name: timestamp        # 时间戳参数名，默认 timestamp
      nonce-name: nonce                # 随机数参数名，默认 nonce
      expire-time: 300                 # 有效期（秒），默认5分钟
      url-pattern: /*                  # 拦截路径，默认 /*
      order: -2147483628               # Filter 优先级，默认 Integer.MIN_VALUE + 20
      whitelist:                       # 白名单，默认空
        - /api/public/**
        - /health
        - /actuator/**
```

::: warning 注意
order 值越小优先级越高。默认值 `Integer.MIN_VALUE + 20` 保证在混合加密解密之后执行。
:::

### 配置项说明

| 配置项 | 类型 | 默认值 | 必填 | 说明 |
|-------|------|--------|------|------|
| enabled | boolean | false | ✅ | 是否启用签名校验 |
| secret | String | - | ✅ | 签名密钥 |
| sign-name | String | sign | ❌ | 签名参数名 |
| timestamp-name | String | timestamp | ❌ | 时间戳参数名 |
| nonce-name | String | nonce | ❌ | 随机数参数名 |
| expire-time | long | 300 | ❌ | 有效期（秒） |
| url-pattern | String | /* | ❌ | 拦截路径模式 |
| order | int | Integer.MIN_VALUE + 20 | ❌ | Filter 执行顺序，值越小优先级越高，在混合加密之后执行 |
| whitelist | List\<String> | [] | ❌ | 白名单路径，支持 Ant 匹配 |

## 使用示例

### 示例 1：基础签名

#### 前端生成签名

```javascript
import MD5 from 'crypto-js/md5';

/**
 * 生成签名
 * @param {Object} params - 请求参数
 * @param {String} secret - 签名密钥
 * @return {String} 签名字符串
 */
function generateSign(params, secret) {
    // 1. 添加时间戳和随机数
    params.timestamp = Date.now();
    params.nonce = Math.random().toString(36).substring(2, 15);
    
    // 2. 过滤空值和 sign 字段
    const filteredParams = {};
    Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== '' && key !== 'sign') {
            filteredParams[key] = params[key];
        }
    });
    
    // 3. 按 key 排序
    const sortedKeys = Object.keys(filteredParams).sort();
    
    // 4. 拼接字符串：key1=value1&key2=value2&secret=xxx
    const str = sortedKeys.map(key => `${key}=${filteredParams[key]}`).join('&');
    const signStr = str + `&secret=${secret}`;
    
    // 5. MD5 加密并转大写
    params.sign = MD5(signStr).toString().toUpperCase();
    
    return params;
}

// 使用示例
const params = {
    orderId: '202401180001',
    amount: 100.00,
    userId: '10086'
};

const signedParams = generateSign(params, 'your-sign-secret');
console.log(signedParams);
// {
//   orderId: '202401180001',
//   amount: 100.00,
//   userId: '10086',
//   timestamp: 1705567200000,
//   nonce: 'abc123xyz',
//   sign: 'D41D8CD98F00B204E9800998ECF8427E'
// }
```

#### 后端自动校验

```java
@RestController
@RequestMapping("/api/order")
public class OrderController {
    
    // ✅ Filter 会自动校验签名，Controller 无需任何修改
    @GetMapping("/query")
    public Result<Order> query(
        @RequestParam String orderId,
        @RequestParam BigDecimal amount,
        @RequestParam String userId
        // timestamp、nonce、sign 由 Filter 自动处理
    ) {
        // 签名验证通过才会执行到这里
        return orderService.getOrder(orderId);
    }
}
```

### 示例 2：POST 请求签名

#### 前端实现

```javascript
// POST 请求也需要在 URL 参数中传递签名信息
async function signedPost(url, data, secret) {
    // 1. 准备签名参数
    const signParams = {
        timestamp: Date.now(),
        nonce: Math.random().toString(36).substring(2, 15)
    };
    
    // 2. 如果有查询参数，也要参与签名
    const urlObj = new URL(url, window.location.origin);
    urlObj.searchParams.forEach((value, key) => {
        signParams[key] = value;
    });
    
    // 3. 生成签名
    const sortedKeys = Object.keys(signParams).sort();
    const str = sortedKeys.map(key => `${key}=${signParams[key]}`).join('&');
    const signStr = str + `&secret=${secret}`;
    signParams.sign = MD5(signStr).toString().toUpperCase();
    
    // 4. 将签名参数拼接到 URL
    Object.keys(signParams).forEach(key => {
        urlObj.searchParams.append(key, signParams[key]);
    });
    
    // 5. 发送请求
    const response = await fetch(urlObj.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    
    return response.json();
}

// 使用
const result = await signedPost('/api/order/create', {
    orderId: '202401180001',
    amount: 100.00
}, 'your-sign-secret');
```

#### 后端接收

```java
@RestController
@RequestMapping("/api/order")
public class OrderController {
    
    @PostMapping("/create")
    public Result<Long> create(@RequestBody OrderRequest request) {
        // ✅ Filter 已校验 URL 参数中的签名
        // request body 不参与签名，仅传输业务数据
        Long orderId = orderService.create(request);
        return Result.success(orderId);
    }
}
```

### 示例 3：封装签名工具类

```javascript
// sign-utils.js
import MD5 from 'crypto-js/md5';

export class SignUtils {
    
    constructor(secret) {
        this.secret = secret;
    }
    
    /**
     * 为请求添加签名
     */
    sign(params = {}) {
        // 添加时间戳和随机数
        const signParams = {
            ...params,
            timestamp: Date.now(),
            nonce: this.generateNonce()
        };
        
        // 生成签名
        signParams.sign = this.generateSign(signParams);
        
        return signParams;
    }
    
    /**
     * 生成签名
     */
    generateSign(params) {
        // 过滤并排序
        const filteredParams = {};
        Object.keys(params)
            .filter(key => params[key] !== null && params[key] !== '' && key !== 'sign')
            .sort()
            .forEach(key => {
                filteredParams[key] = params[key];
            });
        
        // 拼接字符串
        const str = Object.keys(filteredParams)
            .map(key => `${key}=${filteredParams[key]}`)
            .join('&');
        
        // MD5 加密
        return MD5(str + `&secret=${this.secret}`).toString().toUpperCase();
    }
    
    /**
     * 生成随机数
     */
    generateNonce() {
        return Math.random().toString(36).substring(2, 15) +
               Math.random().toString(36).substring(2, 15);
    }
    
    /**
     * GET 请求
     */
    async get(url, params = {}) {
        const signedParams = this.sign(params);
        const queryString = new URLSearchParams(signedParams).toString();
        const response = await fetch(`${url}?${queryString}`);
        return response.json();
    }
    
    /**
     * POST 请求
     */
    async post(url, data = {}, queryParams = {}) {
        const signedParams = this.sign(queryParams);
        const queryString = new URLSearchParams(signedParams).toString();
        
        const response = await fetch(`${url}?${queryString}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        return response.json();
    }
}

// 使用
const signUtils = new SignUtils('your-sign-secret');

// GET 请求
const order = await signUtils.get('/api/order/query', {
    orderId: '202401180001'
});

// POST 请求
const result = await signUtils.post('/api/order/create', {
    orderId: '202401180001',
    amount: 100.00
});
```

### 示例 4：后端主动生成签名

```java
import com.molandev.framework.encrypt.sign.SignUtils;

@Service
public class ThirdPartyService {
    
    @Value("${third-party.secret}")
    private String secret;
    
    /**
     * 调用第三方接口
     */
    public void callThirdParty(Map<String, String> params) {
        // 1. 添加时间戳和随机数
        params.put("timestamp", String.valueOf(System.currentTimeMillis()));
        params.put("nonce", UUID.randomUUID().toString());
        
        // 2. 生成签名
        String sign = SignUtils.generateSign(params, secret);
        params.put("sign", sign);
        
        // 3. 发送请求
        String url = buildUrl("/api/data/push", params);
        RestTemplate restTemplate = new RestTemplate();
        String result = restTemplate.getForObject(url, String.class);
    }
}
```

### 示例 5：Vue.js 集成

```javascript
// plugins/sign.js
import { SignUtils } from '@/utils/sign-utils';

const signUtils = new SignUtils(process.env.VUE_APP_SIGN_SECRET);

export default {
    install(app) {
        // 全局方法
        app.config.globalProperties.$sign = signUtils;
        
        // 请求拦截器
        app.config.globalProperties.$axios.interceptors.request.use(config => {
            // 为所有请求自动添加签名
            if (config.method === 'get') {
                config.params = signUtils.sign(config.params || {});
            } else {
                // POST 请求签名在 URL 参数中
                const signedParams = signUtils.sign({});
                const separator = config.url.includes('?') ? '&' : '?';
                config.url += separator + new URLSearchParams(signedParams).toString();
            }
            return config;
        });
    }
};

// main.js
import signPlugin from './plugins/sign';
app.use(signPlugin);

// 组件中使用
export default {
    methods: {
        async fetchOrder() {
            // ✅ 自动添加签名
            const response = await this.$axios.get('/api/order/query', {
                params: { orderId: '123' }
            });
        }
    }
};
```

## 技术细节

### 签名算法

```text
签名流程：

1. 参数准备
   orderId=123&amount=100.00&userId=10086

2. 添加时间戳和随机数
   orderId=123&amount=100.00&userId=10086&timestamp=1705567200000&nonce=abc123

3. 过滤空值和 sign 字段
   orderId=123&amount=100.00&userId=10086&timestamp=1705567200000&nonce=abc123

4. 按 key 字典序排序
   amount=100.00&nonce=abc123&orderId=123&timestamp=1705567200000&userId=10086

5. 拼接密钥
   amount=100.00&nonce=abc123&orderId=123&timestamp=1705567200000&userId=10086&secret=your-sign-secret

6. MD5 加密并转大写
   D41D8CD98F00B204E9800998ECF8427E
```

### Filter 实现

```java
@Override
public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) {
    HttpServletRequest httpRequest = (HttpServletRequest) request;
    
    // 1. 白名单检查
    if (isWhitelisted(httpRequest.getRequestURI())) {
        chain.doFilter(request, response);
        return;
    }
    
    // 2. 获取所有参数
    Map<String, String> params = new HashMap<>();
    httpRequest.getParameterMap().forEach((key, values) -> {
        if (values.length > 0) {
            params.put(key, values[0]);
        }
    });
    
    // 3. 获取签名、时间戳、随机数
    String sign = params.get(signConfig.getSignName());
    String timestampStr = params.get(signConfig.getTimestampName());
    String nonce = params.get(signConfig.getNonceName());
    
    // 4. 参数校验
    if (StringUtils.isEmpty(sign)) {
        throw new SignException("签名不能为空");
    }
    if (StringUtils.isEmpty(timestampStr)) {
        throw new SignException("时间戳不能为空");
    }
    if (StringUtils.isEmpty(nonce)) {
        throw new SignException("随机数不能为空");
    }
    
    // 5. 时间戳校验
    long timestamp = Long.parseLong(timestampStr);
    if (!SignUtils.verifyTimestamp(timestamp, signConfig.getExpireTime())) {
        throw new SignException("请求已过期");
    }
    
    // 6. 随机数校验（防重放）
    if (nonceCache.containsKey(nonce)) {
        throw new SignException("请求重复，nonce已使用");
    }
    
    // 7. 签名校验
    if (!SignUtils.verifySign(params, sign, signConfig.getSecret())) {
        throw new SignException("签名验证失败");
    }
    
    // 8. 记录 nonce
    nonceCache.put(nonce, timestamp);
    
    // 9. 放行
    chain.doFilter(request, response);
}
```

### 防重放机制

```java
// nonce 缓存（生产环境建议使用 Redis）
private final Map<String, Long> nonceCache = new ConcurrentHashMap<>();

// 记录已使用的 nonce
nonceCache.put(nonce, timestamp);

// 定期清理过期的 nonce
private void cleanExpiredNonce(long expireTime) {
    long currentTime = System.currentTimeMillis();
    nonceCache.entrySet().removeIf(entry ->
        currentTime - entry.getValue() > expireTime * 1000
    );
}
```

### 异常处理

`SignFilter` 在校验失败（如签名不匹配、过期、nonce 重复）时会抛出 `SignException`。为了提供友好的前端提示，建议使用更高优先级的 Filter 捕获并包装响应：

```java
@Component
@Order(Integer.MIN_VALUE)
public class ErrorFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        try {
            chain.doFilter(request, response);
        } catch (SignException e) {
            // 返回自定义 JSON 格式
            response.setStatus(401);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"code\": 401, \"msg\": \"" + e.getMessage() + "\"}");
        }
    }
}
```

## 注意事项

### ⚠️ 时间同步

客户端和服务器时间必须同步：

```javascript
// 前端：使用服务器时间
async function getServerTime() {
    const response = await fetch('/api/server-time');
    const { timestamp } = await response.json();
    return timestamp;
}

// 生成签名时使用服务器时间
const serverTime = await getServerTime();
params.timestamp = serverTime;
```

### ⚠️ 密钥管理

- **不要硬编码**：使用环境变量
- **定期更换**：建立密钥轮换机制
- **前后端一致**：确保使用相同的密钥

### ⚠️ nonce 存储

生产环境建议使用 Redis：

```java
@Component
public class RedisNonceCache {
    
    @Autowired
    private RedisTemplate<String, String> redisTemplate;
    
    public boolean exists(String nonce) {
        return Boolean.TRUE.equals(redisTemplate.hasKey("nonce:" + nonce));
    }
    
    public void save(String nonce, long expireTime) {
        redisTemplate.opsForValue().set(
            "nonce:" + nonce, 
            String.valueOf(System.currentTimeMillis()),
            expireTime,
            TimeUnit.SECONDS
        );
    }
}
```

### ⚠️ 白名单配置

合理配置白名单，避免影响性能：

```yaml
molandev:
  encrypt:
    sign:
      whitelist:
        - /api/public/**       # 公开接口
        - /health              # 健康检查
        - /actuator/**         # 监控端点
        - /doc.html            # API 文档
        - /v3/api-docs/**      # OpenAPI
```

## 常见问题

### Q1: 签名验证失败怎么办？

**A**: 检查以下几点：

1. **密钥是否一致**：前后端使用相同的 secret
2. **参数是否完整**：确保所有参数都参与签名
3. **排序是否正确**：按字典序排序
4. **编码是否一致**：使用 UTF-8 编码
5. **大小写**：MD5 结果转大写

调试工具：

```java
// 后端打印签名字符串
System.out.println("待签名字符串: " + signStr);
System.out.println("生成的签名: " + generatedSign);
System.out.println("传入的签名: " + receivedSign);
```

### Q2: 如何调试签名问题？

**A**: 临时关闭签名校验：

```yaml
# application-dev.yml
molandev:
  encrypt:
    sign:
      enabled: false  # 开发环境关闭
```

或使用白名单：

```yaml
molandev:
  encrypt:
    sign:
      whitelist:
        - /**  # 临时放行所有接口
```

### Q3: POST 请求的 body 需要参与签名吗？

**A**: 不需要。签名只针对 URL 参数：

- **GET 请求**：所有查询参数参与签名
- **POST 请求**：仅 URL 参数参与签名，body 不参与

原因：便于前后端分离，body 数据可能很大。

### Q4: 如何防止暴力破解签名？

**A**: 

1. **使用强密钥**：至少 32 位随机字符
2. **限流保护**：接口添加限流
3. **IP 黑名单**：多次失败封禁 IP
4. **告警机制**：签名失败告警

### Q5: 时间戳精度是毫秒还是秒？

**A**: 毫秒。

```javascript
// JavaScript
timestamp: Date.now()  // 毫秒

// Java
System.currentTimeMillis()  // 毫秒
```

## 相关工具

- [MD5 加密工具](../util/encrypt/md5.md) - 签名算法实现
- [混合加密通信](./hybrid-encrypt.md) - 配合使用更安全

## 参考资料

- [数字签名](https://zh.wikipedia.org/wiki/%E6%95%B8%E4%BD%8D%E7%B0%BD%E7%AB%A0)
- [重放攻击](https://zh.wikipedia.org/wiki/%E9%87%8D%E6%94%BE%E6%94%BB%E5%87%BB)
