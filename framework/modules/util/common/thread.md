# ThreadUtil - 线程工具类

`ThreadUtil` 提供线程相关的工具方法，主要用于创建虚拟线程工厂。

## 核心特性

- ✅ **虚拟线程支持**：自动检测并创建虚拟线程（Java 21+）
- ✅ **优雅降级**：不支持虚拟线程时自动使用普通线程
- ✅ **零依赖**：纯反射实现，无需额外依赖
- ✅ **线程安全**：所有方法都是线程安全的
- ✅ **类检测机制**：通过检测 JDK 内部类判断虚拟线程支持，避免版本号解析问题

## Maven 依赖

```xml
<dependency>
    <groupId>com.molandev</groupId>
    <artifactId>molandev-util</artifactId>
</dependency>
```

## API 说明

### createVirtualThreadFactory()

创建线程工厂，优先使用虚拟线程。

**方法签名：**
```java
public static ThreadFactory createVirtualThreadFactory()
```

**返回值：**
- Java 21+：返回虚拟线程工厂
- Java < 21：返回默认线程工厂

**实现原理：**
```java
public class ThreadUtil {
    public static ThreadFactory createVirtualThreadFactory() {
        try {
            // 通过反射创建虚拟线程工厂（Java 21+）
            Class<?> threadClass = Class.forName("java.lang.Thread");
            java.lang.reflect.Method ofVirtualMethod = threadClass.getDeclaredMethod("ofVirtual");
            Object builder = ofVirtualMethod.invoke(null);
            
            Class<?> builderClass = builder.getClass();
            java.lang.reflect.Method nameMethod = builderClass.getDeclaredMethod("name", String.class, long.class);
            Object namedBuilder = nameMethod.invoke(builder, "virtual-", 0L);
            
            java.lang.reflect.Method factoryMethod = builderClass.getDeclaredMethod("factory");
            return (ThreadFactory) factoryMethod.invoke(namedBuilder);
        } catch (Exception e) {
            // 不支持虚拟线程，返回默认线程工厂
            return Executors.defaultThreadFactory();
        }
    }
    
    /**
     * 检查当前运行时是否支持虚拟线程 (Java 21+)
     * 通过检测 Thread.Builder$OfVirtual 类是否存在来判断，避免依赖版本号解析
     */
    public static boolean isVirtualThreadsSupported() {
        try {
            // Java 21+ 中才有 Thread.Builder$OfVirtual 类
            Class.forName("java.lang.Thread$Builder$OfVirtual");
            return true;
        } catch (ClassNotFoundException e) {
            return false;
        }
    }
}
```

## 使用示例

### 基本用法

```java
import com.molandev.framework.util.ThreadUtil;
import java.util.concurrent.*;

// 创建线程池
ThreadPoolExecutor executor = new ThreadPoolExecutor(
    10,                                    // 核心线程数
    20,                                    // 最大线程数
    60L, TimeUnit.SECONDS,                 // 空闲存活时间
    new LinkedBlockingQueue<>(100),        // 任务队列
    ThreadUtil.createVirtualThreadFactory() // 使用虚拟线程工厂
);

// 提交任务
executor.execute(() -> {
    System.out.println("Task running in: " + Thread.currentThread());
});
```

### Spring 线程池配置

```java
import com.molandev.framework.util.ThreadUtil;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Bean
public ThreadPoolTaskExecutor taskExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    
    // 使用虚拟线程工厂
    executor.setThreadFactory(ThreadUtil.createVirtualThreadFactory());
    
    executor.setCorePoolSize(10);
    executor.setMaxPoolSize(20);
    executor.setQueueCapacity(100);
    executor.setThreadNamePrefix("async-task-");
    executor.initialize();
    
    return executor;
}
```

### 定时任务线程池

```java
import com.molandev.framework.util.ThreadUtil;
import org.springframework.scheduling.concurrent.ConcurrentTaskScheduler;
import java.util.concurrent.*;

@Bean
public TaskScheduler taskScheduler() {
    ScheduledThreadPoolExecutor scheduler = new ScheduledThreadPoolExecutor(
        10,
        ThreadUtil.createVirtualThreadFactory()
    );
    
    return new ConcurrentTaskScheduler(scheduler);
}
```

## 虚拟线程优势

### 为什么使用虚拟线程？

虚拟线程（Virtual Threads）是 Java 21 引入的轻量级线程：

**传统线程（Platform Thread）：**
- 每个线程占用 ~1MB 栈内存
- 创建和销毁成本高
- 系统线程数有限（通常几千个）

**虚拟线程（Virtual Thread）：**
- 每个线程只占用几 KB 内存
- 创建和销毁成本极低
- 可以轻松创建百万级线程

### 适用场景

✅ **适合使用虚拟线程的场景：**
- I/O 密集型任务（网络请求、数据库查询）
- 高并发场景（大量并发请求）
- 异步事件处理
- 定时任务调度

❌ **不适合虚拟线程的场景：**
- CPU 密集型计算
- 同步块较多的代码（可能阻塞载体线程）

## 实际应用

### 1. 事件驱动模块

```java
@Bean(name = "eventExecutor")
public ThreadPoolTaskExecutor eventExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setThreadFactory(ThreadUtil.createVirtualThreadFactory());
    executor.setCorePoolSize(5);
    executor.setMaxPoolSize(20);
    executor.setQueueCapacity(100);
    executor.initialize();
    return executor;
}
```

### 2. 异步任务处理

```java
@Bean
public Executor asyncExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setThreadFactory(ThreadUtil.createVirtualThreadFactory());
    executor.setThreadNamePrefix("async-");
    executor.initialize();
    return executor;
}

@Async("asyncExecutor")
public void processAsync() {
    // 异步处理逻辑
}
```

### 3. 定时任务调度

```java
@Bean
public TaskScheduler taskScheduler() {
    ThreadFactory threadFactory = ThreadUtil.createVirtualThreadFactory();
    
    ScheduledThreadPoolExecutor scheduler = 
        new ScheduledThreadPoolExecutor(10, threadFactory);
        
    return new ConcurrentTaskScheduler(scheduler);
}
```

## 性能对比

| 指标 | 普通线程 | 虚拟线程 |
|-----|---------|---------|
| 内存占用 | ~1MB/线程 | ~1KB/线程 |
| 创建速度 | 较慢 | 极快 |
| 上下文切换 | 较慢 | 快速 |
| 最大并发数 | 数千 | 数百万 |
| 适用场景 | CPU密集 | I/O密集 |

## 注意事项

### 1. 自动降级

`ThreadUtil` 在不支持虚拟线程的环境下会自动降级到普通线程，业务代码无需修改：

```java
// 这段代码在任何 Java 版本都能正常运行
ThreadFactory factory = ThreadUtil.createVirtualThreadFactory();
// Java 21+: 虚拟线程
// Java 8-17: 普通线程
```

### 2. 版本兼容性

通过检测 `java.lang.Thread$Builder$OfVirtual` 类是否存在来判断虚拟线程支持，避免了以下问题：

```java
// ❌ 旧方式：依赖版本号解析，在 Docker 镜像中可能获取失败
int version = getJavaVersion(); // 已废弃
if (version > 21) {
    factory = createVirtualThreadFactory();
}

// ✅ 新方式：直接检测类是否存在
boolean supported = ThreadUtil.isVirtualThreadsSupported();
// Java 21+: true
// Java < 21: false
```

这种方式的优点：
- 不依赖环境变量（如 `JAVA_VERSION`）
- 不解析复杂的版本字符串格式
- 在所有 JDK 发行版中都能正确工作（OpenJDK、Temurin、Oracle JDK 等）

### 3. 线程命名

虚拟线程会自动命名为 `virtual-0`, `virtual-1` 等，便于调试：

```java
// 虚拟线程输出示例
Thread: VirtualThread[#21,virtual-0]/runnable@ForkJoinPool-1-worker-1
```

## 相关工具

- [TaskUtil](../spring/task.md) - 任务调度工具（使用 ThreadUtil）
- [EventAutoConfiguration](../../event.md) - 事件驱动配置（使用 ThreadUtil）

## 常见问题

### Q1: 如何确认是否使用了虚拟线程？

**A**: 可以通过日志或线程名称判断：

```java
Thread thread = Thread.currentThread();
System.out.println(thread); 
// 虚拟线程: VirtualThread[#21,virtual-0]
// 普通线程: Thread[pool-1-thread-1,5,main]
```

### Q2: 虚拟线程是否完全替代普通线程？

**A**: 不是。虚拟线程适合 I/O 密集型任务，CPU 密集型任务仍推荐使用普通线程池。

### Q3: 能否在 Java 8 使用？

**A**: 可以。`ThreadUtil` 会自动降级到普通线程，保证兼容性。

### Q4: 性能提升有多少？

**A**: 对于 I/O 密集型场景，虚拟线程可以支持 10-100 倍的并发量，但具体提升取决于业务特点。

## 参考资料

- [JEP 444: Virtual Threads](https://openjdk.org/jeps/444)
- [Java 21 Virtual Threads Guide](https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html)
