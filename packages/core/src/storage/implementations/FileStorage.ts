/**
 * File Storage Implementation
 *
 * IStorage implementation using JSON files
 */

import { promises as fs } from "fs";
import path from "path";
import type { InterviewPhase } from "../../models/interview.js";
import {
  IStorage,
  StorageInterview,
  StorageInterviewWithData,
  StorageQuestion,
  StorageAnswer,
  SaveInterviewInput,
  SaveQuestionInput,
  SaveAnswerInput,
  StorageResult,
  StorageError,
  StorageErrorType,
} from "../interfaces/IStorage.js";

/**
 * File storage data structure
 */
interface FileInterviewData {
  readonly interviewId: string;
  readonly userId: string;
  readonly status: "active" | "paused" | "completed";
  readonly startedAt: string;
  readonly completedAt?: string | null;
  readonly currentPhase: InterviewPhase;
  readonly metadata: StorageInterview["metadata"];
  readonly questions: ReadonlyArray<StorageQuestion>;
  readonly answers: ReadonlyArray<StorageAnswer>;
}

/**
 * File Storage Implementation
 */
export class FileStorage implements IStorage {
  private readonly dataDir: string;
  private cache = new Map<string, FileInterviewData>();
  private readonly logger?: { error: (msg: string, meta?: Record<string, unknown>) => void };

  constructor(dataDir: string = "data", logger?: { error: (msg: string, meta?: Record<string, unknown>) => void }) {
    this.dataDir = path.resolve(dataDir);
    this.logger = logger;
  }

  /**
   * Interview management
   */
  createInterview(input: SaveInterviewInput): StorageResult<StorageInterview> {
    try {
      const data: FileInterviewData = {
        interviewId: input.interviewId,
        userId: input.userId,
        status: input.status ?? "active",
        startedAt: input.startedAt,
        completedAt: input.completedAt,
        currentPhase: input.currentPhase,
        metadata: input.metadata ?? {},
        questions: [],
        answers: [],
      };

      this.cache.set(data.interviewId, data);
      this.saveToFile(data);

      return {
        success: true,
        data: this.mapToInterview(data),
      };
    } catch (error) {
      return this.handleError(error, StorageErrorType.Unknown);
    }
  }

  loadInterview(interviewId: string): StorageInterview | null {
    try {
      return this.cache.get(interviewId) ?? null;
    } catch (error) {
      console.error("[FileStorage] Failed to load interview:", error);
      return null;
    }
  }

  loadInterviewWithData(interviewId: string): StorageInterviewWithData | null {
    const data = this.cache.get(interviewId);
    if (!data) return null;

    return {
      interviewId: data.interviewId,
      userId: data.userId,
      status: data.status,
      startedAt: data.startedAt,
      completedAt: data.completedAt,
      currentPhase: data.currentPhase,
      metadata: data.metadata,
      questions: data.questions,
      answers: data.answers,
    };
  }

  updateInterview(
    input: Partial<SaveInterviewInput> & { readonly interviewId: string }
  ): StorageResult<void> {
    try {
      const current = this.cache.get(input.interviewId);
      if (!current) {
        return {
          success: false,
          error: "Interview not found",
        };
      }

      const updated: FileInterviewData = {
        ...current,
        status: input.status ?? current.status,
        completedAt: input.completedAt ?? current.completedAt,
        currentPhase: input.currentPhase ?? current.currentPhase,
        metadata: input.metadata ?? current.metadata,
      };

      this.cache.set(updated.interviewId, updated);
      this.saveToFile(updated);

      return { success: true };
    } catch (error) {
      return this.handleError(error, StorageErrorType.Unknown);
    }
  }

  deleteInterview(interviewId: string): StorageResult<void> {
    try {
      this.cache.delete(interviewId);

      // Delete file asynchronously
      const filePath = this.resolveSafePath(this.getUserFilePath(interviewId));
      Promise.resolve().then(async () => {
        if (await this.fileExists(filePath)) {
          await fs.unlink(filePath);
        }
      }).catch((error) => {
        console.error("[FileStorage] Failed to delete file:", error);
      });

      return { success: true };
    } catch (error) {
      return this.handleError(error, StorageErrorType.Unknown);
    }
  }

  listInterviews(userId: string): ReadonlyArray<StorageInterview> {
    try {
      console.log("[FileStorage] listInterviews called for userId:", userId);

      // Debug: log all userIds in cache that match the pattern
      const matchingEntries = Array.from(this.cache.values()).filter((d) => d.userId === userId);
      console.log("[FileStorage] Found matching entries:", matchingEntries.length);

      if (matchingEntries.length === 0) {
        // Log some sample userIds from cache for debugging
        const sampleUserIds = Array.from(this.cache.values()).slice(0, 10).map(d => d.userId);
        console.log("[FileStorage] Sample userIds in cache:", sampleUserIds);
      }

      return matchingEntries.map((d) => this.mapToInterview(d));
    } catch (error) {
      console.error("[FileStorage] Failed to list interviews:", error);
      return [];
    }
  }

  /**
   * Question management
   */
  createQuestion(input: SaveQuestionInput): StorageResult<StorageQuestion> {
    try {
      const interview = this.cache.get(input.interviewId);
      if (!interview) {
        return {
          success: false,
          error: "Interview not found",
        };
      }

      const question: StorageQuestion = {
        questionId: input.questionId,
        interviewId: input.interviewId,
        phase: input.phase,
        question: input.question,
        questionType: input.questionType,
        targetEntities: input.targetEntities,
        priority: input.priority,
        askedAt: input.askedAt,
        answered: input.answered,
      };

      const updated: FileInterviewData = {
        ...interview,
        questions: [...interview.questions, question],
      };

      this.cache.set(updated.interviewId, updated);
      this.saveToFile(updated);

      return {
        success: true,
        data: question,
      };
    } catch (error) {
      return this.handleError(error, StorageErrorType.Unknown);
    }
  }

  loadQuestion(questionId: string): StorageQuestion | null {
    try {
      for (const interview of this.cache.values()) {
        const question = interview.questions.find((q) => q.questionId === questionId);
        if (question) return question;
      }
      return null;
    } catch (error) {
      console.error("[FileStorage] Failed to load question:", error);
      return null;
    }
  }

  loadQuestionsByInterview(interviewId: string): ReadonlyArray<StorageQuestion> {
    try {
      const interview = this.cache.get(interviewId);
      return interview?.questions ?? [];
    } catch (error) {
      console.error("[FileStorage] Failed to load questions:", error);
      return [];
    }
  }

  updateQuestion(
    input: Partial<SaveQuestionInput> & { readonly questionId: string }
  ): StorageResult<void> {
    try {
      let interview: FileInterviewData | undefined;
      for (const i of this.cache.values()) {
        if (i.questions.some((q) => q.questionId === input.questionId)) {
          interview = i;
          break;
        }
      }

      if (!interview) {
        return {
          success: false,
          error: "Question not found",
        };
      }

      const updatedQuestions = interview.questions.map((q) =>
        q.questionId === input.questionId ? { ...q, ...input } : q
      );

      const updated: FileInterviewData = {
        ...interview,
        questions: updatedQuestions,
      };

      this.cache.set(updated.interviewId, updated);
      this.saveToFile(updated);

      return { success: true };
    } catch (error) {
      return this.handleError(error, StorageErrorType.Unknown);
    }
  }

  /**
   * Answer management
   */
  createAnswer(input: SaveAnswerInput): StorageResult<StorageAnswer> {
    try {
      const interview = this.cache.get(input.interviewId);
      if (!interview) {
        return {
          success: false,
          error: "Interview not found",
        };
      }

      // Verify question exists
      const questionExists = interview.questions.some(
        (q) => q.questionId === input.questionId
      );
      if (!questionExists) {
        return {
          success: false,
          error: "Question not found",
        };
      }

      const answer: StorageAnswer = {
        answerId: input.answerId,
        questionId: input.questionId,
        interviewId: input.interviewId,
        answer: input.answer,
        answeredAt: input.answeredAt,
        extractedEntities: input.extractedEntities,
        sentiment: input.sentiment,
        needsFollowup: input.needsFollowup,
        followupTopics: input.followupTopics,
      };

      const updated: FileInterviewData = {
        ...interview,
        answers: [...interview.answers, answer],
      };

      this.cache.set(updated.interviewId, updated);
      this.saveToFile(updated);

      return {
        success: true,
        data: answer,
      };
    } catch (error) {
      return this.handleError(error, StorageErrorType.ForeignKeyViolation);
    }
  }

  loadAnswer(answerId: string): StorageAnswer | null {
    try {
      for (const interview of this.cache.values()) {
        const answer = interview.answers.find((a) => a.answerId === answerId);
        if (answer) return answer;
      }
      return null;
    } catch (error) {
      console.error("[FileStorage] Failed to load answer:", error);
      return null;
    }
  }

  loadAnswersByInterview(interviewId: string): ReadonlyArray<StorageAnswer> {
    try {
      const interview = this.cache.get(interviewId);
      return interview?.answers ?? [];
    } catch (error) {
      console.error("[FileStorage] Failed to load answers:", error);
      return [];
    }
  }

  safeCreateAnswer(input: SaveAnswerInput): StorageResult<StorageAnswer> {
    // Check if interview exists
    const interview = this.cache.get(input.interviewId);
    if (!interview) {
      return {
        success: false,
        error: `Interview ${input.interviewId} not found`,
      };
    }

    // Check if question exists
    const questionExists = interview.questions.some(
      (q) => q.questionId === input.questionId
    );
    if (!questionExists) {
      // Auto-create the question
      console.warn(
        `[FileStorage] Question ${input.questionId} not found, auto-creating...`
      );
      this.createQuestion({
        questionId: input.questionId,
        interviewId: input.interviewId,
        phase: "warmup",
        question: "",
        questionType: "open",
        priority: "medium",
        askedAt: input.answeredAt,
        answered: true,
      });
    }

    // Now create the answer
    return this.createAnswer(input);
  }

  saveInterviewWithData(data: StorageInterviewWithData): StorageResult<void> {
    try {
      const fileData: FileInterviewData = {
        interviewId: data.interviewId,
        userId: data.userId,
        status: data.status,
        startedAt: data.startedAt,
        completedAt: data.completedAt,
        currentPhase: data.currentPhase,
        metadata: data.metadata,
        questions: [...data.questions],
        answers: [...data.answers],
      };

      this.cache.set(data.interviewId, fileData);
      this.saveToFile(fileData);

      return { success: true };
    } catch (error) {
      return this.handleError(error, StorageErrorType.Unknown);
    }
  }

  /**
   * Transaction support
   * Note: File storage doesn't support true transactions,
   * so we just execute the function directly
   */
  transaction<T>(fn: (storage: IStorage) => T): StorageResult<T> {
    try {
      const result = fn(this);
      return {
        success: true,
        data: result as T,
      };
    } catch (error) {
      return this.handleError(error, StorageErrorType.Unknown);
    }
  }

  /**
   * Health check
   */
  ping(): StorageResult<void> {
    try {
      fs.access(this.dataDir);
      return { success: true };
    } catch (error) {
      return this.handleError(error, StorageErrorType.ConnectionError);
    }
  }

  /**
   * Additional file-specific methods
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      console.log("[FileStorage] Initialized", { dataDir: this.dataDir });

      // Load existing data
      const entries = await fs.readdir(this.dataDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith("user_")) {
          await this.loadInterviewsFromDir(path.join(this.dataDir, entry.name));
        }
      }
      console.log("[FileStorage] Loaded interviews", { count: this.cache.size });

      // Debug: log first few userIds in cache
      const sampleUserIds = Array.from(this.cache.values()).slice(0, 5).map(d => d.userId);
      console.log("[FileStorage] Sample userIds:", sampleUserIds);
    } catch (error) {
      this.logger?.error("Failed to initialize file storage", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Helper methods
   */
  private mapToInterview(data: FileInterviewData): StorageInterview {
    return {
      interviewId: data.interviewId,
      userId: data.userId,
      status: data.status,
      startedAt: data.startedAt,
      completedAt: data.completedAt,
      currentPhase: data.currentPhase,
      metadata: data.metadata,
    };
  }

  private getUserFilePath(interviewId: string): string {
    const interview = this.cache.get(interviewId);
    if (!interview) {
      throw new Error(`Interview ${interviewId} not found in cache`);
    }
    const userId = this.validateUserId(interview.userId);
    return path.join("user_" + userId, `${interviewId}.json`);
  }

  private async saveToFile(data: FileInterviewData): Promise<void> {
    const filePath = this.resolveSafePath(this.getUserFilePath(data.interviewId));
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  }

  private async loadInterviewsFromDir(dirPath: string): Promise<void> {
    try {
      const files = await fs.readdir(dirPath);
      for (const file of files) {
        if (file.endsWith(".json")) {
          try {
            const filePath = path.join(dirPath, file);
            const content = await fs.readFile(filePath, "utf-8");
            const rawData = JSON.parse(content);

            // Normalize userId: user____ -> user_user____ for backward compatibility
            let normalizedUserId = rawData.userId ?? "user____";
            if (normalizedUserId === "user____") {
              normalizedUserId = "user_user____";
            }

            // Debug: log for user_user____ directory
            if (dirPath.includes("user_user____") || dirPath.includes("user____")) {
              console.log("[FileStorage] Loading from user_user____ dir:", {
                file,
                originalUserId: rawData.userId,
                normalizedUserId
              });
            }

            // Normalize data to match FileInterviewData interface
            // Handle old format files that might be missing fields
            const data: FileInterviewData = {
              interviewId: rawData.interviewId,
              userId: normalizedUserId,
              status: rawData.status ?? "paused",
              startedAt: rawData.startedAt ?? rawData.createdAt ?? new Date().toISOString(),
              completedAt: rawData.completedAt ?? null,
              currentPhase: rawData.currentPhase ?? "warmup",
              metadata: rawData.metadata ?? {},
              questions: rawData.questions ?? [],
              answers: rawData.answers ?? [],
            };

            this.cache.set(data.interviewId, data);
          } catch (fileError) {
            // Log but continue loading other files
            this.logger?.error("Failed to load interview file", {
              file,
              error: fileError instanceof Error ? fileError.message : String(fileError),
            });
          }
        }
      }
    } catch (error) {
      this.logger?.error("Failed to load interviews from directory", {
        error: error instanceof Error ? error.message : String(error),
        dirPath,
      });
    }
  }

  private validateUserId(userId: string): string {
    return userId.replace(/[^\w-]/g, "_");
  }

  private resolveSafePath(...pathSegments: string[]): string {
    const resolved = path.resolve(this.dataDir, ...pathSegments);
    const normalized = resolved.replace(/\\/g, "/");

    const dataDirNormalized = this.dataDir.replace(/\\/g, "/");
    if (!normalized.startsWith(dataDirNormalized)) {
      throw new Error(`Path traversal attempt detected: ${resolved}`);
    }

    return resolved;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private handleError<T>(error: unknown, type: StorageErrorType): StorageResult<T> {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[FileStorage] Error (${type}):`, error);

    return {
      success: false,
      error: message,
    };
  }
}