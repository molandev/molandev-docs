# 快速开始

本指南通过 **5 个实战示例**，帮助你在 **10 分钟内**掌握 molandev-lock 分布式锁模块的核心用法。

## 第一步：添加依赖

```xml
<dependency>
    <groupId>com.molandev.framework</groupId>
    <artifactId>molandev-lock</artifactId>
    <version>${molandev.version}</version>
</dependency>
```

## 第二步：选择锁实现

根据项目情况选择合适的锁实现方式：

| 场景 | 推荐实现 | 配置 |
|------|----------|------|
| 分布式系统（已有Redis） | Redis | `molandev.lock.type=redis` |
| 分布式系统（需要高级功能） | Redisson | `molandev.lock.type=redisson` |
| 单机应用 / 测试环境 | Memory | `molandev.lock.type=memory`（默认） |

### 配置示例

```yaml
# application.yml
molandev:
  lock:
    type: redis  # 可选: redis, redisson, memory
```

::: tip 提示
- **Memory**：默认值，无需额外依赖，适合单机或测试
- **Redis**：需要配置 RedisTemplate
- **Redisson**：需要引入 Redisson 依赖
:::

## 第三步：选择使用方式

| 方式 | 优势 | 适用场景 |
|------|------|----------|
| 编程式（LockUtils） | 灵活、可控、推荐 ⭐⭐⭐⭐⭐ | 复杂业务逻辑 |
| 注解式（@GlobalLock） | 简单、优雅 ⭐⭐⭐⭐ | 简单同步场景 |

## 示例 1：订单处理（编程式）

**场景**：防止同一订单被重复处理

### 代码实现

```java
import com.molandev.framework.lock.utils.LockUtils;
import org.springframework.stereotype.Service;

@Service
public class OrderService {
    
    /**
     * 处理订单 - 防止重复处理
     */
    public OrderResult processOrder(String orderId) {
        // 使用 orderId 作为锁key，确保同一订单不会被并发处理
        return LockUtils.runInLock("ORDER_PROCESS_" + orderId, () -> {
            // 1. 查询订单
            Order order = orderDao.getById(orderId);
            
            // 2. 校验订单状态
            if (order.getStatus() != OrderStatus.CREATED) {
                throw new BusinessException("订单状态不允许处理");
            }
            
            // 3. 处理订单逻辑
            order.setStatus(OrderStatus.PROCESSING);
            orderDao.update(order);
            
            // 4. 执行业务逻辑
            return executeOrderBusiness(order);
        });
    }
}
```

### 使用说明

- **锁 Key**：`ORDER_PROCESS_` + orderId，每个订单独立的锁
- **默认参数**：waitTime=30秒，leaseTime=60秒
- **自动释放**：业务逻辑执行完自动释放锁，异常也会释放

## 示例 2：库存扣减（注解式）

**场景**：保证库存操作的原子性

### 代码实现

```java
import com.molandev.framework.lock.annotation.GlobalLock;
import org.springframework.stereotype.Service;

@Service
public class InventoryService {
    
    /**
     * 扣减库存 - 保证原子性
     */
    @GlobalLock(
        key = "'INVENTORY_' + #productId",
        waitTime = 10,
        leaseTime = 30
    )
    public boolean deductInventory(Long productId, Integer quantity) {
        // 1. 查询当前库存
        Integer currentStock = inventoryDao.getCurrentStock(productId);
        
        // 2. 校验库存
        if (currentStock < quantity) {
            throw new InsufficientStockException("库存不足");
        }
        
        // 3. 扣减库存
        return inventoryDao.deduct(productId, quantity);
    }
}
```

### 使用说明

- **key**：使用 SpEL 表达式，`#productId` 引用方法参数
- **waitTime**：获取锁的最大等待时间（秒）
- **leaseTime**：锁自动释放时间（秒）

## 示例 3：幂等控制（注解式）

**场景**：防止用户重复提交订单

### 代码实现

```java
import com.molandev.framework.lock.annotation.Idempotent;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/order")
public class OrderController {
    
    /**
     * 创建订单 - 防止重复提交
     */
    @PostMapping("/create")
    @Idempotent(
        key = "#request.orderId",
        expireTime = 60,
        msg = "订单正在创建中，请勿重复提交"
    )
    public Result<Order> createOrder(@RequestBody OrderRequest request) {
        // 创建订单逻辑
        Order order = orderService.create(request);
        return Result.success(order);
    }
}
```

### 使用说明

- **key**：幂等键，相同的 key 在有效期内只能执行一次
- **expireTime**：幂等有效期（秒），建议大于业务执行时间
- **msg**：重复提交时的提示信息

### 效果演示

```bash
# 第一次请求 - 成功
POST /api/order/create
{
  "orderId": "ORDER001",
  "amount": 100
}
响应: { "success": true, "data": {...} }

# 第二次请求（60秒内） - 拒绝
POST /api/order/create
{
  "orderId": "ORDER001",
  "amount": 100
}
响应: { "success": false, "message": "订单正在创建中，请勿重复提交" }
```

## 示例 4：自定义超时时间（编程式）

**场景**：支付处理，需要更长的处理时间

### 代码实现

```java
@Service
public class PaymentService {
    
    /**
     * 处理支付 - 自定义超时时间
     */
    public PaymentResult processPayment(String paymentId) {
        // waitTime=30秒，leaseTime=120秒（支付逻辑可能较慢）
        return LockUtils.runInLock(
            "PAYMENT_" + paymentId,
            30,  // 等待30秒
            120, // 锁持有120秒
            () -> {
                // 1. 调用支付网关
                PaymentGatewayResponse response = paymentGateway.pay(paymentId);
                
                // 2. 更新订单状态
                updateOrderStatus(paymentId, response);
                
                // 3. 返回结果
                return buildPaymentResult(response);
            }
        );
    }
}
```

### 参数说明

- **waitTime=30**：尝试获取锁最多等待 30 秒
- **leaseTime=120**：锁最多持有 120 秒后自动释放（防死锁）

## 示例 5：无返回值操作（编程式）

**场景**：清理缓存，无需返回值

### 代码实现

```java
@Service
public class CacheService {
    
    /**
     * 清理缓存 - 无返回值
     */
    public void clearCache(String cacheKey) {
        // 使用 Runnable，不需要返回值
        LockUtils.runInLock("CACHE_CLEAR_" + cacheKey, () -> {
            // 清理缓存逻辑
            redisTemplate.delete(cacheKey);
            
            // 记录日志
            log.info("缓存已清理: {}", cacheKey);
        });
    }
    
    /**
     * 批量清理缓存 - 自定义超时
     */
    public void batchClearCache(List<String> cacheKeys) {
        LockUtils.runInLock(
            "CACHE_BATCH_CLEAR",
            10,  // waitTime
            60,  // leaseTime
            () -> {
                // 批量删除
                redisTemplate.delete(cacheKeys);
                log.info("批量清理缓存: {} 个", cacheKeys.size());
            }
        );
    }
}
```

## 常见问题

### Q1: 编程式和注解式如何选择？

**A**: 
- **编程式（推荐）**：适合复杂业务，灵活性高，便于异常处理
- **注解式**：适合简单场景，代码简洁，适合纯粹的同步需求

### Q2: 锁的 key 应该如何设计？

**A**: 
- ❌ **错误**：使用固定值 `"lockKey"`，会导致所有请求串行
- ✅ **正确**：使用业务 ID `"ORDER_" + orderId`，只锁定相同订单

### Q3: waitTime 和 leaseTime 如何设置？

**A**: 
- **waitTime**：获取锁的等待时间，推荐 10-30 秒
- **leaseTime**：锁自动释放时间，应该是业务执行时间的 2-3 倍

### Q4: Redis 锁和 Memory 锁的区别？

**A**: 

| 特性 | Redis | Memory |
|------|-------|--------|
| 分布式 | ✅ 支持 | ❌ 不支持 |
| 适用场景 | 多实例部署 | 单实例 / 测试 |
| 性能 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 依赖 | 需要 Redis | 无依赖 |

### Q5: 获取锁失败会发生什么？

**A**: 
- **编程式**：抛出 `LockTimeoutException`，可以 try-catch 处理
- **注解式（@GlobalLock）**：可以配置 `timeoutFallback` 降级方法
- **注解式（@Idempotent）**：抛出 `IdempotentException`，提示重复请求

## 最佳实践总结

### ✅ 推荐做法

```java
// 1. 使用业务 ID 作为锁 key
LockUtils.runInLock("ORDER_" + orderId, () -> {...});

// 2. 合理设置超时时间
LockUtils.runInLock(key, 30, 60, () -> {...});

// 3. 使用编程式，便于异常处理
try {
    return LockUtils.runInLock(key, () -> {...});
} catch (LockTimeoutException e) {
    // 降级处理
    return defaultValue;
}
```

### ❌ 避免做法

```java
// 1. 避免使用固定锁 key
@GlobalLock(key = "'lockKey'")  // ❌ 错误

// 2. 避免 leaseTime 小于业务执行时间
@GlobalLock(waitTime = 1, leaseTime = 5)  // ❌ 业务可能需要10秒

// 3. 避免在锁内执行耗时操作
LockUtils.runInLock(key, () -> {
    Thread.sleep(10000);  // ❌ 应该缩短锁持有时间
});
```

## 下一步

- [注解详解](./annotation.md) - @GlobalLock 和 @Idempotent 完整说明
- [编程式 API](./programming.md) - LockUtils 详细用法
- [最佳实践](./best-practices.md) - 生产环境使用指南
- [实现原理](./implementation.md) - 了解底层实现
