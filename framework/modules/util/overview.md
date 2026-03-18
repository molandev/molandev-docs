# Util 工具类概览

`molandev-util` 是 MolanDev Framework 的核心工具类模块，提供了丰富的日常开发工具方法，无任何外部依赖，可以在任何 Java 项目中使用。

## 模块特性

- ✅ **零依赖**: 不依赖任何第三方库，轻量纯净
- ✅ **线程安全**: 所有工具类采用静态方法，无状态设计
- ✅ **高性能**: 精心优化的算法实现
- ✅ **全面测试**: 完善的单元测试覆盖

## Maven 依赖

```xml
<dependency>
    <groupId>com.molandev</groupId>
    <artifactId>molandev-util</artifactId>
    <version>1.0.1</version>
</dependency>
```

## 工具类分类

### 🔐 加密工具 (encrypt 包)

提供常用的加密、解密、摘要和脱敏功能：

| 工具类 | 说明 | 文档链接 |
|--------|------|---------|
| AesUtil | AES 对称加密工具 | [详细文档](/modules/util/encrypt/aes) |
| RsaUtil | RSA 非对称加密工具 | [详细文档](/modules/util/encrypt/rsa) |
| Md5Utils | MD5 摘要算法 | [详细文档](/modules/util/encrypt/md5) |
| ShaUtil | SHA 系列摘要算法 | [详细文档](/modules/util/encrypt/sha) |
| DesUtil | DES 对称加密工具 | [详细文档](/modules/util/encrypt/des) |
| Base64Utils | Base64 编码解码 | [详细文档](/modules/util/encrypt/base64) |
| SensitiveUtils | 敏感信息脱敏工具 | [详细文档](/modules/util/encrypt/sensitive) |
| Hex2Util | 十六进制转换工具 | [详细文档](/modules/util/encrypt/hex) |

### 🛠️ 通用工具

涵盖日常开发的各类工具方法：

| 工具类 | 说明 | 文档链接 |
|--------|------|---------|
| StringUtils | 字符串处理工具 | [详细文档](/modules/util/common/string) |
| DateUtils | 日期时间工具 | [详细文档](/modules/util/common/date) |
| FileUtils | 文件操作工具 | [详细文档](/modules/util/common/file) |
| IOUtils | IO 流操作工具 | [详细文档](/modules/util/common/io) |
| ListUtils | List 集合工具 | [详细文档](/modules/util/common/collection) |
| MapUtil | Map 集合工具 | [详细文档](/modules/util/common/collection) |
| MathUtils | 数学计算工具 | [详细文档](/modules/util/common/math) |
| RandomUtils | 随机数生成工具 | [详细文档](/modules/util/common/random) |
| IdUtils | ID 生成工具 | [详细文档](/modules/util/common/id) |
| ClassUtils | 类操作工具 | [详细文档](/modules/util/common/class) |
| ValidatorUtils | 数据校验工具 | [详细文档](/modules/util/common/validator) |
| GzipUtils | Gzip 压缩工具 | [详细文档](/modules/util/common/gzip) |
| DoubleCheckUtils | 双重检查锁工具 | [详细文档](/modules/util/common/double-check) |
| ThreadUtil | 线程工具（虚拟线程支持） | [详细文档](/modules/util/common/thread) |
| CommandUtil | 系统命令执行工具 | [详细文档](/modules/util/common/command) |

## 快速示例

### 字符串处理

```java
import com.molandev.framework.util.StringUtils;

// 空值判断
boolean empty = StringUtils.isEmpty(""); // true

// 驼峰与下划线互转
String camel = StringUtils.underline2Camel("user_name"); // userName
String underline = StringUtils.camel2Underline("userName"); // user_name

// 字符串填充
String padded = StringUtils.fillEmpty(123, '0', 6); // 000123
```

### 日期处理

```java
import com.molandev.framework.util.DateUtils;

// 获取当前时间
String now = DateUtils.now(); // 2024-01-18 14:30:00

// 日期格式化
String formatted = DateUtils.toStr(new Date(), "yyyy/MM/dd");
```

### 加密处理

```java
import com.molandev.framework.util.encrypt.*;

// AES 加密
String encrypted = AesUtil.encrypt("data", "key");
String decrypted = AesUtil.decrypt(encrypted, "key");

// MD5 摘要
String hash = Md5Utils.md5("password");

// 手机号脱敏
String masked = SensitiveUtils.mobilePhone("13812345678"); // 138****5678
```

## 设计原则

### 静态工具类

所有工具类都采用静态方法设计，使用简单直接：

```java
// ✅ 推荐：直接调用静态方法
String result = StringUtils.isEmpty(str);

// ❌ 不推荐：无需实例化
StringUtils utils = new StringUtils(); // 构造方法已私有化
```

### 参数校验

工具方法会对关键参数进行校验，避免空指针等常见错误：

```java
// 会抛出 IllegalArgumentException
AesUtil.encrypt("data", null); // 密钥不能为空
```

### 异常处理

工具类会将检查异常包装为运行时异常，简化使用：

```java
// 无需捕获检查异常
String hash = Md5Utils.md5("content"); // 内部已处理 NoSuchAlgorithmException
```

## 性能说明

- 所有工具方法都经过性能优化
- 字符串操作使用 StringBuilder 减少对象创建
- 加密工具采用单例模式复用 Cipher 实例
- 集合工具避免不必要的中间集合创建

## 线程安全

所有工具类都是**线程安全**的，可以在多线程环境中安全使用。

## 下一步

选择你感兴趣的工具类开始学习：

### 加密相关
- [AES 加密](/modules/util/encrypt/aes) - 对称加密最佳选择
- [RSA 加密](/modules/util/encrypt/rsa) - 公私钥加密
- [敏感信息脱敏](/modules/util/encrypt/sensitive) - 数据脱敏

### 常用工具
- [字符串工具](/modules/util/common/string) - 字符串处理利器
- [日期工具](/modules/util/common/date) - 日期格式化与转换
- [文件工具](/modules/util/common/file) - 文件信息处理
- [系统命令](/modules/util/common/command) - 跨平台命令执行
