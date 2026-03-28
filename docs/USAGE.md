# MemoirOS 使用示例

## 快速测试

```bash
cd D:/projects/memoiros
pnpm install
pnpm run test:verify
```

## 编程方式使用

```typescript
import { FactVerifierAgent } from "@memorios/core";

// 创建 Agent 上下文
const ctx = {
  client: yourLLMClient,  // OpenAI/Anthropic/etc.
  model: "gpt-4",
  projectRoot: "/path/to/project",
  logger: console,
};

// 创建 Fact Verifier Agent
const verifier = new FactVerifierAgent(ctx);

// 验证一个陈述
const result = await verifier.verify({
  fact: "我1985年出生，小时候要和爸妈去镇上交粮",
  context: {
    birthYear: 1985,
    location: "中国农村",
  },
  options: {
    strictness: "normal",
    enableWebVerification: true,
    maxSources: 3,
  },
});

// 查看结果
console.log(`状态: ${result.status}`);
console.log(`置信度: ${result.confidence}`);
console.log(`总结: ${result.summary}`);
console.log(`来源:`, result.sources);
console.log(`建议:`, result.suggestions);
```

## 验证结果说明

### 状态值

| 状态 | 含义 | 处理建议 |
|------|------|----------|
| `PASS` | 陈述与历史记录一致 | 可直接使用 |
| `WARNING` | 陈述可能有问题，需要补充背景 | 添加时代背景说明 |
| `FAIL` | 陈述与历史事实不符 | 需要修正 |

### 置信度

- `0.9 - 1.0`: 高度可信
- `0.7 - 0.9`: 较为可信
- `0.5 - 0.7`: 中等可信
- `0.0 - 0.5`: 低可信，需要人工核实

### 验证维度

| 维度 | 说明 |
|------|------|
| `timeline` | 时间线一致性检查 |
| `era_context` | 时代背景匹配检查 |
| `entity` | 人物/地点真实性检查 |
| `logic` | 常识逻辑检查 |
| `general` | 一般性问题 |

## 验证源

系统会自动从以下来源验证信息：

- **百度百科**: `https://baike.baidu.com/item/{关键词}`
- **维基百科**: `https://zh.wikipedia.org/wiki/{关键词}`
- **直接 URL**: 用户指定的特定来源

每个来源都有可靠性评分（0-1），系统会综合多个来源做出判断。

## 配置选项

```typescript
interface FactVerificationOptions {
  // 验证严格程度
  strictness?: "strict" | "normal" | "loose";

  // 是否启用网络验证（默认: true）
  enableWebVerification?: boolean;

  // 最大检查来源数量（默认: 3）
  maxSources?: number;
}
```

## 错误处理

```typescript
try {
  const result = await verifier.verify({
    fact: "用户陈述",
    options: {
      enableWebVerification: true,
    },
  });

  if (result.status === "FAIL") {
    console.error("验证失败:", result.issues);
  }
} catch (error) {
  console.error("验证过程出错:", error);
}
```
