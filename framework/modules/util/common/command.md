# 系统命令工具

`CommandUtil` 提供在 Java 环境中执行外部系统命令行指令的能力，支持跨平台执行（Linux/Windows），并提供了超时控制、环境变更以及异步执行（火后即焚）等功能。

## 类信息

- **包名**: `com.molandev.framework.util`
- **类名**: `CommandUtil`
- **类型**: 静态工具类

## 核心功能

### 1. 同步执行 (execute)

最常用的同步执行方式，会阻塞当前线程直至命令执行完成或超时。

```java
// 基础执行
public static CommandResult execute(String... command)

// 指定工作目录执行
public static CommandResult execute(File workDir, String... command)

// 带环境变量执行
public static CommandResult execute(Map<String, String> env, String... command)

// 带超时控制执行
public static CommandResult execute(long timeout, TimeUnit unit, String... command)
```

**示例**:
```java
// 执行简单命令
CommandResult result = CommandUtil.execute("ls", "-l");

if (result.isSuccess()) {
    System.out.println("输出内容: " + result.getStdout());
} else {
    System.err.println("错误信息: " + result.getStderr());
}
```

### 2. 异步执行 (executeAsync)

适用于“火后即焚”场景，即只需要触发命令，不需要等待结果也不关注执行成功与否。

```java
public static void executeAsync(String... command)
public static void executeAsync(File workDir, Map<String, String> env, String... command)
```

**示例**:
```java
// 异步启动一个备份脚本，立即返回
CommandUtil.executeAsync("/opt/scripts/backup.sh");
```

---

## 结果对象 (CommandResult)

执行 `execute` 方法会返回 `CommandResult` 对象，包含以下属性：

| 属性 | 类型 | 说明 |
| :--- | :--- | :--- |
| `success` | `boolean` | 是否执行成功（退出码为 0 则为 true） |
| `timedOut` | `boolean` | 是否因超时被强制终止 |
| `exitCode` | `int` | 系统退出码 |
| `stdout` | `String` | 标准输出内容 |
| `stderr` | `String` | 错误输出内容 |

---

## 最佳实践

### 🔒 命令注入防护
本工具类内部使用 `ProcessBuilder` 结合 `String... command` 数组形式传参，可以有效防止命令注入攻击。**严禁**手动拼接命令字符串传入单个字符串参数。

### 🌏 跨平台适配
由于 Windows 和 Linux 的内置命令不同，建议在代码中根据系统类型进行分支处理：

```java
boolean isWin = System.getProperty("os.name").toLowerCase().contains("win");
String[] cmd = isWin ? new String[]{"cmd", "/c", "dir"} : new String[]{"ls", "-l"};
CommandResult result = CommandUtil.execute(cmd);
```

### ⚠️ 超时控制
执行外部命令时，务必考虑潜在的阻塞风险。建议对耗时或不可控的命令设置合理的超时时间：

```java
// 最多等待 10 秒
CommandResult result = CommandUtil.execute(10, TimeUnit.SECONDS, "ping", "google.com");
```

---

## 注意事项

### ⚠️ 输出流重定向
在异步执行 `executeAsync` 时，工具类会自动将 `stdout` 和 `stderr` 重定向到系统的空设备（如 `/dev/null`），以防止因缓冲区满导致子进程挂起。

### ⚠️ 资源回收
当同步执行超时时，工具类会主动调用 `process.destroyForcibly()` 强制终止子进程，确保资源及时释放。
