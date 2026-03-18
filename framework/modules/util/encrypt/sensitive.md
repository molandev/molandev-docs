# 敏感信息脱敏工具

`SensitiveUtils` 提供常见敏感信息的脱敏处理功能，保护用户隐私数据。

## 类信息

- **包名**: `com.molandev.framework.util.encrypt`
- **类名**: `SensitiveUtils`
- **类型**: 静态工具类

## 使用场景

- ✅ 手机号脱敏显示
- ✅ 身份证号脱敏
- ✅ 银行卡号脱敏
- ✅ 邮箱地址脱敏
- ✅ 姓名脱敏
- ✅ 地址脱敏
- ✅ 密码隐藏

## 核心方法

### mobilePhone - 手机号脱敏

```java
public static String mobilePhone(String num)
```

**规则**: 保留前3位和后4位，中间用 `*` 代替

**示例**:
```java
SensitiveUtils.mobilePhone("13812345678");  // 138****5678
```

---

### idCardNum - 身份证号脱敏

```java
public static String idCardNum(String id)
```

**规则**: 保留前6位和后4位

**示例**:
```java
SensitiveUtils.idCardNum("340304199001011234");  // 340304*******1234
```

---

### email - 邮箱脱敏

```java
public static String email(String email)
```

**规则**: 只显示第一个字母，@ 前其他字符用 `*` 代替

**示例**:
```java
SensitiveUtils.email("demo@example.com");     // d**@example.com
SensitiveUtils.email("test123@gmail.com");    // t******@gmail.com
```

---

### bankCard - 银行卡号脱敏

```java
public static String bankCard(String cardNum)
```

**规则**: 保留前6位和后4位

**示例**:
```java
SensitiveUtils.bankCard("6222600123456781234");  // 622260**********1234
```

---

### chineseName - 中文姓名脱敏

```java
public static String chineseName(String fullName)
```

**规则**: 只显示最后一个汉字

**示例**:
```java
SensitiveUtils.chineseName("张三");      // *三
SensitiveUtils.chineseName("王大锤");    // **锤
SensitiveUtils.chineseName("李");        // *
```

---

### fixedPhone - 固定电话脱敏

```java
public static String fixedPhone(String num)
```

**规则**: 只显示后4位

**示例**:
```java
SensitiveUtils.fixedPhone("010-12345678");  // ****5678
```

---

### address - 地址脱敏

```java
public static String address(String address)
```

**规则**: 只显示前6个字符（通常是省市区）

**示例**:
```java
SensitiveUtils.address("北京市海淀区中关村大街1号");  // 北京市海淀区****
```

---

### password - 密码隐藏

```java
public static String password(String password)
```

**规则**: 全部用 `******` 代替

**示例**:
```java
SensitiveUtils.password("myPassword123");  // ******
SensitiveUtils.password("123");            // ******
```

---

### key - 密钥脱敏

```java
public static String key(String key)
```

**规则**: 只显示后3位，总长度固定为6位

**示例**:
```java
SensitiveUtils.key("abcdefxdS");  // ***xdS
SensitiveUtils.key("12");         // ***12
```

---

### desValue - 自定义脱敏

```java
public static String desValue(String origin, int prefixNoMaskLen, 
                               int suffixNoMaskLen, String maskStr)
```

**参数**:

| 参数名 | 类型 | 说明 |
|--------|------|------|
| origin | String | 原始字符串 |
| prefixNoMaskLen | int | 左侧保留位数 |
| suffixNoMaskLen | int | 右侧保留位数 |
| maskStr | String | 遮罩字符 |

**示例**:
```java
SensitiveUtils.desValue("1234567890", 2, 2, "*");  // 12******90
SensitiveUtils.desValue("abcdefgh", 3, 2, "#");    // abc###gh
```

## 完整示例

### 示例 1：用户信息展示

```java
import com.molandev.framework.util.encrypt.SensitiveUtils;

public class UserDisplay {
    
    public static class User {
        private String name;
        private String mobile;
        private String idCard;
        private String email;
        
        public String toSecureString() {
            return "User{" +
                   "name='" + SensitiveUtils.chineseName(name) + '\'' +
                   ", mobile='" + SensitiveUtils.mobilePhone(mobile) + '\'' +
                   ", idCard='" + SensitiveUtils.idCardNum(idCard) + '\'' +
                   ", email='" + SensitiveUtils.email(email) + '\'' +
                   '}';
        }
    }
    
    public static void main(String[] args) {
        User user = new User();
        user.name = "张三";
        user.mobile = "13812345678";
        user.idCard = "340304199001011234";
        user.email = "zhangsan@example.com";
        
        System.out.println(user.toSecureString());
        // User{name='*三', mobile='138****5678', 
        //      idCard='340304*******1234', email='z*******@example.com'}
    }
}
```

### 示例 2：日志脱敏

```java
import com.molandev.framework.util.encrypt.SensitiveUtils;

public class SecureLogger {
    
    /**
     * 脱敏后记录日志
     */
    public static void logUserInfo(String name, String mobile, String action) {
        String secureLog = String.format(
            "用户[%s]手机号[%s]进行了操作: %s",
            SensitiveUtils.chineseName(name),
            SensitiveUtils.mobilePhone(mobile),
            action
        );
        System.out.println(secureLog);
    }
    
    public static void main(String[] args) {
        logUserInfo("王大锤", "13987654321", "登录系统");
        // 用户[**锤]手机号[139****4321]进行了操作: 登录系统
        
        logUserInfo("李明", "18612345678", "修改密码");
        // 用户[*明]手机号[186****5678]进行了操作: 修改密码
    }
}
```

### 示例 3：导出数据脱敏

```java
import com.molandev.framework.util.encrypt.SensitiveUtils;
import java.util.ArrayList;
import java.util.List;

public class DataExport {
    
    public static class OrderInfo {
        String orderNo;
        String customerName;
        String customerPhone;
        String shippingAddress;
        
        public OrderInfo secure() {
            OrderInfo secured = new OrderInfo();
            secured.orderNo = this.orderNo;
            secured.customerName = SensitiveUtils.chineseName(this.customerName);
            secured.customerPhone = SensitiveUtils.mobilePhone(this.customerPhone);
            secured.shippingAddress = SensitiveUtils.address(this.shippingAddress);
            return secured;
        }
    }
    
    /**
     * 导出订单数据（脱敏）
     */
    public static List<OrderInfo> exportOrders(List<OrderInfo> orders) {
        List<OrderInfo> securedOrders = new ArrayList<>();
        for (OrderInfo order : orders) {
            securedOrders.add(order.secure());
        }
        return securedOrders;
    }
    
    public static void main(String[] args) {
        OrderInfo order = new OrderInfo();
        order.orderNo = "20240118001";
        order.customerName = "张三";
        order.customerPhone = "13812345678";
        order.shippingAddress = "北京市海淀区中关村大街1号";
        
        List<OrderInfo> orders = List.of(order);
        List<OrderInfo> exported = exportOrders(orders);
        
        System.out.println("导出数据已脱敏");
        // 实际导出的数据中敏感信息已被保护
    }
}
```

## 最佳实践

### ✅ 推荐做法

```java
// 1. 日志中使用脱敏
logger.info("用户{}登录", SensitiveUtils.chineseName(username));

// 2. 前端展示时脱敏
userVO.setMobile(SensitiveUtils.mobilePhone(user.getMobile()));

// 3. 导出数据时脱敏
exportData.setIdCard(SensitiveUtils.idCardNum(user.getIdCard()));
```

### ⚠️ 注意事项

```java
// ❌ 不要对已脱敏的数据再次脱敏
String masked = SensitiveUtils.mobilePhone("13812345678");
String doubleMasked = SensitiveUtils.mobilePhone(masked); // 错误

// ❌ 不要在数据库中存储脱敏后的数据
// 数据库应存储原始数据或加密数据，脱敏仅用于展示

// ✅ 脱敏是用于展示，加密是用于存储
String display = SensitiveUtils.mobilePhone(mobile);     // 展示用
String encrypted = AesUtil.encrypt(mobile, key);          // 存储用
```

## 性能说明

- **时间复杂度**: O(n)，n 为字符串长度
- **空间复杂度**: O(n)
- **线程安全**: 是

## 常见问题

### Q: 脱敏和加密有什么区别？

A:
- **脱敏**: 用于显示，不可逆，保护用户隐私
- **加密**: 用于存储，可逆，保护数据安全

### Q: 脱敏后的数据可以用于业务逻辑吗？

A: 不可以。脱敏数据仅用于展示，不能用于业务处理。

### Q: 如何自定义脱敏规则？

A: 使用 `desValue` 方法可以自定义脱敏规则：

```java
// 自定义：保留前1位和后1位
String custom = SensitiveUtils.desValue("1234567890", 1, 1, "*");
// 1********0
```

## 相关工具

- [AES 加密](/modules/util/encrypt/aes) - 数据加密存储
- [MD5 工具](/modules/util/encrypt/md5) - 数据摘要
- [字符串工具](/modules/util/common/string) - 字符串处理
