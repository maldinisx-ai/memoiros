/**
 * MemoirOS MemCube Schemas
 *
 * Zod validation schemas for MemCube (embedding-based knowledge cube)
 */
import { z } from "zod";
/**
 * MemCube status types
 */
export const memcubeStatusSchema = z.enum([
    "draft", // Initial creation, not yet processed
    "processing", // Being embedded or indexed
    "indexed", // Successfully indexed and searchable
    "archived", // Moved to archive (rarely accessed)
    "deleted", // Soft deleted
]);
/**
 * MemCube item schema - represents a single knowledge unit
 */
export const memcubeItemSchema = z.object({
    cubeId: z.string().uuid(),
    userId: z.string(),
    itemId: z.string().uuid(),
    // Content
    content: z.string(),
    contentHash: z.string(), // SHA-256 hash for deduplication
    // Metadata
    itemType: z.enum([
        "interview_answer",
        "timeline_event",
        "chapter_draft",
        "voice_sample",
        "fact",
        "reflection",
    ]),
    sourceId: z.string().optional(), // Reference to source record ID
    // Embedding
    embeddingId: z.string().uuid().optional(),
    embeddingModel: z.string().optional(),
    // Status and lifecycle
    status: memcubeStatusSchema.default("draft"),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    indexedAt: z.string().datetime().optional(),
    // Search and retrieval
    keywords: z.array(z.string()).default([]),
    semanticTags: z.array(z.string()).default([]),
    // Relationships
    relatedCubeIds: z.array(z.string().uuid()).default([]),
    parentCubeId: z.string().uuid().optional(),
    // Metrics
    accessCount: z.number().int().min(0).default(0),
    lastAccessedAt: z.string().datetime().optional(),
});
/**
 * MemCube collection schema - groups related items
 */
export const memcubeCollectionSchema = z.object({
    collectionId: z.string().uuid(),
    userId: z.string(),
    name: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    // Structure
    cubeIds: z.array(z.string().uuid()),
    parentCollectionId: z.string().uuid().optional(),
    // Metadata
    metadata: z.record(z.unknown()).default({}),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
/**
 * MemCube query schema - for semantic search
 */
export const memcubeQuerySchema = z.object({
    query: z.string().min(1),
    userId: z.string(),
    limit: z.number().int().min(1).max(100).default(10),
    collectionId: z.string().uuid().optional(),
    itemType: z.enum([
        "interview_answer",
        "timeline_event",
        "chapter_draft",
        "voice_sample",
        "fact",
        "reflection",
    ]).optional(),
    status: memcubeStatusSchema.optional(),
    minConfidence: z.number().min(0).max(1).optional(),
    includeRelated: z.boolean().default(false),
});
/**
 * MemCube search result schema
 */
export const memcubeSearchResultSchema = z.object({
    cubeId: z.string().uuid(),
    itemId: z.string().uuid(),
    content: z.string(),
    itemType: z.string(),
    score: z.number().min(0).max(1),
    confidence: z.number().min(0).max(1),
    relatedItems: z.array(z.object({
        cubeId: z.string().uuid(),
        score: z.number().min(0).max(1),
    })).optional(),
});
/**
 * Database save schema for MemCube items
 */
export const memcubeItemSaveSchema = memcubeItemSchema.pick({
    cubeId: true,
    userId: true,
    itemId: true,
    content: true,
    contentHash: true,
    itemType: true,
    sourceId: true,
    embeddingId: true,
    embeddingModel: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    indexedAt: true,
    keywords: true,
    semanticTags: true,
    relatedCubeIds: true,
    parentCubeId: true,
    accessCount: true,
    lastAccessedAt: true,
});
/**
 * Database save schema for MemCube collections
 */
export const memcubeCollectionSaveSchema = memcubeCollectionSchema.pick({
    collectionId: true,
    userId: true,
    name: true,
    description: true,
    cubeIds: true,
    parentCollectionId: true,
    metadata: true,
    createdAt: true,
    updatedAt: true,
});
//# sourceMappingURL=memcube.schemas.js.map