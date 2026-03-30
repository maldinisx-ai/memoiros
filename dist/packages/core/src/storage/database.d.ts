/**
 * MemoirOS Storage Layer
 *
 * SQLite-based persistent storage for interviews, timelines, and voice profiles
 * Includes Zod validation for all data operations
 */
import { type InterviewSave, type QuestionSave, type AnswerSave, type TimelineEventSave, type VoiceProfileSave } from "../schemas/database.schemas.js";
import { type MemCubeItemSave, type MemCubeCollectionSave } from "../schemas/memcube.schemas.js";
import { type MemoirSave, type ChapterSave, type ChapterContentSave, type ChapterVersionSave } from "../schemas/chapter.schemas.js";
/**
 * Database configuration
 */
export interface DatabaseConfig {
    readonly dataDir?: string;
    readonly filename?: string;
}
/**
 * Storage class for managing all database operations
 */
export declare class MemoirOSStorage {
    private readonly db;
    private readonly dbPath;
    constructor(config?: DatabaseConfig);
    /**
     * Initialize database schema
     */
    private initializeSchema;
    /**
     * Save interview state with Zod validation
     */
    saveInterview(interview: InterviewSave): void;
    /**
     * Load interview state
     */
    loadInterview(interviewId: string): {
        readonly interviewId: string;
        readonly userId: string;
        readonly status: "active" | "paused" | "completed";
        readonly startedAt: string;
        readonly completedAt?: string;
        readonly currentPhase: string;
        readonly metadata: Record<string, unknown>;
    } | null;
    /**
     * Save interview question with Zod validation
     */
    saveQuestion(question: QuestionSave): void;
    /**
     * Save interview answer with Zod validation
     */
    saveAnswer(answer: AnswerSave): void;
    /**
     * Load all answers for an interview
     */
    loadAnswers(interviewId: string): ReadonlyArray<{
        readonly answerId: string;
        readonly questionId: string;
        readonly answer: string;
        readonly answeredAt: string;
        readonly extractedEntities?: Record<string, unknown>;
    }>;
    /**
     * Save timeline event with Zod validation
     */
    saveTimelineEvent(event: TimelineEventSave): void;
    /**
     * Load timeline events for a user
     */
    loadTimelineEvents(userId: string): ReadonlyArray<{
        readonly eventId: string;
        readonly timelineId: string;
        readonly date: {
            readonly type: "exact" | "era" | "approximate";
            readonly year?: number;
            readonly month?: number;
            readonly day?: number;
            readonly era?: string;
            readonly range?: number;
        };
        readonly title: string;
        readonly description: string;
        readonly category: string;
        readonly importance: "critical" | "high" | "medium" | "low";
        readonly confidence: number;
    }>;
    /**
     * Save voice profile with Zod validation
     */
    saveVoiceProfile(profile: VoiceProfileSave): void;
    /**
     * Load voice profile for a user
     */
    loadVoiceProfile(userId: string): {
        readonly profileId: string;
        readonly userId: string;
        readonly characteristics: Record<string, unknown>;
        readonly confidence: number;
    } | null;
    /**
     * Save MemCube item with Zod validation
     */
    saveMemCubeItem(item: MemCubeItemSave): void;
    /**
     * Load MemCube item by ID
     */
    loadMemCubeItem(cubeId: string): {
        readonly cubeId: string;
        readonly userId: string;
        readonly itemId: string;
        readonly content: string;
        readonly contentHash: string;
        readonly itemType: "fact" | "interview_answer" | "timeline_event" | "chapter_draft" | "voice_sample" | "reflection";
        readonly sourceId?: string;
        readonly embeddingId?: string;
        readonly embeddingModel?: string;
        readonly status: "draft" | "processing" | "indexed" | "archived" | "deleted";
        readonly createdAt: string;
        readonly updatedAt: string;
        readonly indexedAt?: string;
        readonly keywords: ReadonlyArray<string>;
        readonly semanticTags: ReadonlyArray<string>;
        readonly relatedCubeIds: ReadonlyArray<string>;
        readonly parentCubeId?: string;
        readonly accessCount: number;
        readonly lastAccessedAt?: string;
    } | null;
    /**
     * Update MemCube item embedding ID
     */
    updateMemCubeEmbedding(cubeId: string, embeddingId: string, embeddingModel: string): void;
    /**
     * Update MemCube item status
     */
    updateMemCubeStatus(cubeId: string, status: "draft" | "processing" | "indexed" | "archived" | "deleted", indexedAt?: string): void;
    /**
     * Increment access count for a MemCube item
     */
    incrementMemCubeAccess(cubeId: string): void;
    /**
     * Load all MemCube items for a user
     */
    loadMemCubeItems(userId: string, status?: "draft" | "processing" | "indexed" | "archived" | "deleted"): ReadonlyArray<{
        readonly cubeId: string;
        readonly userId: string;
        readonly itemId: string;
        readonly content: string;
        readonly itemType: string;
        readonly status: string;
        readonly embeddingId?: string;
        readonly sourceId?: string;
        readonly parentCubeId?: string;
        readonly accessCount: number;
        readonly lastAccessedAt?: string;
    }>;
    /**
     * Save MemCube collection with Zod validation
     */
    saveMemCubeCollection(collection: MemCubeCollectionSave): void;
    /**
     * Load MemCube collection by ID
     */
    loadMemCubeCollection(collectionId: string): {
        readonly collectionId: string;
        readonly userId: string;
        readonly name: string;
        readonly description?: string;
        readonly cubeIds: ReadonlyArray<string>;
        readonly parentCollectionId?: string;
        readonly metadata: Record<string, unknown>;
        readonly createdAt: string;
        readonly updatedAt: string;
    } | null;
    /**
     * Load all MemCube collections for a user
     */
    loadMemCubeCollections(userId: string): ReadonlyArray<{
        readonly collectionId: string;
        readonly userId: string;
        readonly name: string;
        readonly description?: string;
        readonly cubeIds: ReadonlyArray<string>;
        readonly parentCollectionId?: string;
        readonly metadata: Record<string, unknown>;
        readonly createdAt: string;
        readonly updatedAt: string;
    }>;
    /**
     * Full-text search on MemCube items using FTS5
     */
    searchMemCubeFTS(params: {
        userId: string;
        query: string;
        itemType?: "interview_answer" | "timeline_event" | "chapter_draft" | "voice_sample" | "fact" | "reflection";
        status?: "draft" | "processing" | "indexed" | "archived" | "deleted";
        limit?: number;
        offset?: number;
    }): ReadonlyArray<{
        readonly cubeId: string;
        readonly userId: string;
        readonly itemId: string;
        readonly content: string;
        readonly itemType: string;
        readonly status: string;
        readonly rank: number;
        readonly bm25: number;
    }>;
    /**
     * Full-text search on interview answers using FTS5
     */
    searchInterviewAnswersFTS(params: {
        userId: string;
        query: string;
        interviewId?: string;
        limit?: number;
        offset?: number;
    }): ReadonlyArray<{
        readonly answerId: string;
        readonly interviewId: string;
        readonly answer: string;
        readonly answeredAt: string;
        readonly rank: number;
        readonly bm25: number;
    }>;
    /**
     * Get search suggestions using FTS5 prefix search
     */
    getSearchSuggestions(params: {
        userId: string;
        prefix: string;
        table: "memcube" | "interview_answers";
        limit?: number;
    }): ReadonlyArray<string>;
    /**
     * Rebuild FTS5 index for MemCube items
     */
    rebuildMemCubeFTSIndex(): void;
    /**
     * Rebuild FTS5 index for interview answers
     */
    rebuildInterviewAnswersFTSIndex(): void;
    /**
     * Get FTS5 statistics
     */
    getFTS5Stats(): {
        memcubeCount: number;
        interviewAnswersCount: number;
        chaptersCount: number;
    };
    /**
     * Rebuild FTS5 index for chapters
     */
    rebuildChaptersFTSIndex(): void;
    /**
     * Search chapters using FTS5
     */
    searchChaptersFTS(params: {
        userId: string;
        query: string;
        memoirId?: string;
        status?: string;
        limit: number;
    }): ReadonlyArray<{
        chapterId: string;
        userId: string;
        memoirId: string;
        title: string;
        content: string;
        type: string;
        status: string;
        bm25: number;
    }>;
    /**
     * Get search suggestions for chapters using FTS5 prefix search
     */
    getChapterSearchSuggestions(userId: string, prefix: string, limit?: number): ReadonlyArray<string>;
    /**
     * Save memoir with Zod validation
     */
    saveMemoir(memoir: MemoirSave): void;
    /**
     * Load memoir by ID
     */
    loadMemoir(memoirId: string): MemoirSave | null;
    /**
     * Load all memoirs for a user
     */
    loadMemoirs(userId: string, status?: MemoirSave["status"]): ReadonlyArray<MemoirSave>;
    /**
     * Delete memoir (and cascade to chapters)
     */
    deleteMemoir(memoirId: string): void;
    /**
     * Save chapter with Zod validation
     */
    saveChapter(chapter: ChapterSave): void;
    /**
     * Save chapter content with Zod validation
     */
    saveChapterContent(content: ChapterContentSave): void;
    /**
     * Load chapter by ID
     */
    loadChapter(chapterId: string): ChapterSave | null;
    /**
     * Load chapter content by chapter ID
     */
    loadChapterContent(chapterId: string): ChapterContentSave | null;
    /**
     * Load all chapters for a user with optional filters
     */
    loadChapters(params: {
        userId: string;
        memoirId?: string;
        status?: ChapterSave["status"];
        type?: ChapterSave["type"];
    }): ReadonlyArray<ChapterSave>;
    /**
     * Update chapter status
     */
    updateChapterStatus(chapterId: string, status: ChapterSave["status"], publishedAt?: string): void;
    /**
     * Update chapter order
     */
    updateChapterOrder(chapterId: string, order: number): void;
    /**
     * Delete chapter (cascade to content and versions)
     */
    deleteChapter(chapterId: string): void;
    /**
     * Archive chapter (soft delete)
     */
    archiveChapter(chapterId: string): void;
    /**
     * Get next chapter order for a memoir
     */
    getNextChapterOrder(memoirId: string): number;
    /**
     * Save chapter version with Zod validation
     */
    saveChapterVersion(version: ChapterVersionSave): void;
    /**
     * Load chapter version by ID
     */
    loadChapterVersion(versionId: string): ChapterVersionSave | null;
    /**
     * Load all versions for a chapter
     */
    loadChapterVersions(chapterId: string): ReadonlyArray<ChapterVersionSave>;
    /**
     * Get latest version number for a chapter
     */
    getLatestChapterVersionNumber(chapterId: string): number;
    /**
     * Delete chapter versions
     */
    deleteChapterVersions(chapterId: string): void;
    /**
     * Delete old chapter versions (keep only latest N)
     */
    pruneOldChapterVersions(chapterId: string, keepCount?: number): void;
    /**
     * Export chapter as Markdown
     */
    exportChapterAsMarkdown(chapterId: string): string | null;
    /**
     * Export chapters for a memoir as combined Markdown
     */
    exportMemoirAsMarkdown(memoirId: string): string | null;
    /**
     * Close database connection
     */
    close(): void;
    /**
     * Get database path (for debugging)
     */
    getDatabasePath(): string;
    /**
     * Execute a transaction with automatic rollback on error
     *
     * @param callback - Function to execute within the transaction
     * @returns The result of the callback
     * @throws If the callback throws, the transaction is rolled back
     */
    transaction<T>(callback: () => T): T;
    /**
     * Execute an immediate transaction (for better concurrency)
     *
     * @param callback - Function to execute within the transaction
     * @returns The result of the callback
     */
    transactionImmediate<T>(callback: () => T): T;
    /**
     * Execute an exclusive transaction (for write-heavy operations)
     *
     * @param callback - Function to execute within the transaction
     * @returns The result of the callback
     */
    transactionExclusive<T>(callback: () => T): T;
    /**
     * Get all data for a specific user (user isolation)
     *
     * @param userId - The user ID
     * @returns All user data including interviews, timeline events, voice profile, and MemCube items
     */
    getUserData(userId: string): {
        interviews: ReadonlyArray<{
            interviewId: string;
            userId: string;
            status: "active" | "paused" | "completed";
            startedAt: string;
            completedAt?: string;
            currentPhase: string;
            metadata: Record<string, unknown>;
        }>;
        timelineEvents: ReadonlyArray<{
            eventId: string;
            timelineId: string;
            userId: string;
            date: {
                type: "exact" | "era" | "approximate";
                year?: number;
                month?: number;
                day?: number;
                era?: string;
                range?: number;
            };
            title: string;
            description: string;
            category: string;
            importance: "critical" | "high" | "medium" | "low";
            confidence: number;
        }>;
        voiceProfile: {
            profileId: string;
            userId: string;
            characteristics: Record<string, unknown>;
            confidence: number;
        } | null;
        memcubeItems: ReadonlyArray<{
            cubeId: string;
            itemId: string;
            content: string;
            itemType: string;
            status: string;
            embeddingId?: string;
        }>;
    };
    /**
     * Delete all data for a specific user (transaction-protected)
     *
     * @param userId - The user ID to delete
     */
    deleteUser(userId: string): void;
    /**
     * Create a savepoint for nested transactions
     *
     * @param savepointName - Name for the savepoint
     * @returns An object with release and rollback methods
     */
    createSavepoint(savepointName: string): {
        release: () => void;
        rollback: () => void;
    };
}
//# sourceMappingURL=database.d.ts.map