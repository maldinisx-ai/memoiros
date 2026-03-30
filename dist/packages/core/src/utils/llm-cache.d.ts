/**
 * LLM Response Cache
 *
 * Caches LLM responses to reduce API calls and improve performance.
 * Uses a combination of in-memory cache and optional persistent storage.
 */
/**
 * Cache configuration
 */
export interface CacheConfig {
    readonly maxSize: number;
    readonly defaultTTL: number;
    readonly cleanupInterval: number;
    readonly persistToDisk?: boolean;
    readonly persistPath?: string;
}
/**
 * Generate cache key from prompt and options
 */
export declare function generateCacheKey(prompt: string, options?: Record<string, unknown>): string;
/**
 * LLM Response Cache Class
 */
export declare class LLMCache<T = unknown> {
    private cache;
    private config;
    private cleanupTimer;
    constructor(config?: Partial<CacheConfig>);
    /**
     * Get value from cache
     */
    get(key: string): T | null;
    /**
     * Set value in cache
     */
    set(key: string, value: T, ttl?: number): void;
    /**
     * Check if key exists and is not expired
     */
    has(key: string): boolean;
    /**
     * Delete entry from cache
     */
    delete(key: string): boolean;
    /**
     * Clear all cache entries
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        maxSize: number;
        expiredCount: number;
        totalHits: number;
        hitRate: number;
        oldestEntry: {
            createdAt: Date;
            key: string;
        } | null;
        newestEntry: {
            createdAt: Date;
            key: string;
        } | null;
    };
    /**
     * Evict oldest entry from cache
     */
    private evictOldest;
    /**
     * Start periodic cleanup of expired entries
     */
    private startCleanup;
    /**
     * Cleanup expired entries
     */
    private cleanup;
    /**
     * Save cache to disk
     */
    private saveToDisk;
    /**
     * Load cache from disk
     */
    private loadFromDisk;
    /**
     * Destroy cache and cleanup resources
     */
    destroy(): void;
}
/**
 * Get or create global LLM cache instance
 */
export declare function getGlobalLLMCache<T = unknown>(): LLMCache<T>;
/**
 * Reset global LLM cache
 */
export declare function resetGlobalLLMCache(): void;
/**
 * Cache decorator for async functions
 * Caches function results based on arguments
 */
export declare function cached<T extends (...args: unknown[]) => Promise<unknown>>(fn: T, cacheKeyGenerator?: (...args: Parameters<T>) => string, ttl?: number): T;
//# sourceMappingURL=llm-cache.d.ts.map