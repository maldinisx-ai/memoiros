/**
 * Zod schemas for Timeline models
 */
import { z } from "zod";
/**
 * Timeline date schema (supports fuzzy dates)
 */
export const timelineDateExactSchema = z.object({
    type: z.literal("exact"),
    year: z.number().int().min(1000).max(3000),
    month: z.number().int().min(1).max(12).optional(),
    day: z.number().int().min(1).max(31).optional(),
});
export const timelineDateEraSchema = z.object({
    type: z.literal("era"),
    era: z.string().min(1),
    description: z.string().min(1),
});
export const timelineDateApproximateSchema = z.object({
    type: z.literal("approximate"),
    year: z.number().int().min(1000).max(3000),
    range: z.number().int().min(0).max(100),
});
export const timelineDateSchema = z.discriminatedUnion("type", [
    timelineDateExactSchema,
    timelineDateEraSchema,
    timelineDateApproximateSchema,
]);
/**
 * Event categories
 */
export const eventCategorySchema = z.enum([
    "birth",
    "education",
    "career",
    "family",
    "residence",
    "travel",
    "health",
    "achievement",
    "milestone",
    "historical_context",
]);
/**
 * Timeline event schema
 */
export const timelineEventSchema = z.object({
    eventId: z.string().uuid(),
    date: timelineDateSchema,
    title: z.string().min(1).max(500),
    description: z.string().min(1).max(5000),
    category: eventCategorySchema,
    importance: z.enum(["critical", "high", "medium", "low"]),
    verified: z.boolean().optional().default(false),
    confidence: z.number().min(0).max(1),
    sourceAnswerIds: z.array(z.string().uuid()).min(1),
    tags: z.array(z.string().max(50)).optional(),
    relatedEvents: z.array(z.string().uuid()).optional(),
});
/**
 * Era summary schema
 */
export const eraSummarySchema = z.object({
    era: z.string().min(1).max(50),
    startYear: z.number().int().min(1000).max(3000),
    endYear: z.number().int().min(1000).max(3000),
    eventCount: z.number().int().min(0),
    dominantThemes: z.array(z.string().max(100)).max(10),
    lifeStage: z.string().min(1).max(50),
});
/**
 * Timeline metadata schema
 */
export const timelineMetadataSchema = z.object({
    birthYear: z.number().int().min(1800).max(2024).optional(),
    deathYear: z.number().int().min(1800).max(2100).optional(),
    earliestYear: z.number().int().min(1000).max(3000),
    latestYear: z.number().int().min(1000).max(3000),
    totalEvents: z.number().int().min(0),
    verifiedEvents: z.number().int().min(0),
    eraSummaries: z.array(eraSummarySchema),
});
/**
 * Timeline conflict schema
 */
export const timelineConflictSchema = z.object({
    conflictId: z.string().uuid(),
    type: z.enum(["date_overlap", "impossible_sequence", "age_mismatch", "contradiction"]),
    severity: z.enum(["critical", "warning", "info"]),
    description: z.string().min(1).max(1000),
    involvedEventIds: z.array(z.string().uuid()).min(2),
    suggestion: z.string().max(500).optional(),
});
/**
 * Timeline gap schema
 */
export const timelineGapSchema = z.object({
    gapId: z.string().uuid(),
    startYear: z.number().int().min(1000).max(3000),
    endYear: z.number().int().min(1000).max(3000),
    duration: z.number().int().min(0),
    severity: z.enum(["critical", "warning", "info"]),
    description: z.string().min(1).max(500),
    suggestedQuestions: z.array(z.string().min(1).max(200)).min(1),
});
/**
 * Timeline schema
 */
export const timelineSchema = z.object({
    timelineId: z.string().uuid(),
    userId: z.string().min(1).max(100),
    events: z.array(timelineEventSchema),
    metadata: timelineMetadataSchema,
    conflicts: z.array(timelineConflictSchema),
    gaps: z.array(timelineGapSchema),
});
/**
 * Timeline build options schema
 */
export const timelineBuildOptionsSchema = z.object({
    verifyDates: z.boolean().optional().default(false),
    detectConflicts: z.boolean().optional().default(false),
    identifyGaps: z.boolean().optional().default(false),
    groupByEra: z.boolean().optional().default(false),
    includeHistoricalContext: z.boolean().optional().default(false),
});
/**
 * Timeline build request schema
 */
export const timelineBuildRequestSchema = z.object({
    userId: z.string().min(1).max(100),
    interviewAnswers: z.array(z.object({
        answerId: z.string().uuid(),
        answer: z.string().min(1).max(10000),
    })).min(1),
    existingTimeline: timelineSchema.optional(),
    options: timelineBuildOptionsSchema.optional(),
});
/**
 * Timeline build result schema
 */
export const timelineBuildResultSchema = z.object({
    timeline: timelineSchema,
    addedEvents: z.number().int().min(0),
    updatedEvents: z.number().int().min(0),
    conflictsFound: z.number().int().min(0),
    gapsIdentified: z.number().int().min(0),
    summary: z.string().min(1).max(5000),
});
/**
 * Timeline verification request schema
 */
export const timelineVerificationRequestSchema = z.object({
    timeline: timelineSchema,
    factVerificationService: z.any().optional(), // Function type cannot be validated by Zod
});
/**
 * Timeline verification result schema
 */
export const timelineVerificationResultSchema = z.object({
    verifiedEvents: z.array(z.object({
        eventId: z.string().uuid(),
        verified: z.boolean(),
    })),
    verificationSummary: z.string().min(1).max(5000),
});
//# sourceMappingURL=timeline.schemas.js.map