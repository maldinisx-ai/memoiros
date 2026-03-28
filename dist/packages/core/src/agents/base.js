/**
 * Base Agent for MemoirOS
 * Simplified version for fact verification
 */
export class BaseAgent {
    ctx;
    constructor(ctx) {
        this.ctx = ctx;
    }
    get log() {
        return this.ctx.logger;
    }
    /**
     * Chat with LLM
     */
    async chat(messages, options) {
        // This should be implemented by concrete agents
        // For now, return a mock response
        return this.ctx.client.chat(messages, options);
    }
}
//# sourceMappingURL=base.js.map