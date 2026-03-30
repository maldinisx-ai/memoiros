# MemoirOS v2.1 产品需求文档 (PRD)

**版本**: v2.1
**创建日期**: 2026-03-29
**状态**: 设计阶段

---

## 1. 产品概述

### 1.1 产品定位
MemoirOS 是一个本地优先的 AI 驱动回忆录写作系统，通过多 Agent 协作将用户的口述历史转化为结构化的个人回忆录。

### 1.2 核心价值
- **隐私安全**: 所有数据本地存储，用户完全掌控
- **AI 协作**: 多 Agent 分工明确，智能引导采访
- **多格式输出**: 支持 Markdown、Word、PDF 等多种格式

### 1.3 目标用户
- 希望记录人生故事的老年人
- 帮助父母整理回忆的子女
- 个人传记写作者
- 家族历史研究者

---

## 2. 技术架构

### 2.1 系统架构（四层标准架构）

#### 接入层
- Alpine.js 前端（轻量级交互）
- REST API（Express 5.2）
- 导出服务（MD/Word/PDF）
- Trace 日志（Langfuse）

#### 编排层
- 工作流引擎（状态机 + 断点续跑）
- 上下文管理（滑动窗口 + 摘要链）
- LLM Factory（多模型 + 降级策略）
- 提示词管理器（.md 文件热更新）

#### 记忆层
- MemCube 记忆立方体（带元数据 + 分层）
- SQLite 存储（better-sqlite3）
- FTS5 全文检索
- 记忆图谱可视化（D3.js）

#### 支撑层
- BaseAgent v2.1（Zod 验证 + 重试 + 流式响应）
- Winston 日志系统
- PM2 进程守护
- 用户事务隔离

### 2.2 Agent 架构

#### 核心 Agent
- **InterviewerAgent**: 8 阶段采访 + 记忆采集
- **PreprocessorAgent**: 预处理 + 时间线 + 矛盾发现 + 关联建立
- **MemoirArchitectAgent**: 大纲设计 + 人工确认
- **MemoirWriterAgent**: 撰写 + 风格迁移

#### 扩展 Agent（v2.0 后）
- **MemoryFusionAgent**: 记忆融合
- **MemoryRetrievalAgent**: 语义检索
- **PhotoAnalyzerAgent**: 照片分析（**预留**）

---

## 3. 核心功能

### 3.1 用户管理
- 用户身份识别（老用户恢复 / 新用户创建）
- 用户隔离存储（user_xxx/database.db）
- 会话管理（断点续跑）

### 3.2 采访流程
- 8 阶段采访（热身→童年→教育→职业→家庭→里程碑→回顾→收尾）
- 智能问题生成
- 实时记忆预览
- 阶段进度展示

### 3.3 数据处理
- 实体提取（时间、地点、人物、事件）
- 事实验证
- 矛盾发现与标记
- 时间线自动构建

### 3.4 内容生成
- 用户画像生成
- 回忆录大纲设计
- 章节撰写（多种风格）
- 图文混排（v2.0 后）

### 3.5 导出功能
- Markdown 导出
- Word 导出
- PDF 导出（多主题）
- 时间线图表

---

## 4. 技术规格

### 4.1 数据模型
- **MemCube**: 记忆立方体模型（带 status + embeddingId）
- **Interview**: 采访状态
- **Timeline**: 时间线
- **Profile**: 用户画像
- **Outline**: 大纲
- **Memoir**: 回忆录

### 4.2 存储方案
```
data/
├── user_{id}/
│   ├── database.db                # SQLite 主库
│   ├── photos/                    # 照片存储（v2.0 后）
│   │   ├── raw/
│   │   ├── thumbnails/
│   │   └── index.json
│   └── checkpoints/              # 断点续存
```

### 4.3 LLM 集成
- **Ollama**（本地优先）
- **OpenAI**（云端备用）
- **DeepSeek**、**Anthropic**（扩展）

---

## 5. v2.1 开发路线图

### Phase 1：核心稳固（1周）
**目标**: 工程化基础加固

| 任务 | 技术方案 | 优先级 |
|------|---------|--------|
| Winston 日志 | winston 结构化日志 | P0 |
| 流式响应 | Transfer-Encoding chunked | P0 |
| 滑动窗口 | 最近10轮 + 历史摘要 | P0 |
| PM2 守护 | 进程守护 + 自动重启 | P0 |
| 环境变量 | dotenv 配置管理 | P1 |

### Phase 2：数据层升级（1周）
**目标**: 数据模型与存储完善

| 任务 | 技术方案 | 优先级 |
|------|---------|--------|
| Zod 全量校验 | 所有模型 Zod 定义 | P0 |
| SQLite 事务 | 用户级事务隔离 | P0 |
| 工作流引擎 | 状态机 + 断点续跑 | P0 |
| MemCube 增强 | status + embeddingId | P1 |
| FTS5 全文检索 | SQLite FTS5 扩展 | P1 |

### Phase 3：交互升级（1周）
**目标**: 用户体验提升

| 任务 | 技术方案 | 优先级 |
|------|---------|--------|
| 提示词管理 | .md 文件抽离 | P1 |
| 阶段进度条 | Alpine.js 可视化 | P1 |
| 实时记忆预览 | 右侧面板实时显示 | P1 |
| 人工确认环节 | 时间线校对 | P2 |
| 记忆图谱 | D3.js 可视化 | P2 |
| 导出主题 | CSS 模板系统 | P2 |

---

## 6. 未来规划（v2.0+）

### 6.1 照片融合模块（独立开发）

**定位**: v2.0 正式版发布后的独立增值功能

**核心功能**:
1. 照片上传与管理
2. AI 照片分析
   - EXIF 时间/地点提取
   - LLM Vision 场景描述
   - OCR 文字识别
   - 人脸检测
   - 情感分析
3. 照片 MemCube（带元数据）
4. 用户确认流程
5. 时间线自动融合
6. 图文混排导出

**技术方案**:
- sharp: 图像处理 + EXIF
- Tesseract.js: OCR
- face-api.js: 人脸检测
- LLM Vision: 场景理解
- D3.js: 可视化

**实施时间**: v2.0 正式版发布后独立开发 2-3 周

**架构设计**:
```
PhotoAnalyzerAgent (新增 Agent)
├── 文件夹监控 (chokidar)
├── EXIF 提取
├── LLM Vision 分析
├── OCR 识别
├── 情感分析
└── Photo MemCube 生成
```

**数据模型**:
```typescript
interface PhotoMemCube extends MemCube {
  photo: {
    filePath: string;
    fileName: string;
    exif: {
      dateTimeOriginal?: Date;
      gps?: { latitude, longitude };
      make?: string;
      model?: string;
    };
    recognition: {
      description: string;
      people: string[];
      emotions: string[];
      era?: string;
    };
    ocrText?: string;
    evidence: {
      year?: number;
      location?: string;
      event?: string;
    };
  };
  status: 'pending' | 'analyzed' | 'confirmed' | 'incorporated';
}
```

### 6.2 其他扩展功能
- 模板系统（多种回忆录结构）
- 风格迁移（海明威/普鲁斯特等）
- 多语言支持
- 语音输入
- 视频回忆录

---

## 7. 非功能性需求

### 7.1 性能
- 流式响应首字 < 1s
- 滑动窗口支持长对话
- FTS5 检索 < 100ms

### 7.2 安全
- 用户数据物理隔离
- 本地优先（隐私安全）
- 提示词文件管理
- 沙箱化插件系统

### 7.3 可靠性
- Winston 结构化日志
- PM2 进程守护
- 断点续跑（TASK/STAGE/FULL）
- LLM 降级策略

### 7.4 可观测性
- Langfuse Trace 链路
- Admin 面板
- 性能监控

---

## 8. 成功指标

### 8.1 功能完整性
- 8 阶段采访流程完整 ✅
- 从采访到导出全流程打通
- 数据持久化零丢失

### 8.2 用户体验
- 界面响应 < 1s
- AI 分析准确率 > 85%
- 用户满意度 > 4.5/5

### 8.3 技术质量
- 测试覆盖率 > 80%
- 零安全事故
- 系统可用性 > 99%

---

## 9. 风险与应对

### 9.1 技术风险
| 风险 | 应对 |
|------|------|
| LLM 调用失败 | 降级策略（主→备→本地） |
| 数据损坏 | SQLite 事务 + 备份 |
| 性能瓶颈 | 滑动窗口 + FTS5 |
| 上下文溢出 | 滑动窗口 + 摘要链 |

### 9.2 产品风险
| 风险 | 应对 |
|------|------|
| 用户流失 | 断点续跑 + 进度可视化 |
| 内容质量 | 人工确认环节 |
| 隐私泄露 | 本地优先 + 用户隔离 |

---

## 10. 里程碑

| 阶段 | 目标 | 时间 |
|------|------|------|
| **Phase 1** | 框架加固完成 | Week 1 |
| **Phase 2** | 数据层完成 | Week 2 |
| **Phase 3** | 交互优化完成 | Week 3 |
| **v2.1 发布** | 正式版发布 | Week 4 |
| **v2.0 照片** | 照片融合模块 | Q2 |

---

## 11. 接口预留

为照片功能预留的接口：

```typescript
// MemCube 基础接口
interface MemCube {
  content: string;
  metadata: {
    timestamp: Timestamp;
    source: 'interview' | 'photo' | 'document'; // ← 预留 photo
    emotionalTag: EmotionalTag;
  };
  attachments?: Attachment[]; // ← 预留附件
}

// 附件接口（预留）
interface Attachment {
  type: 'photo' | 'document' | 'audio' | 'video';
  filePath: string;
  mimeType: string;
  metadata?: unknown;
}
```

---

## 附录

### A. 技术栈总览
- 运行时: Node.js ≥20.0
- 语言: TypeScript 5.3+
- 后端: Express 5.2
- LLM: Ollama + 多模型抽象
- 数据库: better-sqlite3
- 前端: Alpine.js
- 日志: Winston
- 守护: PM2

### B. 架构原则
- 模块化: Agent 独立职责
- 轻量级: 最小依赖
- 本地优先: 隐私安全
- 可扩展: 插件化架构

### C. 开发规范
- TDD: 测试驱动开发
- Code Review: 代码审查
- 文档优先: MD 文档
- Git Flow: 分支管理

---

**文档版本**: v1.0
**最后更新**: 2026-03-29
**维护者**: MemoirOS Team
