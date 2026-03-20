# 部署指南

## 单体模式部署

### 打包单体应用

```bash
# 进入单体服务目录
cd molandev-backend/molandev-standalone-service

# 打包
mvn clean package -DskipTests

# 生成的 JAR 文件位于 target/ 目录
```

### 运行单体应用

```bash
# 直接运行
java -jar target/molandev-standalone-service.jar

# 指定配置文件
java -jar target/molandev-standalone-service.jar --spring.profiles.active=prod
```

### 配置说明

```yaml
# application-prod.yml
molandev:
  run-mode: single  # 单体模式
  security:
    mode: LOCAL     # 本地安全模式
  lock:
    type: memory    # 内存锁
```

## 微服务模式部署

### 打包各服务

```bash
# 进入后端目录
cd molandev-backend

# 打包所有服务
mvn clean package -DskipTests

# 各服务 JAR 文件位置：
# - molandev-gateway/target/molandev-gateway.jar
# - molandev-base/target/molandev-base.jar
# - molandev-ai/target/molandev-ai.jar
```

### 启动顺序

1. **启动 Gateway** - 网关服务
2. **启动 molandev-base** - 基础服务
3. **启动 molandev-ai** - AI 服务（如需要）

### 配置说明

```yaml
# application-prod.yml
molandev:
  run-mode: cloud   # 微服务模式
  security:
    mode: CLOUD     # 云端安全模式
  lock:
    type: redis     # Redis 分布式锁

spring:
  rabbitmq:
    host: localhost
    port: 5672
```

## Docker 部署

### 构建镜像

```bash
# 构建单体服务镜像
cd molandev-backend/molandev-standalone-service
docker build -t molandev-standalone:latest .

# 构建网关镜像
cd molandev-backend/molandev-gateway
docker build -t molandev-gateway:latest .

# 构建基础服务镜像
cd molandev-backend/molandev-base
docker build -t molandev-base:latest .
```

### Docker Compose 部署

项目已提供 docker-compose 配置文件，位于 `deploy/compose/` 目录。

```bash
# 启动所有服务
cd deploy/compose
docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f molandev-base
```

## 生产环境配置

### JVM 参数建议

```bash
# 单体服务（建议 1-2GB 内存）
java -Xms512m -Xmx1536m -jar molandev-standalone-service.jar

# 微服务（每个服务建议 512MB-1GB）
java -Xms256m -Xmx768m -jar molandev-gateway.jar
java -Xms256m -Xmx768m -jar molandev-base.jar
```

### 数据库优化

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
```

### Redis 配置

```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      password: your-password
      lettuce:
        pool:
          max-active: 20
          max-idle: 10
          min-idle: 5
```

### 健康检查

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: always
```
