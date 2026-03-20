# 消息服务

## 解决的问题

业务系统需要向用户发送各种消息通知，如：

- 📧 **邮件通知** - 注册验证、密码重置、审批通知
- 📱 **短信通知** - 验证码、订单状态、支付提醒
- 💬 **站内信** - 系统通知、待办提醒、消息推送

传统做法存在以下问题：

- ❌ **代码重复** - 每处发送都要写 SMTP 配置、短信 API 调用
- ❌ **格式不统一** - 不同开发人员写的邮件模板风格各异
- ❌ **难以管理** - 修改邮件内容需要改代码并重新部署
- ❌ **无法追踪** - 不知道消息是否发送成功，无法查看发送记录

MolanDev Backend 提供了**统一的消息服务**，通过模板管理和事件驱动实现**规范化、可视化**的消息发送。

## 核心特性

### ✅ 多渠道支持
- **邮件（Email）** - 支持纯文本和 HTML
- **短信（SMS）** - 预留接口，待对接短信服务商
- **站内信（Site）** - 系统内消息通知

### ✅ 模板管理
- 可视化管理消息模板
- 支持 Velocity 模板语法
- 动态参数替换
- 修改即生效，无需重启

### ✅ 发送方式
- **同步发送** - FeignClient 调用，可感知结果
- **异步发送** - 事件驱动，不阻塞业务

### ✅ 发送记录
- 记录所有发送历史
- 查看发送状态（成功/失败）
- 失败原因追踪

## 快速开始

### 1. 邮件配置

```yaml
# application.yml
spring:
  mail:
    host: smtp.qq.com
    port: 587
    username: your-email@qq.com
    password: your-auth-code  # QQ邮箱授权码
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
```

### 2. 创建消息模板

在系统管理 → 消息管理 → 消息模板：

**模板信息：**
- 模板编码：`USER_REGISTER`（唯一标识）
- 模板名称：用户注册欢迎邮件
- 消息类型：email
- 内容类型：HTML

**模板内容：**
```html
<h1>欢迎注册 MolanDev Cloud</h1>
<p>亲爱的 ${realName}：</p>
<p>感谢您注册我们的平台！</p>
<p>您的账号：${account}</p>
<p>请妥善保管您的登录信息。</p>
<br>
<p>MolanDev Cloud 团队</p>
<p>${createTime}</p>
```

**参数说明：**
- `${realName}` - 用户姓名
- `${account}` - 用户账号
- `${createTime}` - 注册时间

保存后模板即可使用。

::: tip TODO - 消息模板管理界面
**建议截图：** 模板列表和模板编辑页面，展示 Velocity 语法和参数说明
:::

### 3. 发送消息

#### 方式一：同步发送（FeignClient）

```java
@RestController
public class UserController {
    
    @Autowired
    private MsgSendApi msgSendApi;
    
    @PostMapping("/register")
    public JsonResult<Void> register(UserDTO user) {
        // 保存用户
        userService.save(user);
        
        // 发送欢迎邮件
        MsgSendEvent event = new MsgSendEvent();
        event.setMsgType(MsgTypes.email);
        event.setToUser(user.getRealName());
        event.setToAddress(user.getEmail());
        event.setTitle("欢迎注册 MolanDev Cloud");
        event.setTemplateCode("USER_REGISTER");
        event.setParams(Map.of(
            "realName", user.getRealName(),
            "account", user.getAccount(),
            "createTime", DateUtils.now()
        ));
        
        // 同步发送（会等待发送完成）
        msgSendApi.send(event);
        
        return JsonResult.success();
    }
}
```

#### 方式二：异步发送（事件驱动）

```java
@PostMapping("/register")
public JsonResult<Void> register(UserDTO user) {
    // 保存用户
    userService.save(user);
    
    // 构建消息事件
    MsgSendEvent event = new MsgSendEvent();
    event.setMsgType(MsgTypes.email);
    event.setToAddress(user.getEmail());
    event.setTitle("欢迎注册");
    event.setTemplateCode("USER_REGISTER");
    event.setParams(Map.of(
        "realName", user.getRealName(),
        "account", user.getAccount()
    ));
    
    // 异步发送（立即返回，不等待）
    EventUtil.publish(event);
    
    return JsonResult.success();
}
```

**两种方式对比：**

| 特性 | 同步发送 | 异步发送 |
|------|---------|---------|
| 发送方式 | FeignClient | 事件驱动 |
| 是否阻塞 | 是 | 否 |
| 能否感知结果 | 是 | 否 |
| 响应速度 | 慢 | 快 |
| 适用场景 | 验证码等重要通知 | 普通通知 |

## MsgSendEvent 参数说明

```java
public class MsgSendEvent {
    
    /**
     * 消息类型
     * email - 邮件
     * sms - 短信
     * site - 站内信
     */
    private String msgType;
    
    /**
     * 收件人姓名（仅用于记录，不影响发送）
     */
    private String toUser;
    
    /**
     * 收件地址
     * email: 邮箱地址
     * sms: 手机号
     * site: 用户ID
     */
    private String toAddress;
    
    /**
     * 模板编码（必填）
     */
    private String templateCode;
    
    /**
     * 消息标题
     * email: 邮件主题
     * site: 站内信标题
     * sms: 不需要
     */
    private String title;
    
    /**
     * 模板参数
     */
    private Map<String, Object> params;
}
```

## 消息类型

### 1. 邮件（Email）

```java
MsgSendEvent event = new MsgSendEvent();
event.setMsgType(MsgTypes.email);
event.setToUser("张三");
event.setToAddress("zhangsan@example.com");
event.setTitle("密码重置通知");
event.setTemplateCode("PASSWORD_RESET");
event.setParams(Map.of(
    "realName", "张三",
    "resetLink", "https://example.com/reset?token=xxx",
    "expireTime", "2小时"
));

EventUtil.publish(event);
```

**模板类型：**
- **TEXT** - 纯文本邮件
- **HTML** - HTML 邮件（支持富文本）

### 2. 短信（SMS）

```java
MsgSendEvent event = new MsgSendEvent();
event.setMsgType(MsgTypes.sms);
event.setToAddress("13800138000");
event.setTemplateCode("SMS_VERIFY_CODE");
event.setParams(Map.of(
    "code", "123456",
    "expireTime", "5"
));

EventUtil.publish(event);
```

::: warning 注意
短信功能需要对接短信服务商（如阿里云、腾讯云），当前为预留接口。
:::

### 3. 站内信（Site）

```java
MsgSendEvent event = new MsgSendEvent();
event.setMsgType(MsgTypes.site);
event.setToAddress(userId);  // 用户ID
event.setTitle("审批通知");
event.setTemplateCode("APPROVAL_NOTIFY");
event.setParams(Map.of(
    "approver", "李四",
    "bizType", "请假申请",
    "result", "已通过"
));

EventUtil.publish(event);
```

**站内信特性：**
- ✅ **消息持久化** - 存储在 `msg_site_message` 表
- ✅ **实时推送** - 通过 WebSocket 即时通知在线用户
- ✅ **状态管理** - 支持已读/未读状态
- ✅ **消息管理** - 支持查看、删除
- ✅ **桌面通知** - 前端收到消息弹出浏览器通知

#### WebSocket 实时推送

站内信发送后会通过 WebSocket 实时推送给在线用户：

**后端推送逻辑：**
```java
@Service
public class SiteMsgService {
    @Autowired
    WebSocketPushService webSocketPushService;
    
    public void sendMsg(SiteMsg siteMsg) {
        // 1. 保存到数据库
        msgSiteMessageService.save(entity);
        
        // 2. 实时推送给目标用户
        webSocketPushService.push(
            Map.of(
                "title", siteMsg.getTitle(),
                "summary", siteMsg.getSummary()
            ),
            Map.of("userId", siteMsg.getUserId())  // 筛选指定用户
        );
    }
}
```

**WebSocket 端点：**
- 连接地址：`/api/msg/websocket/site`
- 需携带 token：`?access_token=xxx`

**前端接收示例：**
```javascript
// 建立连接
const socket = new WebSocket('/api/msg/websocket/site?access_token=' + token)

// 接收消息
socket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    // data = { topic: "default", data: { title: "xxx", summary: "xxx" } }
    
    // 显示浏览器通知
    ElNotification({
        title: data.data.title,
        message: data.data.summary
    })
}
```

**推送流程：**
1. 业务发送站内信 → 保存数据库
2. 触发 WebSocket 推送事件
3. 根据 userId 筛选目标用户的 WebSocket 连接
4. 推送消息到前端
5. 前端弹出浏览器通知

## 模板语法

使用 Velocity 模板引擎：

### 1. 变量输出

```
${变量名}
```

**示例：**
```
亲爱的 ${realName}，您的订单 ${orderNo} 已发货。
```

### 2. 条件判断

```
#if (${condition})
  ...
#elseif (${condition2})
  ...
#else
  ...
#end
```

**示例：**
```
#if (${amount} > 1000)
  您是我们的VIP客户，享受9折优惠。
#else
  欢迎您的购买！
#end
```

### 3. 循环遍历

```
#foreach ($item in ${list})
  $item
#end
```

**示例：**
```html
<ul>
#foreach ($order in ${orders})
  <li>订单号：${order.no}，金额：${order.amount}</li>
#end
</ul>
```

### 4. 日期格式化

```java
// 传参时格式化
params.put("createTime", DateUtils.format(date, "yyyy-MM-dd HH:mm:ss"));
```

## 使用场景

### 1. 用户注册

```java
@PostMapping("/register")
public JsonResult<Void> register(UserDTO user) {
    userService.save(user);
    
    // 发送注册成功邮件
    MsgSendEvent event = new MsgSendEvent();
    event.setMsgType(MsgTypes.email);
    event.setToAddress(user.getEmail());
    event.setTitle("注册成功");
    event.setTemplateCode("USER_REGISTER");
    event.setParams(Map.of(
        "realName", user.getRealName(),
        "account", user.getAccount()
    ));
    EventUtil.publish(event);
    
    return JsonResult.success();
}
```

### 2. 密码过期提醒

```java
@TaskSchedule("UserExpireNotifyJob")
public void notifyExpire() {
    // 查询即将过期的用户
    List<UserEntity> users = userService.findUsersSoonExpire();
    
    for (UserEntity user : users) {
        MsgSendEvent event = new MsgSendEvent();
        event.setMsgType(MsgTypes.email);
        event.setToAddress(user.getEmail());
        event.setTitle("密码即将过期提醒");
        event.setTemplateCode("PASSWORD_EXPIRE_NOTIFY");
        event.setParams(Map.of(
            "realName", user.getRealName(),
            "expireDays", calculateExpireDays(user)
        ));
        EventUtil.publish(event);
    }
}
```

### 3. 任务失败通知

```java
public void onTaskError(TaskTrigger trigger, Exception e) {
    if (StringUtils.isNotEmpty(trigger.getAdminEmail())) {
        MsgSendEvent event = new MsgSendEvent();
        event.setMsgType(MsgTypes.email);
        event.setToAddress(trigger.getAdminEmail());
        event.setTitle("任务执行失败：" + trigger.getTaskName());
        event.setTemplateCode("TASK_ERROR_NOTIFY");
        event.setParams(Map.of(
            "taskName", trigger.getTaskName(),
            "errorMsg", e.getMessage(),
            "adminName", trigger.getAdminName()
        ));
        EventUtil.publish(event);
    }
}
```

### 4. 审批通知

```java
@PostMapping("/approve")
public JsonResult<Void> approve(String approvalId, boolean pass) {
    Approval approval = approvalService.getById(approvalId);
    approval.setStatus(pass ? "PASSED" : "REJECTED");
    approvalService.updateById(approval);
    
    // 发送站内信通知申请人
    MsgSendEvent event = new MsgSendEvent();
    event.setMsgType(MsgTypes.site);
    event.setToAddress(approval.getApplicantId());
    event.setTitle("审批结果通知");
    event.setTemplateCode("APPROVAL_RESULT");
    event.setParams(Map.of(
        "bizType", approval.getBizType(),
        "result", pass ? "已通过" : "已拒绝",
        "approver", AuthUtils.getCurrentUser().getRealName()
    ));
    EventUtil.publish(event);
    
    return JsonResult.success();
}
```

## 实现原理

### 1. WebSocket 推送架构

**核心组件：**

```java
// WebSocket 定义接口
public interface WebSocketDefinition {
    String getEndpoint();      // WebSocket 端点路径
    String defaultTopic();     // 默认主题
    boolean primary();         // 是否为主端点
}

// 站内信端点定义
@Component
public class SiteSocketDefinition implements WebSocketDefinition {
    private final String endpoint = "/msg/websocket/site";
}
```

**推送服务：**
```java
@Service
public class WebSocketPushService {
    
    // 推送消息（带过滤条件）
    public void push(Object data, Map<String, String> filterParams) {
        // 发布推送事件（事件驱动）
        WebSocketPushEvent event = new WebSocketPushEvent();
        event.setData(data);
        event.setParams(filterParams);  // userId 等过滤条件
        EventUtil.publish(event);
    }
    
    // 监听推送事件
    @MolanListener
    public void pushListener(WebSocketPushEvent event) {
        // 根据过滤条件获取目标 WebSocket 连接
        List<WebSocketSession> sessions = socketIndexHolder.getByParams(
            event.getEndPoint(), 
            event.getParams()
        );
        
        // 推送消息到目标连接
        for (WebSocketSession session : sessions) {
            session.sendMessage(new TextMessage(JSONUtils.toJsonString(data)));
        }
    }
}
```

**连接管理：**
- 用户建立 WebSocket 连接时，记录连接与用户 ID 的映射关系
- 推送时根据 userId 筛选目标连接
- 支持按订阅主题（topic）过滤消息

### 2. 消息发送流程

```java
@Component
public class MsgSendService {
    
    @EventListener
    public void listen(MsgSendEvent event) {
        try {
            send(event);
        } catch (Exception e) {
            log.error("发送消息失败", e);
        }
    }
    
    public void send(MsgSendEvent event) {
        // 1. 查询模板
        MsgTemplateEntity template = templateService.getByCode(event.getTemplateCode());
        
        // 2. 渲染模板（Velocity）
        String content = TemplateUtil.convert(template.getContent(), event.getParams());
        
        // 3. 发送消息
        switch (event.getMsgType()) {
            case MsgTypes.email -> emailService.send(content);
            case MsgTypes.sms -> smsService.send(content);
            case MsgTypes.site -> {
                // 保存站内信
                siteService.send(content);
                // WebSocket 推送
                webSocketPushService.push(data, filterParams);
            }
        }
        
        // 4. 记录发送结果
        recordService.save(event, status, errorMsg);
    }
}
```

### 3. 邮件发送

## 发送记录

### 记录内容

每条消息发送都会记录到 `msg_record` 表：

| 字段 | 说明 |
|------|------|
| type | 消息类型（email/sms/site） |
| toUser | 收件人姓名 |
| toAddress | 收件地址 |
| templateCode | 模板编码 |
| title | 消息标题 |
| content | 渲染后的内容 |
| status | 发送状态（success/fail） |
| errorMsg | 失败原因 |
| createTime | 发送时间 |

### 查询界面

在消息管理 → 发送记录：

**筛选条件：**
- 消息类型
- 发送状态
- 时间范围

**显示信息：**
- 发送时间、收件人、类型、状态
- 消息内容（可展开查看）
- 失败原因（失败时）

::: tip TODO - 发送记录界面
**建议截图：** 发送记录列表，展示成功和失败的消息
:::

## 最佳实践

### 1. WebSocket 连接管理

**前端：**
```javascript
let socket = null
let reconnectTimer = null

function connectWebSocket() {
    socket = new WebSocket('/api/msg/websocket/site?access_token=' + token)
    
    socket.onopen = () => {
        console.log('WebSocket 连接成功')
        // 清除重连定时器
        if (reconnectTimer) {
            clearTimeout(reconnectTimer)
            reconnectTimer = null
        }
    }
    
    socket.onclose = () => {
        console.log('WebSocket 连接关闭')
        // 5秒后重连
        reconnectTimer = setTimeout(() => {
            connectWebSocket()
        }, 5000)
    }
    
    socket.onerror = (error) => {
        console.error('WebSocket 错误:', error)
    }
}

// 组件卸载时关闭连接
onUnmounted(() => {
    if (socket) {
        socket.close()
    }
    if (reconnectTimer) {
        clearTimeout(reconnectTimer)
    }
})
```

**后端：**
```java
// 推送时指定目标用户
webSocketPushService.push(
    data,
    Map.of("userId", targetUserId)  // 只推送给指定用户
);

// 广播给所有连接
webSocketPushService.push(data);  // 不指定 filterParams
```

### 2. 模板编码规范

```
模块_场景_类型

示例：
USER_REGISTER_EMAIL     - 用户注册邮件
USER_RESET_PASSWORD     - 密码重置
ORDER_PAID_SMS          - 订单支付短信
TASK_ERROR_EMAIL        - 任务失败邮件
APPROVAL_RESULT_SITE    - 审批结果站内信
```

### 3. 选择发送方式

```java
// ✅ 重要通知：使用同步发送
msgSendApi.send(event);  // 可感知发送结果

// ✅ 普通通知：使用异步发送
EventUtil.publish(event);  // 不阻塞业务

// ✅ 站内信：自动 WebSocket 推送
// 发送后会自动推送给在线用户，无需额外操作
EventUtil.publish(siteMessageEvent);
```

### 4. 错误处理

```java
try {
    msgSendApi.send(event);
} catch (Exception e) {
    log.error("发送邮件失败", e);
    // 记录到数据库或重试队列
}
```

### 5. 批量发送

```java
// ❌ 不推荐：循环发送（太慢）
for (User user : users) {
    msgSendApi.send(buildEvent(user));
}

// ✅ 推荐：异步批量发送
for (User user : users) {
    EventUtil.publish(buildEvent(user));
}
```

### 6. 测试邮件配置

```java
@Test
public void testEmailConfig() {
    MsgSendEvent event = new MsgSendEvent();
    event.setMsgType(MsgTypes.email);
    event.setToAddress("your-email@example.com");
    event.setTitle("测试邮件");
    event.setTemplateCode("TEST_EMAIL");
    
    msgSendApi.send(event);
}
```

## 总结

MolanDev Backend 的消息服务提供了：

- ✅ **多渠道** - 邮件、短信、站内信统一管理
- ✅ **模板化** - Velocity 模板，可视化编辑
- ✅ **两种方式** - 同步（FeignClient）和异步（事件驱动）
- ✅ **实时推送** - WebSocket 即时通知在线用户
- ✅ **可追踪** - 完整的发送记录和状态
- ✅ **易扩展** - 新增渠道只需实现接口

通过消息服务，系统的通知功能变得规范化、可管理、可追踪，特别是站内信的 **WebSocket 实时推送**，让用户能够第一时间收到通知，大大提升了用户体验和运维效率。
