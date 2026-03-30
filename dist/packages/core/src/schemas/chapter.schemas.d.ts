/**
 * Zod schemas for Chapter operations
 */
import { z } from "zod";
/**
 * Chapter status enum
 */
export declare const chapterStatusSchema: z.ZodEnum<["draft", "published", "archived"]>;
/**
 * Chapter type enum
 */
export declare const chapterTypeSchema: z.ZodEnum<["prologue", "childhood", "education", "career", "family", "travel", "reflections", "epilogue", "other"]>;
/**
 * Chapter save type (for database storage)
 */
export declare const chapterSaveSchema: z.ZodObject<{
    chapterId: z.ZodString;
    userId: z.ZodString;
    memoirId: z.ZodString;
    title: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<["draft", "published", "archived"]>>;
    type: z.ZodDefault<z.ZodEnum<["prologue", "childhood", "education", "career", "family", "travel", "reflections", "epilogue", "other"]>>;
    order: z.ZodDefault<z.ZodNumber>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    publishedAt: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    status: "draft" | "archived" | "published";
    type: "childhood" | "education" | "career" | "family" | "reflections" | "travel" | "prologue" | "epilogue" | "other";
    userId: string;
    createdAt: string;
    updatedAt: string;
    chapterId: string;
    memoirId: string;
    order: number;
    metadata?: Record<string, unknown> | undefined;
    publishedAt?: string | undefined;
}, {
    title: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    chapterId: string;
    memoirId: string;
    status?: "draft" | "archived" | "published" | undefined;
    type?: "childhood" | "education" | "career" | "family" | "reflections" | "travel" | "prologue" | "epilogue" | "other" | undefined;
    metadata?: Record<string, unknown> | undefined;
    order?: number | undefined;
    publishedAt?: string | undefined;
}>;
/**
 * Chapter content save type (for database storage)
 */
export declare const chapterContentSaveSchema: z.ZodObject<{
    contentId: z.ZodString;
    chapterId: z.ZodString;
    content: z.ZodString;
    markdown: z.ZodOptional<z.ZodString>;
    wordCount: z.ZodDefault<z.ZodNumber>;
    characterCount: z.ZodDefault<z.ZodNumber>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
    createdAt: string;
    updatedAt: string;
    chapterId: string;
    contentId: string;
    wordCount: number;
    characterCount: number;
    markdown?: string | undefined;
}, {
    content: string;
    createdAt: string;
    updatedAt: string;
    chapterId: string;
    contentId: string;
    markdown?: string | undefined;
    wordCount?: number | undefined;
    characterCount?: number | undefined;
}>;
/**
 * Chapter version save type (for version history)
 */
export declare const chapterVersionSaveSchema: z.ZodObject<{
    versionId: z.ZodString;
    chapterId: z.ZodString;
    versionNumber: z.ZodNumber;
    content: z.ZodString;
    markdown: z.ZodOptional<z.ZodString>;
    changeType: z.ZodEnum<["create", "update", "minor", "revert"]>;
    changeDescription: z.ZodOptional<z.ZodString>;
    createdBy: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
    createdAt: string;
    chapterId: string;
    versionId: string;
    versionNumber: number;
    changeType: "create" | "update" | "minor" | "revert";
    markdown?: string | undefined;
    changeDescription?: string | undefined;
    createdBy?: string | undefined;
}, {
    content: string;
    createdAt: string;
    chapterId: string;
    versionId: string;
    versionNumber: number;
    changeType: "create" | "update" | "minor" | "revert";
    markdown?: string | undefined;
    changeDescription?: string | undefined;
    createdBy?: string | undefined;
}>;
/**
 * Chapter query params schema (for API)
 */
export declare const chapterQuerySchema: z.ZodObject<{
    userId: z.ZodString;
    memoirId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["draft", "published", "archived"]>>;
    type: z.ZodOptional<z.ZodEnum<["prologue", "childhood", "education", "career", "family", "travel", "reflections", "epilogue", "other"]>>;
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["createdAt", "updatedAt", "order", "title"]>>>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    page: number;
    limit: number;
    sortBy: "title" | "createdAt" | "updatedAt" | "order";
    sortOrder: "asc" | "desc";
    status?: "draft" | "archived" | "published" | undefined;
    type?: "childhood" | "education" | "career" | "family" | "reflections" | "travel" | "prologue" | "epilogue" | "other" | undefined;
    memoirId?: string | undefined;
}, {
    userId: string;
    status?: "draft" | "archived" | "published" | undefined;
    type?: "childhood" | "education" | "career" | "family" | "reflections" | "travel" | "prologue" | "epilogue" | "other" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: "title" | "createdAt" | "updatedAt" | "order" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    memoirId?: string | undefined;
}>;
/**
 * Create chapter request schema (API)
 */
export declare const createChapterRequestSchema: z.ZodObject<{
    userId: z.ZodString;
    memoirId: z.ZodString;
    title: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<["prologue", "childhood", "education", "career", "family", "travel", "reflections", "epilogue", "other"]>>;
    content: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    content: string;
    title: string;
    type: "childhood" | "education" | "career" | "family" | "reflections" | "travel" | "prologue" | "epilogue" | "other";
    userId: string;
    memoirId: string;
    metadata?: Record<string, unknown> | undefined;
}, {
    content: string;
    title: string;
    userId: string;
    memoirId: string;
    type?: "childhood" | "education" | "career" | "family" | "reflections" | "travel" | "prologue" | "epilogue" | "other" | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
/**
 * Update chapter request schema (API)
 */
export declare const updateChapterRequestSchema: z.ZodObject<{
    chapterId: z.ZodString;
    userId: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["draft", "published", "archived"]>>;
    type: z.ZodOptional<z.ZodEnum<["prologue", "childhood", "education", "career", "family", "travel", "reflections", "epilogue", "other"]>>;
    order: z.ZodOptional<z.ZodNumber>;
    changeType: z.ZodDefault<z.ZodEnum<["update", "minor", "revert"]>>;
    changeDescription: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    chapterId: string;
    changeType: "update" | "minor" | "revert";
    content?: string | undefined;
    title?: string | undefined;
    status?: "draft" | "archived" | "published" | undefined;
    type?: "childhood" | "education" | "career" | "family" | "reflections" | "travel" | "prologue" | "epilogue" | "other" | undefined;
    order?: number | undefined;
    changeDescription?: string | undefined;
}, {
    userId: string;
    chapterId: string;
    content?: string | undefined;
    title?: string | undefined;
    status?: "draft" | "archived" | "published" | undefined;
    type?: "childhood" | "education" | "career" | "family" | "reflections" | "travel" | "prologue" | "epilogue" | "other" | undefined;
    order?: number | undefined;
    changeType?: "update" | "minor" | "revert" | undefined;
    changeDescription?: string | undefined;
}>;
/**
 * Export chapter request schema (API)
 */
export declare const exportChapterRequestSchema: z.ZodObject<{
    chapterId: z.ZodString;
    format: z.ZodEnum<["markdown", "pdf", "html", "docx"]>;
    options: z.ZodOptional<z.ZodObject<{
        includeMetadata: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeTimestamp: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        filename: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        includeMetadata: boolean;
        includeTimestamp: boolean;
        filename?: string | undefined;
    }, {
        filename?: string | undefined;
        includeMetadata?: boolean | undefined;
        includeTimestamp?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    chapterId: string;
    format: "markdown" | "pdf" | "html" | "docx";
    options?: {
        includeMetadata: boolean;
        includeTimestamp: boolean;
        filename?: string | undefined;
    } | undefined;
}, {
    chapterId: string;
    format: "markdown" | "pdf" | "html" | "docx";
    options?: {
        filename?: string | undefined;
        includeMetadata?: boolean | undefined;
        includeTimestamp?: boolean | undefined;
    } | undefined;
}>;
/**
 * Chapter response schema (API)
 */
export declare const chapterResponseSchema: z.ZodObject<{
    chapterId: z.ZodString;
    userId: z.ZodString;
    memoirId: z.ZodString;
    title: z.ZodString;
    status: z.ZodEnum<["draft", "published", "archived"]>;
    type: z.ZodEnum<["prologue", "childhood", "education", "career", "family", "travel", "reflections", "epilogue", "other"]>;
    order: z.ZodNumber;
    content: z.ZodString;
    wordCount: z.ZodNumber;
    characterCount: z.ZodNumber;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    publishedAt: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    content: string;
    title: string;
    status: "draft" | "archived" | "published";
    type: "childhood" | "education" | "career" | "family" | "reflections" | "travel" | "prologue" | "epilogue" | "other";
    userId: string;
    createdAt: string;
    updatedAt: string;
    chapterId: string;
    memoirId: string;
    order: number;
    wordCount: number;
    characterCount: number;
    metadata?: Record<string, unknown> | undefined;
    publishedAt?: string | undefined;
}, {
    content: string;
    title: string;
    status: "draft" | "archived" | "published";
    type: "childhood" | "education" | "career" | "family" | "reflections" | "travel" | "prologue" | "epilogue" | "other";
    userId: string;
    createdAt: string;
    updatedAt: string;
    chapterId: string;
    memoirId: string;
    order: number;
    wordCount: number;
    characterCount: number;
    metadata?: Record<string, unknown> | undefined;
    publishedAt?: string | undefined;
}>;
/**
 * Chapter list response schema (API)
 */
export declare const chapterListResponseSchema: z.ZodObject<{
    chapters: z.ZodArray<z.ZodObject<{
        chapterId: z.ZodString;
        userId: z.ZodString;
        memoirId: z.ZodString;
        title: z.ZodString;
        status: z.ZodEnum<["draft", "published", "archived"]>;
        type: z.ZodEnum<["prologue", "childhood", "education", "career", "family", "travel", "reflections", "epilogue", "other"]>;
        order: z.ZodNumber;
        content: z.ZodString;
        wordCount: z.ZodNumber;
        characterCount: z.ZodNumber;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        publishedAt: z.ZodOptional<z.ZodString>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        content: string;
        title: string;
        status: "draft" | "archived" | "published";
        type: "childhood" | "education" | "career" | "family" | "reflections" | "travel" | "prologue" | "epilogue" | "other";
        userId: string;
        createdAt: string;
        updatedAt: string;
        chapterId: string;
        memoirId: string;
        order: number;
        wordCount: number;
        characterCount: number;
        metadata?: Record<string, unknown> | undefined;
        publishedAt?: string | undefined;
    }, {
        content: string;
        title: string;
        status: "draft" | "archived" | "published";
        type: "childhood" | "education" | "career" | "family" | "reflections" | "travel" | "prologue" | "epilogue" | "other";
        userId: string;
        createdAt: string;
        updatedAt: string;
        chapterId: string;
        memoirId: string;
        order: number;
        wordCount: number;
        characterCount: number;
        metadata?: Record<string, unknown> | undefined;
        publishedAt?: string | undefined;
    }>, "many">;
    total: z.ZodNumber;
    page: z.ZodNumber;
    limit: z.ZodNumber;
    totalPages: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    chapters: {
        content: string;
        title: string;
        status: "draft" | "archived" | "published";
        type: "childhood" | "education" | "career" | "family" | "reflections" | "travel" | "prologue" | "epilogue" | "other";
        userId: string;
        createdAt: string;
        updatedAt: string;
        chapterId: string;
        memoirId: string;
        order: number;
        wordCount: number;
        characterCount: number;
        metadata?: Record<string, unknown> | undefined;
        publishedAt?: string | undefined;
    }[];
    total: number;
    totalPages: number;
}, {
    page: number;
    limit: number;
    chapters: {
        content: string;
        title: string;
        status: "draft" | "archived" | "published";
        type: "childhood" | "education" | "career" | "family" | "reflections" | "travel" | "prologue" | "epilogue" | "other";
        userId: string;
        createdAt: string;
        updatedAt: string;
        chapterId: string;
        memoirId: string;
        order: number;
        wordCount: number;
        characterCount: number;
        metadata?: Record<string, unknown> | undefined;
        publishedAt?: string | undefined;
    }[];
    total: number;
    totalPages: number;
}>;
/**
 * Chapter version response schema (API)
 */
export declare const chapterVersionResponseSchema: z.ZodObject<{
    versionId: z.ZodString;
    chapterId: z.ZodString;
    versionNumber: z.ZodNumber;
    content: z.ZodString;
    markdown: z.ZodOptional<z.ZodString>;
    changeType: z.ZodEnum<["create", "update", "minor", "revert"]>;
    changeDescription: z.ZodOptional<z.ZodString>;
    createdBy: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
    createdAt: string;
    chapterId: string;
    versionId: string;
    versionNumber: number;
    changeType: "create" | "update" | "minor" | "revert";
    markdown?: string | undefined;
    changeDescription?: string | undefined;
    createdBy?: string | undefined;
}, {
    content: string;
    createdAt: string;
    chapterId: string;
    versionId: string;
    versionNumber: number;
    changeType: "create" | "update" | "minor" | "revert";
    markdown?: string | undefined;
    changeDescription?: string | undefined;
    createdBy?: string | undefined;
}>;
/**
 * Chapter version list response schema (API)
 */
export declare const chapterVersionListResponseSchema: z.ZodObject<{
    versions: z.ZodArray<z.ZodObject<{
        versionId: z.ZodString;
        chapterId: z.ZodString;
        versionNumber: z.ZodNumber;
        content: z.ZodString;
        markdown: z.ZodOptional<z.ZodString>;
        changeType: z.ZodEnum<["create", "update", "minor", "revert"]>;
        changeDescription: z.ZodOptional<z.ZodString>;
        createdBy: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        content: string;
        createdAt: string;
        chapterId: string;
        versionId: string;
        versionNumber: number;
        changeType: "create" | "update" | "minor" | "revert";
        markdown?: string | undefined;
        changeDescription?: string | undefined;
        createdBy?: string | undefined;
    }, {
        content: string;
        createdAt: string;
        chapterId: string;
        versionId: string;
        versionNumber: number;
        changeType: "create" | "update" | "minor" | "revert";
        markdown?: string | undefined;
        changeDescription?: string | undefined;
        createdBy?: string | undefined;
    }>, "many">;
    total: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    total: number;
    versions: {
        content: string;
        createdAt: string;
        chapterId: string;
        versionId: string;
        versionNumber: number;
        changeType: "create" | "update" | "minor" | "revert";
        markdown?: string | undefined;
        changeDescription?: string | undefined;
        createdBy?: string | undefined;
    }[];
}, {
    total: number;
    versions: {
        content: string;
        createdAt: string;
        chapterId: string;
        versionId: string;
        versionNumber: number;
        changeType: "create" | "update" | "minor" | "revert";
        markdown?: string | undefined;
        changeDescription?: string | undefined;
        createdBy?: string | undefined;
    }[];
}>;
/**
 * Memoir info schema (for grouping chapters)
 */
export declare const memoirInfoSchema: z.ZodObject<{
    memoirId: z.ZodString;
    userId: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<["draft", "in_progress", "completed"]>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    status: "completed" | "draft" | "in_progress";
    userId: string;
    createdAt: string;
    updatedAt: string;
    memoirId: string;
    description?: string | undefined;
}, {
    title: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    memoirId: string;
    status?: "completed" | "draft" | "in_progress" | undefined;
    description?: string | undefined;
}>;
/**
 * Memoir save schema (for database storage)
 */
export declare const memoirSaveSchema: z.ZodObject<{
    memoirId: z.ZodString;
    userId: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<["draft", "in_progress", "completed"]>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    status: "completed" | "draft" | "in_progress";
    userId: string;
    createdAt: string;
    updatedAt: string;
    memoirId: string;
    description?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    title: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    memoirId: string;
    status?: "completed" | "draft" | "in_progress" | undefined;
    description?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
/**
 * Create memoir request schema (API)
 */
export declare const createMemoirRequestSchema: z.ZodObject<{
    userId: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    userId: string;
    description?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    title: string;
    userId: string;
    description?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
/**
 * Update memoir request schema (API)
 */
export declare const updateMemoirRequestSchema: z.ZodObject<{
    memoirId: z.ZodString;
    userId: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["draft", "in_progress", "completed"]>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    memoirId: string;
    title?: string | undefined;
    status?: "completed" | "draft" | "in_progress" | undefined;
    description?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    userId: string;
    memoirId: string;
    title?: string | undefined;
    status?: "completed" | "draft" | "in_progress" | undefined;
    description?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
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
//# sourceMappingURL=chapter.schemas.d.ts.map