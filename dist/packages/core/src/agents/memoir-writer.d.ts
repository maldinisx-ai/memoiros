/**
 * MemoirWriter Agent
 *
 * 基于 UserProfile 生成回忆录内容
 * 适配自 inkos Writer Agent
 */
import { BaseAgent } from "./base.js";
import type { UserProfile } from "./preprocessor.js";
export interface MemoirWriteRequest {
    readonly userId: string;
    readonly profile: UserProfile;
    readonly chapterNumber?: number;
    readonly focusPeriod?: {
        readonly startYear?: number;
        readonly endYear?: number;
        readonly theme?: string;
    };
    readonly targetWords?: number;
}
export interface MemoirWriteOutput {
    readonly chapterNumber: number;
    readonly title: string;
    readonly content: string;
    readonly wordCount: number;
    readonly periodCovered: {
        readonly start: string;
        readonly end: string;
    };
    readonly keyEvents: ReadonlyArray<string>;
}
export declare class MemoirWriterAgent extends BaseAgent {
    get name(): string;
    writeChapter(request: MemoirWriteRequest): Promise<MemoirWriteOutput>;
    private determineChapterPeriod;
    private filterEventsByPeriod;
    private buildChapterContext;
    private buildSystemPrompt;
    private buildUserPrompt;
    private parseOutput;
    private formatEventDate;
    private extractYearFromString;
    private extractYearFromEvent;
    private countWords;
}
//# sourceMappingURL=memoir-writer.d.ts.map