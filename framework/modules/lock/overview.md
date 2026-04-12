# 分布式锁模块概览

molandev-lock 是一个强大、易用的分布式锁解决方案，提供注解式和编程式两种使用方式，支持 Redis、Redisson 和 Memory 三种实现。

## 核心特性

- ✅ **多种实现**：Memory（默认）、Redis、Redisson，按需选择
- ✅ **双模式支持**：编程式（`LockUtils`）灵活可控，注解式（`@GlobalLock`）简单优雅
- ✅ **可重入锁**：支持同一线程多次获取同一把锁
- ✅ **超时控制**：支持获取锁超时和自动释放
- ✅ **幂等保护**：`@Idempotent` 注解防止重复提交
- ✅ **降级策略**：获取锁失败时支持自定义降级逻辑

## 锁实现对比

| 特性 | Memory | Redis | Redisson |
|------|--------|-------|----------|
| 分布式支持 | ❌ 仅单机 | ✅ | ✅ |
| 可重入 | ✅ | ✅（本地计数） | ✅（原生） |
| 性能 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 依赖 | 无 | RedisTemplate | Redisson |
| 适用场景 | 开发/测试环境 | 已有 Redis 的生产环境 | 需要高级功能 |

```yaml
# 切换锁实现
molandev:
  lock:
    type: memory  # memory | redis | redisson
```

## 快速开始

### 1. 引入依赖

```xml
<dependency>
    <groupId>com.molandev</groupId>
    <artifactId>molandev-lock</artifactId>
    <version>${molandev.version}</version>
</dependency>
```

### 2. 编程式使用（推荐 ⭐⭐⭐⭐⭐）

```java
import com.molandev.framework.lock.utils.LockUtils;

// 默认超时：waitTime=30s, leaseTime=60s
LockUtils.runInLock("ORDER_" + orderId, () -> {
    // 同一 orderId 同时只能有一个线程执行
    return processOrder(orderId);
});

// 自定义超时
LockUtils.runInLock("PAYMENT_" + paymentId, 30, 120, () -> {
    // waitTime=30秒，leaseTime=120秒
    return processPayment(paymentId);
});

// 无返回值
LockUtils.runInLock("CACHE_" + key, () -> {
    cacheService.refresh(key);
});
```

### 3. 注解式使用

```java
import com.molandev.framework.lock.annotation.GlobalLock;

@GlobalLock(key = "'INVENTORY_' + #productId", waitTime = 10, leaseTime = 30)
public boolean deductInventory(Long productId, Integer quantity) {
    // 扣减库存逻辑
}
```

### 4. 幂等控制

```java
import com.molandev.framework.lock.annotation.Idempotent;

@PostMapping("/create")
@Idempotent(key = "#request.orderId", expireTime = 60, msg = "请勿重复提交")
public Result<Order> createOrder(@RequestBody OrderRequest request) {
    // 60秒内相同 orderId 只会执行一次
}
```

## 项目中的实际应用

### 场景一：任务调度防重复

**代码位置：** `molandev-base/.../task/core/TaskScheduler.java`

分布式环境下，防止多个节点同时调度同一个任务：

```java
LockUtils.runInLock(
    taskTrigger.getId() + taskTrigger.getNextTime(),
    0,           // waitTime: 0秒，抢不到锁直接放弃（不阻塞）
    5 * 60,      // leaseTime: 5分钟，防止节点时间差
    () -> {
        // 执行任务调度逻辑
        taskExecutor.execute(taskExecutionDto);
    }
);
```

**设计要点：**
- `waitTime=0` 抢占式策略，抢不到就放弃，避免阻塞
- `leaseTime=5分钟` 足够长，防止不同节点时间差导致并发

> 📖 **详细说明** → [任务管理文档](/cloud/backend/task)

### 场景二：文档摄入防重复

**代码位置：** `molandev-knowledge/.../ingest/task/KlDocumentIngestTaskService.java`

防止同一个文档被多个节点同时处理：

```java
String lockKey = "INGEST_TASK_" + task.getId();
int lockWaitSeconds = ragProperties.getIngest().getLockWaitSeconds();

LockUtils.runInLock(lockKey, 0, lockWaitSeconds, () -> {
    // 再次检查状态并更新为 processing
    if (!this.updateToProcessing(task.getId())) {
        log.info("任务已被其他节点处理: taskId={}", task.getId());
        return;
    }
    // 执行文档转换、分片、向量化...
});
```

**设计要点：**
- 锁内再次检查状态（双重检查），确保幂等
- 使用业务 ID 作为锁 key，粒度精细

> 📖 **详细说明** → [知识库文档](/cloud/knowledge)

## 参数说明

### runInLock 参数

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| `key` | 锁的标识，支持 SpEL 表达式 | 业务 ID 前缀 + 具体 ID |
| `waitTime` | 获取锁的最大等待时间（秒） | 0（抢占式）或 10-30 |
| `leaseTime` | 锁自动释放时间（秒） | 业务执行时间的 2-3 倍 |

### @GlobalLock 属性

| 属性 | 说明 | 默认值 |
|------|------|--------|
| `key` | SpEL 表达式 | 必填 |
| `waitTime` | 获取锁超时时间（秒） | 30 |
| `leaseTime` | 租约时间（秒） | 60 |
| `timeoutFallback` | 超时降级方法名 | 空 |

### @Idempotent 属性

| 属性 | 说明 | 默认值 |
|------|------|--------|
| `key` | SpEL 表达式，幂等键 | 必填 |
| `expireTime` | 有效期（秒） | 60 |
| `msg` | 重复请求时的提示信息 | "请勿重复请求" |

## 最佳实践

### ✅ 推荐做法

```java
// 1. 使用业务 ID 作为锁 key
LockUtils.runInLock("ORDER_" + orderId, () -> {...});

// 2. 合理设置超时时间
LockUtils.runInLock(key, 30, 60, () -> {...});

// 3. 编程式便于异常处理
try {
    return LockUtils.runInLock(key, () -> {...});
} catch (LockTimeoutException e) {
    // 降级处理
    return defaultValue;
}
```

### ❌ 避免做法

```java
// 1. 避免使用固定锁 key（会导致所有请求串行）
@GlobalLock(key = "'lockKey'")  // ❌

// 2. 避免 leaseTime 小于业务执行时间
@GlobalLock(waitTime = 1, leaseTime = 5)  // ❌ 业务可能需要10秒

// 3. 避免在锁内执行耗时操作
LockUtils.runInLock(key, () -> {
    Thread.sleep(10000);  // ❌ 应该缩短锁持有时间
});
```

## 常见问题

### 编程式和注解式如何选择？

- **编程式（推荐）**：适合复杂业务，灵活性高，便于异常处理
- **注解式**：适合简单场景，代码简洁，适合纯粹的同步需求

### 锁的 key 应该如何设计？

- ❌ **错误**：使用固定值 `"lockKey"`，会导致所有请求串行
- ✅ **正确**：使用业务 ID `"ORDER_" + orderId`，只锁定相同资源

### 获取锁失败会发生什么？

- **编程式**：抛出 `LockTimeoutException`，可以 try-catch 处理
- **注解式（@GlobalLock）**：可配置 `timeoutFallback` 降级方法
- **注解式（@Idempotent）**：抛出 `IdempotentException`，提示重复请求

## 总结

molandev-lock 提供了：

- ✅ 多种锁实现（Memory/Redis/Redisson）
- ✅ 编程式和注解式两种使用方式
- ✅ 幂等控制，防止重复提交
- ✅ 超时降级，优雅处理并发
- ✅ 项目实战：任务调度、文档摄入等场景
