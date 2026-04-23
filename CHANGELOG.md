# Changelog

All notable changes to MemoirOS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 密码重置功能
  - `/api/auth/forgot-password` 端点 - 请求密码重置令牌
  - `/api/auth/reset-password` 端点 - 使用令牌重置密码
  - `password_reset_tokens` 数据库表
  - `AuthManager.requestPasswordReset()` 和 `AuthManager.resetPassword()` 方法
  - `AuthManager.cleanupExpiredTokens()` 维护方法

---

## [0.2.0-beta.4] - 2026-04-23

### Added
- **多用户支持与权限管理** - 完整的协作功能
  - 用户角色系统（admin, editor, viewer）
  - 权限管理（role-based access control）
  - 回忆录共享功能（邀请、接受、撤销）
  - 批量权限检查 API

### 新增 API 端点
- **用户角色管理**
  - `POST /api/multi-user/roles/set` - 设置用户角色
  - `GET /api/multi-user/users` - 列出所有用户（管理员）
  - `GET /api/multi-user/role` - 获取当前用户角色

- **权限检查**
  - `POST /api/multi-user/permissions/check` - 单个权限检查
  - `POST /api/multi-user/permissions/batch-check` - 批量权限检查

- **回忆录共享**
  - `POST /api/multi-user/share` - 创建共享邀请
  - `POST /api/multi-user/share/respond` - 响应共享请求
  - `GET /api/multi-user/shared-memoirs` - 用户共享回忆录列表
  - `GET /api/multi-user/memoir/:id/shares` - 回忆录共享用户列表

### 新增数据库表
- `user_roles` - 用户角色分配表
- `memoir_shares` - 回忆录共享关系表

### 新增核心模块
- `PermissionManager` 服务类 (`packages/core/src/storage/permissions.ts`)
  - 角色管理方法（getUserRole, setUserRole, listAllUsers）
  - 权限检查方法（checkPermission with cascade）
  - 共享请求管理（createShareRequest, respondToShare）
  - 用户共享回忆录列表（getUserSharedMemoirs, getMemoirShares）

### 新增前端功能
- 协作权限 UI（`web/js/ui/permissions.js`）
  - 用户角色管理面板
  - 共享回忆录列表
  - 待处理邀请列表
  - 权限指示器（角色徽章）

### Changed
- 路由注册优化（中间件顺序、错误处理位置）

### Fixed
- **Critical**: 修复 `/api/multi-user/shared-memoirs` 端点
  - 问题：旧 Node.js 进程占用端口导致代码更改不生效
  - 解决：文档化调试流程（端口检查、进程终止）

### Technical Details
- 数据模型：Zod schemas（UserRoleSchema, memoirShareSchema, PermissionCheck）
- 权限中间件：createRequireAuthMiddleware, createRequireRoleMiddleware, createRequirePermissionMiddleware
- 索引优化：user_roles(user_id, role), memoir_shares(memoir_id, shared_with_user_id)

---

## [0.2.0-beta.3] - 2026-04-22

### Added
- 全文搜索功能（FTS5）
  - 搜索 API 端点 `/api/search`
  - 前端搜索 UI 和关键词高亮
- AI 辅助润色（6 种风格）
- 语音输入支持（Web Speech API）
- 密码重置前端 UI
- 润色预览 UI

### Changed
- **安全升级**: 密码哈希从 SHA-256 升级到 bcrypt（12 轮）
  - 移除单独的 salt 字段（bcrypt 内嵌盐值）
  - 更新 `AuthManager` 方法为异步以支持 bcrypt

### Fixed
- **Critical**: 修复 `/api/user/find-or-create` 竞态条件（TOCTOU 漏洞）
- **Critical**: userId 添加随机性（添加十六进制后缀）防止预测
- **Critical**: 为 LLM 输出添加 Zod 验证
- TypeScript 编译错误修复

---

## [0.2.0-beta.2] - 2026-04-22

### Added
- 代码重构（48 个模块化文件，9286 行）
  - server/index.ts 拆分为 11 个路由模块
  - preprocessor.ts 拆分为 5 个模块
  - interviewer.ts 拆分为 6 个模块
  - timeline-builder.ts 拆分为 6 个模块
  - chapter-manager.ts 拆分为 10 个模块
  - database.ts 拆分为 9 个 Repository Pattern 仓库

### Fixed
- **Critical**: 修复 tsx 缓存问题（密码重置功能）
- **Critical**: UUID 验证兼容性问题
- TypeScript 编译通过

---

## [0.2.0-beta.1] - 2026-03-30

---

## [0.2.0-beta.1] - 2026-03-30

### Added
- Interviewer Agent - 8 阶段引导式采访系统
- Timeline Builder Agent - 时间线构建与冲突检测
- Fact Verifier Agent - 事实验证与时代背景检查
- Style Imitator Agent - 文风分析与仿写
- Preprocessor Agent - 用户画像生成
- MemoirArchitect Agent - 回忆录大纲生成
- MemoirWriter Agent - 回忆录章节撰写
- Ollama LLM 客户端集成
- Express API 服务器
- Web 界面
- Zod 数据验证

### Known Issues
- LLM 响应质量依赖模型能力
- 事实验证需要网络连接

---

## [0.1.0] - 2026-03-15

### Added
- 项目初始化
- 基础 Agent 框架
- LLM 客户端接口
- JSON 文件存储

---

## 版本说明

### [Unreleased]
正在开发中的功能，将包含在下一个版本中。

### [0.2.0-beta.1]
第一个公开测试版本，包含所有核心功能。

### [0.1.0]
初始版本，包含基础框架。

---

## 变更类型说明

- **Added**: 新增功能
- **Changed**: 功能变更
- **Deprecated**: 即将废弃的功能
- **Removed**: 已删除的功能
- **Fixed**: Bug 修复
- **Security**: 安全相关修复
