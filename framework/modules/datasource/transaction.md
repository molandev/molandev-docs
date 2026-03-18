# 事务管理与注意事项

在多数据源场景下，事务管理是一个需要特别注意的问题。本模块通过**连接代理模式**实现了跨数据源事务支持。

## 实现方案：连接代理模式

### 为什么需要连接代理

Spring 原生的 `AbstractRoutingDataSource` 在事务场景下存在局限性：

**问题**：当 `@Transactional` 开启事务时，Spring 事务管理器会立即调用 `DataSource.getConnection()` 获取连接并绑定到当前线程。一旦连接绑定，后续的所有数据库操作都会复用这个连接，**无法再切换到其他数据源**。

**表现**：
```java
@Transactional
public void crossDataSourceOperation() {
    // 第一次操作：获取 master 连接并绑定
    userMapper.insert(user);  
    
    // 第二次操作：尝试访问 slave，但仍使用 master 连接
    orderMapper.insert(order);  // ❌ 报错：Table "ORDER" not found
}
```

### 连接代理的解决方案

我们实现了自定义的 `ConnectionProxy`，核心思路是：

1. **返回代理连接**：`DynamicDataSource.getConnection()` 返回一个代理的 `Connection` 对象
2. **延迟路由**：代理连接在真正执行 SQL 方法时，才根据当前上下文获取实际连接
3. **多连接缓存**：为每个访问过的数据源维护一个独立的连接，缓存在 `Map` 中
4. **统一管理**：`commit()`/`rollback()`/`close()` 操作会应用到所有缓存的连接

**实现效果**：
```java
@Transactional
public void crossDataSourceOperation() {
    // 操作 master：代理连接获取 master 的实际连接
    userMapper.insert(user);  
    
    // 操作 slave：代理连接获取 slave 的实际连接
    orderMapper.insert(order);  // ✅ 成功执行
    
    // 异常时，两个连接都会回滚
    throw new RuntimeException();
}
```

### 能解决的问题

✅ **跨数据源访问**：在同一个 `@Transactional` 方法内可以访问多个数据源  
✅ **统一回滚**：异常时所有数据源的操作都会回滚  
✅ **自动路由**：仍然通过 MyBatis 拦截器根据 Mapper 包名自动切换  
✅ **业务透明**：业务代码无需感知多数据源的存在  

### 问题边界与限制

⚠️ **不是真正的分布式事务**：

虽然能实现统一回滚，但这**不是 XA 或 Seata 那样的分布式事务**，存在以下限制：

1. **提交不是原子性的**
   - 提交时依次调用各个连接的 `commit()`
   - 如果第一个数据源提交成功，但第二个提交失败，第一个无法回滚
   - 会导致部分数据已提交，部分数据回滚的不一致状态

2. **无法处理网络分区**
   - 如果某个数据库在提交过程中网络中断
   - 已提交的数据源无法回滚

3. **并发一致性问题**
   - 如果多个事务同时访问不同数据源
   - 可能出现分布式死锁或不一致读

### 适用场景

✅ **推荐使用**：
- 微服务合并为单体部署，保留数据库隔离
- 读写分离场景（主库写，从库读）
- 业务容忍最终一致性（通过补偿机制）
- 跨库查询聚合数据

❌ **不推荐使用**：
- 金融交易等强一致性要求的场景
- 需要严格 ACID 保证的关键业务
- 高并发下的库存扣减等竞争场景

### 推荐替代方案

对于需要严格分布式事务的场景：

1. **Seata**：阿里开源的分布式事务框架，支持 AT/TCC/SAGA 模式
2. **XA 事务**：通过 JTA 实现两阶段提交，但性能较差
3. **事件驱动 + 最终一致性**：通过消息队列实现异步补偿
4. **拆分事务**：每个方法只操作一个数据源，通过应用层协调

## 单数据源事务

当一个事务方法内的所有数据库操作都路由到同一个数据源时，Spring 的 `@Transactional` 注解**完全支持**，行为与传统单数据源应用一致。

```java
@Service
public class OrderService {
    
    @Autowired
    private OrderMapper orderMapper;  // com.example.mapper.order 包
    
    @Autowired
    private OrderDetailMapper orderDetailMapper;  // com.example.mapper.order 包
    
    @Transactional
    public void createOrder(Order order) {
        // 两个 Mapper 都在 order 包下，路由到同一个数据源
        orderMapper.insert(order);
        orderDetailMapper.batchInsert(order.getDetails());
        
        // 若发生异常，整个事务回滚
        if (order.getAmount() < 0) {
            throw new RuntimeException("金额不合法");
        }
    }
}
```

## 跨数据源事务

通过连接代理模式，本模块**支持在同一个 `@Transactional` 方法内访问多个数据源**。

### 正常使用场景

```java
@Service
public class UserOrderService {
    
    @Autowired
    private UserMapper userMapper;  // com.example.mapper.user 包 -> master 数据源
    
    @Autowired
    private OrderMapper orderMapper;  // com.example.mapper.order 包 -> order 数据源
    
    @Transactional
    public void createOrderAndUpdateUser(Order order) {
        // 操作 master 库
        User user = userMapper.selectById(order.getUserId());
        userMapper.updateBalance(user.getId(), -order.getAmount());
        
        // 操作 order 库
        orderMapper.insert(order);
        
        // 异常时，两个数据源都会回滚
    }
}
```

### 注意事项

1. **事务传播**：嵌套调用时，子方法的数据源操作仍然在同一个事务中
2. **只读事务**：`@Transactional(readOnly = true)` 同样支持跨数据源查询
3. **性能考虑**：每个数据源都会维护一个连接，直到事务结束才释放

## 最佳实践

### 1. 单库操作优先

能在单个数据源完成的操作，尽量不要跨库：

```java
// ✅ 推荐
@Transactional
public void processOrder(Long orderId) {
    // 所有操作都在 order 库
    orderMapper.updateStatus(orderId, "PAID");
    orderDetailMapper.updateStock(orderId);
}
```

### 2. 明确事务边界

跨库操作时，明确每个数据源的操作范围：

```java
// ✅ 推荐
@Transactional
public void syncUserAndOrder(Long userId, Long orderId) {
    // 明确注释每个操作的数据源
    // master 库操作
    userMapper.select(userId);
    
    // order 库操作
    orderMapper.select(orderId);
}
```

### 3. 异常处理

对于关键业务，添加日志和补偿机制：

```java
@Transactional
public void criticalOperation() {
    try {
        userMapper.insert(user);
        orderMapper.insert(order);
    } catch (Exception e) {
        log.error("跨库事务失败: {}", e.getMessage());
        // 可以添加补偿逻辑或告警
        throw e;
    }
}
```

### 4. 避免长事务

跨库事务会占用多个连接，避免在事务中执行耗时操作：

```java
// ❌ 不推荐
@Transactional
public void badPractice() {
    userMapper.insert(user);
    
    // 调用外部 API（耗时）
    externalApi.notify(user);
    
    orderMapper.insert(order);
}

// ✅ 推荐
public void goodPractice() {
    // 数据库操作在事务中
    Long userId = insertUserWithTransaction(user);
    
    // 外部调用在事务外
    externalApi.notify(user);
    
    // 第二个事务
    insertOrderWithTransaction(order, userId);
}
```

## 总结

本模块通过连接代理模式，在不引入重量级分布式事务框架的前提下，提供了实用的跨数据源事务支持。虽然不是严格的 ACID 事务，但对于大多数业务场景（如微服务合并、读写分离）已经足够。

**核心原则**：
- ✅ 理解边界：知道什么能做，什么不能做
- ✅ 场景适配：根据业务需求选择合适的方案
- ✅ 补偿机制：对关键业务添加额外保障
- ✅ 监控告警：及时发现和处理异常情况
