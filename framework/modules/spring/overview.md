# Spring 模块概览

molandev-spring 是 MolanDev Framework 的 Spring 集成模块,**专为 Spring Boot 项目设计**,提供了一系列开箱即用的工具类和自动配置功能。

## 模块定位

与 [molandev-util](../util/overview.md) 的零依赖设计不同,**molandev-spring 是基于 Spring 生态的增强模块**:

- **依赖 Spring Boot**：集成 Spring Boot Starter 和相关组件
- **自动配置支持**：提供 Spring Boot AutoConfiguration 机制
- **按需启用**：所有自动配置默认关闭，需手动配置启用
- **生产级工具**：面向企业级 Spring 应用的实际需求

## 核心功能

### 🛠️ 核心工具类

| 工具类 | 说明 | 主要特性 |
|-------|------|---------|
| [JSONUtils](./json.md) | JSON 序列化工具 | Jackson 封装、时间处理、泛型支持 |
| [TaskUtil](./task.md) | 任务调度工具 | 定时任务、延迟执行、虚拟线程支持 |
| [TreeUtil](./tree.md) | 树形结构工具 | 列表转树、Map/对象支持、自定义配置 |
| [SpringUtils](./spring.md) | Spring 容器工具 | Bean 获取、配置读取、事件发布 |
| [UserAgentUtil](./user-agent.md) | UA 解析工具 | 浏览器识别、设备类型、OS 检测 |

### ⚙️ 自动配置

| 配置项 | 说明 | 默认状态 |
|-------|------|---------|
| [XSS 防护](./xss.md) | 防止跨站脚本攻击 | 关闭（需配置启用） |
| [JSON 配置](./json-config.md) | 统一 JSON 序列化行为 | 关闭（需配置启用） |

## 快速开始

### 1. 引入依赖

```xml
<dependency>
    <groupId>com.molandev</groupId>
    <artifactId>molandev-spring</artifactId>
    <version>1.0.1</version>
</dependency>
```

### 2. 使用核心工具

```java
import com.molandev.framework.spring.json.JSONUtils;
import com.molandev.framework.spring.util.SpringUtils;

// JSON 序列化
String json = JSONUtils.toJsonString(user);
        User user = JSONUtils.toObject(json, User.class);

        // 获取 Spring Bean
        UserService userService = SpringUtils.getBean(UserService.class);

        // 读取配置
        String appName = SpringUtils.getProperty("spring.application.name");
```

### 3. 启用自动配置（可选）

```yaml
# application.yml
molandev:
  autoconfig:
    xss:
      enabled: true  # 启用 XSS 防护
      url-pattern: /*
      path-exclude-patterns:
        - /api/upload/**
```

## 模块特性

### ✅ 完全兼容 Spring Boot

- 使用 Spring Boot Starter 机制
- 支持 Spring Boot 3.x
- 自动配置遵循 Spring Boot 规范
- 配置提示支持（spring-configuration-metadata.json）

### ✅ 按需加载

- **所有自动配置默认关闭**，不会影响现有项目
- 通过配置文件灵活控制功能开关
- 不引入不必要的依赖和性能开销

### ✅ 生产级设计

- 高性能：使用缓存和优化算法
- 线程安全：所有工具类线程安全
- Java 21 支持：部分工具支持虚拟线程
- 完善的异常处理

### ✅ 易于使用

- 静态工具类设计，无需依赖注入
- 清晰的 API 命名
- 完整的文档和示例
- 详细的配置说明

## 应用场景

### 1. 企业级 Spring Boot 应用

```java
// 统一 JSON 处理
@RestController
public class UserController {
    @GetMapping("/user/{id}")
    public String getUser(@PathVariable Long id) {
        User user = userService.getUser(id);
        return JSONUtils.toJsonString(user);
    }
}
```

### 2. 数据权限树形结构

```java
// 构建部门树
@Service
public class DeptService {
    public List<DeptVO> getDeptTree() {
        List<Dept> depts = deptMapper.selectAll();
        return TreeUtil.buildTree(depts, DeptVO.class);
    }
}
```

### 3. 异步任务调度

```java
// 延迟发送通知
TaskUtil.invokeLater(() -> {
    notificationService.sendEmail(user);
}, Duration.ofMinutes(5));
```

### 4. 安全防护

```yaml
# 启用 XSS 防护
molandev:
  autoconfig:
    xss:
      enabled: true
```

## 与 Util 模块的对比

| 特性 | molandev-util | molandev-spring |
|-----|--------------|----------------|
| 依赖 | 零依赖 | 依赖 Spring Boot |
| 适用场景 | 任何 Java 项目 | Spring Boot 项目 |
| 功能定位 | 基础工具类 | Spring 增强工具 |
| 自动配置 | 无 | 有（默认关闭） |
| 配置管理 | 不支持 | 支持 |
| 容器集成 | 无 | 与 Spring 容器深度集成 |

## 技术栈

- **Spring Boot**:  3.x
- **Jackson**: JSON 处理
- **Spring Framework**: 核心功能
- **Jakarta Servlet**: Web 功能（可选）
- **CGLIB**: 对象操作

## 配置前缀

```yaml
molandev:
  autoconfig:
    xss:       # XSS 防护配置
    json:      # JSON 配置（预留）
    task:      # 任务调度配置（预留）
```

## 下一步

- [快速开始](./getting-started.md) - 详细的使用指南
- [JSON 工具](./json.md) - JSON 序列化和反序列化
- [任务调度](./task.md) - 定时任务和异步执行
- [XSS 防护](./xss.md) - 跨站脚本攻击防护

## 反馈与贡献

如果你在使用过程中遇到问题或有改进建议，欢迎通过以下方式联系我们：

- GitHub Issues: [提交问题](https://github.com/molandev/molandev-framework/issues)
- 邮件: support@molandev.com
