# MemoirOS - 智能回忆录写作系统

> 基于 InkOS 多智能体架构，增加事实验证能力

## 项目简介

MemoirOS 是一个基于 [InkOS](https://github.com/Narcooo/inkos) 的回忆录写作系统，专门用于根据用户的口述/笔记生成真实、准确、有文采的回忆录。

### 核心特性

- ✅ **事实验证**: 通过网络验证历史事实、时间线、时代背景
- ✅ **时间线管理**: 自动梳理和验证事件时间顺序
- ✅ **文风仿写**: 学习用户的说话风格，保持一致性
- ✅ **情感追踪**: 标记每个时期的情绪和人生阶段
- ✅ **冲突提醒**: 检测时间逻辑冲突

### 与 InkOS 的区别

| 特性 | InkOS | MemoirOS |
|------|-------|----------|
| **作品类型** | 虚构小说 | 真实回忆录 |
| **事实核查** | ❌ 不需要 | ✅ 核心功能 |
| **时间线验证** | 松散 | 严格 |
| **Agent 数量** | 10 | 11（+Fact Verifier）|
| **创作方式** | 完全虚构 | 基于用户复述 |

---

## 11-Agent 架构

在 InkOS 的 10-Agent 基础上新增：

```
┌─────────────────────────────────────────────────────────────┐
│                    MemoirOS 管线                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Radar → Planner → Composer → Architect → Writer          │
│                                          ↓                 │
│                                   Fact Verifier ──┐        │
│                                          │                │
│                                     (联网验证)          │
│                                          │                │
│  Observer → Reflector → Normalizer → Auditor → Reviser    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 新增 Agent: Fact Verifier

**职责**: 验证用户复述的事件是否符合历史事实

**验证维度**:
- ⏰ 时间线一致性
- 🌍 历史大环境匹配
- 👤 人物/地点真实性
- 🧠 常识逻辑检查

**技术实现**: 基于 gstack browse（无头浏览器）

---

## 事实验证示例

### 示例 1: 时间线验证

```
用户输入: "我1985年出生，小时候要和爸妈去镇上交粮"
    ↓
Fact Verifier 验证
    ↓
✅ PASS - 农业税（公粮）2006年才取消，1985年出生的童年（1990年代初）确实需要交粮
```

### 示例 2: 时代背景验证

```
用户输入: "2020年春节我们在武汉吃年夜饭"
    ↓
Fact Verifier 验证
    ↓
⚠️ WARNING - 2020年1月23日武汉封城，春节聚餐可能需要添加疫情背景说明
```

---

## 项目结构

```
memoiros/
├── packages/
│   ├── core/              # 核心逻辑（从 InkOS 继承）
│   │   ├── agents/
│   │   │   ├── fact-verifier.ts    # 新增：事实验证 Agent
│   │   │   └── ...
│   │   └── types/
│├── story/                # 回忆录内容
│   ├── state/
│   │   ├── current_state.json
│   │   ├── timeline.json           # 新增：时间线
│   │   ├── fact_verifications.json # 新增：验证记录
│   │   └── ...
│   └── chapters/
├── interview/             # 采访对话记录
├── assets/
│   └── voice_samples.md   # 用户语音样本（文风学习）
└── docs/
    └── SPEC.md            # 项目规格说明
```

---

## 技术栈

- **继承**: InkOS 全部技术栈
  - TypeScript
  - Node.js 20+
  - pnpm
  - Zod
  - SQLite
- **新增**: gstack browse（事实验证）

---

## 快速开始

```bash
# 克隆项目
git clone https://github.com/your-repo/memoiros.git
cd memoiros

# 安装依赖
pnpm install

# 启动事实验证服务
pnpm run verify:fact

# 开始创作回忆录
pnpm run compose
```

---

## 配置选项

```json
{
  "factVerification": {
    "enabled": true,
    "strictness": "normal",
    "verifyHistorical": true,
    "apiProvider": "gstack_browse",
    "requireApproval": "WARNING"
  }
}
```

---

## 路线图

### Phase 1: 核心功能 ✅
- [x] 项目结构设计
- [x] 事实验证原型测试（已验证 gstack browse 可用）

### Phase 2: Agent 实现 ✅
- [x] Fact Verifier Agent（核心实现完成）
- [x] gstack browse 集成（BrowseClient）
- [x] 实体提取（年份、地点、事件）
- [x] 验证策略系统（targeted/era/general）
- [x] LLM + Browse 混合验证
- [ ] Interviewer Agent（引导式提问）
- [ ] Timeline Builder Agent

### Phase 3: 集成测试
- [ ] 完整管线测试
- [ ] 文风仿写测试

---

## 致谢

- [InkOS](https://github.com/Narcooo/inkos) - 核心多智能体架构
- [gstack](https://github.com/garryodd/gstack) - 事实验证能力

---

## License

MIT
