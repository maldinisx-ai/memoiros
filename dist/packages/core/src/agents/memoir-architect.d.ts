/**
 * MemoirArchitect Agent
 *
 * 基于 UserProfile 生成回忆录大纲
 * 适配自 inkos Architect Agent
 */
import { BaseAgent } from "./base.js";
import type { UserProfile } from "./preprocessor.js";
export interface MemoirOutlineRequest {
    readonly userId: string;
    readonly profile: UserProfile;
    readonly targetChapters?: number;
    readonly structure?: "chronological" | "thematic" | "mixed";
}
export interface MemoirOutlineOutput {
    readonly title: string;
    readonly subtitle: string;
    readonly summary: string;
    readonly structure: "chronological" | "thematic" | "mixed";
    readonly chapters: ReadonlyArray<ChapterOutline>;
    readonly themes: ReadonlyArray<string>;
}
export interface ChapterOutline {
    readonly chapterNumber: number;
    readonly title: string;
    readonly period: {
        readonly start: string;
        readonly end: string;
    };
    readonly focus: string;
    readonly keyEvents: ReadonlyArray<string>;
    readonly estimatedWords: number;
}
export declare class MemoirArchitectAgent extends BaseAgent {
    get name(): string;
    generateOutline(request: MemoirOutlineRequest): Promise<MemoirOutlineOutput>;
    private determineBestStructure;
    private buildContext;
    private buildSystemPrompt;
    private buildUserPrompt;
    private parseOutput;
    private parseChapterOutline;
    private parsePeriod;
    private generateDefaultOutline;
    private formatEventDate;
}
//# sourceMappingURL=memoir-architect.d.ts.map