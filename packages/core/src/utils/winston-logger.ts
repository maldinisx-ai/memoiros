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

export interface WinstonLoggerConfig {
  readonly logDir?: string;
  readonly level?: string;
  readonly maxSize?: string;
  readonly maxFiles?: string;
  readonly datePattern?: string;
}

/**
 * Create log directory if it doesn't exist
 */
function ensureLogDir(logDir: string): void {
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
export function createWinstonLogger(
  service: string,
  config: WinstonLoggerConfig = {},
): winston.Logger {
  const {
    logDir = path.join(process.cwd(), "logs"),
    level = (process.env.LOG_LEVEL as string) || "info",
    maxSize = "20m",
    maxFiles = "14d",
    datePattern = "YYYY-MM-DD",
  } = config;

  ensureLogDir(logDir);

  // Define log format
  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message, service: svc, ...meta }) => {
      const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
      return `[${timestamp}] [${svc || service}] ${level}: ${message}${metaStr}`;
    }),
  );

  const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  );

  // Create transports
  const transports: winston.transport[] = [
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
  constructor(private readonly logger: winston.Logger) {}

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.logger.error(message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }

  /**
   * Log LLM request
   */
  logLLMRequest(params: {
    readonly agent: string;
    readonly model: string;
    readonly promptLength: number;
    readonly temperature?: number;
  }): void {
    this.info("LLM request", {
      event: "llm_request",
      ...params,
    });
  }

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
  }): void {
    this.info("LLM response", {
      event: "llm_response",
      ...params,
    });
  }

  /**
   * Log workflow state change
   */
  logWorkflowTransition(params: {
    readonly workflowId: string;
    readonly from: string;
    readonly to: string;
    readonly reason?: string;
  }): void {
    this.info("Workflow transition", {
      event: "workflow_transition",
      ...params,
    });
  }

  /**
   * Log checkpoint save
   */
  logCheckpoint(params: {
    readonly userId: string;
    readonly checkpointId: string;
    readonly stage: string;
    readonly size: number;
  }): void {
    this.info("Checkpoint saved", {
      event: "checkpoint_save",
      ...params,
    });
  }

  /**
   * Log error with context
   */
  logError(error: Error, context?: Record<string, unknown>): void {
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
export function createServiceLogger(
  service: string,
  config?: WinstonLoggerConfig,
): WinstonLoggerAdapter {
  const logger = createWinstonLogger(service, config);
  return new WinstonLoggerAdapter(logger);
}
