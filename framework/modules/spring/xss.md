# XSS 防护配置

molandev-spring 提供了开箱即用的 XSS（跨站脚本攻击）防护功能,通过 Servlet Filter 自动过滤请求参数中的恶意脚本。

## 功能说明

XSS 防护会自动拦截 HTTP 请求，对请求参数、请求体、Header 中的字符串进行 HTML 转义，防止恶意脚本注入。

##核心特性

### ✅ 自动过滤

- 自动拦截配置的 URL 路径
- 过滤 GET/POST 参数
- 过滤 JSON 请求体
- 过滤 Header（可选）

### ✅ 灵活配置

- 支持路径匹配模式
- 支持排除特定路径
- 可调整过滤器优先级
- 默认关闭，按需启用

### ✅ 注解支持

- `@XssIgnore`: 跳过特定 Controller 或方法的 XSS 过滤
- 适用于富文本编辑器等特殊场景

## 配置项

### 启用 XSS 防护

XSS 防护**默认关闭**，需要在配置文件中启用：

```yaml
# application.yml
molandev:
  autoconfig:
    xss:
      enabled: true                    # 启用 XSS 防护，必填
      url-pattern: /*                  # 拦截路径模式，默认 /*
      path-exclude-patterns:           # 排除路径列表，默认空
        - /api/upload/**
        - /api/rich-text/**
      order: -2147483548               # 过滤器顺序，默认 Integer.MIN_VALUE + 100
```

### 配置说明

| 配置项 | 类型 | 默认值 | 必填 | 说明 |
|-------|------|--------|------|------|
| enabled | boolean | false | ✅ | 是否启用 XSS 防护 |
| url-pattern | String | /* | ❌ | 拦截的 URL 模式，支持 Servlet 路径匹配 |
| path-exclude-patterns | List\<String> | [] | ❌ | 排除的路径列表，支持通配符 |
| order | int | Integer.MIN_VALUE + 100 | ❌ | 过滤器优先级，数字越小优先级越高，在加密和签名之后执行 |

## 使用示例

### 示例 1: 基础使用

启用 XSS 防护后，所有请求参数会自动过滤。

```java
@RestController
@RequestMapping("/api")
public class ArticleController {
    
    // XSS 防护自动生效
    @PostMapping("/article")
    public Result createArticle(@RequestBody Article article) {
        // article.getContent() 中的 <script> 等标签已被转义
        articleService.save(article);
        return Result.success();
    }
    
    // GET 请求参数也会被过滤
    @GetMapping("/search")
    public List<Article> search(@RequestParam String keyword) {
        // keyword 中的恶意脚本已被转义
        return articleService.search(keyword);
    }
}
```

**请求示例**：

```bash
# 恶意请求
POST /api/article
Content-Type: application/json

{
  "title": "测试文章",
  "content": "<script>alert('XSS')</script>正文内容"
}

# 实际接收到的数据（已转义）
{
  "title": "测试文章",
  "content": "&lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;正文内容"
}
```

### 示例 2: 使用 @XssIgnore 跳过过滤

对于富文本编辑器等需要保留 HTML 标签的场景，可以使用 `@XssIgnore` 注解。

```java
@RestController
@RequestMapping("/api")
public class ContentController {
    
    // 跳过 XSS 过滤
    @XssIgnore
    @PostMapping("/rich-content")
    public Result saveRichContent(@RequestBody Content content) {
        // content.getHtml() 保留原始 HTML 内容
        // 注意：需要在业务层进行安全校验！
        contentService.save(content);
        return Result.success();
    }
    
    // 普通接口仍然会过滤
    @PostMapping("/comment")
    public Result createComment(@RequestBody Comment comment) {
        // comment.getContent() 会被 XSS 过滤
        commentService.save(comment);
        return Result.success();
    }
}

@Data
class Content {
    private Long id;
    private String title;
    private String html;  // 富文本 HTML 内容
}
```

### 示例 3: Controller 级别跳过过滤

可以在整个 Controller 上使用 `@XssIgnore`：

```java
// 整个 Controller 的所有方法都跳过 XSS 过滤
@XssIgnore
@RestController
@RequestMapping("/api/editor")
public class EditorController {
    
    @PostMapping("/save")
    public Result save(@RequestBody EditorContent content) {
        // 所有方法都不会进行 XSS 过滤
        return Result.success();
    }
    
    @PostMapping("/publish")
    public Result publish(@RequestBody EditorContent content) {
        return Result.success();
    }
}
```

### 示例 4: 排除特定路径

通过配置文件排除不需要 XSS 过滤的路径：

```yaml
molandev:
  autoconfig:
    xss:
      enabled: true
      url-pattern: /*
      path-exclude-patterns:
        - /api/upload/**          # 文件上传接口
        - /api/editor/**          # 富文本编辑器接口
        - /webhook/**             # Webhook 回调
        - /actuator/**            # 监控端点
```

### 示例 5: 自定义过滤器顺序

如果需要调整 XSS 过滤器的执行顺序：

```yaml
molandev:
  autoconfig:
    xss:
      enabled: true
      order: -2147483548  # 数字越小，优先级越高，在加密和签名之后执行
```

## XSS 过滤规则

### HTML 转义字符

| 原字符 | 转义后   | 说明 |
|-------|-------|------|
| < | `&lt;` | 小于号 |
| > | `&gt;`  | 大于号 |
| " | `&quot;` | 双引号 |
| ' | `&#39;` | 单引号 |
| & | `&amp;` | &符号 |

### 过滤示例

```java
// 输入
<script>alert('XSS')</script>

// 输出
&lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;

// 输入
<img src="x" onerror="alert(1)">

// 输出
&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;
```

## 技术细节

### 过滤器实现

```java
@Bean
@ConditionalOnProperty(prefix = "molandev.autoconfig.xss", name = "enabled", havingValue = "true")
public FilterRegistrationBean<XssFilter> xssFilterRegistration(XssProperties properties) {
    FilterRegistrationBean<XssFilter> registration = new FilterRegistrationBean<>();
    registration.setFilter(new XssFilter(properties));
    registration.addUrlPatterns(properties.getUrlPattern());
    registration.setOrder(properties.getOrder());
    return registration;
}
```

### HttpServletRequest 包装

XSS 过滤器通过包装 `HttpServletRequest` 实现：

```java
public class XssHttpServletRequestWrapper extends HttpServletRequestWrapper {
    
    @Override
    public String getParameter(String name) {
        String value = super.getParameter(name);
        return XssUtil.escape(value);
    }
    
    @Override
    public String[] getParameterValues(String name) {
        String[] values = super.getParameterValues(name);
        if (values != null) {
            for (int i = 0; i < values.length; i++) {
                values[i] = XssUtil.escape(values[i]);
            }
        }
        return values;
    }
    
    // ... 其他方法
}
```

### JSON 请求体过滤

对于 JSON 格式的请求体，会递归处理所有字符串字段：

```java
public static String escapeJson(String json) {
    JsonNode jsonNode = objectMapper.readTree(json);
    escapeJsonNode(jsonNode);  // 递归处理
    return jsonNode.toString();
}
```

## 注意事项

### ⚠️ 性能影响

- XSS 过滤会对每个请求参数进行字符串处理
- 对于大量参数或大文本，可能有一定性能开销
- 建议只在必要的路径上启用

### ⚠️ 富文本内容

富文本编辑器（如 TinyMCE、CKEditor）的内容需要保留 HTML 标签，**必须使用 `@XssIgnore` 或配置排除路径**。

### ⚠️ 文件上传

文件上传接口通常不需要 XSS 过滤，建议排除：

```yaml
path-exclude-patterns:
  - /api/upload/**
```

### ⚠️ 前端展示

过滤后的内容在前端展示时会显示转义字符，如果需要显示原始内容，前端需要进行 HTML 解码。

### ⚠️ 多重转义

如果数据经过多次保存和读取，可能导致多重转义。建议：
- 数据库存储原始数据
- 仅在接收用户输入时进行 XSS 过滤
- 前端展示时根据需要进行转义

## 常见问题

### Q1: 启用 XSS 防护后，富文本内容显示不正常？

**A**: 富文本内容需要跳过 XSS 过滤，有两种方式：

1. 使用 `@XssIgnore` 注解
2. 在配置中排除该路径

### Q2: 前端提交的 JSON 中包含 HTML 怎么办？

**A**: XSS 过滤器会自动处理 JSON 请求体中的字符串字段。如果需要保留 HTML，使用 `@XssIgnore`。

### Q3: XSS 防护会影响性能吗？

**A**: 
- 对小文本影响很小（微秒级）
- 对大文本或大量参数有一定影响
- 建议通过 `path-exclude-patterns` 排除不需要过滤的路径

### Q4: 如何测试 XSS 防护是否生效？

**A**: 

```java
@SpringBootTest
@AutoConfigureMockMvc
class XssFilterTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    void testXssFilter() throws Exception {
        String maliciousContent = "<script>alert('XSS')</script>";
        
        mockMvc.perform(post("/api/article")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"content\":\"" + maliciousContent + "\"}"))
                .andExpect(status().isOk());
        
        // 验证数据库中的内容已被转义
    }
}
```

### Q5: XSS 防护和 CSRF 防护有什么区别？

**A**: 
- **XSS（跨站脚本）**: 防止恶意脚本注入和执行
- **CSRF（跨站请求伪造）**: 防止未授权的请求
- 两者防护的是不同类型的攻击，建议同时启用

## 最佳实践

### 1. 仅在必要时启用

不是所有接口都需要 XSS 过滤，建议：
- 用户输入的文本内容：**启用**
- 文件上传：**关闭**
- 富文本编辑：**关闭**（使用白名单方式在业务层处理）
- 内部 API：**关闭**

### 2. 使用白名单而非黑名单

对于富文本内容，建议：
- 使用 `@XssIgnore` 跳过框架的 XSS 过滤
- 在业务层使用白名单库（如 jsoup）进行安全处理

```java
@XssIgnore
@PostMapping("/rich-content")
public Result save(@RequestBody Content content) {
    // 使用 jsoup 白名单过滤
    String safeHtml = Jsoup.clean(content.getHtml(), Whitelist.relaxed());
    content.setHtml(safeHtml);
    contentService.save(content);
    return Result.success();
}
```

### 3. 前后端协同

- **后端**: 启用 XSS 防护，过滤恶意脚本
- **前端**: 使用 CSP（Content Security Policy）增强安全性

```html
<meta http-equiv="Content-Security-Policy" 
      content="script-src 'self'; object-src 'none'">
```

### 4. 日志记录

建议记录被过滤的 XSS 攻击尝试：

```java
if (value.contains("<script>")) {
    log.warn("检测到 XSS 攻击尝试: {}", value);
}
```

## 相关工具

- [JSON 工具](./json.md) - JSON 序列化
- [Spring 工具](./spring.md) - Spring 容器访问

## 参考资料

- [OWASP XSS 防护](https://owasp.org/www-community/attacks/xss/)
- [HTML 转义](https://www.w3.org/TR/html4/charset.html)
- [Spring Security XSS](https://docs.spring.io/spring-security/reference/features/exploits/csrf.html)
