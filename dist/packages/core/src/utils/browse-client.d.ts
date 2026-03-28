/**
 * gstack Browse Client Integration
 *
 * Wrapper around gstack browse tool for web verification
 */
/**
 * Browse client configuration
 */
export interface BrowseClientConfig {
    /** Path to browse executable */
    readonly browsePath?: string;
    /** Request timeout in milliseconds */
    readonly timeout?: number;
}
/**
 * Browse page content result
 */
export interface BrowseResult {
    /** Page text content */
    readonly text: string;
    /** Page URL */
    readonly url: string;
    /** Page title */
    readonly title?: string;
}
/**
 * Search and extract result
 */
export interface SearchExtractResult {
    /** Query used */
    readonly query: string;
    /** Source URL */
    readonly url: string;
    /** Extracted content */
    readonly content: string;
    /** Title */
    readonly title?: string;
}
/**
 * gstack Browse Client
 */
export declare class BrowseClient {
    private readonly browsePath;
    private readonly timeout;
    constructor(config?: BrowseClientConfig);
    /**
     * Find the browse executable
     */
    private findBrowsePath;
    /**
     * Navigate to URL and extract text content
     */
    browseUrl(url: string): Promise<BrowseResult>;
    /**
     * Search and extract from multiple sources
     */
    searchAndExtract(query: string, sources: ReadonlyArray<string>): Promise<ReadonlyArray<SearchExtractResult>>;
    /**
     * Build search URL for a source
     */
    private buildSearchUrl;
    /**
     * Extract relevant content from page text
     */
    private extractRelevantContent;
    /**
     * Execute browse command
     */
    private execBrowse;
    /**
     * Check if browse client is available
     */
    static isAvailable(): Promise<boolean>;
}
//# sourceMappingURL=browse-client.d.ts.map