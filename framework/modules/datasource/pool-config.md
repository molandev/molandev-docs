# 连接池详细配置

`molandev-datasource` 模块提供了高度灵活的连接池配置机制。通过 `pool` 配置项，你可以定义任何连接池支持的属性。

## 1. 连接池类型选择

通过 `type` 属性指定连接池的完整类名。

```yaml
molandev:
  datasource:
    master:
      # 指定连接池实现类（默认为 HikariDataSource）
      type: com.zaxxer.hikari.HikariDataSource
      ...
```

## 2. 通用连接池配置 (`pool`)

`pool` 节点下的配置将通过 Java Bean 的方式动态注入到数据源实例中。它支持：
- **Kebab-case**：如 `max-active`
- **CamelCase**：如 `maxActive`
- **自动类型转换**：支持 String 到 Integer, Long, Boolean 的自动转换。

### 示例：HikariCP 配置

```yaml
molandev:
  datasource:
    master:
      type: com.zaxxer.hikari.HikariDataSource
      pool:
        maximum-pool-size: 20
        minimum-idle: 5
        connection-timeout: 30000
        idle-timeout: 600000
        max-lifetime: 1800000
```

### 示例：Alibaba Druid 配置

```yaml
molandev:
  datasource:
    master:
      type: com.alibaba.druid.pool.DruidDataSource
      pool:
        initialSize: 5
        maxActive: 20
        minIdle: 5
        maxWait: 60000
        validationQuery: "SELECT 1"
        testWhileIdle: true
        testOnBorrow: false
```

## 3. 配置参数说明

| 常用参数名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `url` | String | 数据库连接地址 |
| `username` | String | 数据库用户名 |
| `password` | String | 数据库密码 |
| `driver-class-name` | String | 数据库驱动类名 |
| `type` | String | 连接池实现类名（全路径） |
| `primary` | Boolean | 是否为主数据源，用于默认路由 |
| `packages` | List | 该数据源关联的 Mapper 包名列表 |
| `pool` | Map | 对应连接池实现的详细参数（透传） |

## 4. 故障排查

如果在启动时报错 `Failed to set property 'xxx' on DataSource`：
1. 请确认连接池类名 (`type`) 是否正确。
2. 请确认该连接池实现类中是否存在 `setXxx` 方法。
3. 检查属性值的类型是否匹配（例如该设置为数字的却写成了字符串，虽然模块会尝试转换，但格式错误仍会导致失败）。
