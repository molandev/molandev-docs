# 编程式使用

编程式使用提供了最高的灵活性和控制力，通过 `LockUtils` 静态工具类实现，**推荐在生产环境使用**。

## LockUtils API

### 核心方法

```java
public class LockUtils {
    
    /**
     * 在锁内执行操作（有返回值）- 使用默认超时
     */
    public static <T> T runInLock(String key, Supplier<T> supplier);
    
    /**
     * 在锁内执行操作（有返回值）- 自定义超时
     */
    public static <T> T runInLock(String key, long waitTime, long leaseTime, Supplier<T> supplier);
    
    /**
     * 在锁内执行操作（无返回值）- 使用默认超时
     */
    public static void runInLock(String key, Runnable runnable);
    
    /**
     * 在锁内执行操作（无返回值）- 自定义超时
     */
    public static void runInLock(String key, long waitTime, long leaseTime, Runnable runnable);
}
```

### 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| key | String | - | 锁的key，建议使用业务前缀+业务ID |
| waitTime | long | 30 | 获取锁的超时时间（秒） |
| leaseTime | long | 60 | 锁自动释放时间（秒） |
| supplier | Supplier\<T> | - | 有返回值的业务逻辑 |
| runnable | Runnable | - | 无返回值的业务逻辑 |

## 基本用法

### 示例 1：有返回值的操作

```java
@Service
public class OrderService {
    
    /**
     * 处理订单 - 返回处理结果
     */
    public OrderResult processOrder(String orderId) {
        return LockUtils.runInLock("ORDER_PROCESS_" + orderId, () -> {
            // 1. 查询订单
            Order order = orderDao.getById(orderId);
            
            // 2. 校验状态
            if (order.getStatus() != OrderStatus.CREATED) {
                throw new BusinessException("订单状态不正确");
            }
            
            // 3. 处理订单
            order.setStatus(OrderStatus.PROCESSING);
            orderDao.update(order);
            
            // 4. 返回结果
            return OrderResult.success(order);
        });
    }
    
    /**
     * 查询订单状态
     */
    public OrderStatus getOrderStatus(String orderId) {
        return LockUtils.runInLock("ORDER_STATUS_" + orderId, () -> {
            Order order = orderDao.getById(orderId);
            return order.getStatus();
        });
    }
}
```

### 示例 2：无返回值的操作

```java
@Service
public class CacheService {
    
    /**
     * 清理缓存 - 无返回值
     */
    public void clearCache(String cacheKey) {
        LockUtils.runInLock("CACHE_CLEAR_" + cacheKey, () -> {
            // 删除缓存
            redisTemplate.delete(cacheKey);
            
            // 记录日志
            log.info("缓存已清理: {}", cacheKey);
        });
    }
    
    /**
     * 更新缓存
     */
    public void updateCache(String key, Object value) {
        LockUtils.runInLock("CACHE_UPDATE_" + key, () -> {
            redisTemplate.opsForValue().set(key, value);
            log.info("缓存已更新: {}", key);
        });
    }
}
```

## 自定义超时时间

### 示例 3：快速操作

```java
@Service
public class QuickOperationService {
    
    /**
     * 快速更新操作 - 缩短超时时间
     */
    public void quickUpdate(String key, String value) {
        LockUtils.runInLock(
            "QUICK_UPDATE_" + key,
            5,   // waitTime: 5秒
            10,  // leaseTime: 10秒
            () -> {
                // 快速操作，不需要长时间持有锁
                dataDao.update(key, value);
            }
        );
    }
}
```

### 示例 4：耗时操作

```java
@Service
public class PaymentService {
    
    /**
     * 支付处理 - 增加超时时间
     */
    public PaymentResult processPayment(String paymentId) {
        return LockUtils.runInLock(
            "PAYMENT_" + paymentId,
            30,   // waitTime: 30秒
            120,  // leaseTime: 120秒（支付可能较慢）
            () -> {
                // 1. 调用支付网关
                PaymentGatewayResponse response = paymentGateway.pay(paymentId);
                
                // 2. 等待支付结果（可能较慢）
                PaymentStatus status = paymentGateway.queryStatus(paymentId);
                
                // 3. 更新订单状态
                orderDao.updatePaymentStatus(paymentId, status);
                
                // 4. 返回结果
                return PaymentResult.of(status);
            }
        );
    }
}
```

## 异常处理

### 示例 5：try-catch 处理

```java
@Service
public class OrderService {
    
    /**
     * 创建订单 - 处理锁超时异常
     */
    public OrderResult createOrder(OrderRequest request) {
        try {
            return LockUtils.runInLock("ORDER_CREATE_" + request.getOrderId(), () -> {
                // 创建订单逻辑
                Order order = orderDao.create(request);
                return OrderResult.success(order);
            });
        } catch (LockTimeoutException e) {
            // 获取锁超时，返回友好提示
            log.warn("创建订单获取锁超时: {}", request.getOrderId(), e);
            return OrderResult.error("系统繁忙，请稍后重试");
        } catch (Exception e) {
            // 业务异常
            log.error("创建订单失败: {}", request.getOrderId(), e);
            return OrderResult.error("创建订单失败: " + e.getMessage());
        }
    }
}
```

### 示例 6：降级策略

```java
@Service
public class InventoryService {
    
    /**
     * 扣减库存 - 锁超时使用降级策略
     */
    public boolean deductInventory(Long productId, Integer quantity) {
        try {
            return LockUtils.runInLock(
                "INVENTORY_DEDUCT_" + productId,
                10,  // 只等待10秒
                30,
                () -> {
                    // 库存扣减逻辑
                    return inventoryDao.deduct(productId, quantity);
                }
            );
        } catch (LockTimeoutException e) {
            // 降级策略：使用乐观锁重试
            log.warn("获取锁超时，使用乐观锁降级: {}", productId);
            return deductWithOptimisticLock(productId, quantity);
        }
    }
    
    /**
     * 乐观锁降级方案
     */
    private boolean deductWithOptimisticLock(Long productId, Integer quantity) {
        for (int i = 0; i < 3; i++) {
            try {
                return inventoryDao.deductWithVersion(productId, quantity);
            } catch (OptimisticLockException e) {
                // 重试
                if (i == 2) throw e;
            }
        }
        return false;
    }
}
```

## 复杂场景

### 示例 7：多步骤业务

```java
@Service
public class OrderService {
    
    /**
     * 提交订单 - 多步骤业务流程
     */
    public OrderResult submitOrder(OrderRequest request) {
        return LockUtils.runInLock(
            "ORDER_SUBMIT_" + request.getOrderId(),
            30,
            90,
            () -> {
                // 步骤1：校验订单
                validateOrder(request);
                
                // 步骤2：锁定库存
                lockInventory(request.getItems());
                
                // 步骤3：创建订单
                Order order = createOrderRecord(request);
                
                // 步骤4：扣减库存
                deductInventory(request.getItems());
                
                // 步骤5：生成支付单
                Payment payment = createPayment(order);
                
                // 步骤6：返回结果
                return OrderResult.builder()
                    .order(order)
                    .payment(payment)
                    .build();
            }
        );
    }
}
```

### 示例 8：条件执行

```java
@Service
public class ActivityService {
    
    /**
     * 参与活动 - 根据条件决定是否执行
     */
    public ActivityResult joinActivity(Long userId, Long activityId) {
        return LockUtils.runInLock(
            "ACTIVITY_JOIN_" + userId + "_" + activityId,
            () -> {
                // 1. 查询活动信息
                Activity activity = activityDao.getById(activityId);
                
                // 2. 检查活动状态
                if (activity.getStatus() != ActivityStatus.ONGOING) {
                    return ActivityResult.error("活动未开始或已结束");
                }
                
                // 3. 检查用户是否已参与
                if (hasJoined(userId, activityId)) {
                    return ActivityResult.error("您已参与过该活动");
                }
                
                // 4. 检查活动人数
                if (activity.getCurrentCount() >= activity.getMaxCount()) {
                    return ActivityResult.error("活动名额已满");
                }
                
                // 5. 参与活动
                activityDao.join(userId, activityId);
                activityDao.incrementCount(activityId);
                
                return ActivityResult.success("参与成功");
            }
        );
    }
}
```

### 示例 9：批量操作

```java
@Service
public class BatchService {
    
    /**
     * 批量更新 - 为每个项目加锁
     */
    public List<Result> batchUpdate(List<UpdateRequest> requests) {
        List<Result> results = new ArrayList<>();
        
        for (UpdateRequest request : requests) {
            try {
                Result result = LockUtils.runInLock(
                    "BATCH_UPDATE_" + request.getId(),
                    5,   // 批量操作单个项超时短一些
                    15,
                    () -> {
                        // 更新单个项目
                        return updateItem(request);
                    }
                );
                results.add(result);
            } catch (LockTimeoutException e) {
                // 单个失败不影响其他
                results.add(Result.error("获取锁超时: " + request.getId()));
            }
        }
        
        return results;
    }
}
```

## 与Spring事务结合

### 示例 10：事务内使用锁

```java
@Service
public class OrderService {
    
    @Autowired
    private TransactionTemplate transactionTemplate;
    
    /**
     * 方式1：锁在事务外（推荐）
     */
    public OrderResult createOrderV1(OrderRequest request) {
        return LockUtils.runInLock("ORDER_" + request.getOrderId(), () -> {
            // 在锁内执行事务
            return transactionTemplate.execute(status -> {
                // 数据库操作
                Order order = orderDao.create(request);
                inventoryDao.deduct(request.getProductId(), request.getQuantity());
                return OrderResult.success(order);
            });
        });
    }
    
    /**
     * 方式2：事务在锁外（不推荐）
     */
    @Transactional
    public OrderResult createOrderV2(OrderRequest request) {
        // ❌ 不推荐：事务比锁先开启，锁释放后事务还未提交
        return LockUtils.runInLock("ORDER_" + request.getOrderId(), () -> {
            Order order = orderDao.create(request);
            inventoryDao.deduct(request.getProductId(), request.getQuantity());
            return OrderResult.success(order);
        });
    }
}
```

::: warning 注意
推荐锁在事务外，确保锁释放时事务已提交，避免其他线程读到未提交的数据。
:::

## 性能优化

### 示例 11：缩小锁范围

```java
@Service
public class OptimizedService {
    
    /**
     * ❌ 不推荐：锁范围过大
     */
    public OrderResult processOrderBad(String orderId) {
        return LockUtils.runInLock("ORDER_" + orderId, () -> {
            // 耗时操作1：查询用户信息（不需要锁）
            User user = userService.getById(order.getUserId());
            
            // 耗时操作2：查询商品信息（不需要锁）
            Product product = productService.getById(order.getProductId());
            
            // 真正需要锁的操作
            return orderDao.create(order);
        });
    }
    
    /**
     * ✅ 推荐：缩小锁范围
     */
    public OrderResult processOrderGood(String orderId) {
        // 不需要锁的操作放在外面
        User user = userService.getById(order.getUserId());
        Product product = productService.getById(order.getProductId());
        
        // 只对关键操作加锁
        return LockUtils.runInLock("ORDER_" + orderId, () -> {
            return orderDao.create(order);
        });
    }
}
```

### 示例 12：避免嵌套锁

```java
@Service
public class NestedLockService {
    
    /**
     * ❌ 不推荐：嵌套锁容易死锁
     */
    public void nestedLockBad(String orderId, String productId) {
        LockUtils.runInLock("ORDER_" + orderId, () -> {
            // 外层锁
            
            LockUtils.runInLock("PRODUCT_" + productId, () -> {
                // 内层锁 - 可能死锁
                processData(orderId, productId);
            });
        });
    }
    
    /**
     * ✅ 推荐：合并为单个锁
     */
    public void flatLockGood(String orderId, String productId) {
        // 使用组合key，避免嵌套
        String lockKey = "ORDER_PRODUCT_" + orderId + "_" + productId;
        LockUtils.runInLock(lockKey, () -> {
            processData(orderId, productId);
        });
    }
}
```

## 常见问题

### Q1: 为什么推荐使用编程式？

**A**: 
1. **灵活性高**：可以精确控制锁的范围
2. **异常处理**：可以 try-catch 捕获异常，实现降级
3. **动态参数**：lockKey 可以动态拼接，不受 SpEL 限制
4. **条件执行**：可以根据条件决定是否加锁

### Q2: LockUtils 和注解能混用吗？

**A**: 可以混用，但要注意避免死锁。

```java
@Service
public class MixedService {
    
    // 注解式
    @GlobalLock(key = "'OUTER_' + #id")
    public void outerMethod(String id) {
        innerMethod(id);
    }
    
    // 编程式
    public void innerMethod(String id) {
        LockUtils.runInLock("INNER_" + id, () -> {
            // 业务逻辑
        });
    }
}
```

### Q3: 如何选择 waitTime 和 leaseTime？

**A**: 
- **waitTime**：根据业务容忍度设置，一般 10-30 秒
- **leaseTime**：必须大于业务执行时间，建议是执行时间的 2-3 倍

```java
// 业务平均执行 10 秒
LockUtils.runInLock(
    key,
    20,   // waitTime: 20秒，允许等待
    30    // leaseTime: 30秒，留有余地
);
```

### Q4: 锁超时了但业务还在执行怎么办？

**A**: 这是分布式锁的常见问题，解决方案：

1. **合理设置 leaseTime**：确保大于业务执行时间
2. **业务幂等**：即使重复执行也不会出问题
3. **看门狗机制**：Redisson 支持自动续期

## 最佳实践

### ✅ 推荐做法

```java
// 1. 使用有意义的 key 前缀
LockUtils.runInLock("ORDER_PROCESS_" + orderId, () -> {...});

// 2. try-catch 处理异常
try {
    return LockUtils.runInLock(key, () -> {...});
} catch (LockTimeoutException e) {
    // 降级处理
}

// 3. 缩小锁范围
// 准备数据
Data data = prepareData();
// 只对关键操作加锁
LockUtils.runInLock(key, () -> processData(data));

// 4. 避免在锁内执行耗时操作
LockUtils.runInLock(key, () -> {
    // ✅ 数据库操作
    dao.update(...);
    
    // ❌ 避免 HTTP 调用
    // httpClient.call(...);
});
```

### ❌ 避免做法

```java
// 1. 避免使用固定 key
LockUtils.runInLock("lockKey", () -> {...});  // ❌

// 2. 避免嵌套锁
LockUtils.runInLock("key1", () -> {
    LockUtils.runInLock("key2", () -> {...});  // ❌
});

// 3. 避免锁范围过大
LockUtils.runInLock(key, () -> {
    sleep(10000);  // ❌ 不要在锁内 sleep
    httpCall();    // ❌ 不要在锁内调用外部服务
});
```

## 下一步

- [最佳实践](./best-practices.md) - 生产环境使用指南
- [实现原理](./implementation.md) - 了解底层实现
- [注解使用](./annotation.md) - 注解式使用指南
