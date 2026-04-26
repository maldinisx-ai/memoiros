/**
 * Interview Routes
 *
 * Interview management endpoints: start, process, streaming, delete.
 */

import type { Router } from "express";
import type { RouteDependencies } from "./dependencies.js";
import { createInterviewRequestSchema, submitAnswerRequestSchema } from "../../packages/core/src/schemas/database.schemas.js";
import { handleValidationError } from "../../packages/core/src/utils/error-handler.js";
import { type StorageInterview } from "../../packages/core/src/storage/interfaces/IStorage.js";
import {
  handleSSEStream,
  createSSEStream,
  type SSEEventData,
} from "../utils/sse-handler.js";

/**
 * Register interview routes
 */
export function registerInterviewRoutes(router: Router, deps: RouteDependencies): void {
  const { interviewer, unifiedStorage, dbStorage, apiLogger } = deps;

  /**
   * Start a new interview
   */
  router.post("/api/interview/start", async (req, res) => {
    try {
      console.log('[POST /api/interview/start] Request received');
      const validated = createInterviewRequestSchema.parse(req.body);
      console.log('[POST /api/interview/start] Validated:', validated);

      const response = await interviewer.startInterview({ userId: validated.userId });
      console.log('[POST /api/interview/start] Interviewer response:', {
        interviewId: response.interviewState.interviewId,
        hasQuestion: !!response.nextQuestion
      });

      // Save to unifiedStorage (for web interface)
      unifiedStorage.createInterview({
        interviewId: response.interviewState.interviewId,
        userId: response.interviewState.userId,
        status: response.interviewState.status || "active",
        startedAt: response.interviewState.startedAt,
        completedAt: response.interviewState.completedAt,
        currentPhase: response.interviewState.currentPhase,
        metadata: {
          userBirthYear: response.interviewState.metadata.userBirthYear,
          userBirthplace: response.interviewState.metadata.userBirthplace,
          userOccupation: response.interviewState.metadata.userOccupation,
          interviewGoal: response.interviewState.metadata.interviewGoal,
          targetLength: response.interviewState.metadata.targetLength,
          completedPhases: response.interviewState.metadata.completedPhases,
        },
      });
      console.log('[POST /api/interview/start] Saved to unifiedStorage');

      // Save to dbStorage (for interviewer agent) - CRITICAL for foreign key constraint
      const { dbStorage } = deps;
      try {
        console.log('[POST /api/interview/start] Saving to dbStorage...');
        dbStorage.saveInterview({
          interviewId: response.interviewState.interviewId,
          userId: response.interviewState.userId,
          status: response.interviewState.status,
          startedAt: response.interviewState.startedAt,
          completedAt: response.interviewState.completedAt,
          currentPhase: response.interviewState.currentPhase,
          metadata: {
            userBirthYear: response.interviewState.metadata.userBirthYear,
            userBirthplace: response.interviewState.metadata.userBirthplace,
            userOccupation: response.interviewState.metadata.userOccupation,
            interviewGoal: response.interviewState.metadata.interviewGoal,
            targetLength: response.interviewState.metadata.targetLength,
            completedPhases: response.interviewState.metadata.completedPhases,
          },
        });
        console.log('[POST /api/interview/start] Saved interview to dbStorage:', response.interviewState.interviewId);
        apiLogger.info("[StartInterview] Saved interview to dbStorage", { interviewId: response.interviewState.interviewId });

        // Save the first question to dbStorage if exists
        if (response.nextQuestion && response.nextQuestion.question && response.nextQuestion.question.trim().length > 0) {
          const questionId = response.nextQuestion.questionId || `q_${Date.now()}`;
          console.log('[POST /api/interview/start] Saving question to dbStorage:', questionId);
          dbStorage.saveQuestion({
            questionId,
            interviewId: response.interviewState.interviewId,
            phase: response.nextQuestion.phase,
            question: response.nextQuestion.question.trim(),
            questionType: response.nextQuestion.questionType || "open",
            targetEntities: Array.isArray(response.nextQuestion.targetEntities)
              ? [...response.nextQuestion.targetEntities]
              : undefined,
            priority: response.nextQuestion.priority || "medium",
            askedAt: response.nextQuestion.askedAt || new Date().toISOString(),
            answered: response.nextQuestion.answered || false,
          });
          console.log('[POST /api/interview/start] Saved question to dbStorage');
          apiLogger.info("[StartInterview] Saved question to dbStorage", { questionId, interviewId: response.interviewState.interviewId });
        } else {
          console.warn('[POST /api/interview/start] Skipping empty question from LLM response');
        }
      } catch (dbError) {
        console.error('[POST /api/interview/start] DB save error:', dbError);
        apiLogger.error("[StartInterview] Failed to save to dbStorage", { error: dbError instanceof Error ? dbError.message : String(dbError) });
        // Continue anyway - fileStorage has the data
      }

      console.log('[POST /api/interview/start] Sending response');
      res.json({
        interviewId: response.interviewState.interviewId,
        phase: response.interviewState.currentPhase,
        nextQuestion: response.nextQuestion?.question,
      });
    } catch (error) {
      console.error('[POST /api/interview/start] Error:', error);
      handleValidationError(error, res);
    }
  });

  /**
   * Get interview with questions and answers
   */
  router.get("/api/interview/:interviewId", async (req, res) => {
    try {
      const { interviewId } = req.params;
      if (!interviewId || interviewId.length === 0) {
        return res.status(400).json({ error: "interviewId is required" });
      }

      const currentData = await unifiedStorage.loadInterviewWithData(interviewId);
      if (!currentData) {
        apiLogger.error("Interview not found", { interviewId });
        return res.status(404).json({ error: "Interview not found" });
      }

      res.json({
        interviewId: currentData.interviewId,
        userId: currentData.userId,
        phase: currentData.currentPhase,
        status: currentData.status,
        startedAt: currentData.startedAt,
        completedAt: currentData.completedAt,
        metadata: currentData.metadata,
        questions: currentData.questions,
        answers: currentData.answers,
        answersCount: currentData.answers.length,
      });
    } catch (error) {
      apiLogger.logError(error as Error, { endpoint: "GET /api/interview/:interviewId", interviewId: req.params.interviewId });
      res.status(500).json({ error: "Failed to load interview" });
    }
  });

  /**
   * Process user answer and get next question
   */
  router.post("/api/interview/process", async (req, res) => {
    try {
      // Debug: log raw request body
      apiLogger.debug("Raw request body", { body: req.body });

      const validated = submitAnswerRequestSchema.parse(req.body);

      apiLogger.info("Processing answer", { interviewId: validated.interviewId, answerLength: validated.answer.length });
      apiLogger.debug("Raw answer text", { interviewId: validated.interviewId, answer: validated.answer });

      const { interviewId, answer } = validated;

      const currentData = await unifiedStorage.loadInterviewWithData(interviewId);
      if (!currentData) {
        apiLogger.error("Interview not found", { interviewId });
        return res.status(404).json({ error: "Interview not found" });
      }

      apiLogger.info("Current interview data loaded", {
        interviewId,
        answersCount: currentData.answers.length,
      });

      const questionId = `q_${Date.now()}`;

      console.log('[GET /api/interview/process/stream] Calling interviewer.processAnswer...');
      const response = await interviewer.processAnswer(
        interviewId,
        questionId,
        answer
      );
      console.log('[GET /api/interview/process/stream] Interviewer response received, phase:', response.interviewState.currentPhase);

      apiLogger.info("Agent response received", {
        interviewId,
        phase: response.interviewState.currentPhase,
      });

      const updatedQuestions = [...currentData.questions];
      if (response.nextQuestion && response.nextQuestion.question && response.nextQuestion.question.trim().length > 0) {
        updatedQuestions.push({
          questionId: response.nextQuestion.questionId || `q_${Date.now()}`,
          interviewId: response.interviewState.interviewId,
          phase: response.nextQuestion.phase,
          question: response.nextQuestion.question.trim(),
          questionType: response.nextQuestion.questionType,
          priority: response.nextQuestion.priority,
          askedAt: response.nextQuestion.askedAt,
          answered: response.nextQuestion.answered,
        });
      } else {
        console.warn('[POST /api/interview/process] Skipping empty question from LLM response');
      }

      const updatedAnswers = [...currentData.answers, {
        answerId: `ans_${Date.now()}`,
        questionId,
        interviewId: response.interviewState.interviewId,
        answer,
        answeredAt: new Date().toISOString(),
      }];

      await unifiedStorage.saveInterviewWithData({
        interviewId: response.interviewState.interviewId,
        userId: currentData.userId,
        status: response.interviewState.status || "active",
        startedAt: currentData.startedAt,
        completedAt: response.interviewState.completedAt,
        currentPhase: response.interviewState.currentPhase,
        metadata: currentData.metadata,
        questions: updatedQuestions,
        answers: updatedAnswers,
      });

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
   * Process user answer with streaming response (SSE) - GET version
   */
  router.get("/api/interview/process/stream", async (req, res) => {
    console.log("[GET /api/interview/process/stream] Request received");
    const { interviewId, answer } = req.query as {
      interviewId?: string;
      answer?: string;
    };
    console.log("[GET /api/interview/process/stream] Params:", {
      interviewId,
      answerPreview: answer?.substring(0, 20),
    });

    if (!interviewId || !answer) {
      console.log("[GET /api/interview/process/stream] Missing params");
      return res.status(400).json({ error: "interviewId and answer are required" });
    }

    const currentData = await unifiedStorage.loadInterviewWithData(interviewId);
    if (!currentData) {
      apiLogger.error("Interview not found", { interviewId });
      return res.status(404).json({ error: "Interview not found" });
    }

    // Type narrowing: interviewId is now guaranteed to be a string
    const safeInterviewId = interviewId;
    const questionId = `q_${Date.now()}`;

    // Create SSE stream
    async function* generateSSEEvents(): AsyncGenerator<SSEEventData, void, unknown> {
      // Start event
      yield {
        type: "start",
        interviewId: safeInterviewId,
        message: "Processing your answer...",
      };

      try {
        console.log("[GET /api/interview/process/stream] Calling interviewer.processAnswer...");
        const response = await interviewer.processAnswer(safeInterviewId, questionId, answer!);
        console.log("[GET /api/interview/process/stream] Interviewer response received, phase:", response.interviewState.currentPhase);

        // Update questions
        const updatedQuestions = [...currentData!.questions];
        if (response.nextQuestion && response.nextQuestion.question && response.nextQuestion.question.trim().length > 0) {
          updatedQuestions.push({
            questionId: `q_${Date.now()}`,
            interviewId: safeInterviewId,
            question: response.nextQuestion.question.trim(),
            phase: response.interviewState.currentPhase,
            questionType: response.nextQuestion.questionType || "open",
            priority: response.nextQuestion.priority || "medium",
            askedAt: new Date().toISOString(),
            answered: false,
          });
        } else {
          console.warn("[GET /api/interview/process/stream] Skipping empty question from LLM response");
        }

        // Update answers
        const newAnswer = {
          answerId: `ans_${Date.now()}`,
          questionId,
          interviewId: safeInterviewId,
          answer: answer!,
          answeredAt: new Date().toISOString(),
        };

        const updatedData = {
          interviewId: response.interviewState.interviewId,
          userId: currentData!.userId,
          phase: response.interviewState.currentPhase,
          questions: updatedQuestions,
          answers: [...currentData!.answers, newAnswer] as const,
        };

        // Save to fileStorage
        await unifiedStorage.saveInterviewWithData(updatedData as any);

        // Question event
        yield {
          type: "question",
          phase: response.interviewState.currentPhase,
          nextQuestion: response.nextQuestion?.question,
          suggestedQuestions: response.suggestedQuestions?.map((q) => q.question),
        };
      } catch (error) {
        console.error("[GET /api/interview/process/stream] ERROR:", error);
        apiLogger.logError(error as Error, {
          endpoint: "/api/interview/process/stream",
          interviewId: safeInterviewId,
        });
        yield {
          type: "error",
          error: error instanceof Error ? error.message : "Failed to process answer",
          interviewId: safeInterviewId,
        };
      }
    }

    // Handle SSE stream with error resilience
    await handleSSEStream(res, safeInterviewId, generateSSEEvents());
  });

  /**
   * Process user answer with streaming response (SSE) - POST version
   */
  router.post("/api/interview/process/stream", async (req, res) => {
    const { interviewId, answer } = req.body;

    if (!interviewId || !answer) {
      return res.status(400).json({ error: "interviewId and answer are required" });
    }

    const currentData = await unifiedStorage.loadInterviewWithData(interviewId);
    if (!currentData) {
      apiLogger.error("Interview not found", { interviewId });
      return res.status(404).json({ error: "Interview not found" });
    }

    // Type narrowing: interviewId is now guaranteed to be a string
    const safeInterviewId = interviewId;
    const questionId = `q_${Date.now()}`;

    // Create SSE stream
    async function* generateSSEEvents(): AsyncGenerator<SSEEventData, void, unknown> {
      // Start event
      yield {
        type: "start",
        interviewId: safeInterviewId,
        message: "Processing your answer...",
      };

      try {
        console.log("[POST /api/interview/process/stream] Calling interviewer.processAnswer...");
        const response = await interviewer.processAnswer(safeInterviewId, questionId, answer);
        console.log("[POST /api/interview/process/stream] Interviewer response received, phase:", response.interviewState.currentPhase);

        // Update questions
        const updatedQuestions = [...currentData!.questions];
        if (response.nextQuestion && response.nextQuestion.question && response.nextQuestion.question.trim().length > 0) {
          updatedQuestions.push({
            questionId: `q_${Date.now()}`,
            interviewId: safeInterviewId,
            question: response.nextQuestion.question.trim(),
            phase: response.interviewState.currentPhase,
            questionType: response.nextQuestion.questionType || "open",
            priority: response.nextQuestion.priority || "medium",
            askedAt: new Date().toISOString(),
            answered: false,
          });
        } else {
          console.warn("[POST /api/interview/process/stream] Skipping empty question from LLM response");
        }

        // Update answers
        const newAnswer = {
          answerId: `ans_${Date.now()}`,
          questionId,
          answer,
          answeredAt: new Date().toISOString(),
        };

        const updatedData = {
          interviewId: response.interviewState.interviewId,
          userId: currentData!.userId,
          phase: response.interviewState.currentPhase,
          questions: updatedQuestions,
          answers: [...currentData!.answers, newAnswer] as const,
        };

        // Save to fileStorage
        await unifiedStorage.saveInterviewWithData(updatedData as any);

        // Question event
        yield {
          type: "question",
          phase: response.interviewState.currentPhase,
          nextQuestion: response.nextQuestion?.question,
          suggestedQuestions: response.suggestedQuestions?.map((q) => q.question),
        };
      } catch (error) {
        console.error("[POST /api/interview/process/stream] ERROR:", error);
        apiLogger.logError(error as Error, {
          endpoint: "/api/interview/process/stream",
          interviewId: safeInterviewId,
        });
        yield {
          type: "error",
          error: error instanceof Error ? error.message : "Failed to process answer",
          interviewId: safeInterviewId,
        };
      }
    }

    // Handle SSE stream with error resilience
    await handleSSEStream(res, safeInterviewId, generateSSEEvents());
  });

  /**
   * Advance to next phase
   */
  router.post("/api/interview/:interviewId/advance", async (req, res) => {
    try {
      const { interviewId } = req.params;
      if (!interviewId || interviewId.length === 0) {
        return res.status(400).json({ error: "interviewId is required" });
      }

      console.log(`[POST /api/interview/${interviewId}/advance] Advancing phase`);
      const response = await interviewer.advancePhase(interviewId);
      console.log(`[POST /api/interview/${interviewId}/advance] Phase advanced to: ${response.interviewState.currentPhase}`);

      // Update unifiedStorage with new phase
      const currentData = await unifiedStorage.loadInterviewWithData(interviewId);
      if (currentData) {
        await unifiedStorage.saveInterviewWithData({
          interviewId: response.interviewState.interviewId,
          userId: currentData.userId,
          status: currentData.status || "active",
          startedAt: currentData.startedAt,
          completedAt: currentData.completedAt,
          currentPhase: response.interviewState.currentPhase,
          metadata: response.interviewState.metadata as unknown as StorageInterview["metadata"],
          questions: currentData.questions,
          answers: currentData.answers,
        });
      }

      res.json({
        interviewId: response.interviewState.interviewId,
        phase: response.interviewState.currentPhase,
        nextQuestion: response.nextQuestion?.question,
        suggestedQuestions: response.suggestedQuestions?.map(q => q.question),
        summary: response.summary,
      });
    } catch (error) {
      console.error(`[POST /api/interview/${req.params.interviewId}/advance] Error:`, error);
      apiLogger.logError(error as Error, { endpoint: "POST /api/interview/:interviewId/advance", interviewId: req.params.interviewId });
      const errorMessage = error instanceof Error ? error.message : "Failed to advance phase";
      // Check if it's the "at final phase" error
      if (errorMessage.includes("final phase")) {
        return res.status(400).json({ error: "已经是最后一个阶段了" });
      }
      res.status(500).json({ error: errorMessage });
    }
  });

  /**
   * Delete a specific interview
   */
  router.delete("/api/interview/:interviewId", async (req, res) => {
    const { interviewId } = req.params;
    try {
      if (!interviewId || interviewId.length === 0) {
        return res.status(400).json({ error: "interviewId is required" });
      }

      await unifiedStorage.deleteInterview(interviewId);
      res.json({ success: true, interviewId: interviewId });
    } catch (error) {
      apiLogger.logError(error as Error, { endpoint: "DELETE /api/interview/:interviewId", interviewId });
      res.status(500).json({ error: "Failed to delete interview" });
    }
  });
}
