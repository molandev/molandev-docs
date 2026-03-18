# 底层实现原理

本文深入剖析 molandev-lock 分布式锁的底层实现原理，包括架构设计、核心算法、关键技术点等。

## 整体架构

### 架构图

```
┌─────────────────────────────────────────────────────────┐
│                      应用层                              │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │  @GlobalLock     │      │   LockUtils      │        │
│  │  @Idempotent     │      │   (静态工具类)    │        │
│  └────────┬─────────┘      └────────┬─────────┘        │
└───────────┼────────────────────────┼──────────────────┘
            │                        │
┌───────────┼────────────────────────┼──────────────────┐
│           ▼          切面层        ▼                   │
│  ┌──────────────────┐      ┌──────────────────┐      │
│  │   LockAspect     │      │ IdempotentAspect │      │
│  │  (AOP 拦截)      │      │   (AOP 拦截)     │      │
│  └────────┬─────────┘      └────────┬─────────┘      │
└───────────┼────────────────────────┼─────────────────┘
            │                        │
            └────────────┬───────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    核心层                                │
│         ┌───────────────────────────┐                   │
│         │      LockFactory          │                   │
│         │    (工厂接口)              │                   │
│         └───────────┬───────────────┘                   │
│                     │                                    │
│     ┌───────────────┼───────────────┐                   │
│     ▼               ▼               ▼                   │
│ ┌─────────┐  ┌──────────┐  ┌──────────────┐           │
│ │ Memory  │  │  Redis   │  │  Redisson    │           │
│ │ Factory │  │ Factory  │  │   Factory    │           │
│ └────┬────┘  └────┬─────┘  └──────┬───────┘           │
│      │            │                │                    │
│      ▼            ▼                ▼                    │
│ ┌─────────┐  ┌──────────┐  ┌──────────────┐           │
│ │ Memory  │  │  Redis   │  │  Redisson    │           │
│ │  Lock   │  │  Lock    │  │    Lock      │           │
│ └─────────┘  └──────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────┘
```

### 核心组件说明

1. **应用层**
   - 注解：`@GlobalLock`、`@Idempotent`
   - 工具类：`LockUtils` 静态API

2. **切面层**
   - `LockAspect`：处理 @GlobalLock 注解
   - `IdempotentAspect`：处理 @Idempotent 注解

3. **核心层**
   - `LockFactory`：锁工厂接口
   - 多种实现：Memory、Redis、Redisson

## Redis 锁实现

### 核心原理

Redis 锁基于 **SET NX PX** 命令实现，使用 Lua 脚本保证原子性。

### 加锁流程

```java
// Lua 脚本
local result = redis.call('set', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2])
if result then
    return 1
else
    return 0
end
```

**命令解析**：
- `KEYS[1]`：锁的 key
- `ARGV[1]`：锁的 value（UUID + 线程ID）
- `ARGV[2]`：过期时间（毫秒）
- `NX`：只在 key 不存在时设置
- `PX`：设置过期时间（毫秒）

### 解锁流程

```java
// Lua 脚本
if redis.call('get', KEYS[1]) == ARGV[1] then
    return redis.call('del', KEYS[1])
else
    return 0
end
```

**为什么使用 Lua 脚本？**
1. **原子性**：Redis 执行 Lua 脚本是原子操作
2. **安全性**：只有锁的持有者才能解锁
3. **防误删**：避免删除其他线程的锁

### 可重入实现

```java
public class RedisTemplateLock implements Lock {
    
    // 本地重入计数器
    private final ThreadLocal<Integer> reentrantCount = new ThreadLocal<>();
    
    @Override
    public boolean acquire() {
        // 1. 检查本地计数器
        Integer count = reentrantCount.get();
        if (count != null && count > 0) {
            // 已持有锁，直接增加计数
            reentrantCount.set(count + 1);
            return true;
        }
        
        // 2. 第一次获取锁，与 Redis 交互
        boolean acquired = tryAcquireFromRedis();
        if (acquired) {
            reentrantCount.set(1);
        }
        return acquired;
    }
    
    @Override
    public boolean release() {
        Integer count = reentrantCount.get();
        if (count == null || count <= 0) {
            return false;
        }
        
        // 计数器减1
        count--;
        if (count > 0) {
            // 还有重入，只更新计数器
            reentrantCount.set(count);
            return true;
        }
        
        // 计数器为0，释放 Redis 锁
        return releaseFromRedis();
    }
}
```

**设计要点**：
1. **本地计数**：避免每次重入都与 Redis 交互
2. **线程隔离**：使用 ThreadLocal 确保线程安全
3. **完全释放**：计数器为0时才真正释放 Redis 锁

### 超时等待实现

```java
@Override
public boolean acquire() {
    long waitTime = lockInfo.getWaitTime();
    long startTime = System.currentTimeMillis();
    long waitMillis = TimeUnit.SECONDS.toMillis(waitTime);
    
    // 循环尝试获取锁
    while (true) {
        // 1. 尝试获取锁
        boolean acquired = tryAcquireFromRedis();
        if (acquired) {
            return true;
        }
        
        // 2. 检查是否超时
        long elapsedTime = System.currentTimeMillis() - startTime;
        if (elapsedTime >= waitMillis) {
            return false;  // 超时失败
        }
        
        // 3. 短暂休眠后重试
        long remainingTime = waitMillis - elapsedTime;
        long sleepTime = Math.min(100, remainingTime);
        Thread.sleep(sleepTime);
    }
}
```

**设计要点**：
1. **阻塞等待**：循环尝试，而非立即失败
2. **避免空转**：每次失败后 sleep 100ms
3. **精确超时**：精确控制等待时间

## Memory 锁实现

### 核心原理

Memory 锁基于 Java 的 **ReentrantLock** 实现，适合单机或测试环境。

### 关键实现

```java
static class ReentrantLockWithLease extends ReentrantLock {
    
    private volatile long leaseExpirationTime = 0;
    
    public boolean tryLock(long waitTime, long leaseTime, TimeUnit unit) 
            throws InterruptedException {
        // 1. 尝试获取锁
        boolean acquired = super.tryLock(waitTime, unit);
        
        // 2. 设置租约过期时间
        if (acquired && leaseTime > 0) {
            this.leaseExpirationTime = System.currentTimeMillis() 
                + unit.toMillis(leaseTime);
        }
        
        return acquired;
    }
    
    public boolean isExpired() {
        return leaseExpirationTime > 0 
            && System.currentTimeMillis() >= leaseExpirationTime;
    }
}
```

### 内存泄漏防护

```java
public class MemoryLockFactory implements LockFactory {
    
    private final Map<String, ReentrantLockWithLease> lockMap 
        = new ConcurrentHashMap<>();
    
    private volatile long lastClean = System.currentTimeMillis();
    
    private void clean() {
        // 每2小时清理一次
        if (System.currentTimeMillis() - lastClean > 2 * 60 * 60 * 1000) {
            if (cleanLock.tryLock()) {
                try {
                    Set<String> keysToRemove = new HashSet<>();
                    for (Map.Entry<String, ReentrantLockWithLease> entry : lockMap.entrySet()) {
                        // 清理过期的锁和未被持有的锁
                        if (entry.getValue().isExpired() 
                                || !entry.getValue().isLocked()) {
                            keysToRemove.add(entry.getKey());
                        }
                    }
                    keysToRemove.forEach(lockMap::remove);
                    lastClean = System.currentTimeMillis();
                } finally {
                    cleanLock.unlock();
                }
            }
        }
    }
}
```

**设计要点**：
1. **定期清理**：每2小时清理一次过期锁
2. **双重检查**：避免并发清理
3. **清理策略**：删除过期锁和未被持有的锁

## Redisson 锁实现

### 核心原理

Redisson 锁是对 Redisson 客户端的封装，直接使用 Redisson 提供的分布式锁实现，功能最强大。

### 关键实现

```java
public class RedissonLock implements Lock {
    
    private final RedissonClient redissonClient;
    private final LockInfo lockInfo;
    private RLock rLock;
    
    @Override
    public boolean acquire() {
        try {
            // 1. 获取 Redisson 锁对象
            rLock = redissonClient.getLock(lockInfo.getKey());
            
            // 2. 尝试获取锁（支持 waitTime 和 leaseTime）
            return rLock.tryLock(
                lockInfo.getWaitTime(), 
                lockInfo.getLeaseTime(), 
                TimeUnit.SECONDS
            );
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        }
    }
    
    @Override
    public boolean release() {
        // 检查是否由当前线程持有
        if (rLock != null && rLock.isHeldByCurrentThread()) {
            try {
                rLock.unlock();
                return true;
            } catch (Exception e) {
                return false;
            }
        }
        return false;
    }
}
```

### Redisson 的优势

#### 1. 看门狗机制（WatchDog）

```java
// Redisson 自动续期
RLock lock = redissonClient.getLock("myLock");
lock.lock();  // 不设置 leaseTime

try {
    // 业务逻辑执行过程中
    // Redisson 会自动续期，防止锁过期
    longRunningTask();
} finally {
    lock.unlock();
}
```

**工作原理**：
- 默认锁过期时间：30秒
- 每隔 10秒（过期时间的 1/3）自动续期
- 续期延长 30秒
- 线程挂了自动停止续期

#### 2. 可重入锁

```java
// Redisson 原生支持可重入
public void outer() {
    RLock lock = redissonClient.getLock("myLock");
    lock.lock();
    try {
        inner();  // 可以再次获取同一把锁
    } finally {
        lock.unlock();
    }
}

public void inner() {
    RLock lock = redissonClient.getLock("myLock");
    lock.lock();  // 不会阻塞，重入成功
    try {
        // 业务逻辑
    } finally {
        lock.unlock();
    }
}
```

**实现原理**：
- Redis Hash 结构存储锁信息
- Key：锁名称
- Field：线程标识（UUID + 线程ID）
- Value：重入次数

#### 3. 红锁（RedLock）

```java
// Redisson 支持红锁算法
RLock lock1 = redisson1.getLock("lock");
RLock lock2 = redisson2.getLock("lock");
RLock lock3 = redisson3.getLock("lock");

RedissonRedLock redLock = new RedissonRedLock(lock1, lock2, lock3);
redLock.lock();
try {
    // 业务逻辑
} finally {
    redLock.unlock();
}
```

**红锁特点**：
- 多个独立的 Redis 实例
- 必须获取大多数（N/2+1）锁才算成功
- 更高的可靠性和安全性

#### 4. 读写锁

```java
// 读写锁支持
RReadWriteLock rwLock = redissonClient.getReadWriteLock("myLock");

// 读锁（共享锁）
RLock readLock = rwLock.readLock();
readLock.lock();
try {
    // 读操作，多个线程可以同时持有
} finally {
    readLock.unlock();
}

// 写锁（排他锁）
RLock writeLock = rwLock.writeLock();
writeLock.lock();
try {
    // 写操作，独占锁
} finally {
    writeLock.unlock();
}
```

### Redisson vs Redis 实现对比

| 特性 | Redisson | Redis（RedisTemplate） |
|------|----------|------------------------|
| 可重入实现 | Redis Hash 原生支持 | ThreadLocal 本地实现 |
| 看门狗 | ✅ 自动续期 | ❌ 需手动设置足够长的 leaseTime |
| 红锁 | ✅ 支持 | ❌ 不支持 |
| 读写锁 | ✅ 支持 | ❌ 不支持 |
| 公平锁 | ✅ 支持 | ❌ 不支持 |
| 联锁 | ✅ 支持 | ❌ 不支持 |
| 性能 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 功能完整性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 学习成本 | 中 | 低 |

### 为什么推荐 Redisson？

1. **看门狗机制**：自动续期，无需担心业务执行时间过长
2. **功能丰富**：支持红锁、读写锁、公平锁等高级特性
3. **成熟稳定**：经过大量生产环境验证
4. **易于使用**：API 简洁，文档完善

### 配置示例

```yaml
# application.yml
molandev:
  lock:
    type: redisson  # 使用 Redisson 实现

# Redisson 配置（需单独配置）
spring:
  redis:
    host: localhost
    port: 6379
```

```java
// Redisson 配置类
@Configuration
public class RedissonConfig {
    
    @Bean
    public RedissonClient redissonClient() {
        Config config = new Config();
        config.useSingleServer()
            .setAddress("redis://localhost:6379")
            .setDatabase(0);
        return Redisson.create(config);
    }
}
```

## 注解实现原理

### @GlobalLock 切面

```java
@Aspect
@Order(0)
public class LockAspect {
    
    @Around(value = "@annotation(globalLock)")
    public Object around(ProceedingJoinPoint joinPoint, GlobalLock globalLock) 
            throws Throwable {
        // 1. 解析锁信息
        LockInfo lockInfo = LockInfoUtils.getLockInfo(joinPoint, globalLock);
        
        try {
            // 2. 在锁内执行方法
            return LockUtils.runInLock(lockInfo, () -> {
                return joinPoint.proceed();
            });
        } catch (LockTimeoutException e) {
            // 3. 处理超时降级
            if (hasTimeoutFallback(globalLock)) {
                return handleTimeoutFallback(globalLock, joinPoint);
            }
            throw e;
        }
    }
}
```

### SpEL 表达式解析

```java
public class LockKeyUtils {
    
    private static final ExpressionParser parser = new SpelExpressionParser();
    
    public static String parseKey(String key, Method method, Object[] args) {
        if (!key.contains("#")) {
            // 不包含 SpEL 表达式，直接返回
            return key;
        }
        
        // 创建 SpEL 上下文
        EvaluationContext context = new StandardEvaluationContext();
        
        // 注册方法参数
        String[] parameterNames = getParameterNames(method);
        for (int i = 0; i < parameterNames.length; i++) {
            context.setVariable(parameterNames[i], args[i]);
        }
        
        // 解析表达式
        Expression expression = parser.parseExpression(key);
        return expression.getValue(context, String.class);
    }
}
```

**支持的 SpEL 表达式**：
- `#参数名`：引用方法参数
- `#对象.属性`：引用对象属性
- `'常量'`：字符串常量
- `+`：字符串拼接

## 工厂模式设计

### 工厂接口

```java
public interface LockFactory {
    
    /**
     * 获取锁实例
     */
    Lock getLock(LockInfo lockInfo);
}
```

### 多实现策略

```java
@Configuration
public class LockAutoConfiguration {
    
    @Bean
    @ConditionalOnProperty(name = "molandev.lock.type", havingValue = "redis")
    public LockFactory redisLockFactory(RedisTemplate redisTemplate) {
        RedisTemplateLockFactory factory = new RedisTemplateLockFactory(redisTemplate);
        LockUtils.setLockFactory(factory);
        return factory;
    }
    
    @Bean
    @ConditionalOnProperty(name = "molandev.lock.type", havingValue = "memory")
    public LockFactory memoryLockFactory() {
        MemoryLockFactory factory = new MemoryLockFactory();
        LockUtils.setLockFactory(factory);
        return factory;
    }
}
```

**设计优势**：
1. **策略模式**：多种锁实现可切换
2. **自动配置**：根据配置自动选择实现
3. **扩展性强**：易于添加新的锁实现

## 静态工具类设计

### LockUtils 实现

```java
public class LockUtils {
    
    // 静态持有工厂实例
    private static LockFactory lockFactory;
    
    // 线程本地锁栈
    private static final ThreadLocal<Deque<LockInfo>> CURRENT_LOCK 
        = new NamedThreadLocal<>("current-lock") {
        @Override
        protected Deque<LockInfo> initialValue() {
            return new ArrayDeque<>();
        }
    };
    
    public static void setLockFactory(LockFactory factory) {
        lockFactory = factory;
    }
    
    public static <T> T runInLock(String key, Supplier<T> supplier) {
        LockInfo lockInfo = LockInfoUtils.createLockInfo(key, 30, 60);
        Lock lock = lockFactory.getLock(lockInfo);
        
        boolean lockRes = lock.acquire();
        if (!lockRes) {
            throw new LockTimeoutException("获取锁超时：" + key);
        }
        
        CURRENT_LOCK.get().push(lockInfo);
        try {
            return supplier.get();
        } finally {
            try {
                lock.release();
            } finally {
                CURRENT_LOCK.get().poll();
            }
        }
    }
}
```

**设计要点**：
1. **静态工厂**：通过配置类注入，避免 @Autowired
2. **锁栈管理**：ThreadLocal 管理嵌套锁
3. **自动释放**：finally 块确保锁一定释放

## 幂等实现原理

### 核心思路

使用 Redis 的 **SETNX** 命令记录请求标识，在有效期内相同请求直接拒绝。

### 实现代码

```java
@Aspect
public class IdempotentAspect {
    
    @Around("@annotation(idempotent)")
    public Object around(ProceedingJoinPoint joinPoint, Idempotent idempotent) 
            throws Throwable {
        // 1. 生成幂等 key
        String key = generateIdempotentKey(joinPoint, idempotent);
        
        // 2. 尝试设置标识
        Boolean success = redisTemplate.opsForValue()
            .setIfAbsent(key, "1", idempotent.expireTime(), TimeUnit.SECONDS);
        
        if (Boolean.FALSE.equals(success)) {
            // 3. 已存在，拒绝请求
            throw new IdempotentException(idempotent.msg());
        }
        
        try {
            // 4. 执行业务逻辑
            return joinPoint.proceed();
        } catch (Exception e) {
            // 5. 业务失败，删除标识（允许重试）
            redisTemplate.delete(key);
            throw e;
        }
    }
}
```

**设计要点**：
1. **快速失败**：不等待，直接拒绝重复请求
2. **异常重试**：业务失败删除标识，允许重试
3. **自动过期**：超过有效期自动失效

## 关键技术点

### 1. Lua 脚本原子性

**问题**：为什么必须使用 Lua 脚本？

```java
// ❌ 错误：非原子操作
String value = redisTemplate.get(key);
if (value.equals(myValue)) {
    redisTemplate.delete(key);  // 可能删除其他线程的锁
}

// ✅ 正确：Lua 脚本保证原子性
String script = 
    "if redis.call('get', KEYS[1]) == ARGV[1] then " +
    "    return redis.call('del', KEYS[1]) " +
    "else " +
    "    return 0 " +
    "end";
redisTemplate.execute(script, Collections.singletonList(key), myValue);
```

### 2. ThreadLocal 线程隔离

**问题**：为什么使用 ThreadLocal？

```java
// ❌ 错误：多线程共享计数器
private int reentrantCount = 0;

// ✅ 正确：每个线程独立计数
private final ThreadLocal<Integer> reentrantCount = new ThreadLocal<>();
```

**原因**：
1. 每个线程有独立的重入计数
2. 避免线程间相互干扰
3. 无需额外同步

### 3. 锁标识唯一性

**问题**：如何保证锁标识唯一？

```java
// 锁的 value = UUID + 线程ID
private final String lockValue = UUID.randomUUID().toString() 
    + "_" + Thread.currentThread().getId();
```

**原因**：
1. **UUID**：保证跨 JVM 唯一
2. **线程ID**：保证同一 JVM 内不同线程唯一
3. **组合**：确保全局唯一

### 4. 防止死锁

**策略**：
1. **租约时间**：leaseTime 自动释放
2. **超时等待**：waitTime 避免永久阻塞
3. **异常释放**：finally 块确保释放

```java
try {
    lock.acquire();
    // 业务逻辑
} finally {
    lock.release();  // 一定会执行
}
```

## 性能优化

### 1. 减少 Redis 交互

```java
// ❌ 每次重入都查询 Redis
for (int i = 0; i < 100; i++) {
    lock.acquire();  // 100次 Redis 查询
}

// ✅ 本地计数器优化
// 第一次：查询 Redis
// 后续99次：只更新本地计数器
for (int i = 0; i < 100; i++) {
    lock.acquire();  // 只有1次 Redis 查询
}
```

### 2. 合理的重试间隔

```java
// 避免 CPU 空转
while (!acquired) {
    acquired = tryAcquire();
    if (!acquired) {
        Thread.sleep(100);  // 休眠100ms
    }
}
```

### 3. 内存锁定期清理

```java
// 每2小时清理一次，避免 Map 无限增长
if (System.currentTimeMillis() - lastClean > 2 * 60 * 60 * 1000) {
    cleanExpiredLocks();
}
```

## 常见问题

### Q1: Redis 锁如何防止死锁？

**A**: 三重保障：
1. **leaseTime**：锁自动过期
2. **Lua 脚本**：原子操作，防止误删
3. **finally 块**：确保释放

### Q2: 可重入锁为什么不直接用 Redis？

**A**: 性能考虑。本地 ThreadLocal 计数避免每次重入都访问 Redis。

### Q3: Memory 锁为什么要定期清理？

**A**: 防止内存泄漏。锁对象会一直存在于 Map 中，必须定期清理未使用的锁。

### Q4: 如何选择合适的锁实现？

**A**: 根据项目情况选择：

| 实现 | 适用场景 | 优势 | 劣势 |
|------|----------|------|------|
| **Redis** | 已有 RedisTemplate | 轻量、易集成 | 功能相对简单 |
| **Redisson** | 需要高级功能 | 功能强大、可靠性高 | 需要额外依赖 |
| **Memory** | 单机/测试环境 | 无外部依赖、性能最高 | 不支持分布式 |

**推荐**：
- 生产环境：优先使用 **Redisson**（功能最完善）
- 已有 Redis：可使用 **Redis**（轻量级）
- 测试环境：使用 **Memory**（无需外部依赖）

## 三种锁实现对比

### 实现方式总览

molandev-lock 提供三种开箱即用的锁实现：

| 特性 | Redis | Redisson | Memory |
|------|-------|----------|--------|
| 分布式 | ✅ | ✅ | ❌ |
| 可重入 | ✅ | ✅ | ✅ |
| 看门狗 | ❌ | ✅ | ❌ |
| 红锁 | ❌ | ✅ | ❌ |
| 读写锁 | ❌ | ✅ | ❌ |
| 依赖 | RedisTemplate | Redisson | 无 |
| 推荐度 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |

### 配置方式

```yaml
# Redis 实现
molandev:
  lock:
    type: redis

# Redisson 实现（推荐）
molandev:
  lock:
    type: redisson

# Memory 实现（测试用）
molandev:
  lock:
    type: memory
```

## 相关资料

- [Redis 分布式锁官方文档](https://redis.io/topics/distlock)
- [Redlock 算法](https://redis.io/topics/distlock#the-redlock-algorithm)
- [Java ReentrantLock 源码分析](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/locks/ReentrantLock.html)

## 下一步

- [快速开始](./getting-started.md) - 快速上手
- [注解使用](./annotation.md) - 注解式详解
- [编程式使用](./programming.md) - LockUtils 详解
- [最佳实践](./best-practices.md) - 生产使用指南
