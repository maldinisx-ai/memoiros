/**
 * MemoirOS API Server
 *
 * Express server for the MemoirOS web interface
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { promises as fs } from "fs";
import { createLLMClient, loadLLMConfig } from "../packages/core/src/index.js";
import type { AgentContext } from "../packages/core/src/agents/base.js";
import { InterviewerAgent } from "../packages/core/src/agents/interviewer.js";
import { TimelineBuilderAgent } from "../packages/core/src/agents/timeline-builder.js";
import { PreprocessorAgent } from "../packages/core/src/agents/preprocessor.js";
import { MemoirWriterAgent } from "../packages/core/src/agents/memoir-writer.js";
import { MemoirArchitectAgent } from "../packages/core/src/agents/memoir-architect.js";
import { MemoirOSStorage } from "../packages/core/src/storage/database.js";
import { ChapterManager } from "../packages/core/src/storage/chapter-manager.js";
import { AuthManager, type UserRegistration, type UserLogin } from "../packages/core/src/storage/auth.js";
import { SessionManager } from "../packages/core/src/storage/session.js";
import { FileStorage } from "./storage.js";
import { createServiceLogger } from "../packages/core/src/utils/winston-logger.js";
import { ZodError, z } from "zod";
import {
  createInterviewRequestSchema,
  submitAnswerRequestSchema,
  buildTimelineRequestSchema,
  apiErrorResponseSchema,
} from "../packages/core/src/schemas/database.schemas.js";
import {
  createChapterRequestSchema,
  updateChapterRequestSchema,
  chapterQuerySchema,
  exportChapterRequestSchema,
} from "../packages/core/src/schemas/chapter.schemas.js";
// Unified error handling
import {
  handleValidationError,
  errorHandler,
  asyncHandler,
  requestIdMiddleware,
  ErrorCode,
  sendErrorResponse,
  type ErrorResponse,
} from "../packages/core/src/utils/error-handler.js";

// API schemas for authentication
const registerRequestSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\d+$/).min(10).max(15).optional(),
  password: z.string().min(6).max(100),
  metadata: z.record(z.unknown()).optional(),
});

const loginRequestSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

// API schemas for preprocess endpoint
const preprocessRequestSchema = z.object({
  userId: z.string().min(1),
  interviewId: z.string().optional(),
  includeTimeline: z.boolean().optional(),
  includeVoiceProfile: z.boolean().optional(),
});

// API schemas for memoir outline endpoint
const memoirOutlineRequestSchema = z.object({
  userId: z.string().min(1),
  interviewId: z.string().optional(),
  targetChapters: z.number().int().positive().optional(),
  structure: z.enum(["chronological", "thematic", "mixed"]).optional(),
});

// API schemas for memoir write endpoint
const memoirWriteRequestSchema = z.object({
  userId: z.string().min(1),
  interviewId: z.string().optional(),
  chapterNumber: z.number().int().positive().optional(),
  focusPeriod: z.object({
    startYear: z.number().int().optional(),
    endYear: z.number().int().optional(),
    theme: z.string().optional(),
  }).optional(),
  targetWords: z.number().int().positive().optional(),
});

const app = express();
// Configuration constants
const DEFAULT_PORT = 3000;
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : DEFAULT_PORT;

// Create LLM client and agent context
const llmConfig = loadLLMConfig();
const llmClient = createLLMClient(llmConfig);

// Create Winston logger for the API server
const apiLogger = createServiceLogger("api-server", {
  logDir: process.env.LOG_DIR ?? "logs",
});

// Middleware
app.use(cors());
app.use(express.json());

// Request ID middleware (for tracking)
app.use(requestIdMiddleware);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    apiLogger.info("HTTP request", {
      requestId: req.id,
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
});

// Global error handler (must be after routes, but we'll add it at the end)
app.use(errorHandler);

// Agent context with Winston logger
const agentContext: AgentContext = {
  client: llmClient,
  model: llmConfig.model ?? "default",
  projectRoot: process.cwd(),
  logger: {
    info: (msg: string) => apiLogger.info(msg),
    warn: (msg: string) => apiLogger.warn(msg),
    error: (msg: string) => apiLogger.error(msg),
  },
};

// Initialize file storage
const fileStorage = new FileStorage(process.env.DATA_DIR ?? "data");
await fileStorage.initialize();

// Initialize database storage and chapter manager
const dbStorage = new MemoirOSStorage({
  dataDir: process.env.DATA_DIR ?? "data",
  filename: "memoiros.db",
});
const chapterManager = new ChapterManager(dbStorage);
const authManager = new AuthManager(dbStorage);
const sessionManager = new SessionManager(dbStorage);

// Create agents (InterviewerAgent doesn't use storage parameter, we handle manually)
const interviewer = new InterviewerAgent(agentContext);
const timelineBuilder = new TimelineBuilderAgent(agentContext);
const preprocessor = new PreprocessorAgent(agentContext, fileStorage);
const memoirWriter = new MemoirWriterAgent(agentContext);
const memoirArchitect = new MemoirArchitectAgent(agentContext);

// Routes

/**
 * Start a new interview
 */
app.post("/api/interview/start", async (req, res) => {
  try {
    // Validate request body
    const validated = createInterviewRequestSchema.parse(req.body);

    const response = await interviewer.startInterview({ userId: validated.userId });

    // Save initial interview data
    await fileStorage.saveInterview({
      interviewId: response.interviewState.interviewId,
      userId: response.interviewState.userId,
      phase: response.interviewState.currentPhase,
      questions: [],
      answers: [],
    });

    res.json({
      interviewId: response.interviewState.interviewId,
      phase: response.interviewState.currentPhase,
      nextQuestion: response.nextQuestion?.question,
    });
  } catch (error) {
    handleValidationError(error, res);
  }
});

/**
 * Process user answer and get next question
 */
app.post("/api/interview/process", async (req, res) => {
  try {
    // Validate request body
    const validated = submitAnswerRequestSchema.parse(req.body);

    apiLogger.info("Processing answer", { interviewId: validated.interviewId, answerLength: validated.answer.length });
    apiLogger.debug("Raw answer text", { interviewId: validated.interviewId, answer: validated.answer });

    const { interviewId, answer } = validated;

    // Load current interview data
    const currentData = await fileStorage.loadInterview(interviewId);
    if (!currentData) {
      apiLogger.error("Interview not found", { interviewId });
      return res.status(404).json({ error: "Interview not found" });
    }

    apiLogger.info("Current interview data loaded", {
      interviewId,
      answersCount: currentData.answers.length,
    });

    // Get the last asked question (simplified - in real app, track properly)
    const questionId = `q_${Date.now()}`;

    const response = await interviewer.processAnswer(
      interviewId,
      questionId,
      answer
    );

    apiLogger.info("Agent response received", {
      interviewId,
      phase: response.interviewState.currentPhase,
    });

    // Save updated data
    const updatedData = {
      interviewId: response.interviewState.interviewId,
      userId: currentData.userId,
      phase: response.interviewState.currentPhase,
      questions: currentData.questions,
      answers: [
        ...currentData.answers,
        {
          answerId: `ans_${Date.now()}`,
          questionId,
          answer,
          answeredAt: new Date().toISOString(),
        },
      ],
    };

    apiLogger.info("Saving interview data", {
      interviewId,
      answersCount: updatedData.answers.length,
    });
    await fileStorage.saveInterview(updatedData);
    apiLogger.info("Interview data saved successfully", { interviewId });

    res.json({
      interviewId: response.interviewState.interviewId,
      phase: response.interviewState.currentPhase,
      nextQuestion: response.nextQuestion?.question,
      suggestedQuestions: response.suggestedQuestions?.map(q => q.question),
      needsClarification: response.needsClarification,
    });
  } catch (error) {
    handleValidationError(error, res);
  }
});

/**
 * Process user answer with streaming response
 *
 * Uses Server-Sent Events (SSE) to stream LLM responses in real-time.
 */
app.post("/api/interview/process/stream", async (req, res) => {
  try {
    const { interviewId, answer } = req.body as {
      interviewId?: string;
      answer?: string;
    };

    apiLogger.info("Processing answer with streaming", { interviewId });

    if (!interviewId || !answer) {
      return res.status(400).json({ error: "interviewId and answer are required" });
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Transfer-Encoding", "chunked");

    // Load current interview data
    const currentData = await fileStorage.loadInterview(interviewId);
    if (!currentData) {
      apiLogger.error("Interview not found", { interviewId });
      res.write(`data: ${JSON.stringify({ error: "Interview not found" })}\n\n`);
      res.end();
      return;
    }

    // Get the last asked question
    const questionId = `q_${Date.now()}`;

    // Send SSE data
    const sendSSE = (event: string, data: unknown) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    sendSSE("start", { interviewId, message: "Processing your answer..." });

    // Process answer with streaming (using regular chat for now, then LLM streaming)
    const response = await interviewer.processAnswer(
      interviewId,
      questionId,
      answer
    );

    // Save updated data
    const updatedData = {
      interviewId: response.interviewState.interviewId,
      userId: currentData.userId,
      phase: response.interviewState.currentPhase,
      questions: currentData.questions,
      answers: [
        ...currentData.answers,
        {
          answerId: `ans_${Date.now()}`,
          questionId,
          answer,
          answeredAt: new Date().toISOString(),
        },
      ],
    };

    await fileStorage.saveInterview(updatedData);

    // Send the next question
    sendSSE("question", {
      phase: response.interviewState.currentPhase,
      nextQuestion: response.nextQuestion?.question,
      suggestedQuestions: response.suggestedQuestions?.map(q => q.question),
    });

    sendSSE("done", { message: "Complete" });
    res.end();
  } catch (error) {
    apiLogger.logError(error as Error, { endpoint: "/api/interview/process/stream", interviewId });
    res.write(`data: ${JSON.stringify({ error: "Failed to process answer" })}\n\n`);
    res.end();
  }
});

/**
 * Get timeline for a user
 */
app.get("/api/timeline/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || userId.length === 0) {
      return res.status(400).json({ error: "userId is required" });
    }

    // In a real app, load from database
    // For now, return mock data
    res.json({
      timelineId: `timeline_${userId}`,
      userId,
      events: [
        {
          eventId: "evt_1",
          date: { type: "exact", year: 1985 },
          title: "出生",
          description: "出生于湖北某县城",
          category: "birth",
          importance: "critical",
          confidence: 0.95,
        },
        {
          eventId: "evt_2",
          date: { type: "exact", year: 2003 },
          title: "考入大学",
          description: "考入武汉大学计算机专业",
          category: "education",
          importance: "high",
          confidence: 0.9,
        },
      ],
      metadata: {
        earliestYear: 1985,
        latestYear: 2024,
        totalEvents: 2,
        verifiedEvents: 0,
      },
    });
  } catch (error) {
    apiLogger.logError(error as Error, { endpoint: "/api/timeline/:userId", userId });
    res.status(500).json({ error: "Failed to get timeline" });
  }
});

/**
 * Build timeline from interview answers
 */
app.post("/api/timeline/build", async (req, res) => {
  try {
    // Validate request body
    const validated = buildTimelineRequestSchema.parse(req.body);

    const result = await timelineBuilder.buildTimeline({
      userId: validated.userId,
      interviewAnswers: validated.interviewAnswers,
    });

    res.json({
      timelineId: result.timeline.timelineId,
      addedEvents: result.addedEvents,
      conflictsFound: result.conflictsFound,
      gapsIdentified: result.gapsIdentified,
      summary: result.summary,
    });
  } catch (error) {
    handleValidationError(error, res);
  }
});

/**
 * Preprocess interview data and generate user profile
 */
app.post("/api/preprocess", async (req, res) => {
  try {
    // Validate request body with Zod schema
    const validated = preprocessRequestSchema.parse(req.body);

    apiLogger.info("Preprocessing", { userId: validated.userId, interviewId: validated.interviewId || "latest" });

    const result = await preprocessor.preprocess({
      userId: validated.userId,
      interviewId: validated.interviewId,
      includeTimeline: validated.includeTimeline,
      includeVoiceProfile: validated.includeVoiceProfile,
    });

    res.json({
      profile: result.profile,
      summary: result.summary,
      suggestions: result.suggestions,
    });
  } catch (error) {
    handleValidationError(error, res);
  }
});

/**
 * Generate memoir outline
 */
app.post("/api/memoir/outline", async (req, res) => {
  try {
    // Validate request body with Zod schema
    const validated = memoirOutlineRequestSchema.parse(req.body);

    // Get user profile from preprocessor
    const profileResult = await preprocessor.preprocess({
      userId: validated.userId,
      interviewId: validated.interviewId,
      includeTimeline: true,
      includeVoiceProfile: true,
    });

    const result = await memoirArchitect.generateOutline({
      userId: validated.userId,
      profile: profileResult.profile,
      targetChapters: validated.targetChapters,
      structure: validated.structure,
    });

    res.json({
      outline: result,
    });
  } catch (error) {
    handleValidationError(error, res);
  }
});

/**
 * Write memoir chapter
 */
app.post("/api/memoir/write", async (req, res) => {
  try {
    // Validate request body with Zod schema
    const validated = memoirWriteRequestSchema.parse(req.body);

    // Get user profile from preprocessor
    const profileResult = await preprocessor.preprocess({
      userId: validated.userId,
      interviewId: validated.interviewId,
      includeTimeline: true,
      includeVoiceProfile: true,
    });

    const result = await memoirWriter.writeChapter({
      userId: validated.userId,
      profile: profileResult.profile,
      chapterNumber: validated.chapterNumber,
      focusPeriod: validated.focusPeriod,
      targetWords: validated.targetWords,
    });

    res.json({
      chapter: result,
    });
  } catch (error) {
    handleValidationError(error, res);
  }
});

// ============================================
// Chapter API Endpoints
// ============================================

/**
 * Create a new chapter
 */
app.post("/api/chapters", async (req, res) => {
  try {
    const validated = createChapterRequestSchema.parse(req.body);

    const chapter = await chapterManager.createChapter({
      userId: validated.userId,
      memoirId: validated.memoirId,
      title: validated.title,
      type: validated.type,
      content: validated.content,
      metadata: validated.metadata,
    });

    res.status(201).json(chapter);
  } catch (error) {
    handleValidationError(error, res);
  }
});

/**
 * Get a chapter by ID
 */
app.get("/api/chapters/:chapterId", async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { userId } = req.query as { userId?: string };

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const chapter = chapterManager.getChapter(chapterId, userId);

    if (!chapter) {
      return res.status(404).json({ error: "Chapter not found" });
    }

    res.json(chapter);
  } catch (error) {
    apiLogger.logError(error as Error, { endpoint: "GET /api/chapters/:chapterId", chapterId });
    res.status(500).json({ error: "Failed to get chapter" });
  }
});

/**
 * List chapters with pagination and filters
 */
app.get("/api/chapters", async (req, res) => {
  try {
    const validated = chapterQuerySchema.parse(req.query);

    const result = chapterManager.listChapters({
      userId: validated.userId,
      memoirId: validated.memoirId,
      status: validated.status,
      type: validated.type,
      page: validated.page,
      limit: validated.limit,
    });

    res.json(result);
  } catch (error) {
    handleValidationError(error, res);
  }
});

/**
 * Update a chapter
 */
app.put("/api/chapters/:chapterId", async (req, res) => {
  try {
    const { chapterId } = req.params;

    const validated = updateChapterRequestSchema.parse({
      ...req.body,
      chapterId,
    });

    const chapter = await chapterManager.updateChapter(validated);

    res.json(chapter);
  } catch (error) {
    handleValidationError(error, res);
  }
});

/**
 * Delete a chapter
 */
app.delete("/api/chapters/:chapterId", async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { userId } = req.query as { userId?: string };

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    await chapterManager.deleteChapter(chapterId, userId);

    res.json({ success: true, chapterId });
  } catch (error) {
    apiLogger.logError(error as Error, { endpoint: "DELETE /api/chapters/:chapterId", chapterId });
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to delete chapter" });
  }
});

/**
 * Archive a chapter
 */
app.post("/api/chapters/:chapterId/archive", async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { userId } = req.body as { userId?: string };

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    await chapterManager.archiveChapter(chapterId, userId);

    res.json({ success: true, chapterId, status: "archived" });
  } catch (error) {
    apiLogger.logError(error as Error, { endpoint: "POST /api/chapters/:chapterId/archive", chapterId });
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to archive chapter" });
  }
});

/**
 * Publish a chapter
 */
app.post("/api/chapters/:chapterId/publish", async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { userId } = req.body as { userId?: string };

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const chapter = await chapterManager.publishChapter(chapterId, userId);

    res.json(chapter);
  } catch (error) {
    apiLogger.logError(error as Error, { endpoint: "POST /api/chapters/:chapterId/publish", chapterId });
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to publish chapter" });
  }
});

/**
 * List chapter versions
 */
app.get("/api/chapters/:chapterId/versions", async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { userId } = req.query as { userId?: string };

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const result = chapterManager.listChapterVersions(chapterId, userId);

    res.json(result);
  } catch (error) {
    apiLogger.logError(error as Error, { endpoint: "GET /api/chapters/:chapterId/versions", chapterId });
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to list chapter versions" });
  }
});

/**
 * Restore chapter to a specific version
 */
app.post("/api/chapters/:chapterId/versions/:versionId/restore", async (req, res) => {
  try {
    const { chapterId, versionId } = req.params;
    const { userId } = req.body as { userId?: string };

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const chapter = await chapterManager.restoreChapterVersion(chapterId, versionId, userId);

    res.json(chapter);
  } catch (error) {
    apiLogger.logError(error as Error, { endpoint: "POST /api/chapters/:chapterId/versions/:versionId/restore", chapterId, versionId });
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to restore chapter version" });
  }
});

/**
 * Export chapter as Markdown
 */
app.get("/api/chapters/:chapterId/export/markdown", async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { userId, includeMetadata, includeTimestamp } = req.query as {
      userId?: string;
      includeMetadata?: string;
      includeTimestamp?: string;
    };

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const markdown = chapterManager.exportChapterAsMarkdown(chapterId, userId, {
      includeMetadata: includeMetadata === "true",
      includeTimestamp: includeTimestamp !== "false",
    });

    if (!markdown) {
      return res.status(404).json({ error: "Chapter not found" });
    }

    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="chapter-${chapterId}.md"`);
    res.send(markdown);
  } catch (error) {
    apiLogger.logError(error as Error, { endpoint: "GET /api/chapters/:chapterId/export/markdown", chapterId });
    res.status(500).json({ error: "Failed to export chapter" });
  }
});

/**
 * Export chapter as PDF
 */
app.get("/api/chapters/:chapterId/export/pdf", async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { userId } = req.query as { userId?: string };

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const chapter = chapterManager.getChapter(chapterId, userId);
    if (!chapter) {
      return res.status(404).json({ error: "Chapter not found" });
    }

    // Generate temporary file path
    const outputDir = path.join(process.cwd(), "exports");
    await fs.mkdir(outputDir, { recursive: true });
    const filename = `chapter-${chapterId}-${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, filename);

    // Export as PDF
    await chapterManager.exportChapterAsPDF(chapterId, userId, outputPath, {
      format: "A4",
      margin: { top: "2cm", bottom: "2cm", left: "2cm", right: "2cm" },
    });

    // Send file
    res.download(outputPath, `chapter-${chapter.title}.pdf`, (err) => {
      // Clean up file after download
      fs.unlink(outputPath).catch((cleanupError) => {
        // Log cleanup errors for monitoring
        apiLogger.warn("Failed to cleanup temporary PDF file", {
          path: outputPath,
          error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
        });
      });
      if (err) {
        apiLogger.logError(err, { endpoint: "GET /api/chapters/:chapterId/export/pdf", chapterId });
      }
    });
  } catch (error) {
    apiLogger.logError(error as Error, { endpoint: "GET /api/chapters/:chapterId/export/pdf", chapterId });
    res.status(500).json({ error: "Failed to export chapter as PDF" });
  }
});

/**
 * Export memoir as PDF
 */
app.get("/api/memoirs/:memoirId/export/pdf", async (req, res) => {
  try {
    const { memoirId } = req.params;
    const { userId } = req.query as { userId?: string };

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Generate temporary file path
    const outputDir = path.join(process.cwd(), "exports");
    await fs.mkdir(outputDir, { recursive: true });
    const filename = `memoir-${memoirId}-${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, filename);

    // Export as PDF
    await chapterManager.exportMemoirAsPDF(memoirId, userId, outputPath, {
      format: "A4",
      margin: { top: "2cm", bottom: "2cm", left: "2cm", right: "2cm" },
    });

    // Send file
    res.download(outputPath, `memoir-${memoirId}.pdf`, (err) => {
      // Clean up file after download
      fs.unlink(outputPath).catch((cleanupError) => {
        // Log cleanup errors for monitoring
        apiLogger.warn("Failed to cleanup temporary PDF file", {
          path: outputPath,
          error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
        });
      });
      if (err) {
        apiLogger.logError(err, { endpoint: "GET /api/memoirs/:memoirId/export/pdf", memoirId });
      }
    });
  } catch (error) {
    apiLogger.logError(error as Error, { endpoint: "GET /api/memoirs/:memoirId/export/pdf", memoirId });
    res.status(500).json({ error: "Failed to export memoir as PDF" });
  }
});

/**
 * Search chapters
 */
app.get("/api/chapters/search", async (req, res) => {
  try {
    const { userId, query, memoirId, status, limit } = req.query as {
      userId?: string;
      query?: string;
      memoirId?: string;
      status?: string;
      limit?: string;
    };

    if (!userId || !query) {
      return res.status(400).json({ error: "userId and query are required" });
    }

    const results = chapterManager.searchChapters({
      userId,
      query,
      memoirId,
      status: status as any,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    res.json({ results, count: results.length });
  } catch (error) {
    apiLogger.logError(error as Error, { endpoint: "GET /api/chapters/search", query });
    res.status(500).json({ error: "Failed to search chapters" });
  }
});

/**
 * Get chapter search suggestions
 */
app.get("/api/chapters/suggestions", async (req, res) => {
  try {
    const { userId, prefix, limit } = req.query as {
      userId?: string;
      prefix?: string;
      limit?: string;
    };

    if (!userId || !prefix) {
      return res.status(400).json({ error: "userId and prefix are required" });
    }

    const suggestions = chapterManager.getChapterSearchSuggestions(
      userId,
      prefix,
      limit ? parseInt(limit, 10) : undefined
    );

    res.json({ suggestions });
  } catch (error) {
    apiLogger.logError(error as Error, { endpoint: "GET /api/chapters/suggestions", prefix });
    res.status(500).json({ error: "Failed to get search suggestions" });
  }
});

// ============================================
// Authentication API Endpoints
// ============================================

/**
 * Register a new user
 */
app.post("/api/auth/register", async (req, res) => {
  try {
    const validated = registerRequestSchema.parse(req.body);

    const result = await authManager.register({
      username: validated.username,
      email: validated.email,
      phone: validated.phone,
      password: validated.password,
      metadata: validated.metadata,
    });

    if (result.success && result.userId) {
      // Create session for the new user
      const ipAddress = req.ip;
      const userAgent = req.get("user-agent");

      const session = sessionManager.createSession(result.userId, {
        ipAddress,
        userAgent,
      });

      res.status(201).json({
        success: true,
        userId: result.userId,
        message: result.message,
        token: session.token,
        sessionId: session.sessionId,
        expiresAt: session.expiresAt,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    handleValidationError(error, res);
  }
});

/**
 * Login user
 */
app.post("/api/auth/login", async (req, res) => {
  try {
    const validated = loginRequestSchema.parse(req.body);

    const result = await authManager.login({
      identifier: validated.identifier,
      password: validated.password,
    });

    if (result.success && result.userId) {
      // Create session for the user
      const ipAddress = req.ip;
      const userAgent = req.get("user-agent");

      const session = sessionManager.createSession(result.userId, {
        ipAddress,
        userAgent,
      });

      res.json({
        success: true,
        userId: result.userId,
        message: result.message,
        token: session.token,
        sessionId: session.sessionId,
        expiresAt: session.expiresAt,
      });
    } else {
      res.status(401).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    handleValidationError(error, res);
  }
});

/**
 * Logout user
 */
app.post("/api/auth/logout", async (req, res) => {
  try {
    const { token, sessionId } = req.body as {
      token?: string;
      sessionId?: string;
    };

    let success = false;

    if (token) {
      success = sessionManager.endSessionByToken(token);
    } else if (sessionId) {
      success = sessionManager.endSession(sessionId);
    }

    if (success) {
      res.json({ success: true, message: "Logged out successfully" });
    } else {
      res.status(404).json({ success: false, message: "Session not found" });
    }
  } catch (error) {
    apiLogger.logError(error as Error, { endpoint: "POST /api/auth/logout" });
    res.status(500).json({ error: "Failed to logout" });
  }
});

/**
 * Validate session token
 */
app.get("/api/auth/validate", async (req, res) => {
  try {
    const { token } = req.query as { token?: string };

    if (!token) {
      return res.status(400).json({ error: "token is required" });
    }

    const result = sessionManager.validateSession(token);

    if (result.valid && result.userId) {
      res.json({
        valid: true,
        userId: result.userId,
        sessionId: result.sessionId,
      });
    } else {
      res.status(401).json({
        valid: false,
        message: result.message,
      });
    }
  } catch (error) {
    apiLogger.logError(error as Error, { endpoint: "GET /api/auth/validate", token });
    res.status(500).json({ error: "Failed to validate session" });
  }
});

/**
 * Refresh session token
 */
app.post("/api/auth/refresh", async (req, res) => {
  try {
    const { token, sessionId } = req.body as {
      token?: string;
      sessionId?: string;
      durationHours?: number;
    };

    let session = null;

    if (token) {
      session = sessionManager.refreshToken(token, req.body.durationHours);
    } else if (sessionId) {
      session = sessionManager.refreshSession(sessionId, req.body.durationHours);
    }

    if (session) {
      res.json({
        success: true,
        token: session.token,
        sessionId: session.sessionId,
        expiresAt: session.expiresAt,
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Session not found or expired",
      });
    }
  } catch (error) {
    apiLogger.logError(error as Error, { endpoint: "POST /api/auth/refresh" });
    res.status(500).json({ error: "Failed to refresh session" });
  }
});

/**
 * Change password
 */
app.post("/api/auth/change-password", async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body as {
      userId?: string;
      oldPassword?: string;
      newPassword?: string;
    };

    if (!userId || !oldPassword || !newPassword) {
      return res.status(400).json({ error: "userId, oldPassword, and newPassword are required" });
    }

    const result = await authManager.changePassword(userId, oldPassword, newPassword);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    apiLogger.logError(error as Error, { endpoint: "POST /api/auth/change-password", userId });
    res.status(500).json({ error: "Failed to change password" });
  }
});

/**
 * Request password reset (forgot password)
 * In production, this would send an email with the reset token
 */
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { identifier } = req.body as {
      identifier?: string;
    };

    if (!identifier) {
      return res.status(400).json({ error: "identifier (username/email/phone) is required" });
    }

    const result = await authManager.requestPasswordReset({ identifier });

    res.json({
      success: result.success,
      message: result.message,
      // Only include token in development for testing
      ...(process.env.NODE_ENV === "development" && result.resetToken ? { resetToken: result.resetToken } : {}),
    });
  } catch (error) {
    apiLogger.logError(error as Error, { endpoint: "POST /api/auth/forgot-password" });
    res.status(500).json({ error: "Failed to request password reset" });
  }
});

/**
 * Reset password with token
 */
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body as {
      token?: string;
      newPassword?: string;
    };

    if (!token || !newPassword) {
      return res.status(400).json({ error: "token and newPassword are required" });
    }

    const result = await authManager.resetPassword({ token, newPassword });

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    apiLogger.logError(error as Error, { endpoint: "POST /api/auth/reset-password" });
    res.status(500).json({ error: "Failed to reset password" });
  }
});

/**
 * Get user sessions
 */
app.get("/api/user/:userId/sessions", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const sessions = sessionManager.listSessions(userId);

    res.json({
      userId,
      sessions,
      count: sessions.length,
    });
  } catch (error) {
    apiLogger.logError(error as Error, { endpoint: "GET /api/user/:userId/sessions", userId });
    res.status(500).json({ error: "Failed to get user sessions" });
  }
});

/**
 * End all user sessions (logout everywhere)
 */
app.post("/api/user/:userId/sessions/end-all", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const count = sessionManager.endAllSessions(userId);

    res.json({
      success: true,
      userId,
      sessionsEnded: count,
      message: `Ended ${count} session(s)`,
    });
  } catch (error) {
    apiLogger.logError(error as Error, { endpoint: "POST /api/user/:userId/sessions/end-all", userId });
    res.status(500).json({ error: "Failed to end all sessions" });
  }
});

/**
 * Health check
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    provider: llmClient.provider,
    model: llmConfig.model,
  });
});

/**
 * Delete a specific interview
 */
app.delete("/api/interview/:interviewId", async (req, res) => {
  try {
    const { interviewId } = req.params;

    if (!interviewId || interviewId.length === 0) {
      return res.status(400).json({ error: "interviewId is required" });
    }

    await fileStorage.deleteInterview(interviewId);
    res.json({ success: true, interviewId });
  } catch (error) {
    apiLogger.logError(error as Error, { endpoint: "DELETE /api/interview/:interviewId", interviewId });
    res.status(500).json({ error: "Failed to delete interview" });
  }
});

/**
 * Find or create user by identifier (phone/email/name)
 *
 * Fixed: Uses direct agent call instead of self-fetch to avoid TOCTOU race condition
 * Fixed: Adds randomness to userId to prevent predictable IDs
 */
app.post("/api/user/find-or-create", async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ error: "identifier is required" });
    }

    // Normalize identifier and add randomness to prevent predictable userIds
    const normalizedId = identifier.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const randomSuffix = require("crypto").randomBytes(4).toString("hex");
    const userId = `user_${normalizedId}_${randomSuffix}`;

    // Check if user exists (by scanning existing interviews for this identifier)
    const interviews = await fileStorage.listInterviews(userId);

    if (interviews.length > 0) {
      // User exists - return their data
      const latestInterview = interviews[0];
      res.json({
        exists: true,
        userId,
        identifier,
        interviewId: latestInterview.interviewId,
        phase: latestInterview.phase,
        answersCount: latestInterview.answers?.length || 0,
      });
    } else {
      // New user - create interview directly using agent instead of self-fetch
      // This avoids the TOCTOU race condition from the previous implementation
      const response = await interviewer.startInterview({ userId });

      // Save initial interview data
      await fileStorage.saveInterview({
        interviewId: response.interviewState.interviewId,
        userId: response.interviewState.userId,
        phase: response.interviewState.currentPhase,
        questions: [],
        answers: [],
      });

      res.json({
        exists: false,
        userId,
        identifier,
        interviewId: response.interviewState.interviewId,
        phase: response.interviewState.currentPhase,
      });
    }
  } catch (error) {
    apiLogger.logError(error as Error, { endpoint: "/api/user/find-or-create", body: req.body });
    res.status(500).json({ error: "Failed to find or create user" });
  }
});

/**
 * Get all interviews for a user
 */
app.get("/api/user/:userId/interviews", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || userId.length === 0) {
      return res.status(400).json({ error: "userId is required" });
    }

    const interviews = await fileStorage.listInterviews(userId);
    res.json({
      userId,
      interviews,
      count: interviews.length,
    });
  } catch (error) {
    apiLogger.logError(error as Error, { endpoint: "/api/user/:userId/interviews", userId });
    res.status(500).json({ error: "Failed to list interviews" });
  }
});

/**
 * Delete all data for a user
 */
app.delete("/api/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || userId.length === 0) {
      return res.status(400).json({ error: "userId is required" });
    }

    await fileStorage.deleteUser(userId);
    res.json({ success: true, userId });
  } catch (error) {
    apiLogger.logError(error as Error, { endpoint: "DELETE /api/user/:userId", userId });
    res.status(500).json({ error: "Failed to delete user data" });
  }
});

/**
 * Serve static files
 */
app.use(express.static(path.join(process.cwd(), "web")));

/**
 * Redirect root to index.html
 */
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "web", "index.html"));
});

// Start server
app.listen(PORT, () => {
  apiLogger.info("MemoirOS API server started", {
    port: PORT,
    provider: llmClient.provider,
    model: llmConfig.model,
    environment: process.env.NODE_ENV || "development",
  });
  apiLogger.info("Server ready", {
    message: `Open web/index.html in your browser to use the interface`,
  });
});
