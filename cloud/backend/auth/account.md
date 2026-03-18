# 账户策略

MolanDev Cloud 提供了完善的账户管理策略，包括密码策略、账户状态管理等。

## 配置方式

账户策略通过 **SysProp** 机制存储在数据库中，支持前端页面动态配置。

### 数据存储

- **表名**：`sys_prop`
- **Namespace**：`user_strategy`
- **配置方式**：系统管理 → 系统策略 → 账户策略

::: tip TODO - 账户策略配置页面
**建议截图：** 前端账户策略配置页面，展示所有配置项和说明
:::

### 核心接口

**查询接口：** `POST /sys/strategy/user/info`

**保存接口：** `POST /sys/strategy/user/save`

**权限要求：** `sys:strategy:user:save`

### 配置项说明

| 配置项 | 字段名 | 默认值 | 说明 |
|--------|---------|---------|------|
| 密码有效期 | passwordExpireDays | 90 | 密码过期天数，0=永不过期 |
| 提前提醒天数 | expireNotifyDays | 10 | 过期前几天发送提醒 |
| 最小密码长度 | minPasswordLength | 6 | 密码最少字符数 |
| 最大密码长度 | maxPasswordLength | 20 | 密码最多字符数 |
| 包含小写字母 | includeLowerCase | true | 密码必须包含小写字母 |
| 包含大写字母 | includeUpperCase | false | 密码必须包含大写字母 |
| 包含数字 | includeNumber | true | 密码必须包含数字 |
| 包含特殊字符 | includeSymbol | true | 密码必须包含特殊字符 |
| 首次登录强制修改 | forceUpdatePassword | false | 初始密码是否强制修改 |

### 获取配置

代码中通过 `SysPropUtils` 获取当前配置：

```java
UserStrategy strategy = SysPropUtils.getProps(UserStrategy.class);
int expireDays = strategy.getPasswordExpireDays();
boolean forceUpdate = strategy.isForceUpdatePassword();
```

**缓存机制：**
- 配置从数据库加载后缓存
- 配置变更后自动刷新缓存
- 通过 `SysPropsChangedEvent` 事件通知

## 密码策略

### 1. 密码有效期

**配置项：** `password-expire-days`

控制密码的有效天数，默认 90 天。

**计算方式：**
- 以 `password_update_time` 字段为基准
- 首次登录时以 `create_time` 为基准
- 超过有效期后触发密码过期流程

**过期处理：**

根据登录策略配置 `login-strategy-when-expire` 决定：
- 0 - 禁止登录
- 1 - 强制修改密码（默认）
- 2 - 提示修改密码

**设置建议：**
- 高安全系统：30-60 天
- 一般系统：60-90 天
- 内部系统：90-180 天
- 设置为 0 表示永不过期

### 2. 密码规则

系统使用 `MolanPasswordEncoder` 进行密码加密和验证。

**加密方式：**
- 使用 BCrypt 算法
- 自动加盐
- 每次加密结果不同

**密码复杂度验证：**

系统根据账户策略配置自动验证密码复杂度：

- **长度验证** - 根据 `minPasswordLength` 和 `maxPasswordLength` 验证
- **小写字母** - `includeLowerCase=true` 时必须包含
- **大写字母** - `includeUpperCase=true` 时必须包含
- **数字** - `includeNumber=true` 时必须包含
- **特殊字符** - `includeSymbol=true` 时必须包含

**验证逻辑：** `SysUserService.checkPasswordStrong()`

### 3. 首次登录策略

**配置项：** `force-update-password`

控制用户首次登录时是否强制修改密码。

**开启强制修改（`true`，默认）：**
```java
if (firstLogin && forceUpdate) {
    tokenStore.storeTempToken(token, userDetail, 5);
    loginResult.setForceUpdatePassword(true);
    loginResult.setTip("您的密码为初始密码，请修改密码后登录系统");
}
```

- 生成 5 分钟临时 Token
- 只能访问修改密码接口
- 修改密码后重新登录

**仅提示（`false`）：**
```java
if (firstLogin && !forceUpdate) {
    loginResult.setTip("您的密码为初始密码，请及时修改");
}
```

- 允许正常登录
- 显示提示信息
- 不强制修改

## 账户状态

### 1. 账户锁定

**字段：** `locked`、`unlock_time`

**锁定触发：**
- 密码错误达到最大次数
- 管理员手动锁定

**锁定状态：**
- `locked = true` - 账户已锁定
- `unlock_time` - 自动解锁时间

**登录检查：**
```java
if (user.getLocked()) {
    if (unlockTime != null && unlockTime.isBefore(now)) {
        // 已过解锁时间，自动解锁
        sysUserService.unlock(userId);
    } else {
        return JsonResult.failed("用户已被锁定");
    }
}
```

**解锁方式：**
- 到达 `unlock_time` 后自动解锁
- 管理员手动解锁

### 2. 账户禁用

**字段：** `disabled`

**禁用状态：**
- `disabled = true` - 账户已禁用
- `disabled = false` - 账户正常

**登录检查：**
```java
if (user.getDisabled()) {
    return JsonResult.failed("用户已被禁用");
}
```

**禁用场景：**
- 员工离职
- 违规操作
- 临时冻结

**启用方式：**
- 管理员手动启用

### 3. 状态优先级

登录时按以下顺序检查：

1. 密码验证
2. 锁定状态检查
3. 禁用状态检查
4. 密码过期检查

任一检查失败即拒绝登录。

## 密码管理

### 1. 修改密码

**接口：** `/sys/personal/updatePassword`

**流程：**
1. 验证旧密码
2. 检查新密码格式
3. 加密新密码
4. 更新数据库
5. 更新 `password_update_time`
6. 清除所有 Token（强制重新登录）

**核心代码：**
```java
public void updatePassword(String userId, String oldPassword, String newPassword) {
    // 1. 验证旧密码
    SysUserEntity user = getById(userId);
    if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
        throw new BusinessException("原密码错误");
    }
    
    // 2. 更新密码
    user.setPassword(passwordEncoder.encode(newPassword));
    user.setPasswordUpdateTime(LocalDateTime.now());
    updateById(user);
    
    // 3. 清除所有Token
    tokenStore.removeAllTokensByUserId(userId);
}
```

### 2. 重置密码

**接口：** `/sys/user/resetPassword`

**权限：** 需要 `system:user:resetPassword` 权限

**流程：**
1. 管理员重置用户密码
2. 重置为默认密码
3. 清空 `password_update_time`（标记为首次登录）
4. 用户下次登录时强制修改

**默认密码：**
- 可配置默认密码
- 建议使用 `123456` 或 `admin123` 等简单密码
- 首次登录强制修改

### 3. 忘记密码

**说明：** 当前版本暂未实现自助找回密码功能。

**处理方式：**
- 联系管理员重置密码
- 未来版本考虑增加邮箱/手机找回

## 账户操作

### 1. 锁定账户

**接口：** `/sys/user/lock`

**流程：**
```java
public void lock(String userId) {
    SysUserEntity user = new SysUserEntity();
    user.setId(userId);
    user.setLocked(true);
    user.setUnlockTime(LocalDateTime.now().plusHours(24)); // 24小时后自动解锁
    updateById(user);
    
    // 踢出所有在线Token
    tokenStore.kickoutAllTokensByUserId(userId);
}
```

**效果：**
- 账户标记为锁定
- 设置自动解锁时间
- 踢出所有在线会话

### 2. 解锁账户

**接口：** `/sys/user/unlock`

**流程：**
```java
public void unlock(String userId) {
    SysUserEntity user = new SysUserEntity();
    user.setId(userId);
    user.setLocked(false);
    user.setUnlockTime(null);
    updateById(user);
}
```

### 3. 禁用账户

**接口：** `/sys/user/disable`

**流程：**
```java
public void disable(String userId) {
    SysUserEntity user = new SysUserEntity();
    user.setId(userId);
    user.setDisabled(true);
    updateById(user);
    
    // 踢出所有在线Token
    tokenStore.kickoutAllTokensByUserId(userId);
}
```

**效果：**
- 账户标记为禁用
- 踢出所有在线会话
- 禁用后无法登录

### 4. 启用账户

**接口：** `/sys/user/enable`

**流程：**
```java
public void enable(String userId) {
    SysUserEntity user = new SysUserEntity();
    user.setId(userId);
    user.setDisabled(false);
    updateById(user);
}
```

## 安全增强

### 1. 密码加密存储

- 使用 BCrypt 算法
- 每次加密结果不同
- 无法反向解密
- 只能通过比对验证

### 2. 密码传输加密

前端使用 RSA 加密传输密码：

**前端加密：**
```javascript
import { encrypt } from '@/utils/crypto'

const encryptedPassword = encrypt(password)
```

**后端解密：**
```java
@EncryptedParam String password
```

使用 `@EncryptedParam` 注解自动解密。

### 3. 防暴力破解

- 失败锁定机制
- 验证码验证
- 登录日志记录
- IP 异常检测

## 最佳实践

### 1. 密码策略

- 设置合理的密码有效期
- 强制首次登录修改密码
- 定期提醒用户修改密码
- 禁止使用弱密码

### 2. 账户管理

- 及时清理离职人员账户
- 定期审查账户状态
- 对异常账户及时处理
- 重要账户增强保护

### 3. 状态变更

- 锁定/禁用时踢出在线会话
- 重置密码后清空 Token
- 状态变更记录操作日志
- 重要操作需要审批

### 4. 安全监控

- 监控密码修改频率
- 监控账户状态变更
- 监控异常登录
- 定期审计账户安全

## 总结

MolanDev Cloud 的账户策略提供了：

- ✅ 灵活的密码策略
- ✅ 完善的账户状态管理
- ✅ 安全的密码加密
- ✅ 密码传输加密
- ✅ 首次登录强制修改
- ✅ 账户锁定/禁用机制
