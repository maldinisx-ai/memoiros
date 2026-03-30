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
 * Context Manager Class
 *
 * Manages conversation context with sliding window and summary chain.
 */
export declare class ContextManager {
    private messages;
    private summaries;
    private readonly config;
    constructor(config?: ContextManagerConfig);
    /**
     * Add a message to the context
     *
     * Automatically manages sliding window and creates summaries when needed.
     */
    addMessage(message: LLMMessage): void;
    /**
     * Get the current context window
     *
     * Returns recent messages + summary chain for full context.
     */
    getContext(): ContextWindow;
    /**
     * Build messages for LLM with summary context
     *
     * Combines summaries (as system messages) + recent messages.
     */
    buildLLMMessages(systemPrompt: string): LLMMessage[];
    /**
     * Create a summary of older messages
     *
     * This is a placeholder - actual summarization would be done by an LLM.
     * In production, this would call the LLM to generate a proper summary.
     */
    private createSummary;
    /**
     * Generate a simple summary (placeholder)
     *
     * In production, this would use an LLM to generate a proper summary.
     */
    private generateSimpleSummary;
    /**
     * Extract key topics from messages
     *
     * Simple heuristic-based topic extraction.
     * In production, this would use NLP or LLM-based extraction.
     */
    private extractTopics;
    /**
     * Get statistics about the context
     */
    getStats(): {
        readonly totalMessages: number;
        readonly currentWindow: number;
        readonly summaryCount: number;
        readonly compressionRatio: number;
    };
    /**
     * Reset the context
     */
    reset(): void;
    /**
     * Export context state
     */
    export(): {
        readonly messages: ReadonlyArray<LLMMessage>;
        readonly summaries: ReadonlyArray<ContextSummary>;
    };
    /**
     * Import context state
     */
    import(data: {
        readonly messages: ReadonlyArray<LLMMessage>;
        readonly summaries: ReadonlyArray<ContextSummary>;
    }): void;
}
/**
 * Create a context manager instance
 */
export declare function createContextManager(config?: ContextManagerConfig): ContextManager;
//# sourceMappingURL=context-manager.d.ts.map