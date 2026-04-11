# 项目介绍

**MolanDev Backend** 是基于 **[MolanDev Framework](/framework/guide/introduction)** 构建的企业级管理系统，它不仅是一个可直接使用的管理系统，更是展示框架能力的完整示例。

## 🎯 项目定位

### 双重价值

1. **作为完整应用**：提供用户管理、权限控制、定时任务等开箱即用的功能
2. **作为框架示例**：展示如何使用 MolanDev Framework 构建可切换架构的应用

### 核心特性

- **双模部署**：一套代码，单体/微服务自由切换
- **前端现代化**：Vue 3 + Element Plus，支持主题切换、布局切换
- **权限完善**：RBAC 模型，支持菜单权限、接口权限、按钮权限
- **功能丰富**：字典翻译、操作日志、定时任务、文件管理、消息服务
- **开箱即用**：完整的企业级功能，可直接用于生产环境

## 🏗️ 技术架构

### 前端技术栈

- **Vue 3**：最新的 Vue 框架
- **Vite**：极速的构建工具
- **Element Plus**：企业级 UI 组件库
- **Pinia**：轻量级状态管理
- **Vue Router**：官方路由方案

### 后端技术栈

- **Spring Boot 3.x**：最新的 Spring Boot 版本
- **MyBatis Plus**：强大的持久层框架
- **Spring Cloud**：微服务全家桶（微服务模式）
- **Redis**：缓存与分布式锁
- **RabbitMQ**：消息中间件（微服务模式）
- **Nacos**：服务注册与配置中心（微服务模式）

### 核心依赖

- **MolanDev Framework**：自研的双模部署框架
  - `molandev-util`：工具类模块
  - `molandev-encrypt`：加密模块
  - `molandev-lock`：分布式锁
  - `molandev-datasource`：多数据源
  - `molandev-file`：文件存储
  - `molandev-rpc`：RPC 调用
  - `molandev-event`：事件总线
  - `molandev-spring`：Spring 集成

## 📦 项目结构

```
molandev-backend/
├── molandev-apis/              # API 接口定义
│   ├── base-api/               # 基础 API
│   └── ai-api/                 # AI 服务 API
│
├── molandev-base/              # 基础服务实现
│   ├── sys/                    # 系统管理模块
│   ├── file/                   # 文件服务模块
│   ├── msg/                    # 消息服务模块
│   └── job/                    # 任务调度模块
│
├── molandev-ai/                # AI 服务实现
├── molandev-gateway/           # 网关服务
├── molandev-common/            # 公共模块
└── molandev-standalone-service/ # 单体模式合并模块
```

## 🔥 核心特性演示

### 1. 双模部署

```yaml
# application.yml
molandev:
  run-mode: single  # 单体模式
  # run-mode: cloud  # 微服务模式
```

**一行配置，完成切换！**

### 2. 接口即服务

```java
// API 定义
@FeignClient(name = "${molandev.service-name.molandev-base:molandev-base}")
public interface UserApi {
    @GetMapping("/user/list")
    Page<UserDTO> list(@RequestBody UserQuery query);
}

// 服务实现（无需写 Controller）
@Service
public class UserServiceImpl implements UserApi {
    @Override
    public Page<UserDTO> list(UserQuery query) {
        // 业务逻辑
    }
}
```

### 3. 字典自动翻译

```java
// 后端
public class UserDTO {
    @DictFormat(type = "user_sex", field = "sexName")
    private Integer sex;  // 返回时自动添加 sexName: "男"
}

// 前端
<DictSelect v-model="form.sex" dictCode="user_sex" />
```

### 4. 操作日志

```java
@Log(title = "用户管理", businessType = BusinessType.INSERT)
public void addUser(SysUser user) {
    // 自动记录操作信息
}
```

### 5. 权限控制

```vue
<!-- 前端 -->
<el-button v-auth="'sys:user:add'">新增</el-button>
<el-button v-auths="['sys:user:edit', 'sys:user:delete']">操作</el-button>
```

## 🎨 前端特色

### 主题系统

- **日夜间模式**：带炫酷圆形扩散动画的主题切换
- **灰色模式**：一键切换全站灰度（哀悼模式）
- **配置持久化**：主题配置自动保存到 localStorage

### 布局系统

- **横版布局**：顶部菜单布局
- **竖版布局**：经典侧边栏布局
- **灵活配置**：菜单折叠、手风琴、固定 Header、Logo 显示等

### 标签页系统

- **多标签页**：自动记录访问过的页面
- **智能缓存**：基于 KeepAlive 的页面缓存
- **右键菜单**：刷新、关闭、关闭其他等操作

### 业务组件

- **DictSelect**：字典选择器，自动加载字典数据
- **IconSelector**：图标选择器，支持 Element Plus、iconfont、SVG
- **WangEditor**：富文本编辑器

## 🛡️ 后端特色

### 认证授权

- **RBAC 模型**：用户-角色-菜单的灵活权限体系
- **JWT 认证**：无状态的 Token 认证
- **网关鉴权**：统一的权限拦截
- **按钮权限**：细粒度的权限控制

### 业务功能

- **字典管理**：统一的数据字典，支持前后端自动翻译
- **操作日志**：自动记录用户操作，异步存储
- **定时任务**：DelayQueue 实现的轻量级任务调度
- **文件管理**：本地/云存储无缝切换，支持分片上传
- **消息服务**：站内消息推送，支持消息模板

## 📈 典型场景

### 场景一：创业公司快速启动

**第 1 天**：单体模式开发，本地调试，快速迭代  
**第 100 天**：业务增长，`mode=cloud`，拆分订单服务  
**第 365 天**：持续演进，按需拆分支付、库存等服务

### 场景二：学习最佳实践

- 如何使用 MolanDev Framework 构建应用
- 如何设计可切换的架构
- 如何实现 RBAC 权限模型
- 如何实现字典自动翻译
- 如何实现操作日志

### 场景三：直接生产使用

- 完整的企业级功能
- 经过真实项目验证
- 可直接部署到生产环境
- 可根据需求二次开发

## 🚀 快速开始

### 环境要求

- **JDK**：17 或更高版本
- **Node.js**：16 或更高版本
- **MySQL**：8.0 或更高版本
- **Redis**：6.0 或更高版本

### 快速启动

```bash
# 1. 克隆项目
git clone https://github.com/molandev/molandev-backend

# 2. 初始化数据库
mysql -u root -p < sql/molandev.sql

# 3. 启动后端（单体模式）
cd molandev-backend/molandev-standalone-service
mvn spring-boot:run

# 4. 启动前端
cd molandev-frontend
npm install
npm run dev
```

访问 `http://localhost:5173`，默认账号：`admin / admin123`

## 📚 下一步

- [环境准备](/cloud/guide/quick-start) - 详细的环境搭建指南
- [快速启动](/cloud/guide/getting-started) - 一步步启动项目
- [架构切换演示](/cloud/guide/dual-mode-demo) - 看看双模切换有多简单
- [前端介绍](/cloud/frontend/tech-stack) - 了解前端特色功能
- [后端介绍](/cloud/backend/tech-stack) - 了解后端核心能力

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request！

## 📄 开源协议

[MIT License](https://opensource.org/licenses/MIT)
