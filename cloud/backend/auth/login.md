# 登录策略

MolanDev Backend 提供了丰富的登录策略配置，用于控制用户登录行为和安全策略。

## 配置方式

登录策略通过 **SysProp** 机制存储在数据库中，支持前端页面动态配置。

### 数据存储

- **表名**：`sys_prop`
- **Namespace**：`user_login_strategy`
- **配置方式**：系统管理 → 系统策略 → 登录策略

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

## 登录流程

### 登录接口

**接口：** `POST /sys/login`

**参数：**
| 参数 | 说明 |
|------|------|
| account | 账号/手机号/邮箱 |
| password | 密码（RSA 加密传输，`@EncryptedParam` 自动解密） |
| imgId | 验证码ID |
| imgCode | 验证码 |

**验证码：**
- 通过 `AuthServerProperties` 配置是否启用
- 验证码缓存 3 分钟，使用后立即删除
- 配置前缀：`molandev.security.server.captcha`

### 登录逻辑

`LoginService.doLogin()` 执行完整的登录流程：

```
1. 参数校验
   ↓
2. 查询用户详情（getUserDetail）
   ↓ 用户不存在 → 返回"用户名或密码错误"
3. 密码验证
   ↓ 密码错误 → 记录日志 + 检查锁定 + 发送通知 → 返回错误
4. 锁定状态检查
   ↓ 已锁定且未到解锁时间 → 返回"用户已被锁定"
   ↓ 已锁定但已到解锁时间 → 自动解锁
5. 禁用状态检查
   ↓ 已禁用 → 返回"用户已被禁用"
6. 密码过期处理（handlePasswordExpiration）
7. 首次登录处理（handleFirstLogin）
8. 多端登录处理（handleMultiLogin）
9. 存储 Token
10. IP 异常检测 + 通知
11. 记录登录日志
```

### 登录结果

`LoginResult` 返回以下字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| accessToken | String | 登录成功后的 Token |
| tempUser | boolean | 是否为临时用户（需要修改密码） |
| forceUpdatePassword | boolean | 是否强制修改密码 |
| tip | String | 提示信息 |

## 会话管理

### 1. 会话过期时间

**配置项：** `sessionExpireMinutes`

控制正常 Token 的有效期，默认 30 分钟。

**特性：**
- Token 自动续期（剩余时间 < 50% 时）
- 续期后重置为完整有效期
- 同时续期 Token 缓存和权限码缓存
- 超时后自动退出登录

### 2. 临时会话

**配置项：** `tempSessionExpireMinutes`

用于首次登录或密码过期场景，默认 5 分钟。

**使用场景：**
- 用户首次登录（初始密码）
- 密码过期需要立即修改
- 仅能访问修改密码等少数接口

**Token 存储：**
```java
tokenStore.storeTempToken(token, userDetail, strategy.getTempSessionExpireMinutes());
```

临时 Token 的 `UserSessionObj.temp` 字段标记为 1，网关/Filter 会限制其只能访问 `tempUris` 配置的路径。

## 多端登录控制

### 配置项

**配置项：** `multiOnline`

- `true` - 允许多端同时在线（默认）
- `false` - 同一账号只能单端登录

### 单端登录

当 `multiOnline: false` 时：

1. 新登录时踢掉其他端的 Token
2. 被踢出的 Token 标记为 `kickout=1`
3. 被踢出的用户下次请求时提示"账号已在其他地方登录"

**核心逻辑：**
```java
private void handleMultiLogin(SysUserDetail userDetail, UserLoginStrategy strategy) {
    if (!strategy.isMultiOnline()) {
        Set<String> tokensByUserId = tokenStore.getTokensByUserId(userDetail.getId());
        if (!tokensByUserId.isEmpty()) {
            for (String s : tokensByUserId) {
                tokenStore.kickout(s);
            }
        }
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

- `maxFailureTimes` - 最大失败次数（默认 5 次）
- `maxFailureInterval` - 统计时间窗口（默认 24 小时）

### 锁定机制

在 `maxFailureInterval` 小时内，密码错误达到 `maxFailureTimes` 次后：

1. 自动锁定账户
2. 记录锁定原因和时间
3. 锁定后无法登录
4. 管理员可手动解锁

**解锁方式：**
- 管理员手动解锁
- 到达自动解锁时间后自动解锁

### 失败计数

- 统计时间窗口内的失败次数（查询 `sys_login_log` 表中 `status=passwrong` 的记录数）
- 登录成功后不清零（防止暴力破解）
- 超过时间窗口的失败记录不计入

**核心逻辑：**
```java
private void checkAndLockAccountIfNecessary(SysUserDetail userDetail, UserLoginStrategy strategy) {
    LocalDateTime maxFailureTime = LocalDateTime.now().minusHours(strategy.getMaxFailureInterval());
    // 查询时间窗口内的密码错误次数
    long failureCount = loginLogService.count(wrapper);
    // 当前错误 + 历史错误 >= 最大次数 → 锁定
    if (failureCount + 1 >= strategy.getMaxFailureTimes()) {
        sysUserService.lock(userDetail.getId());
    }
}
```

## 密码过期策略

### 配置项

**配置项：** `loginStrategyWhenExpire`

密码过期时的登录策略：

| 值 | 常量 | 策略 | 说明 |
|---|------|------|------|
| 1 | LOGIN_STRATEGY_WHEN_EXPIRE_TIP | 提示修改 | 允许登录，但提示用户及时修改密码 |
| 2 | LOGIN_STRATEGY_WHEN_EXPIRE_FORCE | 强制修改 | 生成临时 Token，强制修改密码后才能正常使用 |
| 3 | LOGIN_STRATEGY_WHEN_EXPIRE_DISABLE | 禁止登录 | 直接拒绝登录，提示联系管理员（默认） |

### 策略详情

#### 禁止登录（策略 3，默认）

```java
if (UserLoginStrategy.LOGIN_STRATEGY_WHEN_EXPIRE_DISABLE == loginStrategyWhenExpire) {
    throw new IllegalArgumentException("您的账户已过期，请联系管理员");
}
```

- 密码过期后完全无法登录
- 适用于高安全要求场景

#### 强制修改（策略 2）

```java
if (UserLoginStrategy.LOGIN_STRATEGY_WHEN_EXPIRE_FORCE == loginStrategyWhenExpire) {
    tokenStore.storeTempToken(loginResult.getAccessToken(), userDetail, strategy.getTempSessionExpireMinutes());
    loginResult.setForceUpdatePassword(true);
    loginResult.setTempUser(true);
    loginResult.setTip("您的账户已过期，请立即修改密码后登录");
}
```

- 生成临时 Token
- 只能访问修改密码接口
- 修改密码后重新登录

#### 提示修改（策略 1）

```java
loginResult.setTip("您的账户已过期，请及时修改密码");
```

- 正常登录，但显示提示信息
- 不强制修改，允许继续使用
- 适用于低安全要求场景

## 异常登录通知

### 配置项

**配置项：** `sendMsgWhenErrorLogin`

异常登录时发送通知，支持：
- `email` - 邮件通知
- `sms` - 短信通知
- `site` - 站内信通知

可配置多个，用逗号分隔。

### 触发场景

#### 1. 密码错误

密码验证失败时触发通知。

**通知内容：**
- 登录账号
- 尝试 IP
- 尝试时间
- 提示"登录异常"

#### 2. IP 异常登录

对比最近 3 次成功登录的 IP，如果新 IP 不在其中，触发通知。

**通知内容：**
- 登录账号
- 登录 IP
- 登录时间
- 提示"非常用IP登录"

**检测逻辑：**
```java
// 查询最近3次成功登录记录
Page<SysLoginLogEntity> loginLogPage = loginLogService.page(page, queryWrapper);
List<SysLoginLogEntity> records = loginLogPage.getRecords();
if (records.size() > 2) {
    boolean hasDifferentIp = records.stream()
        .map(SysLoginLogEntity::getIpaddr)
        .anyMatch(ip -> ip.equals(ipaddr));
    if (!hasDifferentIp) {
        sendErrorLoginEmails(loginLog, strategy, userDetail, "IP异常");
    }
}
```

### 通知方式

**邮件通知：**
- 发送到用户邮箱
- 使用邮件模板
- 异步发送（通过 `TaskUtil.invokeNow`）

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

根据 `UserStrategy.forceUpdatePassword` 配置：

**强制修改（`true`）：**
```java
if (userDetail.getPasswordUpdateTime() == null) {
    if (userStrategy.isForceUpdatePassword()) {
        tokenStore.storeTempToken(loginResult.getAccessToken(), userDetail, strategy.getTempSessionExpireMinutes());
        loginResult.setForceUpdatePassword(true);
        loginResult.setTempUser(true);
        loginResult.setTip("您的密码为初始密码，请修改密码后登录系统");
    }
}
```

- 生成临时 Token
- 只能访问修改密码接口
- 修改密码后重新登录

**仅提示（`false`，默认）：**
```java
if (!userStrategy.isForceUpdatePassword()) {
    loginResult.setTip("您的密码为初始密码，请及时修改");
}
```

- 允许正常登录
- 显示提示信息
- 不强制修改

## 扫码登录

系统支持扫码授权登录，通过 `QrcodeAuthController` 实现。

### 流程

```
1. 手机端（已登录）调用 /auth/qrcode/generate 生成临时授权码
   ↓
2. PC 端展示二维码（包含授权码）
   ↓
3. 手机端扫码后调用 /auth/qrcode/verify 验证授权码
   ↓
4. 验证成功后返回正式 Token
```

### 接口

**生成授权码：** `POST /auth/qrcode/generate`

- 需要登录（Admin-Token）
- 生成 UUID 授权码，关联用户 ID
- 授权码缓存 5 分钟（`AUTH_QRCODE:{code}`）

**验证授权码：** `POST /auth/qrcode/verify`

- 白名单接口，无需登录
- 验证授权码有效性
- 授权码一次性使用，验证后立即删除
- 检查用户状态（禁用/锁定）
- 生成正式 Token 返回

## 登出

**接口：** `POST /sys/logout`

**逻辑：**
1. 从 Header 获取 Token
2. 删除 Token 缓存和权限码缓存

```java
tokenStore.removeAccessToken(token);
```

## 登录日志

### 记录内容

每次登录尝试都会记录到 `sys_login_log` 表：

- 登录账号
- 用户姓名
- 登录类型（account/mobile/email）
- 登录状态（success/passwrong/locked/disabled/expired）
- IP 地址
- 浏览器信息
- 操作系统
- 登录时间
- 失败原因

### 登录状态

| 状态 | 常量 | 说明 |
|------|------|------|
| success | LoginStatus.SUCCESS | 登录成功 |
| passwrong | LoginStatus.PASSWRONG | 密码错误 |
| locked | LoginStatus.LOCKED | 账号锁定 |
| disabled | LoginStatus.DISABLED | 账号禁用 |
| expired | LoginStatus.EXPIRED | 密码过期 |

### 登录类型

| 类型 | 常量 | 说明 |
|------|------|------|
| account | LoginTypes.ACCOUNT | 账号密码登录 |
| mobile | LoginTypes.MOBILE | 手机号密码登录 |
| email | LoginTypes.EMAIL | 邮箱密码登录 |

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

MolanDev Backend 的登录策略提供了：

- 灵活的会话管理
- 多端登录控制
- 失败锁定保护
- 密码过期强制
- 异常登录通知
- 完整的登录日志
- 扫码授权登录
