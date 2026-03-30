/**
 * MemoirOS MemCube Manager
 *
 * Manages the knowledge cube with embedding-based semantic search
 */
import { randomUUID } from "node:crypto";
import { memcubeItemSchema, memcubeCollectionSchema, memcubeQuerySchema, memcubeSearchResultSchema, } from "../schemas/memcube.schemas.js";
import { createHash } from "node:crypto";
/**
 * MemCube Manager
 *
 * Manages knowledge items with embedding-based semantic search
 */
export class MemCubeManager {
    storage;
    embeddingProvider;
    embeddingCache = new Map();
    constructor(storage, embeddingProvider) {
        this.storage = storage;
        this.embeddingProvider = embeddingProvider;
    }
    /**
     * Create a new MemCube item
     */
    async createItem(params) {
        const now = new Date().toISOString();
        const contentHash = this.hashContent(params.content);
        // Check for duplicates
        const existing = this.findItemByContentHash(params.userId, contentHash);
        if (existing) {
            return existing;
        }
        const cubeId = randomUUID();
        const itemId = randomUUID();
        const item = memcubeItemSchema.parse({
            cubeId,
            userId: params.userId,
            itemId,
            content: params.content,
            contentHash,
            itemType: params.itemType,
            sourceId: params.sourceId,
            embeddingId: undefined,
            embeddingModel: undefined,
            status: params.autoIndex ? "processing" : "draft",
            createdAt: now,
            updatedAt: now,
            indexedAt: undefined,
            keywords: params.keywords ?? [],
            semanticTags: params.semanticTags ?? [],
            relatedCubeIds: [],
            parentCubeId: params.parentCubeId,
            accessCount: 0,
            lastAccessedAt: undefined,
        });
        this.storage.saveMemCubeItem(item);
        // Auto-index if requested
        if (params.autoIndex) {
            await this.indexItem(cubeId);
        }
        return item;
    }
    /**
     * Index a MemCube item (generate embedding)
     */
    async indexItem(cubeId) {
        const item = this.storage.loadMemCubeItem(cubeId);
        if (!item) {
            throw new Error(`MemCube item not found: ${cubeId}`);
        }
        // Update status to processing
        this.storage.updateMemCubeStatus(cubeId, "processing");
        try {
            // Generate embedding
            const embedding = await this.embeddingProvider.embed(item.content);
            const embeddingId = randomUUID();
            // Store embedding (in a real implementation, this would use a vector database)
            // For now, we'll cache it in memory and store the ID
            this.embeddingCache.set(embeddingId, embedding);
            // Update item with embedding ID
            this.storage.updateMemCubeEmbedding(cubeId, embeddingId, "default" // In production, this would be the actual model name
            );
            // Update status to indexed
            this.storage.updateMemCubeStatus(cubeId, "indexed", new Date().toISOString());
        }
        catch (error) {
            // Update status to draft on error
            this.storage.updateMemCubeStatus(cubeId, "draft");
            throw error;
        }
    }
    /**
     * Index multiple items in batch
     */
    async indexBatch(cubeIds) {
        const items = cubeIds
            .map(id => this.storage.loadMemCubeItem(id))
            .filter((item) => item !== null);
        if (items.length === 0) {
            return;
        }
        // Update all items to processing
        for (const item of items) {
            this.storage.updateMemCubeStatus(item.cubeId, "processing");
        }
        try {
            // Generate embeddings in batch
            const embeddings = await this.embeddingProvider.embedBatch(items.map(item => item.content));
            // Update items with embeddings
            for (let i = 0; i < items.length; i++) {
                const embeddingId = randomUUID();
                this.embeddingCache.set(embeddingId, embeddings[i]);
                this.storage.updateMemCubeEmbedding(items[i].cubeId, embeddingId, "default");
                this.storage.updateMemCubeStatus(items[i].cubeId, "indexed", new Date().toISOString());
            }
        }
        catch (error) {
            // Revert all items to draft on error
            for (const item of items) {
                this.storage.updateMemCubeStatus(item.cubeId, "draft");
            }
            throw error;
        }
    }
    /**
     * Semantic search
     */
    async semanticSearch(query) {
        const validated = memcubeQuerySchema.parse(query);
        // Generate query embedding
        const queryEmbedding = await this.embeddingProvider.embed(validated.query);
        // Load all user's indexed items
        const items = this.storage.loadMemCubeItems(validated.userId, "indexed")
            .filter(item => {
            if (validated.itemType && item.itemType !== validated.itemType) {
                return false;
            }
            if (validated.status && item.status !== validated.status) {
                return false;
            }
            return true;
        });
        // Calculate similarities
        const results = [];
        for (const item of items) {
            if (item.embeddingId) {
                const itemEmbedding = this.embeddingCache.get(item.embeddingId);
                if (itemEmbedding) {
                    const score = this.embeddingProvider.similarity(queryEmbedding, itemEmbedding);
                    if (validated.minConfidence === undefined || score >= validated.minConfidence) {
                        results.push({ item, score });
                    }
                }
            }
        }
        // Sort by score and limit results
        results.sort((a, b) => b.score - a.score);
        const topResults = results.slice(0, validated.limit);
        // Build search results
        const searchResults = [];
        for (const { item, score } of topResults) {
            const result = memcubeSearchResultSchema.parse({
                cubeId: item.cubeId,
                itemId: item.itemId,
                content: item.content,
                itemType: item.itemType,
                score,
                confidence: score,
                relatedItems: validated.includeRelated ? this.findRelatedItems(item.cubeId) : undefined,
            });
            // Increment access count
            this.storage.incrementMemCubeAccess(item.cubeId);
            searchResults.push(result);
        }
        return searchResults;
    }
    /**
     * Create a new collection
     */
    createCollection(params) {
        const now = new Date().toISOString();
        const collectionId = randomUUID();
        const collection = memcubeCollectionSchema.parse({
            collectionId,
            userId: params.userId,
            name: params.name,
            description: params.description,
            cubeIds: params.cubeIds ?? [],
            parentCollectionId: params.parentCollectionId,
            metadata: params.metadata ?? {},
            createdAt: now,
            updatedAt: now,
        });
        this.storage.saveMemCubeCollection(collection);
        return collection;
    }
    /**
     * Add items to a collection
     */
    addToCollection(collectionId, cubeIds) {
        const collection = this.storage.loadMemCubeCollection(collectionId);
        if (!collection) {
            throw new Error(`Collection not found: ${collectionId}`);
        }
        const updatedCubeIds = Array.from(new Set([...collection.cubeIds, ...cubeIds]));
        this.storage.saveMemCubeCollection({
            ...collection,
            cubeIds: updatedCubeIds,
            updatedAt: new Date().toISOString(),
        });
    }
    /**
     * Remove items from a collection
     */
    removeFromCollection(collectionId, cubeIds) {
        const collection = this.storage.loadMemCubeCollection(collectionId);
        if (!collection) {
            throw new Error(`Collection not found: ${collectionId}`);
        }
        const cubeIdSet = new Set(collection.cubeIds);
        for (const cubeId of cubeIds) {
            cubeIdSet.delete(cubeId);
        }
        this.storage.saveMemCubeCollection({
            ...collection,
            cubeIds: Array.from(cubeIdSet),
            updatedAt: new Date().toISOString(),
        });
    }
    /**
     * Link related items
     */
    linkItems(cubeId, relatedCubeIds) {
        const item = this.storage.loadMemCubeItem(cubeId);
        if (!item) {
            throw new Error(`MemCube item not found: ${cubeId}`);
        }
        // Get existing related IDs
        const existingRelatedIds = new Set(item.relatedCubeIds);
        // Add new related IDs
        for (const relatedId of relatedCubeIds) {
            existingRelatedIds.add(relatedId);
            // Create bidirectional link
            const relatedItem = this.storage.loadMemCubeItem(relatedId);
            if (relatedItem) {
                const relatedSet = new Set(relatedItem.relatedCubeIds);
                relatedSet.add(cubeId);
                // Convert to MemCubeItemSave format
                const relatedItemSave = {
                    cubeId: relatedItem.cubeId,
                    userId: relatedItem.userId,
                    itemId: relatedItem.itemId,
                    content: relatedItem.content,
                    contentHash: relatedItem.contentHash,
                    itemType: relatedItem.itemType,
                    sourceId: relatedItem.sourceId,
                    embeddingId: relatedItem.embeddingId,
                    embeddingModel: relatedItem.embeddingModel,
                    status: relatedItem.status,
                    createdAt: relatedItem.createdAt,
                    updatedAt: relatedItem.updatedAt,
                    indexedAt: relatedItem.indexedAt,
                    keywords: [...relatedItem.keywords],
                    semanticTags: [...relatedItem.semanticTags],
                    relatedCubeIds: Array.from(relatedSet),
                    parentCubeId: relatedItem.parentCubeId,
                    accessCount: relatedItem.accessCount,
                    lastAccessedAt: relatedItem.lastAccessedAt,
                };
                this.storage.saveMemCubeItem(relatedItemSave);
            }
        }
        // Convert to MemCubeItemSave format
        const itemSave = {
            cubeId: item.cubeId,
            userId: item.userId,
            itemId: item.itemId,
            content: item.content,
            contentHash: item.contentHash,
            itemType: item.itemType,
            sourceId: item.sourceId,
            embeddingId: item.embeddingId,
            embeddingModel: item.embeddingModel,
            status: item.status,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            indexedAt: item.indexedAt,
            keywords: [...item.keywords],
            semanticTags: [...item.semanticTags],
            relatedCubeIds: Array.from(existingRelatedIds),
            parentCubeId: item.parentCubeId,
            accessCount: item.accessCount,
            lastAccessedAt: item.lastAccessedAt,
        };
        this.storage.saveMemCubeItem(itemSave);
    }
    /**
     * Archive items
     */
    archiveItems(cubeIds) {
        for (const cubeId of cubeIds) {
            this.storage.updateMemCubeStatus(cubeId, "archived");
        }
    }
    /**
     * Delete items (soft delete)
     */
    deleteItems(cubeIds) {
        for (const cubeId of cubeIds) {
            this.storage.updateMemCubeStatus(cubeId, "deleted");
        }
    }
    /**
     * Get item by ID
     */
    getItem(cubeId) {
        const item = this.storage.loadMemCubeItem(cubeId);
        if (!item) {
            return null;
        }
        // Increment access count
        this.storage.incrementMemCubeAccess(cubeId);
        // Build complete MemCubeItem from storage data
        return {
            cubeId: item.cubeId,
            userId: item.userId,
            itemId: item.itemId,
            content: item.content,
            contentHash: item.contentHash,
            itemType: item.itemType,
            sourceId: item.sourceId,
            embeddingId: item.embeddingId,
            embeddingModel: item.embeddingModel,
            status: item.status,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            indexedAt: item.indexedAt,
            keywords: [...item.keywords],
            semanticTags: [...item.semanticTags],
            relatedCubeIds: [...item.relatedCubeIds],
            parentCubeId: item.parentCubeId,
            accessCount: item.accessCount,
            lastAccessedAt: item.lastAccessedAt,
        };
    }
    /**
     * Get all items for a user
     */
    getItems(userId, status) {
        const items = this.storage.loadMemCubeItems(userId, status);
        return items.map(item => ({
            cubeId: item.cubeId,
            userId: item.userId,
            itemId: item.itemId,
            content: item.content,
            contentHash: "",
            itemType: item.itemType,
            sourceId: item.sourceId,
            embeddingId: item.embeddingId,
            embeddingModel: undefined,
            status: item.status,
            createdAt: "",
            updatedAt: "",
            indexedAt: undefined,
            keywords: [],
            semanticTags: [],
            relatedCubeIds: [],
            parentCubeId: item.parentCubeId,
            accessCount: item.accessCount,
            lastAccessedAt: item.lastAccessedAt,
        }));
    }
    /**
     * Get collection by ID
     */
    getCollection(collectionId) {
        const collection = this.storage.loadMemCubeCollection(collectionId);
        if (!collection) {
            return null;
        }
        return {
            collectionId: collection.collectionId,
            userId: collection.userId,
            name: collection.name,
            description: collection.description,
            cubeIds: [...collection.cubeIds],
            parentCollectionId: collection.parentCollectionId,
            metadata: collection.metadata,
            createdAt: collection.createdAt,
            updatedAt: collection.updatedAt,
        };
    }
    /**
     * Get all collections for a user
     */
    getCollections(userId) {
        const collections = this.storage.loadMemCubeCollections(userId);
        return collections.map(col => ({
            collectionId: col.collectionId,
            userId,
            name: col.name,
            description: col.description,
            cubeIds: [...col.cubeIds],
            parentCollectionId: col.parentCollectionId,
            metadata: col.metadata ?? {},
            createdAt: "",
            updatedAt: "",
        }));
    }
    // Private methods
    hashContent(content) {
        return createHash("sha256").update(content).digest("hex");
    }
    findItemByContentHash(userId, contentHash) {
        const items = this.storage.loadMemCubeItems(userId);
        for (const item of items) {
            if (this.hashContent(item.content) === contentHash) {
                return this.getItem(item.cubeId);
            }
        }
        return null;
    }
    findRelatedItems(cubeId) {
        const item = this.storage.loadMemCubeItem(cubeId);
        if (!item) {
            return [];
        }
        return item.relatedCubeIds.map(relatedId => ({
            cubeId: relatedId,
            score: 1.0, // In production, this would be a calculated similarity score
        }));
    }
    /**
     * Hybrid search: Combine FTS5 full-text search with semantic embedding search
     *
     * @param params - Search parameters
     * @returns Combined search results
     */
    async hybridSearch(params) {
        const ftsWeight = params.ftsWeight ?? 0.5;
        const semanticWeight = params.semanticWeight ?? 0.5;
        const limit = params.limit ?? 10;
        // Run FTS5 search
        const ftsResults = this.storage.searchMemCubeFTS({
            userId: params.userId,
            query: params.query,
            itemType: params.itemType,
            status: params.status,
            limit: limit * 2, // Get more for re-ranking
        });
        // Run semantic search
        const semanticResults = await this.semanticSearch({
            query: params.query,
            userId: params.userId,
            itemType: params.itemType,
            status: params.status,
            limit: limit * 2,
            includeRelated: false,
        });
        // Combine and re-rank results
        const combinedScores = new Map();
        // Add FTS scores (normalize bm25 to 0-1 range)
        for (const result of ftsResults) {
            const normalizedScore = 1 / (1 + result.bm25); // Lower bm25 = better
            const existing = combinedScores.get(result.cubeId) ?? 0;
            combinedScores.set(result.cubeId, existing + normalizedScore * ftsWeight);
        }
        // Add semantic scores
        for (const result of semanticResults) {
            const existing = combinedScores.get(result.cubeId) ?? 0;
            combinedScores.set(result.cubeId, existing + result.score * semanticWeight);
        }
        // Sort by combined score and return top results
        const sortedCubeIds = Array.from(combinedScores.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([cubeId]) => cubeId);
        // Build final results
        const results = [];
        for (const cubeId of sortedCubeIds) {
            const item = this.storage.loadMemCubeItem(cubeId);
            if (item) {
                const score = combinedScores.get(cubeId) ?? 0;
                results.push(memcubeSearchResultSchema.parse({
                    cubeId,
                    itemId: item.itemId,
                    content: item.content,
                    itemType: item.itemType,
                    score,
                    confidence: score,
                }));
                // Increment access count
                this.storage.incrementMemCubeAccess(cubeId);
            }
        }
        return results;
    }
    /**
     * Get search suggestions using FTS5 prefix search
     *
     * @param userId - User ID
     * @param prefix - Search prefix
     * @param limit - Maximum number of suggestions
     * @returns Array of suggestion strings
     */
    getSearchSuggestions(userId, prefix, limit = 10) {
        return this.storage.getSearchSuggestions({
            userId,
            prefix,
            table: "memcube",
            limit,
        });
    }
    /**
     * Rebuild FTS5 index for MemCube items
     */
    rebuildFTSIndex() {
        this.storage.rebuildMemCubeFTSIndex();
    }
    /**
     * Get FTS5 statistics
     */
    getFTS5Stats() {
        return this.storage.getFTS5Stats();
    }
}
//# sourceMappingURL=memcube-manager.js.map