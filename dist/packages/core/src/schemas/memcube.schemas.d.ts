/**
 * MemoirOS MemCube Schemas
 *
 * Zod validation schemas for MemCube (embedding-based knowledge cube)
 */
import { z } from "zod";
/**
 * MemCube status types
 */
export declare const memcubeStatusSchema: z.ZodEnum<["draft", "processing", "indexed", "archived", "deleted"]>;
export type MemCubeStatus = z.infer<typeof memcubeStatusSchema>;
/**
 * MemCube item schema - represents a single knowledge unit
 */
export declare const memcubeItemSchema: z.ZodObject<{
    cubeId: z.ZodString;
    userId: z.ZodString;
    itemId: z.ZodString;
    content: z.ZodString;
    contentHash: z.ZodString;
    itemType: z.ZodEnum<["interview_answer", "timeline_event", "chapter_draft", "voice_sample", "fact", "reflection"]>;
    sourceId: z.ZodOptional<z.ZodString>;
    embeddingId: z.ZodOptional<z.ZodString>;
    embeddingModel: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["draft", "processing", "indexed", "archived", "deleted"]>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    indexedAt: z.ZodOptional<z.ZodString>;
    keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    semanticTags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    relatedCubeIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    parentCubeId: z.ZodOptional<z.ZodString>;
    accessCount: z.ZodDefault<z.ZodNumber>;
    lastAccessedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content: string;
    status: "draft" | "processing" | "indexed" | "archived" | "deleted";
    userId: string;
    cubeId: string;
    itemId: string;
    contentHash: string;
    itemType: "fact" | "interview_answer" | "timeline_event" | "chapter_draft" | "voice_sample" | "reflection";
    createdAt: string;
    updatedAt: string;
    keywords: string[];
    semanticTags: string[];
    relatedCubeIds: string[];
    accessCount: number;
    sourceId?: string | undefined;
    embeddingId?: string | undefined;
    embeddingModel?: string | undefined;
    indexedAt?: string | undefined;
    parentCubeId?: string | undefined;
    lastAccessedAt?: string | undefined;
}, {
    content: string;
    userId: string;
    cubeId: string;
    itemId: string;
    contentHash: string;
    itemType: "fact" | "interview_answer" | "timeline_event" | "chapter_draft" | "voice_sample" | "reflection";
    createdAt: string;
    updatedAt: string;
    status?: "draft" | "processing" | "indexed" | "archived" | "deleted" | undefined;
    sourceId?: string | undefined;
    embeddingId?: string | undefined;
    embeddingModel?: string | undefined;
    indexedAt?: string | undefined;
    keywords?: string[] | undefined;
    semanticTags?: string[] | undefined;
    relatedCubeIds?: string[] | undefined;
    parentCubeId?: string | undefined;
    accessCount?: number | undefined;
    lastAccessedAt?: string | undefined;
}>;
export type MemCubeItem = z.infer<typeof memcubeItemSchema>;
/**
 * MemCube collection schema - groups related items
 */
export declare const memcubeCollectionSchema: z.ZodObject<{
    collectionId: z.ZodString;
    userId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    cubeIds: z.ZodArray<z.ZodString, "many">;
    parentCollectionId: z.ZodOptional<z.ZodString>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
    collectionId: string;
    name: string;
    cubeIds: string[];
    description?: string | undefined;
    parentCollectionId?: string | undefined;
}, {
    userId: string;
    createdAt: string;
    updatedAt: string;
    collectionId: string;
    name: string;
    cubeIds: string[];
    description?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    parentCollectionId?: string | undefined;
}>;
export type MemCubeCollection = z.infer<typeof memcubeCollectionSchema>;
/**
 * MemCube query schema - for semantic search
 */
export declare const memcubeQuerySchema: z.ZodObject<{
    query: z.ZodString;
    userId: z.ZodString;
    limit: z.ZodDefault<z.ZodNumber>;
    collectionId: z.ZodOptional<z.ZodString>;
    itemType: z.ZodOptional<z.ZodEnum<["interview_answer", "timeline_event", "chapter_draft", "voice_sample", "fact", "reflection"]>>;
    status: z.ZodOptional<z.ZodEnum<["draft", "processing", "indexed", "archived", "deleted"]>>;
    minConfidence: z.ZodOptional<z.ZodNumber>;
    includeRelated: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    limit: number;
    query: string;
    includeRelated: boolean;
    status?: "draft" | "processing" | "indexed" | "archived" | "deleted" | undefined;
    itemType?: "fact" | "interview_answer" | "timeline_event" | "chapter_draft" | "voice_sample" | "reflection" | undefined;
    collectionId?: string | undefined;
    minConfidence?: number | undefined;
}, {
    userId: string;
    query: string;
    status?: "draft" | "processing" | "indexed" | "archived" | "deleted" | undefined;
    limit?: number | undefined;
    itemType?: "fact" | "interview_answer" | "timeline_event" | "chapter_draft" | "voice_sample" | "reflection" | undefined;
    collectionId?: string | undefined;
    minConfidence?: number | undefined;
    includeRelated?: boolean | undefined;
}>;
export type MemCubeQuery = z.infer<typeof memcubeQuerySchema>;
/**
 * MemCube search result schema
 */
export declare const memcubeSearchResultSchema: z.ZodObject<{
    cubeId: z.ZodString;
    itemId: z.ZodString;
    content: z.ZodString;
    itemType: z.ZodString;
    score: z.ZodNumber;
    confidence: z.ZodNumber;
    relatedItems: z.ZodOptional<z.ZodArray<z.ZodObject<{
        cubeId: z.ZodString;
        score: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        cubeId: string;
        score: number;
    }, {
        cubeId: string;
        score: number;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    content: string;
    confidence: number;
    cubeId: string;
    itemId: string;
    itemType: string;
    score: number;
    relatedItems?: {
        cubeId: string;
        score: number;
    }[] | undefined;
}, {
    content: string;
    confidence: number;
    cubeId: string;
    itemId: string;
    itemType: string;
    score: number;
    relatedItems?: {
        cubeId: string;
        score: number;
    }[] | undefined;
}>;
export type MemCubeSearchResult = z.infer<typeof memcubeSearchResultSchema>;
/**
 * Database save schema for MemCube items
 */
export declare const memcubeItemSaveSchema: z.ZodObject<Pick<{
    cubeId: z.ZodString;
    userId: z.ZodString;
    itemId: z.ZodString;
    content: z.ZodString;
    contentHash: z.ZodString;
    itemType: z.ZodEnum<["interview_answer", "timeline_event", "chapter_draft", "voice_sample", "fact", "reflection"]>;
    sourceId: z.ZodOptional<z.ZodString>;
    embeddingId: z.ZodOptional<z.ZodString>;
    embeddingModel: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["draft", "processing", "indexed", "archived", "deleted"]>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    indexedAt: z.ZodOptional<z.ZodString>;
    keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    semanticTags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    relatedCubeIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    parentCubeId: z.ZodOptional<z.ZodString>;
    accessCount: z.ZodDefault<z.ZodNumber>;
    lastAccessedAt: z.ZodOptional<z.ZodString>;
}, "content" | "status" | "userId" | "cubeId" | "itemId" | "contentHash" | "itemType" | "sourceId" | "embeddingId" | "embeddingModel" | "createdAt" | "updatedAt" | "indexedAt" | "keywords" | "semanticTags" | "relatedCubeIds" | "parentCubeId" | "accessCount" | "lastAccessedAt">, "strip", z.ZodTypeAny, {
    content: string;
    status: "draft" | "processing" | "indexed" | "archived" | "deleted";
    userId: string;
    cubeId: string;
    itemId: string;
    contentHash: string;
    itemType: "fact" | "interview_answer" | "timeline_event" | "chapter_draft" | "voice_sample" | "reflection";
    createdAt: string;
    updatedAt: string;
    keywords: string[];
    semanticTags: string[];
    relatedCubeIds: string[];
    accessCount: number;
    sourceId?: string | undefined;
    embeddingId?: string | undefined;
    embeddingModel?: string | undefined;
    indexedAt?: string | undefined;
    parentCubeId?: string | undefined;
    lastAccessedAt?: string | undefined;
}, {
    content: string;
    userId: string;
    cubeId: string;
    itemId: string;
    contentHash: string;
    itemType: "fact" | "interview_answer" | "timeline_event" | "chapter_draft" | "voice_sample" | "reflection";
    createdAt: string;
    updatedAt: string;
    status?: "draft" | "processing" | "indexed" | "archived" | "deleted" | undefined;
    sourceId?: string | undefined;
    embeddingId?: string | undefined;
    embeddingModel?: string | undefined;
    indexedAt?: string | undefined;
    keywords?: string[] | undefined;
    semanticTags?: string[] | undefined;
    relatedCubeIds?: string[] | undefined;
    parentCubeId?: string | undefined;
    accessCount?: number | undefined;
    lastAccessedAt?: string | undefined;
}>;
export type MemCubeItemSave = z.infer<typeof memcubeItemSaveSchema>;
/**
 * Database save schema for MemCube collections
 */
export declare const memcubeCollectionSaveSchema: z.ZodObject<Pick<{
    collectionId: z.ZodString;
    userId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    cubeIds: z.ZodArray<z.ZodString, "many">;
    parentCollectionId: z.ZodOptional<z.ZodString>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "description" | "userId" | "metadata" | "createdAt" | "updatedAt" | "collectionId" | "name" | "cubeIds" | "parentCollectionId">, "strip", z.ZodTypeAny, {
    userId: string;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
    collectionId: string;
    name: string;
    cubeIds: string[];
    description?: string | undefined;
    parentCollectionId?: string | undefined;
}, {
    userId: string;
    createdAt: string;
    updatedAt: string;
    collectionId: string;
    name: string;
    cubeIds: string[];
    description?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    parentCollectionId?: string | undefined;
}>;
export type MemCubeCollectionSave = z.infer<typeof memcubeCollectionSaveSchema>;
//# sourceMappingURL=memcube.schemas.d.ts.map