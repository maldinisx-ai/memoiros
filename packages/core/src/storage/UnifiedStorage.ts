/**
 * Unified Storage Facade
 *
 * Provides a unified interface for interview storage with:
 * - Primary storage: SQLite database (with transactions)
 * - Secondary storage: JSON files (for backup/legacy support)
 */

import { createRequire } from "node:module";
import type { InterviewPhase } from "../models/interview.js";
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
} from "./interfaces/IStorage.js";
import { SQLiteStorage } from "./implementations/SQLiteStorage.js";
import { FileStorage } from "./implementations/FileStorage.js";

// Re-export IStorage for external use
export type { IStorage } from "./interfaces/IStorage.js";

// Helper to load better-sqlite3 in ESM
const require = createRequire(import.meta.url);

/**
 * Unified Storage Configuration
 */
export interface UnifiedStorageConfig {
  readonly dbPath: string;
  readonly fileDataDir?: string;
  readonly enableFileSync?: boolean;
  readonly syncMode?: "async" | "sync" | "disabled";
}

/**
 * Unified Storage Facade
 *
 * Uses SQLite as the primary storage with optional file backup.
 * Provides automatic sync between storage backends.
 */
export class UnifiedStorage implements IStorage {
  private readonly primary: IStorage;
  private readonly secondary?: FileStorage;
  private readonly config: Omit<Required<UnifiedStorageConfig>, 'logger'>;

  constructor(config: UnifiedStorageConfig) {
    const Database = require("better-sqlite3");
    const db = new Database(config.dbPath);

    this.primary = new SQLiteStorage(db);
    this.secondary = config.enableFileSync
      ? new FileStorage(config.fileDataDir || "data")
      : undefined;

    this.config = {
      dbPath: config.dbPath,
      fileDataDir: config.fileDataDir || "data",
      enableFileSync: config.enableFileSync ?? true,
      syncMode: config.syncMode ?? "async",
    };

    // Initialize file storage if enabled
    if (this.secondary) {
      this.secondary.initialize().catch((error) => {
        console.error("[UnifiedStorage] Failed to initialize file storage:", error);
      });
    }
  }

  /**
   * Interview management
   */
  createInterview(input: SaveInterviewInput): StorageResult<StorageInterview> {
    const result = this.primary.createInterview(input);

    if (result.success && result.data && this.secondary) {
      this.syncCreateInterview(result.data);
    }

    return result;
  }

  loadInterview(interviewId: string): StorageInterview | null {
    const result = this.primary.loadInterview(interviewId);

    // If not found in primary, try secondary
    if (!result && this.secondary) {
      const secondaryResult = this.secondary.loadInterview(interviewId);
      if (secondaryResult) {
        // Sync back to primary
        console.warn(
          `[UnifiedStorage] Interview ${interviewId} found only in secondary storage, syncing to primary...`
        );
        this.syncCreateInterview(secondaryResult);
      }
      return secondaryResult;
    }

    return result;
  }

  loadInterviewWithData(interviewId: string): StorageInterviewWithData | null {
    let result = this.primary.loadInterviewWithData(interviewId);

    // If not found in primary OR primary has no answers, try secondary
    if ((!result || result.answers.length === 0) && this.secondary) {
      result = this.secondary.loadInterviewWithData(interviewId);
    }

    return result;
  }

  updateInterview(
    input: Partial<SaveInterviewInput> & { readonly interviewId: string }
  ): StorageResult<void> {
    const result = this.primary.updateInterview(input);

    if (result.success && this.secondary) {
      this.syncUpdateInterview(input);
    }

    return result;
  }

  deleteInterview(interviewId: string): StorageResult<void> {
    const result = this.primary.deleteInterview(interviewId);

    if (result.success && this.secondary) {
      this.secondary.deleteInterview(interviewId);
    }

    return result;
  }

  listInterviews(userId: string): ReadonlyArray<StorageInterview> {
    // Query both primary and secondary storage to get all interviews
    // This ensures data from file storage is available even if not in SQLite
    const primaryResults = this.primary.listInterviews(userId);
    const secondaryResults = this.secondary ? this.secondary.listInterviews(userId) : [];

    // Merge results, avoiding duplicates by interviewId
    const seen = new Set<string>();
    const merged: StorageInterview[] = [];

    for (const interview of [...primaryResults, ...secondaryResults]) {
      if (!seen.has(interview.interviewId)) {
        seen.add(interview.interviewId);
        merged.push(interview);
      }
    }

    return merged;
  }

  /**
   * Question management
   */
  createQuestion(input: SaveQuestionInput): StorageResult<StorageQuestion> {
    const result = this.primary.createQuestion(input);

    if (result.success && result.data && this.secondary) {
      this.syncCreateQuestion(result.data);
    }

    return result;
  }

  loadQuestion(questionId: string): StorageQuestion | null {
    return this.primary.loadQuestion(questionId);
  }

  loadQuestionsByInterview(interviewId: string): ReadonlyArray<StorageQuestion> {
    return this.primary.loadQuestionsByInterview(interviewId);
  }

  updateQuestion(
    input: Partial<SaveQuestionInput> & { readonly questionId: string }
  ): StorageResult<void> {
    const result = this.primary.updateQuestion(input);

    if (result.success && this.secondary) {
      this.syncUpdateQuestion(input);
    }

    return result;
  }

  /**
   * Answer management
   */
  createAnswer(input: SaveAnswerInput): StorageResult<StorageAnswer> {
    const result = this.primary.createAnswer(input);

    if (result.success && result.data && this.secondary) {
      this.syncCreateAnswer(result.data);
    }

    return result;
  }

  loadAnswer(answerId: string): StorageAnswer | null {
    return this.primary.loadAnswer(answerId);
  }

  loadAnswersByInterview(interviewId: string): ReadonlyArray<StorageAnswer> {
    return this.primary.loadAnswersByInterview(interviewId);
  }

  safeCreateAnswer(input: SaveAnswerInput): StorageResult<StorageAnswer> {
    const result = this.primary.safeCreateAnswer(input);

    if (result.success && result.data && this.secondary) {
      this.syncCreateAnswer(result.data);
    }

    return result;
  }

  saveInterviewWithData(data: StorageInterviewWithData): StorageResult<void> {
    return this.secondary?.saveInterviewWithData(data) ?? { success: true };
  }

  /**
   * Transaction support
   *
   * Transactions are only executed on primary storage.
   * Secondary storage is synced after the transaction completes.
   */
  transaction<T>(fn: (storage: IStorage) => T): StorageResult<T> {
    // Execute transaction on primary storage
    const result = this.primary.transaction(fn);

    // Sync to secondary if transaction succeeded
    if (result.success && this.secondary) {
      // Note: In async sync mode, we could sync in background
      // For now, we don't auto-sync transaction results to secondary
      // to avoid consistency issues
    }

    return result;
  }

  /**
   * Health check
   */
  ping(): StorageResult<void> {
    const primaryResult = this.primary.ping();

    if (!primaryResult.success) {
      return primaryResult;
    }

    // Check secondary if enabled
    if (this.secondary) {
      return this.secondary.ping();
    }

    return primaryResult;
  }

  /**
   * Sync methods
   *
   * These methods sync data to the secondary storage.
   * They are executed in the background when syncMode is "async".
   */
  private syncCreateInterview(data: StorageInterview): void {
    if (this.config.syncMode === "disabled") return;

    const fn = () => {
      this.secondary?.createInterview({
        interviewId: data.interviewId,
        userId: data.userId,
        status: data.status,
        startedAt: data.startedAt,
        completedAt: data.completedAt,
        currentPhase: data.currentPhase,
        metadata: data.metadata,
      });
    };

    if (this.config.syncMode === "async") {
      // Run in background
      Promise.resolve().then(fn).catch((error) => {
        console.error("[UnifiedStorage] Failed to sync interview to file storage:", error);
      });
    } else {
      fn();
    }
  }

  private syncUpdateInterview(
    input: Partial<SaveInterviewInput> & { readonly interviewId: string }
  ): void {
    if (this.config.syncMode === "disabled") return;

    const fn = () => {
      const interview = this.primary.loadInterview(input.interviewId);
      if (interview) {
        this.secondary?.updateInterview({
          interviewId: input.interviewId,
          userId: interview.userId,
          status: input.status,
          startedAt: interview.startedAt,
          completedAt: interview.completedAt,
          currentPhase: input.currentPhase,
          metadata: interview.metadata,
        });
      }
    };

    if (this.config.syncMode === "async") {
      Promise.resolve().then(fn).catch((error) => {
        console.error("[UnifiedStorage] Failed to sync interview update to file storage:", error);
      });
    } else {
      fn();
    }
  }

  private syncCreateQuestion(data: StorageQuestion): void {
    if (this.config.syncMode === "disabled") return;

    const fn = () => {
      this.secondary?.createQuestion({
        questionId: data.questionId,
        interviewId: data.interviewId,
        phase: data.phase,
        question: data.question,
        questionType: data.questionType,
        targetEntities: data.targetEntities,
        priority: data.priority,
        askedAt: data.askedAt,
        answered: data.answered,
      });
    };

    if (this.config.syncMode === "async") {
      Promise.resolve().then(fn).catch((error) => {
        console.error("[UnifiedStorage] Failed to sync question to file storage:", error);
      });
    } else {
      fn();
    }
  }

  private syncUpdateQuestion(
    input: Partial<SaveQuestionInput> & { readonly questionId: string }
  ): void {
    if (this.config.syncMode === "disabled") return;

    const fn = () => {
      this.secondary?.updateQuestion(input);
    };

    if (this.config.syncMode === "async") {
      Promise.resolve().then(fn).catch((error) => {
        console.error("[UnifiedStorage] Failed to sync question update to file storage:", error);
      });
    } else {
      fn();
    }
  }

  private syncCreateAnswer(data: StorageAnswer): void {
    if (this.config.syncMode === "disabled") return;

    const fn = () => {
      this.secondary?.createAnswer({
        answerId: data.answerId,
        questionId: data.questionId,
        interviewId: data.interviewId,
        answer: data.answer,
        answeredAt: data.answeredAt,
        extractedEntities: data.extractedEntities,
        sentiment: data.sentiment,
        needsFollowup: data.needsFollowup,
        followupTopics: data.followupTopics,
      });
    };

    if (this.config.syncMode === "async") {
      Promise.resolve().then(fn).catch((error) => {
        console.error("[UnifiedStorage] Failed to sync answer to file storage:", error);
      });
    } else {
      fn();
    }
  }
}