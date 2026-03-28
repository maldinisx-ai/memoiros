/**
 * LLM Provider Interface
 */

export interface LLMClient {
  readonly provider: string;
  chat(messages: ReadonlyArray<LLMMessage>, options?: ChatOptions): Promise<LLMResponse>;
}

export interface LLMMessage {
  readonly role: "system" | "user" | "assistant";
  readonly content: string;
}

export interface ChatOptions {
  readonly temperature?: number;
  readonly maxTokens?: number;
}

export interface LLMResponse {
  readonly content: string;
  readonly usage?: {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
  };
}

/**
 * Mock LLM Client for testing
 */
export class MockLLMClient implements LLMClient {
  readonly provider = "mock";

  async chat(
    messages: ReadonlyArray<LLMMessage>,
    _options?: ChatOptions
  ): Promise<LLMResponse> {
    // Simple mock: return a JSON response based on the last user message
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user");

    if (lastUserMessage?.content.includes("1985") && lastUserMessage?.content.includes("交粮")) {
      return {
        content: JSON.stringify({
          status: "PASS",
          summary: "农业税（公粮）于2006年取消，1985年出生的童年（1990年代初）确实需要交粮",
          confidence: 0.95,
          issues: [],
          suggestions: [],
        }),
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      };
    }

    if (lastUserMessage?.content.includes("2010") && lastUserMessage?.content.includes("iPhone 5")) {
      return {
        content: JSON.stringify({
          status: "FAIL",
          summary: "iPhone 5于2012年发布，2010年不存在",
          confidence: 0.98,
          issues: [
            {
              severity: "critical",
              category: "timeline",
              description: "iPhone 5于2012年9月发布",
              suggestion: "改为iPhone 4或改为2012年",
            },
          ],
          suggestions: ["将iPhone 5改为iPhone 4", "将时间改为2012年"],
        }),
        usage: { promptTokens: 100, completionTokens: 80, totalTokens: 180 },
      };
    }

    if (lastUserMessage?.content.includes("2020") && lastUserMessage?.content.includes("武汉")) {
      return {
        content: JSON.stringify({
          status: "WARNING",
          summary: "2020年1月23日武汉封城，春节聚餐需要补充疫情背景",
          confidence: 0.9,
          issues: [
            {
              severity: "warning",
              category: "era_context",
              description: "武汉于2020年1月23日封城，春节（1月25日）期间封控严格",
              suggestion: "添加疫情背景说明或调整时间",
            },
          ],
          suggestions: ["说明这是封城前的聚餐", "调整为其他年份的春节"],
        }),
        usage: { promptTokens: 100, completionTokens: 90, totalTokens: 190 },
      };
    }

    // Default response
    return {
      content: JSON.stringify({
        status: "PASS",
        summary: "基于常识判断，此陈述合理",
        confidence: 0.7,
        issues: [],
        suggestions: [],
      }),
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
    };
  }
}
