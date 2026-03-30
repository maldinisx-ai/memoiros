/**
 * Unified Error Handling Utilities
 *
 * Provides standardized error responses and logging for the API.
 */
import type { Request, Response, NextFunction } from "express";
/**
 * Standard error response structure
 */
export interface ErrorResponse {
    readonly success: false;
    readonly error: {
        readonly code: string;
        readonly message: string;
        readonly details?: ReadonlyArray<ErrorDetail>;
        readonly stack?: string;
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
export declare enum ErrorCode {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    INVALID_INPUT = "INVALID_INPUT",
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
    INVALID_FORMAT = "INVALID_FORMAT",
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
    SESSION_EXPIRED = "SESSION_EXPIRED",
    SESSION_NOT_FOUND = "SESSION_NOT_FOUND",
    NOT_FOUND = "NOT_FOUND",
    ALREADY_EXISTS = "ALREADY_EXISTS",
    CONFLICT = "CONFLICT",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    DATABASE_ERROR = "DATABASE_ERROR",
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
    LLM_ERROR = "LLM_ERROR"
}
/**
 * Create a standardized error response
 */
export declare function createErrorResponse(code: ErrorCode, details?: ReadonlyArray<ErrorDetail>, originalError?: Error): ErrorResponse;
/**
 * Convert Zod validation error to error details
 */
export declare function zodToErrorDetails(zodError: unknown): ReadonlyArray<ErrorDetail>;
/**
 * Send error response
 */
export declare function sendErrorResponse(res: Response, code: ErrorCode, details?: ReadonlyArray<ErrorDetail>, originalError?: Error): void;
/**
 * Express error handler middleware
 */
export declare function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void;
/**
 * Async handler wrapper to catch errors in async route handlers
 */
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Request validation helper
 */
export declare function handleValidationError(error: unknown, res: Response): void;
/**
 * Generate request ID for tracking
 */
export declare function generateRequestId(): string;
/**
 * Request ID middleware
 */
export declare function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void;
declare module "express" {
    interface Request {
        id?: string;
    }
}
//# sourceMappingURL=error-handler.d.ts.map