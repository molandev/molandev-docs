# 开发规范

本文档规定 MolanDev Cloud 项目的开发规范，确保代码质量和团队协作效率。

## 包结构规范

### 标准包结构

```
com.molandev.cloud.{module}
├── controller/          # 控制器（或实现 API 接口）
├── service/            # 业务逻辑接口
│   ├── impl/           # 服务实现
│   └── dto/            # 数据传输对象
├── mapper/             # MyBatis Mapper 接口
├── entity/             # 数据库实体类
├── vo/                 # 视图对象（返回给前端）
├── enums/              # 枚举类
├── constant/           # 常量定义
├── config/             # 配置类
├── exception/          # 异常类
└── utils/              # 工具类
```

### 包命名说明

| 包名 | 用途 | 示例 |
|------|------|------|
| controller | 控制器，处理 HTTP 请求 | `SysUserController` |
| service | 业务逻辑实现类 | `SysUserService` |
| mapper | 数据访问层 | `SysUserMapper` |
| entity | 数据库实体类 | `SysUserEntity` |
| dto | 数据传输对象 | `SysUserDTO` |
| vo | 视图对象 | `SysUserVO` |
| enums | 枚举类 | `UserStatusEnum` |
| constant | 常量 | `UserConstant` |
| config | 配置类 | `RedisConfig` |

## 命名规范

### 类命名

**1. 实体类（Entity）**

```java
// ✅ 正确：统一以 Entity 结尾
public class SysUserEntity { }
public class SysDeptEntity { }

// ❌ 错误：不要省略 Entity 后缀
public class SysUser { }
public class SysDept { }
```

**2. DTO（Data Transfer Object）**

```java
// ✅ 正确：以 DTO 结尾
public class SysUserDTO { }
public class LoginDTO { }

// ❌ 错误：不规范的命名
public class SysUserRequest { }
public class UserParam { }
```

**3. VO（View Object）**

```java
// ✅ 正确：以 VO 结尾
public class SysUserVO { }
public class MenuTreeVO { }

// ❌ 错误
public class SysUserView { }
```

**4. Controller**

```java
// ✅ 正确：以 Controller 结尾
@RestController
public class SysUserController { }

// ❌ 错误
public class UserAction { }
```

**5. Service**

```java
// ✅ 正确：直接使用 Service 类，继承 ServiceImpl
@Service
public class SysUserService extends ServiceImpl<SysUserMapper, SysUserEntity> { }

// ❌ 错误：不要使用接口+实现类模式
public interface ISysUserService { }
public class SysUserServiceImpl implements ISysUserService { }
```

**6. Mapper**

```java
// ✅ 正确：以 Mapper 结尾
public interface SysUserMapper extends BaseMapper<SysUser> { }

// ❌ 错误
public interface SysUserDao { }
```

### 方法命名

**1. Controller 方法**

参考项目代码生成器模板，使用 `add`、`edit`、`delete`、`list` 等方法名。

**2. Service 方法**

```java
// ✅ 正确：业务语义明确
public Page<SysUserVO> list(SysUserQuery query) { }
public void saveUser(SysUserEntity entity, String roleIds) { }
public void updateUser(SysUserEntity entity, String roleIds) { }
public void deleteById(String id) { }

// ❌ 错误：语义不清
public List<SysUserVO> query() { }
public void add() { }
public void remove() { }
```

**3. Mapper 方法**

```java
// ✅ 正确：以 select、insert、update、delete 开头
SysUser selectByUsername(String username);
List<SysUser> selectByDeptId(Long deptId);
int insertBatch(List<SysUser> users);
int updateStatus(Long id, Integer status);
int deleteByIds(List<Long> ids);

// ❌ 错误
SysUser getByUsername();
List<SysUser> findByDept();
```

### 变量命名

```java
// ✅ 正确：小驼峰
private String userName;
private Integer userAge;
private List<Long> roleIds;

// ❌ 错误
private String user_name;  // 不要使用下划线
private String UserName;   // 不要首字母大写
```

### 常量命名

```java
// ✅ 正确：全大写，下划线分隔
public static final String DEFAULT_PASSWORD = "123456";
public static final Integer MAX_LOGIN_RETRY = 5;

// ❌ 错误
public static final String defaultPassword = "123456";
public static final Integer maxLoginRetry = 5;
```

## 代码规范参考

本项目代码规范遵循《阿里巴巴 Java 开发手册》，包括但不限于：

- **命名规范**：类名、方法名、变量名、常量名等
- **注释规范**：类注释、方法注释、字段注释等
- **格式规范**：缩进、换行、空格等
- **编程规约**：集合处理、并发处理、异常处理等

**参考资料：**
- [阿里巴巴 Java 开发手册](https://github.com/alibaba/p3c)
- IDEA 插件：Alibaba Java Coding Guidelines

**项目特定规范：**

本文档仅说明项目特有的规范，如 Controller 方法命名、JsonResult 返回码、Entity 字段规范等。其他通用规范请参考阿里巴巴开发手册。

## 代码分层规范

### 分层架构

```
Controller (控制层)
    ↓ 接收请求、参数校验
Service (业务层)
    ↓ 业务逻辑、事务控制
Mapper (数据访问层)
    ↓ 数据库操作
Database (数据库)
```

### 分层职责

**1. Controller 层**

- ✅ 接收 HTTP 请求
- ✅ 参数校验
- ✅ 调用 Service 处理业务
- ✅ 返回统一响应（`JsonResult<T>`）
- ❌ 不要写业务逻辑
- ❌ 不要直接调用 Mapper

**2. Service 层**

- ✅ 处理业务逻辑
- ✅ 事务控制（`@Transactional`）
- ✅ 调用 Mapper 操作数据（继承 ServiceImpl，可直接使用 save、update 等方法）
- ✅ Entity 与 VO/DTO 转换
- ❌ 不要处理 HTTP 相关逻辑
- ❌ 不要直接返回 Entity

```java
@Service
@Transactional(rollbackFor = Exception.class)
public class SysUserService extends ServiceImpl<SysUserMapper, SysUserEntity> {
    
    @Autowired
    private SysRoleService sysRoleService;
    
    public Page<SysUserVO> list(SysUserQuery query) {
        Page<SysUserEntity> page = this.page(
            new Page<>(query.getPageNum(), query.getPageSize()),
            new LambdaQueryWrapper<SysUserEntity>()
                .like(StringUtils.hasText(query.getUsername()), 
                    SysUserEntity::getUsername, query.getUsername())
        );
        return page.convert(this::toVO);
    }
    
    public void saveUser(SysUserEntity user, String roleIds) {
        // 业务逻辑
        checkRepeat(user);
        user.setPassword(passwordEncoder.encode(defaultPassword));
        this.save(user);  // ServiceImpl 提供的方法
        saveRoles(user, roleIds);
    }
    
    private SysUserVO toVO(SysUserEntity entity) {
        SysUserVO vo = new SysUserVO();
        BeanUtils.copyProperties(entity, vo);
        return vo;
    }
}
```

**3. Mapper 层**

- ✅ 数据库操作
- ✅ 使用 MyBatis Plus 内置方法
- ✅ 自定义 SQL（使用注解）
- ❌ 不要写业务逻辑
```

## 接口规范

### 请求格式

**默认请求格式：**

如无特殊配置，接口默认使用 **`application/x-www-form-urlencoded`** 格式。

```java
// ✅ 默认格式：application/x-www-form-urlencoded
@PostMapping("/list")
public JsonResult<PageResult<SysUserEntity>> list(
    @ParameterObject PageQuery pageQuery,
    @ParameterObject SysUserEntity user) {
    // 参数自动绑定
}

// ✅ JSON 格式：使用 @RequestBody
@PostMapping("/add")
public JsonResult<String> add(@RequestBody SysUserEntity user) {
    // 仅当需要接收 JSON 时使用 @RequestBody
}
```

**格式选择规则：**

| 场景 | 格式 | 注解 | 说明 |
|------|------|------|------|
| 分页查询 | `application/x-www-form-urlencoded` | 无需注解 | 默认格式 |
| 表单提交 | `application/x-www-form-urlencoded` | 无需注解 | 默认格式 |
| 复杂对象 | `application/json` | `@RequestBody` | 需要明确指定 |
| 文件上传 | `multipart/form-data` | `@RequestParam` | 文件上传 |

### Controller 接口规范

**基本结构：**

```java
@Tag(name = "用户管理")
@RestController
@RequestMapping("/system/user")
public class SysUserController {
    
    @Autowired
    private SysUserService sysUserService;
    
    // 1. 查询详情
    @Operation(summary = "用户信息")
    @PostMapping("/info")
    public JsonResult<SysUserEntity> info(@RequestParam String id) {
        if (StringUtils.isEmpty(id)) {
            return JsonResult.invalid("主键不能为空");
        }
        return JsonResult.success(sysUserService.getById(id));
    }
    
    // 2. 新增
    @Operation(summary = "新增用户")
    @PostMapping("/add")
    @HasPermission("user:add")
    @OpLog(title = "新增用户", type = OpTypes.ADD, module = "用户管理")
    public JsonResult<String> add(@ParameterObject SysUserEntity user) {
        if (StringUtils.isNotEmpty(user.getId())) {
            return JsonResult.invalid("主键不能有值");
        }
        sysUserService.save(user);
        return JsonResult.success(user.getId());
    }
    
    // 3. 编辑
    @Operation(summary = "编辑用户")
    @PostMapping("/edit")
    @HasPermission("user:edit")
    @OpLog(title = "编辑用户", type = OpTypes.UPDATE, module = "用户管理")
    public JsonResult<Void> edit(@ParameterObject SysUserEntity user) {
        if (StringUtils.isEmpty(user.getId())) {
            return JsonResult.invalid("主键不能为空");
        }
        sysUserService.saveOrUpdate(user);
        return JsonResult.success();
    }
    
    // 4. 删除
    @Operation(summary = "删除用户")
    @PostMapping("/delete")
    @HasPermission("user:delete")
    @OpLog(title = "删除用户", type = OpTypes.DELETE, module = "用户管理")
    public JsonResult<Void> delete(@RequestParam String id) {
        if (StringUtils.isEmpty(id)) {
            return JsonResult.invalid("主键不能为空");
        }
        sysUserService.removeById(id);
        return JsonResult.success();
    }
    
    // 5. 分页列表
    @Operation(summary = "分页查询用户")
    @PostMapping("/list")
    public JsonResult<PageResult<SysUserEntity>> list(
            @ParameterObject PageQuery pageQuery,
            @ParameterObject SysUserEntity user) {
        Page<SysUserEntity> page = sysUserService.page(
            DbQueryUtils.toPage(pageQuery),
            Wrappers.query(user)
        );
        return JsonResult.success(DbQueryUtils.pageResult(page));
    }
}
```

**接口说明：**

| 接口 | 请求方式 | URL | 说明 |
|------|----------|-----|------|
| 查询详情 | POST | `/xxx/info` | 根据 ID 查询 |
| 新增 | POST | `/xxx/add` | 新增数据，ID 不能有值 |
| 编辑 | POST | `/xxx/edit` | 编辑数据，ID 不能为空 |
| 删除 | POST | `/xxx/delete` | 删除数据（逻辑删除） |
| 分页列表 | POST | `/xxx/list` | 分页查询 |

### JsonResult 统一响应

**响应结构：**

```java
public class JsonResult<T> {
    private String code;  // 状态码
    private String msg;   // 消息
    private T data;       // 数据
}
```

**状态码定义：**

| 状态码 | 常量 | 说明 | 使用场景 |
|---------|---------|------|----------|
| `0000` | SUCCESS | 成功 | 操作成功 |
| `1000` | FAILED | 失败 | 业务失败 |
| `2001` | INVALID | 参数不合法 | 参数校验失败 |
| `3001` | NOT_LOGIN | 未登录 | 用户未登录 |
| `3002` | NO_PERMISSION | 没有权限 | 权限不足 |
| `3011` | FIRST_LOGIN | 首次登录 | 首次登录需修改密码 |
| `3012` | KICK_OUT | 被踢出 | 用户被踢出 |
| `3022` | PWD_EXPIRE | 密码过期 | 密码已过期 |
| `4001` | VERIFY_ERROR | 验证码错误 | 验证码校验失败 |

**使用示例：**

```java
// 成功响应（无数据）
return JsonResult.success();
// {"code":"0000","msg":null,"data":null}

// 成功响应（有数据）
return JsonResult.success(user);
// {"code":"0000","msg":null,"data":{...}}

// 失败响应
return JsonResult.failed("用户名已存在");
// {"code":"1000","msg":"用户名已存在","data":null}

// 参数错误
return JsonResult.invalid("主键不能为空");
// {"code":"2001","msg":"主键不能为空","data":null}

// 未登录
return JsonResult.notLogin();
// {"code":"3001","msg":"未登录","data":null}

// 没有权限
return JsonResult.noPermission();
// {"code":"3002","msg":"权限不足","data":null}
```

### 接口注解规范

```java
// ✅ 正确：使用 Swagger 注解
@Tag(name = "用户管理")  // 控制器级别
@Operation(summary = "新增用户")  // 方法级别
@Parameter(description = "主键标识", required = true)  // 参数级别

// ✅ 正确：使用权限注解
@HasPermission("user:add")  // 权限控制

// ✅ 正确：使用操作日志注解
@OpLog(title = "新增用户", type = OpTypes.ADD, module = "用户管理")
```

```java
@Data
public class SysUserDTO {
    
    @NotBlank(message = "用户名不能为空")
    @Length(min = 4, max = 20, message = "用户名长度为4-20个字符")
    private String username;
    
    @NotBlank(message = "密码不能为空")
    @Length(min = 6, max = 20, message = "密码长度为6-20个字符")
    private String password;
    
    @Email(message = "邮箱格式不正确")
    private String email;
    
    @NotNull(message = "状态不能为空")
    private Integer status;
}
```

## 异常处理规范

### 业务异常

```java
// 定义业务异常
public class BusinessException extends RuntimeException {
    
    private Integer code;
    
    public BusinessException(String message) {
        super(message);
        this.code = 500;
    }
    
    public BusinessException(Integer code, String message) {
        super(message);
        this.code = code;
    }
}

// 使用业务异常
@Override
public void save(SysUserDTO dto) {
    SysUser existUser = userMapper.selectByUsername(dto.getUsername());
    if (existUser != null) {
        throw new BusinessException("用户名已存在");
    }
    // ...
}
```

### 全局异常处理

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(BusinessException.class)
    public R<?> handleBusinessException(BusinessException e) {
        return R.error(e.getCode(), e.getMessage());
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public R<?> handleValidException(MethodArgumentNotValidException e) {
        BindingResult result = e.getBindingResult();
        String message = result.getFieldError().getDefaultMessage();
        return R.error(message);
    }
    
    @ExceptionHandler(Exception.class)
    public R<?> handleException(Exception e) {
        log.error("系统异常", e);
        return R.error("系统异常，请联系管理员");
    }
}
```

## 事务管理规范

### 事务注解

```java
// ✅ 正确：在 Service 层使用事务
@Service
@Transactional(rollbackFor = Exception.class)
public class SysUserService extends ServiceImpl<SysUserMapper, SysUserEntity> {
    
    public void saveUser(SysUserEntity user, String roleIds) {
        // 保存用户
        this.save(user);
        // 保存用户角色关联
        saveUserRoles(user.getId(), roleIds);
    }
}

// ❌ 错误：不要在 Controller 层使用事务
@RestController
public class SysUserController {
    
    @PostMapping
    @Transactional  // 错误
    public R<Void> save(@RequestBody SysUserDTO dto) {
        // ...
    }
}
```

### 事务传播

```java
// 默认传播行为：REQUIRED（如果当前有事务则加入，否则新建）
@Transactional(rollbackFor = Exception.class)
public void saveUser(SysUserEntity user) {
    // ...
}

// 新建事务：REQUIRES_NEW（总是新建事务）
@Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
public void saveLog(String content) {
    // 即使外层事务回滚，日志也会保存
}
```

## 日志规范

### 日志级别

```java
@Service
public class SysUserService extends ServiceImpl<SysUserMapper, SysUserEntity> {
    
    private static final Logger log = LoggerFactory.getLogger(SysUserService.class);
    
    public void saveUser(SysUserEntity user, String roleIds) {
        log.debug("保存用户：{}", user);  // 调试信息
        
        try {
            this.save(user);
            log.info("用户保存成功，ID：{}", user.getId());  // 关键操作
        } catch (Exception e) {
            log.error("保存用户失败：{}", user, e);  // 错误信息
            throw new BusinessException("保存用户失败");
        }
    }
}
```

### 日志规范

- ✅ 使用 `{}` 占位符，不要使用 `+` 拼接
- ✅ ERROR 级别必须记录完整异常堆栈
- ✅ 关键业务操作使用 INFO 级别
- ❌ 不要使用 `System.out.println()`
- ❌ 不要在循环中打印大量日志

```java
// ✅ 正确
log.info("用户登录成功，用户名：{}", username);
log.error("保存用户失败", e);

// ❌ 错误
log.info("用户登录成功，用户名：" + username);  // 不要用 + 拼接
System.out.println("用户信息：" + user);  // 不要用 System.out
```

## 数据库规范

### 表命名规范

**规则：**以服务简称开头 + 业务名称

```sql
-- ✅ 正确：系统服务表，以 sys_ 开头
sys_user        -- 用户表
sys_role        -- 角色表
sys_menu        -- 菜单表
sys_dept        -- 部门表

-- ✅ 正确：消息服务表，以 msg_ 开头
msg_template    -- 消息模板表
msg_record      -- 消息记录表

-- ✅ 正确：文件服务表，以 fs_ 开头
fs_file         -- 文件表

-- ✅ 正确：任务服务表，以 task_ 开头
task_schedule   -- 任务调度表
```

### 实体类规范

**命名规则：**表名转大驼峰 + `Entity` 后缀

```java
// ✅ 正确：实体类以 Entity 结尾
public class SysUserEntity { }      // 对应表 sys_user
public class SysDeptEntity { }      // 对应表 sys_dept
public class MsgTemplateEntity { }  // 对应表 msg_template

// ❌ 错误
public class SysUser { }  // 缺少 Entity 后缀
```

### 字段规范

**1. 逻辑删除字段：`deleted`**

```java
@Schema(description = "删除状态")
@TableField(value = "deleted", fill = FieldFill.INSERT)
@TableLogic
private Boolean deleted;  // Boolean 类型，数据库 TINYINT(1)
```

**数据库定义：**
```sql
`deleted` TINYINT(1) DEFAULT 0 COMMENT '删除状态（0正常 1已删除）'
```

**2. 创建时间字段：`create_time`**

```java
@Schema(description = "创建时间")
@TableField(value = "create_time", fill = FieldFill.INSERT)
private LocalDateTime createTime;  // LocalDateTime 类型
```

**数据库定义：**
```sql
`create_time` DATETIME DEFAULT NULL COMMENT '创建时间'
```

**3. 更新时间字段：`update_time`**

```java
@Schema(description = "更新时间")
@TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
private LocalDateTime updateTime;  // LocalDateTime 类型
```

**数据库定义：**
```sql
`update_time` DATETIME DEFAULT NULL COMMENT '更新时间'
```

**4. 创建人字段：`create_user`**

```java
@Schema(description = "创建人")
@TableField(value = "create_user", fill = FieldFill.INSERT)
private String createUser;
```

**5. 禁用状态字段：`disabled`**

```java
@Schema(description = "禁用状态")
@TableField(value = "disabled", fill = FieldFill.INSERT)
private Boolean disabled;  // Boolean 类型，数据库 TINYINT(1)
```

**数据库定义：**
```sql
`disabled` TINYINT(1) DEFAULT 0 COMMENT '禁用状态（0启用 1禁用）'
```

**字段类型说明：**

| Java 类型 | 数据库类型 | 说明 |
|-----------|------------|------|
| `String` | VARCHAR | 字符串 |
| `Long` | BIGINT | 长整型 |
| `Integer` | INT | 整型 |
| `Boolean` | TINYINT(1) | 布尔值（0/1） |
| `LocalDateTime` | DATETIME | 日期时间 |
| `LocalDate` | DATE | 日期 |
| `BigDecimal` | DECIMAL | 精确小数 |

### 实体类完整示例

```java
@Getter
@Setter
@TableName("sys_dept")
@Schema(description = "部门")
public class SysDeptEntity {

    @Schema(description = "主键标识")
    @TableId(value = "id", type = IdType.ASSIGN_UUID)
    private String id;

    @Schema(description = "父节点id")
    @TableField("parent_id")
    private String parentId;

    @Schema(description = "部门名称")
    @TableField("dept_name")
    private String deptName;

    @Schema(description = "排序")
    @TableField("sort_seq")
    private Integer sortSeq;

    // 创建时间：插入时自动填充
    @Schema(description = "创建时间")
    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    // 更新时间：插入和更新时自动填充
    @Schema(description = "更新时间")
    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    // 创建人：插入时自动填充
    @Schema(description = "创建人")
    @TableField(value = "create_user", fill = FieldFill.INSERT)
    private String createUser;

    // 逻辑删除：插入时自动填充为 false
    @Schema(description = "删除状态")
    @TableField(value = "deleted", fill = FieldFill.INSERT)
    @TableLogic
    private Boolean deleted;

    // 禁用状态：插入时自动填充为 false
    @Schema(description = "禁用状态")
    @TableField(value = "disabled", fill = FieldFill.INSERT)
    private Boolean disabled;
}
```
```

## MyBatis 规范

### 查询规范

**1. 单表查询：使用 Wrapper**

```java
// ✅ 正确：单表查询使用 LambdaQueryWrapper
LambdaQueryWrapper<SysUserEntity> wrapper = new LambdaQueryWrapper<>();
wrapper.like(StringUtils.hasText(username), SysUserEntity::getAccount, username)
       .eq(disabled != null, SysUserEntity::getDisabled, disabled)
       .orderByDesc(SysUserEntity::getCreateTime);

List<SysUserEntity> list = sysUserService.list(wrapper);
```

**2. 多表查询：使用 SQL 注解**

**✅ 正确：使用 JDK 17 三引号 + @Select 注解**

```java
public interface SysUserMapper extends BaseMapper<SysUserEntity> {
    
    // 简单查询
    @Select("""
        SELECT * FROM sys_user 
        WHERE deleted = false 
          AND disabled = false 
          AND create_time < #{minDate}
        """)
    List<SysUserEntity> findUsers(@Param("minDate") LocalDateTime minDate);
    
    // 多表关联查询
    @Select("""
        SELECT u.* 
        FROM sys_user u
        INNER JOIN sys_user_role ur ON u.id = ur.user_id
        INNER JOIN sys_role r ON ur.role_id = r.id
        WHERE r.role_code IN 
            <foreach collection="roleCodes" item="code" open="(" close=")" separator=",">
                #{code}
            </foreach>
          AND u.deleted = false
        ORDER BY u.id DESC
        """)
    List<SysUserEntity> listByRoleCodes(@Param("roleCodes") List<String> roleCodes);
    
    // 更新操作
    @Update("""
        UPDATE sys_user 
        SET locked = true, unlock_time = #{unlockTime} 
        WHERE id = #{userId}
        """)
    void lock(@Param("userId") String userId, @Param("unlockTime") LocalDateTime unlockTime);
    
    // 删除操作
    @Delete("""
        DELETE FROM sys_user WHERE id = #{id}
        """)
    void hardDelete(@Param("id") String id);
}
```

**❌ 禁止：使用 XML 文件**

```xml
<!-- ❌ 禁止使用 XML 文件 -->
<mapper namespace="com.molandev.cloud.apps.sys.mapper.SysUserMapper">
    <select id="findUsers" resultType="...">
        SELECT * FROM sys_user...
    </select>
</mapper>
```

**❌ 禁止：配置表的外键关联**

```sql
-- ❌ 禁止：不要在数据库中配置外键约束
ALTER TABLE sys_user_role
ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES sys_user(id);

-- ✅ 正确：通过代码维护关联关系
-- 不配置数据库外键，保持表结构灵活
```

### 使用说明

**为什么这样设计？**

1. **单表查询用 Wrapper**
   - 类型安全，编译时检查
   - 代码简洁，易于维护
   - 支持动态条件

2. **多表查询用 SQL 注解**
   - SQL 更直观，性能更好
   - JDK 17 三引号使 SQL 更易读
   - 无需 XML 文件，减少文件数量

3. **禁止外键约束**
   - 保持数据库灵活性
   - 避免级联操作影响性能
   - 关联关系由业务代码维护

### 最佳实践

```java
@Service
public class SysUserService extends ServiceImpl<SysUserMapper, SysUserEntity> {
    
    // ✅ 正确：单表查询用 Wrapper
    public List<SysUserEntity> findUsers(String username, Boolean disabled) {
        LambdaQueryWrapper<SysUserEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StringUtils.hasText(username), SysUserEntity::getAccount, username)
               .eq(disabled != null, SysUserEntity::getDisabled, disabled);
        return this.list(wrapper);
    }
    
    // ✅ 正确：多表查询调用 Mapper 方法
    public List<SysUserEntity> findUsersByRoles(List<String> roleCodes) {
        return this.baseMapper.listByRoleCodes(roleCodes);
    }
}
```

## 配置文件规范

### 配置分层

```
application.yml              # 主配置
application-local.yml        # 本地开发
application-dev.yml          # 开发环境
application-test.yml         # 测试环境
application-prod.yml         # 生产环境
```

### 配置示例

```yaml
# application.yml
spring:
  application:
    name: system-service
  profiles:
    active: @profiles.active@  # 由 Maven 动态替换

# application-local.yml
server:
  port: 8081

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/molandev_sys
    username: root
    password: 123456
  
  redis:
    host: 127.0.0.1
    port: 6379

logging:
  level:
    com.molandev.cloud: debug
```

## 代码检查清单

提交代码前，请确认以下事项：

- [ ] 代码无编译错误和警告
- [ ] 遵循命名规范
- [ ] 添加必要的注释
- [ ] 异常处理完整
- [ ] 日志记录合理
- [ ] 参数校验完整
- [ ] 事务配置正确
- [ ] 删除调试代码（`System.out.println`）
- [ ] 格式化代码（Ctrl + Alt + L）
- [ ] 测试通过

## 工具推荐

### IDEA 插件

- **Lombok**: 简化实体类代码
- **MyBatisX**: MyBatis 增强插件
- **Alibaba Java Coding Guidelines**: 阿里巴巴代码规范检查
- **SonarLint**: 代码质量检查

### 代码格式化

在 IDEA 中设置代码格式化规则：
1. `Settings` → `Editor` → `Code Style` → `Java`
2. 导入项目提供的代码格式化配置文件

## 相关文档

- [项目结构](/cloud/backend/structure) - 了解项目目录结构
- [新增模块](/cloud/development/new-module) - 如何新增业务模块
- [调试技巧](/cloud/development/debugging) - 开发调试技巧
- [常见问题](/cloud/development/faq) - 开发常见问题
