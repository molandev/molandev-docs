# 分布式锁模块概览

molandev-lock 是一个强大、易用的分布式锁解决方案，提供注解式和编程式两种使用方式，支持 Redis、Redisson 和内存三种实现。

## 核心特性

### ✅ 多种实现方式

- **Redis 实现**：基于 RedisTemplate，适合已有 Redis 的项目
- **Redisson 实现**：基于 Redisson 客户端，功能更强大
- **内存实现**：基于 Java 并发包，适合单机或测试环境

### ✅ 双模式支持

- **编程式**：使用 `LockUtils` 静态工具类，灵活性高
- **注解式**：使用 `@GlobalLock` 和 `@Idempotent` 注解，简单易用

### ✅ 完善的功能

- **可重入锁**：支持同一线程多次获取同一把锁
- **超时控制**：支持获取锁超时和自动释放
- **幂等保护**：防止重复提交，保证接口幂等性
- **降级策略**：获取锁失败时支持自定义降级逻辑

### ✅ 生产级特性

- **防死锁**：自动释放机制防止死锁
- **线程安全**：基于 ThreadLocal 管理锁栈
- **高性能**：优化的锁实现，支持高并发场景
- **可观测**：详细的日志记录，便于问题排查

## 应用场景

### 🎯 订单处理

防止同一订单被重复处理：

```java
LockUtils.runInLock("ORDER_" + orderId, () -> {
    // 处理订单逻辑
    return processOrder(orderId);
});
```

### 🎯 库存扣减

保证库存操作的原子性：

```java
@GlobalLock(key = "'INVENTORY_' + #productId")
public boolean deductInventory(Long productId, Integer quantity) {
    // 扣减库存逻辑
}
```

### 🎯 幂等控制

防止用户重复提交：

```java
@Idempotent(key = "#request.orderId", expireTime = 60)
public OrderResult createOrder(OrderRequest request) {
    // 创建订单逻辑
}
```

### 🎯 缓存更新

防止缓存击穿：

```java
LockUtils.runInLock("CACHE_UPDATE_" + key, () -> {
    // 更新缓存逻辑
    updateCache(key, value);
});
```

## 技术架构

### 核心组件

```
molandev-lock
├── annotation          # 注解定义
│   ├── @GlobalLock    # 全局锁注解
│   └── @Idempotent    # 幂等注解
├── aspect             # 切面实现
│   ├── LockAspect     # 锁切面
│   └── IdempotentAspect  # 幂等切面
├── config             # 自动配置
│   ├── LockAutoConfiguration  # 自动配置类
│   └── LockProperties        # 配置属性
├── support            # 锁实现
│   ├── factory        # 锁工厂
│   ├── memory         # 内存锁实现
│   ├── redis          # Redis锁实现
│   ├── redisson       # Redisson锁实现
│   └── model          # 锁模型
├── utils              # 工具类
│   ├── LockUtils      # 锁工具类（核心API）
│   ├── LockKeyUtils   # Key生成工具
│   └── LockInfoUtils  # 锁信息工具
└── exception          # 异常定义
    ├── LockTimeoutException     # 锁超时异常
    └── IdempotentException      # 幂等异常
```

### 设计模式

- **工厂模式**：通过 LockFactory 创建不同类型的锁
- **策略模式**：支持多种锁实现策略
- **模板方法**：统一的加锁流程，不同的实现细节
- **静态工具类**：LockUtils 提供简洁的静态 API

## 快速对比

| 特性 | Redis | Redisson | Memory |
|------|-------|----------|--------|
| 分布式支持 | ✅ | ✅ | ❌ |
| 高可用 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ |
| 性能 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 易用性 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 依赖 | RedisTemplate | Redisson | 无 |
| 适用场景 | 已有Redis项目 | 需要高级功能 | 单机/测试 |

## 使用建议

### 生产环境

- **分布式部署**：推荐使用 Redis 或 Redisson
- **高并发场景**：合理设计锁粒度，避免锁冲突
- **关键业务**：使用编程式，便于异常处理

### 测试环境

- **单元测试**：使用 Memory 锁，无需外部依赖
- **集成测试**：使用实际的 Redis，验证分布式特性

### 最佳实践

1. **锁粒度**：使用业务 ID 作为锁 key，避免全局锁
2. **超时时间**：waitTime 10-30秒，leaseTime 根据业务时长设置
3. **异常处理**：编程式使用 try-catch，注解式使用降级策略
4. **性能优化**：避免在锁内执行耗时操作

## 下一步

- [快速开始](./getting-started.md) - 5分钟快速上手
- [注解使用](./annotation.md) - @GlobalLock 和 @Idempotent 详解
- [编程式使用](./programming.md) - LockUtils 工具类详解
- [实现原理](./implementation.md) - 分布式锁实现原理

## 相关链接

- [Redis 分布式锁](https://redis.io/topics/distlock)
- [Redisson 官方文档](https://github.com/redisson/redisson)
