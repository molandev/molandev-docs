# 注解式使用

molandev-lock 提供两个核心注解：`@GlobalLock`（全局锁）和 `@Idempotent`（幂等控制），适合简单同步场景。

## @GlobalLock 全局锁

### 注解说明

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface GlobalLock {
    
    /**
     * 锁的 key，支持 SpEL 表达式
     * 默认：类名 + 方法名
     */
    String key() default "";
    
    /**
     * 获取锁的超时时间（秒）
     * 默认：30秒
     */
    long waitTime() default 30;
    
    /**
     * 锁自动释放时间（秒）
     * 默认：60秒
     */
    long leaseTime() default 60;
    
    /**
     * 获取锁超时的降级方法名
     * 默认：抛出 LockTimeoutException
     */
    String timeoutFallback() default "";
}
```

### 配置项说明

| 配置项 | 类型 | 默认值 | 必填 | 说明 |
|-------|------|--------|------|------|
| key | String | 类名+方法名 | ❌ | 锁的 key，支持 SpEL 表达式 |
| waitTime | long | 30 | ❌ | 获取锁的超时时间（秒） |
| leaseTime | long | 60 | ❌ | 锁自动释放时间（秒） |
| timeoutFallback | String | - | ❌ | 超时降级方法名 |

## 使用示例

### 示例 1：基本用法

```java
@Service
public class InventoryService {
    
    // 使用默认 key（类名+方法名）
    @GlobalLock
    public void updateInventory(Long productId, Integer quantity) {
        // 所有调用此方法的请求都会被同一把锁阻塞
        inventoryDao.update(productId, quantity);
    }
}
```

::: warning 注意
使用默认 key 会导致所有请求串行执行，性能较差，不推荐！
:::

### 示例 2：使用动态 key（推荐）

```java
@Service
public class InventoryService {
    
    // 每个商品使用独立的锁
    @GlobalLock(key = "'INVENTORY_' + #productId")
    public void updateInventory(Long productId, Integer quantity) {
        // 只有相同 productId 的请求会互斥
        inventoryDao.update(productId, quantity);
    }
    
    // 使用对象属性
    @GlobalLock(key = "'ORDER_' + #request.orderId")
    public OrderResult createOrder(OrderRequest request) {
        return orderService.create(request);
    }
    
    // 组合多个参数
    @GlobalLock(key = "'USER_ORDER_' + #userId + '_' + #orderId")
    public void processUserOrder(Long userId, String orderId) {
        orderService.process(userId, orderId);
    }
}
```

### SpEL 表达式说明

| 表达式 | 说明 | 示例 |
|--------|------|------|
| `#参数名` | 引用方法参数 | `#productId` |
| `#对象.属性` | 引用对象属性 | `#request.orderId` |
| `'常量'` | 字符串常量 | `'LOCK_'` |
| `+` | 字符串拼接 | `'ORDER_' + #id` |

### 示例 3：自定义超时时间

```java
@Service
public class PaymentService {
    
    // 支付业务耗时较长，增加超时时间
    @GlobalLock(
        key = "'PAYMENT_' + #paymentId",
        waitTime = 30,   // 等待30秒
        leaseTime = 120  // 锁持有120秒
    )
    public PaymentResult processPayment(String paymentId) {
        // 调用第三方支付接口，可能耗时较长
        return paymentGateway.pay(paymentId);
    }
    
    // 快速操作，缩短超时时间
    @GlobalLock(
        key = "'CACHE_' + #key",
        waitTime = 5,
        leaseTime = 10
    )
    public void updateCache(String key, String value) {
        redisTemplate.set(key, value);
    }
}
```

### 示例 4：超时降级策略

```java
@Service
public class OrderService {
    
    // 配置超时降级方法
    @GlobalLock(
        key = "'ORDER_' + #orderId",
        waitTime = 10,
        timeoutFallback = "createOrderFallback"
    )
    public OrderResult createOrder(String orderId, OrderRequest request) {
        // 正常业务逻辑
        return orderDao.create(orderId, request);
    }
    
    /**
     * 降级方法
     * 注意：方法签名必须与原方法一致
     */
    public OrderResult createOrderFallback(String orderId, OrderRequest request) {
        // 降级逻辑：返回默认值或抛出友好提示
        log.warn("创建订单获取锁超时，进入降级逻辑: {}", orderId);
        throw new BusinessException("系统繁忙，请稍后重试");
    }
}
```

::: tip 降级方法规则
1. 必须在同一个类中
2. 方法签名（参数类型、顺序、返回值）必须与原方法一致
3. 可以是 private 方法
:::

## @Idempotent 幂等控制

### 注解说明

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Idempotent {
    
    /**
     * 幂等 key，支持 SpEL 表达式
     * 默认：请求 URI + 参数
     */
    String key() default "";
    
    /**
     * 有效期（秒）
     * 默认：60秒
     */
    int expireTime() default 60;
    
    /**
     * 重复请求提示信息
     * 默认："请勿重复请求"
     */
    String msg() default "请勿重复请求";
}
```

### 配置项说明

| 配置项 | 类型 | 默认值 | 必填 | 说明 |
|-------|------|--------|------|------|
| key | String | URI+参数 | ❌ | 幂等 key，支持 SpEL 表达式 |
| expireTime | int | 60 | ❌ | 幂等有效期（秒） |
| msg | String | 请勿重复请求 | ❌ | 重复请求提示信息 |

## 使用示例

### 示例 1：防止重复提交

```java
@RestController
@RequestMapping("/api/order")
public class OrderController {
    
    // 使用订单ID作为幂等key
    @PostMapping("/create")
    @Idempotent(
        key = "#request.orderId",
        expireTime = 60,
        msg = "订单正在创建中，请勿重复提交"
    )
    public Result<Order> createOrder(@RequestBody OrderRequest request) {
        Order order = orderService.create(request);
        return Result.success(order);
    }
}
```

### 示例 2：按用户维度幂等

```java
@RestController
@RequestMapping("/api/payment")
public class PaymentController {
    
    // 每个用户独立的幂等控制
    @PostMapping("/pay")
    @Idempotent(
        key = "'PAY_' + #request.userId + '_' + #request.orderId",
        expireTime = 300,  // 5分钟
        msg = "支付请求处理中，请勿重复点击"
    )
    public Result<PaymentResult> pay(@RequestBody PaymentRequest request) {
        PaymentResult result = paymentService.process(request);
        return Result.success(result);
    }
}
```

### 示例 3：默认key（URI+参数）

```java
@RestController
public class UserController {
    
    // 使用默认 key：当前请求 URI + 所有参数的组合
    @PostMapping("/register")
    @Idempotent(expireTime = 60)
    public Result<User> register(@RequestBody RegisterRequest request) {
        // 相同 URI + 相同参数 = 相同的幂等 key
        User user = userService.register(request);
        return Result.success(user);
    }
}
```

### 示例 4：表单重复提交

```java
@RestController
@RequestMapping("/api/form")
public class FormController {
    
    @PostMapping("/submit")
    @Idempotent(
        key = "'FORM_' + #request.formId + '_' + #request.userId",
        expireTime = 120,
        msg = "表单正在提交中，请勿重复操作"
    )
    public Result<Void> submitForm(@RequestBody FormRequest request) {
        formService.submit(request);
        return Result.success();
    }
}
```

## @GlobalLock vs @Idempotent

### 核心区别

| 特性 | @GlobalLock | @Idempotent |
|------|-------------|-------------|
| 使用场景 | 并发控制，保证原子性 | 防重复提交，保证幂等性 |
| 阻塞行为 | 后续请求等待（可配置） | 后续请求直接拒绝 |
| 释放时机 | 方法执行完自动释放 | 达到有效期自动失效 |
| 适用场景 | 库存扣减、订单处理 | 创建订单、支付请求 |
| 返回值 | 等待后执行 | 抛出异常或返回错误 |

### 使用场景对比

#### 场景 1：库存扣减

```java
// ✅ 使用 @GlobalLock
@GlobalLock(key = "'INVENTORY_' + #productId")
public boolean deductInventory(Long productId, Integer quantity) {
    // 并发请求会等待，依次执行
    return inventoryDao.deduct(productId, quantity);
}

// ❌ 不应使用 @Idempotent
// 因为多个用户购买同一商品是正常行为，应该依次处理而非拒绝
```

#### 场景 2：订单创建

```java
// ✅ 使用 @Idempotent
@Idempotent(key = "#request.orderId")
public Order createOrder(OrderRequest request) {
    // 相同订单ID的重复请求直接拒绝
    return orderService.create(request);
}

// ❌ 不应使用 @GlobalLock
// 因为重复请求应该直接拒绝，而不是等待
```

## 组合使用

### 示例：支付+幂等

```java
@Service
public class PaymentService {
    
    // 外层：幂等控制，防止用户重复点击
    @Idempotent(
        key = "'PAY_' + #orderId",
        expireTime = 300,
        msg = "支付请求处理中，请勿重复提交"
    )
    public PaymentResult processPayment(String orderId) {
        return doPayment(orderId);
    }
    
    // 内层：锁控制，保证支付原子性
    @GlobalLock(
        key = "'PAY_LOCK_' + #orderId",
        waitTime = 30,
        leaseTime = 60
    )
    private PaymentResult doPayment(String orderId) {
        // 1. 查询订单
        Order order = orderDao.getById(orderId);
        
        // 2. 调用支付
        PaymentResult result = paymentGateway.pay(order);
        
        // 3. 更新订单
        orderDao.updatePaymentStatus(orderId, result);
        
        return result;
    }
}
```

## 常见问题

### Q1: 为什么推荐使用动态 key？

**A**: 使用固定 key 会导致所有请求串行执行，严重影响性能。

```java
// ❌ 错误：所有请求使用同一把锁
@GlobalLock(key = "'lockKey'")
public void updateInventory(Long productId, Integer quantity) {
    // 所有商品的库存更新都会串行执行
}

// ✅ 正确：每个商品使用独立的锁
@GlobalLock(key = "'INVENTORY_' + #productId")
public void updateInventory(Long productId, Integer quantity) {
    // 只有相同商品的库存更新会互斥
}
```

### Q2: leaseTime 应该设置多大？

**A**: leaseTime 应该是业务执行时间的 2-3 倍，防止业务未完成锁就释放了。

```java
// 业务平均执行 10 秒
@GlobalLock(
    key = "'ORDER_' + #orderId",
    waitTime = 30,
    leaseTime = 30  // 设置为 30 秒，留有余地
)
```

### Q3: 如何处理获取锁失败？

**A**: 
- **方式1**：使用 `timeoutFallback` 配置降级方法
- **方式2**：不配置降级，让框架抛出 `LockTimeoutException`，在全局异常处理器中处理

```java
// 方式1：配置降级方法
@GlobalLock(
    key = "'ORDER_' + #orderId",
    timeoutFallback = "createOrderFallback"
)
public OrderResult createOrder(String orderId) {
    // 正常逻辑
}

public OrderResult createOrderFallback(String orderId) {
    // 降级逻辑
    return OrderResult.busy();
}

// 方式2：全局异常处理
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(LockTimeoutException.class)
    public Result<?> handleLockTimeout(LockTimeoutException e) {
        return Result.error("系统繁忙，请稍后重试");
    }
}
```

### Q4: @Idempotent 如何处理重复请求？

**A**: 直接抛出 `IdempotentException`，可以在全局异常处理器中统一处理。

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(IdempotentException.class)
    public Result<?> handleIdempotent(IdempotentException e) {
        return Result.error(e.getMessage());  // 返回配置的 msg
    }
}
```

## 最佳实践

### ✅ 推荐做法

```java
// 1. 使用动态 key
@GlobalLock(key = "'ORDER_' + #orderId")

// 2. 合理设置超时时间
@GlobalLock(waitTime = 30, leaseTime = 60)

// 3. 配置降级策略
@GlobalLock(
    key = "'ORDER_' + #orderId",
    timeoutFallback = "fallbackMethod"
)

// 4. 幂等 key 要能唯一标识业务
@Idempotent(key = "'ORDER_' + #request.orderId")
```

### ❌ 避免做法

```java
// 1. 避免使用固定 key
@GlobalLock(key = "'lockKey'")  // ❌

// 2. 避免 leaseTime 小于业务执行时间
@GlobalLock(leaseTime = 5)  // ❌ 业务可能需要 10 秒

// 3. 避免在幂等方法中执行耗时操作
@Idempotent(expireTime = 60)
public void process() {
    Thread.sleep(120000);  // ❌ 超过有效期
}
```

## 下一步

- [编程式 API](./programming.md) - LockUtils 工具类详解
- [最佳实践](./best-practices.md) - 生产环境使用指南
- [实现原理](./implementation.md) - 了解底层实现
