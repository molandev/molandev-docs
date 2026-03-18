# 敏感信息脱敏

敏感信息脱敏通过 **@Sensitive 注解**实现 JSON 序列化时的自动脱敏，保护用户隐私数据在接口返回时不被完整暴露。

## 功能说明

敏感信息脱敏基于 **Jackson 序列化器**实现，在对象序列化为 JSON 时自动脱敏，无需修改业务代码。

## 核心特性

### ✅ 自动脱敏

- **序列化时处理**：JSON 序列化时自动脱敏
- **对业务透明**：业务代码中仍是完整数据
- **仅影响输出**：不影响数据库存储和内部处理

### ✅ 多种类型

- **预设规则**：手机号、身份证、银行卡等9种类型
- **自定义规则**：可自定义保留长度和掩码字符
- **灵活配置**：不同字段可使用不同规则

### ✅ 易于使用

- **一个注解**：只需 @Sensitive 注解
- **零配置**：无需额外配置
- **类型安全**：编译期检查

## 使用示例

### 示例 1：预设类型

```java
import com.molandev.framework.encrypt.sensitive.Sensitive;
import com.molandev.framework.encrypt.sensitive.SensitiveTypes;
import lombok.Data;

@Data
public class UserVO {
    private Long id;
    private String username;
    
    @Sensitive(type = SensitiveTypes.MOBILE_PHONE)
    private String phone;  // 176****1234
    
    @Sensitive(type = SensitiveTypes.ID_CARD)
    private String idCard;  // 110***********1234
    
    @Sensitive(type = SensitiveTypes.EMAIL)
    private String email;  // s*****o@example.com
    
    @Sensitive(type = SensitiveTypes.BANK_CARD)
    private String bankCard;  // 622202************1234
    
    @Sensitive(type = SensitiveTypes.ADDRESS)
    private String address;  // 北京市********
}
```

**Controller**:

```java
@RestController
@RequestMapping("/api/user")
public class UserController {
    
    @GetMapping("/{id}")
    public UserVO getUser(@PathVariable Long id) {
        // 查询用户
        User user = userService.getById(id);
        
        // 转换为 VO
        UserVO vo = new UserVO();
        BeanUtils.copyProperties(user, vo);
        
        // ✅ 返回时自动脱敏
        return vo;
    }
}
```

**响应示例**:

```json
{
    "id": 1,
    "username": "zhangsan",
    "phone": "176****1234",
    "idCard": "110***********1234",
    "email": "s*****o@example.com",
    "bankCard": "622202************1234",
    "address": "北京市********"
}
```

### 示例 2：所有脱敏类型

```java
@Data
public class SensitiveDemo {
    
    @Sensitive(type = SensitiveTypes.CHINESE_NAME)
    private String name;  // 刘*华、徐*
    
    @Sensitive(type = SensitiveTypes.ID_CARD)
    private String idCard;  // 110***********1234
    
    @Sensitive(type = SensitiveTypes.MOBILE_PHONE)
    private String mobile;  // 176****1234
    
    @Sensitive(type = SensitiveTypes.FIXED_PHONE)
    private String fixedPhone;  // ****1234
    
    @Sensitive(type = SensitiveTypes.EMAIL)
    private String email;  // s*****o@xx.com
    
    @Sensitive(type = SensitiveTypes.BANK_CARD)
    private String bankCard;  // 622202************1234
    
    @Sensitive(type = SensitiveTypes.ADDRESS)
    private String address;  // 北京市海淀区********
    
    @Sensitive(type = SensitiveTypes.PASSWORD)
    private String password;  // ******
    
    @Sensitive(type = SensitiveTypes.KEY)
    private String apiKey;  // 【密钥】***abc
}
```

**测试效果**:

```java
@Test
public void testSensitive() throws JsonProcessingException {
    SensitiveDemo demo = new SensitiveDemo();
    demo.setName("刘德华");
    demo.setIdCard("110101199001011234");
    demo.setMobile("17612345678");
    demo.setFixedPhone("01012345678");
    demo.setEmail("someone@example.com");
    demo.setBankCard("6222021234567891234");
    demo.setAddress("北京市海淀区中关村大街1号");
    demo.setPassword("password123");
    demo.setApiKey("sk-123456abc");
    
    ObjectMapper objectMapper = new ObjectMapper();
    String json = objectMapper.writeValueAsString(demo);
    System.out.println(json);
}
```

**输出**:

```json
{
    "name": "刘*华",
    "idCard": "110***********1234",
    "mobile": "176****5678",
    "fixedPhone": "****5678",
    "email": "s*****e@example.com",
    "bankCard": "622202************1234",
    "address": "北京市海淀区********",
    "password": "******",
    "apiKey": "【密钥】***abc"
}
```

### 示例 3：自定义规则

```java
@Data
public class CustomSensitiveVO {
    
    // 保留前3位，后4位，中间用 * 替换
    @Sensitive(
        type = SensitiveTypes.CUSTOMER,
        preLength = 3,
        postLength = 4,
        maskStr = "*"
    )
    private String customField;  // 123****5678
    
    // 保留前6位，后0位，中间用 # 替换
    @Sensitive(
        type = SensitiveTypes.CUSTOMER,
        preLength = 6,
        postLength = 0,
        maskStr = "#"
    )
    private String anotherField;  // 北京市海淀######
}
```

### 示例 4：列表脱敏

```java
@RestController
@RequestMapping("/api/user")
public class UserController {
    
    @GetMapping("/list")
    public List<UserVO> list() {
        List<User> users = userService.list();
        
        // ✅ 列表中每个对象都会自动脱敏
        return users.stream()
            .map(user -> {
                UserVO vo = new UserVO();
                BeanUtils.copyProperties(user, vo);
                return vo;
            })
            .collect(Collectors.toList());
    }
}
```

**响应**:

```json
[
    {
        "id": 1,
        "username": "user1",
        "phone": "176****1234"
    },
    {
        "id": 2,
        "username": "user2",
        "phone": "138****5678"
    }
]
```

### 示例 5：嵌套对象脱敏

```java
@Data
public class OrderVO {
    private Long id;
    private String orderNo;
    private BigDecimal amount;
    
    // ✅ 嵌套对象也会脱敏
    private UserVO user;
}

@Data
public class UserVO {
    private Long id;
    private String username;
    
    @Sensitive(type = SensitiveTypes.MOBILE_PHONE)
    private String phone;
}
```

**响应**:

```json
{
    "id": 1,
    "orderNo": "202401180001",
    "amount": 100.00,
    "user": {
        "id": 1,
        "username": "zhangsan",
        "phone": "176****1234"  // ✅ 嵌套对象中的字段也脱敏
    }
}
```

### 示例 6：条件脱敏

```java
@Data
public class UserDetailVO {
    private Long id;
    private String username;
    
    // 根据权限决定是否脱敏
    private String phone;
    
    public UserDetailVO(User user, boolean isAdmin) {
        this.id = user.getId();
        this.username = user.getUsername();
        
        // 管理员返回完整手机号，普通用户脱敏
        if (isAdmin) {
            this.phone = user.getPhone();
        } else {
            this.phone = SensitiveUtils.mobilePhone(user.getPhone());
        }
    }
}
```

## 脱敏规则详解

### CHINESE_NAME（中文姓名）

- **规则**：保留姓，名字用 * 替换
- **示例**：
  - 刘德华 → 刘*华
  - 徐峥 → 徐*
  - 欧阳娜娜 → 欧阳**

### ID_CARD（身份证号）

- **规则**：保留前3位和后4位
- **示例**：110101199001011234 → 110***********1234

### MOBILE_PHONE（手机号）

- **规则**：保留前3位和后4位
- **示例**：17612345678 → 176****5678

### FIXED_PHONE（座机号）

- **规则**：保留后4位
- **示例**：01012345678 → ****5678

### EMAIL（电子邮箱）

- **规则**：保留前1位和 @ 后内容，中间用 * 替换
- **示例**：someone@example.com → s*****e@example.com

### BANK_CARD（银行卡号）

- **规则**：保留前6位和后4位
- **示例**：6222021234567891234 → 622202************1234

### ADDRESS（地址）

- **规则**：保留前6个字符
- **示例**：北京市海淀区中关村大街1号 → 北京市海淀区********

### PASSWORD（密码）

- **规则**：全部替换为 ******
- **示例**：任何密码 → ******

### KEY（密钥）

- **规则**：显示"【密钥】"，保留后3位
- **示例**：sk-123456abc → 【密钥】***abc

### CUSTOMER（自定义）

- **规则**：自定义保留长度和掩码
- **参数**：
  - `preLength`: 前置保留长度
  - `postLength`: 后置保留长度
  - `maskStr`: 掩码字符

## 技术细节

### Jackson 序列化器

```java
@JsonSerialize(using = SensitiveSerialize.class)
public @interface Sensitive {
    SensitiveTypes type() default SensitiveTypes.CUSTOMER;
    int preLength() default 0;
    int postLength() default 0;
    String maskStr() default "*";
}
```

### 序列化流程

```text
┌─────────────┐
│  业务对象    │
│  phone =    │
│  "176****"  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  Controller返回     │
│  return userVO;     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Jackson序列化      │
│  检测到@Sensitive   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  SensitiveSerialize │
│  调用脱敏方法       │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  JSON输出           │
│  "phone":"176****"  │
└─────────────────────┘
```

### 底层实现

```java
public class SensitiveSerialize extends JsonSerializer<String> 
    implements ContextualSerializer {
    
    @Override
    public void serialize(String origin, JsonGenerator jsonGenerator,
                         SerializerProvider serializerProvider) throws IOException {
        
        switch (sensitive.type()) {
            case MOBILE_PHONE:
                jsonGenerator.writeString(SensitiveUtils.mobilePhone(origin));
                break;
            case ID_CARD:
                jsonGenerator.writeString(SensitiveUtils.idCardNum(origin));
                break;
            // ... 其他类型
            case CUSTOMER:
                jsonGenerator.writeString(
                    SensitiveUtils.desValue(
                        origin, 
                        sensitive.preLength(), 
                        sensitive.postLength(), 
                        sensitive.maskStr()
                    )
                );
                break;
        }
    }
}
```

## 注意事项

### ⚠️ 仅用于输出

脱敏仅影响 JSON 输出，不影响：

- **数据库存储**：数据库中仍是完整数据
- **内部处理**：业务代码中仍是完整数据
- **日志输出**：需要单独处理日志脱敏

```java
User user = userService.getById(1);
System.out.println(user.getPhone());  // 完整手机号：17612345678

UserVO vo = new UserVO();
BeanUtils.copyProperties(user, vo);
System.out.println(vo.getPhone());  // 完整手机号：17612345678

String json = objectMapper.writeValueAsString(vo);  // JSON 中脱敏："176****5678"
```

### ⚠️ 仅支持 String 类型

@Sensitive 只能用于 String 类型字段：

```java
// ✅ 正确
@Sensitive(type = SensitiveTypes.MOBILE_PHONE)
private String phone;

// ❌ 错误：不支持其他类型
@Sensitive(type = SensitiveTypes.MOBILE_PHONE)
private Integer phone;
```

### ⚠️ 空值处理

如果字段值为 null，脱敏会跳过：

```java
UserVO vo = new UserVO();
vo.setPhone(null);  // null

String json = objectMapper.writeValueAsString(vo);
// {"phone": null}  // 保持 null
```

### ⚠️ 日志脱敏

需要单独配置日志脱敏：

```xml
<!-- logback-spring.xml -->
<configuration>
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="ch.qos.logback.core.encoder.LayoutWrappingEncoder">
            <layout class="com.molandev.framework.spring.log.SensitiveLogLayout">
                <pattern>%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n</pattern>
            </layout>
        </encoder>
    </appender>
</configuration>
```

## 常见问题

### Q1: 如何在日志中也脱敏？

**A**: 日志脱敏需要单独处理。可以：

1. 使用日志脱敏插件
2. 自定义 Logback Layout
3. 在记录日志前手动脱敏

```java
log.info("用户手机号: {}", SensitiveUtils.mobilePhone(user.getPhone()));
```

### Q2: 数据库存储的是密文，返回时还需要脱敏吗？

**A**: 不需要。数据库已加密的数据无需再脱敏。

### Q3: 如何根据权限控制脱敏？

**A**: 有两种方式：

1. **返回不同的 VO**：

```java
public Object getUser(Long id, boolean isAdmin) {
    User user = userService.getById(id);
    
    if (isAdmin) {
        return toAdminVO(user);  // 不脱敏
    } else {
        return toUserVO(user);  // 脱敏
    }
}
```

2. **手动脱敏**：

```java
public UserVO getUser(Long id, boolean isAdmin) {
    User user = userService.getById(id);
    UserVO vo = new UserVO();
    
    vo.setPhone(isAdmin ? user.getPhone() : SensitiveUtils.mobilePhone(user.getPhone()));
    
    return vo;
}
```

### Q4: 脱敏影响性能吗？

**A**: 影响很小。脱敏是字符串操作，耗时约 0.1ms/字段。

### Q5: 可以全局配置脱敏规则吗？

**A**: 目前不支持全局配置，需要在每个字段上添加注解。

## 相关工具

- [SensitiveUtils](../util/encrypt/sensitive.md) - 底层脱敏工具
- [数据库字段加密](./db-encrypt.md) - 配合使用更安全

## 参考资料

- [Jackson 自定义序列化](https://github.com/FasterXML/jackson-docs)
- [数据脱敏最佳实践](https://owasp.org/www-project-top-ten/)
