---
layout: home

hero:
  name: "MolanDev"
  text: "一套代码，单体与微服务自由切换"
  tagline: 革命性双模驱动架构 + 完整企业级应用 - 框架与实践的完美结合
  image:
    src: /logo.svg
    alt: MolanDev Logo
  actions:
    - theme: brand
      text: 框架文档
      link: /framework/guide/introduction
    - theme: alt
      text: 应用文档
      link: /cloud/guide/introduction
    - theme: alt
      text: 知识检索
      link: /knowledge/introduction
    - theme: alt
      text: GitHub
      link: https://github.com/molandev/molandev-cloud

features:
  - icon: 🔄
    title: 双模驱动架构（核心创新）
    details: 一套代码，单体与微服务自由切换。初期单体极速开发，后期微服务平滑演进，无需重构业务代码，仅需调整配置即可完成架构升级。

  - icon: 🧠
    title: 企业级 RAG 知识库
    details: 结构感知分片、混合检索（RRF 融合）、qwen3-rerank 重排序、上下文补全、多轮对话、引用溯源高亮。基于 Spring AI 构建，支持多种向量数据库与 LLM。

  - icon: 🎯
    title: 开箱即用的完整应用
    details: 基于框架构建的企业级管理系统，包含 RBAC 权限、字典翻译、操作日志、定时任务、文件管理等完整功能，可直接用于生产环境。

  - icon: 🔐
    title: 全链路安全
    details: RSA+AES混合加密、接口防篡改、数据库透明加解密、智能脱敏、网关统一认证，构建企业级安全堡垒。

  - icon: 🎨
    title: 现代化前端
    details: Vue 3 + Element Plus，支持日夜间主题切换、横竖版布局、标签页系统、权限指令，提供极致的用户体验。

  - icon: 📝
    title: 文档转换服务
    details: GraalVM 原生镜像，0.04s 启动，20MB 内存。封装 MarkItDown、LibreOffice、MinerU 三种工具，为 Java AI 应用提供完美的文档转 Markdown 能力。
---

## 什么是 MolanDev？

**MolanDev** 是一个完整的开源解决方案，包含：

- **MolanDev Framework**：支持单体/微服务自由切换的应用框架
- **MolanDev Cloud**：基于框架构建的企业级管理系统
- **MolanDev Knowledge**：企业级 RAG 知识库服务

这是一个"框架 + 应用 + AI"的完整生态，既展示了框架的强大能力，又提供了开箱即用的企业级应用和智能知识库。

## 🎯 双重价值

### 1. 作为框架使用

在你的项目中引入 MolanDev Framework，享受双模部署、全链路安全、智能多数据源等核心能力：

```xml
<dependency>
    <groupId>com.molandev</groupId>
    <artifactId>molandev-util</artifactId>
    <version>1.0.1</version>
</dependency>
```

### 2. 作为完整应用使用

直接部署 MolanDev Cloud，获得一个功能完善的企业级管理系统：

```bash
# 单体模式启动
cd backend/molandev-cloud-merge
mvn spring-boot:run

# 微服务模式启动
docker-compose up -d
```

## 🚀 核心特性演示

### 双模部署实战

```yaml
# application.yml
molandev:
  cloud:
    mode: merge  # 单体模式：本地调用
    # mode: cloud  # 微服务模式：HTTP 调用
```

一行配置切换，业务代码零改动！

### 接口即服务

```java
// 1. 定义 API 接口
@FeignClient(name = "user-service")
public interface UserApi {
    @GetMapping("/user/get")
    UserDTO getUserById(@RequestParam Long id);
}

// 2. 实现接口（无需写 Controller）
@Service
public class UserServiceImpl implements UserApi {
    @Override
    public UserDTO getUserById(Long id) {
        return userMapper.selectById(id);
    }
}

// 3. 单体模式：自动本地注入
// 4. 微服务模式：自动注册为 HTTP 接口
```

### 前端主题切换

- **日夜间模式**：带炫酷圆形扩散动画
- **布局切换**：横版/竖版布局一键切换
- **标签页系统**：智能缓存、右键菜单操作
- **权限指令**：`v-auth` 按钮级别权限控制

### 后端特色功能

- **RBAC 权限模型**：用户-角色-菜单的灵活权限体系
- **字典自动翻译**：`@DictFormat` 注解自动翻译代码值
- **操作日志**：`@Log` 注解自动记录操作信息
- **定时任务**：DelayQueue 实现的轻量级任务调度
- **文件管理**：本地/云存储无缝切换
- **消息服务**：站内消息推送系统

### 知识检索服务

基于 Spring AI 构建的企业级 RAG 知识库，具备以下核心能力：

- **智能文档摄入**：支持 PDF/Word/Excel/PPT/HTML 等多格式，结构感知分片保留语义完整性
- **混合检索**：ES 关键词 + 向量语义双路召回，RRF 融合算法
- **精准重排序**：集成 qwen3-rerank 模型，精排优化检索质量
- **上下文补全**：自动扩展相邻分片，构建完整语义片段
- **多轮对话**：历史问题组合检索，上下文连贯
- **引用溯源**：回答关联原文，支持精准高亮

## 📚 快速开始

### 查看框架文档

了解 MolanDev Framework 的设计理念和核心特性：

👉 [框架文档](/framework/guide/introduction)

### 查看应用文档

了解如何使用和部署 MolanDev Cloud：

👉 [应用文档](/cloud/guide/introduction)

## 💡 为什么选择 MolanDev？

### 🚀 解决架构演进痛点

**传统方案**：
- 初期微服务过度设计 ❌
- 后期重构推倒重来 ❌

**MolanDev**：
- 一套代码双模自适应 ✅
- 项目从 0 到 1 单体极速启动 ✅
- 从 1 到 N 微服务无缝演进 ✅

### 💡 核心优势

- **架构自由**：单体/微服务一行配置切换，业务代码零改动
- **开发高效**：单体模式本地调试如丝般顺滑，告别微服务调试地狱
- **平滑演进**：业务扩展时按需拆分，无需推翻重写
- **完整方案**：框架 + 应用 + 文档，学习与实践完美结合
- **生产验证**：真实项目验证，海量单元测试保障
- **MIT 协议**：完全开源，商业项目随意使用

## 📖 文档导航

- **框架文档**：了解框架的设计理念、核心模块、API 使用
- **应用文档**：了解完整应用的功能、架构、部署方式
- **知识检索**：了解 RAG 知识库的设计与使用
- **快速开始**：5 分钟快速体验双模切换
- **开发指南**：学习如何使用框架构建自己的应用

## 🌟 Star History

如果这个项目对你有帮助，请给我们一个 Star ⭐

## 📄 开源协议

[MIT License](https://opensource.org/licenses/MIT) - 自由使用，无任何限制
