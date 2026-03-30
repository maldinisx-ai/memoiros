# MemoirOS v0.2.0-beta.1 Release Notes

发布日期: 2026-03-30

---

## 🎉 重要公告

MemoirOS 第一个公开测试版本现已发布！这是一个功能完整的智能回忆录写作系统，使用本地大模型帮助用户创作个人回忆录。

**⚠️ 测试版本说明**: 这是一个 Beta 测试版本，功能基本完整但可能存在 Bug。欢迎反馈问题和建议。

---

## ✨ 新增功能

### 🤖 多智能体系统

完整实现了 7 个专用 Agent，协同完成回忆录创作：

1. **Interviewer Agent** - 8 阶段引导式采访
   - warmup（热身）
   - childhood（童年）
   - education（教育）
   - career（职业）
   - family（家庭）
   - milestones（大事）
   - reflections（回顾）
   - closing（收尾）

2. **Timeline Builder Agent** - 智能时间线构建
   - 自动提取和排序事件
   - 时间冲突检测
   - 时间缺口识别

3. **Fact Verifier Agent** - 事实验证
   - 历史事实核查
   - 时代背景匹配
   - 逻辑一致性检查

4. **Style Imitator Agent** - 文风仿写
   - 句子结构分析
   - 词汇偏好学习
   - 情感基调识别

5. **Preprocessor Agent** - 用户画像生成
   - 整合所有提取信息
   - 生成结构化画像
   - 提供改进建议

6. **MemoirArchitect Agent** - 大纲生成
   - 自动确定最佳结构
   - 章节划分
   - 字数预估

7. **MemoirWriter Agent** - 章节撰写
   - 遵循用户文风
   - 确保事实准确
   - 去 AI 痕迹处理

### 👤 用户系统

- 用户注册/登录
- 会话管理
- 密码修改
- 多设备会话管理

### 📚 章节管理

- 章节创建、读取、更新、删除
- 章节草稿保存
- 版本历史
- 版本恢复
- 章节发布/归档
- 全文搜索

### 📄 导出功能

- Markdown 导出
- PDF 导出
- 单章节/完整回忆录导出

### 🌊 流式响应

- SSE (Server-Sent Events) 支持
- 实时展示生成内容
- 改善用户体验

### 🎨 Web 界面

- 响应式设计
- 移动端适配
- 加载状态指示
- Toast 通知
- 自动保存草稿

### 🔧 技术改进

- 统一错误处理
- Winston 日志系统
- LLM 响应缓存
- SQLite + JSON 混合存储
- Zod 数据验证

---

## 📋 系统要求

### 必需

- **Node.js**: 20.0.0 或更高
- **pnpm**: 最新版本
- **Ollama**: 用于本地 LLM

### 推荐模型

- **qwen3:8b** - 中文效果好（推荐）
- **llama3.2** - 英文效果好
- **qwen2.5:7b** - 轻量级选择

---

## 🚀 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/your-repo/memoiros.git
cd memoiros

# 2. 安装依赖
pnpm install

# 3. 下载模型
ollama pull qwen3:8b

# 4. 启动服务
pnpm server

# 5. 打开浏览器
# http://localhost:3000
```

详细安装指南请参考 [README.md](../README.md)

---

## 📖 API 文档

完整的 API 文档请参考:

- [README.md - API 文档部分](../README.md#api-文档)
- `/docs/API.md` (待补充)

---

## 🔍 已知问题

1. **LLM 响应质量**
   - 响应质量取决于所选模型能力
   - 建议使用 qwen3:8b 获得最佳中文效果

2. **事实验证需要网络**
   - 事实验证功能需要网络连接
   - 其他功能可离线使用

3. **性能**
   - 首次 LLM 调用可能较慢
   - 后续调用会使用缓存加速

---

## 🐛 Bug 反馈

发现问题请在 [GitHub Issues](https://github.com/your-repo/memoiros/issues) 提交。

反馈时请包含：
- 复现步骤
- 预期行为
- 实际行为
- 系统环境信息

---

## 📚 文档

- [README.md](../README.md) - 项目说明
- [CHANGELOG.md](../CHANGELOG.md) - 变更日志
- [VERSION-PLANNING.md](./VERSION-PLANNING.md) - 版本规划
- [examples/](../examples/) - 示例数据

---

## 🙏 致谢

感谢以下开源项目：

- [Ollama](https://ollama.ai/) - 本地 LLM 运行平台
- [Express.js](https://expressjs.com/) - Web 框架
- [Zod](https://zod.dev/) - TypeScript 优先的模式验证
- [Winston](https://github.com/winstonjs/winston) - 日志框架
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - SQLite 数据库

---

## 📄 许可证

MIT License - 详见 [LICENSE](../LICENSE) 文件

---

## 🔮 下一步

v0.3.0-beta.2 计划包含：

- [ ] 章节全文搜索
- [ ] 草稿自动保存
- [ ] 多语言支持
- [ ] 模板系统
- [ ] 性能优化

敬请期待！

---

**MemoirOS 团队**
2026年3月30日
