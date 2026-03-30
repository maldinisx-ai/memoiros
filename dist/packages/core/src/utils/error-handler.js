/**
 * Unified Error Handling Utilities
 *
 * Provides standardized error responses and logging for the API.
 */
import { createServiceLogger } from "./winston-logger.js";
const errorLogger = createServiceLogger("error-handler", {
    logDir: process.env.LOG_DIR ?? "logs",
});
/**
 * Error codes enumeration
 */
export var ErrorCode;
(function (ErrorCode) {
    // Validation errors (4xx)
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["INVALID_INPUT"] = "INVALID_INPUT";
    ErrorCode["MISSING_REQUIRED_FIELD"] = "MISSING_REQUIRED_FIELD";
    ErrorCode["INVALID_FORMAT"] = "INVALID_FORMAT";
    // Authentication/Authorization errors (4xx)
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ErrorCode["INVALID_CREDENTIALS"] = "INVALID_CREDENTIALS";
    ErrorCode["SESSION_EXPIRED"] = "SESSION_EXPIRED";
    ErrorCode["SESSION_NOT_FOUND"] = "SESSION_NOT_FOUND";
    // Resource errors (4xx)
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ErrorCode["ALREADY_EXISTS"] = "ALREADY_EXISTS";
    ErrorCode["CONFLICT"] = "CONFLICT";
    // Rate limiting (4xx)
    ErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    // Server errors (5xx)
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCode["DATABASE_ERROR"] = "DATABASE_ERROR";
    ErrorCode["EXTERNAL_SERVICE_ERROR"] = "EXTERNAL_SERVICE_ERROR";
    ErrorCode["LLM_ERROR"] = "LLM_ERROR";
})(ErrorCode || (ErrorCode = {}));
/**
 * HTTP status code mapping for error codes
 */
const ERROR_STATUS_MAP = {
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
const ERROR_MESSAGES = {
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
export function createErrorResponse(code, details, originalError) {
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
export function zodToErrorDetails(zodError) {
    if (!zodError || typeof zodError !== "object") {
        return [];
    }
    const error = zodError;
    return (error.errors?.map((e) => ({
        field: e.path.join("."),
        message: e.message,
        code: e.code,
    })) ?? []);
}
/**
 * Send error response
 */
export function sendErrorResponse(res, code, details, originalError) {
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
    }
    else {
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
export function errorHandler(err, req, res, next) {
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
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
/**
 * Request validation helper
 */
export function handleValidationError(error, res) {
    if (error && typeof error === "object" && "name" in error && error.name === "ZodError") {
        const details = zodToErrorDetails(error);
        sendErrorResponse(res, ErrorCode.VALIDATION_ERROR, details);
    }
    else {
        sendErrorResponse(res, ErrorCode.INTERNAL_ERROR, undefined, error);
    }
}
/**
 * Generate request ID for tracking
 */
export function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
/**
 * Request ID middleware
 */
export function requestIdMiddleware(req, res, next) {
    req.id = generateRequestId();
    res.setHeader("X-Request-ID", req.id);
    next();
}
//# sourceMappingURL=error-handler.js.map