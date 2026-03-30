/**
 * Timeline models
 */

/**
 * Timeline event
 */
export interface TimelineEvent {
  readonly eventId: string;
  readonly date: TimelineDate;
  readonly title: string;
  readonly description: string;
  readonly category: EventCategory;
  readonly importance: "critical" | "high" | "medium" | "low";
  readonly verified?: boolean;
  readonly confidence: number;
  readonly sourceAnswerIds: ReadonlyArray<string>;
  readonly tags?: ReadonlyArray<string>;
  readonly relatedEvents?: ReadonlyArray<string>;  // IDs of related events
}

/**
 * Timeline date (supports fuzzy dates)
 */
export type TimelineDate =
  | { readonly type: "exact"; readonly year: number; readonly month?: number; readonly day?: number }
  | { readonly type: "era"; readonly era: string; readonly description: string }
  | { readonly type: "approximate"; readonly year: number; readonly range: number };  // year ± range

/**
 * Event categories
 */
export type EventCategory =
  | "birth"
  | "education"
  | "career"
  | "family"
  | "residence"
  | "travel"
  | "health"
  | "achievement"
  | "milestone"
  | "historical_context";  // Historical events that affected the person

/**
 * Timeline
 */
export interface Timeline {
  readonly timelineId: string;
  readonly userId: string;
  readonly events: ReadonlyArray<TimelineEvent>;
  readonly metadata: TimelineMetadata;
  readonly conflicts: ReadonlyArray<TimelineConflict>;
  readonly gaps: ReadonlyArray<TimelineGap>;
}

/**
 * Timeline metadata
 */
export interface TimelineMetadata {
  readonly birthYear?: number;
  readonly deathYear?: number;
  readonly earliestYear: number;
  readonly latestYear: number;
  readonly totalEvents: number;
  readonly verifiedEvents: number;
  readonly eraSummaries: ReadonlyArray<EraSummary>;
}

/**
 * Era summary (period analysis)
 */
export interface EraSummary {
  readonly era: string;          // e.g., "1980s", "1990-1995"
  readonly startYear: number;
  readonly endYear: number;
  readonly eventCount: number;
  readonly dominantThemes: ReadonlyArray<string>;
  readonly lifeStage: string;     // e.g., "childhood", "early career"
}

/**
 * Timeline conflict
 */
export interface TimelineConflict {
  readonly conflictId: string;
  readonly type: "date_overlap" | "impossible_sequence" | "age_mismatch" | "contradiction";
  readonly severity: "critical" | "warning" | "info";
  readonly description: string;
  readonly involvedEventIds: ReadonlyArray<string>;
  readonly suggestion?: string;
}

/**
 * Timeline gap (periods with few or no events)
 */
export interface TimelineGap {
  readonly gapId: string;
  readonly startYear: number;
  readonly endYear: number;
  readonly duration: number;      // in years
  readonly severity: "critical" | "warning" | "info";
  readonly description: string;
  readonly suggestedQuestions: ReadonlyArray<string>;
}

/**
 * Timeline build request
 */
export interface TimelineBuildRequest {
  readonly userId: string;
  readonly interviewAnswers: ReadonlyArray<{ readonly answerId: string; readonly answer: string }>;
  readonly existingTimeline?: Timeline;
  readonly options?: TimelineBuildOptions;
}

/**
 * Timeline build options
 */
export interface TimelineBuildOptions {
  readonly verifyDates?: boolean;
  readonly detectConflicts?: boolean;
  readonly identifyGaps?: boolean;
  readonly groupByEra?: boolean;
  readonly includeHistoricalContext?: boolean;
}

/**
 * Timeline build result
 */
export interface TimelineBuildResult {
  readonly timeline: Timeline;
  readonly addedEvents: number;
  readonly updatedEvents: number;
  readonly conflictsFound: number;
  readonly gapsIdentified: number;
  readonly summary: string;
}

/**
 * Timeline verification request
 */
export interface TimelineVerificationRequest {
  readonly timeline: Timeline;
  readonly factVerificationService?: {
    verify: (fact: string) => Promise<{ readonly status: string; readonly confidence: number }>;
  };
}

/**
 * Timeline verification result
 */
export interface TimelineVerificationResult {
  readonly verifiedEvents: ReadonlyArray<{ readonly eventId: string; readonly verified: boolean }>;
  readonly verificationSummary: string;
}
