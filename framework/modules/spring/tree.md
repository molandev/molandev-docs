# 树形结构工具

`TreeUtil` 是一个强大的树形结构处理工具类，可以将扁平的列表数据快速转换为树形结构，支持 Map 和对象两种形式。

## 类信息

- **包名**: `com.molandev.framework.spring.tree`
- **类名**: `TreeUtil`
- **类型**: 静态工具类
- **依赖**: Spring CGLIB

## 核心特性

### ✅ 多种转换方式

- 列表转树形结构（保持原对象类型）
- 列表转树形结构（转换为新类型）
- 列表转 Map 形式的树
- 自定义对象拷贝逻辑

### ✅ 注解配置

- `@TreeId`: 标记节点 ID 字段
- `@TreeParentId`: 标记父节点 ID 字段
- `@TreeChildren`: 标记子节点列表字段
- `@TreeSort`: 标记排序字段

### ✅ 高级功能

- 自动排序（支持任意 Comparable 类型）
- 树形过滤（根据条件过滤节点）
- 树形展开（树转回扁平列表）
- 性能优化（配置缓存、高效算法）

## 核心方法

### 1. buildTree (保持原类型)

将扁平列表转换为树形结构，保持原对象类型。

```java
public static <T> List<T> buildTree(List<T> list)
```

| 参数 | 类型 | 说明 |
|-----|------|------|
| list | List\<T> | 扁平列表 |
| 返回值 | List\<T> | 树形结构列表 |

**示例**：

```java
@Data
class Department {
    @TreeId
    private Long id;
    
    @TreeParentId
    private Long parentId;
    
    private String name;
    
    @TreeChildren
    private List<Department> children;
}

List<Department> flatList = departmentMapper.selectAll();
List<Department> tree = TreeUtil.buildTree(flatList);
```

### 2. buildTree (转换类型)

将扁平列表转换为树形结构，同时转换为新的类型。

```java
public static <T, R> List<R> buildTree(List<T> list, Class<R> rType)
```

| 参数 | 类型 | 说明 |
|-----|------|------|
| list | List\<T> | 源列表 |
| rType | Class\<R> | 目标类型 |
| 返回值 | List\<R> | 树形结构列表 |

**示例**：

```java
// 实体类
@Data
class DeptEntity {
    private Long id;
    private Long parentId;
    private String name;
}

// VO 类
@Data
class DeptVO {
    @TreeId
    private Long id;
    
    @TreeParentId
    private Long parentId;
    
    private String name;
    
    @TreeChildren
    private List<DeptVO> children;
}

List<DeptEntity> entities = deptMapper.selectAll();
List<DeptVO> tree = TreeUtil.buildTree(entities, DeptVO.class);
```

### 3. buildTree (自定义拷贝)

使用自定义的对象拷贝逻辑构建树。

```java
public static <T, R> List<R> buildTree(List<T> list, Class<R> rType, Function<T, R> objectCopyMethod)
```

| 参数 | 类型 | 说明 |
|-----|------|------|
| list | List\<T> | 源列表 |
| rType | Class\<R> | 目标类型 |
| objectCopyMethod | Function\<T,R> | 对象拷贝函数 |
| 返回值 | List\<R> | 树形结构列表 |

**示例**：

```java
List<DeptVO> tree = TreeUtil.buildTree(entities, DeptVO.class, entity -> {
    DeptVO vo = new DeptVO();
    vo.setId(entity.getId());
    vo.setParentId(entity.getParentId());
    vo.setName(entity.getName().toUpperCase());  // 自定义转换逻辑
    return vo;
});
```

### 4. buildMapTree

将列表转换为 Map 形式的树形结构。

```java
public static <T> List<Map<String, Object>> buildMapTree(List<T> list)
public static <T> List<Map<String, Object>> buildMapTree(List<T> list, NodeConfig nodeConfig)
```

| 参数 | 类型 | 说明 |
|-----|------|------|
| list | List\<T> | 扁平列表 |
| nodeConfig | NodeConfig | 节点配置（可选） |
| 返回值 | List\<Map> | Map 形式的树 |

**示例**：

```java
List<Department> flatList = departmentMapper.selectAll();
List<Map<String, Object>> mapTree = TreeUtil.buildMapTree(flatList);

// 返回格式:
// [
//   {
//     "id": 1,
//     "name": "总公司",
//     "children": [
//       {"id": 2, "name": "研发部", "children": [...]},
//       {"id": 3, "name": "销售部", "children": [...]}
//     ]
//   }
// ]
```

### 5. expandTree

将树形结构展开为扁平列表。

```java
public static <R> List<R> expandTree(List<R> treeList)
```

| 参数 | 类型 | 说明 |
|-----|------|------|
| treeList | List\<R> | 树形结构列表 |
| 返回值 | List\<R> | 扁平列表 |

**示例**：

```java
List<Department> tree = TreeUtil.buildTree(flatList);
List<Department> expanded = TreeUtil.expandTree(tree);
// 树形结构被展开为扁平列表
```

### 6. filterTree (条件过滤)

根据条件过滤树形结构。

```java
public static <R> void filterTree(List<R> treeList, Predicate<R> filterPredicate)
```

| 参数 | 类型 | 说明 |
|-----|------|------|
| treeList | List\<R> | 树形结构列表（会被修改） |
| filterPredicate | Predicate\<R> | 过滤条件 |

**示例**：

```java
List<Department> tree = TreeUtil.buildTree(flatList);

// 只保留启用的部门
TreeUtil.filterTree(tree, dept -> dept.getStatus() == 1);

// 只保留名称包含"研发"的部门
TreeUtil.filterTree(tree, dept -> dept.getName().contains("研发"));
```

### 7. filterTree (ID 过滤)

根据 ID 集合过滤树形结构。

```java
public static <R> void filterTree(List<R> treeList, Collection<?> ids)
```

| 参数 | 类型 | 说明 |
|-----|------|------|
| treeList | List\<R> | 树形结构列表（会被修改） |
| ids | Collection\<?> | ID 集合 |

**示例**：

```java
List<Department> tree = TreeUtil.buildTree(flatList);

// 只保留指定 ID 的部门
Set<Long> allowedIds = Set.of(1L, 2L, 4L, 5L);
TreeUtil.filterTree(tree, allowedIds);
```

## 注解说明

### @TreeId

标记节点 ID 字段。

```java
@TreeId
private Long id;
```

### @TreeParentId

标记父节点 ID 字段。

```java
@TreeParentId
private Long parentId;
```

### @TreeChildren

标记子节点列表字段。

```java
@TreeChildren
private List<Department> children;
```

### @TreeSort

标记排序字段（必须是 Comparable 类型）。

```java
@TreeSort
private Integer sort;
```

## 完整示例

### 示例 1: 部门树形结构

```java
import com.molandev.framework.spring.tree.*;
import lombok.Data;

@Data
public class Department {
    @TreeId
    private Long id;

    @TreeParentId
    private Long parentId;

    private String name;

    @TreeSort
    private Integer sort;

    @TreeChildren
    private List<Department> children;
}

@Service
public class DepartmentService {

    @Autowired
    private DepartmentMapper departmentMapper;

    // 获取部门树
    public List<Department> getDepartmentTree() {
        List<Department> allDepts = departmentMapper.selectAll();
        return TreeUtil.buildTree(allDepts);
    }

    // 获取用户可见的部门树
    public List<Department> getUserDepartmentTree(Long userId) {
        List<Department> allDepts = departmentMapper.selectAll();
        List<Department> tree = TreeUtil.buildTree(allDepts);

        // 根据用户权限过滤
        Set<Long> allowedDeptIds = userService.getUserDeptIds(userId);
        TreeUtil.filterTree(tree, allowedDeptIds);

        return tree;
    }

    // 获取 Map 形式的部门树（前端展示）
    public List<Map<String, Object>> getDepartmentMapTree() {
        List<Department> allDepts = departmentMapper.selectAll();
        return TreeUtil.buildMapTree(allDepts);
    }
}
```

### 示例 2: 菜单树形结构

```java
@Data
public class Menu {
    @TreeId
    private Long id;
    
    @TreeParentId
    private Long parentId;
    
    private String name;
    private String path;
    private String icon;
    
    @TreeSort
    private Integer order;
    
    private Integer status;  // 0-禁用 1-启用
    
    @TreeChildren
    private List<Menu> children;
}

@Service
public class MenuService {
    
    // 获取所有菜单树
    public List<Menu> getMenuTree() {
        List<Menu> allMenus = menuMapper.selectAll();
        return TreeUtil.buildTree(allMenus);
    }
    
    // 获取启用的菜单树
    public List<Menu> getEnabledMenuTree() {
        List<Menu> allMenus = menuMapper.selectAll();
        List<Menu> tree = TreeUtil.buildTree(allMenus);
        
        // 只保留启用的菜单
        TreeUtil.filterTree(tree, menu -> menu.getStatus() == 1);
        
        return tree;
    }
    
    // 获取用户有权限的菜单树
    public List<Menu> getUserMenuTree(Long userId) {
        List<Menu> allMenus = menuMapper.selectAll();
        List<Menu> tree = TreeUtil.buildTree(allMenus);
        
        // 获取用户有权限的菜单 ID
        Set<Long> menuIds = userService.getUserMenuIds(userId);
        TreeUtil.filterTree(tree, menuIds);
        
        return tree;
    }
}
```

### 示例 3: 实体转 VO

```java
// 实体类（数据库映射）
@Data
@TableName("t_category")
public class CategoryEntity {
    private Long id;
    private Long parentId;
    private String name;
    private String description;
    private Integer sort;
    private LocalDateTime createTime;
}

// VO 类（前端展示）
@Data
public class CategoryVO {
    @TreeId
    private Long id;
    
    @TreeParentId
    private Long parentId;
    
    private String name;
    
    @TreeSort
    private Integer sort;
    
    @TreeChildren
    private List<CategoryVO> children;
    
    // 不包含敏感字段
}

@Service
public class CategoryService {
    
    // 实体转 VO 树
    public List<CategoryVO> getCategoryTree() {
        List<CategoryEntity> entities = categoryMapper.selectAll();
        
        // 自动拷贝同名属性
        return TreeUtil.buildTree(entities, CategoryVO.class);
    }
    
    // 自定义拷贝逻辑
    public List<CategoryVO> getCategoryTreeWithCustom() {
        List<CategoryEntity> entities = categoryMapper.selectAll();
        
        return TreeUtil.buildTree(entities, CategoryVO.class, entity -> {
            CategoryVO vo = new CategoryVO();
            vo.setId(entity.getId());
            vo.setParentId(entity.getParentId());
            vo.setName("[" + entity.getId() + "] " + entity.getName());  // 自定义格式
            vo.setSort(entity.getSort());
            return vo;
        });
    }
}
```

### 示例 4: 自定义节点配置

```java
// 如果不想使用注解，可以使用 NodeConfig
NodeConfig config = new NodeConfig();
config.setIdFieldName("id");
config.setParentIdFieldName("pid");
config.setChildrenFieldName("subMenus");
config.setSortFieldName("orderNum");

List<Map<String, Object>> tree = TreeUtil.buildMapTree(list, config);
```

## 技术细节

### 配置缓存

TreeUtil 会缓存类的节点配置，避免重复解析注解：

```java
private static final Map<Class<?>, NodeConfig> configCache = new ConcurrentHashMap<>();
```

### 构建算法

1. 第一遍遍历：构建 ID -> 节点的 Map
2. 第二遍遍历：根据 parentId 建立父子关系
3. 排序：根据 @TreeSort 字段排序
4. 时间复杂度：O(n)

### 多根节点支持

如果多个节点的 parentId 找不到对应的父节点，它们都会作为根节点。

## 注意事项

### ⚠️ 注解必需

使用对象形式的树时，必须使用注解标记字段：

```java
@TreeId           // 必需
@TreeParentId     // 必需
@TreeChildren     // 必需
@TreeSort         // 可选
```

### ⚠️ 循环引用

确保数据中不存在循环引用，否则会导致无限递归：

```java
// 错误示例
A.parentId = B.id
B.parentId = A.id  // 循环引用
```

### ⚠️ 过滤修改原列表

`filterTree` 方法会直接修改传入的列表，如果需要保留原数据，请先拷贝：

```java
List<Department> original = TreeUtil.buildTree(flatList);
List<Department> copy = new ArrayList<>(original);
TreeUtil.filterTree(copy, condition);
```

### ⚠️ 排序字段类型

@TreeSort 标记的字段必须实现 `Comparable` 接口。

## 常见问题

### Q1: 如何设置根节点的 parentId？

**A**: 根节点的 parentId 应该是：
- null
- 或者不存在于任何节点的 id 中（如 0、-1）

### Q2: 支持多层级树吗？

**A**: 支持任意层级的树形结构。

### Q3: 如何只获取前两层？

**A**: 可以使用 filterTree 配合深度判断，或在查询数据时限制层级。

### Q4: 性能如何？

**A**: 
- 时间复杂度：O(n)
- 空间复杂度：O(n)
- 配置使用缓存，重复调用性能高

### Q5: Map 形式和对象形式有什么区别？

**A**: 
- **Map 形式**: 灵活，无需定义类，适合动态数据
- **对象形式**: 类型安全，IDE 支持好，适合固定结构

## 相关工具

- [JSON 工具](./json.md) - JSON 序列化树形结构
- [Spring 工具](./spring.md) - Spring 容器访问

## 参考资料

- [树形数据结构](https://zh.wikipedia.org/wiki/%E6%A0%91_(%E6%95%B0%E6%8D%AE%E7%BB%93%E6%9E%84))
