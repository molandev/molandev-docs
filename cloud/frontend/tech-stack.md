# 前端技术栈

MolanDev Cloud 前端采用现代化的技术栈，提供极致的开发体验和用户体验。

## 核心技术

### Vue 3

- **版本**：3.5+
- **特性**：
  - Composition API
  - `<script setup>` 语法糖
  - TypeScript 支持（渐进式）
  - 性能优化

### Vite

- **版本**：5.0+
- **特性**：
  - 极速的冷启动
  - 即时的模块热更新
  - 真正的按需编译
  - 优化的构建输出

### Element Plus

- **版本**：2.8+
- **特性**：
  - 企业级 UI 组件
  - Vue 3 原生支持
  - 完善的主题定制
  - TypeScript 支持

### Pinia

- **版本**：2.2+
- **特性**：
  - 轻量级状态管理
  - 完整的 TypeScript 支持
  - 模块化设计
  - DevTools 支持

### Vue Router

- **版本**：4.4+
- **特性**：
  - 动态路由
  - 路由守卫
  - 路由懒加载
  - 历史模式

## 项目结构

```
frontend/
├── public/                    # 静态资源
│   └── iconfonts/            # 图标字体
│
├── src/
│   ├── api/                  # API 接口
│   │   ├── system/           # 系统管理 API
│   │   ├── login/            # 登录 API
│   │   └── ...
│   │
│   ├── assets/               # 资源文件
│   │   └── css/
│   │
│   ├── components/           # 全局组件
│   │   ├── DictSelect.vue    # 字典选择器
│   │   ├── IconSelector.vue  # 图标选择器
│   │   └── WangEditor.vue    # 富文本编辑器
│   │
│   ├── layout/               # 布局组件
│   │   ├── aside/            # 侧边栏
│   │   ├── navbar/           # 导航栏
│   │   ├── main/             # 主内容区
│   │   └── index.vue         # 布局入口
│   │
│   ├── router/               # 路由配置
│   │   └── index.js
│   │
│   ├── stores/               # 状态管理
│   │   ├── routes.js         # 路由状态
│   │   ├── setting.js        # 设置状态
│   │   └── userInfo.js       # 用户信息
│   │
│   ├── styles/               # 样式文件
│   │   ├── app.scss          # 全局样式
│   │   ├── base.scss         # 基础样式
│   │   └── index.scss        # 样式入口
│   │
│   ├── utils/                # 工具函数
│   │   ├── auth.js           # 权限工具
│   │   ├── request.js        # HTTP 请求
│   │   ├── storage.js        # 存储工具
│   │   └── ...
│   │
│   ├── views/                # 页面组件
│   │   ├── system/           # 系统管理
│   │   ├── login/            # 登录页
│   │   └── ...
│   │
│   ├── App.vue               # 根组件
│   └── main.js               # 入口文件
│
├── .env.development          # 开发环境配置
├── .env.production           # 生产环境配置
├── vite.config.js            # Vite 配置
└── package.json              # 依赖配置
```

## 核心依赖

```json
{
  "dependencies": {
    "vue": "^3.5.27",
    "vue-router": "^4.4.0",
    "pinia": "^2.2.0",
    "element-plus": "^2.8.0",
    "@element-plus/icons-vue": "^2.3.0",
    "axios": "^1.7.0",
    "@wangeditor/editor": "^5.1.0",
    "@wangeditor/editor-for-vue": "^5.1.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-vue": "^5.0.0",
    "sass": "^1.69.0"
  }
}
```

## 特色功能

### 1. 主题系统

详见 [主题系统](/cloud/frontend/theme)

### 2. 布局系统

详见 [布局系统](/cloud/frontend/layout)

### 3. 标签页系统

详见 [标签页系统](/cloud/frontend/tags-view)

### 4. 权限控制

详见 [权限控制](/cloud/frontend/permission)

### 5. 业务组件

详见 [业务组件](/cloud/frontend/components)

## 开发规范

### 组件命名

- **页面组件**：PascalCase，如 `UserList.vue`
- **通用组件**：PascalCase，如 `DictSelect.vue`
- **布局组件**：PascalCase，如 `VerticalLayout.vue`

### 样式规范

- 使用 SCSS
- 使用 BEM 命名规范
- 使用 CSS 变量进行主题定制

### API 调用

- 统一使用 `utils/request.js` 封装的 axios
- API 按模块划分到 `src/api/` 目录
- 使用 async/await 语法

### 状态管理

- 使用 Pinia 进行状态管理
- 按功能模块划分 store
- 使用 Composition API 风格

## 下一步

- [主题系统](/cloud/frontend/theme) - 了解主题切换功能
- [布局系统](/cloud/frontend/layout) - 了解布局配置
- [标签页系统](/cloud/frontend/tags-view) - 了解标签页功能
- [权限控制](/cloud/frontend/permission) - 了解权限控制方式
- [业务组件](/cloud/frontend/components) - 了解业务组件使用
