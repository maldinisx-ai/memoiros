/**
 * Winston Logger Implementation
 *
 * Structured logging with log rotation for MemoirOS v2.1
 * Per PRD requirements: Winston 日志系统
 */
import winston from "winston";
export interface WinstonLoggerConfig {
    readonly logDir?: string;
    readonly level?: string;
    readonly maxSize?: string;
    readonly maxFiles?: string;
    readonly datePattern?: string;
}
/**
 * Create Winston logger instance
 *
 * Features:
 * - Console transport with colored output
 * - File transport with daily rotation
 * - Structured JSON format for files
 * - Error stack traces
 */
export declare function createWinstonLogger(service: string, config?: WinstonLoggerConfig): winston.Logger;
/**
 * Winston-based logger adapter
 *
 * Wraps Winston logger to match the Logger interface
 */
export declare class WinstonLoggerAdapter {
    private readonly logger;
    constructor(logger: winston.Logger);
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
    debug(message: string, meta?: Record<string, unknown>): void;
    /**
     * Log LLM request
     */
    logLLMRequest(params: {
        readonly agent: string;
        readonly model: string;
        readonly promptLength: number;
        readonly temperature?: number;
    }): void;
    /**
     * Log LLM response
     */
    logLLMResponse(params: {
        readonly agent: string;
        readonly model: string;
        readonly responseLength: number;
        readonly duration: number;
        readonly usage?: {
            readonly promptTokens: number;
            readonly completionTokens: number;
            readonly totalTokens: number;
        };
    }): void;
    /**
     * Log workflow state change
     */
    logWorkflowTransition(params: {
        readonly workflowId: string;
        readonly from: string;
        readonly to: string;
        readonly reason?: string;
    }): void;
    /**
     * Log checkpoint save
     */
    logCheckpoint(params: {
        readonly userId: string;
        readonly checkpointId: string;
        readonly stage: string;
        readonly size: number;
    }): void;
    /**
     * Log error with context
     */
    logError(error: Error, context?: Record<string, unknown>): void;
}
/**
 * Create logger instance for a service
 */
export declare function createServiceLogger(service: string, config?: WinstonLoggerConfig): WinstonLoggerAdapter;
//# sourceMappingURL=winston-logger.d.ts.map