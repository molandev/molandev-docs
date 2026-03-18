# JSON 自动配置

`JsonAutoConfiguration` 是 molandev-spring 提供的 JSON 序列化自动配置,用于统一 Spring Boot 应用的 JSON 处理行为。

## 功能说明

JSON 自动配置会在启用后自动配置 Spring MVC 的 JSON 转换器，统一使用 [JSONUtils](./json.md) 的配置，确保整个应用的 JSON 序列化行为一致。

## 核心功能

### ✅ 统一 JSON 转换器

- 替换 Spring 默认的 `MappingJackson2HttpMessageConverter`
- 使用 [JSONUtils](./json.md) 的 JsonMapper 配置
- 确保 Controller 返回值和 @RequestBody 参数的 JSON 格式一致

### ✅ 时间格式统一

- **请求参数时间**: 支持 GET 请求参数中的时间类型自动转换
- **响应时间格式**: 统一使用 `yyyy-MM-dd HH:mm:ss` 格式
- **时区**: 统一使用 GMT+8（东八区）

### ✅ 字符编码

- 自动配置 UTF-8 字符编码过滤器
- 解决 Form 表单提交中文乱码问题
- 最高优先级（`HIGHEST_PRECEDENCE`）

## 配置项

### 启用配置

JSON 自动配置**默认关闭**，需要在配置文件中手动启用：

```yaml
# application.yml
molandev:
  autoconfig:
    json:
      enabled: true  # 启用 JSON 自动配置
```

或使用 properties 格式：

```properties
# application.properties
molandev.autoconfig.json.enabled=true
```

## 使用示例

### 示例 1: 统一响应格式

启用 JSON 配置后，所有 Controller 的返回值都会使用统一的 JSON 格式。

```java
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api")
public class UserController {
    
    @GetMapping("/user/{id}")
    public User getUser(@PathVariable Long id) {
        User user = new User();
        user.setId(id);
        user.setName("张三");
        user.setCreateTime(LocalDateTime.now());
        
        // 返回的 JSON 格式:
        // {
        //   "id": 1,
        //   "name": "张三",
        //   "createTime": "2024-01-18 14:30:00"
        // }
        return user;
    }
}
```

### 示例 2: 请求参数时间转换

启用配置后，GET 请求参数中的时间字符串会自动转换为对应的时间类型。

```java
@RestController
@RequestMapping("/api")
public class ReportController {
    
    // 支持 GET 请求参数中的时间类型
    @GetMapping("/report")
    public List<Order> getReport(
        @RequestParam LocalDate startDate,      // yyyy-MM-dd
        @RequestParam LocalDate endDate,        // yyyy-MM-dd
        @RequestParam LocalDateTime createTime  // yyyy-MM-dd HH:mm:ss
    ) {
        // 直接使用转换后的时间类型
        return orderService.queryByDateRange(startDate, endDate, createTime);
    }
    
    // 请求示例:
    // GET /api/report?startDate=2024-01-01&endDate=2024-01-31&createTime=2024-01-18 14:30:00
}
```

### 示例 3: 请求体 JSON 解析

POST 请求的 @RequestBody 也会使用统一的 JSON 配置。

```java
@RestController
@RequestMapping("/api")
public class OrderController {
    
    @PostMapping("/order")
    public Result createOrder(@RequestBody Order order) {
        // order.getCreateTime() 会自动解析为 LocalDateTime
        // 支持格式: "2024-01-18 14:30:00"
        
        orderService.save(order);
        return Result.success();
    }
}

@Data
class Order {
    private Long id;
    private String orderNo;
    private LocalDateTime createTime;  // 自动解析时间字符串
    private LocalDate deliveryDate;    // 自动解析日期字符串
}
```

### 示例 4: 列表数据响应

```java
@RestController
@RequestMapping("/api")
public class ProductController {
    
    @GetMapping("/products")
    public List<Product> getProducts() {
        // 返回的列表中所有时间字段都会格式化
        return productService.listAll();
    }
    
    // 响应 JSON 格式:
    // [
    //   {
    //     "id": 1,
    //     "name": "商品A",
    //     "createTime": "2024-01-18 14:30:00",
    //     "updateTime": "2024-01-18 15:00:00"
    //   },
    //   ...
    // ]
}
```

## 技术细节

### HTTP 消息转换器配置

```java
@Override
public void configureMessageConverters(List<HttpMessageConverter<?>> converters) {
    // 移除默认的 Jackson 转换器
    converters.removeIf(c -> c instanceof MappingJackson2HttpMessageConverter);
    
    // 添加使用 JSONUtils 配置的转换器
    MappingJackson2HttpMessageConverter converter = 
        new MappingJackson2HttpMessageConverter(JSONUtils.getJsonMapper());
    converter.setDefaultCharset(StandardCharsets.UTF_8);
    
    converters.add(converter);
}
```

### 时间参数格式化

```java
@Override
public void addFormatters(FormatterRegistry registry) {
    DateTimeFormatterRegistrar registrar = new DateTimeFormatterRegistrar();
    
    // 配置时间格式
    registrar.setTimeFormatter(DateTimeFormatter.ofPattern("HH:mm:ss"));
    registrar.setDateFormatter(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
    registrar.setDateTimeFormatter(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    
    registrar.registerFormatters(registry);
}
```

### 字符编码过滤器

```java
@Bean
public OrderedCharacterEncodingFilter characterEncodingFilter() {
    OrderedCharacterEncodingFilter filter = new OrderedCharacterEncodingFilter();
    filter.setEncoding("UTF-8");
    filter.setForceEncoding(true);
    filter.setOrder(Ordered.HIGHEST_PRECEDENCE);
    return filter;
}
```

## 支持的时间格式

| 时间类型 | 格式 | 示例 | 说明 |
|---------|------|------|------|
| LocalDateTime | yyyy-MM-dd HH:mm:ss | 2024-01-18 14:30:00 | 日期时间 |
| LocalDate | yyyy-MM-dd | 2024-01-18 | 日期 |
| LocalTime | HH:mm:ss | 14:30:00 | 时间 |
| Date | yyyy-MM-dd HH:mm:ss | 2024-01-18 14:30:00 | 旧版日期 |

## 注意事项

### ⚠️ 配置优先级

- JSON 自动配置在 `JacksonAutoConfiguration` 之前执行（`@AutoConfigureBefore`）
- 会替换 Spring Boot 默认的 Jackson 配置
- 如果你有自定义的 Jackson 配置，可能会被覆盖

### ⚠️ 默认关闭

为了不影响现有项目，JSON 自动配置**默认是关闭的**，需要手动启用：

```yaml
molandev:
  autoconfig:
    json:
      enabled: true  # 必须显式启用
```

### ⚠️ 字符编码

- 自动配置的字符编码过滤器优先级最高
- 确保请求和响应都使用 UTF-8 编码
- 可以解决 Form 表单提交中文乱码问题

### ⚠️ 兼容性

- 支持 Spring Boot 2.x 和 3.x
- 需要 `spring-boot-starter-web` 依赖
- 与大部分 JSON 相关的 Spring Boot 特性兼容

## 常见问题

### Q1: 启用 JSON 配置后，时间格式还是不对？

**A**: 检查以下几点：
1. 确认配置已生效（`molandev.autoconfig.json.enabled=true`）
2. 查看是否有其他 Jackson 配置覆盖了设置
3. 检查实体类字段上是否有 `@JsonFormat` 注解（会覆盖全局配置）

### Q2: 如何在启用配置的同时使用自定义格式？

**A**: 可以在特定字段上使用 `@JsonFormat` 注解：

```java
@Data
class Event {
    @JsonFormat(pattern = "yyyy/MM/dd HH:mm:ss")
    private LocalDateTime eventTime;  // 使用自定义格式
    
    private LocalDateTime createTime;  // 使用全局格式 yyyy-MM-dd HH:mm:ss
}
```

### Q3: GET 请求的时间参数格式不对怎么办？

**A**: 确保请求参数使用正确的格式：
- LocalDateTime: `2024-01-18 14:30:00`（注意空格）
- LocalDate: `2024-01-18`
- LocalTime: `14:30:00`

如果需要支持其他格式，可以使用 `@DateTimeFormat` 注解：

```java
@GetMapping("/report")
public Result getReport(
    @RequestParam 
    @DateTimeFormat(pattern = "yyyy/MM/dd")
    LocalDate date
) {
    // 支持 2024/01/18 格式
}
```

### Q4: 是否会影响现有项目？

**A**: 不会。JSON 配置默认关闭，只有显式启用后才会生效。

### Q5: 与 JSONUtils 的关系？

**A**: 
- [JSONUtils](./json.md) 是静态工具类，可以独立使用
- JSON 自动配置会将 JSONUtils 的配置应用到 Spring MVC
- 两者使用相同的 JsonMapper 配置，确保行为一致

## 最佳实践

### 1. 统一时间格式

在整个项目中统一使用 `yyyy-MM-dd HH:mm:ss` 格式，避免前后端时间格式不一致的问题。

### 2. 禁用其他 Jackson 配置

如果启用了 JSON 自动配置，建议移除其他自定义的 Jackson 配置，避免冲突。

### 3. 前端适配

前端在解析时间字符串时，需要按照 `yyyy-MM-dd HH:mm:ss` 格式处理：

```javascript
// JavaScript 示例
const dateString = "2024-01-18 14:30:00";
const date = new Date(dateString.replace(' ', 'T'));  // 转换为 ISO 格式
```

### 4. 测试验证

启用配置后，建议编写测试用例验证 JSON 序列化行为：

```java
@SpringBootTest
@AutoConfigureMockMvc
class JsonConfigTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    void testDateTimeFormat() throws Exception {
        mockMvc.perform(get("/api/user/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.createTime")
                .value(matchesPattern("\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}")));
    }
}
```

## 相关文档

- [JSON 工具](./json.md) - JSONUtils 详细文档
- [快速开始](./getting-started.md) - Spring 模块使用指南
- [XSS 防护](./xss.md) - XSS 自动配置

## 参考资料

- [Spring Boot Jackson 配置](https://docs.spring.io/spring-boot/docs/current/reference/html/howto.html#howto.spring-mvc.json)
- [Jackson 日期格式化](https://github.com/FasterXML/jackson-databind)
