/**
 * MemoirOS Chapter Manager
 *
 * Manages memoir chapters with version history, export, and search capabilities
 */
import type { MemoirOSStorage } from "../storage/database.js";
import { type ChapterSave, type CreateChapterRequest, type UpdateChapterRequest, type ChapterResponse, type ChapterListResponse, type ChapterVersionResponse, type ChapterVersionListResponse } from "../schemas/chapter.schemas.js";
import { type PDFExportOptions } from "../utils/pdf-exporter.js";
/**
 * Chapter Manager
 *
 * Manages memoir chapters with version history, export, and search capabilities
 */
export declare class ChapterManager {
    private readonly storage;
    private readonly pdfExporter;
    constructor(storage: MemoirOSStorage);
    /**
     * Close resources
     */
    close(): Promise<void>;
    /**
     * Calculate word and character count for content
     */
    private calculateContentStats;
    /**
     * Create a new chapter
     */
    createChapter(params: CreateChapterRequest): Promise<ChapterResponse>;
    /**
     * Update a chapter (creates a new version)
     */
    updateChapter(params: UpdateChapterRequest): Promise<ChapterResponse>;
    /**
     * Get chapter by ID
     */
    getChapter(chapterId: string, userId: string): ChapterResponse | null;
    /**
     * List chapters for a user with pagination
     */
    listChapters(params: {
        userId: string;
        memoirId?: string;
        status?: ChapterSave["status"];
        type?: ChapterSave["type"];
        page?: number;
        limit?: number;
    }): ChapterListResponse;
    /**
     * Delete a chapter
     */
    deleteChapter(chapterId: string, userId: string): void;
    /**
     * Archive a chapter
     */
    archiveChapter(chapterId: string, userId: string): void;
    /**
     * Publish a chapter
     */
    publishChapter(chapterId: string, userId: string): ChapterResponse;
    /**
     * Get chapter version by ID
     */
    getChapterVersion(versionId: string, userId: string): ChapterVersionResponse | null;
    /**
     * List all versions for a chapter
     */
    listChapterVersions(chapterId: string, userId: string): ChapterVersionListResponse;
    /**
     * Restore chapter to a specific version
     */
    restoreChapterVersion(chapterId: string, versionId: string, userId: string): Promise<ChapterResponse>;
    /**
     * Export chapter as Markdown
     */
    exportChapterAsMarkdown(chapterId: string, userId: string, options?: {
        includeMetadata?: boolean;
        includeTimestamp?: boolean;
    }): string | null;
    /**
     * Export chapter as PDF
     */
    exportChapterAsPDF(chapterId: string, userId: string, outputPath: string, options?: PDFExportOptions): Promise<void>;
    /**
     * Export entire memoir as Markdown
     */
    exportMemoirAsMarkdown(memoirId: string, userId: string, options?: {
        includeMetadata?: boolean;
        includeTimestamp?: boolean;
        title?: string;
    }): string | null;
    /**
     * Export entire memoir as PDF
     */
    exportMemoirAsPDF(memoirId: string, userId: string, outputPath: string, options?: PDFExportOptions): Promise<void>;
    /**
     * Full-text search for chapters
     */
    searchChapters(params: {
        userId: string;
        query: string;
        memoirId?: string;
        status?: ChapterSave["status"];
        limit?: number;
    }): ReadonlyArray<ChapterResponse>;
    /**
     * Get chapter search suggestions
     */
    getChapterSearchSuggestions(userId: string, prefix: string, limit?: number): ReadonlyArray<string>;
    /**
     * Build chapter response from storage data
     */
    private buildChapterResponse;
    /**
     * Build chapter version response from storage data
     */
    private buildChapterVersionResponse;
}
//# sourceMappingURL=chapter-manager.d.ts.map