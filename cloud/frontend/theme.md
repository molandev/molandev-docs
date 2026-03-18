# 主题系统

MolanDev Cloud 前端提供了强大的主题系统，支持日间/夜间模式切换、灰色模式等功能。

## 功能特性

### 1. 日间/夜间模式切换

支持明暗两种主题模式，并提供炫酷的圆形扩散动画效果。

**特点：**
- ✅ 基于浏览器原生 **View Transition API** 实现
- ✅ 圆形扩散动画（从点击位置向四周扩散）
- ✅ 降级方案（不支持的浏览器直接切换）
- ✅ 主题配置自动持久化到 localStorage

::: tip TODO - 动画效果演示
**建议截图/GIF：** 录制主题切换时的圆形扩散动画效果，展示从点击按钮到主题完全切换的过程（约 2-3 秒）
:::

**使用方式：**

```vue
<template>
  <el-switch 
    v-model="setting.darkTheme" 
    @change="toggleDarkTheme('#theme-btn')" 
    id="theme-btn"
  />
</template>

<script setup>
import { useSettingStore } from '/@/stores/setting'

const { setting, toggleDarkTheme } = useSettingStore()
</script>
```

### 2. 灰色模式

支持一键切换全站灰度效果，常用于哀悼日或特殊纪念日。

**使用方式：**

```vue
<el-switch v-model="setting.grayscale" @change="onSettingChange" />
```

::: tip TODO - 灰色模式对比
**建议截图：** 正常模式和灰色模式的对比图（左右分屏或上下对比）
:::

### 3. 主题配置持久化

所有主题配置都会自动保存到 localStorage，用户下次访问时会自动应用。

**配置项包括：**
- 布局模式（竖版/横版）
- 显示 Logo
- 菜单折叠状态
- 菜单手风琴模式
- 固定 Header
- 暗黑主题
- 标签页开关
- 标签页图标
- 面包屑导航
- 面包屑图标
- 版权信息
- 灰色模式

## 主题设置面板

系统提供了一个完整的主题设置面板，用户可以在页面右上角点击设置图标打开。

::: tip TODO - 设置面板截图
**建议截图：** 打开的主题设置抽屉，展示所有配置选项（布局切换、菜单布局、顶栏布局等）
:::

**设置面板包含：**

1. **布局切换**
   - 竖版布局
   - 横版布局

2. **菜单布局**
   - 显示 Logo
   - 折叠菜单
   - 菜单手风琴

3. **顶栏布局**
   - 固定 Header
   - 开启面包屑
   - 面包屑图标
   - 开启标签页
   - 标签页图标

4. **其他设置**
   - 开启底部授权
   - 灰色模式

5. **操作**
   - 一键重置配置

## 浏览器兼容性

### View Transition API 支持

- ✅ Chrome 111+
- ✅ Edge 111+
- ✅ Opera 97+
- ❌ Firefox（尚不支持，使用降级方案）
- ❌ Safari（尚不支持，使用降级方案）

**降级策略：** 不支持 View Transition API 的浏览器会直接切换主题，没有动画效果，但功能完全正常。

## 总结

MolanDev Cloud 的主题系统提供了：

- ✅ **炫酷的切换动画**：基于 View Transition API
- ✅ **完整的配置选项**：支持多种主题配置
- ✅ **持久化存储**：用户配置自动保存
- ✅ **灰色模式**：特殊场景支持
- ✅ **良好的兼容性**：支持降级方案
- ✅ **易于扩展**：基于 CSS 变量

这为用户提供了极致的视觉体验和个性化选项！
