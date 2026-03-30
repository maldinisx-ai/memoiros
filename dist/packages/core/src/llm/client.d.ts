/**
 * LLM Client - Local Ollama Models Only
 *
 * Creates LLM clients for local Ollama models
 * Supports both regular and streaming responses
 */
import type { LLMClient } from "../agents/base.js";
/**
 * Streaming chunk callback
 */
export interface StreamChunk {
    readonly content: string;
    readonly done: boolean;
    readonly usage?: {
        readonly promptTokens: number;
        readonly completionTokens: number;
        readonly totalTokens: number;
    };
}
/**
 * Stream callback function
 */
export type StreamCallback = (chunk: StreamChunk) => void;
/**
 * LLM provider configuration (Ollama only)
 */
export interface LLMConfig {
    readonly provider: "ollama";
    readonly model?: string;
    readonly baseURL?: string;
    readonly timeout?: number;
}
/**
 * Create an LLM client for Ollama
 */
export declare function createLLMClient(config: LLMConfig): LLMClient;
/**
 * Load LLM config from environment
 */
export declare function loadLLMConfig(): LLMConfig;
//# sourceMappingURL=client.d.ts.map