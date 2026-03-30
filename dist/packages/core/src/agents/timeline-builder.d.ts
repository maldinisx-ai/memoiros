/**
 * Timeline Builder Agent
 *
 * Extracts events from interview answers and builds a chronological timeline
 */
import { BaseAgent } from "./base.js";
import type { TimelineBuildRequest, TimelineBuildResult } from "../models/timeline.js";
/**
 * Timeline Builder Agent
 */
export declare class TimelineBuilderAgent extends BaseAgent {
    get name(): string;
    /**
     * Build timeline from interview answers
     */
    buildTimeline(request: TimelineBuildRequest): Promise<TimelineBuildResult>;
    /**
     * Extract events from interview answers
     */
    private extractEventsFromAnswers;
    /**
     * Extract events from a single answer
     */
    private extractEventsFromAnswer;
    /**
     * Normalize date to TimelineDate format
     */
    private normalizeDate;
    /**
     * Sort events by date
     */
    private sortEventsByDate;
    /**
     * Extract year from TimelineDate for sorting
     */
    private extractYear;
    /**
     * Merge new events with existing events
     */
    private mergeEvents;
    /**
     * Check if two events are similar (potential duplicates)
     */
    private areEventsSimilar;
    /**
     * Calculate string similarity (simple version)
     */
    private stringSimilarity;
    /**
     * Levenshtein distance
     */
    private levenshteinDistance;
    /**
     * Detect conflicts in timeline
     */
    private detectConflicts;
    /**
     * Check if two events conflict
     */
    private areEventsConflicting;
    /**
     * Use LLM to detect deeper conflicts
     */
    private detectLLMConflicts;
    /**
     * Identify gaps in timeline
     */
    private identifyGaps;
    /**
     * Generate questions for timeline gaps
     */
    private generateGapQuestions;
    /**
     * Build timeline metadata
     */
    private buildMetadata;
    /**
     * Build era summaries
     */
    private buildEraSummaries;
    /**
     * Extract dominant themes from events
     */
    private extractThemes;
    /**
     * Determine life stage for a year
     */
    private determineLifeStage;
    /**
     * Format date for display
     */
    private formatDate;
    /**
     * Generate summary
     */
    private generateSummary;
    /**
     * Generate unique ID
     */
    private generateId;
}
//# sourceMappingURL=timeline-builder.d.ts.map