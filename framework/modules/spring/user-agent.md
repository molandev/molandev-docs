# UserAgent 解析工具

`UserAgentUtil` 是一个 User-Agent 字符串解析工具，可以识别浏览器类型、版本、操作系统和设备类型。

## 类信息

- **包名**: `com.molandev.framework.spring.web`
- **类名**: `UserAgentUtil`
- **类型**: 静态工具类
- **依赖**: 无（纯 Java 实现）

## 核心特性

### ✅ 浏览器识别

支持主流浏览器：
- Chrome、Edge、Firefox、Safari
- Opera、Vivaldi、Yandex Browser
- UC Browser、微信内置浏览器
- Internet Explorer

### ✅ 操作系统识别

支持主流操作系统：
- Windows (10/8.1/8/7/Vista/XP/2000)
- macOS / Mac OS X
- Android、iOS (iPhone/iPad/iPod)
- Linux、Ubuntu、FreeBSD 等

### ✅ 设备类型识别

- Desktop（桌面设备）
- Mobile（手机）
- Tablet（平板）

### ✅ 高性能

- 基于正则表达式匹配
- 无外部依赖
- 线程安全

## 核心方法

### 1. parse

解析 User-Agent 字符串，返回完整信息。

```java
public static UserAgentInfo parse(String userAgent)
```

| 参数 | 类型 | 说明 |
|-----|------|------|
| userAgent | String | User-Agent 字符串 |
| 返回值 | UserAgentInfo | 包含浏览器、版本、操作系统、设备类型的对象 |

**示例**：

```java
String ua = request.getHeader("User-Agent");
UserAgentUtil.UserAgentInfo info = UserAgentUtil.parse(ua);

System.out.println("浏览器: " + info.getBrowser());
System.out.println("版本: " + info.getBrowserVersion());
System.out.println("操作系统: " + info.getOs());
System.out.println("设备类型: " + info.getDeviceType());
```

### 2. detectBrowser

检测浏览器名称。

```java
public static String detectBrowser(String userAgent)
```

**示例**：

```java
String browser = UserAgentUtil.detectBrowser(userAgent);
// "Chrome", "Firefox", "Safari", ...
```

### 3. detectBrowserVersion

检测浏览器版本。

```java
public static String detectBrowserVersion(String userAgent, String browser)
```

**示例**：

```java
String browser = UserAgentUtil.detectBrowser(userAgent);
String version = UserAgentUtil.detectBrowserVersion(userAgent, browser);
// "120.0.6099.109"
```

### 4. detectOperatingSystem

检测操作系统。

```java
public static String detectOperatingSystem(String userAgent)
```

**示例**：

```java
String os = UserAgentUtil.detectOperatingSystem(userAgent);
// "Windows 10", "macOS", "Android", ...
```

### 5. detectDeviceType

检测设备类型。

```java
public static String detectDeviceType(String userAgent)
```

**返回值**: `"mobile"`, `"tablet"`, `"desktop"`

**示例**：

```java
String deviceType = UserAgentUtil.detectDeviceType(userAgent);
if ("mobile".equals(deviceType)) {
    // 返回移动端页面
}
```

### 6. isMobile

判断是否为移动设备。

```java
public static boolean isMobile(String userAgent)
```

**示例**：

```java
if (UserAgentUtil.isMobile(userAgent)) {
    // 移动设备逻辑
}
```

### 7. isTablet

判断是否为平板设备。

```java
public static boolean isTablet(String userAgent)
```

### 8. isDesktop

判断是否为桌面设备。

```java
public static boolean isDesktop(String userAgent)
```

## UserAgentInfo 类

解析结果封装类。

```java
public static class UserAgentInfo {
    private final String browser;         // 浏览器名称
    private final String browserVersion;  // 浏览器版本
    private final String os;              // 操作系统
    private final String deviceType;      // 设备类型
    
    // Getter 方法
    public String getBrowser() { ... }
    public String getBrowserVersion() { ... }
    public String getOs() { ... }
    public String getDeviceType() { ... }
}
```

## 完整示例

### 示例 1: 访问统计

```java
@RestController
@RequestMapping("/api")
public class StatisticsController {
    
    @Autowired
    private VisitLogService visitLogService;
    
    @GetMapping("/track")
    public Result trackVisit(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        String ip = request.getRemoteAddr();
        
        // 解析 User-Agent
        UserAgentUtil.UserAgentInfo info = UserAgentUtil.parse(userAgent);
        
        // 记录访问日志
        VisitLog log = new VisitLog();
        log.setIp(ip);
        log.setBrowser(info.getBrowser());
        log.setBrowserVersion(info.getBrowserVersion());
        log.setOs(info.getOs());
        log.setDeviceType(info.getDeviceType());
        log.setVisitTime(LocalDateTime.now());
        
        visitLogService.save(log);
        
        return Result.success();
    }
}
```

### 示例 2: 响应式页面选择

```java
@Controller
public class HomeController {
    
    @GetMapping("/")
    public String index(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        
        // 根据设备类型返回不同页面
        if (UserAgentUtil.isMobile(userAgent)) {
            return "mobile/index";
        } else if (UserAgentUtil.isTablet(userAgent)) {
            return "tablet/index";
        } else {
            return "desktop/index";
        }
    }
}
```

### 示例 3: API 版本控制

```java
@RestController
@RequestMapping("/api")
public class ApiController {
    
    @GetMapping("/data")
    public Result getData(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        UserAgentUtil.UserAgentInfo info = UserAgentUtil.parse(userAgent);
        
        // 根据浏览器版本返回不同的数据格式
        if ("Internet Explorer".equals(info.getBrowser())) {
            // IE 浏览器返回兼容格式
            return Result.success(legacyData);
        } else {
            // 现代浏览器返回标准格式
            return Result.success(modernData);
        }
    }
}
```

### 示例 4: 移动端重定向

```java
@Component
public class MobileRedirectInterceptor implements HandlerInterceptor {
    
    @Override
    public boolean preHandle(HttpServletRequest request, 
                            HttpServletResponse response, 
                            Object handler) throws Exception {
        String userAgent = request.getHeader("User-Agent");
        String uri = request.getRequestURI();
        
        // 移动设备访问 PC 站点，重定向到移动站
        if (UserAgentUtil.isMobile(userAgent) && !uri.startsWith("/m/")) {
            response.sendRedirect("/m" + uri);
            return false;
        }
        
        return true;
    }
}
```

### 示例 5: 浏览器兼容性检查

```java
@RestController
@RequestMapping("/api")
public class CompatibilityController {
    
    @GetMapping("/check")
    public Result checkCompatibility(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        UserAgentUtil.UserAgentInfo info = UserAgentUtil.parse(userAgent);
        
        // 检查浏览器兼容性
        if ("Internet Explorer".equals(info.getBrowser())) {
            String version = info.getBrowserVersion();
            int majorVersion = Integer.parseInt(version.split("\\.")[0]);
            
            if (majorVersion < 11) {
                return Result.error("您的浏览器版本过低，请升级到 IE11 或使用现代浏览器");
            }
        }
        
        return Result.success("浏览器兼容");
    }
}
```

## 支持的浏览器

| 浏览器 | 识别名称 | 说明 |
|-------|---------|------|
| Edge | Edge | Microsoft Edge |
| Chrome | Chrome | Google Chrome |
| Firefox | Firefox | Mozilla Firefox |
| Safari | Safari | Apple Safari |
| Internet Explorer | Internet Explorer | IE 浏览器 |
| Opera | Opera | Opera 浏览器 |
| Vivaldi | Vivaldi | Vivaldi 浏览器 |
| Yandex | Yandex | Yandex Browser |
| UC Browser | UC Browser | UC 浏览器 |
| WeChat | WeChat | 微信内置浏览器 |

## 支持的操作系统

| 操作系统 | 识别名称 |
|---------|---------|
| Windows 10 | Windows 10 |
| Windows 8.1 | Windows 8.1 |
| Windows 7 | Windows 7 |
| macOS | macOS |
| Android | Android |
| iOS (iPhone) | iPhone iOS |
| iOS (iPad) | iPad iOS |
| Linux | Linux |
| Ubuntu | Ubuntu |
| Chrome OS | Chrome OS |

## 技术细节

### 正则表达式匹配

UserAgentUtil 使用预编译的正则表达式进行高效匹配：

```java
private static final Pattern BROWSER_PATTERNS[] = {
    Pattern.compile("(?i)Edg/([\\d.]+)"),
    Pattern.compile("(?i)Chrome/([\\d.]+)"),
    Pattern.compile("(?i)Firefox/([\\d.]+)"),
    // ...
};
```

### 匹配顺序

浏览器匹配有特定顺序（重要）：
1. Edge（必须在 Chrome 之前，因为 Edge 包含 Chrome 标识）
2. Chrome
3. Firefox
4. Safari
5. ...

### User-Agent 示例

```text
# Chrome on Windows
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36

# Firefox on Mac
Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0

# Safari on iPhone
Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1

# Edge on Windows
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.2210.121
```

## 注意事项

### ⚠️ User-Agent 可伪造

User-Agent 是客户端发送的字符串，可以被伪造。**不要用于安全验证**，仅用于统计和用户体验优化。

### ⚠️ 新版本识别

新版本的浏览器可能无法识别，会返回 "Unknown"。

### ⚠️ 性能

正则匹配有一定性能开销，但对单次请求影响很小（微秒级）。如需频繁调用，建议缓存结果。

### ⚠️ 移动端判断

部分平板设备可能被识别为桌面设备，建议结合屏幕尺寸判断。

## 常见问题

### Q1: 如何处理 "Unknown" 结果？

**A**: 返回 "Unknown" 说明无法识别该 User-Agent，可以：
1. 使用默认值
2. 记录日志，后续更新正则表达式
3. 降级处理

```java
UserAgentUtil.UserAgentInfo info = UserAgentUtil.parse(userAgent);
if ("Unknown".equals(info.getBrowser())) {
    // 使用默认处理
}
```

### Q2: 如何添加新的浏览器支持？

**A**: 需要修改源码中的正则表达式数组。建议提交 PR 到开源项目。

### Q3: 性能如何？

**A**: 
- 单次解析：约 0.1-0.5 毫秒
- 线程安全
- 正则表达式已预编译

### Q4: 支持机器人识别吗？

**A**: 当前版本不支持。如需识别爬虫，可以检查 User-Agent 中是否包含 "bot"、"spider" 等关键词。

### Q5: 为什么 iPad 被识别为桌面？

**A**: 某些 iPad 的 User-Agent 不包含 "Mobile" 标识，可能被误判。可以结合其他信息（如屏幕尺寸、触摸事件）综合判断。

## 最佳实践

### 1. 缓存解析结果

```java
@Component
public class UserAgentCache {
    
    private final LoadingCache<String, UserAgentUtil.UserAgentInfo> cache = 
        CacheBuilder.newBuilder()
            .maximumSize(1000)
            .expireAfterWrite(1, TimeUnit.HOURS)
            .build(new CacheLoader<String, UserAgentUtil.UserAgentInfo>() {
                @Override
                public UserAgentUtil.UserAgentInfo load(String ua) {
                    return UserAgentUtil.parse(ua);
                }
            });
    
    public UserAgentUtil.UserAgentInfo parse(String userAgent) {
        return cache.getUnchecked(userAgent);
    }
}
```

### 2. 结合前端判断

```javascript
// 前端传递屏幕信息
const deviceInfo = {
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    isTouchDevice: 'ontouchstart' in window
};

fetch('/api/track', {
    method: 'POST',
    body: JSON.stringify(deviceInfo)
});
```

### 3. 日志记录

```java
log.info("访问信息 - IP: {}, Browser: {}, OS: {}, Device: {}", 
    ip, info.getBrowser(), info.getOs(), info.getDeviceType());
```

## 相关工具

- [Spring 工具](./spring.md) - Spring 容器访问
- [JSON 工具](./json.md) - JSON 序列化

## 参考资料

- [User-Agent MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent)
- [User-Agent 字符串历史](https://webaim.org/blog/user-agent-string-history/)
