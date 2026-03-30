/**
 * MemoirOS MemCube Manager
 *
 * Manages the knowledge cube with embedding-based semantic search
 */
import type { MemoirOSStorage } from "../storage/database.js";
import { type MemCubeItem, type MemCubeCollection, type MemCubeQuery, type MemCubeSearchResult, type MemCubeStatus } from "../schemas/memcube.schemas.js";
/**
 * Embedding provider interface
 */
export interface EmbeddingProvider {
    /**
     * Generate embedding for a text
     */
    embed(text: string): Promise<readonly number[]>;
    /**
     * Generate embeddings for multiple texts (batch)
     */
    embedBatch(texts: ReadonlyArray<string>): Promise<ReadonlyArray<readonly number[]>>;
    /**
     * Calculate cosine similarity between two embeddings
     */
    similarity(a: readonly number[], b: readonly number[]): number;
}
/**
 * MemCube Manager
 *
 * Manages knowledge items with embedding-based semantic search
 */
export declare class MemCubeManager {
    private readonly storage;
    private readonly embeddingProvider;
    private readonly embeddingCache;
    constructor(storage: MemoirOSStorage, embeddingProvider: EmbeddingProvider);
    /**
     * Create a new MemCube item
     */
    createItem(params: {
        userId: string;
        content: string;
        itemType: MemCubeItem["itemType"];
        sourceId?: string;
        keywords?: ReadonlyArray<string>;
        semanticTags?: ReadonlyArray<string>;
        parentCubeId?: string;
        autoIndex?: boolean;
    }): Promise<MemCubeItem>;
    /**
     * Index a MemCube item (generate embedding)
     */
    indexItem(cubeId: string): Promise<void>;
    /**
     * Index multiple items in batch
     */
    indexBatch(cubeIds: ReadonlyArray<string>): Promise<void>;
    /**
     * Semantic search
     */
    semanticSearch(query: MemCubeQuery): Promise<ReadonlyArray<MemCubeSearchResult>>;
    /**
     * Create a new collection
     */
    createCollection(params: {
        userId: string;
        name: string;
        description?: string;
        cubeIds?: ReadonlyArray<string>;
        parentCollectionId?: string;
        metadata?: Record<string, unknown>;
    }): MemCubeCollection;
    /**
     * Add items to a collection
     */
    addToCollection(collectionId: string, cubeIds: ReadonlyArray<string>): void;
    /**
     * Remove items from a collection
     */
    removeFromCollection(collectionId: string, cubeIds: ReadonlyArray<string>): void;
    /**
     * Link related items
     */
    linkItems(cubeId: string, relatedCubeIds: ReadonlyArray<string>): void;
    /**
     * Archive items
     */
    archiveItems(cubeIds: ReadonlyArray<string>): void;
    /**
     * Delete items (soft delete)
     */
    deleteItems(cubeIds: ReadonlyArray<string>): void;
    /**
     * Get item by ID
     */
    getItem(cubeId: string): MemCubeItem | null;
    /**
     * Get all items for a user
     */
    getItems(userId: string, status?: MemCubeStatus): ReadonlyArray<MemCubeItem>;
    /**
     * Get collection by ID
     */
    getCollection(collectionId: string): MemCubeCollection | null;
    /**
     * Get all collections for a user
     */
    getCollections(userId: string): ReadonlyArray<MemCubeCollection>;
    private hashContent;
    private findItemByContentHash;
    private findRelatedItems;
    /**
     * Hybrid search: Combine FTS5 full-text search with semantic embedding search
     *
     * @param params - Search parameters
     * @returns Combined search results
     */
    hybridSearch(params: {
        userId: string;
        query: string;
        itemType?: MemCubeItem["itemType"];
        status?: MemCubeStatus;
        limit?: number;
        ftsWeight?: number;
        semanticWeight?: number;
    }): Promise<ReadonlyArray<MemCubeSearchResult>>;
    /**
     * Get search suggestions using FTS5 prefix search
     *
     * @param userId - User ID
     * @param prefix - Search prefix
     * @param limit - Maximum number of suggestions
     * @returns Array of suggestion strings
     */
    getSearchSuggestions(userId: string, prefix: string, limit?: number): ReadonlyArray<string>;
    /**
     * Rebuild FTS5 index for MemCube items
     */
    rebuildFTSIndex(): void;
    /**
     * Get FTS5 statistics
     */
    getFTS5Stats(): {
        memcubeCount: number;
        interviewAnswersCount: number;
    };
}
//# sourceMappingURL=memcube-manager.d.ts.map