/**
 * Base Agent for MemoirOS
 * Simplified version for fact verification
 */
import type { Logger } from "../utils/logger.js";
import type { StreamCallback } from "../llm/client.js";
export interface AgentContext {
    readonly client: LLMClient;
    readonly model: string;
    readonly projectRoot: string;
    readonly bookId?: string;
    readonly logger?: Logger;
    readonly onStreamProgress?: (progress: {
        readonly progress: number;
    }) => void;
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
    chat(messages: ReadonlyArray<LLMMessage>, options?: {
        readonly temperature?: number;
        readonly maxTokens?: number;
    }): Promise<LLMResponse>;
    chatStream?(messages: ReadonlyArray<LLMMessage>, callback: StreamCallback, options?: {
        readonly temperature?: number;
        readonly maxTokens?: number;
    }): Promise<{
        readonly usage?: {
            readonly promptTokens: number;
            readonly completionTokens: number;
            readonly totalTokens: number;
        };
    }>;
}
export declare abstract class BaseAgent {
    protected readonly ctx: AgentContext;
    constructor(ctx: AgentContext);
    protected get log(): Logger | undefined;
    /**
     * Chat with LLM
     *
     * Delegates to the LLM client configured in the agent context.
     * Concrete agents should use this method for all LLM interactions.
     */
    protected chat(messages: ReadonlyArray<LLMMessage>, options?: {
        readonly temperature?: number;
        readonly maxTokens?: number;
    }): Promise<LLMResponse>;
    /**
     * Chat with LLM with streaming
     *
     * Streams responses chunk by chunk for real-time UI updates.
     * Calls the callback with each chunk as it arrives.
     */
    protected chatStream(messages: ReadonlyArray<LLMMessage>, callback: StreamCallback, options?: {
        readonly temperature?: number;
        readonly maxTokens?: number;
    }): Promise<{
        readonly usage?: {
            readonly promptTokens: number;
            readonly completionTokens: number;
            readonly totalTokens: number;
        };
    }>;
    abstract get name(): string;
}
//# sourceMappingURL=base.d.ts.map