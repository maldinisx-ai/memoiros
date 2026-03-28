/**
 * Base Agent for MemoirOS
 * Simplified version for fact verification
 */

import type { Logger } from "../utils/logger.js";

export interface AgentContext {
  readonly client: LLMClient;
  readonly model: string;
  readonly projectRoot: string;
  readonly bookId?: string;
  readonly logger?: Logger;
  readonly onStreamProgress?: (progress: { readonly progress: number }) => void;
}

export interface LLMMessage {
  readonly role: "system" | "user" | "assistant";
  readonly content: string;
}

export interface LLMResponse {
  readonly content: string;
  readonly usage?: {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
  };
}

export interface LLMClient {
  readonly provider: string;
  chat(messages: ReadonlyArray<LLMMessage>, options?: { readonly temperature?: number; readonly maxTokens?: number }): Promise<LLMResponse>;
}

export abstract class BaseAgent {
  protected readonly ctx: AgentContext;

  constructor(ctx: AgentContext) {
    this.ctx = ctx;
  }

  protected get log() {
    return this.ctx.logger;
  }

  /**
   * Chat with LLM
   */
  protected async chat(
    messages: ReadonlyArray<LLMMessage>,
    options?: { readonly temperature?: number; readonly maxTokens?: number },
  ): Promise<LLMResponse> {
    // This should be implemented by concrete agents
    // For now, return a mock response
    return this.ctx.client.chat(messages, options);
  }

  abstract get name(): string;
}
