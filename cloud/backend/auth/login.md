# 登录策略

MolanDev Cloud 提供了丰富的登录策略配置，用于控制用户登录行为和安全策略。

## 配置方式

登录策略通过 **SysProp** 机制存储在数据库中，支持前端页面动态配置。

### 数据存储

- **表名**：`sys_prop`
- **Namespace**：`user_login_strategy`
- **配置方式**：系统管理 → 系统策略 → 登录策略

::: tip TODO - 登录策略配置页面
**建议截图：** 前端登录策略配置页面，展示所有配置项和说明
:::

### 核心接口

**查询接口：** `POST /sys/strategy/login/info`

**保存接口：** `POST /sys/strategy/login/save`

**权限要求：** `sys:strategy:login:save`

### 配置项说明

| 配置项 | 字段名 | 默认值 | 说明 |
|--------|---------|---------|------|
| 会话过期时间 | sessionExpireMinutes | 30 | 正常 Token 有效期（分钟） |
| 临时会话过期时间 | tempSessionExpireMinutes | 5 | 临时 Token 有效期（分钟） |
| 锁定时间 | lockMinutes | 1440 | 账户锁定时长（分钟） |
| 最大失败次数 | maxFailureTimes | 5 | 密码错误几次后锁定 |
| 失败统计时间窗口 | maxFailureInterval | 24 | 失败次数统计范围（小时） |
| 密码错误通知 | sendMsgWhenErrorLogin | "" | 异常登录通知方式 |
| IP异常通知 | sendMsgWhenErrorIp | "" | IP异常通知方式 |
| 密码过期策略 | loginStrategyWhenExpire | 3 | 1=提示 2=强制 3=禁止 |
| 绑定IP | bindIp | false | 是否绑定IP登录 |
| 允许多端登录 | multiOnline | true | 是否允许同时多端在线 |

### 获取配置

代码中通过 `SysPropUtils` 获取当前配置：

```java
UserLoginStrategy strategy = SysPropUtils.getProps(UserLoginStrategy.class);
int sessionExpire = strategy.getSessionExpireMinutes();
boolean multiOnline = strategy.isMultiOnline();
```

**缓存机制：**
- 配置从数据库加载后缓存
- 配置变更后自动刷新缓存
- 通过 `SysPropsChangedEvent` 事件通知

## 会话管理

### 1. 会话过期时间

**配置项：** `session-expire-minutes`

控制正常 Token 的有效期，默认 30 分钟。

**特性：**
- Token 自动续期（剩余时间 < 50% 时）
- 续期后重置为完整有效期
- 超时后自动退出登录

### 2. 临时会话

**配置项：** `temp-session-expire-minutes`

用于首次登录或密码过期场景，默认 5 分钟。

**使用场景：**
- 用户首次登录（初始密码）
- 密码过期需要立即修改
- 仅能访问修改密码等少数接口

## 多端登录控制

### 配置项

**配置项：** `multi-online`

- `true` - 允许多端同时在线
- `false` - 同一账号只能单端登录（默认）

### 单端登录

当 `multi-online: false` 时：

1. 新登录时踢掉其他端的 Token
2. 被踢出的 Token 标记为 `kickout=1`
3. 被踢出的用户下次请求时提示"账号已在其他地方登录"

**核心逻辑：**
```java
if (!userLoginStrategy.isMultiOnline()) {
    Set<String> oldTokens = tokenStore.getTokensByUserId(userId);
    for (String oldToken : oldTokens) {
        tokenStore.kickout(oldToken);
    }
}
```

### 多端登录

当 `multi-online: true` 时：

- 允许同一账号在多个设备同时登录
- 所有 Token 独立有效
- 每个 Token 独立过期和续期

## 失败锁定策略

### 配置项

- `max-failure-times` - 最大失败次数（默认 5 次）
- `max-failure-interval` - 统计时间窗口（默认 24 小时）

### 锁定机制

在 `max-failure-interval` 时间内，密码错误达到 `max-failure-times` 次后：

1. 自动锁定账户
2. 记录锁定原因和时间
3. 锁定后无法登录
4. 管理员可手动解锁

**解锁方式：**
- 管理员手动解锁
- 到达自动解锁时间后自动解锁

### 失败计数

- 统计时间窗口内的失败次数
- 登录成功后不清零（防止暴力破解）
- 超过时间窗口的失败记录不计入

## 密码过期策略

### 配置项

**配置项：** `login-strategy-when-expire`

密码过期时的登录策略：

| 值 | 策略 | 说明 |
|---|------|------|
| 0 | 禁止登录 | 直接拒绝登录，提示联系管理员 |
| 1 | 强制修改 | 生成临时 Token，强制修改密码后才能正常使用（默认） |
| 2 | 提示修改 | 允许登录，但提示用户及时修改密码 |

### 策略详情

#### 禁止登录（策略 0）

```java
if (passwordExpired && strategy == 0) {
    return JsonResult.failed("您的账户已过期，请联系管理员");
}
```

- 密码过期后完全无法登录
- 适用于高安全要求场景

#### 强制修改（策略 1）

```java
if (passwordExpired && strategy == 1) {
    tokenStore.storeTempToken(token, userDetail, 5);
    loginResult.setForceUpdatePassword(true);
    loginResult.setTempUser(true);
}
```

- 生成 5 分钟临时 Token
- 只能访问修改密码接口
- 修改密码后重新登录

#### 提示修改（策略 2）

```java
if (passwordExpired && strategy == 2) {
    loginResult.setTip("您的账户已过期，请及时修改密码");
}
```

- 正常登录，但显示提示信息
- 不强制修改，允许继续使用
- 适用于低安全要求场景

## 异常登录通知

### 配置项

**配置项：** `send-msg-when-error-login`

异常登录时发送通知，支持：
- `email` - 邮件通知
- `sms` - 短信通知
- `site` - 站内信通知

可配置多个，用逗号分隔。

### 触发场景

#### 1. IP 异常登录

对比最近 3 次登录 IP，如果新 IP 不在其中，触发通知。

**通知内容：**
- 登录账号
- 登录 IP
- 登录时间
- 提示"非常用IP登录"

#### 2. 密码错误

密码验证失败时触发通知。

**通知内容：**
- 登录账号
- 尝试 IP
- 尝试时间
- 提示"登录异常"

### 通知方式

**邮件通知：**
- 发送到用户邮箱
- 使用邮件模板
- 异步发送

**站内信通知：**
- 发送到用户消息中心
- 实时推送
- 可查看历史通知

## 首次登录策略

### 初始密码检测

系统检测 `password_update_time` 字段：
- 为空表示首次登录（初始密码）
- 有值表示已修改过密码

### 处理策略

根据 `user.strategy.force-update-password` 配置：

**强制修改（默认）：**
```java
if (firstLogin && forceUpdate) {
    tokenStore.storeTempToken(token, userDetail, 5);
    loginResult.setForceUpdatePassword(true);
    loginResult.setTip("您的密码为初始密码，请修改密码后登录系统");
}
```

**仅提示：**
```java
if (firstLogin && !forceUpdate) {
    loginResult.setTip("您的密码为初始密码，请及时修改");
}
```

## 登录日志

### 记录内容

每次登录尝试都会记录到 `sys_login_log` 表：

- 登录账号
- 用户姓名
- 登录类型（账号/手机/邮箱）
- 登录状态（成功/失败/锁定/禁用等）
- IP 地址
- 浏览器信息
- 操作系统
- 登录时间
- 失败原因

### 登录状态

| 状态 | 说明 |
|------|------|
| SUCCESS | 登录成功 |
| PASSWRONG | 密码错误 |
| LOCKED | 账号锁定 |
| DISABLED | 账号禁用 |
| EXPIRED | 密码过期 |

## 最佳实践

### 1. 会话时间设置

- 内部系统：30-60 分钟
- 外部系统：15-30 分钟
- 高安全系统：10-15 分钟

### 2. 多端登录控制

- 内部办公系统：允许多端
- 客户系统：禁止多端
- 根据实际场景选择

### 3. 失败锁定

- 建议设置 3-5 次失败锁定
- 时间窗口设置 12-24 小时
- 提供管理员快速解锁功能

### 4. 密码过期策略

- 高安全系统：强制修改
- 一般系统：提示修改
- 根据合规要求设置过期天数

### 5. 异常通知

- 生产环境建议开启
- 至少配置邮件通知
- 重要账号增加短信通知

## 总结

MolanDev Cloud 的登录策略提供了：

- ✅ 灵活的会话管理
- ✅ 多端登录控制
- ✅ 失败锁定保护
- ✅ 密码过期强制
- ✅ 异常登录通知
- ✅ 完整的登录日志
