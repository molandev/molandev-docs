# Spring 工具

`SpringUtils` 是一个便捷的 Spring 容器访问工具类，提供了静态方法来获取 Bean、读取配置、发布事件等功能。

## 类信息

- **包名**: `com.molandev.framework.spring.util`
- **类名**: `SpringUtils`
- **类型**: 静态工具类
- **依赖**: Spring Framework

## 核心特性

### ✅ Bean 管理

- 根据类型获取 Bean
- 根据名称获取 Bean
- 根据注解获取 Bean
- 判断 Bean 是否存在
- 获取所有指定类型的 Bean

### ✅ 配置管理

- 读取配置属性
- 判断配置是否存在
- 设置系统属性
- 获取所有配置

### ✅ 事件发布

- 发布 ApplicationEvent
- 发布普通对象事件

### ✅ 工具方法

- 获取代理对象的原始类
- 获取应用名称

## 核心方法

### 1. getBean (按类型)

根据类型获取 Spring Bean。

```java
public static <T> T getBean(Class<T> beanClass)
```

| 参数 | 类型 | 说明 |
|-----|------|------|
| beanClass | Class\<T> | Bean 的类型 |
| 返回值 | T | Bean 实例 |

**示例**：

```java
UserService userService = SpringUtils.getBean(UserService.class);
```

### 2. getBean (按名称)

根据名称获取 Spring Bean。

```java
public static Object getBean(String beanId)
```

| 参数 | 类型 | 说明 |
|-----|------|------|
| beanId | String | Bean 的名称 |
| 返回值 | Object | Bean 实例 |

**示例**：

```java
Object userService = SpringUtils.getBean("userService");
```

### 3. containsBean

判断是否包含指定类型的 Bean。

```java
public static boolean containsBean(Class<?> beanClass)
```

**示例**：

```java
if (SpringUtils.containsBean(RedisTemplate.class)) {
    // Redis 可用
}
```

### 4. getBeansByType

获取所有指定类型的 Bean。

```java
public static <T> List<T> getBeansByType(Class<T> beanClass)
```

**示例**：

```java
// 获取所有的消息处理器
List<MessageHandler> handlers = SpringUtils.getBeansByType(MessageHandler.class);
for (MessageHandler handler : handlers) {
    handler.handle(message);
}
```

### 5. getBeansByAnnotation

根据注解获取所有 Bean。

```java
public static Map<String, Object> getBeansByAnnotation(Class<? extends Annotation> annotation)
```

**示例**：

```java
// 获取所有标记了 @Component 的 Bean
Map<String, Object> components = SpringUtils.getBeansByAnnotation(Component.class);
```

### 6. getProperty

读取配置属性。

```java
public static String getProperty(String key)
public static String getProperty(String key, String defaultValue)
```

**示例**：

```java
String appName = SpringUtils.getProperty("spring.application.name");
String profile = SpringUtils.getProperty("spring.profiles.active", "dev");
```

### 7. hasProperty

判断配置是否存在。

```java
public static boolean hasProperty(String key)
```

**示例**：

```java
if (SpringUtils.hasProperty("spring.redis.host")) {
    // Redis 已配置
}
```

### 8. putProperty

设置系统属性（最高优先级）。

```java
public static void putProperty(String key, String value)
public static void putProperties(Map<String, String> props)
```

**示例**：

```java
SpringUtils.putProperty("custom.config", "value");
```

### 9. addProperty

添加属性（最低优先级，会被配置文件覆盖）。

```java
public static void addProperty(String key, String value)
```

**示例**：

```java
// 设置默认值，如果配置文件中没有配置则使用此值
SpringUtils.addProperty("server.port", "8080");
```

### 10. publishEvent

发布事件。

```java
public static void publishEvent(Object event)
public static void publishEvent(ApplicationEvent event)
```

**示例**：

```java
// 发布普通对象事件
SpringUtils.publishEvent(new UserCreatedEvent(user));

// 发布 ApplicationEvent
SpringUtils.publishEvent(new ApplicationEvent(source) {});
```

### 11. getApplicationName

获取应用名称。

```java
public static String getApplicationName()
```

**示例**：

```java
String appName = SpringUtils.getApplicationName();
```

### 12. getOriginClass

获取代理对象的原始类（处理 CGLIB 和 JDK 代理）。

```java
public static Class<?> getOriginClass(Class<?> clazz)
```

**示例**：

```java
Class<?> originalClass = SpringUtils.getOriginClass(proxyObject.getClass());
```

## 完整示例

### 示例 1: 在非 Spring 管理的类中获取 Bean

```java
public class UtilityHelper {
    
    // 在工具类中获取 Spring Bean
    public static void sendNotification(String message) {
        NotificationService notificationService = 
            SpringUtils.getBean(NotificationService.class);
        notificationService.send(message);
    }
    
    // 获取配置
    public static String getAppConfig() {
        String appName = SpringUtils.getProperty("spring.application.name");
        String profile = SpringUtils.getProperty("spring.profiles.active", "default");
        return appName + "-" + profile;
    }
}
```

### 示例 2: 动态获取所有实现类

```java
public interface PaymentProcessor {
    void process(Order order);
}

@Component
public class AlipayProcessor implements PaymentProcessor {
    @Override
    public void process(Order order) {
        // 支付宝支付逻辑
    }
}

@Component
public class WechatPayProcessor implements PaymentProcessor {
    @Override
    public void process(Order order) {
        // 微信支付逻辑
    }
}

@Service
public class PaymentService {
    
    public void processOrder(Order order) {
        // 获取所有支付处理器
        List<PaymentProcessor> processors = 
            SpringUtils.getBeansByType(PaymentProcessor.class);
        
        for (PaymentProcessor processor : processors) {
            if (supports(processor, order.getPaymentType())) {
                processor.process(order);
                break;
            }
        }
    }
}
```

### 示例 3: 事件发布和监听

```java
// 定义事件
@Data
@AllArgsConstructor
public class UserCreatedEvent {
    private User user;
}

// 发布事件
@Service
public class UserService {
    
    public void createUser(User user) {
        userMapper.insert(user);
        
        // 发布用户创建事件
        SpringUtils.publishEvent(new UserCreatedEvent(user));
    }
}

// 监听事件
@Component
public class UserEventListener {
    
    @EventListener
    public void handleUserCreated(UserCreatedEvent event) {
        User user = event.getUser();
        System.out.println("用户创建: " + user.getName());
        
        // 发送欢迎邮件
        emailService.sendWelcome(user);
    }
}
```

### 示例 4: 条件配置

```java
@Configuration
public class CustomConfig {
    
    @PostConstruct
    public void init() {
        // 根据环境设置默认配置
        if (!SpringUtils.hasProperty("app.timeout")) {
            SpringUtils.addProperty("app.timeout", "30000");
        }
        
        // 根据是否有 Redis 配置决定功能
        if (SpringUtils.containsBean(RedisTemplate.class)) {
            System.out.println("Redis 已启用");
        } else {
            System.out.println("Redis 未启用，使用内存缓存");
        }
    }
}
```

### 示例 5: 获取所有带注解的 Bean

```java
// 自定义注解
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface TaskHandler {
    String type();
}

// 使用注解
@Component
@TaskHandler(type = "email")
public class EmailTaskHandler {
    public void handle() {
        // 处理邮件任务
    }
}

@Component
@TaskHandler(type = "sms")
public class SmsTaskHandler {
    public void handle() {
        // 处理短信任务
    }
}

// 动态获取所有处理器
@Service
public class TaskDispatcher {
    
    private Map<String, Object> handlers;
    
    @PostConstruct
    public void init() {
        // 获取所有带 @TaskHandler 注解的 Bean
        handlers = SpringUtils.getBeansByAnnotation(TaskHandler.class);
        System.out.println("找到 " + handlers.size() + " 个任务处理器");
    }
    
    public void dispatch(String type) {
        for (Object handler : handlers.values()) {
            TaskHandler annotation = handler.getClass().getAnnotation(TaskHandler.class);
            if (annotation.type().equals(type)) {
                // 执行处理器
                break;
            }
        }
    }
}
```

## 技术细节

### ApplicationContext 注入

SpringUtils 通过 `ApplicationListener` 监听器在 Spring 容器初始化早期获取 ApplicationContext，这样设计的目的是**让 SpringUtils 更早加载**，方便在 Spring 初始化过程中使用。

#### spring.factories 配置

```properties
# META-INF/spring.factories
org.springframework.context.ApplicationListener=\
  com.molandev.framework.spring.util.SpringUtilAutoConfiguration
```

#### 监听器实现

```java
@Order(Integer.MIN_VALUE)
public class SpringUtilAutoConfiguration implements ApplicationListener<ApplicationPreparedEvent> {
    
    @Override
    public void onApplicationEvent(ApplicationPreparedEvent event) {
        // 在 ApplicationPreparedEvent 阶段注入 ApplicationContext
        ConfigurableApplicationContext applicationContext = event.getApplicationContext();
        SpringUtils.setApplicationContext(applicationContext);
        
        // 注册自定义配置属性源（最低优先级）
        MapPropertySource mapPropertySource = new MapPropertySource(
            "customPropertySource", 
            SpringUtils.getCustomProperty()
        );
        applicationContext.getEnvironment().getPropertySources().addLast(mapPropertySource);
    }
}
```

#### 为什么使用 ApplicationListener？

1. **更早的加载时机**：`ApplicationPreparedEvent` 在 Bean 定义加载完成后、Bean 实例化之前触发
2. **方便在初始化中使用**：可以在 `@PostConstruct`、`InitializingBean` 等初始化阶段使用 SpringUtils
3. **独立于 Bean 生命周期**：不依赖 Spring Bean 的创建顺序
4. **支持配置注入**：可以在早期阶段注入自定义配置

#### Spring 启动流程中的位置

```text
SpringApplication.run()
  ├─ prepareContext()              
  │   └─ ApplicationPreparedEvent  ← SpringUtils 在此初始化
  │       └─ SpringUtils.setApplicationContext()
  ├─ refreshContext()              
  │   ├─ Bean 定义扫描
  │   ├─ Bean 实例化              ← 此时 SpringUtils 已可用
  │   ├─ @PostConstruct           ← 可以使用 SpringUtils
  │   └─ InitializingBean         ← 可以使用 SpringUtils
  └─ ApplicationStartedEvent
```

### 代理类处理

Spring 的 Bean 可能被 CGLIB 或 JDK 动态代理，`getOriginClass` 可以获取原始类：

```java
// CGLIB 代理类名: UserService$$EnhancerBySpringCGLIB$$xxxxx
// JDK 代理类名: $Proxy123

Class<?> originalClass = SpringUtils.getOriginClass(proxyClass);
```

### 配置优先级

1. **系统属性** (putProperty) - 最高优先级
2. **配置文件** (application.yml/properties)
3. **自定义属性** (addProperty) - 最低优先级

## 注意事项

### ⚠️ 使用时机

SpringUtils 依赖 Spring 容器已初始化，在以下时机**不可用**：
- 静态代码块
- 构造函数（部分情况）
- ApplicationContext 初始化之前

推荐在 `@PostConstruct` 或业务方法中使用。

### ⚠️ Bean 依赖循环

使用 `getBean` 可能导致循环依赖，建议使用 `@Autowired` 或构造函数注入。

### ⚠️ 性能

频繁调用 `getBean` 会有性能开销，建议：
- 在初始化时获取并缓存 Bean
- 优先使用依赖注入

### ⚠️ 多例 Bean

`getBean` 获取多例（Prototype）Bean 时，每次都会创建新实例。

## 常见问题

### Q1: 什么时候使用 SpringUtils？

**A**: 适用场景：
- 工具类中需要访问 Spring Bean
- 动态获取 Bean（如插件系统）
- 非 Spring 管理的类中需要 Spring 功能

**不适用**：
- 普通 Service/Controller（使用 @Autowired）
- 性能敏感的场景（使用依赖注入）

### Q2: getBean 找不到 Bean 怎么办？

**A**: 检查：
1. Bean 是否已注册（@Component、@Service 等）
2. 组件扫描路径是否正确
3. 是否存在条件注解未满足（@ConditionalOnXxx）

### Q3: 如何在静态方法中使用 Spring Bean？

**A**: 

```java
public class StaticHelper {
    
    private static UserService userService;
    
    @Autowired
    public void setUserService(UserService service) {
        StaticHelper.userService = service;
    }
    
    public static void doSomething() {
        // 或者使用 SpringUtils
        UserService service = SpringUtils.getBean(UserService.class);
    }
}
```

### Q4: 配置读取为空怎么办？

**A**: 确保：
1. 配置文件路径正确
2. Spring Boot 已启动
3. 配置 key 正确（区分大小写）

### Q5: 事件监听器没有被触发？

**A**: 检查：
1. 监听器类是否被 Spring 管理（@Component）
2. 方法是否有 @EventListener 注解
3. 事件对象类型是否匹配

## 相关工具

- [JSON 工具](./json.md) - JSON 序列化
- [任务调度](./task.md) - 异步任务
- [树形结构](./tree.md) - 树形数据处理

## 参考资料

- [Spring ApplicationContext](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/ApplicationContext.html)
- [Spring Events](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#context-functionality-events)
