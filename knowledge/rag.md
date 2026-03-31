# RAG 问答

RAG（Retrieval-Augmented Generation）是检索增强生成的核心能力，将检索到的知识与大语言模型结合，生成准确、可信的回答。

## RAG 流程

```
┌─────────────────────────────────────────────────────────────┐
│                      RAG 问答流程                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐                                              │
│  │ 用户问题  │                                              │
│  └────┬─────┘                                              │
│       │                                                     │
│       ▼                                                     │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐           │
│  │ 问题理解  │────▶│  检索知识  │────▶│  重排序   │           │
│  └──────────┘     └──────────┘     └──────────┘           │
│                         │                                  │
│                         ▼                                  │
│                   ┌──────────┐                             │
│                   │ 上下文补全 │                             │
│                   └────┬─────┘                             │
│                        │                                   │
│                        ▼                                   │
│  ┌──────────────────────────────────────────────────┐     │
│  │                   Prompt 构建                     │     │
│  │  ┌────────────────────────────────────────────┐  │     │
│  │  │ 系统提示词 + 历史对话 + 参考资料 + 用户问题  │  │     │
│  │  └────────────────────────────────────────────┘  │     │
│  └───────────────────────┬──────────────────────────┘     │
│                          │                                │
│                          ▼                                │
│                   ┌──────────┐                             │
│                   │   LLM    │                             │
│                   │  生成回答 │                             │
│                   └────┬─────┘                             │
│                        │                                   │
│                        ▼                                   │
│  ┌──────────────────────────────────────────────────┐     │
│  │                    响应输出                       │     │
│  │  ┌────────────────────────────────────────────┐  │     │
│  │  │ 思考过程（可选）+ 回答内容 + 引用文档       │  │     │
│  │  └────────────────────────────────────────────┘  │     │
│  └──────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 多轮对话

Knowledge 服务支持多轮对话，能够理解上下文，保持对话连贯。

### 问题组合策略

首轮对话直接使用原问题检索，后续轮次组合历史问题：

```java
private String buildRetrievalQuery(RagContext context) {
    List<KlChatMessageEntity> history = context.getHistoryMessages();
    String currentQuery = context.getQuery();

    // 首轮：直接用原问题
    if (history == null || history.isEmpty()) {
        return currentQuery;
    }

    // 后续轮次：组合历史问题 + 当前问题
    StringBuilder sb = new StringBuilder();
    int maxMessages = context.getHistoryTurns() * 2;
    int startIndex = Math.max(0, history.size() - maxMessages);

    for (int i = startIndex; i < history.size(); i++) {
        KlChatMessageEntity msg = history.get(i);
        if ("user".equals(msg.getRole())) {
            sb.append(msg.getContent()).append(" ");
        }
    }

    sb.append(currentQuery);
    return sb.toString().trim();
}
```

### 示例

```
用户: 什么是分布式锁？
助手: 分布式锁是一种在分布式系统中...

用户: 它有哪些实现方式？  ← 需要理解"它"指代"分布式锁"
助手: 分布式锁的实现方式包括 Redis、Zookeeper...

检索查询: "分布式锁 什么是 分布式锁 它有哪些实现方式"
```

### 历史对话配置

```java
public class RagContext {
    // 使用的历史对话轮数
    private int historyTurns = 3;
}
```

## 流式响应

Knowledge 服务采用流式响应，实时输出生成内容，提升用户体验。

### 响应结构

```java
public class RagChatResponse {
    private String type;      // 响应类型
    private String content;   // 内容
    private Object data;      // 附加数据

    // 响应类型常量
    public static final String TYPE_CONVERSATION_ID = "conversation_id";
    public static final String TYPE_USER_MESSAGE_ID = "user_message_id";
    public static final String TYPE_ASSISTANT_MESSAGE_ID = "assistant_message_id";
    public static final String TYPE_THINKING = "thinking";
    public static final String TYPE_CONTENT = "content";
    public static final String TYPE_REFERENCED_DOCS = "referenced_docs";
    public static final String TYPE_TOKEN_USAGE = "token_usage";
    public static final String TYPE_DONE = "done";
}
```

### 流式输出顺序

```
1. conversation_id     → 会话 ID
2. user_message_id     → 用户消息 ID
3. assistant_message_id → 助手消息 ID
4. thinking (可选)     → 思考过程（多次）
5. content             → 回答内容（多次）
6. referenced_docs     → 引用文档列表
7. token_usage         → Token 使用量
8. done                → 结束标记
```

### 前端处理示例

```javascript
const eventSource = new EventSource('/api/knowledge/chat/stream');

eventSource.onmessage = (event) => {
    const response = JSON.parse(event.data);

    switch (response.type) {
        case 'thinking':
            // 显示思考过程
            appendThinking(response.content);
            break;
        case 'content':
            // 追加回答内容
            appendContent(response.content);
            break;
        case 'referenced_docs':
            // 显示引用文档
            renderReferencedDocs(response.data);
            break;
        case 'done':
            // 结束
            eventSource.close();
            break;
    }
};
```

## 深度思考

Knowledge 服务支持深度思考模式，展示模型的推理过程。

### 启用方式

```java
RagContext context = RagContext.builder()
        .query("分布式锁如何保证高可用？")
        .libraryIds(List.of("lib-001"))
        .think(true)  // 启用深度思考
        .build();
```

### 实现

```java
private Flux<RagChatResponse> generateAnswer(RagContext context, ...) {
    return chatClient.prompt(fullPrompt)
            .options(OpenAiChatOptions.builder()
                    .extraBody(Map.of("enable_thinking", context.isThink()))
                    .build())
            .stream()
            .chatResponse()
            .map(response -> {
                // 处理 thinking 内容
                String thinking = response.getResult()
                        .getOutput()
                        .getMetadata()
                        .get("reasoningContent");

                if (thinking != null && !thinking.isEmpty()) {
                    context.appendThinking(thinking);
                    return RagChatResponse.thinking(thinking);
                }

                // 处理回答内容
                String content = response.getResult().getOutput().getText();
                if (content != null && !content.isEmpty()) {
                    context.appendResponse(content);
                    return RagChatResponse.content(content);
                }

                return null;
            });
}
```

### 效果展示

```
【思考过程】
用户问的是分布式锁的高可用，我需要从以下几个方面分析：
1. 单点故障问题
2. 主从切换时的锁丢失
3. Redlock 算法的解决方案...

【回答内容】
分布式锁保证高可用需要考虑以下关键点...
```

## 引用溯源

回答关联原始文档，支持原文高亮，确保可信可查。

### 引用文档结构

```java
public class RetrievedDocument {
    private String documentId;
    private String libraryId;
    private String title;
    private String source;
    private Double score;
    private List<HighlightRange> highlightRanges;  // 高亮区间

    public static class HighlightRange {
        private int start;  // 原文起始位置
        private int end;    // 原文结束位置
    }
}
```

### 引用文档聚合

检索可能返回同一文档的多个分片，需要聚合后返回：

```java
private List<RetrievedDocument> buildReferencedDocs(List<RetrievedDocument> docs) {
    // 按 documentId 分组
    Map<String, List<RetrievedDocument>> docsByDocId = docs.stream()
            .collect(Collectors.groupingBy(RetrievedDocument::getDocumentId));

    return docsByDocId.entrySet().stream()
            .map(entry -> {
                List<RetrievedDocument> groupDocs = entry.getValue();
                RetrievedDocument firstDoc = groupDocs.get(0);

                RetrievedDocument refDoc = new RetrievedDocument();
                refDoc.setDocumentId(firstDoc.getDocumentId());
                refDoc.setTitle(firstDoc.getTitle());

                // 收集高亮区间
                List<HighlightRange> highlights = groupDocs.stream()
                        .map(doc -> new HighlightRange(
                                doc.getMetadata().get("charStartIndex"),
                                doc.getMetadata().get("charEndIndex")))
                        .collect(Collectors.toList());

                refDoc.setHighlightRanges(highlights);
                return refDoc;
            })
            .collect(Collectors.toList());
}
```

### 前端高亮实现

```javascript
function highlightOriginalContent(content, ranges) {
    let result = '';
    let lastEnd = 0;

    // 按起始位置排序
    ranges.sort((a, b) => a.start - b.start);

    for (const range of ranges) {
        // 未高亮部分
        result += content.slice(lastEnd, range.start);
        // 高亮部分
        result += `<mark>${content.slice(range.start, range.end)}</mark>`;
        lastEnd = range.end;
    }

    // 剩余部分
    result += content.slice(lastEnd);
    return result;
}
```

## Prompt 构建

### 系统提示词

```java
private static final String RAG_SYSTEM_PROMPT = """
        你是一个专业的知识库问答助手。
        请根据提供的参考资料回答用户问题。

        ## 回答要求：
        1. 优先使用参考资料中的信息
        2. 如果参考资料中没有相关信息，请明确告知用户
        3. 回答要准确、简洁、有条理
        4. 可以适当引用资料来源，如"根据[文档名]..."
        5. 如果问题涉及多个方面，请分点说明
        """;
```

### 用户提示词

```java
private String buildUserPrompt(RagContext context, List<RetrievedDocument> docs, String historyContext) {
    StringBuilder sb = new StringBuilder();

    // 历史对话
    if (historyContext != null && !historyContext.isEmpty()) {
        sb.append("【历史对话】\n").append(historyContext).append("\n");
    }

    // 参考资料
    if (docs != null && !docs.isEmpty()) {
        sb.append("【参考资料】\n\n");
        for (int i = 0; i < docs.size(); i++) {
            RetrievedDocument doc = docs.get(i);
            sb.append("资料").append(i + 1).append(": ");
            if (doc.getTitle() != null) {
                sb.append("[").append(doc.getTitle()).append("] ");
            }
            sb.append("\n").append(doc.getContent()).append("\n\n");
        }
    } else {
        sb.append("【参考资料】无相关文档\n\n");
    }

    // 用户问题
    sb.append("【用户问题】\n").append(context.getQuery());

    return sb.toString();
}
```

### 完整 Prompt 示例

```
你是一个专业的知识库问答助手...

【历史对话】
用户: 什么是分布式锁？
助手: 分布式锁是一种...

【参考资料】

资料1: [框架文档-分布式锁]
分布式锁是分布式系统中用于协调多个节点访问共享资源的机制...

资料2: [框架文档-Lock模块]
MolanDev 提供了基于 Redis 的分布式锁实现...

【用户问题】
如何使用 MolanDev 的分布式锁？
```

## 消息持久化

对话消息自动持久化，支持历史查询和审计。

### 消息存储

```java
private void saveMessages(RagContext context, List<RetrievedDocument> docs) {
    // 保存用户消息
    KlChatMessageEntity userMsg = new KlChatMessageEntity();
    userMsg.setId(context.getUserMessageId());
    userMsg.setConversationId(context.getConversationId());
    userMsg.setRole("user");
    userMsg.setContent(context.getQuery());
    userMsg.setMessageType("rag");
    messageService.save(userMsg);

    // 保存 AI 消息
    KlChatMessageEntity aiMsg = new KlChatMessageEntity();
    aiMsg.setId(context.getAssistantMessageId());
    aiMsg.setConversationId(context.getConversationId());
    aiMsg.setRole("assistant");
    aiMsg.setContent(context.getResponseContent());
    aiMsg.setThinkingContent(context.getThinkingContent());
    aiMsg.setTokenUsage(context.getTokenUsage());
    aiMsg.setMessageType("rag");
    messageService.save(aiMsg);

    // 保存引用文档关联
    if (docs != null && !docs.isEmpty()) {
        messageDocService.saveDocs(context.getAssistantMessageId(), docs);
    }
}
```

### 数据模型

```
kl_chat_conversation (会话)
├── id
├── title
├── created_at
└── ...

kl_chat_message (消息)
├── id
├── conversation_id
├── role (user/assistant)
├── content
├── thinking_content
├── token_usage
└── ...

kl_chat_message_doc (消息-文档关联)
├── message_id
├── document_id
├── chunk_id
└── ...
```

## API 使用

### 基础问答

```bash
curl -X POST /api/knowledge/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "什么是分布式锁？",
    "libraryIds": ["library-001"]
  }'
```

### 多轮对话

```bash
curl -X POST /api/knowledge/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "它有哪些实现方式？",
    "conversationId": "conv-001",
    "libraryIds": ["library-001"]
  }'
```

### 完整参数

```bash
curl -X POST /api/knowledge/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "分布式锁如何保证高可用？",
    "conversationId": "conv-001",
    "libraryIds": ["library-001"],
    "topK": 10,
    "threshold": 0.7,
    "enableHybridSearch": true,
    "enableRerank": true,
    "enableContextExpansion": true,
    "think": true,
    "historyTurns": 3
  }'
```

### 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| query | String | 必填 | 用户问题 |
| conversationId | String | - | 会话 ID，多轮对话时传入 |
| libraryIds | List | - | 知识库 ID 列表 |
| documentId | String | - | 指定文档 ID |
| topK | int | 20 | 检索数量 |
| threshold | double | 0.7 | 相似度阈值 |
| enableHybridSearch | boolean | false | 启用混合检索 |
| enableRerank | boolean | false | 启用重排序 |
| enableContextExpansion | boolean | false | 启用上下文补全 |
| think | boolean | false | 启用深度思考 |
| historyTurns | int | 3 | 历史对话轮数 |
