# 后端技术栈

MolanDev Backend 后端基于 **MolanDev Framework**，采用成熟的企业级技术栈，支持单体/微服务双模部署。

## 核心技术

### Spring Boot

- **版本**：3.5.x
- **特性**：
  - 自动配置
  - 内嵌容器
  - 生产级监控
  - 快速开发

### MyBatis Plus

- **版本**：3.5.x
- **特性**：
  - 强大的 CRUD 操作
  - 代码生成器
  - 分页插件
  - 多租户支持

### Spring Cloud（微服务模式）

- **版本**：2025.0.x
- **组件**：
  - **OpenFeign**：声明式 HTTP 客户端
  - **Gateway**：API 网关（WebFlux）
  - **LoadBalancer**：客户端负载均衡

### 中间件

- **Redis**：6.0+
  - 缓存
  - 分布式锁
  - 字典数据

- **RabbitMQ**：3.12+（微服务模式）
  - 服务间异步通信
  - 事件总线
  - 消息队列

- **Nacos**：2.3+（微服务模式）
  - 服务注册与发现
  - 配置中心
  - 动态配置

### MolanDev Framework

- **molandev-util**：工具类模块（零依赖）
- **molandev-encrypt**：加密模块
- **molandev-lock**：分布式锁
- **molandev-datasource**：多数据源
- **molandev-file**：文件存储
- **molandev-rpc**：RPC 调用
- **molandev-event**：事件总线
- **molandev-spring**：Spring 集成

## 项目结构

```
molandev-backend/
├── molandev-apis/              # API 接口定义
├── molandev-common/             # 公共模块
├── molandev-base/               # 基础服务（用户/角色/菜单/部门/文件/消息/任务）
├── molandev-ai/                 # AI 服务（知识库管理）
├── molandev-gateway/            # 微服务网关
├── molandev-standalone-service/ # 单体模式启动入口
└── deploy/                      # 部署配置
    ├── compose/                 # Docker Compose 配置
    ├── configs/                 # 配置文件
    └── sql/                     # 数据库脚本
```

## 核心依赖

```xml
<dependencies>
    <!-- Spring Boot -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
        <version>3.5.6</version>
    </dependency>
    
    <!-- MyBatis Plus -->
    <dependency>
        <groupId>com.baomidou</groupId>
        <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
        <version>3.5.12</version>
    </dependency>
    
    <!-- Spring Cloud（微服务模式） -->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-openfeign</artifactId>
    </dependency>
    
    <!-- MolanDev Framework -->
    <dependency>
        <groupId>com.molandev</groupId>
        <artifactId>molandev-util</artifactId>
        <version>1.0.1</version>
    </dependency>
    <!-- 其他框架模块... -->
</dependencies>
```

## 双模部署

### 单体模式

```yaml
# application-local.yml
molandev:
  run-mode: single        # 单体模式
  lock:
    type: memory          # 使用内存锁
  security:
    mode: LOCAL           # 本地认证模式
  datasource:
    sys:
      url: jdbc:mysql://localhost:3306/molandev_base
      username: root
      password: 123456
```

- **特点**：
  - 本地方法调用
  - 多数据源事务统一
  - 简单部署
  - 快速开发

### 微服务模式

```yaml
# application.yml
molandev:
  run-mode: cloud         # 微服务模式
  security:
    mode: CLOUD           # 云端认证模式

spring:
  cloud:
    nacos:
      discovery:
        server-addr: localhost:8848
```

- **特点**：
  - HTTP 远程调用
  - 服务独立部署
  - 弹性扩展
  - 故障隔离

## 核心特性

### 1. 双模部署

详见 [双模部署](/cloud/backend/dual-mode/design)

### 2. 认证授权

详见 [认证授权](/cloud/backend/auth/rbac)

### 3. 字典管理

详见 [字典管理](/cloud/backend/features/dict)

### 4. 操作日志

详见 [操作日志](/cloud/backend/features/log)

### 5. 定时任务

详见 [定时任务](/cloud/backend/features/job)

### 6. 文件管理

详见 [文件管理](/cloud/backend/features/file)

### 7. 消息服务

详见 [消息服务](/cloud/backend/features/message)

### 8. 事件驱动

详见 [事件驱动](/cloud/backend/features/event)

## 开发规范

### 包结构

```
com.molandev.{module}
├── controller/          # 控制器
├── service/             # 服务类（直接继承 ServiceImpl）
├── mapper/              # MyBatis Mapper
├── entity/              # 实体类
└── dto/                 # 数据传输对象
```

### 命名规范

- **实体类**：`SysUserEntity`
- **服务类**：`SysUserService`
- **Mapper**：`SysUserMapper`
- **Controller**：`SysUserController`

### 接口规范

- 使用 RESTful 风格
- 统一返回 `JsonResult<T>` 结果
- 统一异常处理
- 统一参数校验

### 代码注释

- 类注释：说明类的功能
- 方法注释：说明参数、返回值、异常
- 业务注释：说明复杂业务逻辑

## 下一步

- [双模部署](/cloud/backend/dual-mode/design) - 了解双模部署原理
- [RBAC 权限模型](/cloud/backend/auth/rbac) - 了解权限设计
- [字典管理](/cloud/backend/features/dict) - 了解字典功能
- [操作日志](/cloud/backend/features/log) - 了解日志记录
- [定时任务](/cloud/backend/features/job) - 了解任务调度
