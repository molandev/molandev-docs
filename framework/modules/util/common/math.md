# 数学工具

`MathUtils` 提供精确数学计算和常用数学操作。

## 类信息

- **包名**: `com.molandev.framework.util`
- **类名**: `MathUtils`
- **类型**: 静态工具类

## 使用场景

- ✅ 金额计算（避免精度丢失）
- ✅ 统计计算
- ✅ 浮点数比较
- ✅ 数值处理

## 核心方法

### add - 精确加法

```java
public static double add(double v1, double v2)
```

**示例**:
```java
double result = MathUtils.add(0.1, 0.2);
// 0.3 （而不是 0.30000000000000004）
```

---

### sub - 精确减法

```java
public static double sub(double v1, double v2)
```

**示例**:
```java
double result = MathUtils.sub(1.0, 0.9);
// 0.1 （精确结果）
```

---

### mul - 精确乘法

```java
public static double mul(double v1, double v2)
```

**示例**:
```java
double result = MathUtils.mul(0.1, 0.2);
// 0.02
```

---

### div - 精确除法

```java
public static double div(double v1, double v2)
public static double div(double v1, double v2, int scale)
```

**参数**:
- `scale`: 保留小数位（默认10位）

**示例**:
```java
double result = MathUtils.div(10, 3);      // 3.3333333333
double result2 = MathUtils.div(10, 3, 2);  // 3.33
```

---

### round - 四舍五入

```java
public static double round(double v, int scale)
```

**示例**:
```java
double rounded = MathUtils.round(3.1415926, 2);  // 3.14
double rounded2 = MathUtils.round(3.1415926, 4); // 3.1416
```

---

### min / max - 最小值/最大值

```java
public static int min(int... nums)
public static int max(int... nums)
```

**示例**:
```java
int min = MathUtils.min(5, 2, 8, 1, 9); // 1
int max = MathUtils.max(5, 2, 8, 1, 9); // 9
```

---

### equals - 浮点数相等比较

```java
public static boolean equals(double a, double b)
public static boolean equals(double a, double b, double scale)
```

**示例**:
```java
boolean eq = MathUtils.equals(0.1 + 0.2, 0.3);  // true
boolean eq2 = MathUtils.equals(3.14, 3.15, 0.1); // true（允许误差0.1）
```

## 完整示例

### 示例 1：金额计算

```java
import com.molandev.framework.util.MathUtils;

public class PriceCalculator {
    
    /**
     * 计算订单总价
     */
    public static double calculateTotal(double price, int quantity, double discount) {
        // 单价 × 数量
        double subtotal = MathUtils.mul(price, quantity);
        
        // 应用折扣
        double discountAmount = MathUtils.mul(subtotal, discount);
        
        // 总价
        double total = MathUtils.sub(subtotal, discountAmount);
        
        // 保留2位小数
        return MathUtils.round(total, 2);
    }
    
    public static void main(String[] args) {
        double price = 99.99;
        int quantity = 3;
        double discount = 0.15; // 15%折扣
        
        double total = calculateTotal(price, quantity, discount);
        System.out.println("总价: " + total); // 254.97
    }
}
```

### 示例 2：税费计算

```java
import com.molandev.framework.util.MathUtils;

public class TaxCalculator {
    
    private static final double TAX_RATE = 0.06; // 6%税率
    
    public static double calculateWithTax(double amount) {
        double tax = MathUtils.mul(amount, TAX_RATE);
        double total = MathUtils.add(amount, tax);
        return MathUtils.round(total, 2);
    }
    
    public static void main(String[] args) {
        double amount = 100.00;
        double withTax = calculateWithTax(amount);
        System.out.println("含税价: " + withTax); // 106.00
    }
}
```

### 示例 3：平均分配

```java
import com.molandev.framework.util.MathUtils;

public class Allocator {
    
    /**
     * 平均分配金额
     */
    public static double[] allocate(double total, int parts) {
        double[] result = new double[parts];
        double perPart = MathUtils.div(total, parts, 2);
        
        // 分配
        for (int i = 0; i < parts - 1; i++) {
            result[i] = perPart;
        }
        
        // 最后一份用总额减去已分配的（避免精度损失）
        double allocated = MathUtils.mul(perPart, parts - 1);
        result[parts - 1] = MathUtils.sub(total, allocated);
        
        return result;
    }
    
    public static void main(String[] args) {
        double[] parts = allocate(100.00, 3);
        // [33.33, 33.33, 33.34] 总和正好100.00
        for (int i = 0; i < parts.length; i++) {
            System.out.println("第" + (i+1) + "份: " + parts[i]);
        }
    }
}
```

## 为什么需要 MathUtils？

### ⚠️ 浮点数精度问题

```java
// ❌ 直接计算会有精度问题
System.out.println(0.1 + 0.2);        // 0.30000000000000004
System.out.println(1.0 - 0.9);        // 0.09999999999999998

// ✅ 使用 MathUtils
System.out.println(MathUtils.add(0.1, 0.2)); // 0.3
System.out.println(MathUtils.sub(1.0, 0.9)); // 0.1
```

### ⚠️ 金额计算

```java
// ❌ 金额计算不要用 double 直接运算
double price = 9.99;
double total = price * 10; // 可能不精确

// ✅ 使用 MathUtils
double total = MathUtils.mul(9.99, 10); // 精确
```

## 技术细节

所有计算内部使用 `BigDecimal`，保证精度：

```java
// 内部实现示例
public static double add(double v1, double v2) {
    BigDecimal b1 = BigDecimal.valueOf(v1);
    BigDecimal b2 = BigDecimal.valueOf(v2);
    return b1.add(b2).doubleValue();
}
```

## 性能说明

- **速度**: 比直接运算慢（因为使用 BigDecimal）
- **精度**: 完全精确
- **适用**: 金额、税费等要求精确的计算

## 常见问题

### Q: 为什么不直接用 BigDecimal？

A: MathUtils 简化了 BigDecimal 的使用，提供更简洁的API。

### Q: 所有场景都要用 MathUtils 吗？

A: 不需要。科学计算、图形学等可以用原生运算。金额计算必须用。

## 相关工具

- [随机数工具](/modules/util/common/random) - 随机数生成
- [字符串工具](/modules/util/common/string) - 数字字符串转换
