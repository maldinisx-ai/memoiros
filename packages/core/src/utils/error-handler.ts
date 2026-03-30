/**
 * Unified Error Handling Utilities
 *
 * Provides standardized error responses and logging for the API.
 */

import type { Request, Response, NextFunction } from "express";
import type { ZodError } from "zod";
import { createServiceLogger } from "./winston-logger.js";

const errorLogger = createServiceLogger("error-handler", {
  logDir: process.env.LOG_DIR ?? "logs",
});

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: ReadonlyArray<ErrorDetail>;
    readonly stack?: string; // Only in development
  };
  readonly timestamp: string;
  readonly requestId?: string;
}

export interface ErrorDetail {
  readonly field?: string;
  readonly message: string;
  readonly code?: string;
}

/**
 * Error codes enumeration
 */
export enum ErrorCode {
  // Validation errors (4xx)
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  INVALID_FORMAT = "INVALID_FORMAT",

  // Authentication/Authorization errors (4xx)
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  SESSION_NOT_FOUND = "SESSION_NOT_FOUND",

  // Resource errors (4xx)
  NOT_FOUND = "NOT_FOUND",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  CONFLICT = "CONFLICT",

  // Rate limiting (4xx)
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",

  // Server errors (5xx)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
  LLM_ERROR = "LLM_ERROR",
}

/**
 * HTTP status code mapping for error codes
 */
const ERROR_STATUS_MAP: Readonly<Record<ErrorCode, number>> = {
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCode.INVALID_FORMAT]: 400,

  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.SESSION_EXPIRED]: 401,
  [ErrorCode.SESSION_NOT_FOUND]: 404,

  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.ALREADY_EXISTS]: 409,
  [ErrorCode.CONFLICT]: 409,

  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,

  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCode.LLM_ERROR]: 502,
};

/**
 * User-friendly error messages (Chinese)
 */
const ERROR_MESSAGES: Readonly<Record<ErrorCode, string>> = {
  [ErrorCode.VALIDATION_ERROR]: "请求数据格式不正确",
  [ErrorCode.INVALID_INPUT]: "输入数据无效",
  [ErrorCode.MISSING_REQUIRED_FIELD]: "缺少必填字段",
  [ErrorCode.INVALID_FORMAT]: "数据格式不正确",

  [ErrorCode.UNAUTHORIZED]: "未授权访问",
  [ErrorCode.FORBIDDEN]: "禁止访问",
  [ErrorCode.INVALID_CREDENTIALS]: "用户名或密码错误",
  [ErrorCode.SESSION_EXPIRED]: "会话已过期，请重新登录",
  [ErrorCode.SESSION_NOT_FOUND]: "会话不存在",

  [ErrorCode.NOT_FOUND]: "请求的资源不存在",
  [ErrorCode.ALREADY_EXISTS]: "资源已存在",
  [ErrorCode.CONFLICT]: "数据冲突",

  [ErrorCode.RATE_LIMIT_EXCEEDED]: "请求过于频繁，请稍后再试",

  [ErrorCode.INTERNAL_ERROR]: "服务器内部错误，请稍后重试",
  [ErrorCode.DATABASE_ERROR]: "数据库错误，请稍后重试",
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: "外部服务错误，请稍后重试",
  [ErrorCode.LLM_ERROR]: "AI 服务暂时不可用，请稍后重试",
};

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  code: ErrorCode,
  details?: ReadonlyArray<ErrorDetail>,
  originalError?: Error
): ErrorResponse {
  const isDevelopment = process.env.NODE_ENV === "development";

  return {
    success: false,
    error: {
      code,
      message: ERROR_MESSAGES[code],
      details,
      stack: isDevelopment && originalError?.stack ? originalError.stack : undefined,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Convert Zod validation error to error details
 */
export function zodToErrorDetails(zodError: unknown): ReadonlyArray<ErrorDetail> {
  if (!zodError || typeof zodError !== "object") {
    return [];
  }

  const error = zodError as {
    errors?: ReadonlyArray<{
      path: ReadonlyArray<string | number>;
      message: string;
      code: string;
    }>;
  };

  return (
    error.errors?.map((e) => ({
      field: e.path.join("."),
      message: e.message,
      code: e.code,
    })) ?? []
  );
}

/**
 * Send error response
 */
export function sendErrorResponse(
  res: Response,
  code: ErrorCode,
  details?: ReadonlyArray<ErrorDetail>,
  originalError?: Error
): void {
  const status = ERROR_STATUS_MAP[code];
  const response = createErrorResponse(code, details, originalError);

  // Log error with context
  if (status >= 500) {
    errorLogger.error("Server error", {
      code,
      message: response.error.message,
      details,
      stack: originalError?.stack,
    });
  } else {
    errorLogger.warn("Client error", {
      code,
      message: response.error.message,
      details,
    });
  }

  res.status(status).json(response);
}

/**
 * Express error handler middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  errorLogger.error("Unhandled error", {
    url: req.url,
    method: req.method,
    error: err.message,
    stack: err.stack,
  });

  // Check if it's a known error type
  if (err.name === "ZodError") {
    const details = zodToErrorDetails(err);
    sendErrorResponse(res, ErrorCode.VALIDATION_ERROR, details, err);
    return;
  }

  // Default to internal error
  sendErrorResponse(res, ErrorCode.INTERNAL_ERROR, undefined, err);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Request validation helper
 */
export function handleValidationError(
  error: unknown,
  res: Response
): void {
  if (error && typeof error === "object" && "name" in error && error.name === "ZodError") {
    const details = zodToErrorDetails(error);
    sendErrorResponse(res, ErrorCode.VALIDATION_ERROR, details);
  } else {
    sendErrorResponse(res, ErrorCode.INTERNAL_ERROR, undefined, error as Error);
  }
}

/**
 * Generate request ID for tracking
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Request ID middleware
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  req.id = generateRequestId();
  res.setHeader("X-Request-ID", req.id);
  next();
}

// Extend Express Request type
declare module "express" {
  interface Request {
    id?: string;
  }
}
