# 类操作工具

`ClassUtils` 提供类操作和反射相关的工具方法。

## 类信息

- **包名**: `com.molandev.framework.util`
- **类名**: `ClassUtils`
- **类型**: 静态工具类

## 核心方法

### newInstance - 创建实例

```java
public static <T> T newInstance(Class<T> type)
```

反射创建对象，支持内部类。

**示例**:
```java
MyClass obj = ClassUtils.newInstance(MyClass.class);
```

---

### isInterface - 是否接口

```java
public static boolean isInterface(Type type)
```

**示例**:
```java
boolean is = ClassUtils.isInterface(List.class); // true
```

---

### isClass - 是否类

```java
public static boolean isClass(Type type)
```

---

### isPrimitive - 是否基本类型

```java
public static boolean isPrimitive(Type type)
```

**示例**:
```java
boolean is = ClassUtils.isPrimitive(int.class); // true
```

---

### isGenericType - 是否泛型

```java
public static boolean isGenericType(Type type)
```

---

### getType - 根据名称获取类型

```java
public static Type getType(String name)
public static Type getType(Class<?> clazz1, Type... types)
```

## 完整示例

### 示例：动态创建对象

```java
import com.molandev.framework.util.ClassUtils;

public class ObjectFactory {
    
    public static <T> T create(String className) {
        try {
            Class<T> clazz = (Class<T>) Class.forName(className);
            return ClassUtils.newInstance(clazz);
        } catch (ClassNotFoundException e) {
            throw new RuntimeException("类不存在: " + className, e);
        }
    }
    
    public static void main(String[] args) {
        String obj = create("java.lang.String");
        System.out.println("创建成功: " + obj.getClass().getName());
    }
}
```

## 注意事项

### ⚠️ 内部类支持

工具类支持创建静态和非静态内部类。

### ⚠️ 反射性能

反射创建对象比直接 new 慢，不要在高频场景使用。

## 相关工具

- Java 反射 API
- 泛型处理
