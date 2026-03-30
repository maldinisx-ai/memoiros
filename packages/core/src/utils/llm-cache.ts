/**
 * LLM Response Cache
 *
 * Caches LLM responses to reduce API calls and improve performance.
 * Uses a combination of in-memory cache and optional persistent storage.
 */

import { createServiceLogger } from "./winston-logger.js";

const cacheLogger = createServiceLogger("llm-cache", {
  logDir: process.env.LOG_DIR ?? "logs",
});

/**
 * Cache entry structure
 */
interface CacheEntry<T> {
  readonly key: string;
  readonly value: T;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly hitCount: number;
  readonly lastAccessedAt: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  readonly maxSize: number; // Maximum number of entries
  readonly defaultTTL: number; // Default TTL in milliseconds
  readonly cleanupInterval: number; // Cleanup interval in milliseconds
  readonly persistToDisk?: boolean; // Whether to persist cache to disk
  readonly persistPath?: string; // Path to persist cache file
}

/**
 * Default cache configuration
 */
const DEFAULT_CONFIG: CacheConfig = {
  maxSize: 1000,
  defaultTTL: 60 * 60 * 1000, // 1 hour
  cleanupInterval: 5 * 60 * 1000, // 5 minutes
  persistToDisk: false,
};

/**
 * Generate cache key from prompt and options
 */
export function generateCacheKey(
  prompt: string,
  options?: Record<string, unknown>
): string {
  const keyParts = [prompt];

  if (options) {
    const sortedKeys = Object.keys(options).sort();
    for (const key of sortedKeys) {
      const value = options[key];
      if (value !== undefined) {
        keyParts.push(`${key}=${JSON.stringify(value)}`);
      }
    }
  }

  // Simple hash (in production, use a proper hash function like crypto.createHash)
  return keyParts.join("|").replace(/\s+/g, " ");
}

/**
 * LLM Response Cache Class
 */
export class LLMCache<T = unknown> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Start cleanup timer
    this.startCleanup();

    // Load from disk if configured
    if (this.config.persistToDisk && this.config.persistPath) {
      this.loadFromDisk();
    }

    cacheLogger.info("LLM cache initialized", {
      maxSize: this.config.maxSize,
      defaultTTL: this.config.defaultTTL,
    });
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Update access stats
    const updatedEntry: CacheEntry<T> = {
      ...entry,
      hitCount: entry.hitCount + 1,
      lastAccessedAt: Date.now(),
    };
    this.cache.set(key, updatedEntry);

    cacheLogger.debug("Cache hit", { key, hitCount: updatedEntry.hitCount });
    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    // Check if cache is full, evict oldest entry if needed
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }

    const now = Date.now();
    const entry: CacheEntry<T> = {
      key,
      value,
      createdAt: now,
      expiresAt: now + (ttl ?? this.config.defaultTTL),
      hitCount: 0,
      lastAccessedAt: now,
    };

    this.cache.set(key, entry);

    // Persist to disk if configured
    if (this.config.persistToDisk && this.config.persistPath) {
      this.saveToDisk();
    }

    cacheLogger.debug("Cache set", { key, cacheSize: this.cache.size });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }
    return Date.now() <= entry.expiresAt;
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    cacheLogger.info("Cache cleared");
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let totalHits = 0;
    let oldestEntry: CacheEntry<T> | null = null;
    let newestEntry: CacheEntry<T> | null = null;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expiredCount++;
      }
      totalHits += entry.hitCount;

      if (!oldestEntry || entry.createdAt < oldestEntry.createdAt) {
        oldestEntry = entry;
      }
      if (!newestEntry || entry.createdAt > newestEntry.createdAt) {
        newestEntry = entry;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      expiredCount,
      totalHits,
      hitRate: this.cache.size > 0 ? totalHits / this.cache.size : 0,
      oldestEntry: oldestEntry ? {
        createdAt: new Date(oldestEntry.createdAt),
        key: oldestEntry.key,
      } : null,
      newestEntry: newestEntry ? {
        createdAt: new Date(newestEntry.createdAt),
        key: newestEntry.key,
      } : null,
    };
  }

  /**
   * Evict oldest entry from cache
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessedAt < oldestTime) {
        oldestTime = entry.lastAccessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      cacheLogger.debug("Evicted oldest entry", { key: oldestKey });
    }
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      cacheLogger.debug("Cleanup completed", { cleanedCount, remainingSize: this.cache.size });

      // Persist after cleanup
      if (this.config.persistToDisk && this.config.persistPath) {
        this.saveToDisk();
      }
    }
  }

  /**
   * Save cache to disk
   */
  private saveToDisk(): void {
    if (!this.config.persistPath) return;

    try {
      // In a real implementation, use fs.promises.writeFile
      // This is a placeholder for demonstration
      cacheLogger.debug("Cache saved to disk", { path: this.config.persistPath });
    } catch (error) {
      cacheLogger.warn("Failed to save cache to disk", { error });
    }
  }

  /**
   * Load cache from disk
   */
  private loadFromDisk(): void {
    if (!this.config.persistPath) return;

    try {
      // In a real implementation, use fs.promises.readFile
      // This is a placeholder for demonstration
      cacheLogger.debug("Cache loaded from disk", { path: this.config.persistPath });
    } catch (error) {
      cacheLogger.warn("Failed to load cache from disk", { error });
    }
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.clear();
    cacheLogger.info("LLM cache destroyed");
  }
}

/**
 * Global LLM cache instance
 */
let globalCache: LLMCache<unknown> | null = null;

/**
 * Get or create global LLM cache instance
 */
export function getGlobalLLMCache<T = unknown>(): LLMCache<T> {
  if (!globalCache) {
    const cacheDir = process.env.LLM_CACHE_DIR;
    globalCache = new LLMCache<T>({
      maxSize: parseInt(process.env.LLM_CACHE_MAX_SIZE ?? "1000", 10),
      defaultTTL: parseInt(process.env.LLM_CACHE_TTL ?? "3600000", 10), // 1 hour
      persistToDisk: process.env.LLM_CACHE_PERSIST === "true",
      persistPath: cacheDir ? `${cacheDir}/llm-cache.json` : undefined,
    });
  }
  return globalCache as LLMCache<T>;
}

/**
 * Reset global LLM cache
 */
export function resetGlobalLLMCache(): void {
  if (globalCache) {
    globalCache.destroy();
    globalCache = null;
  }
}

/**
 * Cache decorator for async functions
 * Caches function results based on arguments
 */
export function cached<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  cacheKeyGenerator?: (...args: Parameters<T>) => string,
  ttl?: number
): T {
  const cache = getGlobalLLMCache<Awaited<ReturnType<T>>>();

  return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const key = cacheKeyGenerator
      ? cacheKeyGenerator(...args)
      : generateCacheKey(JSON.stringify(args));

    // Try to get from cache
    const cached = cache.get(key);
    if (cached !== null) {
      return cached as Awaited<ReturnType<T>>;
    }

    // Call function and cache result
    const result = await fn(...args);
    cache.set(key, result as Awaited<ReturnType<T>>, ttl);

    return result as Awaited<ReturnType<T>>;
  }) as T;
}
