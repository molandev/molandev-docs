# 配置说明

Knowledge 服务提供丰富的配置项，支持灵活的功能组合和性能调优。

## 完整配置

```yaml
molandev:
  rag:
    # ==================== 文档解析 ====================
    parsing:
      # 支持的文档类型
      supported-types: pdf,doc,docx,xls,xlsx,ppt,pptx,txt,md,html
      # 最大文件大小（MB）
      max-file-size: 100
      # 解析超时时间（秒）
      parse-timeout: 300

    # ==================== 文档切片 ====================
    splitting:
      # 切片大小（字符数）
      chunk-size: 1000
      # 切片重叠大小（字符数）
      overlap-size: 200
      # 最小块大小
      min-chunk-size: 100

    # ==================== 向量化 ====================
    embedding:
      # 批处理大小
      batch-size: 10

    # ==================== 检索 ====================
    retrieval:
      # 相似度算法 (cosine, euclidean, dot)
      similarity-metric: cosine
      # 返回结果数量
      top-k: 20
      # 相似度阈值
      threshold: 0.7

    # ==================== 重排序 ====================
    rerank:
      # 是否启用重排序
      enabled: false
      # 重排序模型
      model: qwen3-rerank
      # API 地址
      api-url: https://dashscope.aliyuncs.com/compatible-api/v1/reranks
      # API Key
      api-key: ${DASHSCOPE_API_KEY}
      # 重排序后返回的结果数量
      top-n: 5
      # 重排序指令
      instruct: "Given a web search query, retrieve relevant passages that answer the query."

    # ==================== 上下文补全 ====================
    context-expansion:
      # 是否启用上下文补全
      enabled: false
      # 向前扩展的 chunk 数量
      before-chunks: 1
      # 向后扩展的 chunk 数量
      after-chunks: 1

    # ==================== Elasticsearch ====================
    elasticsearch:
      # 是否启用 ES 全文检索
      enabled: false
      # 索引名称前缀
      index-prefix: kl_chunk
      # 关键词检索返回数量
      keyword-top-k: 10
      # 最小匹配度
      minimum-should-match: 75%

    # ==================== 混合检索 ====================
    hybrid-search:
      # 是否启用混合检索
      enabled: false
      # 向量检索权重（0-1）
      vector-weight: 0.5
      # 关键词检索权重（0-1）
      keyword-weight: 0.5
      # 融合策略: weighted_score / rrf
      fusion-strategy: rrf

    # ==================== 文档转换服务 ====================
    converter:
      # MarkItDown 转换服务
      mark-it-down-url: http://localhost:10996
      # LibreOffice 转换服务
      libre-office-url: http://localhost:10997
      # MinerU 转换服务
      mineru-url: http://localhost:10998
      # 连接超时（秒）
      connect-timeout: 30
      # 读取超时（秒）
      read-timeout: 60

    # ==================== 文档摄入任务 ====================
    ingest:
      # 是否启用摄入任务
      enabled: true
      # 轮询间隔（分钟）
      poll-interval-minutes: 10
      # 每次拉取任务数量
      batch-size: 50
      # 最大重试次数
      max-retry: 3
```

## Spring AI 配置

Knowledge 服务基于 Spring AI，需要配置 Embedding 和 Chat 模型：

```yaml
spring:
  ai:
    # OpenAI 兼容接口配置
    openai:
      base-url: https://api.openai.com
      api-key: ${OPENAI_API_KEY}

      # Embedding 模型配置
      embedding:
        options:
          model: text-embedding-3-small

      # Chat 模型配置
      chat:
        options:
          model: gpt-4o
          temperature: 0.7
```

### 多厂商支持

Spring AI 的 OpenAI 兼容接口支持多种厂商：

```yaml
# OpenAI
spring.ai.openai.base-url: https://api.openai.com

# DeepSeek
spring.ai.openai.base-url: https://api.deepseek.com

# 通义千问
spring.ai.openai.base-url: https://dashscope.aliyuncs.com/compatible-mode/v1

# Ollama 本地部署
spring.ai.openai.base-url: http://localhost:11434/v1
```

## 向量数据库配置

### PgVector

```yaml
spring:
  ai:
    vectorstore:
      pgvector:
        # 索引类型: HNSW / IVFFlat
        index-type: HNSW
        # 距离类型: COSINE_DISTANCE / EUCLIDEAN_DISTANCE / NEGATIVE_INNER_PRODUCT
        distance-type: COSINE_DISTANCE
        # 向量维度
        dimensions: 1536
        # 是否自动初始化
        initialize-schema: true
```

### Milvus

```yaml
spring:
  ai:
    vectorstore:
      milvus:
        host: localhost
        port: 19530
        database-name: default
        collection-name: knowledge_chunks
        embedding-dimension: 1536
        index-type: IVF_FLAT
        metric-type: COSINE
```

## Elasticsearch 配置

```yaml
spring:
  elasticsearch:
    uris: http://localhost:9200
    username: elastic
    password: ${ES_PASSWORD}
```

## 配置详解

### 分片配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `chunk-size` | 1000 | 分片大小，影响检索粒度 |
| `overlap-size` | 200 | 重叠大小，避免边界截断 |
| `min-chunk-size` | 100 | 最小分片，过滤过小片段 |

**调优建议**：
- 短文档（FAQ）：`chunk-size: 300-500`
- 技术文档：`chunk-size: 800-1200`
- 长文档（书籍）：`chunk-size: 1000-1500`

### 检索配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `top-k` | 20 | 召回数量，影响覆盖度 |
| `threshold` | 0.7 | 相似度阈值，影响精度 |

**调优建议**：
- 高召回场景：`top-k: 30, threshold: 0.6`
- 高精度场景：`top-k: 10, threshold: 0.8`

### 混合检索配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `vector-weight` | 0.5 | 向量检索权重 |
| `keyword-weight` | 0.5 | 关键词检索权重 |
| `fusion-strategy` | rrf | 融合算法 |

**融合策略对比**：

| 策略 | 特点 | 适用场景 |
|------|------|----------|
| `weighted_score` | 加权求和 | 得分可比较时 |
| `rrf` | 基于排名 | 通用场景，推荐 |

### 重排序配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `enabled` | false | 是否启用 |
| `top-n` | 5 | 精排后数量 |
| `model` | qwen3-rerank | 重排序模型 |

**成本考虑**：重排序需要调用外部 API，有额外成本。

### 上下文补全配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `before-chunks` | 1 | 向前扩展数 |
| `after-chunks` | 1 | 向后扩展数 |

**调优建议**：
- 短分片：`before-chunks: 2, after-chunks: 2`
- 长分片：`before-chunks: 1, after-chunks: 1`

## 场景化配置

### 轻量模式

资源消耗低，适合开发测试：

```yaml
molandev:
  rag:
    retrieval:
      top-k: 10
    rerank:
      enabled: false
    hybrid-search:
      enabled: false
    context-expansion:
      enabled: false
```

### 标准模式

平衡效果与成本：

```yaml
molandev:
  rag:
    retrieval:
      top-k: 20
    rerank:
      enabled: true
      top-n: 5
    hybrid-search:
      enabled: false
    context-expansion:
      enabled: true
```

### 完整模式

最佳效果，生产环境推荐：

```yaml
molandev:
  rag:
    retrieval:
      top-k: 20
      threshold: 0.7
    rerank:
      enabled: true
      top-n: 5
    hybrid-search:
      enabled: true
      fusion-strategy: rrf
    context-expansion:
      enabled: true
      before-chunks: 1
      after-chunks: 1
    elasticsearch:
      enabled: true
      keyword-top-k: 10
```

### 高精度模式

追求最高准确率：

```yaml
molandev:
  rag:
    retrieval:
      top-k: 30
      threshold: 0.75
    rerank:
      enabled: true
      top-n: 3
    hybrid-search:
      enabled: true
      vector-weight: 0.6
      keyword-weight: 0.4
```

## 环境变量

推荐使用环境变量管理敏感配置：

```yaml
spring:
  ai:
    openai:
      api-key: ${OPENAI_API_KEY}

molandev:
  rag:
    rerank:
      api-key: ${DASHSCOPE_API_KEY}

spring:
  elasticsearch:
    password: ${ES_PASSWORD}
```

## 配置优先级

检索参数支持多级配置，优先级从高到低：

1. **API 请求参数** - 单次请求指定
2. **代码默认值** - RagContext 构建时指定
3. **配置文件** - application.yml

```java
// API 请求参数优先级最高
RetrievalOptions options = RetrievalOptions.builder()
        .topK(10)  // 覆盖配置文件的 top-k: 20
        .build();
```
