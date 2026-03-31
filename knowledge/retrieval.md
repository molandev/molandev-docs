# 检索系统

检索系统是 Knowledge 服务的核心能力，提供从简单向量检索到复杂混合检索的多种方案，支持重排序优化和上下文补全。

## 检索架构

```
┌─────────────────────────────────────────────────────────────┐
│                        检索系统                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐     ┌─────────────┐                      │
│   │  向量检索    │     │  关键词检索  │                      │
│   │  (语义匹配)  │     │  (ES全文)    │                      │
│   └──────┬──────┘     └──────┬──────┘                      │
│          │                   │                              │
│          └─────────┬─────────┘                              │
│                    ▼                                        │
│            ┌─────────────┐                                  │
│            │  结果融合    │  ← RRF / 加权得分                │
│            └──────┬──────┘                                  │
│                   │                                         │
│                   ▼                                         │
│            ┌─────────────┐                                  │
│            │   重排序     │  ← qwen3-rerank                 │
│            └──────┬──────┘                                  │
│                   │                                         │
│                   ▼                                         │
│            ┌─────────────┐                                  │
│            │ 上下文补全   │  ← 相邻分片扩展                  │
│            └──────┬──────┘                                  │
│                   │                                         │
│                   ▼                                         │
│            ┌─────────────┐                                  │
│            │  检索结果    │                                  │
│            └─────────────┘                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 向量检索

向量检索基于语义相似度，能够理解查询意图，匹配语义相关的文档。

### 原理

```
查询文本 → Embedding模型 → 查询向量
                              ↓
                         向量相似度计算
                              ↓
文档分片 → Embedding模型 → 文档向量 → 返回 TopK 相似文档
```

### 实现

Knowledge 使用 Spring AI 的 VectorStore 抽象，支持多种向量数据库：

```java
public List<RetrievedDocument> vectorSearch(RetrievalOptions options, String query) {
    SearchRequest.Builder builder = SearchRequest.builder()
            .query(query)
            .topK(options.getTopK())
            .similarityThreshold(options.getThreshold());

    // 构建过滤条件
    Filter.Expression filter = buildFilterExpression(options);
    if (filter != null) {
        builder.filterExpression(filter);
    }

    List<Document> documents = vectorStore.similaritySearch(builder.build());
    return convertToRetrievedDocuments(documents);
}
```

### 元数据过滤

支持按元数据字段过滤检索范围：

```java
private Filter.Expression buildFilterExpression(RetrievalOptions options) {
    FilterExpressionBuilder builder = new FilterExpressionBuilder();

    // 按知识库过滤
    if (options.getLibraryId() != null) {
        builder.eq("library_id", options.getLibraryId());
    }

    // 按文档过滤
    if (options.getDocumentId() != null) {
        builder.eq("document_id", options.getDocumentId());
    }

    // 按作者过滤
    if (options.getAuthor() != null) {
        builder.eq("author", options.getAuthor());
    }

    // 按标签过滤
    if (options.getTag() != null) {
        builder.in("tags", options.getTag());
    }

    return builder.build();
}
```

### 配置

```yaml
molandev:
  rag:
    retrieval:
      # 相似度算法
      similarity-metric: cosine
      # 返回结果数量
      top-k: 20
      # 相似度阈值
      threshold: 0.7
```

## 混合检索

混合检索结合关键词检索和向量检索，兼顾精确匹配和语义理解。

### 为什么需要混合检索？

| 检索方式 | 优势 | 劣势 |
|----------|------|------|
| 关键词检索 | 精确匹配、专有名词 | 无法理解语义 |
| 向量检索 | 语义理解、同义匹配 | 可能遗漏精确词 |

混合检索融合两者优势，提升召回质量。

### 架构

```
┌──────────────┐
│   用户查询    │
└──────┬───────┘
       │
       ├──────────────────────┐
       │                      │
       ▼                      ▼
┌──────────────┐      ┌──────────────┐
│  关键词检索   │      │   向量检索   │
│  (ES BM25)   │      │  (Embedding) │
└──────┬───────┘      └──────┬───────┘
       │                      │
       │      ┌───────────────┘
       │      │
       ▼      ▼
┌──────────────────┐
│    结果融合       │
│ RRF / 加权得分    │
└──────────────────┘
```

### 融合策略

#### 1. 加权得分融合

```java
private List<RetrievedDocument> fuseByWeightedScore(
        List<RetrievedDocument> keywordResults,
        List<RetrievedDocument> vectorResults) {

    // 合并结果，按 chunkId 去重
    for (RetrievedDocument doc : keywordResults) {
        doc.setScore(doc.getScore() * keywordWeight);
    }
    for (RetrievedDocument doc : vectorResults) {
        if (mergedMap.containsKey(doc.getChunkId())) {
            // 合并得分
            existing.setScore(existing.getScore() + doc.getScore() * vectorWeight);
        }
    }

    // 按得分排序
    return mergedMap.values().stream()
            .sorted(Comparator.comparingDouble(RetrievedDocument::getScore).reversed())
            .collect(Collectors.toList());
}
```

#### 2. RRF (Reciprocal Rank Fusion)

RRF 是一种基于排名的融合算法，不依赖具体得分值：

```java
private List<RetrievedDocument> fuseByRRF(
        List<RetrievedDocument> keywordResults,
        List<RetrievedDocument> vectorResults) {

    int k = 60; // RRF 参数

    // 计算关键词结果的 RRF 得分
    for (int i = 0; i < keywordResults.size(); i++) {
        double rrfScore = keywordWeight / (k + i + 1);
        scoreMap.merge(chunkId, rrfScore, Double::sum);
    }

    // 计算向量结果的 RRF 得分
    for (int i = 0; i < vectorResults.size(); i++) {
        double rrfScore = vectorWeight / (k + i + 1);
        scoreMap.merge(chunkId, rrfScore, Double::sum);
    }

    return sortByScore(mergedMap, scoreMap);
}
```

RRF 公式：`score(d) = Σ 1/(k + rank(d))`

### 配置

```yaml
molandev:
  rag:
    elasticsearch:
      enabled: true
      # 关键词检索返回数量
      keyword-top-k: 10

    hybrid-search:
      enabled: true
      # 向量检索权重
      vector-weight: 0.5
      # 关键词检索权重
      keyword-weight: 0.5
      # 融合策略: weighted_score / rrf
      fusion-strategy: rrf
```

## 重排序

重排序是对初检结果进行精细化排序，提升结果相关性。

### 原理

```
初检结果 (Top 20)
      ↓
┌─────────────────┐
│  qwen3-rerank   │  ← 专门的重排序模型
└─────────────────┘
      ↓
精排结果 (Top 5)
```

重排序模型能够深度理解查询与文档的相关性，比向量相似度更精准。

### 实现

```java
public List<RerankResult> rerank(String query, List<String> documents, int topN) {
    RerankRequest request = RerankRequest.builder()
            .model("qwen3-rerank")
            .query(query)
            .documents(documents)
            .top_n(Math.min(topN, documents.size()))
            .instruct("Given a web search query, retrieve relevant passages that answer the query.")
            .build();

    ResponseEntity<RerankResponse> response = restTemplate.postForEntity(
            "https://dashscope.aliyuncs.com/compatible-api/v1/reranks",
            request,
            RerankResponse.class
    );

    return response.getBody().getResults();
}
```

### 重排序流程

```java
private List<RetrievedDocument> rerankDocuments(String query, List<RetrievedDocument> docs) {
    // 1. 提取文档内容
    List<String> documents = docs.stream()
            .map(doc -> "【标题】" + doc.getTitle() + "\n【内容】" + doc.getContent())
            .collect(Collectors.toList());

    // 2. 调用重排序 API
    var rerankResults = rerankService.rerank(query, documents, topN);

    // 3. 根据重排序结果重新排列
    List<RetrievedDocument> rerankedDocs = new ArrayList<>();
    for (var result : rerankResults) {
        RetrievedDocument doc = docs.get(result.getIndex());
        doc.setRerankScore(result.getRelevance_score());
        rerankedDocs.add(doc);
    }

    return rerankedDocs;
}
```

### 配置

```yaml
molandev:
  rag:
    rerank:
      enabled: true
      # 重排序模型
      model: qwen3-rerank
      # API 地址
      api-url: https://dashscope.aliyuncs.com/compatible-api/v1/reranks
      # API Key
      api-key: ${DASHSCOPE_API_KEY}
      # 返回结果数量
      top-n: 5
```

### 效果对比

| 阶段 | 数量 | 说明 |
|------|------|------|
| 向量检索 | 20 | 召回阶段，保证覆盖 |
| 重排序 | 5 | 精排阶段，提升精度 |

## 上下文补全

上下文补全通过扩展相邻分片，解决分片截断导致的语义不完整问题。

### 问题场景

```
原文：
...分布式锁的实现方式有多种，常见的包括：
1. 基于数据库的实现
2. 基于 Redis 的实现
3. 基于 ZooKeeper 的实现...

分片结果：
Chunk 5: ...分布式锁的实现方式有多种，常见的包括：
Chunk 6: 1. 基于数据库的实现
Chunk 7: 2. 基于 Redis 的实现
Chunk 8: 3. 基于 ZooKeeper 的实现...

检索命中 Chunk 6，但缺少上下文...
```

### 解决方案

自动扩展命中分片的前后相邻分片：

```
命中 Chunk 6
      ↓
扩展 Chunk 5, 6, 7
      ↓
合并为完整语义片段
```

### 实现

```java
private List<RetrievedDocument> expandContext(List<RetrievedDocument> docs) {
    int beforeChunks = config.getBeforeChunks();  // 向前扩展数
    int afterChunks = config.getAfterChunks();    // 向后扩展数

    // 1. 批量获取相邻分片
    List<KlDocumentChunkEntity> expandedChunks =
        documentChunkService.getAdjacentChunksBatch(vectorIds, beforeChunks, afterChunks);

    // 2. 按文档分组
    Map<String, List<KlDocumentChunkEntity>> chunksByDoc = groupByDocument(expandedChunks);

    // 3. 合并相邻区间
    for (List<KlDocumentChunkEntity> chunks : chunksByDoc.values()) {
        // 计算合并后的区间
        int minStart = chunks.stream().mapToInt(c -> c.getCharStartIndex()).min();
        int maxEnd = chunks.stream().mapToInt(c -> c.getCharEndIndex()).max();

        // 合并内容
        String mergedContent = chunks.stream()
                .sorted(Comparator.comparing(KlDocumentChunkEntity::getPosition))
                .map(KlDocumentChunkEntity::getContent)
                .collect(Collectors.joining("\n"));

        // 创建扩展后的文档
        RetrievedDocument expandedDoc = new RetrievedDocument();
        expandedDoc.setContent(mergedContent);
        expandedDoc.setMetadata(Map.of(
            "charStartIndex", minStart,
            "charEndIndex", maxEnd
        ));
    }

    return expandedDocs;
}
```

### 区间合并

当多个命中分片在同一文档内且位置相邻时，自动合并区间：

```
命中 Chunk 6, 8（位置相邻）
      ↓
合并为一个大区间
      ↓
避免返回重复内容
```

### 配置

```yaml
molandev:
  rag:
    context-expansion:
      enabled: true
      # 向前扩展的 chunk 数量
      before-chunks: 1
      # 向后扩展的 chunk 数量
      after-chunks: 1
```

## 检索模式组合

Knowledge 服务支持灵活的检索模式组合：

### 模式对比

| 模式 | 配置 | 效果 | 成本 |
|------|------|------|------|
| 基础模式 | 仅向量检索 | 语义匹配 | 低 |
| 混合模式 | 向量 + 关键词 | 召回更全面 | 中 |
| 精排模式 | 向量 + 重排序 | 结果更精准 | 中高 |
| 完整模式 | 混合 + 重排序 + 上下文补全 | 最佳效果 | 高 |

### 推荐配置

```yaml
# 生产环境推荐配置
molandev:
  rag:
    retrieval:
      top-k: 20
      threshold: 0.7
    hybrid-search:
      enabled: true
      fusion-strategy: rrf
    rerank:
      enabled: true
      top-n: 5
    context-expansion:
      enabled: true
      before-chunks: 1
      after-chunks: 1
```

## API 使用

### 基础检索

```java
RetrievalOptions options = RetrievalOptions.builder()
        .libraryId("library-001")
        .topK(10)
        .threshold(0.7)
        .build();

List<RetrievedDocument> docs = knowledgeRetrievalService.search("分布式锁原理", options);
```

### 带过滤的检索

```java
RetrievalOptions options = RetrievalOptions.builder()
        .libraryIds(List.of("lib-1", "lib-2"))
        .author("张三")
        .tag("技术文档")
        .enableHybridSearch(true)
        .enableRerank(true)
        .build();
```

### 单文档检索

```java
RetrievalOptions options = RetrievalOptions.builder()
        .documentId("doc-001")  // 仅检索指定文档
        .topK(5)
        .build();
```
