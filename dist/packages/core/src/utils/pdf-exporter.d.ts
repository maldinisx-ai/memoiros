/**
 * PDF Export Utility
 *
 * Generates PDF documents from markdown content using Puppeteer
 */
import type { ChapterResponse, MemoirInfo } from "../schemas/chapter.schemas.js";
/**
 * PDF export options
 */
export interface PDFExportOptions {
    format?: "A4" | "Letter";
    margin?: {
        top?: string;
        bottom?: string;
        left?: string;
        right?: string;
    };
    displayHeader?: boolean;
    displayFooter?: boolean;
    headerTemplate?: string;
    footerTemplate?: string;
    fontSize?: number;
    lineSpacing?: number;
}
/**
 * PDF Exporter class
 */
export declare class PDFExporter {
    private browser;
    /**
     * Initialize Puppeteer browser
     */
    private initBrowser;
    /**
     * Close browser instance
     */
    close(): Promise<void>;
    /**
     * Convert Markdown to HTML
     */
    private markdownToHTML;
    /**
     * Escape HTML special characters
     */
    private escapeHTML;
    /**
     * Generate PDF from HTML content
     */
    private generatePDFFromHTML;
    /**
     * Export a single chapter to PDF
     */
    exportChapter(chapter: ChapterResponse, outputPath: string, options?: PDFExportOptions): Promise<void>;
    /**
     * Export multiple chapters to a single PDF
     */
    exportChapters(chapters: ChapterResponse[], outputPath: string, memoirInfo?: Partial<MemoirInfo>, options?: PDFExportOptions): Promise<void>;
    /**
     * Export memoir to PDF
     */
    exportMemoir(memoir: MemoirInfo, chapters: ChapterResponse[], outputPath: string, options?: PDFExportOptions): Promise<void>;
}
/**
 * Create a PDF exporter instance
 */
export declare function createPDFExporter(): PDFExporter;
//# sourceMappingURL=pdf-exporter.d.ts.map