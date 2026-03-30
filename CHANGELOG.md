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

### Changed
- **安全升级**: 密码哈希从 SHA-256 升级到 bcrypt（12 轮）
  - 移除单独的 salt 字段（bcrypt 内嵌盐值）
  - 更新 `AuthManager` 方法为异步以支持 bcrypt
  - 更新 `user_accounts` 表结构（移除 `salt` 列）

### Fixed
- **Critical**: 修复 `/api/user/find-or-create` 竞态条件（TOCTOU 漏洞）
  - 用直接 agent 调用替代自调用 API
- **Critical**: userId 添加随机性（添加十六进制后缀）防止预测
- **Critical**: 为 LLM 输出添加 Zod 验证（`/api/preprocess`, `/api/memoir/outline`, `/api/memoir/write`）
- **Informational**: PORT 硬编码移至 DEFAULT_PORT 常量并添加 parseInt 验证
- **Informational**: LLM 超时配置添加 NaN 验证
- **Informational**: LLM 客户端用 proper logger 替换 console.warn
- **Informational**: 文件清理失败添加日志记录
- **Informational**: `/api/user/find-or-create` 改用直接 agent 调用而非自获取

### Security
- bcrypt 密码哈希（12 轮）替代 SHA-256
- 密码重置令牌（1 小时过期，单次使用）
- 用户标识符添加随机性防止预测

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
