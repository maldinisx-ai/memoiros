/**
 * Winston Logger Implementation
 *
 * Structured logging with log rotation for MemoirOS v2.1
 * Per PRD requirements: Winston 日志系统
 */
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import fs from "fs";
/**
 * Create log directory if it doesn't exist
 */
function ensureLogDir(logDir) {
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
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
export function createWinstonLogger(service, config = {}) {
    const { logDir = path.join(process.cwd(), "logs"), level = process.env.LOG_LEVEL || "info", maxSize = "20m", maxFiles = "14d", datePattern = "YYYY-MM-DD", } = config;
    ensureLogDir(logDir);
    // Define log format
    const consoleFormat = winston.format.combine(winston.format.colorize(), winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston.format.printf(({ timestamp, level, message, service: svc, ...meta }) => {
        const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
        return `[${timestamp}] [${svc || service}] ${level}: ${message}${metaStr}`;
    }));
    const fileFormat = winston.format.combine(winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston.format.errors({ stack: true }), winston.format.json());
    // Create transports
    const transports = [
        // Console transport
        new winston.transports.Console({
            format: consoleFormat,
            level,
        }),
        // Combined log file with daily rotation
        new DailyRotateFile({
            dirname: logDir,
            filename: `${service}-%DATE%.log`,
            datePattern,
            maxSize,
            maxFiles,
            format: fileFormat,
            level,
        }),
        // Error-only log file
        new DailyRotateFile({
            dirname: logDir,
            filename: `${service}-error-%DATE%.log`,
            datePattern,
            maxSize,
            maxFiles,
            format: fileFormat,
            level: "error",
        }),
    ];
    return winston.createLogger({
        level,
        defaultMeta: { service },
        transports,
        exitOnError: false,
    });
}
/**
 * Winston-based logger adapter
 *
 * Wraps Winston logger to match the Logger interface
 */
export class WinstonLoggerAdapter {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    info(message, meta) {
        this.logger.info(message, meta);
    }
    warn(message, meta) {
        this.logger.warn(message, meta);
    }
    error(message, meta) {
        this.logger.error(message, meta);
    }
    debug(message, meta) {
        this.logger.debug(message, meta);
    }
    /**
     * Log LLM request
     */
    logLLMRequest(params) {
        this.info("LLM request", {
            event: "llm_request",
            ...params,
        });
    }
    /**
     * Log LLM response
     */
    logLLMResponse(params) {
        this.info("LLM response", {
            event: "llm_response",
            ...params,
        });
    }
    /**
     * Log workflow state change
     */
    logWorkflowTransition(params) {
        this.info("Workflow transition", {
            event: "workflow_transition",
            ...params,
        });
    }
    /**
     * Log checkpoint save
     */
    logCheckpoint(params) {
        this.info("Checkpoint saved", {
            event: "checkpoint_save",
            ...params,
        });
    }
    /**
     * Log error with context
     */
    logError(error, context) {
        this.logger.error(error.message, {
            event: "error",
            stack: error.stack,
            ...context,
        });
    }
}
/**
 * Create logger instance for a service
 */
export function createServiceLogger(service, config) {
    const logger = createWinstonLogger(service, config);
    return new WinstonLoggerAdapter(logger);
}
//# sourceMappingURL=winston-logger.js.map