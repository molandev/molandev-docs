# 字符串工具

`StringUtils` 提供丰富的字符串处理方法，是日常开发中最常用的工具类之一。

## 类信息

- **包名**: `com.molandev.framework.util`
- **类名**: `StringUtils`
- **类型**: 静态工具类

## 使用场景

- ✅ 字符串空值判断
- ✅ 驼峰与下划线命名转换
- ✅ 字符串填充与格式化
- ✅ 字符串分割与连接
- ✅ 首字母大小写转换
- ✅ 正则匹配查找

## 基础使用

```java
import com.molandev.framework.util.StringUtils;

// 空值判断
boolean empty = StringUtils.isEmpty("");  // true
boolean notEmpty = StringUtils.isNotEmpty("hello");  // true

// 命名转换
String camel = StringUtils.underline2Camel("user_name");  // userName
String underline = StringUtils.camel2Underline("userName");  // user_name

// 字符串填充
String padded = StringUtils.fillEmpty(123, '0', 6);  // 000123
```

## 核心方法

### 空值判断

#### isEmpty

判断字符串是否为空（null、空串或纯空格）。

```java
public static boolean isEmpty(String str)
```

**示例**：

```java
StringUtils.isEmpty(null);      // true
StringUtils.isEmpty("");        // true
StringUtils.isEmpty("   ");     // true
StringUtils.isEmpty("hello");   // false
```

#### isNotEmpty

判断字符串是否非空。

```java
public static boolean isNotEmpty(String str)
```

**示例**：

```java
StringUtils.isNotEmpty("hello");  // true
StringUtils.isNotEmpty("");       // false
```

### 默认值处理

#### nullToEmpty

将 null 转换为空字符串。

```java
public static String nullToEmpty(String str)
```

**示例**：

```java
StringUtils.nullToEmpty(null);    // ""
StringUtils.nullToEmpty("hello"); // "hello"
```

#### emptyToDefault

空字符串转换为默认值。

```java
public static String emptyToDefault(String str, String def)
```

**参数**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| str | String | 原字符串 |
| def | String | 默认值 |

**示例**：

```java
StringUtils.emptyToDefault("", "default");     // "default"
StringUtils.emptyToDefault("value", "default"); // "value"
StringUtils.emptyToDefault(null, "default");    // "default"
```

### 命名转换

#### underline2Camel

下划线命名转驼峰命名（默认小驼峰）。

```java
public static String underline2Camel(String line)
```

**示例**：

```java
StringUtils.underline2Camel("user_name");       // userName
StringUtils.underline2Camel("user_id_card");    // userIdCard
StringUtils.underline2Camel("USER_NAME");       // userName
```

#### camel2Underline

驼峰命名转下划线命名。

```java
public static String camel2Underline(String line)
```

**示例**：

```java
StringUtils.camel2Underline("userName");     // user_name
StringUtils.camel2Underline("userIdCard");   // user_id_card
StringUtils.camel2Underline("UserName");     // user_name
```

### 大小写转换

#### upperFirst

首字母大写。

```java
public static String upperFirst(String str)
```

**示例**：

```java
StringUtils.upperFirst("hello");   // Hello
StringUtils.upperFirst("world");   // World
StringUtils.upperFirst("a");       // A
```

#### lowerFirst

首字母小写。

```java
public static String lowerFirst(String str)
```

**示例**：

```java
StringUtils.lowerFirst("Hello");   // hello
StringUtils.lowerFirst("World");   // world
StringUtils.lowerFirst("A");       // a
```

### 字符串填充

#### fillEmpty

使用指定字符前置填充数字。

```java
public static String fillEmpty(long num, char c, int length)
```

**参数**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| num | long | 要填充的数字 |
| c | char | 填充字符 |
| length | int | 总长度 |

**示例**：

```java
StringUtils.fillEmpty(1, '0', 5);      // 00001
StringUtils.fillEmpty(123, '0', 6);    // 000123
StringUtils.fillEmpty(999999, '0', 4); // 9999 (超长时截取)
```

#### fillEmptyWithStr

使用指定字符串前置填充。

```java
public static String fillEmptyWithStr(long num, int length, String str)
```

**示例**：

```java
StringUtils.fillEmptyWithStr(1, 5, "0");     // 00001
StringUtils.fillEmptyWithStr(1, 6, "**");    // ****1
```

#### getRepeatStrs

生成重复字符串。

```java
public static String getRepeatStrs(String repeatStr, int repeatCount)
```

**示例**：

```java
StringUtils.getRepeatStrs("*", 5);     // *****
StringUtils.getRepeatStrs("ab", 3);    // ababab
StringUtils.getRepeatStrs("x", 0);     // ""
```

### 字符串截取

#### removeStart

去掉首部字符串。

```java
public static String removeStart(String str, String startStr)
```

**示例**：

```java
StringUtils.removeStart("HelloWorld", "Hello");  // World
StringUtils.removeStart("www.example.com", "www."); // example.com
StringUtils.removeStart("Test", "Hello");        // Test (不匹配时返回原串)
```

#### removeEnd

去掉尾部字符串。

```java
public static String removeEnd(String str, String endStr)
```

**示例**：

```java
StringUtils.removeEnd("HelloWorld", "World");   // Hello
StringUtils.removeEnd("file.txt", ".txt");      // file
StringUtils.removeEnd("Test", "World");         // Test
```

#### removeStartEnd

同时去掉首尾字符串。

```java
public static String removeStartEnd(String str, String startStr, String endStr)
```

**示例**：

```java
StringUtils.removeStartEnd("(Hello)", "(", ")");  // Hello
StringUtils.removeStartEnd("[text]", "[", "]");   // text
```

### 分割与连接

#### split

分割字符串为列表。

```java
public static List<String> split(String str, String split)
```

**示例**：

```java
List<String> list = StringUtils.split("a,b,c", ",");
// [a, b, c]

List<String> list2 = StringUtils.split("1|2|3", "|");
// [1, 2, 3]
```

#### join (集合)

将集合连接为字符串。

```java
public static String join(Collection<String> list, String split)
```

**示例**：

```java
List<String> list = Arrays.asList("a", "b", "c");
String result = StringUtils.join(list, ",");  // a,b,c

String result2 = StringUtils.join(list, "-"); // a-b-c
```

#### join (数组)

将数组连接为字符串。

```java
public static String join(String[] array, String split)
```

**示例**：

```java
String[] array = {"a", "b", "c"};
String result = StringUtils.join(array, ",");  // a,b,c
```

### 正则匹配

#### findMatches

查找所有匹配项。

```java
public static List<String> findMatches(String str, String regex)
```

**参数**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| str | String | 源字符串 |
| regex | String | 正则表达式 |

**示例**：

```java
String text = "Price: $100, $200, $300";
List<String> prices = StringUtils.findMatches(text, "\\$\\d+");
// [$100, $200, $300]

String email = "Contact: user@example.com, admin@test.com";
List<String> emails = StringUtils.findMatches(email, "[\\w.]+@[\\w.]+");
// [user@example.com, admin@test.com]
```

## 完整示例

### 示例 1：数据库字段名转换

```java
import com.molandev.framework.util.StringUtils;
import java.util.HashMap;
import java.util.Map;

public class FieldConverter {
    
    /**
     * 数据库字段转 Java 属性
     */
    public static Map<String, Object> dbToJava(Map<String, Object> dbMap) {
        Map<String, Object> javaMap = new HashMap<>();
        
        dbMap.forEach((key, value) -> {
            String javaKey = StringUtils.underline2Camel(key.toLowerCase());
            javaMap.put(javaKey, value);
        });
        
        return javaMap;
    }
    
    /**
     * Java 属性转数据库字段
     */
    public static Map<String, Object> javaToDb(Map<String, Object> javaMap) {
        Map<String, Object> dbMap = new HashMap<>();
        
        javaMap.forEach((key, value) -> {
            String dbKey = StringUtils.camel2Underline(key).toUpperCase();
            dbMap.put(dbKey, value);
        });
        
        return dbMap;
    }
    
    public static void main(String[] args) {
        // 数据库结果转 Java
        Map<String, Object> dbData = new HashMap<>();
        dbData.put("USER_NAME", "张三");
        dbData.put("USER_AGE", 25);
        
        Map<String, Object> javaData = dbToJava(dbData);
        System.out.println(javaData);
        // {userName=张三, userAge=25}
        
        // Java 对象转数据库
        Map<String, Object> dbResult = javaToDb(javaData);
        System.out.println(dbResult);
        // {USER_NAME=张三, USER_AGE=25}
    }
}
```

### 示例 2：订单号生成

```java
import com.molandev.framework.util.StringUtils;
import com.molandev.framework.util.DateUtils;

public class OrderNumberGenerator {
    
    private static int sequence = 0;
    
    /**
     * 生成订单号：日期 + 序号
     * 格式：20240118000001
     */
    public static synchronized String generate() {
        sequence++;
        if (sequence > 999999) {
            sequence = 1;
        }
        
        String date = DateUtils.getDate("yyyyMMdd");
        String seq = StringUtils.fillEmpty(sequence, '0', 6);
        
        return date + seq;
    }
    
    public static void main(String[] args) {
        for (int i = 0; i < 5; i++) {
            System.out.println(generate());
        }
        // 20240118000001
        // 20240118000002
        // 20240118000003
        // 20240118000004
        // 20240118000005
    }
}
```

### 示例 3：SQL 参数提取

```java
import com.molandev.framework.util.StringUtils;
import java.util.List;

public class SqlParser {
    
    /**
     * 提取 SQL 中的参数名
     */
    public static List<String> extractParams(String sql) {
        // 匹配 #{paramName} 格式
        return StringUtils.findMatches(sql, "#\\{([^}]+)\\}");
    }
    
    public static void main(String[] args) {
        String sql = "SELECT * FROM user WHERE name = #{name} AND age = #{age}";
        
        List<String> params = extractParams(sql);
        System.out.println("参数: " + params);
        // 参数: [#{name}, #{age}]
        
        // 清理参数格式
        params.replaceAll(p -> p.substring(2, p.length() - 1));
        System.out.println("参数名: " + params);
        // 参数名: [name, age]
    }
}
```

### 示例 4：文本清理与格式化

```java
import com.molandev.framework.util.StringUtils;
import java.util.List;
import java.util.stream.Collectors;

public class TextFormatter {
    
    /**
     * 清理多余空格
     */
    public static String cleanSpaces(String text) {
        if (StringUtils.isEmpty(text)) {
            return "";
        }
        return text.trim().replaceAll("\\s+", " ");
    }
    
    /**
     * 移除特殊字符
     */
    public static String removeSpecialChars(String text) {
        return text.replaceAll("[^a-zA-Z0-9\\u4e00-\\u9fa5]", "");
    }
    
    /**
     * 格式化标签列表
     */
    public static String formatTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return "";
        }
        
        List<String> cleaned = tags.stream()
            .filter(StringUtils::isNotEmpty)
            .map(String::trim)
            .distinct()
            .collect(Collectors.toList());
        
        return StringUtils.join(cleaned, ", ");
    }
    
    public static void main(String[] args) {
        String text = "  Hello    World  ";
        System.out.println(cleanSpaces(text)); // Hello World
        
        String special = "Hello@World#2024!";
        System.out.println(removeSpecialChars(special)); // HelloWorld2024
        
        List<String> tags = List.of("Java", "Spring", "", "MyBatis", "Java");
        System.out.println(formatTags(tags)); // Java, Spring, MyBatis
    }
}
```

## 性能说明

- 所有方法都经过性能优化
- 字符串拼接使用 `StringBuilder`
- 正则表达式使用 `Pattern.compile()` 提前编译

## 注意事项

### ⚠️ null 安全

大部分方法对 null 参数做了处理，但仍建议在调用前进行判断：

```java
// ✅ 推荐
if (str != null) {
    String result = StringUtils.upperFirst(str);
}

// ⚠️ 某些方法会返回 null
String result = StringUtils.removeStart(null, "test"); // null
```

### ⚠️ 正则性能

频繁使用正则表达式时，建议预编译：

```java
// ❌ 不推荐：每次都编译
for (String text : texts) {
    StringUtils.findMatches(text, "\\d+");
}

// ✅ 推荐：预编译正则
Pattern pattern = Pattern.compile("\\d+");
for (String text : texts) {
    Matcher matcher = pattern.matcher(text);
    // ...
}
```

## 常见问题

### Q: isEmpty 和 isBlank 有什么区别？

A: `isEmpty` 会 trim 后判断，所以纯空格字符串也会返回 true。

### Q: 为什么没有 isBlank 方法？

A: `isEmpty` 已经包含了 `isBlank` 的功能（会 trim 处理）。

### Q: 驼峰转换支持大驼峰吗？

A: `underline2Camel` 默认返回小驼峰，可以配合 `upperFirst` 转为大驼峰：

```java
String bigCamel = StringUtils.upperFirst(
    StringUtils.underline2Camel("user_name")
); // UserName
```

## 相关工具

- [日期工具](/modules/util/common/date) - 日期字符串格式化
- [文件工具](/modules/util/common/file) - 文件名处理
- [集合工具](/modules/util/common/collection) - 字符串列表处理
