# ID 生成工具

`IdUtils` 提供唯一ID生成功能。

## 类信息

- **包名**: `com.molandev.framework.util`
- **类名**: `IdUtils`
- **类型**: 静态工具类

## 核心方法

### uuid - 生成UUID

```java
public static String uuid()
```

生成32位无横线的UUID字符串。

**示例**:
```java
String id = IdUtils.uuid();
// 例如: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```

## 完整示例

### 示例 1：生成订单号

```java
import com.molandev.framework.util.IdUtils;
import com.molandev.framework.util.DateUtils;

public class OrderIdGenerator {
    
    /**
     * 生成订单号：日期 + UUID前8位
     */
    public static String generate() {
        String date = DateUtils.getDate("yyyyMMdd");
        String uuid = IdUtils.uuid().substring(0, 8);
        return "ORD" + date + uuid.toUpperCase();
    }
    
    public static void main(String[] args) {
        for (int i = 0; i < 5; i++) {
            System.out.println(generate());
        }
        // ORD20240118A1B2C3D4
        // ORD20240118E5F6G7H8
        // ...
    }
}
```

### 示例 2：文件重命名

```java
import com.molandev.framework.util.IdUtils;
import com.molandev.framework.util.FileUtils;

public class FileRenamer {
    
    public static String generateUniqueFileName(String originalName) {
        String ext = FileUtils.getFileExt(originalName);
        String uuid = IdUtils.uuid().substring(0, 16);
        return uuid + (ext.isEmpty() ? "" : "." + ext);
    }
    
    public static void main(String[] args) {
        System.out.println(generateUniqueFileName("photo.jpg"));
        // a1b2c3d4e5f6g7h8.jpg
    }
}
```

## 注意事项

### ⚠️ UUID特性

- **唯一性**: 几乎不可能重复
- **长度**: 32字符（去除了横线）
- **随机性**: 基于随机数和时间戳

### ⚠️ 性能

UUID生成速度快，但比自增ID略慢。

## 相关工具

- [随机数工具](/modules/util/common/random) - 其他随机数据
- [日期工具](/modules/util/common/date) - 时间戳
