# 任务调度工具

`TaskUtil` 是一个基于 Spring `TaskScheduler` 的任务调度工具类，提供了简洁的 API 用于异步任务执行、延迟执行和定时任务。

## 类信息

- **包名**: `com.molandev.framework.spring.task`
- **类名**: `TaskUtil`
- **类型**: 静态工具类
- **依赖**: Spring TaskScheduler

## 核心特性

### ✅ 多种调度方式

- 立即异步执行
- 延迟执行（指定时间或时长）
- Cron 表达式定时执行
- 固定频率循环执行
- 固定延迟循环执行

### ✅ 虚拟线程支持

- Java 21+ 环境下自动使用虚拟线程（Virtual Threads）
- Java 8-17 使用普通线程池
- 无需修改代码，自动适配

### ✅ 轻量级

- 基于 Spring TaskScheduler，无需额外依赖
- 不持久化，适合轻量级任务
- 10 个核心线程的线程池

## 核心方法

### 1. invokeNow

立即在任务线程池中异步执行任务。

```java
public static void invokeNow(Runnable runnable)
```

| 参数 | 类型 | 说明 |
|-----|------|------|
| runnable | Runnable | 要执行的任务 |

**示例**：

```java
TaskUtil.invokeNow(() -> {
    System.out.println("异步任务执行");
    sendEmail();
});
```

### 2. invokeLater (Duration)

延迟指定时长后执行任务。

```java
public static void invokeLater(Runnable runnable, Duration duration)
```

| 参数 | 类型 | 说明 |
|-----|------|------|
| runnable | Runnable | 要执行的任务 |
| duration | Duration | 延迟时长 |

**示例**：

```java
// 5分钟后发送通知
TaskUtil.invokeLater(() -> {
    notificationService.send("提醒消息");
}, Duration.ofMinutes(5));
```

### 3. invokeLater (Cron)

根据 Cron 表达式定时执行任务。

```java
public static void invokeLater(Runnable runnable, String cron)
```

| 参数 | 类型 | 说明 |
|-----|------|------|
| runnable | Runnable | 要执行的任务 |
| cron | String | Cron 表达式 |

**示例**：

```java
// 每天凌晨2点执行
TaskUtil.invokeLater(() -> {
    reportService.generateDailyReport();
}, "0 0 2 * * ?");
```

### 4. invokeLoopRate

立即执行，并按固定频率循环执行。

```java
public static void invokeLoopRate(Runnable runnable, Duration duration)
```

| 参数 | 类型 | 说明 |
|-----|------|------|
| runnable | Runnable | 要执行的任务 |
| duration | Duration | 执行间隔 |

**说明**：任务每隔 duration 执行一次，不管上次任务是否完成。

**示例**：

```java
// 每30秒执行一次心跳
TaskUtil.invokeLoopRate(() -> {
    System.out.println("Heartbeat: " + System.currentTimeMillis());
}, Duration.ofSeconds(30));
```

### 5. invokeLoopDelay

立即执行，并在每次执行结束后延迟固定时间再执行。

```java
public static void invokeLoopDelay(Runnable runnable, Duration duration)
```

| 参数 | 类型 | 说明 |
|-----|------|------|
| runnable | Runnable | 要执行的任务 |
| duration | Duration | 延迟时长 |

**说明**：任务执行完成后，等待 duration 时间后再执行下一次。

**示例**：

```java
// 执行完成后等待10秒再执行
TaskUtil.invokeLoopDelay(() -> {
    dataService.syncData();
}, Duration.ofSeconds(10));
```

### 6. invokeLaterLoopDelay

延迟一段时间后执行，并在每次执行结束后延迟固定时间再执行。

```java
public static void invokeLaterLoopDelay(Runnable runnable, Duration firstDelayDuration, Duration duration)
```

| 参数 | 类型 | 说明 |
|-----|------|------|
| runnable | Runnable | 要执行的任务 |
| firstDelayDuration | Duration | 首次延迟时长 |
| duration | Duration | 后续延迟时长 |

**示例**：

```java
// 1分钟后开始，每次执行完等待5秒
TaskUtil.invokeLaterLoopDelay(() -> {
    processQueue();
}, Duration.ofMinutes(1), Duration.ofSeconds(5));
```

## 完整示例

### 示例 1: 异步发送通知

```java
import com.molandev.framework.spring.task.TaskUtil;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    @Autowired
    private EmailService emailService;

    @Autowired
    private SmsService smsService;

    // 用户注册后异步发送欢迎邮件
    public void sendWelcomeNotification(User user) {
        // 立即异步发送
        TaskUtil.invokeNow(() -> {
            emailService.sendWelcome(user.getEmail(), user.getName());
        });

        // 5分钟后发送短信提醒
        TaskUtil.invokeLater(() -> {
            smsService.send(user.getPhone(), "欢迎使用我们的服务！");
        }, Duration.ofMinutes(5));
    }

    // 订单支付成功后30秒发送确认邮件
    public void sendOrderConfirmation(Order order) {
        TaskUtil.invokeLater(() -> {
            emailService.sendOrderConfirmation(order);
        }, Duration.ofSeconds(30));
    }
}
```

### 示例 2: 定时任务

```java
import com.molandev.framework.spring.task.TaskUtil;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class ScheduledTaskStarter implements ApplicationRunner {

    @Override
    public void run(ApplicationArguments args) {
        // 每天凌晨2点生成报表
        TaskUtil.invokeLater(() -> {
            generateDailyReport();
        }, "0 0 2 * * ?");

        // 每小时执行一次数据同步
        TaskUtil.invokeLater(() -> {
            syncData();
        }, "0 0 * * * ?");

        // 每周一上午9点发送周报
        TaskUtil.invokeLater(() -> {
            sendWeeklyReport();
        }, "0 0 9 ? * MON");
    }

    private void generateDailyReport() {
        System.out.println("生成日报: " + LocalDateTime.now());
    }

    private void syncData() {
        System.out.println("同步数据: " + LocalDateTime.now());
    }

    private void sendWeeklyReport() {
        System.out.println("发送周报: " + LocalDateTime.now());
    }
}
```

### 示例 3: 心跳和健康检查

```java
import com.molandev.framework.spring.task.TaskUtil;
import org.springframework.stereotype.Component;

@Component
public class HealthCheckService {

    @Autowired
    private List<HealthIndicator> healthIndicators;

    @PostConstruct
    public void startHealthCheck() {
        // 每30秒执行一次健康检查
        TaskUtil.invokeLoopRate(() -> {
            checkHealth();
        }, Duration.ofSeconds(30));

        // 每分钟上报心跳
        TaskUtil.invokeLoopRate(() -> {
            sendHeartbeat();
        }, Duration.ofMinutes(1));
    }

    private void checkHealth() {
        for (HealthIndicator indicator : healthIndicators) {
            Health health = indicator.health();
            if (health.getStatus() != Status.UP) {
                log.warn("服务不健康: {}", indicator.getName());
            }
        }
    }

    private void sendHeartbeat() {
        log.info("Heartbeat: {}", System.currentTimeMillis());
    }
}
```

### 示例 4: 数据处理队列

```java
import com.molandev.framework.spring.task.TaskUtil;

import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

@Service
public class DataProcessor {

    private final BlockingQueue<Data> queue = new LinkedBlockingQueue<>(1000);

    @PostConstruct
    public void startProcessor() {
        // 使用 Loop Delay 模式处理队列
        // 每次处理完成后等待1秒再处理下一批
        TaskUtil.invokeLoopDelay(() -> {
            processQueue();
        }, Duration.ofSeconds(1));
    }

    public void submit(Data data) {
        queue.offer(data);
    }

    private void processQueue() {
        List<Data> batch = new ArrayList<>();
        queue.drainTo(batch, 100);  // 每次处理100条

        if (!batch.isEmpty()) {
            log.info("处理 {} 条数据", batch.size());
            dataService.processBatch(batch);
        }
    }
}
```

## 虚拟线程支持

TaskUtil 在 Java 21+ 环境下会自动使用虚拟线程，提供更高的并发性能。

```java
// Java 21+ 环境
ThreadFactory threadFactory = Thread.ofVirtual()
    .name("virtual-scheduler-", 0)
    .factory();

// Java 8-17 环境
ThreadFactory threadFactory = r -> {
    Thread thread = new Thread(r, "scheduler-thread-" + r.hashCode());
    thread.setDaemon(true);
    return thread;
};
```

## Cron 表达式说明

Cron 表达式格式：`秒 分 时 日 月 周`

| 字段 | 允许值 | 允许的特殊字符 |
|-----|--------|--------------|
| 秒 | 0-59 | , - * / |
| 分 | 0-59 | , - * / |
| 时 | 0-23 | , - * / |
| 日 | 1-31 | , - * ? / L W |
| 月 | 1-12 或 JAN-DEC | , - * / |
| 周 | 1-7 或 SUN-SAT | , - * ? / L # |

**常用示例**：

```java
// 每分钟执行
"0 * * * * ?"

// 每小时执行
"0 0 * * * ?"

// 每天凌晨2点执行
"0 0 2 * * ?"

// 每周一上午9点执行
"0 0 9 ? * MON"

// 每月1号凌晨3点执行
"0 0 3 1 * ?"

// 每10秒执行一次
"*/10 * * * * ?"

// 工作日上午9点到下午6点，每小时执行
"0 0 9-18 ? * MON-FRI"
```

## 注意事项

### ⚠️ 非持久化

TaskUtil 的任务不会持久化，应用重启后任务会丢失。如需持久化任务，建议使用：
- Quartz
- XXL-JOB
- Elastic-Job

### ⚠️ 异常处理

任务中的异常不会向外传播，建议在任务内部捕获异常：

```java
TaskUtil.invokeNow(() -> {
    try {
        riskyOperation();
    } catch (Exception e) {
        log.error("任务执行失败", e);
    }
});
```

### ⚠️ 线程池大小

TaskUtil 使用固定 10 个线程的线程池。如果有大量长时间运行的任务，可能导致任务排队。

### ⚠️ Rate vs Delay

- **invokeLoopRate**: 固定频率执行，即使上次任务未完成也会启动新任务
- **invokeLoopDelay**: 固定延迟执行，等上次任务完成后才开始计时

选择合适的模式避免任务堆积。

## 技术细节

### 线程池配置

```java
ScheduledThreadPoolExecutor scheduler = new ScheduledThreadPoolExecutor(
    10,                    // 核心线程数
    threadFactory          // 线程工厂（支持虚拟线程）
);
scheduler.setRemoveOnCancelPolicy(true);      // 取消后移除任务
scheduler.allowCoreThreadTimeOut(true);       // 核心线程超时
```

### 虚拟线程支持

```java
// 使用 ThreadUtil 自动支持虚拟线程
ThreadFactory threadFactory = ThreadUtil.createVirtualThreadFactory();
// Java 21+: 自动使用虚拟线程
// Java 8-17: 自动降级为普通线程
```

## 常见问题

### Q1: TaskUtil 适合什么场景？

**A**: 适合轻量级、非关键任务：
- 异步发送通知
- 定时清理缓存
- 心跳上报
- 简单的定时任务

**不适合**：
- 需要持久化的任务
- 分布式调度
- 复杂的任务依赖关系

### Q2: 如何停止循环任务？

**A**: TaskUtil 返回的 `ScheduledFuture` 可以用于取消任务：

```java
ScheduledFuture<?> future = taskScheduler.scheduleAtFixedRate(...);
// 需要时取消
future.cancel(false);
```

但 TaskUtil 当前版本不返回 future，如需取消功能，建议直接使用 TaskScheduler。

### Q3: 虚拟线程有什么优势？

**A**: 在 Java 21+ 环境下：
- 更轻量级（几KB内存）
- 支持更高并发度
- 自动适配，无需修改代码

### Q4: 如何获取 TaskScheduler 实例？

**A**: 

```java
TaskScheduler scheduler = TaskUtil.getTaskScheduler();
// 使用 scheduler 进行更复杂的调度
```

### Q5: 与 @Scheduled 注解的区别？

**A**: 

| 特性 | TaskUtil | @Scheduled |
|-----|---------|-----------|
| 使用方式 | 编程式 | 声明式 |
| 灵活性 | 高（运行时动态创建） | 低（编译时确定） |
| 持久化 | 不支持 | 不支持 |
| 分布式 | 不支持 | 不支持 |

## 相关工具

- [JSON 工具](./json.md) - JSON 序列化
- [Spring 工具](./spring.md) - Spring 容器访问

## 参考资料

- [Spring TaskScheduler](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/scheduling/TaskScheduler.html)
- [Cron 表达式](https://en.wikipedia.org/wiki/Cron)
- [Java Virtual Threads](https://openjdk.org/jeps/444)
