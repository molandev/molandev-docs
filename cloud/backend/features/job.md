# 定时任务

## 解决的问题

业务系统中经常需要执行定时任务，如：

- ⏰ **定期清理** - 清理过期数据、临时文件
- 📊 **数据统计** - 每日数据汇总、报表生成
- 📧 **消息推送** - 定时发送通知、提醒
- 🔄 **数据同步** - 定时同步外部系统数据

传统做法是在代码中使用 `@Scheduled` 注解或 Quartz 框架，存在以下问题：

- ❌ **修改困难** - 调整 Cron 表达式需要修改代码并重新部署
- ❌ **无法管理** - 看不到任务列表，无法临时启停
- ❌ **监控困难** - 任务是否执行、执行结果难以追踪
- ❌ **扩展复杂** - 使用 XXL-JOB 等需要额外部署和学习成本

MolanDev Backend 提供了**轻量级定时任务管理**，适合中小规模的任务调度需求。

## 适用场景与定位

### ✅ 适合的场景

- 任务数量：< 100 个
- 任务频率：秒级以上（不要求毫秒级精度）
- 部署规模：单机或小集群（2-5 节点）
- 管理需求：可视化管理、动态调整

**典型应用：**
- 定期清理过期数据（每天凌晨）
- 发送每日报表邮件（每天早上 9 点）
- 密码过期提醒（每天检查一次）
- 简单的数据同步任务

### ❌ 不适合的场景

当任务调度需求较大时，建议使用成熟的调度平台：

- 任务数量：> 100 个
- 高并发：大量任务密集执行
- 复杂编排：任务依赖、工作流
- 大规模集群：数十个节点

**推荐替代方案：**
- [XXL-JOB](https://www.xuxueli.com/xxl-job/) - 分布式任务调度平台
- [Elastic-Job](https://shardingsphere.apache.org/elasticjob/) - 分布式调度解决方案
- [PowerJob](http://www.powerjob.tech/) - 企业级分布式任务调度平台

## 核心特性

### ✅ 可视化管理
- 管理界面创建、编辑、删除任务
- 查看任务执行计划（未来 3 次执行时间）
- 动态启用/禁用任务

### ✅ 基于 DelayQueue
- 内存延迟队列，性能优秀
- 无需数据库轮询
- 支持 Cron 表达式

### ✅ 双模部署支持
- **单体模式**：本地直接调用，无 HTTP 开销
- **微服务模式**：HTTP 调度，跨服务执行
- **自动切换**：代码无需变更，系统根据配置自动适配

### ✅ 虚拟线程支持
- 使用 `TaskUtil` 执行任务
- JDK 21+ 自动启用虚拟线程
- 高并发、低开销

### ✅ 分布式支持
- 使用分布式锁防止重复执行
- 多节点部署时自动协调
- 任务执行日志记录

## 快速开始

### 1. 定义任务处理方法

在业务服务中使用 `@TaskSchedule` 注解：

```java
@Component
public class UserExpireNotifyJob {
    
    @Autowired
    private SysUserService userService;
    
    @Autowired
    private MsgSendApi msgSendApi;
    
    /**
     * 密码过期提醒任务
     */
    @TaskSchedule("UserExpireNotifyJob")
    public void expireNotify() {
        // 查询即将过期的用户
        List<SysUserEntity> users = userService.findUsersSoonExpire();
        
        for (SysUserEntity user : users) {
            // 发送邮件提醒
            MsgSendEvent event = new MsgSendEvent();
            event.setToAddress(user.getEmail());
            event.setTitle("密码即将过期提醒");
            event.setTemplateCode("PASSWORD_EXPIRE_NOTIFY");
            msgSendApi.send(event);
        }
    }
}
```

**@TaskSchedule 注解：**
- `value` - 任务标识（唯一，用于管理界面配置）

### 2. 管理界面创建任务

在系统管理 → 定时任务管理：

**任务配置：**
- 任务名称：密码过期提醒
- 服务名称：system-service
- 任务标识：UserExpireNotifyJob
- Cron 表达式：`0 0 9 * * ?`（每天早上 9 点）
- 管理员邮箱：admin@example.com（失败时通知）
- 任务状态：启用

保存后任务自动加入调度队列。

::: tip TODO - 定时任务管理界面
**建议截图：** 任务列表页面和任务编辑页面，展示 Cron 表达式、执行计划等
:::

### 3. 查看执行记录

在定时任务 → 执行记录：

**记录信息：**
- 任务名称、执行节点
- 开始时间、结束时间
- 执行状态（调度中、运行中、成功、失败）
- 错误信息（失败时）
- 执行日志（如果配置了日志收集）

## 任务配置说明

### 数据表结构

**任务定义表（task_schedule）：**

| 字段 | 说明 | 示例 |
|------|------|------|
| task_name | 任务名称 | 密码过期提醒 |
| service_name | 归属服务 | system-service |
| task_identifier | 任务标识 | UserExpireNotifyJob |
| cron | Cron 表达式 | 0 0 9 * * ? |
| description | 任务描述 | 每天早上9点检查密码过期 |
| admin_name | 管理员姓名 | 张三 |
| admin_email | 管理员邮箱 | admin@example.com |
| disabled | 是否禁用 | false |
| collect_log | 是否收集日志 | true |
| args | 任务参数 | {"param1": "value1"} |

### Cron 表达式

系统使用标准 Cron 表达式（6 位）：

```
格式：秒 分 时 日 月 周

示例：
0 0 9 * * ?         每天早上 9 点
0 */30 * * * ?      每 30 分钟
0 0 2 * * ?         每天凌晨 2 点
0 0 9 * * MON       每周一早上 9 点
0 0 1 1 * ?         每月 1 号凌晨 1 点
```

**通配符说明：**
- `*` - 所有值
- `?` - 不指定值（日和周只能有一个指定）
- `-` - 范围（如 1-5）
- `,` - 列举（如 1,3,5）
- `/` - 步长（如 */5 表示每 5 个单位）

**在线工具：**
- [Cron 表达式生成器](https://cron.qqe2.com/)
- [Cron 表达式验证](https://www.pppet.net/)

## 任务管理操作

### 1. 启用/禁用任务

```java
@PostMapping("/enable")
@HasPermission("task:manage:edit")
public JsonResult<Void> enableJob(String id) {
    taskManageService.enableJob(id);
    return JsonResult.success();
}

@PostMapping("/disable")
@HasPermission("task:manage:edit")
public JsonResult<Void> disableJob(String id) {
    taskManageService.disableJob(id);
    return JsonResult.success();
}
```

**效果：**
- 启用 - 任务加入调度队列
- 禁用 - 任务从调度队列移除

### 2. 立即执行

不等待 Cron 触发，立即执行一次：

```java
@PostMapping("/execNow")
@HasPermission("task:manage:exec")
public JsonResult<Void> execNow(String id) {
    taskManageService.execNow(id);
    return JsonResult.success();
}
```

**应用场景：**
- 测试任务是否正常
- 临时需要执行一次
- 调整 Cron 后验证

### 3. 查看执行计划

任务列表自动显示未来 3 次执行时间：

```java
CronExpression expression = new CronExpression(cron);
Date nextTime = expression.getTimeAfter(new Date());  // 下次执行时间
```

## 实现原理

### 1. DelayQueue 调度

使用 JDK 的 `DelayQueue` 实现定时触发：

```java
@Component
public class TaskScheduler implements ApplicationRunner {
    
    // 延迟队列
    final DelayQueue<TaskTrigger> queue = new DelayQueue<>();
    
    // 工作线程池
    ThreadPoolExecutor threadPoolExecutor;
    
    @Override
    public void run(ApplicationArguments args) {
        // 单线程从队列取任务
        Executors.newSingleThreadExecutor().submit(() -> {
            while (true) {
                // 阻塞等待到期的任务
                TaskTrigger trigger = queue.take();
                
                // 计算下次执行时间
                TaskTrigger next = trigger.next();
                if (next != null) {
                    queue.add(next);  // 加入下次执行
                }
                
                // 线程池执行任务
                threadPoolExecutor.execute(() -> {
                    executeTask(trigger);
                });
            }
        });
    }
}
```

### 2. 任务触发器

`TaskTrigger` 实现 `Delayed` 接口：

```java
public class TaskTrigger implements Delayed {
    
    String id;
    CronExpression cron;
    long nextTime;  // 下次执行时间戳
    
    @Override
    public long getDelay(TimeUnit unit) {
        return unit.convert(
            nextTime - System.currentTimeMillis(), 
            TimeUnit.MILLISECONDS
        );
    }
    
    // 计算下次执行时间
    public TaskTrigger next() {
        Date timeAfter = cron.getTimeAfter(new Date(nextTime));
        if (timeAfter != null) {
            TaskTrigger newTrigger = new TaskTrigger();
            newTrigger.nextTime = timeAfter.getTime();
            return newTrigger;
        }
        return null;
    }
}
```

### 3. HTTP 调度执行

任务到期后，**微服务模式**通过 HTTP 调用业务服务执行：

```java
public String execute(TaskExecutionDto dto) {
    String serviceUrl = discoveryClient.getInstanceUrl(dto.getServiceName());
    String execUrl = serviceUrl + "/task/execute";
    
    HttpResponse response = httpClient.post(execUrl)
        .body(dto)
        .execute();
    
    return response.getBody();
}
```

业务服务接收请求并执行任务方法：

```java
@PostMapping("/task/execute")
public JsonResult<Void> execute(@RequestBody TaskExecutionDto dto) {
    // 根据 taskIdentifier 找到对应的任务方法
    Method method = taskRegistry.getMethod(dto.getTaskIdentifier());
    // 反射调用
    method.invoke(bean, dto.getArgs());
    return JsonResult.success();
}
```

### 4. 双模部署自动切换

**核心亮点：业务代码无需修改，系统自动适配单体/微服务模式！**

**单体模式（run-mode: single）：**
```java
// LocalTaskExecutor - 本地直接调用
@Override
public String execute(TaskExecutionDto dto) {
    String taskIdentifier = dto.getTaskIdentifier();
    TaskScheduleMethodInfo methodInfo = taskScheduleProcessor
        .getTaskScheduleMethods().get(taskIdentifier);
    
    Object bean = methodInfo.getBean();
    Method method = methodInfo.getMethod();
    
    // 使用 TaskUtil 执行（支持虚拟线程）
    TaskUtil.invokeNow(() -> {
        method.invoke(bean, dto.getArgs());
    });
    
    return "local";
}
```

**微服务模式（run-mode: cloud）：**
```java
// RemoteTaskExecutor - HTTP 调度
@Override
public String execute(TaskExecutionDto dto) {
    String serviceUrl = discoveryClient.getInstanceUrl(dto.getServiceName());
    String execUrl = serviceUrl + "/task/execute";
    
    // 通过 HTTP 调用远程服务
    HttpResponse response = httpClient.post(execUrl)
        .body(dto)
        .execute();
    
    return response.getBody();
}
```

**配置切换：**

```yaml
# 单体模式
---
molandev:
  run-mode: single

# 微服务模式
---
molandev:
  run-mode: cloud
```

**两种模式对比：**

| 特性 | 单体模式 | 微服务模式 |
|------|----------|------------|
| **调用方式** | 本地直接调用 | HTTP 远程调用 |
| **性能** | ⚡ 极快（无网络开销） | 🔄 较快（有 HTTP 开销） |
| **跨服务** | ❌ 不支持 | ✅ 支持 |
| **部署形态** | 单一 JAR | 多服务集群 |
| **代码修改** | ✅ 无需 | ✅ 无需 |

**使用场景：**
- 👉 **单体模式**：小型项目、快速开发、低成本部署
- 👉 **微服务模式**：大型项目、服务拆分、独立扩展

### 5. 虚拟线程支持

任务执行使用 `TaskUtil` 线程工具：

```java
// TaskUtil 使用 ThreadUtil 自动支持虚拟线程
protected static TaskScheduler createTaskScheduler() {
    // ThreadUtil 自动检测并使用虚拟线程（Java 21+）或普通线程
    ThreadFactory threadFactory = ThreadUtil.createVirtualThreadFactory();
    
    ScheduledThreadPoolExecutor scheduler = 
        new ScheduledThreadPoolExecutor(10, threadFactory);
    return new ConcurrentTaskScheduler(scheduler);
}
```

**虚拟线程优势：**
- 🚀 **高并发**：可以同时执行上万个任务
- 💰 **低开销**：内存占用极小
- ⚡ **快速创建**：创建和销毁成本极低

**自动适配：**
- JDK 21+：自动使用虚拟线程
- JDK 17/20：使用普通线程池
- 业务代码无需修改

### 6. 分布式锁

使用 Redis 分布式锁防止多节点重复执行：

```java
LockUtils.runInLock(
    taskId + nextTime,  // 锁key
    0,   // waitTime: 0秒（抢不到锁就放弃）
    300, // leaseTime: 5分钟
    () -> {
        // 执行任务
        taskExecutor.execute(task);
    }
);
```

**锁机制：**
- 同一任务的同一执行时间点只有一个节点能获取锁
- 其他节点获取锁失败则跳过
- 避免多节点部署时重复执行

## 任务参数传递

### 1. 配置参数

在任务管理界面设置 `args` 字段（字符串格式，建议使用 JSON）：

```json
{
  "batchSize": 100,
  "timeout": 30
}
```

### 2. 任务方法接收参数

直接在方法上加一个 `String args` 参数：

```java
@TaskSchedule("DataSyncJob")
public void syncData(String args) {
    // 解析参数
    if (StringUtils.isNotEmpty(args)) {
        Map<String, Object> params = JSONUtils.toMap(args);
        int batchSize = (int) params.get("batchSize");
        int timeout = (int) params.get("timeout");
        
        // 使用参数执行任务
        dataService.sync(batchSize, timeout);
    } else {
        // 默认参数
        dataService.sync(100, 30);
    }
}
```

**使用说明：**
- 参数可选，方法可以无参数或有一个 `String args` 参数
- 参数为字符串类型，可以是 JSON 或普通字符串
- 系统会自动将数据库中的 `args` 字段传递给方法

## 失败通知

### 1. 配置管理员邮箱

任务定义时填写管理员邮箱：

```
admin_email: admin@example.com
```

### 2. 自动发送通知

任务执行失败时自动发送邮件：

```java
public void onError(TaskTrigger trigger, Exception e) {
    if (StringUtils.isNotEmpty(trigger.getAdminEmail())) {
        MsgSendEvent event = new MsgSendEvent();
        event.setToAddress(trigger.getAdminEmail());
        event.setTitle("任务执行失败通知：" + trigger.getTaskName());
        event.setParams(Map.of(
            "jobName", trigger.getTaskName(),
            "reason", e.getMessage()
        ));
        event.setMsgType(MsgTypes.email);
        EventUtil.publish(event);
    }
}
```

## 最佳实践

### 1. 任务设计原则

**幂等性：**
- 任务应该支持重复执行不会产生副作用
- 使用唯一标识避免重复处理数据

```java
@TaskSchedule("OrderTimeoutJob")
public void handleTimeout() {
    // ✅ 使用状态判断，支持重复执行
    List<Order> orders = orderService.findTimeoutOrders();
    for (Order order : orders) {
        if (order.getStatus() == OrderStatus.UNPAID) {
            order.setStatus(OrderStatus.CANCELLED);
            orderService.update(order);
        }
    }
}
```

**快速执行：**
- 单次任务执行时间不要太长（< 5 分钟）
- 长任务拆分成多次执行或批处理

```java
@TaskSchedule("DataCleanJob")
public void cleanData() {
    // ✅ 分批处理，每次处理 1000 条
    int batchSize = 1000;
    boolean hasMore = true;
    
    while (hasMore) {
        List<Data> batch = dataService.findExpired(batchSize);
        if (batch.isEmpty()) {
            hasMore = false;
        } else {
            dataService.deleteBatch(batch);
        }
    }
}
```

### 2. 错误处理

```java
@TaskSchedule("ReportJob")
public void generateReport() {
    try {
        // 业务逻辑
        reportService.generate();
    } catch (Exception e) {
        log.error("报表生成失败", e);
        // 记录到执行日志
        TaskContext.setErrorMsg(e.getMessage());
        throw e;  // 抛出异常，触发失败通知
    }
}
```

### 3. 日志收集

启用日志收集后，任务执行的 **logger 日志**会被记录：

```java
@TaskSchedule("LogTestJob")
public void test() {
    log.info("任务开始执行");      // ✅ 会被收集
    log.info("处理了 100 条数据");   // ✅ 会被收集
    log.info("任务执行完成");      // ✅ 会被收集
    
    System.out.println("这条日志不会被收集");  // ❌ 不会收集
}
```

**重要说明：**
- ✅ **会收集**：使用 `log.info()`、`log.error()` 等 logger 打印的日志
- ❌ **不会收集**：使用 `System.out.println()` 打印的内容
- ⚠️ **暂不支持**：未封装与监控系统（如 Prometheus、Grafana）的对接

**日志收集配置：**

在任务定义时勾选“收集日志”：
- 启用后，任务执行过程中的 logger 日志会被自动收集
- 日志会上传到文件服务，并在执行记录中展示
- 日志文件命名：`job_{recordId}.log`

**最佳实践：**
```java
@TaskSchedule("DataProcessJob")
public void process() {
    log.info("开始处理数据...");
    
    try {
        List<Data> dataList = dataService.findAll();
        log.info("共查询到 {} 条数据", dataList.size());
        
        for (Data data : dataList) {
            processData(data);
        }
        
        log.info("数据处理完成");
    } catch (Exception e) {
        log.error("数据处理失败：{}", e.getMessage(), e);
        throw e;
    }
}
```

### 4. 监控告警

除了失败通知，建议通过日志记录进行任务监控：

```java
@TaskSchedule("ImportantJob")
public void importantTask() {
    long startTime = System.currentTimeMillis();
    try {
        // 执行任务
        taskService.execute();
        
        long duration = System.currentTimeMillis() - startTime;
        log.info("任务执行成功，耗时: {} ms", duration);
    } catch (Exception e) {
        log.error("任务执行失败", e);
        throw e;
    }
}
```

**注意：**
- ⚠️ 系统未封装与监控系统（如 Prometheus、Grafana）的对接
- 建议通过日志集中平台（如 ELK）进行日志分析和告警
- 或者自行集成第三方监控 SDK

## 与 XXL-JOB 对比

| 特性 | MolanDev Cloud | XXL-JOB |
|------|----------------|---------|
| 部署 | 无需额外服务 | 需要部署调度中心 |
| 管理 | 嵌入式管理界面 | 独立管理平台 |
| 适用规模 | < 100 个任务 | 大规模任务调度 |
| 学习成本 | 低（一个注解） | 中（需要学习平台） |
| 分片执行 | 不支持 | 支持 |
| 任务编排 | 不支持 | 支持工作流 |
| 执行监控 | 基础监控 | 完善的监控告警 |
| 动态修改 | 支持 | 支持 |

**选择建议：**
- 任务简单、数量少 → MolanDev Cloud 定时任务
- 任务复杂、数量多 → XXL-JOB / Elastic-Job

## 总结

MolanDev Backend 的定时任务管理提供了：

- ✅ **轻量级** - 基于 DelayQueue，无需额外服务
- ✅ **易使用** - `@TaskSchedule` 注解一行代码定义任务
- ✅ **可管理** - 可视化界面动态调整 Cron 和启停
- ✅ **双模支持** - 单体/微服务自动切换，代码无需变更
- ✅ **虚拟线程** - JDK 21+ 自动启用，高并发低开销
- ✅ **有监控** - 执行记录、失败通知、logger 日志收集
- ✅ **支持分布式** - 分布式锁防止重复执行

适合中小规模、轻量级的定时任务场景。当任务规模扩大时，可以平滑迁移到 XXL-JOB 等专业平台。
