# 操作日志

## 解决的问题

企业级系统需要完整的操作审计功能，用于：

- 🔍 **安全审计** - 追踪谁在什么时间做了什么操作
- 🐛 **问题排查** - 数据异常时回溯操作记录
- 📊 **行为分析** - 统计用户操作习惯和频率
- ⚖️ **合规要求** - 满足等保、ISO 等合规标准

传统做法是在业务代码中手动记录日志，存在以下问题：

- ❌ **代码侵入** - 每个操作都需要写日志记录代码
- ❌ **容易遗漏** - 开发人员可能忘记添加日志
- ❌ **格式不统一** - 不同开发人员记录的信息不一致
- ❌ **维护困难** - 修改日志格式需要改动大量代码

MolanDev Backend 通过 `@OpLog` 注解 + AOP 切面实现**声明式操作日志**，一行注解自动记录完整的操作信息。

## 核心特性

### ✅ 声明式记录
- 一个注解自动记录操作日志
- 无需在业务代码中手动编写日志逻辑
- AOP 切面统一处理

### ✅ 信息完整
- 操作人员（账号、姓名）
- 操作时间
- 操作类型（新增、修改、删除等）
- 操作模块
- 请求参数
- 操作详情（自定义业务信息）

### ✅ 安全可靠
- 异步记录，不影响业务性能
- 记录失败不影响业务操作
- 敏感字段自动过滤（如密码）

### ✅ 易于查询
- 按时间、操作人、模块筛选
- 支持导出审计报告

## 基础使用

### 1. 添加注解

在 Controller 方法上添加 `@OpLog` 注解：

```java
@RestController
@RequestMapping("/sys/user")
public class SysUserController {
    
    @PostMapping("/add")
    @HasPermission("sys:user:add")
    @OpLog(title = "新增用户", type = OpTypes.ADD, module = "用户管理")
    public JsonResult<String> add(SysUserEntity user) {
        // 业务逻辑
        sysUserService.save(user);
        return JsonResult.success(user.getId());
    }
    
    @PostMapping("/edit")
    @OpLog(title = "编辑用户", type = OpTypes.UPDATE, module = "用户管理")
    @HasPermission("sys:user:edit")
    public JsonResult<Void> edit(SysUserEntity user) {
        sysUserService.updateById(user);
        return JsonResult.success();
    }
    
    @PostMapping("/delete")
    @OpLog(title = "删除用户", type = OpTypes.DELETE, module = "用户管理")
    @HasPermission("sys:user:delete")
    public JsonResult<Void> delete(@RequestParam String id) {
        sysUserService.removeById(id);
        return JsonResult.success();
    }
}
```

**就这么简单！** 操作日志会自动记录到 `sys_operate_log` 表。

### 2. @OpLog 注解属性

```java
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
public @interface OpLog {
    
    /**
     * 操作描述（必填）
     */
    String title();
    
    /**
     * 操作类型
     * ADD, UPDATE, DELETE, QUERY, EXPORT, IMPORT 等
     */
    String type() default "";
    
    /**
     * 所属模块
     */
    String module() default "";
    
    /**
     * 是否记录请求参数（默认 true）
     */
    boolean inParam() default true;
}
```

### 3. 操作类型常量

系统预定义了常用的操作类型：

```java
public interface OpTypes {
    String ADD = "ADD";          // 新增
    String UPDATE = "UPDATE";    // 修改
    String DELETE = "DELETE";    // 删除
    String QUERY = "QUERY";      // 查询
    String EXPORT = "EXPORT";    // 导出
    String IMPORT = "IMPORT";    // 导入
    String GRANT = "GRANT";      // 授权
    String OTHER = "OTHER";      // 其他
}
```

## 自定义详情

### 1. 设置操作详情

使用 `OplogContext` 设置额外的业务信息：

```java
@PostMapping("/add")
@OpLog(title = "新增用户", type = OpTypes.ADD, module = "用户管理")
public JsonResult<String> add(SysUserEntity user) {
    sysUserService.save(user);
    
    // 设置操作详情
    OplogContext.setDetail("用户名称：" + user.getRealName());
    
    return JsonResult.success(user.getId());
}

@PostMapping("/delete")
@OpLog(title = "删除角色", type = OpTypes.DELETE, module = "角色管理")
public JsonResult<Void> delete(@RequestParam String id) {
    SysRoleEntity role = sysRoleService.getById(id);
    if (role != null) {
        // 记录被删除的角色名称
        OplogContext.setDetail("角色名称：" + role.getRoleName());
        sysRoleService.removeById(id);
    }
    return JsonResult.success();
}
```

**记录效果：**
```
操作标题：新增用户
操作详情：用户名称：张三
操作时间：2024-01-15 10:30:25
操作人员：admin（管理员）
```

### 2. 详情的最佳实践

**推荐记录：**
- ✅ 关键业务字段（如姓名、编号）
- ✅ 数量统计（如批量删除了 5 条数据）
- ✅ 重要变更（如从"待审核"改为"已通过"）

**不要记录：**
- ❌ 敏感信息（密码、身份证号）
- ❌ 大量数据（整个对象 JSON）
- ❌ 冗余信息（已在请求参数中）

## 日志记录内容

### 自动记录字段

每条操作日志自动包含以下信息：

| 字段 | 说明 | 来源 |
|------|------|------|
| id | 日志ID | UUID 生成 |
| title | 操作标题 | @OpLog.title |
| module | 操作模块 | @OpLog.module |
| operateType | 操作类型 | @OpLog.type |
| userId | 操作人ID | 当前登录用户 |
| account | 操作人账号 | 当前登录用户 |
| realName | 操作人姓名 | 当前登录用户 |
| inputParam | 请求参数 | HTTP 请求参数 |
| detail | 操作详情 | OplogContext.setDetail() |
| createTime | 操作时间 | 自动生成 |

### 参数记录

默认记录 HTTP 请求参数：

```java
// 请求：POST /sys/user/add?account=zhangsan&realName=张三

// 记录的参数：
{
  "account": "zhangsan",
  "realName": "张三"
}
```

**敏感字段过滤：**
- `password` 字段自动过滤，不会记录到日志

**禁用参数记录：**
```java
@OpLog(title = "查询用户", inParam = false)
public JsonResult<List<User>> list(UserQuery query) {
    // 不记录请求参数（查询接口参数可能很多）
}
```

## 实现原理

### 1. AOP 切面

通过 Spring AOP 拦截带有 `@OpLog` 注解的方法：

```java
@Aspect
@Component
public class OperationLogAspect {
    
    @Around("@annotation(opLog)")
    public Object around(ProceedingJoinPoint point, OpLog opLog) 
            throws Throwable {
        // 1. 构建日志对象
        OperateLogDto log = buildLog(opLog);
        OplogContext.set(log);
        
        // 2. 执行业务方法
        Object result = point.proceed();
        
        // 3. 异步保存日志
        try {
            logService.save(log);
        } catch (Exception e) {
            log.error("保存操作日志失败", e);
        }
        
        return result;
    }
}
```

### 2. 线程上下文

使用 `ThreadLocal` 传递日志上下文：

```java
public class OplogContext {
    
    private static final ThreadLocal<OperateLogDto> CONTEXT = 
        new ThreadLocal<>();
    
    public static void setDetail(String detail) {
        OperateLogDto log = CONTEXT.get();
        if (log != null) {
            log.setDetail(detail);
        }
    }
    
    static void set(OperateLogDto log) {
        CONTEXT.set(log);
    }
    
    static void clear() {
        CONTEXT.remove();
    }
}
```

业务代码中调用 `OplogContext.setDetail()` 可以在切面记录之前补充详情。

### 3. 异步处理

日志记录采用异步方式，不阻塞业务操作：

```java
try {
    logService.save(log);
} catch (Exception e) {
    log.error("保存日志失败", e);
    // 不抛出异常，不影响业务
}
```

**优点：**
- ✅ 日志记录失败不影响业务
- ✅ 提升接口响应速度
- ✅ 数据库压力分散

## 日志查询

### 管理界面

系统提供操作日志查询页面：

**筛选条件：**
- 操作时间范围
- 操作人员
- 操作模块
- 操作类型

**显示信息：**
- 操作时间、操作人、模块、类型
- 操作标题和详情
- 请求参数（可展开查看）

::: tip TODO - 操作日志界面
**建议截图：** 操作日志列表页面，展示筛选条件和日志详情
:::

### 导出功能

支持导出操作日志为 Excel：

```java
@PostMapping("/export")
@HasPermission("sys:operateLog:export")
@OpLog(title = "导出操作日志", type = OpTypes.EXPORT, module = "操作日志")
public void export(SysOperateLogEntity query, HttpServletResponse response) {
    List<SysOperateLogEntity> logs = logService.list(query);
    ExcelUtils.export(response, "操作日志", logs, SysOperateLogEntity.class);
}
```

## 代码生成器集成

使用代码生成器时，自动为增删改接口添加 `@OpLog` 注解：

```java
// 生成的 Controller 代码
@PostMapping("/add")
@HasPermission("module:entity:add")
@OpLog(title = "新增XXX", type = OpTypes.ADD, module = "XXX管理")
public JsonResult<String> add(@ParameterObject XxxEntity entity) {
    xxxService.save(entity);
    return JsonResult.success(entity.getId());
}
```

开箱即用，无需手动添加。

## 最佳实践

### 1. 合理使用操作日志

**应该记录：**
- ✅ 数据变更操作（增删改）
- ✅ 重要查询（敏感数据查询）
- ✅ 权限变更（授权、分配角色）
- ✅ 批量操作（批量删除、批量导入）
- ✅ 导出操作（数据导出）

**可以不记录：**
- ❌ 普通查询接口
- ❌ 高频调用接口（会产生大量日志）
- ❌ 文件上传下载（有专门的文件日志）

### 2. 操作详情规范

```java
// ✅ 好的示例
OplogContext.setDetail("用户名称：张三");
OplogContext.setDetail("批量删除 5 条数据");
OplogContext.setDetail("从「待审核」改为「已通过」");

// ❌ 不好的示例
OplogContext.setDetail(JSONUtils.toJsonString(user));  // 太冗长
OplogContext.setDetail("删除");  // 太简单，没有意义
```

### 3. 日志清理策略

操作日志会持续增长，建议定期清理历史数据。

**系统规划的清理方案：**

系统已规划基于内置定时任务实现日志清理功能：

```java
/**
 * 定时清理操作日志
 * 每天凌晨 2 点执行
 */
@TaskSchedule("CleanOperateLogJob")
public void cleanOldLogs() {
    // 删除 6 个月前的日志
    LocalDateTime sixMonthsAgo = LocalDateTime.now().minusMonths(6);
    
    LambdaQueryWrapper<SysOperateLogEntity> wrapper = Wrappers.lambdaQuery();
    wrapper.lt(SysOperateLogEntity::getCreateTime, sixMonthsAgo);
    
    int count = operateLogService.remove(wrapper);
    log.info("清理操作日志完成，删除 {} 条记录", count);
}
```

**配置清理策略：**

在任务管理界面配置清理任务：

```yaml
任务名称: CleanOperateLogJob
Cron 表达式: 0 0 2 * * ?    # 每天凌晨 2 点执行
任务描述: 清理 6 个月前的操作日志
```

**清理建议：**
- 📅 **保留周期**：根据合规要求设置（如 6 个月、1 年）
- ⏰ **执行时间**：选择业务低峰期（如凌晨 2-4 点）
- 📊 **分批删除**：数据量大时分批处理，避免数据库压力
- 📝 **记录日志**：清理完成后记录删除数量，便于追踪

**注意事项：**
- ⚠️ 日志一旦删除无法恢复，请谨慎设置清理周期
- ⚠️ 如需长期保存审计数据，建议备份到其他存储系统
- ⚠️ 系统暂不支持日志归档功能，删除前请做好数据备份

### 4. 与登录日志的区别

系统有两种日志：

**操作日志（sys_operate_log）：**
- 记录业务操作
- 使用 @OpLog 注解
- 登录后的所有操作

**登录日志（sys_login_log）：**
- 记录登录行为
- 自动记录在 LoginController
- 包含登录成功/失败、IP、浏览器等

## 总结

MolanDev Backend 的操作日志功能实现了：

- ✅ **声明式** - `@OpLog` 注解一行代码完成
- ✅ **无侵入** - AOP 切面统一处理，不影响业务代码
- ✅ **信息全** - 自动记录操作人、时间、参数、详情
- ✅ **性能好** - 异步记录，不阻塞业务
- ✅ **易查询** - 管理界面支持多条件筛选和导出

通过操作日志，系统拥有了完整的审计能力，满足安全合规要求，同时为问题排查和数据分析提供了重要依据。
