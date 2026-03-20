# 快速开始

本文档将帮助你在 **10 分钟内**在本地运行 MolanDev Backend 项目,开始你的开发之旅。

::: tip 💡 面向对象
本文档重点在于 **本地开发** 而非生产部署。

建议使用 **IntelliJ IDEA** 进行开发。
:::

## 环境准备

### 必须安装的软件

在开始之前,请确保你的电脑已安装以下软件:

| 软件 | 版本要求 | 下载地址 | 说明 |
|------|----------|----------|------|
| **JDK** | 17+ | [Oracle](https://www.oracle.com/java/technologies/downloads/) | 后端运行环境 |
| **Maven** | 3.6+ | [Apache Maven](https://maven.apache.org/download.cgi) | 后端构建工具 |
| **IntelliJ IDEA** | 2023+ | [JetBrains](https://www.jetbrains.com/idea/download/) | 开发IDE(社区版即可) |
| **Node.js** | 16+ | [Node.js](https://nodejs.org/) | 前端运行环境 |
| **Docker Desktop** | Latest | [Docker](https://www.docker.com/products/docker-desktop/) | **推荐**:一键启动所有中间件 |

::: tip 🐳 强烈推荐使用 Docker
本项目已在 `deploy/middleware/` 目录下配置好了 **docker-compose.yml**,只需一条命令就能启动所有中间件:
- MySQL 8.0
- Redis 6.0
- RabbitMQ 3.x (单体模式可不启动)
- 及其他可选服务(Nacos, MinIO, Loki, Grafana)

**如果不想使用 Docker**,则需要手动安装 MySQL 和 Redis。
:::

### 验证环境

打开命令行/终端,执行以下命令验证:

```bash
# 检查 JDK 版本
java -version
# 应输出: java version "17.x.x" 或更高

# 检查 Maven 版本
mvn -version
# 应输出: Apache Maven 3.6.x 或更高

# 检查 Node.js 版本
node -v
# 应输出: v16.x.x 或更高

# 检查 Docker 是否安装(推荐)
docker -v
# 应输出: Docker version 20.x.x 或更高

docker compose version
# 应输出: Docker Compose version 2.x.x 或更高
```

## 第一步: 获取项目代码

### 1.1 克隆仓库

打开命令行,执行:

```bash
# 克隆项目(请替换为你的实际Git仓库地址)
git clone https://github.com/your-repo/molandev-backend.git

# 进入项目目录
cd molandev-backend
```

### 1.2 用 IDEA 打开项目

1. 启动 **IntelliJ IDEA**
2. 点击 `File` → `Open`
3. 选择刚才克隆的 `molandev-backend` 文件夹
4. 点击 `OK` 打开项目

::: tip 💡 等待索引建立
IDEA 打开项目后会自动下载 Maven 依赖和建立索引,请耐心等待右下角进度条完成(首次可能需要 5-10 分钟)。
:::

## 第二步: 准备中间件

### 方式一: 使用 Docker 启动 (👍 强烈推荐)

这是**最简单、最快速**的方式!

#### 2.1.1 启动所有中间件

```bash
# 进入 middleware 目录
cd deploy/middleware

# 启动所有中间件 (注意: 新版 Docker 使用 docker compose)
docker compose up -d

# 查看启动状态
docker compose ps
```

::: tip 💡 等待启动完成
首次启动需要下载 Docker 镜像,可能需要 3-5 分钟。

当看到所有服务状态都是 `Up` 时,说明启动成功。

**注意**: 新版 Docker 使用 `docker compose` 命令(中间有空格),旧版使用 `docker-compose`(中间有连字符)。
:::

#### 2.1.2 已启动的服务

执行上述命令后,以下服务将被启动:

| 服务 | 端口 | 说明 | 单体模式必需 |
|------|------|------|-------------|
| **MySQL** | 3306 | 数据库 | ✅ 是 |
| **Redis** | 6379 | 缓存 | ✅ 是 |
| **RabbitMQ** | 5672, 15672 | 消息队列 | ❌ 否(微服务需要) |
| Nacos | 8848 | 配置中心 | ❌ 否(可选) |
| MinIO | 9000, 9001 | 对象存储 | ❌ 否(可选) |
| Loki | 3100 | 日志聚合 | ❌ 否(可选) |
| Grafana | 3000 | 监控面板 | ❌ 否(可选) |

::: warning 🔑 默认密码
项目已配置默认密码,如需修改请编辑 `deploy/middleware/.env` 文件:
- MySQL root 密码: `123456`
- Redis 密码: `123456`
- RabbitMQ: 用户名 `molandev` / 密码见 `.env`
:::

#### 2.1.3 验证服务运行

```bash
# 测试 MySQL 连接
docker exec -it mysql mysql -uroot -p123456 -e "SELECT 1"

# 测试 Redis 连接
docker exec -it redis redis-cli -a 123456 ping
# 应返回: PONG
```

#### 2.1.4 常用 Docker 命令

```bash
# 查看日志
docker compose logs -f mysql
docker compose logs -f redis

# 停止所有服务
docker compose stop

# 重启所有服务
docker compose restart

# 停止并删除容器(数据仍然保留)
docker compose down
```

---

### 方式二: 手动安装 (不推荐)

::: details 点击展开手动安装步骤

如果你不想使用 Docker,需要手动安装以下软件:

**必须安装:**
- MySQL 8.0+: [MySQL 官网](https://dev.mysql.com/downloads/)
- Redis 6.0+: [Redis 官网](https://redis.io/download)

**启动服务:**

Windows:
- MySQL: 打开 "服务" 管理器,启动 MySQL80
- Redis: 打开 "服务" 管理器,启动 Redis

macOS:
```bash
# MySQL
mysql.server start

# Redis
brew services start redis
```

Linux:
```bash
# MySQL
sudo systemctl start mysql

# Redis
sudo systemctl start redis
```

**验证服务:**
```bash
# MySQL
mysql -u root -p

# Redis
redis-cli ping  # 应返回 PONG
```

:::

---

### 2.2 创建数据库

::: danger ⚠️ 重要: 项目使用多数据源
本项目使用了**多数据源**功能,需要创建 **2 个数据库**:
- `molandev_sys` - 系统模块、文件模块、任务模块
- `molandev_msg` - 消息模块
:::

**打开你的 MySQL 客户端** (Navicat / MySQL Workbench / 命令行),执行以下 SQL:

```sql
-- 创建系统数据库
CREATE DATABASE IF NOT EXISTS `molandev_sys` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- 创建消息数据库
CREATE DATABASE IF NOT EXISTS `molandev_msg` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;
```

### 2.3 导入初始化数据

在 `deploy/sql/` 目录下找到初始化SQL文件:

```
deploy/sql/
├── molandev_sys.sql    # 系统库初始化脚本
└── molandev_msg.sql    # 消息库初始化脚本
```

**执行导入:**

```sql
-- 1. 切换到系统数据库
USE molandev_sys;
-- 执行 molandev_sys.sql 中的所有SQL语句

-- 2. 切换到消息数据库
USE molandev_msg;
-- 执行 molandev_msg.sql 中的所有SQL语句
```

::: tip 💡 导入方式
- **Navicat**: 右键数据库 → 运行SQL文件 → 选择对应的 .sql 文件
- **MySQL Workbench**: File → Run SQL Script → 选择对应的 .sql 文件
- **命令行**: `mysql -u root -p molandev_sys < deploy/sql/molandev_sys.sql`
:::

## 第三步: 配置后端

### 3.1 找到配置文件

在 IDEA 中打开以下文件:

```
molandev-backend/molandev-standalone-service/src/main/resources/application-local.yml
```

### 3.2 修改数据库配置

找到 `molandev.datasource` 节,修改为你的 MySQL 连接信息:

```yaml
molandev:
  datasource:
    sys:  # 系统数据库
      url: jdbc:mysql://localhost:3306/molandev_sys?characterEncoding=UTF-8&useSSL=false&serverTimezone=GMT%2B8
      username: root
      password: 你的MySQL密码  # 请修改这里
      driver-class-name: com.mysql.cj.jdbc.Driver
      primary: true
      packages:
        - com.molandev.base
        - com.molandev.ai
```

::: warning 🔑 密码修改
请将 `password: 123456` 修改为你的实际 MySQL root 密码!
:::

### 3.3 修改 Redis 配置

找到 `spring.data.redis` 节,修改为你的 Redis 连接信息:

```yaml
spring:
  data:
    redis:
      host: 127.0.0.1
      port: 6379
      password: 你的Redis密码  # 如果没设置密码则留空或删除这行
      database: 0
```

::: tip 💡 Redis 密码
如果你的 Redis **没有设置密码**,可以:
- 删除 `password` 这一行
- 或者设置为空: `password: ""`
:::

### 3.4 修改文件存储路径

找到 `molandev.file.local.base-path`,修改为你想要存储文件的本地目录:

```yaml
molandev:
  file:
    local:
      base-path: D:/dev/molan/file/  # Windows 路径
      # 或 /Users/yourname/dev/molan/file/  # macOS/Linux 路径
```

::: tip 📝 路径说明
- Windows: 使用 `/` 或 `\\`,例如 `D:/dev/molan/file/`
- macOS/Linux: 直接使用绝对路径,例如 `/Users/yourname/dev/molan/file/`
- 目录会自动创建,不需要手动创建
:::

## 第四步: 启动后端

### 4.1 找到启动类

在 IDEA 左侧项目树中找到:

```
molandev-backend/molandev-standalone-service/src/main/java/
  com/molandev/standalone/StandaloneApp.java
```

### 4.2 运行项目

**方式一: 点击运行按钮** (推荐)

1. 打开 `StandaloneApp.java` 文件
2. 找到 `main` 方法
3. 点击行号旁边的**绿色三角形**▶️
4. 选择 `Run 'StandaloneApp'`

**方式二: 使用快捷键**

1. 打开 `StandaloneApp.java` 文件
2. 按 `Shift + F10` (Windows/Linux) 或 `Control + R` (macOS)

**方式三: Maven 命令**

```bash
# 在项目根目录执行
cd molandev-backend/molandev-standalone-service
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

### 4.3 验证启动成功

当你看到以下日志输出,说明启动成功:

```
  __  __       _                 _               
 |  \/  | ___ | | __ _ _ __   __| | _____   __  
 | |\/| |/ _ \| |/ _` | '_ \ / _` |/ _ \ \ / / 
 | |  | | (_) | | (_| | | | | (_| |  __/\ V /  
 |_|  |_|\___/|_|\__,_|_| |_|\__,_|\___| \_/   

Started StandaloneApp in 8.888 seconds
```

后端服务已启动在: `http://localhost:9099`

::: tip 🎉 测试接口
打开浏览器访问接口文档: `http://localhost:9099/doc.html`

如果能看到 Knife4j 接口文档页面,说明后端运行正常!
:::

## 第五步: 启动前端

::: tip 💡 前端代理配置
前端已在 `vite.config.js` 中配置了代理,所有 `/api` 开头的请求会自动转发到后端服务。

```javascript
// vite.config.js
server: {
  port: 5143,
  proxy: {
    '/api': {
      target: 'http://localhost:9090',  // 后端地址
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '/api')
    }
  }
}
```

**注意**: 如果你的后端端口不是 9090,请修改 `vite.config.js` 中的 `target` 配置。
:::

### 5.1 安装依赖

打开命令行/终端,执行:

```bash
# 进入前端目录
cd frontend

# 安装依赖(首次运行需要,后续不需要)
npm install
```

::: warning ⏳ 耗时说明
首次安装可能需要 3-5 分钟,请耐心等待。

如果下载太慢,可以使用国内镜像:
```bash
npm config set registry https://registry.npmmirror.com
npm install
```
:::

### 5.2 检查代理配置

::: warning ⚠️ 重要: 检查后端端口
确保 `vite.config.js` 中的代理配置与你的后端端口一致!
:::

**检查步骤:**

1. 打开 `frontend/vite.config.js` 文件
2. 找到 `server.proxy['/api'].target` 配置
3. 确认端口与你的后端端口一致:

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:9090',  // 默认后端端口是 9090
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '/api')
  }
}
```

**如果你的后端端口是 9099**(根据 `application-local.yml`),需要修改为:

```javascript
target: 'http://localhost:9099',  // 修改为实际端口
```

::: details 🔍 代理原理说明

**前端请求流程:**

1. 前端发起请求: `http://localhost:5143/api/system/user/list`
2. Vite 代理拦截 `/api` 开头的请求
3. 转发到后端: `http://localhost:9099/api/system/user/list`
4. 后端返回数据给前端

**优点:**
- ✅ 解决跨域问题(CORS)
- ✅ 前端不需要配置完整的后端地址
- ✅ 开发环境和生产环境可以使用不同配置

:::

### 5.3 启动开发服务器

```bash
# 启动前端开发服务
npm run dev
```

启动成功后,你会看到:

```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 5.4 访问系统

打开浏览器,访问: `http://localhost:5173`

**默认登录账号:**
- 用户名: `admin`
- 密码: `admin123`

::: tip 🎉 成功!
如果你能看到登录页面并成功登录,恭喜你,项目已经运行起来了!
:::

## 常见问题

### 1. 后端启动失败: 数据库连接错误

**错误信息:**
```
Communications link failure
```

**解决方案:**
1. 检查 MySQL 是否启动: `mysql -u root -p`
2. 检查用户名密码是否正确
3. 检查数据库是否已创建: `SHOW DATABASES;`
4. 检查端口是否正确(默认 3306)

### 2. 后端启动失败: Redis 连接错误

**错误信息:**
```
Unable to connect to Redis
```

**解决方案:**
1. 检查 Redis 是否启动: `redis-cli ping` (应返回 PONG)
2. 检查配置文件中的 Redis 地址和端口
3. 如果有密码,检查密码是否正确

### 3. 后端启动失败: 端口占用

**错误信息:**
```
Web server failed to start. Port 9099 was already in use.
```

**解决方案:**

**方法一: 修改端口**
- 在 `application-local.yml` 中修改 `server.port: 9099` 为其他端口

**方法二: 关闭占用进程**

Windows:
```bash
netstat -ano | findstr :9099
taskkill /F /PID 进程号
```

macOS/Linux:
```bash
lsof -i :9099
kill -9 进程号
```

### 4. 前端启动失败: 依赖安装错误

**错误信息:**
```
npm ERR! code ELIFECYCLE
```

**解决方案:**
```bash
# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 清理 npm 缓存
npm cache clean --force

# 重新安装
npm install
```

### 5. 前端代理配置错误

**问题**: 前端请求后端接口报错 404 或 ERR_CONNECTION_REFUSED

**解决方案:**
1. 确认后端服务已启动: 访问 `http://localhost:9099/doc.html`
2. 检查 `vite.config.js` 中的代理配置:
   ```javascript
   proxy: {
     '/api': {
       target: 'http://localhost:9099',  // 确认端口正确
       changeOrigin: true
     }
   }
   ```
3. 修改后重启前端: `npm run dev`
4. 清除浏览器缓存: `Ctrl + Shift + Delete`

### 6. 前端白屏或接口调用失败

**问题**: 打开浏览器显示白屏,或控制台报错 404

**解决方案:**
1. 确认后端服务已启动: 访问 `http://localhost:9099/doc.html`
2. 检查 `vite.config.js` 的代理配置(参考问题5)
3. 打开浏览器控制台(F12)查看具体错误信息
4. 确认前端请求路径以 `/api` 开头
5. 删除 `node_modules` 重新安装依赖

### 7. Maven 依赖下载失败

**问题**: IDEA 一直在下载依赖,或报错 "Cannot resolve..."

**解决方案:**

::: tip 💡 Maven 依赖下载
项目 `pom.xml` 中已配置阿里云镜像源,首次编译会自动从阿里云下载依赖,速度较快。

如果下载缓慢,请检查网络连接。
:::

**方法一: 在 IDEA 中重新导入**

1. 右键项目
2. 选择 `Maven` → `Reload project`

## 下一步

恭喜你成功运行 MolanDev Backend! 🎉

现在你可以:

### 📖 学习项目架构
- [项目介绍](/guide/introduction) - 了解项目特性
- [架构说明](/guide/architecture) - 理解系统设计
- [双模部署](/features/dual-mode) - 学习核心特性

### 👨‍💻 开始开发
- [项目结构](/development/project-structure) - 熟悉代码结构
- [API 开发](/development/api-development) - 开发新接口
- [前端开发](/development/frontend-dev) - 开发前端页面

### 🔧 使用工具
- [代码生成器](/development/code-generator) - 快速生成 CRUD 代码
- [最佳实践](/development/best-practices) - 学习开发规范

### 📚 探索功能模块
- [系统管理](/modules/system/user) - 用户、角色、菜单
- [定时任务](/modules/job/scheduler) - 任务调度
- [消息服务](/modules/msg/notification) - 消息通知
- [文件服务](/modules/file/upload) - 文件管理

::: tip 👨‍🏫 需要帮助?
- 查阅 [常见问题](/reference/faq)
- 阅读 [故障排查](/reference/troubleshooting)
- 加入社区交流群(如果有)
:::

---

## 附录: 微服务模式开发

::: warning 👀 高级内容
以下内容面向需要开发**微服务模式**的开发者,如果你刚开始学习,可以跳过这部分。
:::

### 额外需要的中间件

微服务模式需要额外的中间件:

| 中间件 | 端口 | 用途 | Docker启动 |
|---------|------|------|-------------|
| **RabbitMQ** | 5672, 15672 | 消息队列(事件总线) | ✅ 已配置 |
| **Nacos** | 8848 | 配置中心+服务注册 | ✅ 已配置 |

**好消息**: 这些服务已经在 `deploy/middleware/docker-compose.yml` 中配置好了,上面启动中间件时已经一起启动了!

**访问地址:**
- RabbitMQ 管理界面: `http://localhost:15672` (用户名: molandev / 密码: 见 `.env`)
- Nacos 控制台: `http://localhost:8848/nacos` (默认用户名/密码: nacos/nacos)

### 配置 Nacos

#### 1. 登录 Nacos 控制台

1. 打开浏览器访问: `http://localhost:8848/nacos`
2. 输入用户名: `nacos`,密码: `nacos`
3. 点击登录

#### 2. 创建命名空间

::: danger ⚠️ 必须步骤
命名空间必须与 `application.yml` 中配置的保持一致!
:::

1. 点击左侧菜单 `命名空间`
2. 点击右上角 `新建命名空间` 按钮
3. 填写信息:
   - **命名空间ID**: `molandev_local`
   - **命名空间名**: `本地开发环境`(可自定义)
4. 点击 `确定`

#### 3. 导入配置文件

项目已在 `deploy/configs/` 目录下准备好了所有配置文件:

```
deploy/configs/
├── common-rabbitmq.yml      # RabbitMQ 公共配置
├── molandev-base.yml        # 基础服务配置
├── molandev-ai.yml          # AI 服务配置(如有)
```

**导入步骤:**

1. 点击左侧菜单 `配置管理` → `配置列表`
2. 确认当前命名空间为 `molandev_local`
3. 点击 `导入配置` 按钮
4. 选择 `deploy/configs/` 目录下的所有 `.yml` 文件
5. 点击 `上传` 并 `导入`

::: tip 💡 批量导入
可以同时选择多个文件一次性导入。
:::

**或者手动创建配置:**

对于每个配置文件:

1. 点击 `+` 号创建配置
2. 填写:
   - **Data ID**: `common-rabbitmq.yml` (文件名)
   - **Group**: `DEFAULT_GROUP`
   - **配置格式**: `YAML`
3. 将 `deploy/configs/common-rabbitmq.yml` 的内容复制粘贴到配置内容区域
4. 点击 `发布`
5. 重复以上步骤导入其他配置文件

#### 4. 验证配置

在 Nacos 控制台的配置列表中,你应该能看到:

| Data ID | Group | 命名空间 |
|---------|-------|----------|
| common-rabbitmq.yml | DEFAULT_GROUP | molandev_local |
| system-service.yml | DEFAULT_GROUP | molandev_local |
| ... | DEFAULT_GROUP | molandev_local |

### 配置微服务模式

#### 1. 修改运行模式

在各个服务的配置文件中,将 `run-mode` 从 `single` 改为 `cloud`:

```yaml
# 例如: system-service/src/main/resources/application-local.yml
molandev:
  run-mode: cloud  # 修改为 cloud
```

#### 2. 验证 Nacos 配置

查看各服务的 `application.yml`,确认已配置 Nacos:

```yaml
# 例如: system-service/src/main/resources/application.yml
spring:
  application:
    name: system-service
  config:
    import:
      - classpath:application-common.yml
      - "nacos:common-rabbitmq.yml"  # 从 Nacos 导入
      - "nacos:${spring.application.name}.yml"  # 从 Nacos 导入
  cloud:
    nacos:
      discovery:
        server-addr: ${NACOS_SERVER_ADDR:127.0.0.1:8848}
        namespace: ${NACOS_NAMESPACE:molandev_local}  # 命名空间
      config:
        server-addr: ${NACOS_SERVER_ADDR:127.0.0.1:8848}
        namespace: ${NACOS_NAMESPACE:molandev_local}  # 命名空间
        file-extension: yaml
```

::: tip 💡 配置说明
- `spring.config.import`: 使用 `nacos:` 前缀从 Nacos 导入配置
- `namespace: molandev_local`: 必须与 Nacos 中创建的命名空间 ID 一致
- 环境变量 `NACOS_SERVER_ADDR` 和 `NACOS_NAMESPACE` 可用于覆盖默认值
:::

### 启动顺序

微服务模式需要启动多个服务:

#### 1. 确认中间件运行

```bash
cd deploy/middleware
docker-compose ps

# 确认以下服务状态为 Up:
# - mysql
# - redis
# - rabbitmq
# - nacos-standalone
```

#### 2. 在 IDEA 中启动各个服务

**推荐启动顺序:**

1. **Gateway** (8080) - `molandev-gateway/src/main/java/.../GatewayApp.java`
2. **Base Service** (8081) - `molandev-base/src/main/java/.../BaseApp.java`
3. **AI Service** (8082) - `molandev-ai/src/main/java/.../AiApp.java`

::: tip 💡 IDEA 多服务运行
1. 右键项目根目录
2. 选择 `Run` → `Edit Configurations`
3. 点击 `+` → `Application`
4. 分别配置各个服务的启动类
5. 可以一键启动所有服务
:::

#### 3. 验证服务注册

打开 Nacos 控制台: `http://localhost:8848/nacos`

1. 点击左侧菜单 `服务管理` → `服务列表`
2. 切换命名空间为 `molandev_local`
3. 应该能看到所有启动的服务:
   - molandev-base
   - molandev-ai
   - gateway

#### 4. 访问系统

微服务模式下,所有请求都通过 Gateway 转发:

- 前端访问: `http://localhost:5173`
- 后端 API: `http://localhost:8080` (Gateway 统一入口)
- 各服务直接访问: `http://localhost:808x`

### 常见问题

#### 1. Nacos 连接失败

**错误信息:**
```
Can not find Nacos
```

**解决方案:**
1. 检查 Nacos 是否启动: `docker ps | grep nacos`
2. 访问 Nacos 控制台确认服务可用: `http://localhost:8848/nacos`
3. 检查配置中的 `server-addr` 是否正确

#### 2. 配置加载失败

**错误信息:**
```
Can not load config from Nacos
```

**解决方案:**
1. 检查命名空间 `molandev_local` 是否已创建
2. 检查配置文件是否已导入 Nacos
3. 确认 Data ID 和 Group 配置正确
4. 检查配置文件格式是否为 YAML

#### 3. 服务注册失败

**问题**: Nacos 控制台看不到服务

**解决方案:**
1. 检查服务是否正常启动(查看控制台日志)
2. 确认命名空间选择正确
3. 检查网络连接(防火墙设置)
4. 查看服务启动日志中的 Nacos 注册信息

#### 4. RabbitMQ 连接失败

**错误信息:**
```
Unable to connect to RabbitMQ
```

**解决方案:**
1. 检查 RabbitMQ 是否启动: `docker ps | grep rabbitmq`
2. 访问 RabbitMQ 管理界面: `http://localhost:15672`
3. 检查 `common-rabbitmq.yml` 配置是否正确
4. 确认用户名密码配置正确

### 微服务 vs 单体模式对比

| 项目 | 单体模式 | 微服务模式 |
|------|----------|-------------|
| **中间件** | MySQL + Redis | MySQL + Redis + RabbitMQ + Nacos |
| **服务数** | 1个 | 2-3个 |
| **启动时间** | ~10秒 | ~1分钟 |
| **内存占用** | ~500MB | ~1.5GB |
| **配置管理** | 本地文件 | Nacos 集中管理 |
| **调试难度** | 简单 | 中等 |
| **适用场景** | 本地开发 | 生产环境、性能测试 |

::: tip 💡 开发建议
- **日常开发**: 使用单体模式,快速、简单
- **集成测试**: 使用微服务模式,验证服务间通信
- **生产环境**: 使用微服务模式,独立扩展
:::

详细内容请参考 [双模部署文档](/features/dual-mode)
