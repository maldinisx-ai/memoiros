/**
 * PDF Export Utility
 *
 * Generates PDF documents from markdown content using Puppeteer
 */

import type { Browser } from "puppeteer";
import puppeteer from "puppeteer";
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
 * Default PDF export options
 */
const DEFAULT_PDF_OPTIONS: PDFExportOptions = {
  format: "A4",
  margin: {
    top: "2cm",
    bottom: "2cm",
    left: "2cm",
    right: "2cm",
  },
  displayHeader: true,
  displayFooter: true,
  fontSize: 12,
  lineSpacing: 1.6,
};

/**
 * PDF Exporter class
 */
export class PDFExporter {
  private browser: Browser | null = null;

  /**
   * Initialize Puppeteer browser
   */
  private async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
      });
    }
    return this.browser;
  }

  /**
   * Close browser instance
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Convert Markdown to HTML
   */
  private markdownToHTML(markdown: string, title?: string): string {
    const titleHTML = title ? `<h1>${this.escapeHTML(title)}</h1>` : "";

    // Simple markdown to HTML conversion
    let html = markdown
      // Headers
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // Code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="$1">$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      // Lists
      .replace(/^\s*-\s+(.*$)/gim, "<li>$1</li>")
      .replace(/^\s*\d+\.\s+(.*$)/gim, "<li>$1</li>")
      // Line breaks
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>");

    // Wrap in paragraphs
    html = `<p>${html}</p>`;

    // Wrap lists
    html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: "Microsoft YaHei", "SimHei", Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    h1 {
      font-size: 24pt;
      color: #1a1a1a;
      margin-top: 24pt;
      margin-bottom: 12pt;
      border-bottom: 2px solid #333;
      padding-bottom: 8pt;
    }
    h2 {
      font-size: 18pt;
      color: #333;
      margin-top: 20pt;
      margin-bottom: 10pt;
    }
    h3 {
      font-size: 14pt;
      color: #555;
      margin-top: 16pt;
      margin-bottom: 8pt;
    }
    p {
      margin: 8pt 0;
      text-align: justify;
      text-indent: 2em;
    }
    ul {
      margin: 8pt 0 8pt 2em;
      padding: 0;
    }
    li {
      margin: 4pt 0;
      text-align: justify;
      text-indent: 0;
    }
    code {
      font-family: "Courier New", monospace;
      background: #f5f5f5;
      padding: 2px 4px;
      border-radius: 3px;
      font-size: 11pt;
    }
    pre {
      background: #f5f5f5;
      padding: 12pt;
      border-radius: 5px;
      overflow-x: auto;
      margin: 12pt 0;
    }
    pre code {
      background: none;
      padding: 0;
    }
    blockquote {
      border-left: 4px solid #ddd;
      padding-left: 16pt;
      margin: 12pt 0;
      color: #666;
      font-style: italic;
    }
    .chapter-meta {
      text-align: center;
      color: #666;
      margin: 16pt 0;
      font-size: 10pt;
    }
    @page {
      margin: 2cm;
      @top-center {
        content: "MemoirOS - 回忆录";
        font-size: 10pt;
        color: #666;
      }
      @bottom-center {
        content: "Page " counter(page) " of " counter(pages);
        font-size: 10pt;
        color: #666;
      }
    }
  </style>
</head>
<body>
  ${titleHTML}
  <div class="content">
    ${html}
  </div>
</body>
</html>`;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHTML(text: string): string {
    const escapeMap: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return text.replace(/[&<>"']/g, (char) => escapeMap[char] ?? char);
  }

  /**
   * Generate PDF from HTML content
   */
  private async generatePDFFromHTML(
    html: string,
    outputPath: string,
    options: PDFExportOptions = {}
  ): Promise<void> {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    const opts = { ...DEFAULT_PDF_OPTIONS, ...options };

    await page.setContent(html, { waitUntil: "networkidle0" });

    await page.pdf({
      path: outputPath,
      format: opts.format,
      margin: opts.margin,
      printBackground: true,
      displayHeaderFooter: opts.displayHeader ?? true,
      headerTemplate:
        opts.headerTemplate ??
        `<div style="font-size: 10px; color: #666; text-align: center; padding-top: 10px;">MemoirOS - 回忆录</div>`,
      footerTemplate:
        opts.footerTemplate ??
        `<div style="font-size: 10px; color: #666; text-align: center; padding-bottom: 10px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
    });

    await page.close();
  }

  /**
   * Export a single chapter to PDF
   */
  async exportChapter(
    chapter: ChapterResponse,
    outputPath: string,
    options?: PDFExportOptions
  ): Promise<void> {
    const html = this.markdownToHTML(chapter.content, chapter.title);

    await this.generatePDFFromHTML(html, outputPath, options);
  }

  /**
   * Export multiple chapters to a single PDF
   */
  async exportChapters(
    chapters: ChapterResponse[],
    outputPath: string,
    memoirInfo?: Partial<MemoirInfo>,
    options?: PDFExportOptions
  ): Promise<void> {
    // Create cover page
    let coverHTML = "";
    if (memoirInfo) {
      coverHTML = `
<div style="page-break-after: always; text-align: center; padding-top: 200px;">
  <h1 style="border-bottom: none; font-size: 36pt; margin-bottom: 40pt;">
    ${this.escapeHTML(memoirInfo.title ?? "回忆录")}
  </h1>
  ${memoirInfo.description ? `<p style="color: #666; font-size: 14pt; margin: 20px 0;">${this.escapeHTML(memoirInfo.description)}</p>` : ""}
  <div class="chapter-meta">
    <p>创建时间：${new Date(memoirInfo.createdAt ?? Date.now()).toLocaleDateString("zh-CN")}</p>
  </div>
</div>`;
    }

    // Create table of contents
    const tocHTML = `
<div style="page-break-after: always;">
  <h1>目录</h1>
  <ul style="list-style: none; padding-left: 0;">
    ${chapters.map((ch, idx) => `
      <li style="margin: 8px 0; text-indent: 0;">
        <span style="display: inline-block; width: 30px;">${idx + 1}.</span>
        <a href="#chapter-${ch.chapterId}" style="color: #0066cc; text-decoration: none;">${this.escapeHTML(ch.title)}</a>
      </li>
    `).join("")}
  </ul>
</div>`;

    // Combine all chapter HTML
    const chaptersHTML = chapters.map((ch) => `
<div id="chapter-${ch.chapterId}" style="page-break-before: always;">
  <h1>${this.escapeHTML(ch.title)}</h1>
  <div class="chapter-meta">
    <span>字数：${ch.wordCount || 0}</span>
    ${ch.publishedAt ? `<span> | 发布时间：${new Date(ch.publishedAt).toLocaleDateString("zh-CN")}</span>` : ""}
  </div>
  ${this.markdownToHTML(ch.content).replace(/<h1>.*?<\/h1>/s, "")}
</div>`).join("");

    const fullHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: "Microsoft YaHei", "SimHei", Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    h1 {
      font-size: 24pt;
      color: #1a1a1a;
      margin-top: 24pt;
      margin-bottom: 12pt;
      border-bottom: 2px solid #333;
      padding-bottom: 8pt;
    }
    h2 {
      font-size: 18pt;
      color: #333;
      margin-top: 20pt;
      margin-bottom: 10pt;
    }
    p {
      margin: 8pt 0;
      text-align: justify;
      text-indent: 2em;
    }
    .chapter-meta {
      text-align: center;
      color: #666;
      margin: 16pt 0;
      font-size: 10pt;
    }
    @page {
      margin: 2cm;
      @top-center {
        content: "MemoirOS - 回忆录";
        font-size: 10pt;
        color: #666;
      }
      @bottom-center {
        content: "Page " counter(page) " of " counter(pages);
        font-size: 10pt;
        color: #666;
      }
    }
  </style>
</head>
<body>
  ${coverHTML}
  ${tocHTML}
  ${chaptersHTML}
</body>
</html>`;

    await this.generatePDFFromHTML(fullHTML, outputPath, options);
  }

  /**
   * Export memoir to PDF
   */
  async exportMemoir(
    memoir: MemoirInfo,
    chapters: ChapterResponse[],
    outputPath: string,
    options?: PDFExportOptions
  ): Promise<void> {
    await this.exportChapters(chapters, outputPath, memoir, options);
  }
}

/**
 * Create a PDF exporter instance
 */
export function createPDFExporter(): PDFExporter {
  return new PDFExporter();
}