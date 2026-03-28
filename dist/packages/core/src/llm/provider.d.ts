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
export declare class MockLLMClient implements LLMClient {
    readonly provider = "mock";
    chat(messages: ReadonlyArray<LLMMessage>, _options?: ChatOptions): Promise<LLMResponse>;
}
//# sourceMappingURL=provider.d.ts.map