/**
 * Utilities Index
 */

export { BrowseClient } from "./browse-client.js";
export type { BrowseResult } from "./browse-client.js";

export {
  createPDFExporter,
  PDFExporter,
  type PDFExportOptions,
} from "./pdf-exporter.js";

export {
  createContextManager,
  ContextManager,
  type ContextSummary,
  type ContextWindow,
  type ContextManagerConfig,
} from "./context-manager.js";

export { createLogger, type Logger } from "./logger.js";
export {
  createWinstonLogger,
  createServiceLogger,
  WinstonLoggerAdapter,
  type WinstonLoggerConfig,
} from "./winston-logger.js";

// Error handling
export {
  createErrorResponse,
  zodToErrorDetails,
  sendErrorResponse,
  errorHandler,
  asyncHandler,
  handleValidationError,
  generateRequestId,
  requestIdMiddleware,
  ErrorCode,
  type ErrorResponse,
  type ErrorDetail,
} from "./error-handler.js";

// LLM Cache
export {
  LLMCache,
  generateCacheKey,
  getGlobalLLMCache,
  resetGlobalLLMCache,
  cached,
  type CacheConfig,
} from "./llm-cache.js";