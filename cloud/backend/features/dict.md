# 字典管理

## 解决的问题

在业务系统中，经常需要维护各种枚举类型的数据，如：性别、状态、类型等。传统做法是在代码中硬编码或配置文件中维护，带来以下问题：

- ❌ **修改困难** - 调整字典项需要修改代码并重新部署
- ❌ **无法可视化** - 运营人员无法直接管理字典数据
- ❌ **翻译麻烦** - 后端返回代码值，前端需要手动映射为文本
- ❌ **重复代码** - 每个字典都需要写转换逻辑

MolanDev Cloud 的字典管理功能提供了**数据库驱动的字典系统**，配合前后端组件实现**零代码**的字典维护和自动翻译。

## 核心特性

### ✅ 数据库驱动
- 字典数据存储在 `sys_dict` 和 `sys_dict_item` 表中
- 支持通过管理界面动态增删改
- 修改即生效，无需重启

### ✅ 自动翻译
- 后端：`@Dict` 注解自动翻译字典值
- 前端：`DictSelect` 组件自动加载字典选项
- 返回数据自动添加翻译字段

### ✅ 缓存机制
- Redis 缓存字典数据，减少数据库查询
- 字典变更自动刷新缓存

### ✅ 多种类型
- 普通字典：维护在数据库中
- YN 类型：布尔值自动翻译为"是/否"
- 多选字典：支持逗号分隔的多值翻译

## 后端使用

### 1. 实体类标注

在实体类字段上添加 `@Dict` 注解：

```java
@Schema(description = "消息发送记录")
public class MsgRecordEntity {
    
    @Schema(description = "类型")
    @Dict("msg_type")  // 字典编码
    private String type;
    
    @Schema(description = "状态")
    @Dict("msg_send_status")
    private String status;
}
```

**返回结果：**
```json
{
  "type": "email",
  "type_t": "邮件",  // 自动添加翻译字段
  "status": "success",
  "status_t": "发送成功"
}
```

### 2. @Dict 注解属性

```java
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@JsonSerialize(using = TranslateSerializer.class)
public @interface Dict {
    
    /**
     * 字典编码
     */
    String value() default "";
    
    /**
     * 翻译后的字段后缀（默认 _t）
     */
    String postfix() default "_t";
    
    /**
     * YN 类型翻译
     * 将 Y,1,true 翻译为"是"，N,0,false 翻译为"否"
     */
    boolean yn() default false;
    
    /**
     * 是否多选（逗号分隔）
     */
    boolean multi() default false;
    
    /**
     * 多选时的分隔符
     */
    String textSplit() default ",";
}
```

**使用示例：**

```java
// 普通字典
@Dict("user_status")
private String status;  // 1 → 正常

// YN 类型
@Dict(yn = true)
private Boolean enabled;  // true → 是

// 多选字典
@Dict(value = "user_tags", multi = true)
private String tags;  // "1,2,3" → "管理员,开发者,测试"

// 自定义后缀
@Dict(value = "user_sex", postfix = "Name")
private Integer sex;  // 1 → 返回 sexName: "男"
```

### 3. 工具类使用

在代码中手动翻译字典值：

```java
// 正向翻译：值 → 文本
String text = DictUtils.translate("1", "user_status");
// 返回：正常

// 反向翻译：文本 → 值
String value = DictUtils.reverseTranslate("正常", "user_status");
// 返回：1
```

**应用场景：**
- 导入导出时的数据转换
- 业务逻辑中需要根据文本查找值
- 日志记录时显示可读文本

## 前端使用

### 1. DictSelect 组件

```vue
<template>
  <el-form>
    <!-- 单选下拉框 -->
    <el-form-item label="消息类型">
      <DictSelect 
        v-model="form.type" 
        dictCode="msg_type" 
        placeholder="请选择消息类型"
      />
    </el-form-item>
    
    <!-- 多选 -->
    <el-form-item label="用户角色">
      <DictSelect 
        v-model="form.roles" 
        dictCode="user_roles"
        multiple
        placeholder="请选择角色"
      />
    </el-form-item>
  </el-form>
</template>

<script setup>
import DictSelect from '@/components/DictSelect.vue'
import { ref } from 'vue'

const form = ref({
  type: '',
  roles: []
})
</script>
```

### 2. 字典项显示

```vue
<template>
  <!-- 表格中显示翻译后的值 -->
  <el-table :data="tableData">
    <el-table-column prop="type" label="类型">
      <template #default="{ row }">
        {{ row.type_t }}  <!-- 直接显示翻译字段 -->
      </template>
    </el-table-column>
  </el-table>
</template>
```

## 字典管理

### 字典结构

**字典主表（sys_dict）：**
- `dict_code` - 字典编码（唯一标识）
- `dict_name` - 字典名称
- `memo` - 描述说明

**字典项表（sys_dict_item）：**
- `dict_code` - 所属字典
- `label` - 显示文本
- `value` - 实际值
- `sort_num` - 排序号

### 管理界面

系统提供可视化的字典管理界面：

1. **字典列表** - 查看和搜索所有字典
2. **新增字典** - 创建新的字典类型
3. **字典项管理** - 维护字典的具体选项
4. **排序调整** - 控制选项显示顺序

::: tip TODO - 字典管理界面
**建议截图：** 字典管理页面，展示字典列表和字典项编辑界面
:::

## 实现原理

### 1. 数据存储

**单表设计：**
```sql
CREATE TABLE sys_dict (
    id VARCHAR(36) PRIMARY KEY,
    dict_code VARCHAR(255),      -- 字典编码
    dict_name VARCHAR(255),      -- 字典名称
    items CLOB,                  -- 字典项（JSON 格式）
    memo VARCHAR(255),           -- 描述
    disabled BOOLEAN,            -- 禁用状态
    builtin BOOLEAN,             -- 内置字典
    create_time TIMESTAMP,
    update_time TIMESTAMP,
    deleted BOOLEAN
);
```

**字典项存储格式：**
```java
// items 字段存储 JSON 字符串
[
  {"value": "1", "label": "正常"},
  {"value": "2", "label": "禁用"}
]
```

### 2. 内存缓存

**缓存实现（`SysDictTranslateService`）：**
```java
@Component
public class SysDictTranslateService {
    
    // 内存缓存：dict_code -> {value: label}
    final Map<String, Map<String, String>> dictItemMap = new ConcurrentHashMap<>();
    
    @Autowired
    SysDictApi sysDictApi;
    
    /**
     * 翻译字典值
     */
    public String translate(String code, String value) {
        Map<String, String> items = getCachedDictItems(code);
        return items.get(value);
    }
    
    /**
     * 获取缓存的字典项
     */
    public Map<String, String> getCachedDictItems(String code) {
        // 使用 computeIfAbsent 保证线程安全
        return dictItemMap.computeIfAbsent(code, k -> getDictItems(code));
    }
    
    /**
     * 监听字典变更，清理内存缓存
     */
    @EventListener
    public void listen(DictChangeEvent event) {
        dictItemMap.remove(event.getCode());
    }
    
    /**
     * 从数据库加载字典项
     */
    private Map<String, String> getDictItems(String dictCode) {
        List<DictItemDto> items = sysDictApi.getItems(dictCode);
        Map<String, String> map = new LinkedHashMap<>();
        for (DictItemDto item : items) {
            map.put(item.getDictValue(), item.getDictLabel());
        }
        return map;
    }
}
```

**特点：**
- ⚡ **极快**：纯内存操作，纳秒级响应
- 🔒 **线程安全**：`ConcurrentHashMap` + `computeIfAbsent`
- 🔄 **懒加载**：第一次访问时才加载到内存
- 🎯 **精准刷新**：只清理变更的字典

### 3. 序列化时翻译

`@Dict` 注解使用 Jackson 的 `@JsonSerialize` 机制：

```java
@JsonSerialize(using = TranslateSerializer.class)
public @interface Dict { }
```

当对象序列化为 JSON 时，`TranslateSerializer` 自动：
1. 读取原始字段值（如 `type = "1"`）
2. 从内存缓存查询翻译（调用 `SysDictTranslateService.translate()`）
3. 在 JSON 中添加翻译字段（如 `type_t = "正常"`）

**流程图：**
```
实体对象
  │
  │ Jackson 序列化
  ▼
TranslateSerializer
  │
  │ 调用 translate()
  ▼
SysDictTranslateService
  │
  │ 从内存缓存获取
  ▼
ConcurrentHashMap
  │
  │ 返回翻译结果
  ▼
JSON 输出（添加 _t 字段）
```

### 4. 缓存刷新机制

**字典变更时：**
```java
@RestController
public class SysDictController {
    
    @PostMapping("/edit")
    public JsonResult<Void> edit(@RequestBody SysDictVo dictVo) {
        // 1. 更新数据库
        sysDictService.saveOrUpdate(dictVo);
        
        // 2. 发布字典变更事件
        EventUtil.publish(new DictChangeEvent(dictVo.getDictCode()));
        
        return JsonResult.success();
    }
}
```

**监听器清理缓存：**
```java
@EventListener
public void listen(DictChangeEvent event) {
    // 从内存中移除对应字典
    dictItemMap.remove(event.getCode());
    // 下次访问时会自动重新加载
}
```

**优势：**
- 无需 Redis，减少依赖
- 事件驱动，实时刷新
- 单体/微服务模式都支持（事件自动适配）

### 5. 前端缓存

前端组件在挂载时：
1. 从后端获取字典项列表（`/dict/values` 接口）
2. 缓存到 Vuex/Pinia 中
3. 多个组件共享同一字典数据

## 最佳实践

### 1. 字典编码规范

```
模块:功能:名称

示例：
sys:user:status      - 系统模块用户状态
msg:send:type        - 消息模块发送类型
task:job:status      - 任务模块任务状态
```

### 2. 何时使用字典

**适合使用字典：**
- ✅ 选项固定且有限（< 50 项）
- ✅ 需要可视化管理
- ✅ 运营人员需要调整
- ✅ 多处使用相同选项

**不适合使用字典：**
- ❌ 数据量大（如城市列表）
- ❌ 层级关系复杂（用树形结构）
- ❌ 与业务实体关联（如部门列表）
- ❌ 频繁变化（考虑动态接口）

### 3. YN 类型的便利性

对于布尔类型字段，使用 `yn = true` 更简洁：

```java
// 传统方式：需要维护字典
@Dict("yes_no")
private String enabled;

// YN 方式：无需维护字典
@Dict(yn = true)
private Boolean enabled;  // 自动翻译为 是/否
```

### 4. 多租户场景

**注意：** 当前版本未实现多租户字典适配，所有租户共享相同的字典数据。

如果需要不同租户使用不同字典，可以考虑：
- 在字典编码中加入租户标识（如 `tenant_001:user:status`）
- 扩展 `DictUtils` 传入租户上下文
- 或使用独立的租户数据库

## 总结

MolanDev Cloud 的字典管理实现了：

- ✅ **后端** - `@Dict` 注解自动翻译，`DictUtils` 工具类支持
- ✅ **前端** - `DictSelect` 组件自动加载选项
- ✅ **管理** - 可视化界面动态维护，修改即生效
- ✅ **性能** - 内存缓存（`ConcurrentHashMap`），纳秒级响应
- ✅ **扩展** - 支持 YN 类型、多选、自定义后缀
- ✅ **刷新** - 事件驱动，自动清理缓存并重新加载

通过字典系统，枚举类型的数据维护变得简单高效，大大提升了系统的可维护性和灵活性。
