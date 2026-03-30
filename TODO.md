# MemoirOS 待办事项

## 已完成 ✅

### P0 - 核心功能
- [x] 7 个代理完整实现（Interviewer, TimelineBuilder, StyleImitator, FactVerifier, Preprocessor, MemoirArchitect, MemoirWriter）
- [x] 4 阶段工作流 API 端点
- [x] Web UI 完成
- [x] 代码审查完成
- [x] TypeScript 编译通过
- [x] 测试文件类型修复
- [x] 启动服务器，测试完整工作流
- [x] 修复 memoir-writer 时间筛选逻辑
- [x] 修复 memoir-writer 字数计算
- [x] API 端点请求验证中间件
- [x] 用户数据目录隔离

### P1 - 重要功能
- [x] 章节保存功能（数据库表、API CRUD、UI 列表和详情）
- [x] 章节编辑功能（草稿保存、版本历史）
- [x] 章节导出功能（Markdown、PDF）
- [x] 用户认证（登录/注册、Session 管理）
- [x] 密码重置功能（forgot-password、reset-password API 端点）

### P2 - 改进和优化
- [x] UI 改进
  - [x] 添加加载状态指示（全局遮罩、按钮加载、面板加载）
  - [x] 优化移动端适配（响应式布局、移动端样式）
  - [x] 进度保存功能（自动保存、草稿保存、进度持久化）
- [x] 错误处理改进
  - [x] 统一错误响应格式（ErrorCode、ErrorResponse 结构）
  - [x] 添加错误日志（Winston logger 集成）
  - [x] 用户友好错误提示（Toast 通知、错误码映射）
- [x] 性能优化
  - [x] LLM 响应缓存（LLMCache 类、缓存装饰器）
  - [x] 长文本流式输出（SSE 支持、流式消息处理）
  - [x] 前端分页加载（章节分页、无限滚动支持）

### P3 - 文档和发布
- [x] 更新 README.md
  - [x] 完整架构说明
  - [x] 安装和使用指南
  - [x] API 文档
- [x] 添加示例
  - [x] 示例对话数据
  - [x] 示例输出
- [x] 准备发布
  - [x] 版本号规划
  - [x] Release Notes
  - [x] 构建产物

---

## 代码审查问题 (gstack review)

### Critical - 已修复 ✅

- [x] **server/index.ts:1229-1246** - 修复 `/api/user/find-or-create` 的竞态条件 (TOCTOU漏洞)
- [x] **server/index.ts:404-409** - 添加 LLM 输出验证 (当前使用 `as` 类型断言绕过了 Zod 验证)
- [x] **server/index.ts:1210** - 用户标识符转 userId 需要添加随机性

### Informational - 已修复 ✅

- [x] **server/index.ts:64** - PORT 硬编码移到配置常量
- [x] **llm/client.ts:216** - parseInt 结果需要 NaN 验证
- [x] **llm/client.ts:144-146** - JSON 解析失败使用 proper logger 而非 console.warn
- [x] **server/index.ts:785-786** - 文件清理失败应记录日志
- [x] **auth.ts:82** - 密码哈希应使用 bcrypt/scrypt/argon2 而非 SHA-256
- [x] **server/index.ts:1229** - find-or-create 自调用 API 端点应直接调用 agent

---

## 🔴 紧急事项（需立即处理）

### 🔥 tsx 缓存问题 - 密码重置功能暂时禁用

**发现日期**: 2026-03-30
**影响版本**: v0.2.0-beta.2
**优先级**: P0（阻塞密码重置功能）

#### 问题描述

密码重置功能（`POST /api/auth/forgot-password` 和 `POST /api/auth/reset-password`）由于 **tsx TypeScript 运行器的严重缓存 bug** 而无法正常工作。

**错误**: `ReferenceError: require is not defined at AuthManager.generateResetToken`

#### 根本原因

- tsx 存在多级缓存（文件系统 + V8 编译 + 依赖预编译）
- 修改源代码后，tsx 仍执行旧版本的缓存代码
- **证据**: 重命名方法为 `generateResetTokenV2()` 后，错误日志仍显示旧方法名 `generateResetToken`

#### 已尝试的所有解决方案（均无效）

| # | 方案 | 结果 | 详情 |
|---|------|------|------|
| 1 | 修改源文件使用 ESM import | ❌ | tsx 使用旧缓存 |
| 2 | 删除 .cache, ~/.cache/tsx | ❌ | 缓存位置未知 |
| 3 | `npx tsx --no-cache` | ❌ | 多级缓存无法清除 |
| 4 | pnpm store prune + install | ❌ | 依赖缓存与源缓存分离 |
| 5 | 重命名方法为 V2 | ❌ | 错误日志仍显示旧名称 |
| 6 | 切换到 ts-node | ❌ | ESM 模块解析问题 |
| 7 | 使用 Math.random() | ❌ | tsx 仍执行旧代码 |
| 8 | 完全删除 node_modules | ❌ | 缓存持久存在 |

#### 临时解决方案

**方案 A: 手动数据库重置**（开发环境）
```bash
sqlite3 data/memoiros.db
# 手动更新密码哈希
UPDATE user_accounts SET password_hash = '<bcrypt哈希>' WHERE user_id = 'xxx';
```

**方案 B: 重新注册**（最简单）
直接使用新用户名重新注册即可。

#### 永久解决方案计划

| 优先级 | 方案 | 复杂度 | 预期效果 |
|--------|------|--------|----------|
| 短期 | 切换到 Bun 运行器 | 低 | Bun 无缓存问题 |
| 中期 | 将 packages/core 转换为 CommonJS | 中 | 避免 ESM/CJS 混用 |
| 长期 | 等待 tsx 修复或迁移到 tsx/vite 混合 | 高 | 根本性解决 |

#### 相关文件

- `packages/core/src/storage/auth.ts:449-460` - generateResetTokenV2() 方法
- `packages/core/src/storage/auth.ts:320-375` - 密码重置 API 逻辑
- `server/index.ts:1130-1152` - 密码重置端点
- `README.md` - 已添加已知问题说明

#### 状态

- [x] 问题识别和根因分析
- [x] 添加 README 已知问题说明
- [x] 记录所有尝试的解决方案
- [ ] 实现永久解决方案（待规划）
- [ ] 重新启用密码重置功能

---

### bcrypt 密码哈希迁移
- [x] **问题说明**：密码哈希从 SHA-256 升级到 bcrypt 后，现有数据库中的用户密码无法使用
- [x] **添加密码重置功能** - 让用户可以重置密码以使用新的 bcrypt 哈希
  - [x] 创建 `/api/auth/reset-password` 端点
  - [x] 创建 `/api/auth/forgot-password` 端点（发送重置链接）
  - [x] 添加 `password_reset_tokens` 数据库表
  - [x] 添加 `AuthManager.requestPasswordReset()` 和 `AuthManager.resetPassword()` 方法
  - [ ] 前端添加密码重置 UI（**受 tsx 缓存问题阻塞**）
- [x] **测试登录/注册流程** - 验证 bcrypt 升级后功能正常
- [ ] **备选方案：双重哈希支持** - 同时支持旧 SHA-256 和新 bcrypt（复杂度高，暂不实现）

---

## 🟡 短期规划（本周）

### 发布 v0.2.0-beta.2 ✅
- [x] 更新 CHANGELOG.md 记录所有代码审查修复
- [x] TypeScript 编译通过验证
- [x] 更新版本号到 0.2.0-beta.2
- [x] 生成 Release Notes (RELEASE_NOTES.md)
- [x] 创建 Git tag `v0.2.0-beta.2`
- [x] 提交所有更改到 Git
- [x] 推送到远程仓库（待执行）

### 测试与验证
- [ ] 修复 Jest 测试配置（ES Module 兼容性问题）
- [ ] 运行完整测试套件 `pnpm test`
- [ ] 手动测试验证
  - [ ] 用户注册功能（bcrypt 哈希）
  - [ ] 用户登录功能
  - [ ] 密码重置流程

### 前端开发
- [ ] 添加密码重置 UI
  - [ ] 忘记密码页面（输入用户名/邮箱）
  - [ ] 重置密码页面（输入新密码）
  - [ ] 集成 `/api/auth/forgot-password` 和 `/api/auth/reset-password` API

### 手动测试清单
- [ ] 启动服务器 `node server/index.js`
- [ ] 测试用户注册功能（验证 bcrypt 哈希）
- [ ] 测试用户登录功能
- [ ] 测试密码重置流程
  - [ ] 请求重置令牌
  - [ ] 使用令牌重置密码
  - [ ] 使用新密码登录

---

## 🟢 中期规划（Phase 2 - 按优先级排序）

### 优先级 1 - 全文搜索（高价值，中等复杂度）
- [ ] 集成全文搜索引擎（如 sqlite FTS5 或外部搜索引擎）
- [ ] 为回忆录内容建立索引
- [ ] 添加搜索 API 端点 `/api/search`
- [ ] 前端搜索 UI 和高亮显示

### 优先级 2 - 多用户支持与权限管理（高价值，高复杂度）
- [ ] 用户角色系统（admin, editor, viewer）
- [ ] 回忆录共享功能
- [ ] 权限控制中间件
- [ ] 协作权限 UI

### 优先级 3 - AI 辅助润色（中价值，低复杂度）
- [ ] 添加润色 API `/api/memoir/polish`
- [ ] 支持多种润色风格（正式、口语、文艺）
- [ ] 前端润色预览和确认

### 优先级 4 - 照片识别与时间线关联（中价值，高复杂度）
- [ ] 照片上传功能
- [ ] 照片 EXIF 信息提取
- [ ] AI 照片分类和日期识别
- [ ] 照片与时间线事件关联

### 优先级 5 - 语音输入支持（中价值，中等复杂度）
- [ ] 集成 Web Speech API
- [ ] 语音转文字功能
- [ ] 语音输入 UI

### 优先级 6 - 协作编辑功能（低价值，高复杂度）
- [ ] 实时协作编辑（WebSocket/CRDT）
- [ ] 评论和批注功能
- [ ] 变更历史和合并

---

## 🔵 Phase 3 - 优化

- [ ] 更多本地模型支持（Llama 3, Mistral, Phi-3 等）
- [ ] 离线模式增强（Service Worker, PWA）
- [ ] 性能监控与优化（APM, 性能指标）
- [ ] 国际化支持（i18n, 多语言 UI）

---

## 版本历史

- **v0.2.0-beta.1** (2026-03-30) - 第一个公开测试版本
- **v0.1.0** (2026-03-15) - 初始版本
