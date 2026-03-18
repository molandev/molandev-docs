# 多数据源模块概览

`molandev-datasource` 是一个专为单体与微服务混合部署场景设计的动态数据源解决方案。它基于**连接代理模式**和 MyBatis 拦截器实现，支持根据 Mapper 的包名自动切换物理数据库，并支持在同一事务内访问多个数据源。

## 核心特性

### ✅ 包名路由 (Package-based Routing)

- **自动切换**：根据 Mapper 接口所在的包名，自动路由到对应的数据源。
- **最长匹配优先**：支持包名嵌套，自动选择匹配路径最长的配置（例如 `com.molandev.order` 优先于 `com.molandev`）。
- **无侵入**：不需要在业务代码或 Mapper 上添加任何注解。

### ✅ 混合部署支持

- **单体/微服务兼容**：开发一套代码，通过配置即可支持单体部署（多库连接）或微服务部署（单库连接）。
- **配置隔离**：每个数据源拥有独立的连接池配置。

### ✅ 通用连接池支持

- **任意连接池**：支持 HikariCP、Druid、DBCP2 等市面上所有的数据库连接池。
- **动态注入**：通过 `pool` 配置项，利用反射自动将属性注入到对应的连接池实例中。

### ✅ 智能主从/默认数据源

- **Primary 机制**：支持通过 `primary: true` 指定主数据源。
- **自动兜底**：若未指定主数据源，自动选择配置中的第一个作为默认源。

## 技术架构

### 核心组件

```
molandev-datasource
├── DataSourceContextHolder       # 数据源上下文，管理当前线程的连接Key
├── DynamicDataSource            # 核心数据源类，返回代理连接
├── ConnectionProxy              # 连接代理，实现跨数据源事务支持
├── DynamicDataSourceInterceptor   # MyBatis 拦截器，执行包名解析与切换
├── DataSourceProperties          # 配置属性类
├── ConditionalOnMolandevDataSource # 条件注解
├── OnMolandevDataSourceCondition  # 条件判断逻辑
└── DynamicDataSourceAutoConfiguration # 自动配置类
```

### 实现原理

1. **拦截请求**：MyBatis 拦截器拦截所有的 SQL 执行请求。
2. **解析包名**：获取当前 Mapper 的完整类名，提取包名。
3. **匹配数据源**：根据配置中的 `packages` 映射关系查找目标数据源 Key。
4. **设置上下文**：将 Key 存入 `ThreadLocal`。
5. **返回代理连接**：`DynamicDataSource.getConnection()` 返回一个代理的 `Connection` 对象。
6. **延迟路由**：代理连接在执行实际 SQL 方法时，根据当前上下文获取对应数据源的真实连接。
7. **统一管理**：事务提交/回滚时，代理连接会对所有访问过的数据源连接执行相同操作。

## 使用建议

### 🎯 微服务合并场景

当为了降低运维成本，将原本多个微服务合并为一个单体服务运行，但又希望保留物理数据库隔离时，该模块是最佳选择。

### 🎯 性能优化

- 合理规划 Mapper 的包结构，避免频繁的数据源切换。
- 跨库事务会为每个数据源维护一个连接，避免在事务中访问过多数据源。

### ⚠️ 事务支持

**单库事务**：
- Spring 的 `@Transactional` 注解**完全支持**，行为与传统单数据源一致。
- 在一个事务内访问同一数据源的多个 Mapper，事务管理完全可靠。

**跨库事务支持**：

✅ 本模块通过**连接代理模式**实现了跨数据源事务支持：

```java
@Transactional
public void crossDataSourceOperation() {
    // 操作 master 库
    userMapper.updateUserBalance(userId, amount);  
    
    // 操作 order 库 - ✅ 成功执行
    orderMapper.createOrder(order);  
    
    // 异常时，两个数据源都会回滚
}
```

**工作原理**：
- 为每个访问的数据源维护一个独立的连接
- `commit()`/`rollback()` 会应用到所有数据源
- 异常时所有数据源统一回滚

**⚠️ 限制与边界**：

虽然支持跨库事务，但这**不是真正的分布式事务**：

1. **提交非原子性**：如果第一个数据源提交成功但第二个失败，第一个无法回滚
2. **不适合强一致性场景**：金融交易等关键业务建议使用 Seata 或 XA 事务
3. **适用场景**：微服务合并、读写分离、容忍最终一致性的业务

详细说明请参考：[事务管理与注意事项](./transaction.md)

## 下一步

- [快速开始](./getting-started.md) - 5分钟上手多数据源配置
- [连接池配置](./pool-config.md) - 详解如何配置 Hikari/Druid 等连接池
