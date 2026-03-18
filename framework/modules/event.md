# Event 事件发布与订阅

`molandev-event` 是一个轻量级的事件驱动模块，遵循"单体/微服务无缝切换"的设计哲学。它提供了一套统一的 API，允许开发者在单体模式下使用纯内存分发，在微服务模式下自动切换为 RabbitMQ 跨服务通信。

## 解决的问题

在传统开发中，业务逻辑常出现强耦合：

```java
// ❌ 传统做法：登录逻辑与其他业务强耦合
public void login(User user) {
    saveLoginLog(user);
    scoreService.addScore(user);        // 增加积分
    statService.updateLoginCount(user); // 更新统计
    msgService.sendLoginNotify(user);   // 发送通知
    // 新增业务需要改登录代码
}
```

**问题：**
- ❌ 核心业务与次要业务强耦合
- ❌ 新增业务需要修改原有代码
- ❌ 某个业务失败可能影响主流程
- ❌ 代码越来越臃肿

**使用事件驱动后：**

```java
// ✅ 发布者 - 只关注核心逻辑
public void login(User user) {
    saveLoginLog(user);
    EventUtil.publish(new UserLoginEvent(user)); // 发布事件
}

// ✅ 订阅者 - 各自处理自己的业务
@Component
public class ScoreService {
    @MolanListener
    public void onUserLogin(UserLoginEvent event) {
        addScore(event.getUser());  // 增加积分
    }
}
```

**优势：**
- ✅ **解耦** - 发布者不需要知道订阅者
- ✅ **扩展** - 新增业务只需添加监听器
- ✅ **隔离** - 某个监听器失败不影响其他
- ✅ **清晰** - 每个组件职责单一

## 核心特性

### 1. API 极致精简

**发布事件：**
```java
EventUtil.publish(event);  // 静态方法，任何地方都能用
```

**监听事件：**
```java
@MolanListener  // 一个注解搞定
public void onEvent(SomeEvent event) { }
```

### 2. 类型安全

**无需字符串 Topic：**
```java
// ❌ 传统消息队列
mqTemplate.send("user_login_topic", data);  // 字符串容易拼错

// ✅ 类型安全的事件
EventUtil.publish(new UserLoginEvent(user));  // 编译期检查
```

### 3. 双模无缝切换

**相同代码，不同部署：**

| 特性 | 单体模式 | 微服务模式 |
|------|----------|------------|
| **通信方式** | 进程内内存分发 | RabbitMQ 跨服务通信 |
| **性能** | ⚡ 极快（纳秒级） | 🔄 较快（毫秒级） |
| **可靠性** | 进程内保证 | 消息持久化 |
| **适用场景** | 单体应用、本地事件 | 微服务架构、跨服务通信 |
| **配置切换** | `run-mode: single` | `run-mode: cloud` |

**代码完全相同，无需修改！**

### 4. 广播 vs 争抢

**广播模式（默认）：**
```java
@MolanListener
public void listener1(UserLoginEvent event) { }  // 会执行

@MolanListener
public void listener2(UserLoginEvent event) { }  // 也会执行
```
- 所有监听器都会收到事件
- 适合：通知、日志、统计等场景

**争抢模式（指定 group）：**
```java
@MolanListener(group = "score-group")
public void listener1(UserLoginEvent event) { }  // 只会执行一个

@MolanListener(group = "score-group")
public void listener2(UserLoginEvent event) { }  // 另一个不执行
```
- 同一 group 内只有一个监听器执行
- 适合：避免重复处理、负载均衡

### 5. 同步 vs 异步

**异步执行（默认）：**
```java
@MolanListener  // async = true（默认）
public void onEvent(SomeEvent event) {
    // 在独立线程池执行，不阻塞发布者
    // 线程池配置（根据Java版本自动选择）：
    // - Java 21+：使用虚拟线程
    // - Java <= 21：普通线程池配置
    //   - 核心线程数：5
    //   - 最大线程数：20
    //   - 队列容量：100
    //   - 线程前缀：molan-event-
}
```

**同步执行：**
```java
@MolanListener(async = false)
public void onEvent(SomeEvent event) {
    // 在发布者线程执行，事务内生效
}
```

**异步执行优势：**
- ⚡ 不阻塞事件发布者
- ⚖️ 支持并发处理多个事件
- 🔒 线程安全，避免并发问题
- 🛡️ 异常隔离，单个监听器异常不影响其他
- 🚀 Java 21+ 支持虚拟线程，更高性能

### 6. 事件冒泡

支持事件继承体系：
```java
public class BaseEvent { }
public class ChildEvent extends BaseEvent { }

// 监听父类
@MolanListener
public void onBase(BaseEvent e) { }

// 发布子类事件，父类监听器也会触发
EventUtil.publish(new ChildEvent());
```

---

## 快速入门

### 1. 引入依赖

```xml
<dependency>
    <groupId>com.molandev</groupId>
    <artifactId>molandev-event</artifactId>
    <version>${molan.version}</version>
</dependency>
```

### 2. 定义事件对象

无需继承任何基类，普通的 POJO 即可：

```java
public class UserLoginEvent {
    private String username;
    // ... constructor, getter, setter
}
```

### 3. 发布事件

使用 `EventUtil` 静态方法，在代码任何地方均可调用：

```java
EventUtil.publish(new UserLoginEvent("molandev"));
```

### 4. 监听事件

在 Spring Bean 中通过 `@MolanListener` 注解定义处理逻辑：

```java
@Component
public class ScoreService {

    // 广播模式：所有该类的监听者都会收到
    @MolanListener(UserLoginEvent.class)
    public void onLoginAddScore(UserLoginEvent event) {
        System.out.println("为用户增加积分: " + event.getUsername());
    }

    // 争抢模式：同组（group）内只有一个实例会收到
    @MolanListener(value = UserLoginEvent.class, group = "score-cluster")
    public void onLoginSingleProcess(UserLoginEvent event) {
        // ... 业务逻辑
    }
    
    // 参数类型自动推断：不指定事件类型，自动从方法参数推断
    @MolanListener
    public void onLoginAutoInferred(UserLoginEvent event) {
        // 框架会自动根据方法参数类型 UserLoginEvent 推断监听的事件类型
    }
}
```

**注意**：
- 监听器方法必须有且仅有一个参数，该参数类型即为监听的事件类型
- 如果未显式指定 `@MolanListener` 的 `value` 参数，框架会自动从方法的第一个参数类型推断
- 如果显式指定了事件类型，则该类型必须与方法参数类型一致，否则启动时会抛出异常

---

## 实际应用场景

### 场景 1：字典变更后刷新缓存

**问题：** 字典更新后，各个服务的缓存需要同步刷新

**方案：** 字典服务发布事件，各服务自己监听并清理缓存

```java
// 字典服务
@PostMapping("/edit")
public JsonResult<Void> edit(@RequestBody SysDictVo dictVo) {
    sysDictService.saveOrUpdate(dictVo);
    EventUtil.publish(new DictChangeEvent(dictVo.getDictCode()));
    return JsonResult.success();
}

// 系统服务
@Component
public class SysDictCacheListener {
    @MolanListener
    public void onDictChange(DictChangeEvent event) {
        dictItemMap.remove(event.getCode());
        log.info("清理字典缓存：{}", event.getCode());
    }
}

// 消息服务
@Component
public class MsgDictCacheListener {
    @MolanListener
    public void onDictChange(DictChangeEvent event) {
        msgDictCache.remove(event.getCode());
    }
}
```

**优势：**
- 字典服务不需要知道有哪些订阅者
- 新增服务只需添加监听器
- 单体模式：内存通知，微服务模式：RabbitMQ 通知

### 场景 2：定时任务变更后重新调度

**问题：** 任务配置更新后，需要重新加载到调度器

**方案：** 任务管理发布事件，调度器监听并重新加载

```java
// 任务管理服务
@Service
public class TaskManageService {
    public void updateJob(TaskScheduleEntity job) {
        taskScheduleService.updateById(job);
        EventUtil.publish(new JobUpdateEvent(job.getId(), "UPDATE"));
    }
}

// 任务调度器
@Component
public class TaskSchedulerListener {
    @MolanListener
    public void handleJobChange(JobUpdateEvent event) {
        if ("DELETE".equals(event.getType()) || "UPDATE".equals(event.getType())) {
            taskScheduler.removeJob(event.getJobId());
        }
        if ("ADD".equals(event.getType()) || "UPDATE".equals(event.getType())) {
            TaskScheduleEntity job = taskScheduleService.getById(event.getJobId());
            if (job != null && !job.getDisabled()) {
                taskScheduler.addJob(job);
            }
        }
    }
}
```

### 场景 3：WebSocket 消息推送

**问题：** 后台服务需要实时推送消息到前端

**方案：** 服务发布推送事件，WebSocket 服务监听并推送

```java
// 任务服务
public void executeTask(String taskId) {
    try {
        doExecute(taskId);
        
        WebSocketPushEvent event = new WebSocketPushEvent();
        event.setEndPoint("/task/status");
        event.setTopic("task_complete");
        event.setData(Map.of("taskId", taskId, "status", "SUCCESS"));
        EventUtil.publish(event);
    } catch (Exception e) {
        // 发布失败事件
    }
}

// WebSocket 服务
@Component
public class WebSocketPushListener {
    @MolanListener
    public void pushListener(WebSocketPushEvent event) {
        List<WebSocketSession> sessions = 
            socketIndexHolder.getByEndpoint(event.getEndPoint());
        
        for (WebSocketSession session : sessions) {
            pushService.push(session, event.getTopic(), event.getData());
        }
    }
}
```

---

## 核心机制详解

### 1. 单体模式实现

**基于 Spring Event + 内存分发：**

```java
@Component
public class LocalEventPublisher implements MolanEventPublisher {
    
    @Override
    public void publish(Object event) {
        // 1. 获取事件的继承链（支持冒泡）
        Set<Class<?>> hierarchy = EventHierarchyResolver.getHierarchy(event.getClass());
        
        // 2. 找到匹配的监听器
        List<MolanListenerDefinition> allListeners = listenerProcessor.getListeners();
        
        for (Class<?> type : hierarchy) {
            List<MolanListenerDefinition> matched = allListeners.stream()
                .filter(l -> l.getEventType().equals(type))
                .collect(Collectors.toList());
            
            // 3. 按 Group 分组处理
            Map<String, List<MolanListenerDefinition>> grouped = 
                matched.stream().collect(Collectors.groupingBy(
                    l -> l.getGroup() == null ? "" : l.getGroup()
                ));
            
            grouped.forEach((group, list) -> {
                if (group.isEmpty()) {
                    // 广播模式：全部执行
                    list.forEach(l -> execute(l, event));
                } else {
                    // 争抢模式：随机选一个执行
                    MolanListenerDefinition selected = 
                        list.get(ThreadLocalRandom.current().nextInt(list.size()));
                    execute(selected, event);
                }
            });
        }
    }
    
    private void execute(MolanListenerDefinition definition, Object event) {
        // 深度克隆事件（隔离监听器间的影响）
        Object clonedEvent = cloneEvent(event);
        
        if (definition.isAsync()) {
            // 异步执行
            eventExecutor.execute(() -> definition.invoke(clonedEvent));
        } else {
            // 同步执行
            definition.invoke(clonedEvent);
        }
    }
}
```

**特点：**
- ⚡ 纳秒级分发
- 🔒 支持事务一致性
- 📦 事件深度克隆，隔离监听器

### 2. 微服务模式实现

**基于 RabbitMQ + Topic Exchange：**

```java
@Component
public class RabbitMqEventPublisher implements MolanEventPublisher {
    
    @Override
    public void publish(Object event) {
        // 1. 事件类名作为 Exchange 名称
        String exchange = event.getClass().getName();
        
        // 2. 序列化为 JSON
        String json = objectMapper.writeValueAsString(event);
        
        // 3. 发送到 RabbitMQ
        rabbitTemplate.convertAndSend(exchange, "", json);
    }
}

@Component
public class RabbitMqListenerRegistrar {
    
    @PostConstruct
    public void registerListeners() {
        for (MolanListenerDefinition definition : listenerProcessor.getListeners()) {
            
            String exchange = definition.getEventType().getName();
            String queue;
            
            if (definition.getGroup() == null) {
                // 广播模式：匿名队列（每个实例独立）
                queue = UUID.randomUUID().toString();
            } else {
                // 争抢模式：固定队列名（多实例共享）
                queue = definition.getGroup();
            }
            
            // 声明 Exchange
            rabbitAdmin.declareExchange(new FanoutExchange(exchange));
            
            // 声明队列
            rabbitAdmin.declareQueue(new Queue(queue));
            
            // 绑定
            rabbitAdmin.declareBinding(
                BindingBuilder.bind(new Queue(queue))
                    .to(new FanoutExchange(exchange))
            );
            
            // 注册消费者
            registerConsumer(queue, definition);
        }
    }
}
```

**特点：**
- 🌐 跨服务通信
- 💾 消息持久化
- 🔄 自动重试机制
- ⚖️ 负载均衡

### 3. 监听器扫描与注册

```java
@Component
public class MolanListenerProcessor implements BeanPostProcessor {
    
    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        ReflectionUtils.doWithMethods(bean.getClass(), method -> {
            MolanListener annotation = AnnotationUtils.findAnnotation(method, MolanListener.class);
            
            if (annotation != null) {
                // 解析事件类型：优先使用注解指定，否则从方法参数推断
                Class<?> eventType = annotation.value();
                if (eventType == Void.class) {
                    eventType = resolveEventTypeFromMethod(method);
                }
                
                // 校验方法签名
                validateListenerMethod(method, eventType);
                
                // 注册监听器定义
                MolanListenerDefinition definition = new MolanListenerDefinition(
                    bean, 
                    method, 
                    eventType, 
                    annotation.group(), 
                    annotation.async()
                );
                listeners.add(definition);
            }
        });
        return bean;
    }
    
    private Class<?> resolveEventTypeFromMethod(Method method) {
        Parameter[] parameters = method.getParameters();
        if (parameters.length != 1) {
            throw new IllegalArgumentException(
                "监听器方法必须有且仅有一个参数：" + method.getName()
            );
        }
        return parameters[0].getType();
    }
}
```

---

## 配置说明

### 单体模式配置

```yaml
# application.yml
molandev:
  run-mode: single  # 单体模式
```

**线程池配置（自动根据Java版本选择）：**
- **Java 21+**：使用虚拟线程，高性能低资源占用
- **Java <= 21**：普通线程池
  - 核心线程数：5
  - 最大线程数：20
  - 队列容量：100
  - 线程前缀：molan-event-

**无需其他配置，开箱即用！**

### 微服务模式配置

```yaml
# application.yml
molandev:
  run-mode: cloud  # 微服务模式

spring:
  rabbitmq:
    host: localhost
    port: 5672
    username: guest
    password: guest
    virtual-host: /
```

**线程池配置（用于本地监听器执行）：**
- **Java 21+**：使用虚拟线程，高性能低资源占用
- **Java <= 21**：普通线程池
  - 核心线程数：5
  - 最大线程数：20
  - 队列容量：100
  - 线程前缀：molan-event-

**配置 RabbitMQ 即可，无需修改代码！**

---

## 最佳实践

### 1. 事件命名规范

```
{模块}{业务}{动作}Event

示例：
UserLoginEvent          - 用户登录事件
DictChangeEvent         - 字典变更事件
OrderCreatedEvent       - 订单创建事件
TaskCompletedEvent      - 任务完成事件
```

### 2. 事件设计原则

**包含必要信息：**
```java
// ✅ 好的事件设计
@Data
public class OrderCreatedEvent {
    private String orderId;        // 订单ID
    private String userId;         // 用户ID
    private BigDecimal amount;     // 订单金额
    private LocalDateTime createTime;  // 创建时间
}

// ❌ 不好的事件设计
@Data
public class OrderCreatedEvent {
    private String orderId;  // 只有ID，订阅者还要查询数据库
}
```

**避免携带敏感信息：**
```java
// ❌ 不要在事件中传递敏感信息
@Data
public class UserLoginEvent {
    private String password;  // ❌ 密码不应该出现在事件中
    private String idCard;    // ❌ 身份证号不应该出现
}

// ✅ 只传递必要的非敏感信息
@Data
public class UserLoginEvent {
    private String userId;
    private String username;
    private String ipAddress;
}
```

### 3. 监听器设计原则

**职责单一：**
```java
// ✅ 好的监听器设计
@Component
public class UserLoginListener {
    
    @MolanListener
    public void addScore(UserLoginEvent event) {
        scoreService.addScore(event.getUserId(), 10);
    }
    
    @MolanListener
    public void updateStat(UserLoginEvent event) {
        statService.updateLoginCount(event.getUserId());
    }
}

// ❌ 不好的监听器设计
@Component
public class UserLoginListener {
    
    @MolanListener
    public void handleLogin(UserLoginEvent event) {
        scoreService.addScore(...);      // 做了很多事情
        statService.updateStat(...);     // 职责不清晰
        msgService.send(...);            // 难以维护
        cacheService.refresh(...);
    }
}
```

**异常处理：**
```java
@Component
public class UserLoginListener {
    
    @MolanListener
    public void addScore(UserLoginEvent event) {
        try {
            scoreService.addScore(event.getUserId(), 10);
        } catch (Exception e) {
            // 记录日志，但不抛出异常（避免影响其他监听器）
            log.error("增加积分失败：{}", event.getUserId(), e);
            // 可以发送告警通知运维
        }
    }
}
```

**框架层面异常隔离：**

在异步模式下，监听器异常被线程池隔离，不会影响其他监听器：

```java
// LocalEventPublisher.execute() - 异步执行
private void execute(MolanListenerDefinition definition, Object event) {
    Object clonedEvent = cloneEvent(event);
    
    if (definition.isAsync()) {
        // 异常发生在独立线程中，被线程池处理
        eventExecutor.execute(() -> {
            try {
                definition.invoke(clonedEvent);  // 可能抛出异常，但被线程池隔离
            } catch (Exception e) {
                log.error("监听器执行异常", e);
            }
        });
    } else {
        definition.invoke(clonedEvent);
    }
}
```

**异常处理机制：**
- ✅ 异步模式下：监听器异常被框架捕获并记录日志，不影响其他监听器
- ✅ 同步模式下：异常会向上抛出，适用于需要事务一致性的场景
- ✅ 监听器之间完全隔离
- ✅ 异常会被记录到日志中

### 4. 性能优化

**虚拟线程支持：**
```java
// 当运行在 Java 21+ 环境时，事件模块自动使用虚拟线程
// 提供更高的并发性能和更低的资源消耗

// 无需任何代码改动，框架自动适配
@MolanListener
public void onEvent(SomeEvent event) {
    // 在 Java 21+ 上自动使用虚拟线程执行
    // 在 Java <= 21 上使用普通线程池执行
}
```

**避免耗时操作：**
```java
// ❌ 不好的做法
@MolanListener
public void onOrderCreated(OrderCreatedEvent event) {
    invoiceService.generateInvoice(event.getOrderId());  // 耗时操作（5秒）
}

// ✅ 好的做法
@MolanListener
public void onOrderCreated(OrderCreatedEvent event) {
    // 提交到任务队列，异步处理
    taskService.submitInvoiceTask(event.getOrderId());
}
```

**合理使用同步/异步：**
```java
// 异步（默认）- 适合大多数场景
@MolanListener  // async = true（默认）
public void onEvent(SomeEvent event) { }

// 同步 - 只在必要时使用
@MolanListener(async = false)
public void onEvent(SomeEvent event) {
    // 必须在同一事务内执行
}
```

### 5. 兼容 Spring 原生注解

除了 `@MolanListener`，也可以使用 Spring 原生的 `@EventListener`：

```java
@Component
public class DictCacheListener {
    
    // 使用 Spring 原生注解
    @EventListener
    public void onDictChange(DictChangeEvent event) {
        dictCache.remove(event.getCode());
    }
    
    // 或使用 MolanListener 注解
    @MolanListener
    public void onDictChange2(DictChangeEvent event) {
        dictCache.remove(event.getCode());
    }
}
```

**差异：**
- `@EventListener`：仅支持单体模式（进程内）
- `@MolanListener`：支持双模切换（单体/微服务）

---

## 使用场景

### ✅ 适合使用事件驱动

1. **业务解耦** - 核心业务与次要业务解耦
2. **异步处理** - 耗时操作异步执行
3. **一对多通知** - 一个操作触发多个后续动作
4. **跨服务通信** - 微服务间的松耦合通信
5. **可扩展架构** - 后续新增业务无需改原代码

### ❌ 不适合使用事件驱动

1. **同步查询** - 需要立即获取结果，应该用 RPC 调用
2. **强一致性要求** - 必须确保事务原子性，应该用分布式事务
3. **简单直接调用** - 一对一且不会扩展的场景，应该用直接方法调用
4. **实时性要求极高** - 微秒级响应时间，应该用内存队列

---

## 常见问题

### 1. 事件发布后监听器没有执行？

**检查清单：**
- [ ] 监听器类是否标注 `@Component`
- [ ] 方法是否标注 `@MolanListener`
- [ ] 方法参数类型是否正确
- [ ] 方法是否只有一个参数
- [ ] 事件类型是否匹配

### 2. 微服务模式下事件无法跨服务？

**检查清单：**
- [ ] `run-mode` 是否设置为 `cloud`
- [ ] RabbitMQ 配置是否正确
- [ ] RabbitMQ 服务是否启动
- [ ] 事件类是否有无参构造函数
- [ ] 事件类是否可序列化为 JSON

### 3. 监听器执行顺序如何控制？

**答：** 框架不保证监听器的执行顺序，应该设计为互不依赖的独立监听器。

如果确实需要顺序，可以：
- 使用同步执行（`async = false`）
- 在一个监听器中按顺序调用多个方法
- 使用事件链（一个事件处理完发布下一个事件）

### 4. 监听器中的异常会影响其他监听器吗？

**答：** 不会。每个监听器独立执行，某个监听器抛出异常不会影响其他监听器。框架会捕获异常并记录日志。

### 5. 事件对象会被修改吗？

**答：** 不会。框架会深度克隆事件对象，每个监听器拿到的都是独立副本，互不影响。

---

## 总结

**事件驱动的核心价值：**

1. **解耦** - 发布者与订阅者互不依赖
2. **扩展** - 新增业务只需添加监听器
3. **隔离** - 监听器失败不影响主流程
4. **双模** - 单体/微服务无缝切换
5. **性能** - Java 21+ 虚拟线程支持，更高并发性能

**使用建议：**

- ✅ 用于业务解耦和异步处理
- ✅ 用于一对多的通知场景
- ✅ 用于可扩展的架构设计
- ❌ 不用于同步查询和强一致性场景

**快速回顾：**

```java
// 1. 定义事件（普通 POJO）
public class UserLoginEvent {
    private String userId;
}

// 2. 发布事件（一行代码）
EventUtil.publish(new UserLoginEvent(userId));

// 3. 监听事件（一个注解）
@MolanListener
public void onLogin(UserLoginEvent event) {
    // 处理逻辑...
}
```

**Java版本兼容性：**
- **Java 21+**：自动启用虚拟线程，获得更高性能
- **Java <= 21**：使用传统线程池，稳定可靠

就是这么简单！🎉
