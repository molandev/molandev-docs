# Util 工具类概览

`molandev-util` 是 MolanDev Framework 的核心工具类模块，提供了丰富的日常开发工具方法。**无任何外部依赖**，可以在任何 Java 项目中使用。

## 模块特性

- ✅ **零依赖**：不依赖任何第三方库，轻量纯净
- ✅ **线程安全**：所有工具类采用静态方法，无状态设计
- ✅ **高性能**：精心优化的算法实现
- ✅ **全面测试**：完善的单元测试覆盖

## Maven 依赖

```xml
<dependency>
    <groupId>com.molandev</groupId>
    <artifactId>molandev-util</artifactId>
    <version>${molandev.version}</version>
</dependency>
```

## 工具类清单

### 🔐 加密工具

| 工具类 | 说明 | 项目使用频率 | 文档 |
|--------|------|-------------|------|
| AesUtil | AES 对称加密 | ⭐⭐⭐ | [详细文档](/modules/util/encrypt/aes) |
| RsaUtil | RSA 非对称加密 | ⭐⭐⭐⭐ 前端密码加密 | [详细文档](/modules/util/encrypt/rsa) |
| Md5Utils | MD5 摘要算法 | ⭐⭐⭐ | [详细文档](/modules/util/encrypt/md5) |
| ShaUtil | SHA 系列摘要 | ⭐⭐ | [详细文档](/modules/util/encrypt/sha) |
| DesUtil | DES 对称加密 | ⭐ | [详细文档](/modules/util/encrypt/des) |
| Base64Utils | Base64 编码解码 | ⭐⭐⭐ | [详细文档](/modules/util/encrypt/base64) |
| SensitiveUtils | 敏感信息脱敏 | ⭐⭐ | [详细文档](/modules/util/encrypt/sensitive) |
| Hex2Util | 十六进制转换 | ⭐⭐ | [详细文档](/modules/util/encrypt/hex) |

### 🛠️ 通用工具

| 工具类 | 说明 | 项目使用频率 | 文档 |
|--------|------|-------------|------|
| StringUtils | 字符串处理（空值判断、驼峰转换等） | ⭐⭐⭐⭐⭐ | [详细文档](/modules/util/common/string) |
| DateUtils | 日期时间处理 | ⭐⭐⭐⭐ | [详细文档](/modules/util/common/date) |
| IdUtils | ID/UUID 生成 | ⭐⭐⭐⭐⭐ | [详细文档](/modules/util/common/id) |
| IOUtils | IO 流操作 | ⭐⭐⭐⭐ 文件下载 | [详细文档](/modules/util/common/io) |
| FileUtils | 文件操作、MIME类型识别 | ⭐⭐⭐ | [详细文档](/modules/util/common/file) |
| ListUtils | List 集合工具 | ⭐⭐⭐ | [详细文档](/modules/util/common/collection) |
| MapUtil | Map 集合工具 | ⭐⭐⭐ | [详细文档](/modules/util/common/collection) |
| RandomUtils | 随机数/字符串生成 | ⭐⭐ | [详细文档](/modules/util/common/random) |
| MathUtils | 精确数学计算 | ⭐⭐ | [详细文档](/modules/util/common/math) |
| ValidatorUtils | 数据校验（手机号、邮箱、IP等） | ⭐⭐ | [详细文档](/modules/util/common/validator) |
| GzipUtils | Gzip 压缩/解压 | ⭐⭐ | [详细文档](/modules/util/common/gzip) |
| ThreadUtil | 线程工具（虚拟线程支持） | ⭐⭐ | [详细文档](/modules/util/common/thread) |
| CommandUtil | 系统命令执行 | ⭐ | [详细文档](/modules/util/common/command) |
| ClassUtils | 反射/类操作工具 | ⭐⭐ | [详细文档](/modules/util/common/class) |
| DoubleCheckUtils | 双重检查锁 | ⭐ | [详细文档](/modules/util/common/double-check) |

## 快速示例

### 字符串处理

```java
import com.molandev.framework.util.StringUtils;

// 空值判断
boolean empty = StringUtils.isEmpty("");     // true
boolean blank = StringUtils.isBlank("  ");   // true

// 驼峰与下划线互转
String camel = StringUtils.underline2Camel("user_name");  // userName
String underline = StringUtils.camel2Underline("userName"); // user_name
```

### ID 生成

```java
import com.molandev.framework.util.IdUtils;

// UUID（无横线）
String uuid = IdUtils.uuid();  // 32位

// 简单 ID 生成
Long id = IdUtils.nextId();
```

### RSA 加密（项目中用于前端密码加密）

```java
import com.molandev.framework.util.encrypt.RsaUtil;

// 前端使用公钥加密密码
String encrypted = RsaUtil.encrypt(publicKey, password);

// 后端使用私钥解密
String decrypted = RsaUtil.decrypt(privateKey, encrypted);
```

> 📖 **详细说明** → [登录策略文档](/cloud/backend/auth/login) 前端加密章节

### 手机号脱敏

```java
import com.molandev.framework.util.encrypt.SensitiveUtils;

String masked = SensitiveUtils.mobilePhone("13812345678");  // 138****5678
```

## 设计原则

### 静态工具类

所有工具类都采用静态方法设计，使用简单直接：

```java
// ✅ 推荐：直接调用静态方法
String result = StringUtils.isEmpty(str);

// ❌ 不推荐：无需实例化（构造方法已私有化）
StringUtils utils = new StringUtils();
```

### 参数校验

工具方法会对关键参数进行校验，避免空指针等常见错误：

```java
// 会抛出 IllegalArgumentException
RsaUtil.encrypt(null, "data");  // 密钥不能为空
```

### 异常处理

工具类会将检查异常包装为运行时异常，简化使用：

```java
// 无需捕获检查异常
String hash = Md5Utils.md5("content");  // 内部已处理 NoSuchAlgorithmException
```

## 线程安全

所有工具类都是**线程安全**的，可以在多线程环境中安全使用。

## 下一步

选择你感兴趣的工具类开始学习：

### 加密相关
- [AES 加密](/modules/util/encrypt/aes) - 对称加密
- [RSA 加密](/modules/util/encrypt/rsa) - 公私钥加密（前端密码加密使用）
- [敏感信息脱敏](/modules/util/encrypt/sensitive) - 数据脱敏

### 常用工具
- [字符串工具](/modules/util/common/string) - 字符串处理
- [日期工具](/modules/util/common/date) - 日期格式化与转换
- [ID 生成](/modules/util/common/id) - UUID/雪花ID
- [IO 流操作](/modules/util/common/io) - 流读写工具
- [文件工具](/modules/util/common/file) - 文件信息处理、MIME识别
- [集合工具](/modules/util/common/collection) - List/Map 增强操作
