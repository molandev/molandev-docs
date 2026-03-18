# 日期工具

`DateUtils` 基于 Java 8+ 的 `java.time` 包提供高性能、线程安全的日期时间处理功能。相比传统的 `SimpleDateFormat`，它具有更好的并发性能和更丰富的类型支持。

## 类信息

- **包名**: `com.molandev.framework.util`
- **类名**: `DateUtils`
- **类型**: 静态工具类
- **JDK版本**: Java 8+

## 常量

```java
// 默认日期时间格式：yyyy-MM-dd HH:mm:ss
public static final String DEFAULT_TIME_FORMAT = "yyyy-MM-dd HH:mm:ss";

// 默认日期格式：yyyy-MM-dd
public static final String DEFAULT_DATE_FORMAT = "yyyy-MM-dd";

// 默认时区：GMT+8
public static final String ASIA_SHANGHAI = "GMT+8";

// 默认时区偏移量
public static ZoneOffset defaultZoneOffset = ZoneOffset.of("+8");
```

## 核心方法

### 1. 当前时间获取

#### now() - 获取当前日期时间字符串

```java
public static String now()
public static String now(String pattern)
```

**示例**:
```java
// 默认格式: 2024-01-18 14:30:25
String time = DateUtils.now();  

// 自定义格式: 20240118143025
String date = DateUtils.now("yyyyMMddHHmmss");  
```

#### getDate() - 获取当前日期字符串

```java
public static String getDate()
public static String getDate(String pattern)
```

**示例**:
```java
// 默认格式: 2024-01-18
String date = DateUtils.getDate();  

// 自定义格式: 2024/01/18
String date2 = DateUtils.getDate("yyyy/MM/dd");  
```

---

### 2. 格式化 (Object -> String)

#### toStr - 日期转字符串

支持 `java.util.Date` 和 `java.time.LocalDateTime`。

```java
// Date 转字符串
public static String toStr(Date date)
public static String toStr(Date date, String pattern)

// LocalDateTime 转字符串
public static String toStr(LocalDateTime localDateTime)
public static String toStr(LocalDateTime localDateTime, String pattern)
```

**示例**:
```java
Date date = new Date();
LocalDateTime ldt = LocalDateTime.now();

// 使用默认格式
String str1 = DateUtils.toStr(date);
String str2 = DateUtils.toStr(ldt);

// 使用自定义格式
String str3 = DateUtils.toStr(date, "yyyy年MM月dd日");
```

---

### 3. 解析 (String -> Object)

#### toDate / toLocalDateTime - 字符串转日期

```java
// 转 Date
public static Date toDate(String dateStr)
public static Date toDate(String dateStr, String pattern)

// 转 LocalDateTime
public static LocalDateTime toLocalDateTime(String dateStr)
public static LocalDateTime toLocalDateTime(String dateStr, String pattern)
```

**提示**: `toLocalDateTime` 具有智能解析能力，如果传入的字符串仅包含日期（如 `2024-01-01`），它会自动补全时间为当天零点。

**示例**:
```java
// 默认格式解析
Date date = DateUtils.toDate("2024-01-18 14:30:00");

// 自动补全时间解析
LocalDateTime ldt = DateUtils.toLocalDateTime("2024-01-18", "yyyy-MM-dd");
// 结果为 2024-01-18T00:00:00
```

---

### 4. 相互转换

```java
// LocalDateTime 转毫秒
public static long toMillis(LocalDateTime localDateTime)

// Date 转 LocalDateTime
public static LocalDateTime toLocalDateTime(Date date)

// LocalDateTime 转 Date
public static Date toDate(LocalDateTime localDateTime)
```

## 注意事项

### 🔒 线程安全

本工具类内部使用 `DateTimeFormatter` 代替了传统的 `SimpleDateFormat`，因此是**完全线程安全**的，可在多线程环境下放心使用。

### 🌏 时区处理

默认使用 `GMT+8` (上海时区)。如需修改全局默认时区偏移量，可调整 `defaultZoneOffset` 常量。

### ⚠️ 异常处理

解析错误会抛出 `RuntimeException`，建议在处理外部不可信输入时进行捕获。

## 相关工具

- [字符串工具](/modules/util/common/string) - 字符串处理
- [文件工具](/modules/util/common/file) - 文件时间
