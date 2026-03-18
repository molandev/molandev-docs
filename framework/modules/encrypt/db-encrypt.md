# 数据库字段加密

数据库字段加密功能通过 MyBatis 拦截器实现透明的字段级加解密，只需在实体类字段上添加 `@Enc` 注解，即可自动完成加密存储和解密查询。

## 功能说明

数据库字段加密基于 **MyBatis 拦截器**实现，在数据写入数据库前自动加密，查询后自动解密，对业务代码完全透明。

## 核心特性

### ✅ 透明加解密

- **写入加密**：insert/update 操作自动加密标记字段
- **查询解密**：select 操作自动解密返回数据
- **零侵入**：业务代码无需关心加解密逻辑

### ✅ 字段级控制

- **注解驱动**：@Enc 标记需要加密的字段
- **选择性加密**：仅加密标记字段，其他字段保持明文
- **灵活配置**：支持 AES 加密

### ✅ 高性能

- **反射缓存**：字段信息缓存，避免重复解析
- **按需处理**：仅处理带注解的字段
- **拦截器优化**：Executor 级别拦截，性能开销小

## 配置

### 启用数据库加密

```yaml
# application.yml
molandev:
  encrypt:
    db:
      enabled: true                    # 启用数据库加密，必填
      type: AES                        # 加密类型，默认 AES
      key: your-secret-key-16          # 加密密钥，必填（AES 需 16 字节）
      algorithm: AES/ECB/PKCS5Padding  # 加密算法，默认 AES/ECB/PKCS5Padding
```

### 配置项说明

| 配置项 | 类型 | 默认值 | 必填 | 说明 |
|-------|------|--------|------|------|
| enabled | boolean | false | ✅ | 是否启用数据库加密 |
| type | enum | AES | ❌ | 加密类型，固定为 AES |
| key | String | - | ✅ | 加密密钥，AES 需 16 字节 |
| algorithm | String | AES/ECB/PKCS5Padding | ❌ | 加密算法 |

## @Enc 注解

### 注解说明

```java
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.FIELD, ElementType.PARAMETER})
public @interface Enc {
}
```

### 使用位置

- **实体类字段**：标记需要加密的字段

### 支持的字段类型

- **String**：字符串类型字段
- 其他类型暂不支持（会被忽略）

## 使用示例

### 示例 1: 用户敏感信息加密

```java
import com.molandev.framework.encrypt.db.Enc;
import com.mybatisflex.annotation.Table;
import lombok.Data;

@Data
@Table("t_user")
public class User {
    private Long id;
    private String username;
    private String nickname;
    
    @Enc  // 身份证号加密
    private String idCard;
    
    @Enc  // 手机号加密
    private String phone;
    
    @Enc  // 邮箱加密
    private String email;
    
    private Integer age;
    private LocalDateTime createTime;
}
```

**Mapper**：

```java
@Mapper
public interface UserMapper extends BaseMapper<User> {
}
```

**Service**：

```java
@Service
public class UserService {
    
    @Autowired
    private UserMapper userMapper;
    
    // 保存用户 - 自动加密
    public void createUser(User user) {
        // idCard、phone、email 会自动加密后存储
        userMapper.insert(user);
    }
    
    // 查询用户 - 自动解密
    public User getUser(Long id) {
        // 查询结果中的 idCard、phone、email 会自动解密
        return userMapper.selectOneById(id);
    }
    
    // 更新用户 - 自动加密
    public void updateUser(User user) {
        // 更新时会自动加密
        userMapper.update(user);
    }
    
    // 批量查询 - 自动解密
    public List<User> listUsers() {
        // 批量查询也会自动解密
        return userMapper.selectAll();
    }
}
```

**数据库存储**：

```sql
-- 插入前（业务代码）
INSERT INTO t_user (username, id_card, phone) 
VALUES ('zhangsan', '110101199001011234', '13712345678');

-- 实际存储（自动加密后）
INSERT INTO t_user (username, id_card, phone) 
VALUES ('zhangsan', 'aX9kY2FyZDExMDEwMTE5OTAwMTAxMTIzNA==', 'cGhvbmUxMzcxMjM0NTY3OA==');

-- 查询结果（自动解密）
SELECT * FROM t_user WHERE id = 1;
-- 返回: { id: 1, idCard: '110101199001011234', phone: '13712345678' }
```

### 示例 2: 订单支付信息加密

```java
@Data
@Table("t_order")
public class Order {
    private Long id;
    private String orderNo;
    private Long userId;
    
    @Enc  // 银行卡号加密
    private String bankCard;
    
    @Enc  // 支付密码加密
    private String payPassword;
    
    private BigDecimal amount;
    private Integer status;
    private LocalDateTime createTime;
}

@Service
public class OrderService {
    
    @Autowired
    private OrderMapper orderMapper;
    
    // 创建订单
    public Long createOrder(OrderRequest request) {
        Order order = new Order();
        order.setOrderNo(generateOrderNo());
        order.setUserId(request.getUserId());
        order.setBankCard(request.getBankCard());        // 自动加密
        order.setPayPassword(request.getPayPassword());  // 自动加密
        order.setAmount(request.getAmount());
        
        orderMapper.insert(order);
        return order.getId();
    }
    
    // 查询订单
    public Order getOrder(Long id) {
        // bankCard 和 payPassword 自动解密
        return orderMapper.selectOneById(id);
    }
}
```

### 示例 3: 医疗病历加密

```java
@Data
@Table("t_medical_record")
public class MedicalRecord {
    private Long id;
    private Long patientId;
    
    @Enc  // 病历内容加密
    private String content;
    
    @Enc  // 诊断结果加密
    private String diagnosis;
    
    @Enc  // 处方加密
    private String prescription;
    
    private String doctorName;
    private LocalDateTime visitTime;
}

@Service
public class MedicalRecordService {
    
    @Autowired
    private MedicalRecordMapper recordMapper;
    
    // 保存病历
    public void saveMedicalRecord(MedicalRecord record) {
        // 病历内容自动加密存储
        recordMapper.insert(record);
    }
    
    // 查询病历
    public MedicalRecord getRecord(Long id) {
        // 查询时自动解密
        return recordMapper.selectOneById(id);
    }
    
    // 按患者查询病历
    public List<MedicalRecord> getPatientRecords(Long patientId) {
        // 批量查询也会自动解密
        return recordMapper.selectListByQuery(
            QueryWrapper.create()
                .where(MEDICAL_RECORD.PATIENT_ID.eq(patientId))
        );
    }
}
```

### 示例 4: 条件查询（重要）

```java
@Service
public class UserService {
    
    @Autowired
    private UserMapper userMapper;
    
    @Autowired
    private DbEncryptService dbEncryptService;
    
    // ⚠️ 错误：直接用明文查询加密字段
    public User findByPhone(String phone) {
        // 这样查不到数据，因为数据库存储的是加密后的值
        return userMapper.selectOne(
            QueryWrapper.create()
                .where(USER.PHONE.eq(phone))  // ❌ 明文 != 密文
        );
    }
    
    // ✅ 正确：先加密再查询
    public User findByPhoneCorrect(String phone) {
        // 手动加密查询条件
        String encryptedPhone = dbEncryptService.encryptVal(phone);
        
        return userMapper.selectOne(
            QueryWrapper.create()
                .where(USER.PHONE.eq(encryptedPhone))  // ✅ 密文 = 密文
        );
    }
    
    // 或者查询所有后在内存中过滤（小数据量）
    public User findByPhoneInMemory(String phone) {
        List<User> allUsers = userMapper.selectAll();  // 查询会自动解密
        
        return allUsers.stream()
            .filter(user -> phone.equals(user.getPhone()))
            .findFirst()
            .orElse(null);
    }
}
```

### 示例 5: 数据迁移

```java
@Service
public class DataMigrationService {
    
    @Autowired
    private UserMapper userMapper;
    
    @Autowired
    private DbEncryptService dbEncryptService;
    
    /**
     * 将已有明文数据加密
     */
    @Transactional
    public void encryptExistingData() {
        // 1. 查询所有用户（假设原来是明文）
        List<User> users = userMapper.selectAll();
        
        log.info("开始加密 {} 条数据", users.size());
        
        // 2. 加密敏感字段
        for (User user : users) {
            if (StringUtils.isNotEmpty(user.getIdCard())) {
                user.setIdCard(dbEncryptService.encryptVal(user.getIdCard()));
            }
            if (StringUtils.isNotEmpty(user.getPhone())) {
                user.setPhone(dbEncryptService.encryptVal(user.getPhone()));
            }
            if (StringUtils.isNotEmpty(user.getEmail())) {
                user.setEmail(dbEncryptService.encryptVal(user.getEmail()));
            }
            
            // 3. 更新到数据库
            userMapper.update(user);
        }
        
        log.info("数据加密完成");
    }
    
    /**
     * 解密数据（回退）
     */
    @Transactional
    public void decryptExistingData() {
        // 关闭自动解密，直接查询密文
        List<User> users = userMapper.selectAll();
        
        for (User user : users) {
            if (StringUtils.isNotEmpty(user.getIdCard())) {
                user.setIdCard(dbEncryptService.decryptVal(user.getIdCard()));
            }
            if (StringUtils.isNotEmpty(user.getPhone())) {
                user.setPhone(dbEncryptService.decryptVal(user.getPhone()));
            }
            if (StringUtils.isNotEmpty(user.getEmail())) {
                user.setEmail(dbEncryptService.decryptVal(user.getEmail()));
            }
            
            userMapper.update(user);
        }
        
        log.info("数据解密完成");
    }
}
```

## 技术细节

### 拦截器实现

数据库加密使用两个 MyBatis 拦截器：

#### 1. DbEncryptInterceptor（写入拦截）

拦截 `Executor.update` 方法（包含 insert、update、delete）：

```java
@Intercepts({
    @Signature(type = Executor.class, method = "update", 
               args = {MappedStatement.class, Object.class})
})
public class DbEncryptInterceptor implements Interceptor {
    
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        Object[] args = invocation.getArgs();
        Object parameterObject = args[1];
        
        // 加密标记字段
        if (parameterObject != null) {
            dbEncryptService.encrypt(parameterObject);
        }
        
        return invocation.proceed();
    }
}
```

#### 2. DbEncryptResultInterceptor（查询拦截）

拦截 `ResultSetHandler.handleResultSets` 方法：

```java
@Intercepts({
    @Signature(type = ResultSetHandler.class, method = "handleResultSets", 
               args = Statement.class)
})
public class DbEncryptResultInterceptor implements Interceptor {
    
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        Object result = invocation.proceed();
        
        // 解密查询结果
        if (result instanceof List<?> resultList) {
            dbEncryptService.decrypt(resultList);
        }
        
        return result;
    }
}
```

### 字段缓存机制

使用 `ConcurrentHashMap` 缓存实体类的加密字段信息：

```java
private final Map<Class<?>, List<Field>> needEncMap = new ConcurrentHashMap<>();

public List<Field> getEncFields(Class<?> clazz) {
    return needEncMap.computeIfAbsent(clazz, aClass -> {
        List<Field> list = new ArrayList<>();
        ReflectionUtils.doWithFields(clazz, field -> {
            Enc annotation = field.getAnnotation(Enc.class);
            if (annotation != null) {
                field.setAccessible(true);
                list.add(field);
            }
        });
        return list;
    });
}
```

### 加密流程

```text
┌─────────────────┐
│  业务代码       │
│  user.setPhone  │
│  ("13712345678")│
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  Mapper.insert(user)        │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  DbEncryptInterceptor       │
│  - 扫描 @Enc 字段            │
│  - 加密: phone -> "aX9k..." │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  SQL 执行                    │
│  INSERT INTO t_user (phone) │
│  VALUES ('aX9k...')         │
└─────────────────────────────┘
```

### 解密流程

```text
┌─────────────────────────────┐
│  SQL 查询                    │
│  SELECT * FROM t_user       │
│  返回: phone = "aX9k..."    │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  DbEncryptResultInterceptor │
│  - 扫描 @Enc 字段            │
│  - 解密: "aX9k..." -> phone │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────┐
│  业务代码       │
│  user.getPhone()│
│  = "13712345678"│
└─────────────────┘
```

## 注意事项

### ⚠️ 加密字段查询

加密后的字段**无法直接用明文条件查询**：

```java
// ❌ 错误：查不到数据
userMapper.selectOne(
    QueryWrapper.create()
        .where(USER.PHONE.eq("13712345678"))  // 明文 != 密文
);

// ✅ 正确：先加密查询条件
String encryptedPhone = dbEncryptService.encryptVal("13712345678");
userMapper.selectOne(
    QueryWrapper.create()
        .where(USER.PHONE.eq(encryptedPhone))  // 密文 = 密文
);
```

### ⚠️ 模糊查询不可用

加密后的数据无法进行模糊查询：

```java
// ❌ 不支持
userMapper.selectList(
    QueryWrapper.create()
        .where(USER.PHONE.like("137%"))  // 加密后无法模糊匹配
);
```

**解决方案**：
1. 查询全部数据后在内存中过滤（小数据量）
2. 使用分词索引（如 Elasticsearch）
3. 部分加密（如只加密中间部分）

### ⚠️ 索引失效

加密字段上的普通索引会失效：

```sql
-- 原来的索引
CREATE INDEX idx_phone ON t_user(phone);

-- 加密后查询无法使用索引
SELECT * FROM t_user WHERE phone = 'aX9k...';  -- 全表扫描
```

**建议**：
- 敏感字段不建索引
- 或使用加密后的值建索引（需要先加密查询条件）

### ⚠️ 数据迁移

启用加密前需要迁移已有数据：

```java
// 1. 备份数据
// 2. 批量加密
// 3. 验证
// 4. 启用加密配置
```

### ⚠️ 密钥管理

- **不要硬编码密钥**：使用环境变量
- **定期更换密钥**：建立密钥轮换机制
- **密钥长度**：AES 至少 16 字节
- **权限控制**：限制密钥访问

### ⚠️ 性能考虑

- **加密字段不宜过多**：影响性能
- **大批量操作**：考虑异步处理
- **缓存优化**：热点数据考虑缓存解密后的结果

## 常见问题

### Q1: 如何查询加密字段？

**A**: 需要先加密查询条件：

```java
String encryptedValue = dbEncryptService.encryptVal(searchValue);
mapper.selectOne(QueryWrapper.create().where(FIELD.eq(encryptedValue)));
```

### Q2: 已有数据如何加密？

**A**: 编写数据迁移脚本，批量加密现有数据。

### Q3: 支持哪些 ORM 框架？

**A**: 
- ✅ MyBatis
- ✅ MyBatis-Flex
- ✅ MyBatis-Plus（兼容）
- ❌ JPA/Hibernate（暂不支持）

### Q4: 加密后数据库字段长度如何设置？

**A**: 
- AES 加密后长度约为原长度的 1.5-2 倍
- Base64 编码后再增加约 33%
- 建议：`VARCHAR(255)` 或更大

### Q5: 如何在测试环境关闭加密？

**A**: 使用 Profile 配置：

```yaml
# application-dev.yml
molandev:
  encrypt:
    db:
      enabled: false

# application-prod.yml
molandev:
  encrypt:
    db:
      enabled: true
      key: ${DB_ENCRYPT_KEY}
```

## 相关工具

- [AES 加密工具](../util/encrypt/aes.md) - 底层加密实现
- [混合加密通信](./hybrid-encrypt.md) - 接口通信加密
- [敏感信息脱敏](./sensitive.md) - 查询结果脱敏

## 参考资料

- [MyBatis 拦截器](https://mybatis.org/mybatis-3/zh/configuration.html#plugins)
- [数据加密最佳实践](https://owasp.org/www-project-cheat-sheets/cheatsheets/Cryptographic_Storage_Cheat_Sheet)
