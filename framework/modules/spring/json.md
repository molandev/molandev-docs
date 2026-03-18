# JSON 工具

`JSONUtils` 是基于 Jackson 封装的 JSON 序列化和反序列化工具类，提供了简化的 API 和预配置的时间格式化。

## 类信息

- **包名**: `com.molandev.framework.spring.json`
- **类名**: `JSONUtils`
- **类型**: 静态工具类
- **依赖**: Jackson (com.fasterxml.jackson.*)

## 核心特性

### ✅ 预配置的时间格式

- **时区**: GMT+8（中国标准时间）
- **LocalDateTime**: `yyyy-MM-dd HH:mm:ss`
- **LocalDate**: `yyyy-MM-dd`
- **LocalTime**: `HH:mm:ss`
- **Date**: `yyyy-MM-dd HH:mm:ss`

### ✅ 宽松的反序列化

- 忽略未知属性（`FAIL_ON_UNKNOWN_PROPERTIES = false`）
- 自动处理多态类型（支持继承关系）

### ✅ 泛型支持

- 支持 `List<T>`、`Map<K,V>` 等复杂泛型
- 类型安全的反序列化

### ✅ 异常封装

- 将 `JsonProcessingException` 封装为 `RuntimeException`
- 无需手动处理检查型异常

## 核心方法

### 1. toJsonString

将对象序列化为 JSON 字符串。

```java
public static String toJsonString(Object object)
```

| 参数 | 类型 | 说明 |
|-----|------|------|
| object | Object | 要序列化的对象 |
| 返回值 | String | JSON 字符串 |

**示例**：

```java
User user = new User();
user.setId(1L);
user.setName("张三");
user.setCreateTime(LocalDateTime.now());

String json = JSONUtils.toJsonString(user);
// {"id":1,"name":"张三","createTime":"2024-01-18 14:30:00"}
```

### 2. toObject(String, Class)

将 JSON 字符串反序列化为指定类型的对象。

```java
public static <T> T toObject(String str, Class<T> clazz)
```

| 参数 | 类型 | 说明 |
|-----|------|------|
| str | String | JSON 字符串 |
| clazz | Class\<T> | 目标类型 |
| 返回值 | T | 反序列化后的对象 |

**示例**：

```java
String json = "{\"id\":1,\"name\":\"张三\",\"createTime\":\"2024-01-18 14:30:00\"}";
User user = JSONUtils.toObject(json, User.class);
```

### 3. toObject(String, Type)

将 JSON 字符串反序列化为指定泛型类型的对象。

```java
public static <T> T toObject(String str, Type type)
```

| 参数 | 类型 | 说明 |
|-----|------|------|
| str | String | JSON 字符串 |
| type | Type | 目标泛型类型 |
| 返回值 | T | 反序列化后的对象 |

**示例**：

```java
String json = "{\"code\":200,\"data\":{\"name\":\"张三\"}}";
Type type = new TypeToken<Response<User>>(){}.getType();
Response<User> response = JSONUtils.toObject(json, type);
```

### 4. toList

将 JSON 数组字符串反序列化为 List。

```java
public static <T> List<T> toList(String str, Type type)
```

| 参数 | 类型 | 说明 |
|-----|------|------|
| str | String | JSON 数组字符串 |
| type | Type | List 中元素的类型 |
| 返回值 | List\<T> | 反序列化后的 List |

**示例**：

```java
String json = "[{\"id\":1,\"name\":\"张三\"},{\"id\":2,\"name\":\"李四\"}]";
List<User> users = JSONUtils.toList(json, User.class);
```

### 5. toMap

将 JSON 字符串转换为 Map。

```java
public static Map<String, Object> toMap(String str)
```

| 参数 | 类型 | 说明 |
|-----|------|------|
| str | String | JSON 字符串 |
| 返回值 | Map\<String, Object> | 转换后的 Map |

**示例**：

```java
String json = "{\"name\":\"张三\",\"age\":25,\"active\":true}";
Map<String, Object> map = JSONUtils.toMap(json);
// {name=张三, age=25, active=true}
```

## 完整示例

### 示例 1: REST API 响应处理

```java
import com.molandev.framework.spring.json.JSONUtils;
import lombok.Data;

@RestController
@RequestMapping("/api")
public class UserController {

    @Autowired
    private UserService userService;

    // 返回 JSON 格式的用户信息
    @GetMapping("/user/{id}")
    public String getUser(@PathVariable Long id) {
        User user = userService.getById(id);
        return JSONUtils.toJsonString(user);
    }

    // 接收 JSON 格式的用户信息
    @PostMapping("/user")
    public User createUser(@RequestBody String json) {
        User user = JSONUtils.toObject(json, User.class);
        userService.save(user);
        return user;
    }

    // 批量处理
    @PostMapping("/users/batch")
    public List<User> batchCreate(@RequestBody String json) {
        List<User> users = JSONUtils.toList(json, User.class);
        userService.saveBatch(users);
        return users;
    }
}

@Data
class User {
    private Long id;
    private String name;
    private String email;
    private LocalDateTime createTime;
}
```

### 示例 2: Redis 缓存序列化

```java
import com.molandev.framework.spring.json.JSONUtils;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class CacheService {

    @Autowired
    private StringRedisTemplate redisTemplate;

    // 缓存对象
    public void cacheUser(User user) {
        String key = "user:" + user.getId();
        String json = JSONUtils.toJsonString(user);
        redisTemplate.opsForValue().set(key, json, 30, TimeUnit.MINUTES);
    }

    // 读取缓存
    public User getUser(Long id) {
        String key = "user:" + id;
        String json = redisTemplate.opsForValue().get(key);
        if (json != null) {
            return JSONUtils.toObject(json, User.class);
        }
        return null;
    }

    // 缓存列表
    public void cacheUserList(List<User> users) {
        String json = JSONUtils.toJsonString(users);
        redisTemplate.opsForValue().set("users:all", json);
    }

    // 读取列表缓存
    public List<User> getUserList() {
        String json = redisTemplate.opsForValue().get("users:all");
        if (json != null) {
            return JSONUtils.toList(json, User.class);
        }
        return Collections.emptyList();
    }
}
```

### 示例 3: 配置文件解析

```java
import com.molandev.framework.spring.json.JSONUtils;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Map;

@Component
public class ConfigLoader {

    // 加载 JSON 配置文件
    public AppConfig loadConfig(String configPath) throws IOException {
        String json = Files.readString(Paths.get(configPath));
        return JSONUtils.toObject(json, AppConfig.class);
    }

    // 加载动态配置（Map 形式）
    public Map<String, Object> loadDynamicConfig(String configPath) throws IOException {
        String json = Files.readString(Paths.get(configPath));
        return JSONUtils.toMap(json);
    }

    // 保存配置
    public void saveConfig(AppConfig config, String configPath) throws IOException {
        String json = JSONUtils.toJsonString(config);
        Files.writeString(Paths.get(configPath), json);
    }
}

@Data
class AppConfig {
    private String appName;
    private int port;
    private DatabaseConfig database;
    private List<String> allowedOrigins;
}
```

### 示例 4: MQ 消息序列化

```java
import com.molandev.framework.spring.json.JSONUtils;

@Service
public class MessageProducer {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    // 发送对象消息
    public void sendOrderMessage(Order order) {
        String json = JSONUtils.toJsonString(order);
        rabbitTemplate.convertAndSend("order.exchange", "order.created", json);
    }
}

@Service
public class MessageConsumer {

    // 接收并解析消息
    @RabbitListener(queues = "order.queue")
    public void handleOrderMessage(String json) {
        Order order = JSONUtils.toObject(json, Order.class);
        System.out.println("收到订单: " + order.getOrderNo());
        // 处理订单逻辑
    }
}
```

## 高级用法

### 自定义 JsonMapper

如果需要自定义 Jackson 配置，可以设置自己的 JsonMapper：

```java
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.molandev.framework.spring.json.JSONUtils;

@Configuration
public class JacksonConfig {

    @PostConstruct
    public void customizeJsonMapper() {
        JsonMapper customMapper = JsonMapper.builder()
                .defaultDateFormat(new SimpleDateFormat("yyyy/MM/dd"))
                .configure(SerializationFeature.INDENT_OUTPUT, true)  // 美化输出
                .build();

        JSONUtils.setJsonMapper(customMapper);
    }
}
```

### 获取底层 JsonMapper

```java
JsonMapper mapper = JSONUtils.getJsonMapper();
// 使用 mapper 进行更复杂的操作
```

## 技术细节

### 默认配置

```java
JsonMapper.builder()
    .addModule(new JsonJavaTimeModule())              // Java 8 时间支持
    .defaultTimeZone(TimeZone.getTimeZone("GMT+8"))   // 东八区
    .defaultLocale(Locale.CHINA)                      // 中国地区
    .defaultDateFormat(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss"))
    .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
    .build();
```

### 时间格式

| 类型 | 格式 | 示例 |
|-----|------|------|
| LocalDateTime | yyyy-MM-dd HH:mm:ss | 2024-01-18 14:30:00 |
| LocalDate | yyyy-MM-dd | 2024-01-18 |
| LocalTime | HH:mm:ss | 14:30:00 |
| Date | yyyy-MM-dd HH:mm:ss | 2024-01-18 14:30:00 |

## 注意事项

### ⚠️ 异常处理

JSONUtils 将 `JsonProcessingException` 封装为 `RuntimeException`，如果需要捕获异常：

```java
try {
    User user = JSONUtils.toObject(json, User.class);
} catch (RuntimeException e) {
    // JSON 解析失败
    log.error("JSON 解析失败", e);
}
```

### ⚠️ 循环引用

避免对象之间存在循环引用，否则会导致序列化失败或栈溢出。

```java
// 错误示例
class Parent {
    private Child child;
}
class Child {
    private Parent parent;  // 循环引用
}
```

### ⚠️ 性能考虑

- JSONUtils 内部使用单例 JsonMapper，线程安全且高性能
- 大对象序列化/反序列化会消耗较多内存和 CPU
- 建议对频繁使用的 JSON 进行缓存

### ⚠️ null 值处理

默认情况下，null 值会被序列化：

```java
User user = new User();
user.setName("张三");
// {"name":"张三","age":null,"email":null}
```

## 常见问题

### Q1: 如何处理未知字段？

**A**: JSONUtils 默认忽略未知字段，不会抛出异常。

```java
// JSON 中有 extra 字段，但 User 类没有
String json = "{\"name\":\"张三\",\"extra\":\"value\"}";
User user = JSONUtils.toObject(json, User.class);  // 正常解析，忽略 extra
```

### Q2: 如何处理枚举？

**A**: Jackson 默认使用枚举的 name() 进行序列化：

```java
enum Status { ACTIVE, INACTIVE }

User user = new User();
user.setStatus(Status.ACTIVE);
String json = JSONUtils.toJsonString(user);
// {"status":"ACTIVE"}
```

### Q3: 如何序列化泛型？

**A**: 使用 `toObject(String, Type)` 方法：

```java
Type type = new TypeToken<Response<List<User>>>(){}.getType();
Response<List<User>> response = JSONUtils.toObject(json, type);
```

### Q4: 时间格式不匹配怎么办？

**A**: 可以自定义 JsonMapper 或在实体类字段上使用 `@JsonFormat` 注解：

```java
@Data
class Event {
    @JsonFormat(pattern = "yyyy/MM/dd HH:mm:ss")
    private LocalDateTime eventTime;
}
```

## 相关工具

- [Spring 工具](./spring.md) - Spring 容器访问
- [任务调度](./task.md) - 异步任务执行
- [Util 模块 - StringUtils](../util/common/string.md) - 字符串处理

## 参考资料

- [Jackson 官方文档](https://github.com/FasterXML/jackson)
- [JSON 规范](https://www.json.org/)
