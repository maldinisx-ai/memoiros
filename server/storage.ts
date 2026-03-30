/**
 * Simple file-based storage for interview data
 */

import { promises as fs } from "fs";
import path from "path";

interface InterviewData {
  readonly interviewId: string;
  readonly userId: string;
  readonly phase: string;
  readonly questions: ReadonlyArray<{ readonly questionId: string; readonly question: string }>;
  readonly answers: ReadonlyArray<{ readonly answerId: string; readonly questionId: string; readonly answer: string; readonly answeredAt: string }>;
}

export class FileStorage {
  private readonly dataDir: string;
  private cache = new Map<string, InterviewData>();

  constructor(dataDir: string = "data") {
    this.dataDir = dataDir;
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      console.log(`[INFO] File storage initialized: ${this.dataDir}`);

      // Load existing data from user directories
      const entries = await fs.readdir(this.dataDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith("user_")) {
          // Load interviews from user directory
          await this.loadInterviewsFromDir(path.join(this.dataDir, entry.name));
        } else if (entry.isFile() && entry.name.endsWith(".json")) {
          // Load legacy interviews (root level, for backward compatibility)
          const interviewId = entry.name.replace(".json", "");
          const content = await fs.readFile(path.join(this.dataDir, entry.name), "utf-8");
          const data = JSON.parse(content) as InterviewData;
          this.cache.set(interviewId, data);
        }
      }
      console.log(`[INFO] Loaded ${this.cache.size} interviews from storage`);
    } catch (error) {
      console.error("[ERROR] Failed to initialize file storage:", error);
    }
  }

  private async loadInterviewsFromDir(dirPath: string): Promise<void> {
    try {
      const files = await fs.readdir(dirPath);
      for (const file of files) {
        if (file.endsWith(".json")) {
          const interviewId = file.replace(".json", "");
          const content = await fs.readFile(path.join(dirPath, file), "utf-8");
          const data = JSON.parse(content) as InterviewData;
          this.cache.set(interviewId, data);
        }
      }
    } catch (error) {
      console.error(`[ERROR] Failed to load interviews from ${dirPath}:`, error);
    }
  }

  async saveInterview(data: InterviewData): Promise<void> {
    this.cache.set(data.interviewId, data);
    const userDir = this.getUserDir(data.userId);
    await fs.mkdir(userDir, { recursive: true });
    const filePath = path.join(userDir, `${data.interviewId}.json`);
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
      console.log(`[INFO] Saved interview: ${filePath}`);
    } catch (error) {
      console.error(`[ERROR] Failed to save interview:`, error);
      throw error;
    }
  }

  private getUserDir(userId: string): string {
    return path.join(this.dataDir, `user_${userId}`);
  }

  async loadInterview(interviewId: string): Promise<InterviewData | null> {
    return this.cache.get(interviewId) ?? null;
  }

  async listInterviews(userId?: string): Promise<ReadonlyArray<InterviewData>> {
    const all = Array.from(this.cache.values());
    if (userId) {
      return all.filter(d => d.userId === userId);
    }
    return all;
  }

  async deleteInterview(interviewId: string): Promise<void> {
    this.cache.delete(interviewId);
    // Find and delete the file
    const userDirs = await fs.readdir(this.dataDir, { withFileTypes: true });
    for (const entry of userDirs) {
      if (entry.isDirectory()) {
        const filePath = path.join(this.dataDir, entry.name, `${interviewId}.json`);
        try {
          await fs.unlink(filePath);
          console.log(`[INFO] Deleted interview: ${filePath}`);
          break;
        } catch {
          // File not in this directory, try next
        }
      } else if (entry.isFile() && entry.name === `${interviewId}.json`) {
        // Legacy file at root level
        const filePath = path.join(this.dataDir, entry.name);
        await fs.unlink(filePath);
        console.log(`[INFO] Deleted legacy interview: ${filePath}`);
        break;
      }
    }
  }

  async deleteUser(userId: string): Promise<void> {
    const userDir = this.getUserDir(userId);
    try {
      // Remove all interviews for this user from cache
      const userInterviews = await this.listInterviews(userId);
      for (const interview of userInterviews) {
        this.cache.delete(interview.interviewId);
      }
      // Delete user directory
      await fs.rm(userDir, { recursive: true, force: true });
      console.log(`[INFO] Deleted user directory: ${userDir}`);
    } catch (error) {
      console.error(`[ERROR] Failed to delete user ${userId}:`, error);
      throw error;
    }
  }
}
