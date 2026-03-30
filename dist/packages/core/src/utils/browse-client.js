/**
 * gstack Browse Client Integration
 *
 * Wrapper around gstack browse tool for web verification
 */
import { exec, execSync } from "node:child_process";
import { promisify } from "node:util";
const execAsync = promisify(exec);
/**
 * Default browse paths to try
 * Paths use shell expansion (~) for cross-platform compatibility
 */
const DEFAULT_BROWSE_PATHS = [
    "~/.claude/skills/gstack/browse/dist/browse",
    "~/.claude/skills/gstack/browse/dist/browse.exe",
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
                // Note: On Windows, we use cmd /c to run the command
                const cmd = process.platform === "win32"
                    ? `cmd /c "${path}" status`
                    : `"${path}" status`;
                // Note: Using any for shell option due to TypeScript type definition limitation
                // on Windows where shell can be boolean but type only allows string
                const options = {
                    timeout: 5000,
                    stdio: "pipe"
                };
                if (process.platform === "win32") {
                    options.shell = true;
                }
                execSync(cmd, options);
                return path;
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
            const textOutput = await this.execBrowse("text");
            const text = textOutput.stdout.toString();
            // Extract title using JS
            const titleOutput = await this.execBrowse("js document.title");
            const title = titleOutput.stdout.toString().trim() || undefined;
            return {
                text,
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
                const message = error instanceof Error ? error.message : String(error);
                console.warn(`Failed to browse ${source}: ${message}`);
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
        // Note: Using any for shell option due to TypeScript type definition limitation
        // on Windows where shell can be boolean but type only allows string
        const options = {
            timeout: this.timeout,
            maxBuffer: 10 * 1024 * 1024
        };
        if (process.platform === "win32") {
            options.shell = true;
        }
        else {
            options.shell = "/bin/bash";
        }
        const result = await execAsync(fullCommand, options);
        // Convert Buffer to string
        return {
            stdout: result.stdout?.toString() || ""
        };
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