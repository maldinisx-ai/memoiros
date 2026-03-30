/**
 * Sliding Window Context Manager
 *
 * Implements a sliding window with summary chain for long conversations.
 * Per PRD requirements: 滑动窗口 + 摘要链
 *
 * - Keeps recent N messages in full context
 * - Summarizes older messages into compact summaries
 * - Maintains chain of summaries for full conversation history
 */

import type { LLMMessage } from "../agents/base.js";

export interface ContextSummary {
  readonly id: string;
  readonly timestamp: number;
  readonly messageCount: number;
  readonly summary: string;
  readonly keyTopics: readonly string[];
}

export interface ContextWindow {
  readonly messages: ReadonlyArray<LLMMessage>;
  readonly summaries: ReadonlyArray<ContextSummary>;
  readonly totalMessageCount: number;
}

export interface ContextManagerConfig {
  readonly windowSize?: number;
  readonly summaryThreshold?: number;
  readonly maxSummaries?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  windowSize: 10, // Keep last 10 messages in full
  summaryThreshold: 15, // Start summarizing after 15 messages
  maxSummaries: 5, // Keep last 5 summaries
} as const;

/**
 * Context Manager Class
 *
 * Manages conversation context with sliding window and summary chain.
 */
export class ContextManager {
  private messages: LLMMessage[] = [];
  private summaries: ContextSummary[] = [];
  private readonly config: Required<ContextManagerConfig>;

  constructor(config: ContextManagerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Add a message to the context
   *
   * Automatically manages sliding window and creates summaries when needed.
   */
  addMessage(message: LLMMessage): void {
    this.messages.push(message);

    // Check if we need to create a summary
    if (this.messages.length > this.config.summaryThreshold) {
      this.createSummary();
    }
  }

  /**
   * Get the current context window
   *
   * Returns recent messages + summary chain for full context.
   */
  getContext(): ContextWindow {
    // Get recent messages within window size
    const recentMessages = this.messages.slice(-this.config.windowSize);

    // Get recent summaries
    const recentSummaries = this.summaries.slice(-this.config.maxSummaries);

    return {
      messages: recentMessages,
      summaries: recentSummaries,
      totalMessageCount: this.messages.length,
    };
  }

  /**
   * Build messages for LLM with summary context
   *
   * Combines summaries (as system messages) + recent messages.
   */
  buildLLMMessages(systemPrompt: string): LLMMessage[] {
    const context = this.getContext();

    const messages: LLMMessage[] = [{ role: "system", content: systemPrompt }];

    // Add summaries as context (from oldest to newest)
    for (const summary of context.summaries) {
      messages.push({
        role: "system",
        content: `[Summary of previous conversation]: ${summary.summary}\n\nKey topics: ${summary.keyTopics.join(", ")}`,
      });
    }

    // Add recent messages
    messages.push(...context.messages);

    return messages;
  }

  /**
   * Create a summary of older messages
   *
   * This is a placeholder - actual summarization would be done by an LLM.
   * In production, this would call the LLM to generate a proper summary.
   */
  private createSummary(): void {
    // Messages to summarize (those outside the window)
    const messagesToSummarize = this.messages.slice(
      0,
      this.messages.length - this.config.windowSize
    );

    if (messagesToSummarize.length === 0) {
      return;
    }

    // For now, create a simple summary
    // In production, this would call the LLM
    const summary = this.generateSimpleSummary(messagesToSummarize);

    const contextSummary: ContextSummary = {
      id: `summary_${Date.now()}`,
      timestamp: Date.now(),
      messageCount: messagesToSummarize.length,
      summary: summary.text,
      keyTopics: summary.topics,
    };

    this.summaries.push(contextSummary);

    // Remove summarized messages from the main array
    this.messages = this.messages.slice(-this.config.windowSize);
  }

  /**
   * Generate a simple summary (placeholder)
   *
   * In production, this would use an LLM to generate a proper summary.
   */
  private generateSimpleSummary(messages: ReadonlyArray<LLMMessage>): {
    readonly text: string;
    readonly topics: readonly string[];
  } {
    // Extract user messages for topics
    const userMessages = messages.filter(m => m.role === "user");
    const topics = this.extractTopics(userMessages);

    // Simple summary text
    const text = `Conversation covered ${messages.length} exchanges. ` +
      `Discussed topics including: ${topics.join(", ")}. ` +
      `Started with ${userMessages[0]?.content.slice(0, 50) || "various topics"}...`;

    return { text, topics };
  }

  /**
   * Extract key topics from messages
   *
   * Simple heuristic-based topic extraction.
   * In production, this would use NLP or LLM-based extraction.
   */
  private extractTopics(messages: ReadonlyArray<LLMMessage>): readonly string[] {
    const topics = new Set<string>();

    // Simple keyword-based topic extraction
    const keywords = [
      "童年", "教育", "职业", "家庭", "家乡",
      "学校", "工作", "父母", "兄弟姐妹", "朋友",
      "结婚", "子女", "退休", "爱好", "旅行",
    ];

    for (const message of messages) {
      const content = message.content;
      for (const keyword of keywords) {
        if (content.includes(keyword)) {
          topics.add(keyword);
        }
      }
    }

    return Array.from(topics).slice(0, 5);
  }

  /**
   * Get statistics about the context
   */
  getStats(): {
    readonly totalMessages: number;
    readonly currentWindow: number;
    readonly summaryCount: number;
    readonly compressionRatio: number;
  } {
    const summarizedMessages = this.summaries.reduce(
      (sum, s) => sum + s.messageCount,
      0
    );

    return {
      totalMessages: this.messages.length + summarizedMessages,
      currentWindow: this.messages.length,
      summaryCount: this.summaries.length,
      compressionRatio: summarizedMessages > 0
        ? summarizedMessages / (this.summaries.length * 200) // Approximate
        : 1,
    };
  }

  /**
   * Reset the context
   */
  reset(): void {
    this.messages = [];
    this.summaries = [];
  }

  /**
   * Export context state
   */
  export(): {
    readonly messages: ReadonlyArray<LLMMessage>;
    readonly summaries: ReadonlyArray<ContextSummary>;
  } {
    return {
      messages: [...this.messages],
      summaries: [...this.summaries],
    };
  }

  /**
   * Import context state
   */
  import(data: {
    readonly messages: ReadonlyArray<LLMMessage>;
    readonly summaries: ReadonlyArray<ContextSummary>;
  }): void {
    this.messages = [...data.messages];
    this.summaries = [...data.summaries];
  }
}

/**
 * Create a context manager instance
 */
export function createContextManager(
  config?: ContextManagerConfig
): ContextManager {
  return new ContextManager(config);
}
