/**
 * gstack Browse Client Integration
 *
 * Wrapper around gstack browse tool for web verification
 */
import { exec } from "node:child_process";
import { promisify } from "node:util";
const execAsync = promisify(exec);
/**
 * Default browse paths to try
 */
const DEFAULT_BROWSE_PATHS = [
    "~/.claude/skills/gstack/browse/dist/browse",
    "~/.claude/skills/gstack/browse/dist/browse.exe",
    "/c/Users/COLORFUL/.claude/skills/gstack/browse/dist/browse.exe",
];
/**
 * gstack Browse Client
 */
export class BrowseClient {
    browsePath;
    timeout;
    constructor(config) {
        this.browsePath = config?.browsePath ?? this.findBrowsePath();
        this.timeout = config?.timeout ?? 30000;
    }
    /**
     * Find the browse executable
     */
    findBrowsePath() {
        for (const path of DEFAULT_BROWSE_PATHS) {
            try {
                // Try to execute with status command
                const result = execAsync(`"${path}" status`, {
                    timeout: 5000,
                    shell: true
                });
                if (result) {
                    return path;
                }
            }
            catch {
                // Continue to next path
            }
        }
        throw new Error("Could not find gstack browse executable");
    }
    /**
     * Navigate to URL and extract text content
     */
    async browseUrl(url) {
        try {
            // Navigate
            await this.execBrowse(`goto "${url}"`);
            // Extract text
            const { stdout: textOutput } = await this.execBrowse("text");
            // Extract title using JS
            const { stdout: titleOutput } = await this.execBrowse("js document.title");
            const title = titleOutput.trim() || undefined;
            return {
                text: textOutput,
                url,
                title,
            };
        }
        catch (error) {
            throw new Error(`Browse failed for ${url}: ${error}`);
        }
    }
    /**
     * Search and extract from multiple sources
     */
    async searchAndExtract(query, sources) {
        const results = [];
        for (const source of sources) {
            try {
                const url = this.buildSearchUrl(source, query);
                const browseResult = await this.browseUrl(url);
                // Extract relevant content using LLM-style heuristics
                const relevantContent = this.extractRelevantContent(browseResult.text, query);
                results.push({
                    query,
                    url: browseResult.url,
                    content: relevantContent,
                    title: browseResult.title,
                });
            }
            catch (error) {
                // Continue to next source on failure
                console.warn(`Failed to browse ${source}: ${error}`);
            }
        }
        return results;
    }
    /**
     * Build search URL for a source
     */
    buildSearchUrl(source, query) {
        const encodedQuery = encodeURIComponent(query);
        switch (source) {
            case "baidu":
                return `https://baike.baidu.com/item/${encodedQuery}`;
            case "wikipedia":
                return `https://zh.wikipedia.org/wiki/${encodedQuery}`;
            case "google":
                return `https://www.google.com/search?q=${encodedQuery}`;
            default:
                // Treat as direct URL
                return source;
        }
    }
    /**
     * Extract relevant content from page text
     */
    extractRelevantContent(text, query) {
        // Simple heuristic: extract first 2000 chars that contain query terms
        const queryTerms = query.toLowerCase().split(/\s+/);
        const paragraphs = text.split(/\n\n+/);
        const relevantParagraphs = paragraphs.filter(p => {
            const lower = p.toLowerCase();
            return queryTerms.some(term => term.length > 2 && lower.includes(term));
        });
        if (relevantParagraphs.length > 0) {
            return relevantParagraphs.slice(0, 5).join("\n\n").slice(0, 3000);
        }
        // Fallback: return first 2000 chars
        return text.slice(0, 2000);
    }
    /**
     * Execute browse command
     */
    async execBrowse(command) {
        const fullCommand = `"${this.browsePath}" ${command}`;
        const result = await execAsync(fullCommand, {
            timeout: this.timeout,
            shell: true,
            maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        });
        return result;
    }
    /**
     * Check if browse client is available
     */
    static async isAvailable() {
        try {
            const client = new BrowseClient();
            await client.execBrowse("status");
            return true;
        }
        catch {
            return false;
        }
    }
}
//# sourceMappingURL=browse-client.js.map