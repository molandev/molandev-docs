# 权限控制

MolanDev Cloud 实现了完整的前端权限控制体系，包括路由权限和按钮权限。

::: tip TODO - 权限流程演示
**建议流程图：** 从用户登录 → 获取权限 → 加载路由 → 动态菜单渲染 → 按钮权限控制的完整流程示意图
:::

## 权限体系

系统采用 RBAC（基于角色的访问控制）模型：

- **用户** - 系统使用者
- **角色** - 权限集合（如管理员、普通用户）
- **菜单权限** - 控制用户可访问的页面
- **按钮权限** - 控制用户可执行的操作

**关系：** 用户 → 角色 → 权限（菜单/按钮）

## 路由权限

### 动态路由加载

系统在用户登录后，根据权限动态加载路由和菜单。

**核心流程：**
1. 用户登录成功
2. 获取用户菜单列表（后端接口）
3. 转换菜单数据为前端路由格式
4. 使用 `router.addRoute` 动态添加路由
5. 渲染左侧菜单

**核心 Store：** `stores/routes.js` - 管理动态路由加载

### 路由守卫

使用 Vue Router 的 `beforeEach` 守卫进行权限校验：

- **白名单路由**：登录页、404 等无需权限
- **登录检查**：未登录跳转到登录页
- **路由加载**：首次访问时加载用户路由

**核心文件：** `router/index.js`

### 数据格式

**后端菜单数据示例：**

```json
[
  {
    "id": "1",
    "path": "/system",
    "component": "Layout",
    "title": "系统管理",
    "icon": "ele-Setting",
    "children": [
      {
        "id": "2",
        "path": "/system/user",
        "component": "system/user/index",
        "title": "用户管理",
        "icon": "ele-User",
        "cached": true
      }
    ]
  }
]
```

前端会将其转换为 Vue Router 的路由格式。

## 按钮权限

### 权限指令

系统提供了 4 个自定义指令用于控制按钮显示：

| 指令 | 说明 | 示例 |
|------|------|------|
| `v-auth` | 单个权限验证 | `v-auth="'system:user:add'"` |
| `v-auths` | 多个权限（满足一个） | `v-auths="['system:user:edit', 'system:user:update']"` |
| `v-auth-all` | 多个权限（全部满足） | `v-auth-all="['system:user:query', 'system:user:export']"` |
| `v-not-auth` | 反向权限（没有权限时显示） | `v-not-auth="'system:user:delete'"` |

**核心文件：** `utils/auth.js` - 权限判断函数和指令注册

**使用示例：**

```vue
<template>
  <!-- 单个权限 -->
  <el-button v-auth="'system:user:add'" @click="handleAdd">
    新增
  </el-button>
  
  <!-- 多个权限（满足一个） -->
  <el-button v-auths="['system:user:edit', 'system:user:update']">
    编辑
  </el-button>
  
  <!-- 多个权限（全部满足） -->
  <el-button v-auth-all="['system:user:query', 'system:user:export']">
    导出
  </el-button>
  
  <!-- 反向权限（没有权限时显示） -->
  <el-alert v-not-auth="'system:user:delete'" type="warning">
    您没有删除权限
  </el-alert>
</template>
```

::: tip TODO - 按钮权限演示
**建议截图：** 不同角色用户看到的同一页面中按钮显示差异（如管理员看到所有按钮，普通用户只看到部分按钮）
:::

### 权限函数

在 JavaScript 代码中可直接调用权限判断函数：

```javascript
import { auth, auths, authAll } from '@/utils/auth'

// 条件判断
if (auth('system:user:edit')) {
  // 有权限时执行
}

// 计算属性
const canEdit = computed(() => auth('system:user:edit'))
```

## 权限存储

### 用户信息和权限管理

用户登录后，系统将用户信息和权限码存储到：
- **Pinia Store** - 运行时状态管理
- **localStorage** - 持久化存储

**核心 Store：** `stores/userInfo.js`

**存储内容：**
- `token` - 身份令牌
- `userInfo` - 用户基本信息
- `permissionCodes` - 权限码列表（用于按钮权限判断）
- `roles` - 角色列表

### Token 管理

所有 HTTP 请求自动携带 Token：
- 请求拦截器添加 `Authorization` 头
- 响应拦截器处理 401（Token 过期）
- Token 过期自动跳转登录页

**核心文件：** `utils/request.js` - Axios 请求封装

## 权限规范

### 权限标识命名

采用三段式命名：`模块:功能:操作`

**示例：**
```
system:user:query   // 查询用户
system:user:add     // 新增用户
system:user:edit    // 编辑用户
system:user:delete  // 删除用户
```

### 权限粒度

- **页面级权限** - 控制菜单和路由访问
- **功能级权限** - 控制按钮和操作显示

### 安全性说明

**重要提示：** 前端权限控制仅用于界面展示优化，后端必须进行实际的权限校验。

## 总结

MolanDev Cloud 的权限控制系统提供了：

- ✅ 动态路由（根据权限加载）
- ✅ 路由守卫（自动校验访问权限）
- ✅ 按钮权限（4 种自定义指令）
- ✅ 权限函数（JavaScript 代码中判断）
- ✅ 权限持久化（Pinia + localStorage）
- ✅ Token 自动管理（请求拦截器）
