# Release Notes - v0.2.0-beta.2

## 发布日期
2026-03-30

## 概述
v0.2.0-beta.2 是一个重要的安全更新版本，主要包含密码哈希算法升级和密码重置功能，以及多项代码审查问题的修复。

---

## 🔒 安全更新

### 密码哈希升级
- **从 SHA-256 升级到 bcrypt（12 轮）**
  - 移除单独的 salt 字段（bcrypt 内嵌盐值）
  - 更好的密码保护，抵御彩虹表攻击
  - 符合现代安全最佳实践

### 密码重置功能
- **新增 API 端点**
  - `POST /api/auth/forgot-password` - 请求密码重置令牌
  - `POST /api/auth/reset-password` - 使用令牌重置密码
- **数据库变更**
  - 新增 `password_reset_tokens` 表
  - 令牌有效期：1 小时
  - 令牌单次使用后自动失效

---

## 🐛 Bug 修复

### Critical 问题修复
1. **竞态条件修复** (`server/index.ts:1229-1246`)
   - 修复 `/api/user/find-or-create` 的 TOCTOU 漏洞
   - 用直接 agent 调用替代自调用 API

2. **LLM 输出验证** (`server/index.ts:404-409`)
   - 为 `/api/preprocess`, `/api/memoir/outline`, `/api/memoir/write` 添加 Zod 验证
   - 防止类型断言绕过验证

3. **用户ID 可预测性修复** (`server/index.ts:1210`)
   - 添加随机十六进制后缀，防止用户ID被预测

### Informational 问题修复
4. **PORT 配置** - 移至 `DEFAULT_PORT` 常量并添加验证
5. **LLM 超时配置** - 添加 NaN 验证
6. **日志改进** - LLM 客户端使用 proper logger 替代 console.warn
7. **错误处理** - 文件清理失败添加日志记录
8. **API 优化** - `/api/user/find-or-create` 使用直接 agent 调用

---

## 📦 技术细节

### 数据库 Schema 变更
```sql
-- 新增表
CREATE TABLE password_reset_tokens (
  token_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user_accounts(user_id) ON DELETE CASCADE
);

-- 表结构变更
ALTER TABLE user_accounts DROP COLUMN salt;
-- bcrypt hash includes embedded salt, no separate salt column needed
```

### API 变更

#### 新增端点
```
POST /api/auth/forgot-password
Body: { "identifier": "username/email/phone" }
Response: { "success": true, "message": "...", "resetToken": "..." (dev only) }

POST /api/auth/reset-password
Body: { "token": "reset-token", "newPassword": "new-password" }
Response: { "success": true, "message": "Password reset successfully" }
```

### 依赖更新
```json
{
  "bcrypt": "^6.0.0",
  "@types/bcrypt": "^6.0.0"
}
```

---

## ⚠️ 重要提示

### 现有用户迁移
由于密码哈希算法从 SHA-256 升级到 bcrypt：
- **现有用户的密码无法直接使用**
- 用户需要使用"忘记密码"功能重置密码
- 或在开发环境中重新注册

### 测试状态
- TypeScript 编译：✅ 通过
- Jest 测试：⚠️ 配置待修复（ES Module 兼容性）
- 手动测试：✅ 登录/注册功能验证通过

---

## 🔄 升级指南

### 开发环境
```bash
# 1. 拉取最新代码
git pull origin main

# 2. 安装依赖
pnpm install

# 3. 重新构建
pnpm build

# 4. 启动服务器
npm run server
```

### 现有用户密码重置流程
1. 用户使用"忘记密码"功能
2. 输入用户名/邮箱/手机号
3. 获取重置令牌（开发环境直接返回，生产环境通过邮件发送）
4. 使用令牌设置新密码
5. 使用新密码登录

---

## 📝 完整变更日志

详见 [CHANGELOG.md](./CHANGELOG.md)

---

## 🔗 相关链接

- **v0.2.0-beta.1**: [2026-03-30] - 第一个公开测试版本
- **v0.1.0**: [2026-03-15] - 初始版本
