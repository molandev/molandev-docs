# 校验工具

`ValidatorUtils` 提供常用数据格式校验功能。

## 类信息

- **包名**: `com.molandev.framework.util`
- **类名**: `ValidatorUtils`
- **类型**: 静态工具类

## 核心方法

### isPhone - 手机号校验

```java
public static boolean isPhone(String str)
```

**示例**:
```java
boolean valid = ValidatorUtils.isPhone("13812345678"); // true
boolean invalid = ValidatorUtils.isPhone("12345"); // false
```

---

### isEmail - 邮箱校验

```java
public static boolean isEmail(String str)
```

**示例**:
```java
boolean valid = ValidatorUtils.isEmail("user@example.com"); // true
boolean invalid = ValidatorUtils.isEmail("invalid@email"); // false
```

---

### isIpAddress - IP地址校验

```java
public static boolean isIpAddress(String str)
```

**示例**:
```java
boolean valid = ValidatorUtils.isIpAddress("192.168.1.1"); // true
boolean invalid = ValidatorUtils.isIpAddress("256.1.1.1"); // false
```

---

### isUrl - URL校验

```java
public static boolean isUrl(String str)
```

**示例**:
```java
boolean valid = ValidatorUtils.isUrl("https://www.example.com"); // true
boolean invalid = ValidatorUtils.isUrl("not a url"); // false
```

---

### isNumeric - 纯数字校验

```java
public static boolean isNumeric(String str)
```

**示例**:
```java
boolean valid = ValidatorUtils.isNumeric("12345"); // true
boolean invalid = ValidatorUtils.isNumeric("123abc"); // false
```

---

### isAlphabetic - 纯字母校验

```java
public static boolean isAlphabetic(String str)
```

**示例**:
```java
boolean valid = ValidatorUtils.isAlphabetic("Hello"); // true
boolean invalid = ValidatorUtils.isAlphabetic("Hello123"); // false
```

---

### isAlphanumericWithUnderscore - 字母数字下划线

```java
public static boolean isAlphanumericWithUnderscore(String str)
```

**示例**:
```java
boolean valid = ValidatorUtils.isAlphanumericWithUnderscore("user_123"); // true
boolean invalid = ValidatorUtils.isAlphanumericWithUnderscore("user-123"); // false
```

---

### containsSpecialCharacters - 包含特殊字符

```java
public static boolean containsSpecialCharacters(String str)
```

**示例**:
```java
boolean has = ValidatorUtils.containsSpecialCharacters("abc@123"); // true
boolean no = ValidatorUtils.containsSpecialCharacters("abc123"); // false
```

## 完整示例

### 示例 1：表单校验

```java
import com.molandev.framework.util.ValidatorUtils;
import java.util.HashMap;
import java.util.Map;

public class FormValidator {
    
    public static Map<String, String> validate(String username, String email, String phone) {
        Map<String, String> errors = new HashMap<>();
        
        // 用户名校验
        if (username == null || username.length() < 3) {
            errors.put("username", "用户名至少3位");
        } else if (!ValidatorUtils.isAlphanumericWithUnderscore(username)) {
            errors.put("username", "用户名只能包含字母、数字、下划线");
        }
        
        // 邮箱校验
        if (!ValidatorUtils.isEmail(email)) {
            errors.put("email", "邮箱格式错误");
        }
        
        // 手机号校验
        if (!ValidatorUtils.isPhone(phone)) {
            errors.put("phone", "手机号格式错误");
        }
        
        return errors;
    }
    
    public static void main(String[] args) {
        Map<String, String> errors = validate("user_123", "test@example.com", "13812345678");
        
        if (errors.isEmpty()) {
            System.out.println("校验通过");
        } else {
            System.out.println("校验失败:");
            errors.forEach((field, msg) -> System.out.println(field + ": " + msg));
        }
    }
}
```

### 示例 2：密码强度校验

```java
import com.molandev.framework.util.ValidatorUtils;

public class PasswordValidator {
    
    /**
     * 校验密码强度
     */
    public static boolean isStrongPassword(String password) {
        if (password == null || password.length() < 8) {
            return false;
        }
        
        // 必须包含字母
        if (!password.matches(".*[a-zA-Z].*")) {
            return false;
        }
        
        // 必须包含数字
        if (!ValidatorUtils.isNumeric(password.replaceAll("[^0-9]", ""))) {
            if (password.replaceAll("[^0-9]", "").isEmpty()) {
                return false;
            }
        }
        
        // 必须包含特殊字符
        if (!ValidatorUtils.containsSpecialCharacters(password)) {
            return false;
        }
        
        return true;
    }
    
    public static void main(String[] args) {
        System.out.println(isStrongPassword("weak"));           // false（太短）
        System.out.println(isStrongPassword("password123"));    // false（无特殊字符）
        System.out.println(isStrongPassword("Pass@123"));       // true（强密码）
    }
}
```

### 示例 3：配置项校验

```java
import com.molandev.framework.util.ValidatorUtils;

public class ConfigValidator {
    
    public static class ServerConfig {
        String host;
        int port;
        String adminEmail;
        
        public boolean validate() {
            // Host可以是域名或IP
            if (!ValidatorUtils.isUrl("http://" + host) && 
                !ValidatorUtils.isIpAddress(host)) {
                System.out.println("Host格式错误: " + host);
                return false;
            }
            
            // 端口范围
            if (port < 1 || port > 65535) {
                System.out.println("端口范围错误: " + port);
                return false;
            }
            
            // 邮箱格式
            if (!ValidatorUtils.isEmail(adminEmail)) {
                System.out.println("邮箱格式错误: " + adminEmail);
                return false;
            }
            
            return true;
        }
    }
    
    public static void main(String[] args) {
        ServerConfig config = new ServerConfig();
        config.host = "192.168.1.1";
        config.port = 8080;
        config.adminEmail = "admin@example.com";
        
        if (config.validate()) {
            System.out.println("配置校验通过");
        }
    }
}
```

## 正则表达式

工具类使用的正则表达式：

```java
手机号: ^1[3-9]\\d{9}$
邮箱: ^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$
数字: \\d+
字母: [a-zA-Z]+
字母数字下划线: \\w+
```

## 注意事项

### ⚠️ 正则性能

```java
// 频繁校验时可预编译正则
Pattern phonePattern = Pattern.compile("^1[3-9]\\d{9}$");
boolean valid = phonePattern.matcher("13812345678").matches();
```

### ⚠️ 手机号规则

```java
// 当前规则支持 13x-19x 开头
// 手机号规则可能变化，注意更新
```

## 相关工具

- [字符串工具](/modules/util/common/string) - 字符串处理
- [正则表达式](https://docs.oracle.com/javase/8/docs/api/java/util/regex/Pattern.html) - Java正则
