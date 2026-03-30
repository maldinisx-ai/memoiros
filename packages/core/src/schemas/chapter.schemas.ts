/**
 * Zod schemas for Chapter operations
 */

import { z } from "zod";

/**
 * Chapter status enum
 */
export const chapterStatusSchema = z.enum(["draft", "published", "archived"]);

/**
 * Chapter type enum
 */
export const chapterTypeSchema = z.enum([
  "prologue",
  "childhood",
  "education",
  "career",
  "family",
  "travel",
  "reflections",
  "epilogue",
  "other",
]);

/**
 * Chapter save type (for database storage)
 */
export const chapterSaveSchema = z.object({
  chapterId: z.string().uuid(),
  userId: z.string().min(1).max(100),
  memoirId: z.string().uuid(),
  title: z.string().min(1).max(200),
  status: chapterStatusSchema.default("draft"),
  type: chapterTypeSchema.default("other"),
  order: z.number().int().min(0).default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publishedAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Chapter content save type (for database storage)
 */
export const chapterContentSaveSchema = z.object({
  contentId: z.string().uuid(),
  chapterId: z.string().uuid(),
  content: z.string().min(0).max(1000000), // Up to 1MB of text
  markdown: z.string().min(0).max(1000000).optional(),
  wordCount: z.number().int().min(0).default(0),
  characterCount: z.number().int().min(0).default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Chapter version save type (for version history)
 */
export const chapterVersionSaveSchema = z.object({
  versionId: z.string().uuid(),
  chapterId: z.string().uuid(),
  versionNumber: z.number().int().min(1),
  content: z.string().min(0).max(1000000),
  markdown: z.string().min(0).max(1000000).optional(),
  changeType: z.enum(["create", "update", "minor", "revert"]),
  changeDescription: z.string().min(0).max(500).optional(),
  createdBy: z.string().min(1).max(100).optional(), // User who made the change
  createdAt: z.string().datetime(),
});

/**
 * Chapter query params schema (for API)
 */
export const chapterQuerySchema = z.object({
  userId: z.string().min(1).max(100),
  memoirId: z.string().uuid().optional(),
  status: chapterStatusSchema.optional(),
  type: chapterTypeSchema.optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(["createdAt", "updatedAt", "order", "title"]).optional().default("order"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

/**
 * Create chapter request schema (API)
 */
export const createChapterRequestSchema = z.object({
  userId: z.string().min(1).max(100),
  memoirId: z.string().uuid(),
  title: z.string().min(1).max(200),
  type: chapterTypeSchema.default("other"),
  content: z.string().min(0).max(1000000),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Update chapter request schema (API)
 */
export const updateChapterRequestSchema = z.object({
  chapterId: z.string().uuid(),
  userId: z.string().min(1).max(100),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(0).max(1000000).optional(),
  status: chapterStatusSchema.optional(),
  type: chapterTypeSchema.optional(),
  order: z.number().int().min(0).optional(),
  changeType: z.enum(["update", "minor", "revert"]).default("update"),
  changeDescription: z.string().min(0).max(500).optional(),
});

/**
 * Export chapter request schema (API)
 */
export const exportChapterRequestSchema = z.object({
  chapterId: z.string().uuid(),
  format: z.enum(["markdown", "pdf", "html", "docx"]),
  options: z.object({
    includeMetadata: z.boolean().optional().default(false),
    includeTimestamp: z.boolean().optional().default(true),
    filename: z.string().min(1).max(200).optional(),
  }).optional(),
});

/**
 * Chapter response schema (API)
 */
export const chapterResponseSchema = z.object({
  chapterId: z.string().uuid(),
  userId: z.string().min(1).max(100),
  memoirId: z.string().uuid(),
  title: z.string().min(1).max(200),
  status: chapterStatusSchema,
  type: chapterTypeSchema,
  order: z.number().int().min(0),
  content: z.string().min(0).max(1000000),
  wordCount: z.number().int().min(0),
  characterCount: z.number().int().min(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publishedAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Chapter list response schema (API)
 */
export const chapterListResponseSchema = z.object({
  chapters: z.array(chapterResponseSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalPages: z.number().int().min(0),
});

/**
 * Chapter version response schema (API)
 */
export const chapterVersionResponseSchema = z.object({
  versionId: z.string().uuid(),
  chapterId: z.string().uuid(),
  versionNumber: z.number().int().min(1),
  content: z.string().min(0).max(1000000),
  markdown: z.string().min(0).max(1000000).optional(),
  changeType: z.enum(["create", "update", "minor", "revert"]),
  changeDescription: z.string().min(0).max(500).optional(),
  createdBy: z.string().min(1).max(100).optional(),
  createdAt: z.string().datetime(),
});

/**
 * Chapter version list response schema (API)
 */
export const chapterVersionListResponseSchema = z.object({
  versions: z.array(chapterVersionResponseSchema),
  total: z.number().int().min(0),
});

/**
 * Memoir info schema (for grouping chapters)
 */
export const memoirInfoSchema = z.object({
  memoirId: z.string().uuid(),
  userId: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  description: z.string().min(0).max(1000).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  status: z.enum(["draft", "in_progress", "completed"]).default("draft"),
});

/**
 * Memoir save schema (for database storage)
 */
export const memoirSaveSchema = z.object({
  memoirId: z.string().uuid(),
  userId: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  description: z.string().min(0).max(1000).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  status: z.enum(["draft", "in_progress", "completed"]).default("draft"),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Create memoir request schema (API)
 */
export const createMemoirRequestSchema = z.object({
  userId: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  description: z.string().min(0).max(1000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Update memoir request schema (API)
 */
export const updateMemoirRequestSchema = z.object({
  memoirId: z.string().uuid(),
  userId: z.string().min(1).max(100),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(0).max(1000).optional(),
  status: z.enum(["draft", "in_progress", "completed"]).optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Type exports
 */
export type ChapterSave = z.infer<typeof chapterSaveSchema>;
export type ChapterContentSave = z.infer<typeof chapterContentSaveSchema>;
export type ChapterVersionSave = z.infer<typeof chapterVersionSaveSchema>;
export type ChapterQuery = z.infer<typeof chapterQuerySchema>;
export type CreateChapterRequest = z.infer<typeof createChapterRequestSchema>;
export type UpdateChapterRequest = z.infer<typeof updateChapterRequestSchema>;
export type ExportChapterRequest = z.infer<typeof exportChapterRequestSchema>;
export type ChapterResponse = z.infer<typeof chapterResponseSchema>;
export type ChapterListResponse = z.infer<typeof chapterListResponseSchema>;
export type ChapterVersionResponse = z.infer<typeof chapterVersionResponseSchema>;
export type ChapterVersionListResponse = z.infer<typeof chapterVersionListResponseSchema>;
export type MemoirInfo = z.infer<typeof memoirInfoSchema>;
export type MemoirSave = z.infer<typeof memoirSaveSchema>;
export type CreateMemoirRequest = z.infer<typeof createMemoirRequestSchema>;
export type UpdateMemoirRequest = z.infer<typeof updateMemoirRequestSchema>;
export type ChapterStatus = z.infer<typeof chapterStatusSchema>;
export type ChapterType = z.infer<typeof chapterTypeSchema>;