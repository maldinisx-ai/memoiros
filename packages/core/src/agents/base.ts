/**
 * Base Agent for MemoirOS
 * Simplified version for fact verification
 */

import type { Logger } from "../utils/logger.js";
import type { StreamCallback, StreamChunk } from "../llm/client.js";

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
  chatStream?(messages: ReadonlyArray<LLMMessage>, callback: StreamCallback, options?: { readonly temperature?: number; readonly maxTokens?: number }): Promise<{ readonly usage?: { readonly promptTokens: number; readonly completionTokens: number; readonly totalTokens: number } }>;
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
   *
   * Delegates to the LLM client configured in the agent context.
   * Concrete agents should use this method for all LLM interactions.
   */
  protected async chat(
    messages: ReadonlyArray<LLMMessage>,
    options?: { readonly temperature?: number; readonly maxTokens?: number },
  ): Promise<LLMResponse> {
    return this.ctx.client.chat(messages, options);
  }

  /**
   * Chat with LLM with streaming
   *
   * Streams responses chunk by chunk for real-time UI updates.
   * Calls the callback with each chunk as it arrives.
   */
  protected async chatStream(
    messages: ReadonlyArray<LLMMessage>,
    callback: StreamCallback,
    options?: { readonly temperature?: number; readonly maxTokens?: number },
  ): Promise<{ readonly usage?: { readonly promptTokens: number; readonly completionTokens: number; readonly totalTokens: number } }> {
    const startTime = Date.now();

    // Wrap callback to add logging
    const wrappedCallback = (chunk: StreamChunk) => {
      if (chunk.done && this.ctx.logger) {
        const duration = Date.now() - startTime;
        this.ctx.logger.info("LLM streaming completed", {
          agent: this.name,
          model: this.ctx.model,
          duration: `${duration}ms`,
          usage: chunk.usage,
        });
      }
      callback(chunk);
    };

    if (this.ctx.client.chatStream) {
      return this.ctx.client.chatStream(messages, wrappedCallback, options);
    } else {
      // Fallback to non-streaming if streaming not supported
      const response = await this.ctx.client.chat(messages, options);
      wrappedCallback({
        content: response.content,
        done: true,
        usage: response.usage,
      });
      return { usage: response.usage };
    }
  }

  abstract get name(): string;
}
