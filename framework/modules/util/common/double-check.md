# 双重检查工具

`DoubleCheckUtils` 提供线程安全的双重检查锁模式实现。

## 类信息

- **包名**: `com.molandev.framework.util`
- **类名**: `DoubleCheckUtils`
- **类型**: 静态工具类

## 使用场景

- ✅ 单例模式
- ✅ 懒加载初始化
- ✅ 缓存初始化
- ✅ 资源延迟创建

## 核心方法

### doubleCheck - 双重检查

```java
public static void doubleCheck(BooleanSupplier predicate, Runnable initializer)
public static void doubleCheck(Object lockKey, BooleanSupplier predicate, Runnable initializer)
```

**参数**:
- `predicate`: 判断逻辑（如 `() -> obj == null`）
- `initializer`: 初始化逻辑
- `lockKey`: 自定义锁键（可选）

**示例**:
```java
private volatile Connection connection;

public Connection getConnection() {
    DoubleCheckUtils.doubleCheck(
        () -> connection == null,
        () -> connection = createConnection()
    );
    return connection;
}
```

## 完整示例

### 示例 1：单例模式

```java
import com.molandev.framework.util.DoubleCheckUtils;

public class DatabaseManager {
    
    private static volatile DatabaseManager instance;
    
    private DatabaseManager() {
        // 私有构造函数
    }
    
    public static DatabaseManager getInstance() {
        DoubleCheckUtils.doubleCheck(
            () -> instance == null,
            () -> instance = new DatabaseManager()
        );
        return instance;
    }
    
    public static void main(String[] args) {
        // 多线程测试
        for (int i = 0; i < 10; i++) {
            new Thread(() -> {
                DatabaseManager manager = DatabaseManager.getInstance();
                System.out.println(manager.hashCode()); // 所有线程得到相同实例
            }).start();
        }
    }
}
```

### 示例 2：资源懒加载

```java
import com.molandev.framework.util.DoubleCheckUtils;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class ConfigLoader {
    
    private volatile Map<String, String> config;
    
    public Map<String, String> getConfig() {
        DoubleCheckUtils.doubleCheck(
            () -> config == null,
            () -> config = loadConfigFromFile()
        );
        return config;
    }
    
    private Map<String, String> loadConfigFromFile() {
        System.out.println("加载配置文件...");
        Map<String, String> map = new ConcurrentHashMap<>();
        // 模拟从文件加载
        map.put("host", "localhost");
        map.put("port", "8080");
        return map;
    }
    
    public static void main(String[] args) {
        ConfigLoader loader = new ConfigLoader();
        
        // 多线程访问，只加载一次
        for (int i = 0; i < 5; i++) {
            new Thread(() -> {
                Map<String, String> config = loader.getConfig();
                System.out.println("线程 " + Thread.currentThread().getName() + ": " + config);
            }).start();
        }
    }
}
```

### 示例 3：缓存初始化

```java
import com.molandev.framework.util.DoubleCheckUtils;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class CacheManager {
    
    private final Map<String, Object> cache = new ConcurrentHashMap<>();
    
    /**
     * 获取缓存，不存在则初始化
     */
    public Object get(String key) {
        Object value = cache.get(key);
        
        DoubleCheckUtils.doubleCheck(
            key, // 使用key作为锁键，不同key可并发
            () -> cache.get(key) == null,
            () -> cache.put(key, loadData(key))
        );
        
        return cache.get(key);
    }
    
    private Object loadData(String key) {
        System.out.println("加载数据: " + key);
        // 模拟从数据库加载
        return "Data for " + key;
    }
    
    public static void main(String[] args) {
        CacheManager manager = new CacheManager();
        
        // 并发获取相同key，只加载一次
        for (int i = 0; i < 5; i++) {
            new Thread(() -> {
                Object data = manager.get("user:123");
                System.out.println(data);
            }).start();
        }
    }
}
```

## 技术细节

### 双重检查锁模式

```java
// 传统写法
private volatile Object obj;

public Object getObj() {
    if (obj == null) {              // 第一次检查
        synchronized (this) {
            if (obj == null) {      // 第二次检查
                obj = new Object();
            }
        }
    }
    return obj;
}

// 使用工具类
DoubleCheckUtils.doubleCheck(
    () -> obj == null,
    () -> obj = new Object()
);
```

### 锁管理

- 使用 `ReentrantLock` 而非 `synchronized`
- 兼容 JDK 21 的虚拟线程
- 自动管理锁的创建和缓存

## 注意事项

### ⚠️ volatile 必须使用

```java
// ❌ 没有 volatile 可能导致问题
private Object obj;

// ✅ 必须使用 volatile
private volatile Object obj;
```

### ⚠️ 初始化逻辑要赋值

```java
// ❌ 初始化逻辑没有赋值
DoubleCheckUtils.doubleCheck(
    () -> obj == null,
    () -> new Object() // 只创建，没赋值！
);

// ✅ 正确：创建并赋值
DoubleCheckUtils.doubleCheck(
    () -> obj == null,
    () -> obj = new Object()
);
```

## 相关工具

- 并发编程
- 单例模式
- 线程安全
