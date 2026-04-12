# Event 事件发布与订阅

`molandev-event` 是一个轻量级的事件驱动模块，遵循"单体/微服务无缝切换"的设计哲学。提供统一的 API，单体模式下使用纯内存分发，微服务模式自动切换为 RabbitMQ 跨服务通信。

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

**使用事件驱动后：**

```java
// ✅ 发布者 - 只关注核心逻辑
public void login(User user) {
    saveLoginLog(user);
    EventUtil.publish(new UserLoginEvent(user));
}

// ✅ 订阅者 - 各自处理自己的业务
@Component
public class ScoreService {
    @MolanListener
    public void onUserLogin(UserLoginEvent event) {
        addScore(event.getUser());
    }
}
```

**优势：**
- ✅ **解耦** - 发布者不需要知道订阅者
- ✅ **扩展** - 新增业务只需添加监听器
- ✅ **隔离** - 某个监听器失败不影响其他

## 核心特性

### 1. API 极致精简

```java
EventUtil.publish(event);    // 发布事件
@MolanListener               // 监听事件
public void onEvent(SomeEvent event) { }
```

### 2. 类型安全

无需字符串 Topic，编译期检查：

```java
// ❌ 传统消息队列
mqTemplate.send("user_login_topic", data);  // 字符串容易拼错

// ✅ 类型安全的事件
EventUtil.publish(new UserLoginEvent(user));  // 编译期检查
```

### 3. 双模无缝切换

| 特性 | 单体模式 (`run-mode: single`) | 微服务模式 (`run-mode: cloud`) |
|------|-------------------------------|--------------------------------|
| **通信方式** | Spring Event 内存分发 | RabbitMQ 跨服务通信 |
| **性能** | ⚡ 纳秒级 | 🔄 毫秒级 |
| **代码** | 完全相同，无需修改 | 完全相同，无需修改 |

### 4. 广播 vs 争抢

**广播模式（默认）：** 所有监听器都会收到事件

```java
@MolanListener
public void listener1(UserLoginEvent event) { }  // 会执行

@MolanListener
public void listener2(UserLoginEvent event) { }  // 也会执行
```

**争抢模式（指定 group）：** 同一 group 内只有一个监听器执行

```java
@MolanListener(group = "score-group")
public void listener1(UserLoginEvent event) { }  // 只会执行一个

@MolanListener(group = "score-group")
public void listener2(UserLoginEvent event) { }  // 另一个不执行
```

### 5. 同步 vs 异步

**异步执行（默认）：** 不阻塞发布者，异常隔离

```java
@MolanListener  // async = true（默认）
public void onEvent(SomeEvent event) {
    // 在独立线程池执行
    // Java 21+：自动使用虚拟线程
    // Java <= 21：普通线程池（core=5, max=20）
}
```

**同步执行：** 在发布者线程执行，适用于需要事务一致性的场景

```java
@MolanListener(async = false)
public void onEvent(SomeEvent event) {
    // 在发布者线程执行，事务内生效
}
```

### 6. 事件冒泡

支持事件继承体系，发布子类事件，父类监听器也会触发：

```java
public class BaseEvent { }
public class ChildEvent extends BaseEvent { }

@MolanListener
public void onBase(BaseEvent e) { }

EventUtil.publish(new ChildEvent());  // onBase 也会被触发
```

## 快速开始

### 1. 引入依赖

```xml
<dependency>
    <groupId>com.molandev</groupId>
    <artifactId>molandev-event</artifactId>
    <version>${molandev.version}</version>
</dependency>
```

### 2. 定义事件对象

普通 POJO 即可，无需继承任何基类：

```java
public class UserLoginEvent {
    private String username;
    private String ipAddress;
    // 构造函数、getter、setter
}
```

### 3. 发布事件

```java
EventUtil.publish(new UserLoginEvent("admin", "192.168.1.100"));
```

### 4. 监听事件

```java
@Component
public class ScoreService {

    // 广播模式：所有监听器都会收到
    @MolanListener
    public void onLoginAddScore(UserLoginEvent event) {
        System.out.println("为用户增加积分: " + event.getUsername());
    }

    // 争抢模式：同组只有一个执行
    @MolanListener(group = "score-cluster")
    public void onLoginSingleProcess(UserLoginEvent event) {
        // 只会由一个实例执行
    }

    // 方法参数类型自动推断
    @MolanListener
    public void onLoginAutoInferred(UserLoginEvent event) {
        // 框架自动根据方法参数类型推断监听的事件
    }
}
```

## 项目中的实际应用

### 场景一：任务变更后重新调度

**代码位置：** `molandev-base/.../task/service/TaskManageService.java`

任务增删改时，发布 `TaskUpdateEvent`，调度器监听并更新内存中的任务队列：

```java
// 发布者 - 任务管理
public void saveJob(TaskScheduleEntity job) {
    taskScheduleService.save(job);
    EventUtil.publish(new TaskUpdateEvent(job.getId(), TaskConstants.TYPE_ADD));
}

public void updateJob(TaskScheduleEntity job) {
    taskScheduleService.updateById(job);
    EventUtil.publish(new TaskUpdateEvent(job.getId(), TaskConstants.TYPE_UPDATE));
}

// 监听者 - 同一个类中
@MolanListener
public void handleJobChange(TaskUpdateEvent event) throws Exception {
    String type = event.getType();
    String jobId = event.getJobId();
    
    // 先移除旧任务
    if (TaskConstants.TYPE_DELETE.equals(type) || TaskConstants.TYPE_UPDATE.equals(type)) {
        taskScheduler.removeJob(jobId);
    }
    // 再添加新任务
    if (TaskConstants.TYPE_ADD.equals(type) || TaskConstants.TYPE_UPDATE.equals(type)) {
        TaskScheduleEntity job = taskScheduleService.getById(jobId);
        if (job != null && !job.getDisabled()) {
            addJobToScheduler(job);
        }
    }
}
```

> 📖 **详细说明** → [任务管理文档](/cloud/backend/task)

### 场景二：字典变更后刷新缓存

**代码位置：** `molandev-base/.../controller/SysDictController.java`

字典增删改时，发布 `DictChangeEvent`，各服务监听并清理缓存：

```java
// 发布者 - 字典管理
@PostMapping("/add")
public JsonResult<String> add(@RequestBody SysDictVo dictVo) {
    sysDictService.save(dictVo);
    EventUtil.publish(new DictChangeEvent(dictVo.getDictCode()));
    return JsonResult.success(dictVo.getId());
}

// 监听者 - 系统服务
@Component
public class SysDictCacheListener {
    @MolanListener
    public void onDictChange(DictChangeEvent event) {
        dictItemMap.remove(event.getCode());
        log.info("清理字典缓存：{}", event.getCode());
    }
}
```

> 📖 **详细说明** → [字典管理文档](/cloud/backend/dict)

### 场景三：登录异常通知

**代码位置：** `molandev-base/.../auth/service/LoginService.java`

异常登录时，发布 `MsgSendEvent` 触发邮件/短信通知：

```java
// 发布者 - 登录服务
MsgSendEvent event = new MsgSendEvent();
event.setToAddress(email);
event.setTitle("非常用IP登录提醒");
event.setTemplateCode(templateCode);
event.setMsgType(MsgTypes.email);
event.setParams(params.toMap());
EventUtil.publish(event);

// 监听者 - 消息服务
@Component
public class MsgSendListener {
    @MolanListener
    public void onMsgSend(MsgSendEvent event) {
        msgService.send(event);  // 发送邮件/短信/站内信
    }
}
```

> 📖 **详细说明** → [登录策略文档](/cloud/backend/auth/login)

## 项目中使用的事件类型

| 事件类 | 触发场景 | 监听处理 | 代码位置 |
|--------|---------|---------|----------|
| `TaskUpdateEvent` | 任务增删改、启用/禁用 | 同步更新调度器中的任务队列 | `molandev-base/.../task/` |
| `DictChangeEvent` | 字典增删改 | 刷新字典缓存 | `molandev-apis/.../dict/` |
| `SysPropsChangedEvent` | 系统策略保存 | 刷新策略配置缓存 | `molandev-apis/.../props/` |
| `MsgSendEvent` | 任务失败通知、登录异常提醒 | 发送邮件/短信/站内信 | `molandev-apis/.../msg/` |

## 配置说明

### 单体模式

```yaml
molandev:
  run-mode: single  # 单体模式，纯内存分发
  lock:
    type: memory    # 单机用内存锁
```

无需其他配置，开箱即用。

### 微服务模式

```yaml
molandev:
  run-mode: cloud   # 微服务模式，RabbitMQ 分发

spring:
  rabbitmq:
    host: localhost
    port: 5672
    username: guest
    password: guest
```

配置 RabbitMQ 即可，无需修改代码。

## 最佳实践

### 事件命名规范

```
{模块}{业务}{动作}Event

示例：
UserLoginEvent          - 用户登录事件
DictChangeEvent         - 字典变更事件
OrderCreatedEvent       - 订单创建事件
TaskCompletedEvent      - 任务完成事件
```

### 事件设计原则

**包含必要信息，避免订阅者二次查询：**

```java
// ✅ 好的事件设计
@Data
public class OrderCreatedEvent {
    private String orderId;
    private String userId;
    private BigDecimal amount;
    private LocalDateTime createTime;
}

// ❌ 不好的事件设计
@Data
public class OrderCreatedEvent {
    private String orderId;  // 只有ID，订阅者还要查询数据库
}
```

### 监听器设计原则

**职责单一，异常不抛出：**

```java
@Component
public class UserLoginListener {

    @MolanListener
    public void addScore(UserLoginEvent event) {
        try {
            scoreService.addScore(event.getUserId(), 10);
        } catch (Exception e) {
            // 记录日志，不抛出异常（避免影响其他监听器）
            log.error("增加积分失败：{}", event.getUserId(), e);
        }
    }
}
```

## 常见问题

### 事件发布后监听器没有执行？

**检查清单：**
- [ ] 监听器类是否标注 `@Component`
- [ ] 方法是否标注 `@MolanListener`
- [ ] 方法参数类型是否正确
- [ ] 方法是否只有一个参数
- [ ] 事件类型是否匹配

### 监听器执行顺序如何控制？

框架不保证监听器的执行顺序。如果确实需要顺序，可以：
- 使用同步执行（`async = false`）
- 在一个监听器中按顺序调用多个方法
- 使用事件链（一个事件处理完发布下一个事件）

### 监听器中的异常会影响其他监听器吗？

**不会。** 异步模式下，监听器异常被框架捕获并记录日志，不影响其他监听器。同步模式下异常会向上抛出，适用于需要事务一致性的场景。

### 事件对象会被修改吗？

**不会。** 框架会深度克隆事件对象，每个监听器拿到的都是独立副本，互不影响。

## 总结

**事件驱动的核心价值：**

- ✅ **解耦** - 发布者与订阅者互不依赖
- ✅ **扩展** - 新增业务只需添加监听器
- ✅ **隔离** - 监听器失败不影响主流程
- ✅ **双模** - 单体/微服务无缝切换
- ✅ **性能** - Java 21+ 虚拟线程支持
