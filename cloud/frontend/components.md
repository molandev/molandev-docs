# 业务组件

MolanDev Cloud 封装了一系列常用的业务组件,开箱即用,提升开发效率。

## 字典选择器 (DictSelect)

### 功能特性

基于 Element Plus Select 封装的字典选择器，自动从后端获取字典数据并渲染。

**特点：**
- ✅ 自动加载字典数据
- ✅ 支持单选/多选
- ✅ 支持搜索过滤
- ✅ 支持禁用选项
- ✅ 字典数据缓存

### 使用方式

```vue
<template>
  <div>
    <!-- 基础用法 -->
    <DictSelect 
      v-model="form.gender" 
      dict-type="sys_user_gender" 
    />
    
    <!-- 多选 -->
    <DictSelect 
      v-model="form.roles" 
      dict-type="sys_user_role" 
      multiple 
    />
    
    <!-- 可搜索 -->
    <DictSelect 
      v-model="form.status" 
      dict-type="sys_user_status" 
      filterable 
    />
    
    <!-- 自定义样式 -->
    <DictSelect 
      v-model="form.type" 
      dict-type="sys_notice_type" 
      placeholder="请选择通知类型"
      clearable
      style="width: 200px"
    />
  </div>
</template>

<script setup>
const form = reactive({
  gender: '',
  roles: [],
  status: '',
  type: ''
})
</script>
```

### 组件实现

```vue
<!-- components/DictSelect.vue -->
<template>
  <el-select
    v-model="modelValue"
    :placeholder="placeholder"
    :multiple="multiple"
    :filterable="filterable"
    :clearable="clearable"
    @change="handleChange"
  >
    <el-option
      v-for="item in dictData"
      :key="item.value"
      :label="item.label"
      :value="item.value"
      :disabled="item.disabled"
    />
  </el-select>
</template>

<script setup>
import { getDictData } from '@/api/system/dict'

const props = defineProps({
  modelValue: [String, Number, Array],
  dictType: {
    type: String,
    required: true
  },
  placeholder: {
    type: String,
    default: '请选择'
  },
  multiple: Boolean,
  filterable: Boolean,
  clearable: Boolean
})

const emit = defineEmits(['update:modelValue', 'change'])

const dictData = ref([])

// 获取字典数据
async function fetchDictData() {
  try {
    const { data } = await getDictData(props.dictType)
    dictData.value = data.map(item => ({
      label: item.dictLabel,
      value: item.dictValue,
      disabled: item.status === '1'
    }))
  } catch (error) {
    console.error('获取字典数据失败:', error)
  }
}

function handleChange(value) {
  emit('update:modelValue', value)
  emit('change', value)
}

onMounted(() => {
  fetchDictData()
})
</script>
```

### 字典数据格式

**后端返回格式：**

```json
[
  {
    "dictCode": 1,
    "dictLabel": "男",
    "dictValue": "0",
    "dictType": "sys_user_gender",
    "status": "0",
    "remark": "性别男"
  },
  {
    "dictCode": 2,
    "dictLabel": "女",
    "dictValue": "1",
    "dictType": "sys_user_gender",
    "status": "0",
    "remark": "性别女"
  }
]
```

## 图标选择器 (IconSelector)

### 功能特性

可视化图标选择器，支持搜索和预览。

**特点：**
- ✅ 支持 Element Plus 图标
- ✅ 支持自定义 SVG 图标
- ✅ 搜索过滤
- ✅ 分页显示
- ✅ 实时预览

### 使用方式

```vue
<template>
  <div>
    <!-- 基础用法 -->
    <IconSelector v-model="form.icon" />
    
    <!-- 自定义大小 -->
    <IconSelector 
      v-model="form.icon" 
      size="large" 
    />
    
    <!-- 禁用状态 -->
    <IconSelector 
      v-model="form.icon" 
      disabled 
    />
  </div>
</template>

<script setup>
const form = reactive({
  icon: 'ele-User'
})
</script>
```

### 组件实现

```vue
<!-- components/IconSelector.vue -->
<template>
  <div class="icon-selector">
    <el-input
      v-model="selectedIcon"
      placeholder="点击选择图标"
      readonly
      @click="dialogVisible = true"
    >
      <template #prefix>
        <el-icon v-if="selectedIcon">
          <component :is="selectedIcon" />
        </el-icon>
      </template>
    </el-input>
    
    <el-dialog
      v-model="dialogVisible"
      title="选择图标"
      width="800px"
    >
      <!-- 搜索 -->
      <el-input
        v-model="searchKey"
        placeholder="搜索图标"
        clearable
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <!-- 图标列表 -->
      <div class="icon-list">
        <div
          v-for="icon in filteredIcons"
          :key="icon"
          :class="{ active: selectedIcon === icon }"
          class="icon-item"
          @click="selectIcon(icon)"
        >
          <el-icon :size="24">
            <component :is="icon" />
          </el-icon>
          <span class="icon-name">{{ icon }}</span>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSelect">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import * as ElementPlusIcons from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: String
})

const emit = defineEmits(['update:modelValue'])

const dialogVisible = ref(false)
const selectedIcon = ref(props.modelValue)
const searchKey = ref('')

// 所有图标列表
const allIcons = Object.keys(ElementPlusIcons)

// 过滤后的图标列表
const filteredIcons = computed(() => {
  if (!searchKey.value) {
    return allIcons
  }
  return allIcons.filter(icon =>
    icon.toLowerCase().includes(searchKey.value.toLowerCase())
  )
})

function selectIcon(icon) {
  selectedIcon.value = icon
}

function confirmSelect() {
  emit('update:modelValue', selectedIcon.value)
  dialogVisible.value = false
}

watch(() => props.modelValue, (val) => {
  selectedIcon.value = val
})
</script>

<style scoped>
.icon-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  margin-top: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.icon-item:hover,
.icon-item.active {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.icon-name {
  margin-top: 5px;
  font-size: 12px;
  text-align: center;
}
</style>
```

## SVG 图标组件 (SvgIcon)

### 功能特性

用于显示自定义 SVG 图标。

**特点：**
- ✅ 自动引入 SVG 文件
- ✅ 支持动态颜色
- ✅ 支持动态大小
- ✅ 支持 hover 效果

### 使用方式

```vue
<template>
  <div>
    <!-- 基础用法 -->
    <SvgIcon name="user" />
    
    <!-- 自定义大小和颜色 -->
    <SvgIcon 
      name="setting" 
      size="24px" 
      color="#409eff" 
    />
    
    <!-- 在按钮中使用 -->
    <el-button>
      <SvgIcon name="add" />
      <span>新增</span>
    </el-button>
  </div>
</template>
```

### 组件实现

```vue
<!-- components/svgicon/index.vue -->
<template>
  <svg 
    :style="{ width: size, height: size, fill: color }" 
    class="svg-icon"
    aria-hidden="true"
  >
    <use :xlink:href="`#icon-${name}`" />
  </svg>
</template>

<script setup>
const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: '16px'
  },
  color: {
    type: String,
    default: 'currentColor'
  }
})
</script>

<style scoped>
.svg-icon {
  vertical-align: middle;
  transition: all 0.3s;
}
</style>
```

### SVG 图标加载

使用 Vite 的 `import.meta.glob` 自动导入所有 SVG 文件。

```javascript
// utils/icons.js
const svgIcons = import.meta.glob('../assets/icons/*.svg', { eager: true })

export function loadSvgIcons() {
  const iconModules = svgIcons
  
  for (const path in iconModules) {
    const iconName = path.replace(/^.*\/(.*)\.svg$/, '$1')
    const svgContent = iconModules[path].default
    
    // 创建 symbol 元素
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgContent, 'image/svg+xml')
    const svg = doc.querySelector('svg')
    
    if (svg) {
      const symbol = document.createElementNS('http://www.w3.org/2000/svg', 'symbol')
      symbol.id = `icon-${iconName}`
      symbol.setAttribute('viewBox', svg.getAttribute('viewBox') || '0 0 1024 1024')
      symbol.innerHTML = svg.innerHTML
      
      // 添加到 body
      if (!document.getElementById(symbol.id)) {
        document.body.appendChild(symbol)
      }
    }
  }
}
```

## 富文本编辑器 (WangEditor)

### 功能特性

基于 wangEditor 封装的富文本编辑器。

**特点：**
- ✅ 轻量级编辑器
- ✅ 支持图片上传
- ✅ 支持工具栏配置
- ✅ 支持全屏编辑
- ✅ 响应式设计

### 使用方式

```vue
<template>
  <div>
    <!-- 基础用法 -->
    <WangEditor v-model="content" />
    
    <!-- 自定义高度 -->
    <WangEditor 
      v-model="content" 
      height="500px" 
    />
    
    <!-- 自定义工具栏 -->
    <WangEditor 
      v-model="content" 
      :toolbar="customToolbar" 
    />
  </div>
</template>

<script setup>
const content = ref('<p>Hello World!</p>')

const customToolbar = [
  'bold',
  'italic',
  'underline',
  '|',
  'fontSize',
  'color',
  '|',
  'bulletedList',
  'numberedList',
  '|',
  'uploadImage',
  'insertLink'
]
</script>
```

### 组件实现

```vue
<!-- components/WangEditor.vue -->
<template>
  <div class="wang-editor-container">
    <div ref="editorRef" class="editor"></div>
  </div>
</template>

<script setup>
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import { uploadFile } from '@/api/fs/file'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  height: {
    type: String,
    default: '300px'
  },
  toolbar: Array
})

const emit = defineEmits(['update:modelValue'])

const editorRef = ref()
let editor = null

onMounted(() => {
  editor = new Editor({
    selector: editorRef.value,
    html: props.modelValue,
    config: {
      placeholder: '请输入内容...',
      height: props.height,
      // 自定义工具栏
      toolbar: props.toolbar,
      // 图片上传
      MENU_CONF: {
        uploadImage: {
          async customUpload(file, insertFn) {
            try {
              const formData = new FormData()
              formData.append('file', file)
              const { data } = await uploadFile(formData)
              insertFn(data.url, data.name)
            } catch (error) {
              console.error('图片上传失败:', error)
            }
          }
        }
      },
      onChange(editor) {
        emit('update:modelValue', editor.getHtml())
      }
    }
  })
})

onBeforeUnmount(() => {
  if (editor) {
    editor.destroy()
  }
})

watch(() => props.modelValue, (val) => {
  if (editor && val !== editor.getHtml()) {
    editor.setHtml(val)
  }
})
</script>

<style scoped>
.wang-editor-container {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}
</style>
```

## 加载动画 (LoadingAnimation)

### 功能特性

提供多种加载动画效果。

**特点：**
- ✅ 多种动画样式
- ✅ 自定义颜色和大小
- ✅ 全屏/局部加载
- ✅ 带文字提示

### 使用方式

```vue
<template>
  <div>
    <!-- 默认动画 -->
    <LoadingAnimation v-if="loading" />
    
    <!-- 自定义样式 -->
    <LoadingAnimation 
      v-if="loading" 
      type="spinner" 
      size="large" 
      text="加载中..." 
    />
    
    <!-- 全屏加载 -->
    <LoadingAnimation 
      v-if="loading" 
      fullscreen 
    />
  </div>
</template>

<script setup>
const loading = ref(true)

onMounted(async () => {
  await fetchData()
  loading.value = false
})
</script>
```

## 最佳实践

### 1. 组件注册

**全局注册常用组件：**

```javascript
// main.js
import DictSelect from '@/components/DictSelect.vue'
import IconSelector from '@/components/IconSelector.vue'
import SvgIcon from '@/components/svgicon/index.vue'

app.component('DictSelect', DictSelect)
app.component('IconSelector', IconSelector)
app.component('SvgIcon', SvgIcon)
```

### 2. 按需引入

**大型组件按需引入：**

```vue
<script setup>
import WangEditor from '@/components/WangEditor.vue'
</script>
```

### 3. 组件封装原则

- 单一职责：一个组件只做一件事
- 可配置：提供必要的 props
- 可扩展：支持插槽和事件
- 易维护：代码清晰，注释完整

### 4. 性能优化

- 使用 `defineAsyncComponent` 异步加载大组件
- 合理使用 `v-show` 和 `v-if`
- 避免不必要的响应式数据

## 总结

MolanDev Cloud 提供的业务组件：

- ✅ **字典选择器**：自动加载字典数据
- ✅ **图标选择器**：可视化选择图标
- ✅ **SVG 图标**：支持自定义图标
- ✅ **富文本编辑器**：功能完整的编辑器
- ✅ **加载动画**：多种加载效果

这些组件封装了常见的业务逻辑，开箱即用，大大提升开发效率！
