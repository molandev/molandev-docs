# 快速开始

本指南将帮助你快速上手 molandev-spring 模块,了解如何在 Spring Boot 项目中使用各种工具类和自动配置。

## 环境要求

- **JDK**: 17 或更高版本（推荐 JDK 21+）
- **Spring Boot**:  3.x
- **构建工具**: Maven 或 Gradle

## 安装

### Maven

在 `pom.xml` 中添加依赖：

```xml
<dependencies>
    <!-- MolanDev Spring -->
    <dependency>
        <groupId>com.molandev</groupId>
        <artifactId>molandev-spring</artifactId>
        <version>1.0.1</version>
    </dependency>
    
    <!-- Spring Boot Starter Web（如需 Web 功能） -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
</dependencies>
```

### Gradle

在 `build.gradle` 中添加依赖：

```gradle
dependencies {
    implementation 'com.molandev:molandev-spring:1.0.1'
    implementation 'org.springframework.boot:spring-boot-starter-web'
}
```

## 核心工具使用

### 1. JSON 工具

[JSONUtils](./json.md) 提供了强大的 JSON 序列化和反序列化功能。

```java
import com.molandev.framework.spring.json.JSONUtils;

public class UserService {

    // 对象转 JSON
    public String saveUser(User user) {
        String json = JSONUtils.toJsonString(user);
        redis.set("user:" + user.getId(), json);
        return json;
    }

    // JSON 转对象
    public User getUser(Long id) {
        String json = redis.get("user:" + id);
        return JSONUtils.toObject(json, User.class);
    }

    // JSON 转 List
    public List<User> getUserList(String json) {
        return JSONUtils.toList(json, User.class);
    }

    // JSON 转 Map
    public Map<String, Object> parseJson(String json) {
        return JSONUtils.toMap(json);
    }
}
```

### 2. Spring 工具

[SpringUtils](./spring.md) 提供了便捷的 Spring 容器访问方法。

```java
import com.molandev.framework.spring.util.SpringUtils;

public class ApplicationHelper {

    // 获取 Bean
    public void processData() {
        UserService userService = SpringUtils.getBean(UserService.class);
        userService.processUsers();
    }

    // 读取配置
    public String getAppConfig() {
        String appName = SpringUtils.getProperty("spring.application.name");
        String profile = SpringUtils.getProperty("spring.profiles.active", "dev");
        return appName + "-" + profile;
    }

    // 发布事件
    public void notifyUserCreated(User user) {
        SpringUtils.publishEvent(new UserCreatedEvent(user));
    }

    // 获取所有指定类型的 Bean
    public List<MessageHandler> getAllHandlers() {
        return SpringUtils.getBeansByType(MessageHandler.class);
    }
}
```

### 3. 任务调度

[TaskUtil](./task.md) 提供了灵活的任务调度功能，支持虚拟线程（Java 21+）。

```java
import com.molandev.framework.spring.task.TaskUtil;

import java.time.Duration;

public class NotificationService {

    // 立即异步执行
    public void sendWelcomeEmail(User user) {
        TaskUtil.invokeNow(() -> {
            emailService.send(user.getEmail(), "Welcome!");
        });
    }

    // 延迟执行
    public void sendDelayedNotification(String message) {
        TaskUtil.invokeLater(() -> {
            System.out.println(message);
        }, Duration.ofMinutes(5));
    }

    // 定时循环执行
    public void startHeartbeat() {
        TaskUtil.invokeLoopRate(() -> {
            System.out.println("Heartbeat: " + System.currentTimeMillis());
        }, Duration.ofSeconds(30));
    }

    // Cron 表达式执行
    public void scheduleDailyReport() {
        TaskUtil.invokeLater(() -> {
            generateReport();
        }, "0 0 2 * * ?");  // 每天凌晨2点执行
    }
}
```

### 4. 树形结构

[TreeUtil](./tree.md) 可以将扁平列表快速转换为树形结构。

```java
import com.molandev.framework.spring.tree.TreeUtil;
import com.molandev.framework.spring.tree.TreeId;
import com.molandev.framework.spring.tree.TreeParentId;
import com.molandev.framework.spring.tree.TreeChildren;

// 定义实体类
@Data
public class Department {
    @TreeId
    private Long id;

    @TreeParentId
    private Long parentId;

    private String name;

    @TreeChildren
    private List<Department> children;
}

// 使用
public class DepartmentService {

    public List<Department> getDeptTree() {
        // 从数据库查询所有部门（扁平列表）
        List<Department> allDepts = deptMapper.selectAll();

        // 转换为树形结构
        return TreeUtil.buildTree(allDepts);
    }

    // 转换为 Map 形式的树
    public List<Map<String, Object>> getDeptMapTree() {
        List<Department> allDepts = deptMapper.selectAll();
        return TreeUtil.buildMapTree(allDepts);
    }
}
```

### 5. UserAgent 解析

[UserAgentUtil](./user-agent.md) 可以解析浏览器和设备信息。

```java
import com.molandev.framework.spring.web.UserAgentUtil;
import jakarta.servlet.http.HttpServletRequest;

@RestController
public class StatisticsController {

    @GetMapping("/track")
    public void trackVisit(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");

        // 解析 UA 信息
        UserAgentUtil.UserAgentInfo info = UserAgentUtil.parse(userAgent);

        // 记录访问信息
        log.info("浏览器: {}, 版本: {}, 操作系统: {}, 设备类型: {}",
                info.getBrowser(),
                info.getBrowserVersion(),
                info.getOs(),
                info.getDeviceType());

        // 根据设备类型返回不同内容
        if (UserAgentUtil.isMobile(userAgent)) {
            // 返回移动端页面
        } else {
            // 返回桌面端页面
        }
    }
}
```

## 自动配置使用

### 启用 XSS 防护

[XSS 防护](./xss.md) 可以自动过滤请求参数中的恶意脚本。

#### 1. 配置文件启用

```yaml
# application.yml
molandev:
  autoconfig:
    xss:
      enabled: true                    # 启用 XSS 防护
      url-pattern: /*                  # 拦截路径
      path-exclude-patterns:           # 排除路径
        - /api/upload/**
        - /api/rich-text/**
      order: -2147483548               # 过滤器优先级
```

#### 2. 代码示例

```java
@RestController
public class ContentController {
    
    // 所有请求参数会自动过滤 XSS
    @PostMapping("/article")
    public Result createArticle(@RequestBody Article article) {
        // article.getContent() 已经过滤了 XSS 脚本
        articleService.save(article);
        return Result.success();
    }
    
    // 特定接口跳过 XSS 过滤
    @XssIgnore
    @PostMapping("/rich-content")
    public Result saveRichContent(@RequestBody Content content) {
        // 富文本编辑器内容，不进行 XSS 过滤
        contentService.save(content);
        return Result.success();
    }
}
```

## 完整示例

下面是一个综合使用多个工具的完整示例：

```java
package com.example.demo;

import com.molandev.framework.spring.json.JSONUtils;
import com.molandev.framework.spring.util.SpringUtils;
import com.molandev.framework.spring.task.TaskUtil;
import com.molandev.framework.spring.tree.TreeUtil;
import lombok.Data;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@SpringBootApplication
@RestController
public class DemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }

    // 1. JSON 处理示例
    @GetMapping("/users/{id}")
    public String getUser(@PathVariable Long id) {
        User user = new User();
        user.setId(id);
        user.setName("张三");
        user.setEmail("zhangsan@example.com");

        // 对象转 JSON
        return JSONUtils.toJsonString(user);
    }

    @PostMapping("/users")
    public User createUser(@RequestBody String json) {
        // JSON 转对象
        User user = JSONUtils.toObject(json, User.class);

        // 异步发送欢迎邮件
        TaskUtil.invokeLater(() -> {
            System.out.println("发送欢迎邮件给: " + user.getEmail());
        }, Duration.ofSeconds(10));

        return user;
    }

    // 2. 树形结构示例
    @GetMapping("/departments/tree")
    public List<Map<String, Object>> getDepartmentTree() {
        // 模拟从数据库查询
        List<Department> depts = List.of(
                new Department(1L, 0L, "总公司"),
                new Department(2L, 1L, "研发部"),
                new Department(3L, 1L, "销售部"),
                new Department(4L, 2L, "前端组"),
                new Department(5L, 2L, "后端组")
        );

        // 转换为树形结构
        return TreeUtil.buildMapTree(depts);
    }

    // 3. Spring 工具示例
    @GetMapping("/config")
    public Map<String, Object> getConfig() {
        return Map.of(
                "appName", SpringUtils.getProperty("spring.application.name"),
                "profile", SpringUtils.getProperty("spring.profiles.active", "default")
        );
    }

    // 4. UserAgent 解析示例
    @GetMapping("/device-info")
    public Map<String, String> getDeviceInfo(@RequestHeader("User-Agent") String userAgent) {
        var info = com.molandev.framework.spring.web.UserAgentUtil.parse(userAgent);
        return Map.of(
                "browser", info.getBrowser(),
                "version", info.getBrowserVersion(),
                "os", info.getOs(),
                "deviceType", info.getDeviceType()
        );
    }
}

@Data
class User {
    private Long id;
    private String name;
    private String email;
}

@Data
class Department {
    private Long id;
    private Long parentId;
    private String name;

    public Department(Long id, Long parentId, String name) {
        this.id = id;
        this.parentId = parentId;
        this.name = name;
    }
}
```

## 配置说明

### XSS 防护配置

```yaml
molandev:
  autoconfig:
    xss:
      enabled: false                   # 是否启用，默认 false
      url-pattern: /*                  # 拦截路径模式，默认 /*
      path-exclude-patterns: []        # 排除路径列表，默认空
      order: -2147483548               # 过滤器顺序，默认 Integer.MIN_VALUE + 100
```

## 常见问题

### Q1: JSONUtils 和 Jackson ObjectMapper 有什么区别？

**A**: JSONUtils 是对 Jackson 的封装，提供了：
- 预配置的时区和日期格式（GMT+8，yyyy-MM-dd HH:mm:ss）
- 简化的 API，无需处理异常
- 支持泛型的便捷方法
- 统一的序列化行为

### Q2: XSS 防护会影响性能吗？

**A**: 影响极小。XSS 过滤器只处理文本内容，使用高效的正则表达式，性能开销可以忽略不计。建议在生产环境启用。

### Q3: TaskUtil 支持持久化吗？

**A**: TaskUtil 是内存任务调度器，不支持持久化。如需持久化任务，建议使用 Quartz 或 XXL-JOB。

### Q4: TreeUtil 支持多根节点吗？

**A**: 支持。如果多个节点的 parentId 找不到对应的父节点，它们都会作为根节点返回。

### Q5: 如何自定义 JSONUtils 的配置？

**A**: 可以通过 `JSONUtils.setJsonMapper()` 设置自定义的 JsonMapper 实例：

```java
JsonMapper customMapper = JsonMapper.builder()
    .defaultDateFormat(new SimpleDateFormat("yyyy/MM/dd"))
    .build();
JSONUtils.setJsonMapper(customMapper);
```

## 下一步

- [JSON 工具详解](./json.md)
- [任务调度详解](./task.md)
- [树形结构详解](./tree.md)
- [XSS 防护配置](./xss.md)

## 获取帮助

如有问题，请访问：
- [GitHub Issues](https://github.com/molandev/molandev-framework/issues)
- [在线文档](https://docs.molandev.com)
