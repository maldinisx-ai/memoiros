/**
 * Preprocessor Agent
 *
 * 整合所有 Agent 提取的信息，为小说编辑准备结构化数据
 */
import { BaseAgent } from "./base.js";
import type { AgentContext } from "./base.js";
import type { ExtractedEntities, ExtractedFact } from "../models/interview.js";
import type { VoiceProfile } from "../models/style.js";
import type { TimelineEvent } from "../models/timeline.js";
/**
 * User profile for memoir writing
 */
export interface UserProfile {
    readonly userId: string;
    readonly interviewId: string;
    readonly basicInfo: BasicInfo;
    readonly timeline: ReadonlyArray<TimelineEvent>;
    readonly entities: ExtractedEntities;
    readonly facts: ReadonlyArray<ExtractedFact>;
    readonly voiceProfile: VoiceProfile;
    readonly themes: ReadonlyArray<Theme>;
    readonly storyStructure: StoryStructure;
    readonly metadata: PreprocessMetadata;
}
export interface BasicInfo {
    readonly name?: string;
    readonly birthYear?: number;
    readonly birthMonth?: number;
    readonly birthDay?: number;
    readonly birthPlace?: string;
    readonly education?: string;
    readonly career?: string;
    readonly gender?: string;
    readonly occupation?: string;
}
export interface Theme {
    readonly themeId: string;
    readonly name: string;
    readonly description: string;
    readonly relatedEvents: ReadonlyArray<string>;
    readonly emotionalTone: string;
}
export interface StoryStructure {
    readonly opening: StoryPhase;
    readonly development: ReadonlyArray<StoryPhase>;
    readonly climax: StoryPhase;
    readonly resolution: StoryPhase;
}
export interface StoryPhase {
    readonly phaseId: string;
    readonly title: string;
    readonly timeRange: string;
    readonly keyEvents: ReadonlyArray<string>;
    readonly emotionalArc: string;
}
export interface PreprocessMetadata {
    readonly processedAt: string;
    readonly totalAnswers: number;
    readonly completedPhases: ReadonlyArray<string>;
    readonly currentPhase: string;
    readonly confidence: number;
    readonly gaps: ReadonlyArray<string>;
}
/**
 * Preprocess request
 */
export interface PreprocessRequest {
    readonly userId: string;
    readonly interviewId?: string;
    readonly includeTimeline?: boolean;
    readonly includeVoiceProfile?: boolean;
}
/**
 * Preprocess result
 */
export interface PreprocessResult {
    readonly profile: UserProfile;
    readonly summary: string;
    readonly suggestions: ReadonlyArray<string>;
}
/**
 * Preprocessor Agent
 */
export declare class PreprocessorAgent extends BaseAgent {
    private readonly storage;
    constructor(ctx: AgentContext, storage?: any);
    get name(): string;
    /**
     * Main entry point: process interview data and generate user profile
     */
    preprocess(request: PreprocessRequest): Promise<PreprocessResult>;
    /**
     * Load interview data from storage
     */
    private loadInterviewData;
    /**
     * Extract basic information from answers
     */
    private extractBasicInfo;
    /**
     * Extract and aggregate entities from all answers
     */
    private extractEntities;
    /**
     * Extract and aggregate facts from all answers
     */
    private extractFacts;
    /**
     * Build timeline from facts and entities
     */
    private buildTimeline;
    /**
     * Analyze user's voice profile from answers
     */
    private analyzeVoiceProfile;
    /**
     * Extract themes from interview data
     */
    private extractThemes;
    /**
     * Build story structure
     */
    private buildStoryStructure;
    /**
     * Generate metadata
     */
    private generateMetadata;
    /**
     * Generate summary
     */
    private generateSummary;
    /**
     * Generate suggestions for improvement
     */
    private generateSuggestions;
    /**
     * Get default voice profile
     */
    private getDefaultVoiceProfile;
    /**
     * Generate unique ID
     */
    private generateId;
    /**
     * Clean LLM response by removing markdown code blocks
     */
    private cleanJSONResponse;
}
//# sourceMappingURL=preprocessor.d.ts.map