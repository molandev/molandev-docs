# 集合工具

`ListUtils` 和 `MapUtil` 提供便捷的集合操作方法。

## List 工具

### 类信息

- **包名**: `com.molandev.framework.util`
- **类名**: `ListUtils`
- **类型**: 静态工具类

### 核心方法

#### toList - 创建列表

```java
public static <T> List<T> toList(T... elements)
```

快速创建可变列表。

**示例**:
```java
List<String> list = ListUtils.toList("a", "b", "c");
// 可以修改：list.add("d");
```

---

#### isEmpty / isNotEmpty - 空值判断

```java
public static boolean isEmpty(List<?> list)
public static boolean isNotEmpty(List<?> list)
```

**示例**:
```java
ListUtils.isEmpty(null);        // true
ListUtils.isEmpty(new ArrayList<>()); // true
ListUtils.isNotEmpty(List.of("a"));   // true
```

---

#### get - 安全获取元素

```java
public static <T> T get(List<T> list, int index)
```

避免索引越界，返回 null 而不是抛异常。

**示例**:
```java
List<String> list = List.of("a", "b");
String s1 = ListUtils.get(list, 0);  // "a"
String s2 = ListUtils.get(list, 99); // null（不抛异常）
```

---

#### getFirst / getLast - 获取首尾元素

```java
public static <T> T getFirst(List<T> list)
public static <T> T getLast(List<T> list)
```

**示例**:
```java
List<String> list = List.of("a", "b", "c");
String first = ListUtils.getFirst(list); // "a"
String last = ListUtils.getLast(list);   // "c"
```

---

#### merge - 合并列表

```java
public static <T> List<T> merge(List<T> list1, List<T> list2)
```

**示例**:
```java
List<String> list1 = List.of("a", "b");
List<String> list2 = List.of("c", "d");
List<String> merged = ListUtils.merge(list1, list2);
// ["a", "b", "c", "d"]
```

---

#### distinct - 去重

```java
public static <T> List<T> distinct(List<T> list)
```

保持原有顺序去重。

**示例**:
```java
List<String> list = List.of("a", "b", "a", "c", "b");
List<String> unique = ListUtils.distinct(list);
// ["a", "b", "c"]
```

---

#### subList - 安全截取

```java
public static <T> List<T> subList(List<T> list, int start, int end)
```

避免索引越界。

**示例**:
```java
List<String> list = List.of("a", "b", "c", "d");
List<String> sub = ListUtils.subList(list, 1, 3);
// ["b", "c"]
```

### 完整示例 - List

#### 示例：分页处理

```java
import com.molandev.framework.util.ListUtils;
import java.util.List;

public class Pagination {
    
    public static <T> List<T> getPage(List<T> data, int page, int pageSize) {
        if (ListUtils.isEmpty(data)) {
            return List.of();
        }
        
        int start = (page - 1) * pageSize;
        int end = start + pageSize;
        
        return ListUtils.subList(data, start, end);
    }
    
    public static void main(String[] args) {
        List<String> data = ListUtils.toList("a", "b", "c", "d", "e", "f", "g");
        
        List<String> page1 = getPage(data, 1, 3); // [a, b, c]
        List<String> page2 = getPage(data, 2, 3); // [d, e, f]
        List<String> page3 = getPage(data, 3, 3); // [g]
        
        System.out.println("第1页: " + page1);
        System.out.println("第2页: " + page2);
        System.out.println("第3页: " + page3);
    }
}
```

---

## Map 工具

### 类信息

- **包名**: `com.molandev.framework.util`
- **类名**: `MapUtil`
- **类型**: 静态工具类

### 核心方法

#### toMap - 创建 Map

```java
public static <K, V> Map<K, V> toMap(Object... args)
```

快速创建 Map。

**示例**:
```java
Map<String, Object> map = MapUtil.toMap(
    "name", "张三",
    "age", 25,
    "city", "北京"
);
```

多个重载方法：

```java
// 单个键值对
Map<String, String> map1 = MapUtil.toMap("key", "value");

// 两个键值对
Map<String, String> map2 = MapUtil.toMap("k1", "v1", "k2", "v2");

// 三个键值对
Map<String, String> map3 = MapUtil.toMap(
    "k1", "v1", 
    "k2", "v2", 
    "k3", "v3"
);
```

---

#### isEmpty / isNotEmpty - 空值判断

```java
public static boolean isEmpty(Map<?, ?> map)
public static boolean isNotEmpty(Map<?, ?> map)
```

**示例**:
```java
MapUtil.isEmpty(null);            // true
MapUtil.isEmpty(new HashMap<>()); // true
MapUtil.isNotEmpty(MapUtil.toMap("a", 1)); // true
```

---

#### getOrDefault - 安全获取

```java
public static <K, V> V getOrDefault(Map<K, V> map, K key, V defaultVal)
```

**示例**:
```java
Map<String, Integer> map = MapUtil.toMap("age", 25);

int age = MapUtil.getOrDefault(map, "age", 0);     // 25
int score = MapUtil.getOrDefault(map, "score", 0); // 0（默认值）
```

---

#### merge - 合并 Map

```java
public static <K, V> Map<K, V> merge(Map<K, V>... maps)
```

后面的 Map 会覆盖前面相同的键。

**示例**:
```java
Map<String, String> map1 = MapUtil.toMap("a", "1", "b", "2");
Map<String, String> map2 = MapUtil.toMap("b", "3", "c", "4");

Map<String, String> merged = MapUtil.merge(map1, map2);
// {a=1, b=3, c=4}（b被覆盖）
```

---

#### size / containsKey / containsValue

```java
public static int size(Map<?, ?> map)
public static boolean containsKey(Map<?, ?> map, Object key)
public static boolean containsValue(Map<?, ?> map, Object value)
```

安全的 Map 操作，自动处理 null。

**示例**:
```java
Map<String, String> map = MapUtil.toMap("name", "张三");

MapUtil.size(map);                  // 1
MapUtil.size(null);                 // 0

MapUtil.containsKey(map, "name");   // true
MapUtil.containsKey(null, "name");  // false

MapUtil.containsValue(map, "张三");  // true
```

### 完整示例 - Map

#### 示例 1：构建响应数据

```java
import com.molandev.framework.util.MapUtil;
import java.util.Map;

public class ResponseBuilder {
    
    public static Map<String, Object> success(Object data) {
        return MapUtil.toMap(
            "code", 200,
            "message", "success",
            "data", data
        );
    }
    
    public static Map<String, Object> error(String message) {
        return MapUtil.toMap(
            "code", 500,
            "message", message,
            "data", null
        );
    }
    
    public static void main(String[] args) {
        Map<String, Object> userInfo = MapUtil.toMap(
            "id", 1001,
            "name", "张三",
            "email", "zhangsan@example.com"
        );
        
        Map<String, Object> response = success(userInfo);
        System.out.println(response);
        // {code=200, message=success, data={id=1001, name=张三, ...}}
    }
}
```

#### 示例 2：配置合并

```java
import com.molandev.framework.util.MapUtil;
import java.util.Map;

public class ConfigMerger {
    
    // 默认配置
    private static Map<String, String> defaultConfig = MapUtil.toMap(
        "host", "localhost",
        "port", "8080",
        "timeout", "3000"
    );
    
    /**
     * 合并用户配置和默认配置
     */
    public static Map<String, String> mergeConfig(Map<String, String> userConfig) {
        return MapUtil.merge(defaultConfig, userConfig);
    }
    
    public static void main(String[] args) {
        // 用户只配置了部分项
        Map<String, String> userConfig = MapUtil.toMap(
            "host", "api.example.com",
            "port", "9090"
        );
        
        Map<String, String> finalConfig = mergeConfig(userConfig);
        System.out.println(finalConfig);
        // {host=api.example.com, port=9090, timeout=3000}
        // host和port被覆盖，timeout使用默认值
    }
}
```

## 注意事项

### ⚠️ List 修改

```java
// toList 返回可变列表
List<String> list = ListUtils.toList("a", "b");
list.add("c"); // 可以修改

// Java 原生 List.of 返回不可变列表
List<String> immutable = List.of("a", "b");
// immutable.add("c"); // 抛出异常
```

### ⚠️ Map 键值类型

```java
// toMap 使用可变参数，注意类型转换
Map<String, Object> map = MapUtil.toMap(
    "name", "张三",  // String
    "age", 25        // Integer
);
```

## 性能说明

- **创建**: 快速创建，性能优秀
- **操作**: O(1) 或 O(n) 取决于具体操作
- **线程安全**: 工具方法线程安全，返回的集合取决于具体实现

## 相关工具

- [字符串工具](/modules/util/common/string) - 字符串列表处理
- [随机数工具](/modules/util/common/random) - 随机选择元素
