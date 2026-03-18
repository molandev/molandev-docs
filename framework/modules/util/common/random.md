# 随机数工具

`RandomUtils` 提供各种随机数据生成功能。

## 类信息

- **包名**: `com.molandev.framework.util`
- **类名**: `RandomUtils`
- **类型**: 静态工具类

## 使用场景

- ✅ 随机密码生成
- ✅ 验证码生成
- ✅ 测试数据生成
- ✅ 随机选择
- ✅ 唯一ID生成

## 核心方法

### randomString - 随机字符串

```java
public static String randomString(int length)
```

生成包含数字、大小写字母的随机字符串。

**示例**:
```java
String code = RandomUtils.randomString(8);
// 例如: "aB3xY9k2"
```

---

### randomNumberString - 随机数字字符串

```java
public static String randomNumberString(int length)
```

**示例**:
```java
String code = RandomUtils.randomNumberString(6);
// 例如: "123456"（验证码）
```

---

### randomMixString - 随机字母字符串

```java
public static String randomMixString(int length)
```

只包含字母（大小写混合）。

**示例**:
```java
String code = RandomUtils.randomMixString(8);
// 例如: "aBcDeFgH"
```

---

### randomLowerString / randomUpperString

```java
public static String randomLowerString(int length)
public static String randomUpperString(int length)
```

**示例**:
```java
String lower = RandomUtils.randomLowerString(6); // "abcdef"
String upper = RandomUtils.randomUpperString(6); // "ABCDEF"
```

---

### randomInt - 随机整数

```java
public static int randomInt(int bound)
```

**示例**:
```java
int dice = RandomUtils.randomInt(6) + 1; // 1-6
```

---

### randomLong - 随机长整数

```java
public static long randomLong(long min, long max)
```

**示例**:
```java
long id = RandomUtils.randomLong(100000, 999999);
// 100000-999999 之间的随机数
```

---

### randomDouble - 随机浮点数

```java
public static double randomDouble(double min, double max)
```

**示例**:
```java
double price = RandomUtils.randomDouble(9.9, 99.9);
```

---

### randomBoolean - 随机布尔值

```java
public static boolean randomBoolean()
```

**示例**:
```java
boolean flag = RandomUtils.randomBoolean(); // true或false
```

---

### randomElement - 随机选择元素

```java
public static <T> T randomElement(T... array)
public static <T> T randomElement(List<T> list)
```

**示例**:
```java
String color = RandomUtils.randomElement("红", "黄", "蓝", "绿");
List<String> list = List.of("A", "B", "C");
String item = RandomUtils.randomElement(list);
```

---

### randomChineseString - 随机中文

```java
public static String randomChineseString(int length)
```

**示例**:
```java
String name = RandomUtils.randomChineseString(3);
// 例如: "李明华"
```

---

### randomMobileNumber - 随机手机号

```java
public static String randomMobileNumber()
```

**示例**:
```java
String mobile = RandomUtils.randomMobileNumber();
// 例如: "13812345678"
```

---

### randomEmail - 随机邮箱

```java
public static String randomEmail()
```

**示例**:
```java
String email = RandomUtils.randomEmail();
// 例如: "aB3xY9k@gmail.com"
```

## 完整示例

### 示例 1：生成验证码

```java
import com.molandev.framework.util.RandomUtils;

public class VerificationCode {
    
    /**
     * 生成6位数字验证码
     */
    public static String generateCode() {
        return RandomUtils.randomNumberString(6);
    }
    
    /**
     * 生成混合验证码（不含易混淆字符）
     */
    public static String generateMixedCode(int length) {
        String code = RandomUtils.randomString(length);
        // 移除易混淆字符 0OIl1
        return code.replaceAll("[0OIl1]", "");
    }
    
    public static void main(String[] args) {
        System.out.println("数字验证码: " + generateCode());
        System.out.println("混合验证码: " + generateMixedCode(6));
    }
}
```

### 示例 2：生成测试数据

```java
import com.molandev.framework.util.RandomUtils;

public class TestDataGenerator {
    
    public static class User {
        String name;
        int age;
        String mobile;
        String email;
    }
    
    public static User generateUser() {
        User user = new User();
        user.name = RandomUtils.randomChineseString(3);
        user.age = RandomUtils.randomInt(50) + 18; // 18-67
        user.mobile = RandomUtils.randomMobileNumber();
        user.email = RandomUtils.randomEmail();
        return user;
    }
    
    public static void main(String[] args) {
        for (int i = 0; i < 5; i++) {
            User user = generateUser();
            System.out.printf("用户%d: %s, %d岁, %s, %s%n",
                i + 1, user.name, user.age, user.mobile, user.email);
        }
    }
}
```

### 示例 3：随机密码生成器

```java
import com.molandev.framework.util.RandomUtils;

public class PasswordGenerator {
    
    private static final String SPECIAL_CHARS = "!@#$%^&*";
    
    /**
     * 生成强密码（包含大小写、数字、特殊字符）
     */
    public static String generateStrongPassword(int length) {
        if (length < 8) {
            throw new IllegalArgumentException("密码长度至少8位");
        }
        
        // 确保包含各类字符
        StringBuilder password = new StringBuilder();
        password.append(RandomUtils.randomUpperString(1)); // 至少1个大写
        password.append(RandomUtils.randomLowerString(1)); // 至少1个小写
        password.append(RandomUtils.randomNumberString(1)); // 至少1个数字
        password.append(SPECIAL_CHARS.charAt(RandomUtils.randomInt(SPECIAL_CHARS.length()))); // 至少1个特殊字符
        
        // 填充剩余长度
        int remaining = length - 4;
        password.append(RandomUtils.randomString(remaining));
        
        // 打乱顺序
        return shuffleString(password.toString());
    }
    
    private static String shuffleString(String str) {
        char[] chars = str.toCharArray();
        for (int i = chars.length - 1; i > 0; i--) {
            int j = RandomUtils.randomInt(i + 1);
            char temp = chars[i];
            chars[i] = chars[j];
            chars[j] = temp;
        }
        return new String(chars);
    }
    
    public static void main(String[] args) {
        for (int i = 0; i < 5; i++) {
            System.out.println("密码" + (i+1) + ": " + generateStrongPassword(12));
        }
    }
}
```

### 示例 4：抽奖系统

```java
import com.molandev.framework.util.RandomUtils;
import java.util.List;

public class LotterySystem {
    
    public static class Prize {
        String name;
        double probability; // 概率
        
        public Prize(String name, double probability) {
            this.name = name;
            this.probability = probability;
        }
    }
    
    /**
     * 根据概率抽奖
     */
    public static String draw(List<Prize> prizes) {
        double random = RandomUtils.randomDouble(0, 1);
        double累积概率 = 0;
        
        for (Prize prize : prizes) {
            累积概率 += prize.probability;
            if (random <= 累积概率) {
                return prize.name;
            }
        }
        
        return "谢谢参与";
    }
    
    public static void main(String[] args) {
        List<Prize> prizes = List.of(
            new Prize("一等奖", 0.01),   // 1%
            new Prize("二等奖", 0.05),   // 5%
            new Prize("三等奖", 0.14),   // 14%
            new Prize("谢谢参与", 0.80)  // 80%
        );
        
        // 模拟100次抽奖
        int[] counts = new int[4];
        for (int i = 0; i < 100; i++) {
            String result = draw(prizes);
            switch (result) {
                case "一等奖": counts[0]++; break;
                case "二等奖": counts[1]++; break;
                case "三等奖": counts[2]++; break;
                case "谢谢参与": counts[3]++; break;
            }
        }
        
        System.out.println("抽奖结果统计（100次）：");
        System.out.println("一等奖: " + counts[0] + "次");
        System.out.println("二等奖: " + counts[1] + "次");
        System.out.println("三等奖: " + counts[2] + "次");
        System.out.println("谢谢参与: " + counts[3] + "次");
    }
}
```

## 注意事项

### ⚠️ 安全性

```java
// ❌ 不要用于加密密钥生成
String key = RandomUtils.randomString(16); // 不够安全

// ✅ 加密场景使用 SecureRandom
SecureRandom secureRandom = new SecureRandom();
byte[] key = new byte[16];
secureRandom.nextBytes(key);
```

### ⚠️ 随机性

```java
// 内部使用 java.util.Random
// 伪随机数，适合一般场景
// 不适合需要高安全性的场景（如加密）
```

## 性能说明

- **速度**: 快
- **随机性**: 伪随机（适合大多数场景）
- **线程安全**: 是

## 相关工具

- [字符串工具](/modules/util/common/string) - 字符串处理
- [MD5 工具](/modules/util/encrypt/md5) - 加盐哈希
