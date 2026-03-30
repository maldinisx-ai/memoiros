# MemoirOS - 智能回忆录写作系统

> 基于多智能体架构，使用本地大模型生成真实、准确的个人回忆录

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 项目简介

MemoirOS 是一个智能回忆录写作系统，通过引导式采访、时间线构建、事实验证、文风仿写和智能写作，帮助用户创建高质量的个人回忆录。

### 核心特性

- ✅ **引导式采访**: Interviewer Agent 通过多阶段提问收集人生故事
- ✅ **时间线构建**: Timeline Builder Agent 自动梳理事件时间顺序
- ✅ **事实验证**: Fact Verifier Agent 验证历史事实和时代背景
- ✅ **文风仿写**: Style Imitator Agent 学习用户说话风格
- ✅ **智能预处理**: Preprocessor Agent 整合所有提取信息，生成用户画像
- ✅ **大纲生成**: MemoirArchitect Agent 生成回忆录结构化大纲
- ✅ **智能写作**: MemoirWriter Agent 基于用户画像生成回忆录章节
- ✅ **章节管理**: 支持章节保存、编辑、版本历史和导出
- ✅ **用户认证**: 完整的用户注册、登录和会话管理
- ✅ **本地部署**: 使用 Ollama 本地模型，数据隐私安全
- ✅ **Web 界面**: 简洁易用的交互界面，支持移动端
- ✅ **流式响应**: SSE 支持，实时展示生成内容
- ✅ **错误处理**: 统一错误响应格式，友好的用户提示
- ✅ **性能优化**: LLM 响应缓存，减少 API 调用

---

## 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MemoirOS 系统架构                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         表现层 (Presentation)                        │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │   Web UI     │  │  静态资源    │  │  SSE 流式    │              │   │
│  │  │  (index.html)│  │   服务       │  │   响应       │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↕                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         API 层 (API Gateway)                         │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │  路由管理    │  │  请求验证    │  │  错误处理    │              │   │
│  │  │  (Express)   │  │   (Zod)      │  │  (统一格式)   │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │  会话管理    │  │  用户认证    │  │  日志记录    │              │   │
│  │  │ (SessionMgr) │  │ (AuthManager)│  │  (Winston)   │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↕                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       Agent 层 (Multi-Agent)                         │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │ Interviewer  │  │TimelineBldr  │  │FactVerifier  │              │   │
│  │  │  采访者      │  │ 时间线构建   │  │ 事实验证     │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │StyleImitator │  │ Preprocessor │  │MemoirArch    │              │   │
│  │  │  文风仿写    │  │  预处理      │  │  大纲生成    │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  │  ┌──────────────┐                                                   │   │
│  │  │ MemoirWriter │                                                   │   │
│  │  │  回忆录撰写  │                                                   │   │
│  │  └──────────────┘                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↕                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       服务层 (Services)                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │  LLM Client  │  │ChapterMgr    │  │  LLM Cache   │              │   │
│  │  │  (Ollama)    │  │ 章节管理     │  │  响应缓存    │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↕                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       数据层 (Data Layer)                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │FileStorage   │  │ SQL Database │  │   Config     │              │   │
│  │  │ JSON 文件    │  │ (better-sqlite3)│  环境变量     │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 数据流图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           数据处理流程                                        │
└─────────────────────────────────────────────────────────────────────────────┘

    用户输入
       │
       ↓
┌──────────────────┐
│  Interviewer     │  ← 8 阶段引导式采访
│  Agent           │
└────────┬─────────┘
         │
         ↓
    采访数据存储
         │
         ↓
┌──────────────────┐
│  Preprocessor    │  ← 整合所有提取信息
│  Agent           │
└────────┬─────────┘
         │
    ┌────┴─────┬─────────────┬─────────────┐
    ↓          ↓             ↓             ↓
┌────────┐ ┌────────┐  ┌──────────┐  ┌──────────┐
│Timeline│ │  Voice │  │    Fact  │  │ Entities  │
│Events  │ │Profile │  │ Verification│ │人物/地点  │
└────────┘ └────────┘  └──────────┘  └──────────┘
    │          │             │             │
    └──────────┴─────────────┴─────────────┘
                    │
                    ↓
            UserProfile
                    │
                    ↓
         ┌──────────────────┐
         │ MemoirArchitect  │  ← 生成结构化大纲
         │     Agent        │
         └────────┬─────────┘
                  │
                  ↓
              大纲数据
                  │
                  ↓
         ┌──────────────────┐
         │  MemoirWriter    │  ← 撰写回忆录章节
         │     Agent        │
         └────────┬─────────┘
                  │
                  ↓
              回忆录章节
                  │
                  ↓
         ┌──────────────────┐
         │  ChapterManager  │  ← 保存/版本/导出
         └──────────────────┘
```

### 技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| **前端** | HTML5 + CSS3 + Vanilla JS | 无框架，轻量级实现 |
| **API** | Express.js | RESTful API + SSE |
| **语言** | TypeScript 5.8+ | 类型安全 |
| **运行时** | Node.js 20+ | LTS 版本 |
| **大模型** | Ollama | 本地部署，隐私安全 |
| **推荐模型** | qwen3:8b | 中文效果好 |
| **数据验证** | Zod | 运行时类型检查 |
| **数据存储** | better-sqlite3 + JSON | 混合存储 |
| **日志** | Winston | 结构化日志 |
| **测试** | Jest | 单元测试 |
| **包管理** | pnpm | 高效依赖管理 |

---

## 项目结构

```
memoiros/
├── packages/
│   └── core/                           # 核心逻辑包
│       ├── agents/                     # Agent 实现
│       │   ├── base.ts                 # Agent 基类
│       │   ├── interviewer.ts          # 采访者 Agent
│       │   ├── timeline-builder.ts     # 时间线构建 Agent
│       │   ├── style-imitator.ts       # 文风仿写 Agent
│       │   ├── fact-verifier.ts        # 事实验证 Agent
│       │   ├── preprocessor.ts         # 预处理 Agent
│       │   ├── memoir-writer.ts        # 回忆录撰写 Agent
│       │   └── memoir-architect.ts     # 大纲生成 Agent
│       ├── llm/
│       │   └── client.ts               # LLM 客户端（Ollama）
│       ├── models/                     # 数据模型
│       │   ├── interview.ts
│       │   ├── timeline.ts
│       │   ├── style.ts
│       │   └── fact-verification.ts
│       ├── storage/                    # 数据存储
│       │   ├── database.ts             # 数据库接口
│       │   ├── chapter-manager.ts      # 章节管理
│       │   ├── auth.ts                 # 用户认证
│       │   └── session.ts              # 会话管理
│       ├── schemas/                    # Zod 验证模式
│       │   ├── database.schemas.ts
│       │   └── chapter.schemas.ts
│       └── utils/                      # 工具函数
│           ├── browse-client.ts        # 网页浏览
│           ├── pdf-exporter.ts         # PDF 导出
│           ├── context-manager.ts      # 上下文管理
│           ├── error-handler.ts        # 错误处理
│           ├── llm-cache.ts            # LLM 缓存
│           └── winston-logger.ts       # Winston 日志
├── server/
│   ├── index.ts                        # Express API 服务器
│   └── storage.ts                      # JSON 文件存储
├── web/
│   └── index.html                      # Web 界面
├── data/                               # 数据存储目录
├── logs/                               # 日志目录
├── exports/                            # 导出文件目录
├── test/                               # 测试文件
├── .env                                # 环境配置
├── tsconfig.json                       # TypeScript 配置
├── jest.config.js                      # Jest 配置
├── package.json                        # 项目配置
├── TODO.md                             # 待办事项
└── README.md                           # 项目说明
```

---

## 快速开始

### 前置要求

1. **Node.js 20+**
   ```bash
   node --version  # 确保 v20 或更高
   ```

2. **pnpm**
   ```bash
   npm install -g pnpm
   ```

3. **Ollama**
   - Windows: 从 [官网](https://ollama.ai/download) 下载安装
   - macOS: `brew install ollama`
   - Linux: 参考官网文档

4. **下载模型**
   ```bash
   ollama pull qwen3:8b
   ```

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/your-repo/memoiros.git
cd memoiros

# 2. 安装依赖
pnpm install

# 3. 配置环境（已预设，可修改 .env）
# .env 文件内容：
# LLM_PROVIDER=ollama
# LLM_MODEL=qwen3:8b
# OLLAMA_BASE_URL=http://localhost:11434/api/chat

# 4. 构建项目
pnpm build

# 5. 启动服务器
pnpm server

# 6. 打开浏览器访问
# http://localhost:3000
# 或直接打开 file:///d:/projects/memoiros/web/index.html
```

### 开发模式

```bash
# 启用开发模式（自动重启）
pnpm dev

# 运行测试
pnpm test

# 类型检查
pnpm type-check
```

---

## API 文档

### 基础信息

- **Base URL**: `http://localhost:3000`
- **响应格式**: JSON
- **错误格式**: 统一错误响应（见下方）

### 统一错误响应格式

所有 API 错误遵循统一格式：

```typescript
{
  "success": false,
  "code": "ERROR_CODE",           // 错误码
  "message": "错误描述",           // 用户友好的错误消息
  "details": [                    // 详细错误信息（可选）
    {
      "field": "username",
      "message": "用户名至少3个字符"
    }
  ],
  "requestId": "req_xxx"          // 请求追踪 ID
}
```

**错误码列表**：

| 错误码 | 说明 |
|--------|------|
| `VALIDATION_ERROR` | 请求参数验证失败 |
| `UNAUTHORIZED` | 未授权访问 |
| `NOT_FOUND` | 资源不存在 |
| `INTERNAL_ERROR` | 服务器内部错误 |
| `LLM_ERROR` | 大模型调用失败 |
| `STORAGE_ERROR` | 存储操作失败 |
| `AUTH_FAILED` | 认证失败 |
| `SESSION_EXPIRED` | 会话过期 |

---

### 1. 采访 API

#### 开始采访

```http
POST /api/interview/start
Content-Type: application/json

{
  "userId": "user_123"
}
```

**响应**：
```json
{
  "interviewId": "int_1774746855358_mn1u1h8",
  "phase": "warmup",
  "nextQuestion": "您好！我是您的回忆录写作助手..."
}
```

#### 处理回答

```http
POST /api/interview/process
Content-Type: application/json

{
  "interviewId": "int_1774746855358_mn1u1h8",
  "answer": "我出生在1985年，湖北某县城..."
}
```

**响应**：
```json
{
  "interviewId": "int_1774746855358_mn1u1h8",
  "phase": "childhood",
  "nextQuestion": "能分享一下您的童年记忆吗？",
  "suggestedQuestions": [
    "您小时候最喜欢做什么游戏？",
    "童年有什么特别难忘的经历吗？"
  ],
  "needsClarification": false
}
```

#### 流式处理回答 (SSE)

```http
POST /api/interview/process/stream
Content-Type: application/json

{
  "interviewId": "int_1774746855358_mn1u1h8",
  "answer": "..."
}
```

**SSE 事件**：
```
event: start
data: {"interviewId":"int_xxx","message":"Processing your answer..."}

event: question
data: {"phase":"childhood","nextQuestion":"...","suggestedQuestions":[...]}

event: done
data: {"message":"Complete"}
```

---

### 2. 时间线 API

#### 构建时间线

```http
POST /api/timeline/build
Content-Type: application/json

{
  "userId": "user_123",
  "interviewAnswers": [
    { "questionId": "q1", "answer": "我1985年出生..." },
    { "questionId": "q2", "answer": "2003年考上大学..." }
  ]
}
```

**响应**：
```json
{
  "timelineId": "timeline_user_123",
  "addedEvents": 15,
  "conflictsFound": 0,
  "gapsIdentified": [],
  "summary": "成功构建包含15个事件的时间线"
}
```

#### 获取时间线

```http
GET /api/timeline/user_123
```

---

### 3. 预处理 API

#### 生成用户画像

```http
POST /api/preprocess
Content-Type: application/json

{
  "userId": "user_123",
  "interviewId": "int_xxx",
  "includeTimeline": true,
  "includeVoiceProfile": true
}
```

**响应**：
```json
{
  "profile": {
    "basicInfo": {
      "birthYear": 1985,
      "birthPlace": "湖北某县城",
      "education": "武汉大学计算机专业",
      "career": "软件工程师"
    },
    "timeline": { ... },
    "entities": { ... },
    "voiceProfile": { ... }
  },
  "summary": "用户画像生成完成",
  "suggestions": ["建议补充更多童年细节"]
}
```

---

### 4. 回忆录 API

#### 生成大纲

```http
POST /api/memoir/outline
Content-Type: application/json

{
  "userId": "user_123",
  "interviewId": "int_xxx",
  "targetChapters": 10,
  "structure": "chronological"
}
```

**响应**：
```json
{
  "outline": {
    "structure": "chronological",
    "chapters": [
      {
        "chapterNumber": 1,
        "title": "童年时光",
        "timePeriod": { "startYear": 1985, "endYear": 1996 },
        "focus": "出生、家庭、小学",
        "estimatedWords": 3000,
        "keyEvents": [...]
      },
      ...
    ],
    "totalEstimatedWords": 30000
  }
}
```

#### 撰写章节

```http
POST /api/memoir/write
Content-Type: application/json

{
  "userId": "user_123",
  "interviewId": "int_xxx",
  "chapterNumber": 1,
  "focusPeriod": {
    "startYear": 1985,
    "endYear": 1996
  },
  "targetWords": 3000
}
```

**响应**：
```json
{
  "chapter": {
    "chapterNumber": 1,
    "title": "童年时光",
    "content": "我出生在1985年的那个夏天...",
    "wordCount": 2850,
    "eventsCovered": [...],
    "styleMetrics": { ... }
  }
}
```

---

### 5. 章节管理 API

#### 创建章节

```http
POST /api/chapters
Content-Type: application/json

{
  "userId": "user_123",
  "memoirId": "memoir_001",
  "title": "童年时光",
  "type": "chronological",
  "content": "我出生在1985年...",
  "metadata": {
    "timePeriod": { "startYear": 1985, "endYear": 1996 }
  }
}
```

#### 获取章节列表

```http
GET /api/chapters?userId=user_123&page=1&limit=10
```

**响应**：
```json
{
  "chapters": [...],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

#### 更新章节

```http
PUT /api/chapters/chap_xxx
Content-Type: application/json

{
  "userId": "user_123",
  "title": "童年时光（修订版）",
  "content": "..."
}
```

#### 导出章节

```http
GET /api/chapters/chap_xxx/export/markdown?userId=user_123
GET /api/chapters/chap_xxx/export/pdf?userId=user_123
```

#### 章节版本历史

```http
GET /api/chapters/chap_xxx/versions?userId=user_123
```

#### 恢复版本

```http
POST /api/chapters/chap_xxx/versions/ver_xxx/restore
Content-Type: application/json

{
  "userId": "user_123"
}
```

---

### 6. 用户认证 API

#### 注册

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "memoir_user",
  "email": "user@example.com",
  "password": "secure_password_123"
}
```

**响应**：
```json
{
  "success": true,
  "userId": "user_abc123",
  "message": "用户注册成功",
  "token": "sess_xxx...",
  "sessionId": "sess_001",
  "expiresAt": "2026-03-31T12:00:00Z"
}
```

#### 登录

```http
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "memoir_user",  # 用户名、邮箱或手机号
  "password": "secure_password_123"
}
```

#### 验证会话

```http
GET /api/auth/validate?token=sess_xxx...
```

#### 刷新会话

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "token": "sess_xxx...",
  "durationHours": 24
}
```

#### 登出

```http
POST /api/auth/logout
Content-Type: application/json

{
  "token": "sess_xxx..."
}
```

---

### 7. 用户管理 API

#### 查找或创建用户

```http
POST /api/user/find-or-create
Content-Type: application/json

{
  "identifier": "user@example.com"
}
```

#### 获取用户所有采访

```http
GET /api/user/user_123/interviews
```

#### 删除用户数据

```http
DELETE /api/user/user_123
```

---

### 8. 其他 API

#### 健康检查

```http
GET /api/health
```

**响应**：
```json
{
  "status": "ok",
  "provider": "ollama",
  "model": "qwen3:8b"
}
```

---

## 配置选项

### 环境变量

创建 `.env` 文件（已提供默认配置）：

```bash
# ============================================
# LLM 配置
# ============================================
LLM_PROVIDER=ollama              # 固定为 ollama
LLM_MODEL=qwen3:8b               # 模型名称
LLM_TIMEOUT=120000               # 请求超时（毫秒）
OLLAMA_BASE_URL=http://localhost:11434/api/chat

# ============================================
# 服务器配置
# ============================================
PORT=3000                        # API 服务端口
NODE_ENV=development             # 环境: development/production

# ============================================
# 数据存储
# ============================================
DATA_DIR=data                    # 数据目录
LOG_DIR=logs                     # 日志目录

# ============================================
# LLM 缓存配置
# ============================================
LLM_CACHE_DIR=data/cache         # 缓存目录
LLM_CACHE_MAX_SIZE=1000          # 最大缓存条目
LLM_CACHE_TTL=3600000            # 缓存过期时间（毫秒）
LLM_CACHE_PERSIST=false          # 是否持久化缓存

# ============================================
# 开发选项
# ============================================
DEBUG=false                      # 调试模式
TEST_MODE=false                  # 测试模式
```

---

## 常见问题

### Q: 支持哪些大模型？

A: 目前支持 Ollama 本地模型，推荐使用：
- **qwen3:8b** - 中文效果好，速度快（推荐）
- **llama3.2** - 英文效果好
- **qwen2.5:7b** - 轻量级选择
- **deepseek-coder** - 代码相关内容

### Q: 数据安全吗？

A: 完全安全！所有数据存储在本地，使用本地模型，不会上传到云端。

### Q: 需要联网吗？

A: 事实验证功能需要联网（浏览历史资料），其他功能可以离线使用。

### Q: 如何开始写回忆录？

A: 简单三步：
1. 开始采访，回答问题
2. 预处理生成用户画像
3. 生成大纲并撰写章节

### Q: 可以编辑已生成的章节吗？

A: 可以。系统支持章节编辑、版本历史和版本恢复。

### Q: 支持导出哪些格式？

A: 目前支持 Markdown 和 PDF 格式导出。

### Q: 如何更换模型？

A: 修改 `.env` 文件中的 `LLM_MODEL` 变量，然后重启服务器。

---

## 已知问题

### 🔴 密码重置功能 - tsx 缓存问题

**状态**: 暂时禁用 | **优先级**: 高 | **影响版本**: v0.2.0-beta.2

#### 问题描述

密码重置功能（`POST /api/auth/forgot-password` 和 `POST /api/auth/reset-password`）由于 **tsx TypeScript 运行器的严重缓存 bug** 而无法正常工作。

#### 根本原因

- tsx 存在多级缓存（文件系统 + V8 编译 + 依赖预编译）
- 即使删除 `node_modules`、清除 pnpm 缓存、使用 `--no-cache` 都无效
- 修改源代码后，tsx 仍执行旧版本的缓存代码
- 重命名类方法也无法触发重新编译

#### 已尝试的解决方案

| 方案 | 结果 |
|------|------|
| 修改源文件使用 ESM import | ❌ tsx 使用旧缓存 |
| 删除所有缓存目录 | ❌ 缓存位置未知/深度嵌套 |
| `npx tsx --no-cache` | ❌ 多级缓存无法清除 |
| pnpm store prune + install | ❌ 依赖缓存与源缓存分离 |
| 重命名方法（V2） | ❌ 错误日志仍显示旧方法名 |
| 切换到 ts-node | ❌ ESM 模块解析问题 |

#### 临时解决方案

**方案 A：手动数据库重置**（开发环境）

```bash
# 进入数据库
sqlite3 data/memoiros.db

# 查看用户
SELECT user_id, username, email FROM user_accounts;

# 手动设置新密码（使用 bcrypt）
# 在 Node.js 中生成哈希：
node -e "console.log(require('bcrypt').hashSync('new_password', 12))"

# 更新密码
UPDATE user_accounts
SET password_hash = '<生成的bcrypt哈希>'
WHERE user_id = 'user_xxx';
```

**方案 B：重新注册**（最简单）

直接使用新用户名重新注册即可。

#### 永久解决方案计划

1. **短期**: 切换到 Bun 运行器（无缓存问题）
2. **中期**: 将 `packages/core` 转换为 CommonJS
3. **长期**: 等待 tsx 修复缓存 bug 或迁移到 tsx/ts-node 混合方案

#### 相关文件

- `packages/core/src/storage/auth.ts:449-460` - generateResetTokenV2() 方法
- `packages/core/src/storage/auth.ts:320-375` - 密码重置 API 逻辑
- `server/index.ts:1130-1152` - 密码重置端点

#### 更新日志

- 2026-03-30: 发现 tsx 缓存问题，禁用密码重置功能
- 预计 v0.2.0-beta.3: 实现永久解决方案

---

## 路线图

### Phase 1: 核心功能 ✅

- [x] Interviewer Agent（8阶段采访系统）
- [x] Timeline Builder Agent（时间线构建）
- [x] Style Imitator Agent（文风仿写）
- [x] Fact Verifier Agent（事实验证）
- [x] Preprocessor Agent（用户画像生成）
- [x] MemoirArchitect Agent（大纲生成）
- [x] MemoirWriter Agent（回忆录撰写）
- [x] LLM 客户端（Ollama 集成）
- [x] 数据持久化（SQLite + JSON）
- [x] Web API（Express + SSE）
- [x] Web 界面（响应式设计）
- [x] 章节管理（CRUD + 版本历史）
- [x] 用户认证（注册/登录/会话）
- [x] 错误处理（统一格式）
- [x] LLM 缓存（性能优化）

### Phase 2: 增强功能

- [ ] 照片识别与时间线关联
- [ ] 多用户支持与权限管理
- [ ] 语音输入支持
- [ ] 回忆录全文搜索
- [ ] AI 辅助润色
- [ ] 协作编辑功能

### Phase 3: 优化

- [ ] 更多本地模型支持
- [ ] 离线模式增强
- [ ] 性能监控与优化
- [ ] 国际化支持

---

## 开发指南

### 运行测试

```bash
# 运行所有测试
pnpm test

# 监听模式
pnpm test:watch

# 覆盖率报告
pnpm test:coverage
```

### 代码风格

```bash
# 类型检查
pnpm type-check

# 构建
pnpm build
```

### 添加新 Agent

1. 在 `packages/core/src/agents/` 创建新文件
2. 继承 `BaseAgent` 类
3. 实现 `execute()` 方法
4. 在 `server/index.ts` 中注册 API 端点

---

## License

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 贡献

欢迎提交 Issue 和 Pull Request！

---

## 致谢

- Ollama - 本地大模型运行平台
- Express.js - Web 框架
- Zod - TypeScript 优先的模式验证
- Winston - 日志框架
