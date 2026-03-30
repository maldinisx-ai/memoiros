/**
 * MemoirOS Core
 *
 * Main entry point for the MemoirOS core library
 */

// Agents
export { BaseAgent } from "./agents/base.js";
export { FactVerifierAgent } from "./agents/fact-verifier.js";
export { InterviewerAgent } from "./agents/interviewer.js";
export { TimelineBuilderAgent } from "./agents/timeline-builder.js";
export { StyleImitatorAgent } from "./agents/style-imitator.js";
export { PreprocessorAgent } from "./agents/preprocessor.js";
export { MemoirWriterAgent } from "./agents/memoir-writer.js";
export { MemoirArchitectAgent } from "./agents/memoir-architect.js";
export type { UserProfile, PreprocessRequest, PreprocessResult } from "./agents/preprocessor.js";
export type {
  MemoirWriteRequest,
  MemoirWriteOutput,
} from "./agents/memoir-writer.js";
export type {
  MemoirOutlineRequest,
  MemoirOutlineOutput,
  ChapterOutline,
} from "./agents/memoir-architect.js";

// Agent types
export type { AgentContext, LLMClient, LLMMessage, LLMResponse } from "./agents/base.js";

// Models
export type {
  FactVerificationRequest,
  FactVerificationResult,
  VerificationIssue,
  VerificationSource,
  ExtractedEntities,
} from "./models/fact-verification.js";

export type {
  InterviewState,
  InterviewQuestion,
  InterviewAnswer,
  InterviewPhase,
  ExtractedFact,
  InterviewRequest,
  InterviewResponse,
  QuestionGenerationOptions,
} from "./models/interview.js";

export type {
  Timeline,
  TimelineEvent,
  TimelineDate,
  EventCategory,
  TimelineBuildRequest,
  TimelineBuildResult,
  TimelineConflict,
  TimelineGap,
} from "./models/timeline.js";

export type {
  VoiceProfile,
  VoiceCharacteristics,
  StyleTransferRequest,
  StyleTransferResult,
  VoiceProfileCreationRequest,
  VoiceSample,
  VoiceProfileAnalysis,
} from "./models/style.js";

// LLM Client
export { createLLMClient, loadLLMConfig } from "./llm/client.js";
export type { LLMConfig, StreamCallback, StreamChunk } from "./llm/client.js";

// Utils
export { BrowseClient } from "./utils/browse-client.js";
export type { BrowseResult } from "./utils/browse-client.js";

export {
  createPDFExporter,
  PDFExporter,
  type PDFExportOptions,
} from "./utils/pdf-exporter.js";

// Context Manager
export {
  createContextManager,
  ContextManager,
  type ContextSummary,
  type ContextWindow,
  type ContextManagerConfig,
} from "./utils/context-manager.js";

// Logger
export { createLogger, type Logger } from "./utils/logger.js";
export {
  createWinstonLogger,
  createServiceLogger,
  WinstonLoggerAdapter,
  type WinstonLoggerConfig,
} from "./utils/winston-logger.js";

// Storage
export { MemoirOSStorage } from "./storage/database.js";
export type { DatabaseConfig } from "./storage/database.js";
export {
  UserContextManager,
  type UserContext,
  type UserSession,
  type UserContextManagerOptions,
} from "./storage/user-context.js";
export {
  MemCubeManager,
  type EmbeddingProvider,
} from "./storage/memcube-manager.js";
export {
  ChapterManager,
} from "./storage/chapter-manager.js";
export {
  AuthManager,
  type UserAccount,
  type UserRegistration,
  type UserLogin,
  type AuthResult,
  type UserAccountStatus,
} from "./storage/auth.js";
export {
  SessionManager,
  type Session,
  type SessionValidationResult,
} from "./storage/session.js";

// MemCube
export type {
  MemCubeItem,
  MemCubeCollection,
  MemCubeQuery,
  MemCubeSearchResult,
  MemCubeStatus,
  MemCubeItemSave,
  MemCubeCollectionSave,
} from "./schemas/memcube.schemas.js";

// Chapter
export type {
  ChapterSave,
  ChapterContentSave,
  ChapterVersionSave,
  ChapterQuery,
  CreateChapterRequest,
  UpdateChapterRequest,
  ExportChapterRequest,
  ChapterResponse,
  ChapterListResponse,
  ChapterVersionResponse,
  ChapterVersionListResponse,
  MemoirInfo,
  MemoirSave,
  CreateMemoirRequest,
  UpdateMemoirRequest,
  ChapterStatus,
  ChapterType,
} from "./schemas/chapter.schemas.js";

// Workflow
export {
  WorkflowEngine,
  WorkflowStateMachine,
  type WorkflowStage,
  type WorkflowStatus,
  type WorkflowState,
  type WorkflowOptions,
  type StageExecutor,
  type StageExecutionResult,
  type StageExecutionContext,
  type WorkflowCheckpoint,
  type WorkflowConfig,
  type WorkflowSummary,
} from "./workflow/index.js";
