/**
 * MemoirOS Chapter Manager
 *
 * Manages memoir chapters with version history, export, and search capabilities
 */
import { randomUUID } from "node:crypto";
import { chapterSaveSchema, chapterContentSaveSchema, chapterVersionSaveSchema, createChapterRequestSchema, updateChapterRequestSchema, chapterResponseSchema, chapterVersionResponseSchema, } from "../schemas/chapter.schemas.js";
import { PDFExporter } from "../utils/pdf-exporter.js";
/**
 * Chapter Manager
 *
 * Manages memoir chapters with version history, export, and search capabilities
 */
export class ChapterManager {
    storage;
    pdfExporter;
    constructor(storage) {
        this.storage = storage;
        this.pdfExporter = new PDFExporter();
    }
    /**
     * Close resources
     */
    async close() {
        await this.pdfExporter.close();
    }
    /**
     * Calculate word and character count for content
     */
    calculateContentStats(content) {
        // Count words (split by whitespace, filter empty strings)
        const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
        // Count characters (excluding whitespace)
        const characterCount = content.replace(/\s/g, "").length;
        return { wordCount, characterCount };
    }
    /**
     * Create a new chapter
     */
    async createChapter(params) {
        const validated = createChapterRequestSchema.parse(params);
        const now = new Date().toISOString();
        const chapterId = randomUUID();
        const contentId = randomUUID();
        // Get next order for the memoir
        const order = this.storage.getNextChapterOrder(validated.memoirId);
        // Calculate content stats
        const stats = this.calculateContentStats(validated.content);
        // Create chapter
        const chapter = chapterSaveSchema.parse({
            chapterId,
            userId: validated.userId,
            memoirId: validated.memoirId,
            title: validated.title,
            status: "draft",
            type: validated.type,
            order,
            createdAt: now,
            updatedAt: now,
            metadata: validated.metadata ?? {},
        });
        // Create chapter content
        const content = chapterContentSaveSchema.parse({
            contentId,
            chapterId,
            content: validated.content,
            wordCount: stats.wordCount,
            characterCount: stats.characterCount,
            createdAt: now,
            updatedAt: now,
        });
        // Use transaction for atomic operation
        this.storage.transaction(() => {
            this.storage.saveChapter(chapter);
            this.storage.saveChapterContent(content);
            // Create initial version
            const version = chapterVersionSaveSchema.parse({
                versionId: randomUUID(),
                chapterId,
                versionNumber: 1,
                content: validated.content,
                changeType: "create",
                changeDescription: "Initial chapter creation",
                createdAt: now,
            });
            this.storage.saveChapterVersion(version);
        });
        return this.buildChapterResponse(chapter, content);
    }
    /**
     * Update a chapter (creates a new version)
     */
    async updateChapter(params) {
        const validated = updateChapterRequestSchema.parse(params);
        const now = new Date().toISOString();
        // Load existing chapter
        const existingChapter = this.storage.loadChapter(validated.chapterId);
        if (!existingChapter) {
            throw new Error(`Chapter not found: ${validated.chapterId}`);
        }
        // Validate user ownership
        if (existingChapter.userId !== validated.userId) {
            throw new Error(`Unauthorized: User does not own this chapter`);
        }
        // Load existing content
        const existingContent = this.storage.loadChapterContent(validated.chapterId);
        if (!existingContent) {
            throw new Error(`Chapter content not found: ${validated.chapterId}`);
        }
        // Get next version number
        const nextVersionNumber = this.storage.getLatestChapterVersionNumber(validated.chapterId) + 1;
        // Use transaction for atomic operation
        return this.storage.transaction(() => {
            // Update chapter metadata
            if (validated.title || validated.status !== undefined || validated.type !== undefined || validated.order !== undefined) {
                const updatedChapter = {
                    ...existingChapter,
                    title: validated.title ?? existingChapter.title,
                    status: validated.status ?? existingChapter.status,
                    type: validated.type ?? existingChapter.type,
                    order: validated.order ?? existingChapter.order,
                    updatedAt: now,
                    publishedAt: validated.status === "published" && existingChapter.status !== "published"
                        ? now
                        : existingChapter.publishedAt,
                };
                this.storage.saveChapter(updatedChapter);
            }
            // Update content if provided
            if (validated.content !== undefined) {
                const stats = this.calculateContentStats(validated.content);
                const updatedContent = {
                    ...existingContent,
                    content: validated.content,
                    wordCount: stats.wordCount,
                    characterCount: stats.characterCount,
                    updatedAt: now,
                };
                this.storage.saveChapterContent(updatedContent);
                // Create version for content change
                const version = chapterVersionSaveSchema.parse({
                    versionId: randomUUID(),
                    chapterId: validated.chapterId,
                    versionNumber: nextVersionNumber,
                    content: validated.content,
                    changeType: validated.changeType,
                    changeDescription: validated.changeDescription,
                    createdAt: now,
                });
                this.storage.saveChapterVersion(version);
            }
            // Reload and return updated chapter
            const chapter = this.storage.loadChapter(validated.chapterId);
            const content = this.storage.loadChapterContent(validated.chapterId);
            if (!chapter || !content) {
                throw new Error(`Failed to reload chapter: ${validated.chapterId}`);
            }
            return this.buildChapterResponse(chapter, content);
        });
    }
    /**
     * Get chapter by ID
     */
    getChapter(chapterId, userId) {
        const chapter = this.storage.loadChapter(chapterId);
        if (!chapter) {
            return null;
        }
        // Validate user ownership
        if (chapter.userId !== userId) {
            throw new Error(`Unauthorized: User does not own this chapter`);
        }
        const content = this.storage.loadChapterContent(chapterId);
        if (!content) {
            return null;
        }
        return this.buildChapterResponse(chapter, content);
    }
    /**
     * List chapters for a user with pagination
     */
    listChapters(params) {
        const page = params.page ?? 1;
        const limit = params.limit ?? 20;
        const offset = (page - 1) * limit;
        // Get all matching chapters
        const allChapters = this.storage.loadChapters({
            userId: params.userId,
            memoirId: params.memoirId,
            status: params.status,
            type: params.type,
        });
        // Apply pagination
        const total = allChapters.length;
        const paginatedChapters = allChapters.slice(offset, offset + limit);
        const totalPages = Math.ceil(total / limit);
        // Build response
        const chapters = [];
        for (const chapter of paginatedChapters) {
            const content = this.storage.loadChapterContent(chapter.chapterId);
            if (content) {
                chapters.push(this.buildChapterResponse(chapter, content));
            }
        }
        return {
            chapters,
            total,
            page,
            limit,
            totalPages,
        };
    }
    /**
     * Delete a chapter
     */
    deleteChapter(chapterId, userId) {
        const chapter = this.storage.loadChapter(chapterId);
        if (!chapter) {
            throw new Error(`Chapter not found: ${chapterId}`);
        }
        // Validate user ownership
        if (chapter.userId !== userId) {
            throw new Error(`Unauthorized: User does not own this chapter`);
        }
        this.storage.transaction(() => {
            this.storage.deleteChapter(chapterId);
        });
    }
    /**
     * Archive a chapter
     */
    archiveChapter(chapterId, userId) {
        const chapter = this.storage.loadChapter(chapterId);
        if (!chapter) {
            throw new Error(`Chapter not found: ${chapterId}`);
        }
        // Validate user ownership
        if (chapter.userId !== userId) {
            throw new Error(`Unauthorized: User does not own this chapter`);
        }
        this.storage.archiveChapter(chapterId);
    }
    /**
     * Publish a chapter
     */
    publishChapter(chapterId, userId) {
        const chapter = this.storage.loadChapter(chapterId);
        if (!chapter) {
            throw new Error(`Chapter not found: ${chapterId}`);
        }
        // Validate user ownership
        if (chapter.userId !== userId) {
            throw new Error(`Unauthorized: User does not own this chapter`);
        }
        this.storage.updateChapterStatus(chapterId, "published", new Date().toISOString());
        // Reload and return updated chapter
        const updatedChapter = this.storage.loadChapter(chapterId);
        const content = this.storage.loadChapterContent(chapterId);
        if (!updatedChapter || !content) {
            throw new Error(`Failed to reload chapter: ${chapterId}`);
        }
        return this.buildChapterResponse(updatedChapter, content);
    }
    // ============================================
    // Version History Operations
    // ============================================
    /**
     * Get chapter version by ID
     */
    getChapterVersion(versionId, userId) {
        const version = this.storage.loadChapterVersion(versionId);
        if (!version) {
            return null;
        }
        // Validate user ownership
        const chapter = this.storage.loadChapter(version.chapterId);
        if (!chapter || chapter.userId !== userId) {
            throw new Error(`Unauthorized: User does not own this chapter`);
        }
        return this.buildChapterVersionResponse(version);
    }
    /**
     * List all versions for a chapter
     */
    listChapterVersions(chapterId, userId) {
        const chapter = this.storage.loadChapter(chapterId);
        if (!chapter) {
            throw new Error(`Chapter not found: ${chapterId}`);
        }
        // Validate user ownership
        if (chapter.userId !== userId) {
            throw new Error(`Unauthorized: User does not own this chapter`);
        }
        const versions = this.storage.loadChapterVersions(chapterId);
        return {
            versions: versions.map(v => this.buildChapterVersionResponse(v)),
            total: versions.length,
        };
    }
    /**
     * Restore chapter to a specific version
     */
    async restoreChapterVersion(chapterId, versionId, userId) {
        const chapter = this.storage.loadChapter(chapterId);
        if (!chapter) {
            throw new Error(`Chapter not found: ${chapterId}`);
        }
        // Validate user ownership
        if (chapter.userId !== userId) {
            throw new Error(`Unauthorized: User does not own this chapter`);
        }
        const version = this.storage.loadChapterVersion(versionId);
        if (!version) {
            throw new Error(`Version not found: ${versionId}`);
        }
        if (version.chapterId !== chapterId) {
            throw new Error(`Version does not belong to this chapter`);
        }
        // Restore content
        const content = this.storage.loadChapterContent(chapterId);
        if (!content) {
            throw new Error(`Chapter content not found: ${chapterId}`);
        }
        const stats = this.calculateContentStats(version.content);
        const now = new Date().toISOString();
        const updatedContent = {
            ...content,
            content: version.content,
            wordCount: stats.wordCount,
            characterCount: stats.characterCount,
            updatedAt: now,
        };
        // Use transaction
        return this.storage.transaction(() => {
            this.storage.saveChapterContent(updatedContent);
            // Create revert version
            const nextVersionNumber = this.storage.getLatestChapterVersionNumber(chapterId) + 1;
            const revertVersion = chapterVersionSaveSchema.parse({
                versionId: randomUUID(),
                chapterId,
                versionNumber: nextVersionNumber,
                content: version.content,
                changeType: "revert",
                changeDescription: `Restored from version ${version.versionNumber}`,
                createdAt: now,
            });
            this.storage.saveChapterVersion(revertVersion);
            // Reload and return
            const reloadedChapter = this.storage.loadChapter(chapterId);
            const reloadedContent = this.storage.loadChapterContent(chapterId);
            if (!reloadedChapter || !reloadedContent) {
                throw new Error(`Failed to reload chapter: ${chapterId}`);
            }
            return this.buildChapterResponse(reloadedChapter, reloadedContent);
        });
    }
    // ============================================
    // Export Operations
    // ============================================
    /**
     * Export chapter as Markdown
     */
    exportChapterAsMarkdown(chapterId, userId, options) {
        const chapter = this.storage.loadChapter(chapterId);
        if (!chapter) {
            throw new Error(`Chapter not found: ${chapterId}`);
        }
        // Validate user ownership
        if (chapter.userId !== userId) {
            throw new Error(`Unauthorized: User does not own this chapter`);
        }
        const content = this.storage.loadChapterContent(chapterId);
        if (!content) {
            throw new Error(`Chapter content not found: ${chapterId}`);
        }
        const includeMetadata = options?.includeMetadata ?? false;
        const includeTimestamp = options?.includeTimestamp ?? true;
        let markdown = `# ${chapter.title}\n\n`;
        if (includeMetadata) {
            markdown += `**Type:** ${chapter.type}\n`;
            markdown += `**Status:** ${chapter.status}\n`;
            if (includeTimestamp) {
                markdown += `**Created:** ${new Date(chapter.createdAt).toLocaleString()}\n`;
                markdown += `**Updated:** ${new Date(chapter.updatedAt).toLocaleString()}\n`;
                if (chapter.publishedAt) {
                    markdown += `**Published:** ${new Date(chapter.publishedAt).toLocaleString()}\n`;
                }
            }
            markdown += `\n`;
        }
        markdown += `---\n\n`;
        if (content.markdown) {
            markdown += content.markdown;
        }
        else {
            markdown += content.content;
        }
        return markdown;
    }
    /**
     * Export chapter as PDF
     */
    async exportChapterAsPDF(chapterId, userId, outputPath, options) {
        const chapter = this.storage.loadChapter(chapterId);
        if (!chapter) {
            throw new Error(`Chapter not found: ${chapterId}`);
        }
        // Validate user ownership
        if (chapter.userId !== userId) {
            throw new Error(`Unauthorized: User does not own this chapter`);
        }
        const content = this.storage.loadChapterContent(chapterId);
        if (!content) {
            throw new Error(`Chapter content not found: ${chapterId}`);
        }
        const chapterResponse = this.buildChapterResponse(chapter, content);
        await this.pdfExporter.exportChapter(chapterResponse, outputPath, options);
    }
    /**
     * Export entire memoir as Markdown
     */
    exportMemoirAsMarkdown(memoirId, userId, options) {
        const memoir = this.storage.loadMemoir(memoirId);
        if (!memoir) {
            throw new Error(`Memoir not found: ${memoirId}`);
        }
        // Validate user ownership
        if (memoir.userId !== userId) {
            throw new Error(`Unauthorized: User does not own this memoir`);
        }
        const chapters = this.storage.loadChapters({ userId, memoirId });
        if (chapters.length === 0) {
            return null;
        }
        const includeMetadata = options?.includeMetadata ?? false;
        const includeTimestamp = options?.includeTimestamp ?? true;
        const title = options?.title ?? memoir.title;
        let markdown = `# ${title}\n\n`;
        if (includeMetadata && includeTimestamp) {
            markdown += `**Export Date:** ${new Date().toLocaleString()}\n`;
            markdown += `**Chapter Count:** ${chapters.length}\n`;
            if (memoir.description) {
                markdown += `**Description:** ${memoir.description}\n`;
            }
            markdown += `\n`;
        }
        markdown += `---\n\n`;
        for (const chapter of chapters) {
            const chapterMarkdown = this.exportChapterAsMarkdown(chapter.chapterId, userId, { includeMetadata, includeTimestamp });
            if (chapterMarkdown) {
                markdown += chapterMarkdown + "\n\n";
                markdown += `---\n\n`;
            }
        }
        return markdown;
    }
    /**
     * Export entire memoir as PDF
     */
    async exportMemoirAsPDF(memoirId, userId, outputPath, options) {
        const memoir = this.storage.loadMemoir(memoirId);
        if (!memoir) {
            throw new Error(`Memoir not found: ${memoirId}`);
        }
        // Validate user ownership
        if (memoir.userId !== userId) {
            throw new Error(`Unauthorized: User does not own this memoir`);
        }
        const chapters = this.storage.loadChapters({ userId, memoirId });
        if (chapters.length === 0) {
            throw new Error(`No chapters found for memoir: ${memoirId}`);
        }
        const chapterResponses = [];
        for (const chapter of chapters) {
            const content = this.storage.loadChapterContent(chapter.chapterId);
            if (content) {
                chapterResponses.push(this.buildChapterResponse(chapter, content));
            }
        }
        await this.pdfExporter.exportMemoir(memoir, chapterResponses, outputPath, options);
    }
    // ============================================
    // Search Operations
    // ============================================
    /**
     * Full-text search for chapters
     */
    searchChapters(params) {
        const ftsResults = this.storage.searchChaptersFTS({
            userId: params.userId,
            query: params.query,
            memoirId: params.memoirId,
            status: params.status,
            limit: params.limit ?? 20,
        });
        const results = [];
        for (const result of ftsResults) {
            const chapter = this.storage.loadChapter(result.chapterId);
            const content = this.storage.loadChapterContent(result.chapterId);
            if (chapter && content) {
                results.push(this.buildChapterResponse(chapter, content));
            }
        }
        return results;
    }
    /**
     * Get chapter search suggestions
     */
    getChapterSearchSuggestions(userId, prefix, limit = 10) {
        return this.storage.getChapterSearchSuggestions(userId, prefix, limit);
    }
    // ============================================
    // Helper Methods
    // ============================================
    /**
     * Build chapter response from storage data
     */
    buildChapterResponse(chapter, content) {
        return chapterResponseSchema.parse({
            chapterId: chapter.chapterId,
            userId: chapter.userId,
            memoirId: chapter.memoirId,
            title: chapter.title,
            status: chapter.status,
            type: chapter.type,
            order: chapter.order,
            content: content.content,
            wordCount: content.wordCount,
            characterCount: content.characterCount,
            createdAt: chapter.createdAt,
            updatedAt: chapter.updatedAt,
            publishedAt: chapter.publishedAt,
            metadata: chapter.metadata,
        });
    }
    /**
     * Build chapter version response from storage data
     */
    buildChapterVersionResponse(version) {
        return chapterVersionResponseSchema.parse({
            versionId: version.versionId,
            chapterId: version.chapterId,
            versionNumber: version.versionNumber,
            content: version.content,
            markdown: version.markdown,
            changeType: version.changeType,
            changeDescription: version.changeDescription,
            createdBy: version.createdBy,
            createdAt: version.createdAt,
        });
    }
}
//# sourceMappingURL=chapter-manager.js.map