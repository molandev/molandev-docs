# 快速开始

本指南将帮助你在 5 分钟内完成多数据源模块的集成。

## 1. 添加依赖

在你的项目的 `pom.xml` 中引入 `molandev-datasource` 模块：

```xml
<dependency>
    <groupId>com.molandev</groupId>
    <artifactId>molandev-datasource</artifactId>
    <version>${molan.version}</version>
</dependency>
```

> **注意**：你需要同时引入你使用的数据库驱动（如 `mysql-connector-java`）和连接池实现（如 `HikariCP` 或 `Druid`）。

## 2. 基础配置

在 `application.yml` 中配置你的多个数据源。该模块通过 `molandev.datasource` 前缀进行配置。

```yaml
molandev:
  datasource:
    # 主库配置
    master:
      url: jdbc:mysql://localhost:3306/db_user
      username: root
      password: 123
      driver-class-name: com.mysql.cj.jdbc.Driver
      primary: true # 设为主数据源
      packages:
        - com.example.project.mapper.user
        - com.example.project.mapper.common
    
    # 业务库配置
    order:
      url: jdbc:mysql://localhost:3306/db_order
      username: root
      password: 123
      driver-class-name: com.mysql.cj.jdbc.Driver
      packages:
        - com.example.project.mapper.order
```

## 3. 包结构设计

为了使自动切换生效，请确保你的 Mapper 接口按照业务模块存放在不同的包下：

- `com.example.project.mapper.user.UserMapper` -> 自动路由到 **master** 库
- `com.example.project.mapper.order.OrderMapper` -> 自动路由到 **order**库

## 4. 运行验证

启动项目后，你可以通过调用不同包下的 Mapper 方法来验证路由是否生效。

如果你开启了 SQL 打印，你会发现对于不同的 Mapper，Spring 获取的是来自不同连接池的数据库连接。

## 常见问题

### Q: 如果一个包没有配置对应的映射关系会怎样？
A: 它将路由到配置了 `primary: true` 的主数据源。如果没有指定主数据源，则路由到配置列表中的第一个数据源。

### Q: 是否支持多级包匹配？
A: 支持。例如同时配置了 `com.example` 和 `com.example.order`，则位于 `order` 包下的 Mapper 会精准匹配到后者。

### Q: 为什么我的配置不生效？
A: 
1. 检查配置前缀是否为 `molandev.datasource`。
2. 确保 Mapper 的完整包名正确包含在 `packages` 列表中。
3. 确保你的项目扫描到了 `molandev-datasource` 的自动配置类。
