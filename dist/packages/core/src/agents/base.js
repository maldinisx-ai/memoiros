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
     *
     * Delegates to the LLM client configured in the agent context.
     * Concrete agents should use this method for all LLM interactions.
     */
    async chat(messages, options) {
        return this.ctx.client.chat(messages, options);
    }
    /**
     * Chat with LLM with streaming
     *
     * Streams responses chunk by chunk for real-time UI updates.
     * Calls the callback with each chunk as it arrives.
     */
    async chatStream(messages, callback, options) {
        const startTime = Date.now();
        // Wrap callback to add logging
        const wrappedCallback = (chunk) => {
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
        }
        else {
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
}
//# sourceMappingURL=base.js.map