# 文档摄入

文档摄入是 Knowledge 服务的核心流程，负责将各类文档转换为可检索的知识片段。整个流程包括：格式转换 → 智能分片 → 向量化存储。

## 摄入流程

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  文档上传  │───▶│  格式转换  │───▶│  智能分片  │───▶│  向量化   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                    │                │                │
                    ▼                ▼                ▼
              ┌──────────┐    ┌──────────┐    ┌──────────┐
              │ Markdown │    │  Chunk   │    │ Vector   │
              └──────────┘    └──────────┘    └──────────┘
```

## 格式转换

Knowledge 服务支持多种文档格式，并根据文件类型智能选择转换引擎：

### 支持的格式

| 格式 | 转换引擎 | 说明 |
|------|----------|------|
| PDF | MinerU | 专业 PDF 解析，保留排版结构 |
| DOCX | MarkItDown | Microsoft Word 文档 |
| DOC | LibreOffice → MarkItDown | 旧版 Word，两步转换 |
| XLSX | MarkItDown | Excel 表格 |
| XLS | LibreOffice → MarkItDown | 旧版 Excel |
| PPTX | MarkItDown | PowerPoint 演示文稿 |
| HTML | MarkItDown | 网页文档 |
| TXT | 内置处理 | 纯文本包装为 Markdown |
| MD | 无需转换 | 直接使用 |

### 转换引擎对比

| 引擎 | 优势 | 适用场景 |
|------|------|----------|
| **MarkItDown** | 轻量快速，Office 格式支持好 | Word、Excel、PPT、HTML |
| **LibreOffice** | 格式兼容性强，支持旧版 Office | DOC、XLS 等旧格式 |
| **MinerU** | PDF 解析精度高，保留表格/图片 | PDF 文档 |

### 转换流程

```java
// 根据文件类型选择转换策略
if ("doc".equals(fileType)) {
    // doc -> docx -> md (两步转换)
    convertDocToMd();
} else if (Arrays.asList("docx", "xlsx", "pptx", "xls").contains(fileType)) {
    // 直接转 MD
    convertOfficeToMd();
} else if ("pdf".equals(fileType)) {
    // PDF 转 MD
    convertPdfToMd();
}
```

### 转换服务部署

各转换服务独立部署，通过 HTTP API 调用：

```yaml
molandev:
  rag:
    converter:
      # MarkItDown 转换服务
      mark-it-down-url: http://localhost:10996
      # LibreOffice 转换服务
      libre-office-url: http://localhost:10997
      # MinerU 转换服务
      mineru-url: http://localhost:10998
```

## 智能分片

文档转换后，需要进行分片处理。Knowledge 服务采用**结构感知分片**策略，而非简单的字符切分。

### 设计理念

传统分片方式按固定字符数切分，存在以下问题：

- 切断语义完整的段落
- 丢失章节上下文
- 检索结果缺乏连贯性

Knowledge 的结构感知分片：

- **识别章节结构**：解析 Markdown 标题层级
- **保留语义边界**：按章节/段落自然分割
- **追踪原文位置**：记录每个分片的字符位置

### 分片算法

```
原文档结构：
# 第一章 概述
章节内容...

## 1.1 背景
背景内容...

## 1.2 目标
目标内容...

# 第二章 设计
设计内容...

分片结果：
┌─────────────────────────────────────┐
│ Chunk 1: 第一章 概述 + 1.1 背景      │
│ position: 0, range: [0, 500]        │
├─────────────────────────────────────┤
│ Chunk 2: 1.2 目标                    │
│ position: 1, range: [500, 800]      │
├─────────────────────────────────────┤
│ Chunk 3: 第二章 设计                 │
│ position: 2, range: [800, 1200]     │
└─────────────────────────────────────┘
```

### 核心实现

```java
public class MarkdownSplittingService {

    // Markdown 标题正则
    private static final Pattern HEADING_PATTERN =
        Pattern.compile("^(#{1,6})\\s+(.+)$", Pattern.MULTILINE);

    public List<DocumentChunk> splitMarkdown(String documentId, String mdContent) {
        // 1. 解析章节结构
        List<Section> sections = parseMarkdownStructure(mdContent);

        // 2. 按章节分片
        if (sections.isEmpty()) {
            // 无章节结构，降级为段落分割
            return splitByParagraphs(documentId, mdContent, config);
        }

        // 3. 结构化分割
        return splitBySections(documentId, sections, mdContent, config);
    }
}
```

### 分片配置

```yaml
molandev:
  rag:
    splitting:
      # 分片大小（字符数）
      chunk-size: 1000
      # 分片重叠大小
      overlap-size: 200
      # 最小分片大小
      min-chunk-size: 100
```

### 位置追踪

每个分片记录在原文中的位置，用于检索结果高亮：

```java
public class DocumentChunk {
    private String documentId;
    private int chunkIndex;
    private String content;
    private String sectionPath;      // 章节路径：第一章 > 1.1 背景
    private int charStartIndex;      // 原文起始位置
    private int charEndIndex;        // 原文结束位置
}
```

检索时返回位置信息，前端可据此高亮原文：

```json
{
  "documentId": "doc-001",
  "content": "分布式锁是...",
  "highlightRanges": [
    { "start": 100, "end": 350 }
  ]
}
```

## 向量化存储

分片完成后，进行向量化处理并存储。

### 向量化流程

```java
public int[] vectorizeDocument(String documentId, String mdFilePath) {
    // 1. 读取 MD 文件
    String mdContent = readMdFile(mdFilePath);

    // 2. 文本分片
    List<DocumentChunk> chunks = splittingService.splitMarkdown(documentId, mdContent);

    // 3. 保存分片到数据库
    List<KlDocumentChunkEntity> savedChunks = chunkService.saveChunks(chunks, libraryId);

    // 4. 向量化处理
    int vectorCount = embedAndUpdateStatus(savedChunks);

    // 5. 同步到 ES（可选，用于混合检索）
    chunkEsService.syncChunks(savedChunks);

    return new int[]{chunks.size(), vectorCount};
}
```

### 元数据构建

向量化时，为每个分片构建丰富的元数据，支持检索过滤：

```java
private Map<String, Object> buildChunkMetadata(KlDocumentChunkEntity chunk, KlDocumentEntity document) {
    Map<String, Object> metadata = new HashMap<>();

    // 基础定位信息
    metadata.put("library_id", chunk.getLibraryId());
    metadata.put("document_id", chunk.getDocumentId());
    metadata.put("chunk_index", chunk.getPosition());

    // 文档元数据
    metadata.put("document_title", document.getTitle());
    metadata.put("author", document.getAuthor());
    metadata.put("category", document.getCategory());
    metadata.put("tags", document.getTags());

    // 分片元数据
    metadata.put("section_path", chunk.getSectionPath());
    metadata.put("charStartIndex", chunk.getCharStartIndex());
    metadata.put("charEndIndex", chunk.getCharEndIndex());

    return metadata;
}
```

### 批量处理

为提高效率，采用批量向量化：

```yaml
molandev:
  rag:
    embedding:
      # 批处理大小
      batch-size: 10
```

### 多存储支持

向量化结果存储到多个位置：

| 存储位置 | 用途 |
|----------|------|
| MySQL | 分片元数据、状态管理 |
| PgVector | 向量索引，语义检索 |
| Elasticsearch | 全文索引，关键词检索（可选） |

## 任务调度

文档摄入通过任务队列异步处理：

```yaml
molandev:
  rag:
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

### 任务状态

```
待处理 → 转换中 → 分片中 → 向量化中 → 完成
                    ↓
                  失败（可重试）
```

## 最佳实践

### 分片大小选择

| 场景 | 建议大小 | 说明 |
|------|----------|------|
| 短文档（FAQ） | 300-500 | 保持完整性 |
| 技术文档 | 800-1200 | 平衡语义与检索精度 |
| 长文档（书籍） | 1000-1500 | 配合上下文补全 |

### 格式转换建议

- **PDF**：优先使用 MinerU，对表格、公式支持更好
- **Word**：推荐转换为 DOCX 后上传
- **代码文档**：直接使用 Markdown 格式

### 性能优化

1. **批量上传**：多文档并行处理
2. **预热向量库**：提前创建索引
3. **ES 分片规划**：按知识库分索引
