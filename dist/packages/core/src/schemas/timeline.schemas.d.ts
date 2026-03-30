/**
 * Zod schemas for Timeline models
 */
import { z } from "zod";
/**
 * Timeline date schema (supports fuzzy dates)
 */
export declare const timelineDateExactSchema: z.ZodObject<{
    type: z.ZodLiteral<"exact">;
    year: z.ZodNumber;
    month: z.ZodOptional<z.ZodNumber>;
    day: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "exact";
    year: number;
    month?: number | undefined;
    day?: number | undefined;
}, {
    type: "exact";
    year: number;
    month?: number | undefined;
    day?: number | undefined;
}>;
export declare const timelineDateEraSchema: z.ZodObject<{
    type: z.ZodLiteral<"era">;
    era: z.ZodString;
    description: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "era";
    description: string;
    era: string;
}, {
    type: "era";
    description: string;
    era: string;
}>;
export declare const timelineDateApproximateSchema: z.ZodObject<{
    type: z.ZodLiteral<"approximate">;
    year: z.ZodNumber;
    range: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "approximate";
    year: number;
    range: number;
}, {
    type: "approximate";
    year: number;
    range: number;
}>;
export declare const timelineDateSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"exact">;
    year: z.ZodNumber;
    month: z.ZodOptional<z.ZodNumber>;
    day: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "exact";
    year: number;
    month?: number | undefined;
    day?: number | undefined;
}, {
    type: "exact";
    year: number;
    month?: number | undefined;
    day?: number | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"era">;
    era: z.ZodString;
    description: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "era";
    description: string;
    era: string;
}, {
    type: "era";
    description: string;
    era: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"approximate">;
    year: z.ZodNumber;
    range: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "approximate";
    year: number;
    range: number;
}, {
    type: "approximate";
    year: number;
    range: number;
}>]>;
/**
 * Event categories
 */
export declare const eventCategorySchema: z.ZodEnum<["birth", "education", "career", "family", "residence", "travel", "health", "achievement", "milestone", "historical_context"]>;
/**
 * Timeline event schema
 */
export declare const timelineEventSchema: z.ZodObject<{
    eventId: z.ZodString;
    date: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"exact">;
        year: z.ZodNumber;
        month: z.ZodOptional<z.ZodNumber>;
        day: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "exact";
        year: number;
        month?: number | undefined;
        day?: number | undefined;
    }, {
        type: "exact";
        year: number;
        month?: number | undefined;
        day?: number | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"era">;
        era: z.ZodString;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "era";
        description: string;
        era: string;
    }, {
        type: "era";
        description: string;
        era: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"approximate">;
        year: z.ZodNumber;
        range: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "approximate";
        year: number;
        range: number;
    }, {
        type: "approximate";
        year: number;
        range: number;
    }>]>;
    title: z.ZodString;
    description: z.ZodString;
    category: z.ZodEnum<["birth", "education", "career", "family", "residence", "travel", "health", "achievement", "milestone", "historical_context"]>;
    importance: z.ZodEnum<["critical", "high", "medium", "low"]>;
    verified: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    confidence: z.ZodNumber;
    sourceAnswerIds: z.ZodArray<z.ZodString, "many">;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    relatedEvents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    date: {
        type: "exact";
        year: number;
        month?: number | undefined;
        day?: number | undefined;
    } | {
        type: "era";
        description: string;
        era: string;
    } | {
        type: "approximate";
        year: number;
        range: number;
    };
    confidence: number;
    category: "education" | "career" | "family" | "birth" | "residence" | "travel" | "health" | "achievement" | "milestone" | "historical_context";
    description: string;
    eventId: string;
    importance: "critical" | "high" | "medium" | "low";
    sourceAnswerIds: string[];
    verified: boolean;
    tags?: string[] | undefined;
    relatedEvents?: string[] | undefined;
}, {
    title: string;
    date: {
        type: "exact";
        year: number;
        month?: number | undefined;
        day?: number | undefined;
    } | {
        type: "era";
        description: string;
        era: string;
    } | {
        type: "approximate";
        year: number;
        range: number;
    };
    confidence: number;
    category: "education" | "career" | "family" | "birth" | "residence" | "travel" | "health" | "achievement" | "milestone" | "historical_context";
    description: string;
    eventId: string;
    importance: "critical" | "high" | "medium" | "low";
    sourceAnswerIds: string[];
    tags?: string[] | undefined;
    verified?: boolean | undefined;
    relatedEvents?: string[] | undefined;
}>;
/**
 * Era summary schema
 */
export declare const eraSummarySchema: z.ZodObject<{
    era: z.ZodString;
    startYear: z.ZodNumber;
    endYear: z.ZodNumber;
    eventCount: z.ZodNumber;
    dominantThemes: z.ZodArray<z.ZodString, "many">;
    lifeStage: z.ZodString;
}, "strip", z.ZodTypeAny, {
    era: string;
    startYear: number;
    endYear: number;
    eventCount: number;
    dominantThemes: string[];
    lifeStage: string;
}, {
    era: string;
    startYear: number;
    endYear: number;
    eventCount: number;
    dominantThemes: string[];
    lifeStage: string;
}>;
/**
 * Timeline metadata schema
 */
export declare const timelineMetadataSchema: z.ZodObject<{
    birthYear: z.ZodOptional<z.ZodNumber>;
    deathYear: z.ZodOptional<z.ZodNumber>;
    earliestYear: z.ZodNumber;
    latestYear: z.ZodNumber;
    totalEvents: z.ZodNumber;
    verifiedEvents: z.ZodNumber;
    eraSummaries: z.ZodArray<z.ZodObject<{
        era: z.ZodString;
        startYear: z.ZodNumber;
        endYear: z.ZodNumber;
        eventCount: z.ZodNumber;
        dominantThemes: z.ZodArray<z.ZodString, "many">;
        lifeStage: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        era: string;
        startYear: number;
        endYear: number;
        eventCount: number;
        dominantThemes: string[];
        lifeStage: string;
    }, {
        era: string;
        startYear: number;
        endYear: number;
        eventCount: number;
        dominantThemes: string[];
        lifeStage: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    earliestYear: number;
    latestYear: number;
    totalEvents: number;
    verifiedEvents: number;
    eraSummaries: {
        era: string;
        startYear: number;
        endYear: number;
        eventCount: number;
        dominantThemes: string[];
        lifeStage: string;
    }[];
    birthYear?: number | undefined;
    deathYear?: number | undefined;
}, {
    earliestYear: number;
    latestYear: number;
    totalEvents: number;
    verifiedEvents: number;
    eraSummaries: {
        era: string;
        startYear: number;
        endYear: number;
        eventCount: number;
        dominantThemes: string[];
        lifeStage: string;
    }[];
    birthYear?: number | undefined;
    deathYear?: number | undefined;
}>;
/**
 * Timeline conflict schema
 */
export declare const timelineConflictSchema: z.ZodObject<{
    conflictId: z.ZodString;
    type: z.ZodEnum<["date_overlap", "impossible_sequence", "age_mismatch", "contradiction"]>;
    severity: z.ZodEnum<["critical", "warning", "info"]>;
    description: z.ZodString;
    involvedEventIds: z.ZodArray<z.ZodString, "many">;
    suggestion: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "date_overlap" | "impossible_sequence" | "age_mismatch" | "contradiction";
    severity: "info" | "critical" | "warning";
    description: string;
    involvedEventIds: string[];
    conflictId: string;
    suggestion?: string | undefined;
}, {
    type: "date_overlap" | "impossible_sequence" | "age_mismatch" | "contradiction";
    severity: "info" | "critical" | "warning";
    description: string;
    involvedEventIds: string[];
    conflictId: string;
    suggestion?: string | undefined;
}>;
/**
 * Timeline gap schema
 */
export declare const timelineGapSchema: z.ZodObject<{
    gapId: z.ZodString;
    startYear: z.ZodNumber;
    endYear: z.ZodNumber;
    duration: z.ZodNumber;
    severity: z.ZodEnum<["critical", "warning", "info"]>;
    description: z.ZodString;
    suggestedQuestions: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    severity: "info" | "critical" | "warning";
    description: string;
    suggestedQuestions: string[];
    startYear: number;
    endYear: number;
    duration: number;
    gapId: string;
}, {
    severity: "info" | "critical" | "warning";
    description: string;
    suggestedQuestions: string[];
    startYear: number;
    endYear: number;
    duration: number;
    gapId: string;
}>;
/**
 * Timeline schema
 */
export declare const timelineSchema: z.ZodObject<{
    timelineId: z.ZodString;
    userId: z.ZodString;
    events: z.ZodArray<z.ZodObject<{
        eventId: z.ZodString;
        date: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
            type: z.ZodLiteral<"exact">;
            year: z.ZodNumber;
            month: z.ZodOptional<z.ZodNumber>;
            day: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            type: "exact";
            year: number;
            month?: number | undefined;
            day?: number | undefined;
        }, {
            type: "exact";
            year: number;
            month?: number | undefined;
            day?: number | undefined;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"era">;
            era: z.ZodString;
            description: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "era";
            description: string;
            era: string;
        }, {
            type: "era";
            description: string;
            era: string;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"approximate">;
            year: z.ZodNumber;
            range: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            type: "approximate";
            year: number;
            range: number;
        }, {
            type: "approximate";
            year: number;
            range: number;
        }>]>;
        title: z.ZodString;
        description: z.ZodString;
        category: z.ZodEnum<["birth", "education", "career", "family", "residence", "travel", "health", "achievement", "milestone", "historical_context"]>;
        importance: z.ZodEnum<["critical", "high", "medium", "low"]>;
        verified: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        confidence: z.ZodNumber;
        sourceAnswerIds: z.ZodArray<z.ZodString, "many">;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        relatedEvents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        date: {
            type: "exact";
            year: number;
            month?: number | undefined;
            day?: number | undefined;
        } | {
            type: "era";
            description: string;
            era: string;
        } | {
            type: "approximate";
            year: number;
            range: number;
        };
        confidence: number;
        category: "education" | "career" | "family" | "birth" | "residence" | "travel" | "health" | "achievement" | "milestone" | "historical_context";
        description: string;
        eventId: string;
        importance: "critical" | "high" | "medium" | "low";
        sourceAnswerIds: string[];
        verified: boolean;
        tags?: string[] | undefined;
        relatedEvents?: string[] | undefined;
    }, {
        title: string;
        date: {
            type: "exact";
            year: number;
            month?: number | undefined;
            day?: number | undefined;
        } | {
            type: "era";
            description: string;
            era: string;
        } | {
            type: "approximate";
            year: number;
            range: number;
        };
        confidence: number;
        category: "education" | "career" | "family" | "birth" | "residence" | "travel" | "health" | "achievement" | "milestone" | "historical_context";
        description: string;
        eventId: string;
        importance: "critical" | "high" | "medium" | "low";
        sourceAnswerIds: string[];
        tags?: string[] | undefined;
        verified?: boolean | undefined;
        relatedEvents?: string[] | undefined;
    }>, "many">;
    metadata: z.ZodObject<{
        birthYear: z.ZodOptional<z.ZodNumber>;
        deathYear: z.ZodOptional<z.ZodNumber>;
        earliestYear: z.ZodNumber;
        latestYear: z.ZodNumber;
        totalEvents: z.ZodNumber;
        verifiedEvents: z.ZodNumber;
        eraSummaries: z.ZodArray<z.ZodObject<{
            era: z.ZodString;
            startYear: z.ZodNumber;
            endYear: z.ZodNumber;
            eventCount: z.ZodNumber;
            dominantThemes: z.ZodArray<z.ZodString, "many">;
            lifeStage: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            era: string;
            startYear: number;
            endYear: number;
            eventCount: number;
            dominantThemes: string[];
            lifeStage: string;
        }, {
            era: string;
            startYear: number;
            endYear: number;
            eventCount: number;
            dominantThemes: string[];
            lifeStage: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        earliestYear: number;
        latestYear: number;
        totalEvents: number;
        verifiedEvents: number;
        eraSummaries: {
            era: string;
            startYear: number;
            endYear: number;
            eventCount: number;
            dominantThemes: string[];
            lifeStage: string;
        }[];
        birthYear?: number | undefined;
        deathYear?: number | undefined;
    }, {
        earliestYear: number;
        latestYear: number;
        totalEvents: number;
        verifiedEvents: number;
        eraSummaries: {
            era: string;
            startYear: number;
            endYear: number;
            eventCount: number;
            dominantThemes: string[];
            lifeStage: string;
        }[];
        birthYear?: number | undefined;
        deathYear?: number | undefined;
    }>;
    conflicts: z.ZodArray<z.ZodObject<{
        conflictId: z.ZodString;
        type: z.ZodEnum<["date_overlap", "impossible_sequence", "age_mismatch", "contradiction"]>;
        severity: z.ZodEnum<["critical", "warning", "info"]>;
        description: z.ZodString;
        involvedEventIds: z.ZodArray<z.ZodString, "many">;
        suggestion: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "date_overlap" | "impossible_sequence" | "age_mismatch" | "contradiction";
        severity: "info" | "critical" | "warning";
        description: string;
        involvedEventIds: string[];
        conflictId: string;
        suggestion?: string | undefined;
    }, {
        type: "date_overlap" | "impossible_sequence" | "age_mismatch" | "contradiction";
        severity: "info" | "critical" | "warning";
        description: string;
        involvedEventIds: string[];
        conflictId: string;
        suggestion?: string | undefined;
    }>, "many">;
    gaps: z.ZodArray<z.ZodObject<{
        gapId: z.ZodString;
        startYear: z.ZodNumber;
        endYear: z.ZodNumber;
        duration: z.ZodNumber;
        severity: z.ZodEnum<["critical", "warning", "info"]>;
        description: z.ZodString;
        suggestedQuestions: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        severity: "info" | "critical" | "warning";
        description: string;
        suggestedQuestions: string[];
        startYear: number;
        endYear: number;
        duration: number;
        gapId: string;
    }, {
        severity: "info" | "critical" | "warning";
        description: string;
        suggestedQuestions: string[];
        startYear: number;
        endYear: number;
        duration: number;
        gapId: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    userId: string;
    metadata: {
        earliestYear: number;
        latestYear: number;
        totalEvents: number;
        verifiedEvents: number;
        eraSummaries: {
            era: string;
            startYear: number;
            endYear: number;
            eventCount: number;
            dominantThemes: string[];
            lifeStage: string;
        }[];
        birthYear?: number | undefined;
        deathYear?: number | undefined;
    };
    timelineId: string;
    events: {
        title: string;
        date: {
            type: "exact";
            year: number;
            month?: number | undefined;
            day?: number | undefined;
        } | {
            type: "era";
            description: string;
            era: string;
        } | {
            type: "approximate";
            year: number;
            range: number;
        };
        confidence: number;
        category: "education" | "career" | "family" | "birth" | "residence" | "travel" | "health" | "achievement" | "milestone" | "historical_context";
        description: string;
        eventId: string;
        importance: "critical" | "high" | "medium" | "low";
        sourceAnswerIds: string[];
        verified: boolean;
        tags?: string[] | undefined;
        relatedEvents?: string[] | undefined;
    }[];
    conflicts: {
        type: "date_overlap" | "impossible_sequence" | "age_mismatch" | "contradiction";
        severity: "info" | "critical" | "warning";
        description: string;
        involvedEventIds: string[];
        conflictId: string;
        suggestion?: string | undefined;
    }[];
    gaps: {
        severity: "info" | "critical" | "warning";
        description: string;
        suggestedQuestions: string[];
        startYear: number;
        endYear: number;
        duration: number;
        gapId: string;
    }[];
}, {
    userId: string;
    metadata: {
        earliestYear: number;
        latestYear: number;
        totalEvents: number;
        verifiedEvents: number;
        eraSummaries: {
            era: string;
            startYear: number;
            endYear: number;
            eventCount: number;
            dominantThemes: string[];
            lifeStage: string;
        }[];
        birthYear?: number | undefined;
        deathYear?: number | undefined;
    };
    timelineId: string;
    events: {
        title: string;
        date: {
            type: "exact";
            year: number;
            month?: number | undefined;
            day?: number | undefined;
        } | {
            type: "era";
            description: string;
            era: string;
        } | {
            type: "approximate";
            year: number;
            range: number;
        };
        confidence: number;
        category: "education" | "career" | "family" | "birth" | "residence" | "travel" | "health" | "achievement" | "milestone" | "historical_context";
        description: string;
        eventId: string;
        importance: "critical" | "high" | "medium" | "low";
        sourceAnswerIds: string[];
        tags?: string[] | undefined;
        verified?: boolean | undefined;
        relatedEvents?: string[] | undefined;
    }[];
    conflicts: {
        type: "date_overlap" | "impossible_sequence" | "age_mismatch" | "contradiction";
        severity: "info" | "critical" | "warning";
        description: string;
        involvedEventIds: string[];
        conflictId: string;
        suggestion?: string | undefined;
    }[];
    gaps: {
        severity: "info" | "critical" | "warning";
        description: string;
        suggestedQuestions: string[];
        startYear: number;
        endYear: number;
        duration: number;
        gapId: string;
    }[];
}>;
/**
 * Timeline build options schema
 */
export declare const timelineBuildOptionsSchema: z.ZodObject<{
    verifyDates: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    detectConflicts: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    identifyGaps: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    groupByEra: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeHistoricalContext: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    verifyDates: boolean;
    detectConflicts: boolean;
    identifyGaps: boolean;
    groupByEra: boolean;
    includeHistoricalContext: boolean;
}, {
    verifyDates?: boolean | undefined;
    detectConflicts?: boolean | undefined;
    identifyGaps?: boolean | undefined;
    groupByEra?: boolean | undefined;
    includeHistoricalContext?: boolean | undefined;
}>;
/**
 * Timeline build request schema
 */
export declare const timelineBuildRequestSchema: z.ZodObject<{
    userId: z.ZodString;
    interviewAnswers: z.ZodArray<z.ZodObject<{
        answerId: z.ZodString;
        answer: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        answerId: string;
        answer: string;
    }, {
        answerId: string;
        answer: string;
    }>, "many">;
    existingTimeline: z.ZodOptional<z.ZodObject<{
        timelineId: z.ZodString;
        userId: z.ZodString;
        events: z.ZodArray<z.ZodObject<{
            eventId: z.ZodString;
            date: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
                type: z.ZodLiteral<"exact">;
                year: z.ZodNumber;
                month: z.ZodOptional<z.ZodNumber>;
                day: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                type: "exact";
                year: number;
                month?: number | undefined;
                day?: number | undefined;
            }, {
                type: "exact";
                year: number;
                month?: number | undefined;
                day?: number | undefined;
            }>, z.ZodObject<{
                type: z.ZodLiteral<"era">;
                era: z.ZodString;
                description: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                type: "era";
                description: string;
                era: string;
            }, {
                type: "era";
                description: string;
                era: string;
            }>, z.ZodObject<{
                type: z.ZodLiteral<"approximate">;
                year: z.ZodNumber;
                range: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                type: "approximate";
                year: number;
                range: number;
            }, {
                type: "approximate";
                year: number;
                range: number;
            }>]>;
            title: z.ZodString;
            description: z.ZodString;
            category: z.ZodEnum<["birth", "education", "career", "family", "residence", "travel", "health", "achievement", "milestone", "historical_context"]>;
            importance: z.ZodEnum<["critical", "high", "medium", "low"]>;
            verified: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            confidence: z.ZodNumber;
            sourceAnswerIds: z.ZodArray<z.ZodString, "many">;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            relatedEvents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            title: string;
            date: {
                type: "exact";
                year: number;
                month?: number | undefined;
                day?: number | undefined;
            } | {
                type: "era";
                description: string;
                era: string;
            } | {
                type: "approximate";
                year: number;
                range: number;
            };
            confidence: number;
            category: "education" | "career" | "family" | "birth" | "residence" | "travel" | "health" | "achievement" | "milestone" | "historical_context";
            description: string;
            eventId: string;
            importance: "critical" | "high" | "medium" | "low";
            sourceAnswerIds: string[];
            verified: boolean;
            tags?: string[] | undefined;
            relatedEvents?: string[] | undefined;
        }, {
            title: string;
            date: {
                type: "exact";
                year: number;
                month?: number | undefined;
                day?: number | undefined;
            } | {
                type: "era";
                description: string;
                era: string;
            } | {
                type: "approximate";
                year: number;
                range: number;
            };
            confidence: number;
            category: "education" | "career" | "family" | "birth" | "residence" | "travel" | "health" | "achievement" | "milestone" | "historical_context";
            description: string;
            eventId: string;
            importance: "critical" | "high" | "medium" | "low";
            sourceAnswerIds: string[];
            tags?: string[] | undefined;
            verified?: boolean | undefined;
            relatedEvents?: string[] | undefined;
        }>, "many">;
        metadata: z.ZodObject<{
            birthYear: z.ZodOptional<z.ZodNumber>;
            deathYear: z.ZodOptional<z.ZodNumber>;
            earliestYear: z.ZodNumber;
            latestYear: z.ZodNumber;
            totalEvents: z.ZodNumber;
            verifiedEvents: z.ZodNumber;
            eraSummaries: z.ZodArray<z.ZodObject<{
                era: z.ZodString;
                startYear: z.ZodNumber;
                endYear: z.ZodNumber;
                eventCount: z.ZodNumber;
                dominantThemes: z.ZodArray<z.ZodString, "many">;
                lifeStage: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                era: string;
                startYear: number;
                endYear: number;
                eventCount: number;
                dominantThemes: string[];
                lifeStage: string;
            }, {
                era: string;
                startYear: number;
                endYear: number;
                eventCount: number;
                dominantThemes: string[];
                lifeStage: string;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            earliestYear: number;
            latestYear: number;
            totalEvents: number;
            verifiedEvents: number;
            eraSummaries: {
                era: string;
                startYear: number;
                endYear: number;
                eventCount: number;
                dominantThemes: string[];
                lifeStage: string;
            }[];
            birthYear?: number | undefined;
            deathYear?: number | undefined;
        }, {
            earliestYear: number;
            latestYear: number;
            totalEvents: number;
            verifiedEvents: number;
            eraSummaries: {
                era: string;
                startYear: number;
                endYear: number;
                eventCount: number;
                dominantThemes: string[];
                lifeStage: string;
            }[];
            birthYear?: number | undefined;
            deathYear?: number | undefined;
        }>;
        conflicts: z.ZodArray<z.ZodObject<{
            conflictId: z.ZodString;
            type: z.ZodEnum<["date_overlap", "impossible_sequence", "age_mismatch", "contradiction"]>;
            severity: z.ZodEnum<["critical", "warning", "info"]>;
            description: z.ZodString;
            involvedEventIds: z.ZodArray<z.ZodString, "many">;
            suggestion: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: "date_overlap" | "impossible_sequence" | "age_mismatch" | "contradiction";
            severity: "info" | "critical" | "warning";
            description: string;
            involvedEventIds: string[];
            conflictId: string;
            suggestion?: string | undefined;
        }, {
            type: "date_overlap" | "impossible_sequence" | "age_mismatch" | "contradiction";
            severity: "info" | "critical" | "warning";
            description: string;
            involvedEventIds: string[];
            conflictId: string;
            suggestion?: string | undefined;
        }>, "many">;
        gaps: z.ZodArray<z.ZodObject<{
            gapId: z.ZodString;
            startYear: z.ZodNumber;
            endYear: z.ZodNumber;
            duration: z.ZodNumber;
            severity: z.ZodEnum<["critical", "warning", "info"]>;
            description: z.ZodString;
            suggestedQuestions: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            severity: "info" | "critical" | "warning";
            description: string;
            suggestedQuestions: string[];
            startYear: number;
            endYear: number;
            duration: number;
            gapId: string;
        }, {
            severity: "info" | "critical" | "warning";
            description: string;
            suggestedQuestions: string[];
            startYear: number;
            endYear: number;
            duration: number;
            gapId: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        metadata: {
            earliestYear: number;
            latestYear: number;
            totalEvents: number;
            verifiedEvents: number;
            eraSummaries: {
                era: string;
                startYear: number;
                endYear: number;
                eventCount: number;
                dominantThemes: string[];
                lifeStage: string;
            }[];
            birthYear?: number | undefined;
            deathYear?: number | undefined;
        };
        timelineId: string;
        events: {
            title: string;
            date: {
                type: "exact";
                year: number;
                month?: number | undefined;
                day?: number | undefined;
            } | {
                type: "era";
                description: string;
                era: string;
            } | {
                type: "approximate";
                year: number;
                range: number;
            };
            confidence: number;
            category: "education" | "career" | "family" | "birth" | "residence" | "travel" | "health" | "achievement" | "milestone" | "historical_context";
            description: string;
            eventId: string;
            importance: "critical" | "high" | "medium" | "low";
            sourceAnswerIds: string[];
            verified: boolean;
            tags?: string[] | undefined;
            relatedEvents?: string[] | undefined;
        }[];
        conflicts: {
            type: "date_overlap" | "impossible_sequence" | "age_mismatch" | "contradiction";
            severity: "info" | "critical" | "warning";
            description: string;
            involvedEventIds: string[];
            conflictId: string;
            suggestion?: string | undefined;
        }[];
        gaps: {
            severity: "info" | "critical" | "warning";
            description: string;
            suggestedQuestions: string[];
            startYear: number;
            endYear: number;
            duration: number;
            gapId: string;
        }[];
    }, {
        userId: string;
        metadata: {
            earliestYear: number;
            latestYear: number;
            totalEvents: number;
            verifiedEvents: number;
            eraSummaries: {
                era: string;
                startYear: number;
                endYear: number;
                eventCount: number;
                dominantThemes: string[];
                lifeStage: string;
            }[];
            birthYear?: number | undefined;
            deathYear?: number | undefined;
        };
        timelineId: string;
        events: {
            title: string;
            date: {
                type: "exact";
                year: number;
                month?: number | undefined;
                day?: number | undefined;
            } | {
                type: "era";
                description: string;
                era: string;
            } | {
                type: "approximate";
                year: number;
                range: number;
            };
            confidence: number;
            category: "education" | "career" | "family" | "birth" | "residence" | "travel" | "health" | "achievement" | "milestone" | "historical_context";
            description: string;
            eventId: string;
            importance: "critical" | "high" | "medium" | "low";
            sourceAnswerIds: string[];
            tags?: string[] | undefined;
            verified?: boolean | undefined;
            relatedEvents?: string[] | undefined;
        }[];
        conflicts: {
            type: "date_overlap" | "impossible_sequence" | "age_mismatch" | "contradiction";
            severity: "info" | "critical" | "warning";
            description: string;
            involvedEventIds: string[];
            conflictId: string;
            suggestion?: string | undefined;
        }[];
        gaps: {
            severity: "info" | "critical" | "warning";
            description: string;
            suggestedQuestions: string[];
            startYear: number;
            endYear: number;
            duration: number;
            gapId: string;
        }[];
    }>>;
    options: z.ZodOptional<z.ZodObject<{
        verifyDates: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        detectConflicts: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        identifyGaps: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        groupByEra: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        includeHistoricalContext: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        verifyDates: boolean;
        detectConflicts: boolean;
        identifyGaps: boolean;
        groupByEra: boolean;
        includeHistoricalContext: boolean;
    }, {
        verifyDates?: boolean | undefined;
        detectConflicts?: boolean | undefined;
        identifyGaps?: boolean | undefined;
        groupByEra?: boolean | undefined;
        includeHistoricalContext?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    interviewAnswers: {
        answerId: string;
        answer: string;
    }[];
    options?: {
        verifyDates: boolean;
        detectConflicts: boolean;
        identifyGaps: boolean;
        groupByEra: boolean;
        includeHistoricalContext: boolean;
    } | undefined;
    existingTimeline?: {
        userId: string;
        metadata: {
            earliestYear: number;
            latestYear: number;
            totalEvents: number;
            verifiedEvents: number;
            eraSummaries: {
                era: string;
                startYear: number;
                endYear: number;
                eventCount: number;
                dominantThemes: string[];
                lifeStage: string;
            }[];
            birthYear?: number | undefined;
            deathYear?: number | undefined;
        };
        timelineId: string;
        events: {
            title: string;
            date: {
                type: "exact";
                year: number;
                month?: number | undefined;
                day?: number | undefined;
            } | {
                type: "era";
                description: string;
                era: string;
            } | {
                type: "approximate";
                year: number;
                range: number;
            };
            confidence: number;
            category: "education" | "career" | "family" | "birth" | "residence" | "travel" | "health" | "achievement" | "milestone" | "historical_context";
            description: string;
            eventId: string;
            importance: "critical" | "high" | "medium" | "low";
            sourceAnswerIds: string[];
            verified: boolean;
            tags?: string[] | undefined;
            relatedEvents?: string[] | undefined;
        }[];
        conflicts: {
            type: "date_overlap" | "impossible_sequence" | "age_mismatch" | "contradiction";
            severity: "info" | "critical" | "warning";
            description: string;
            involvedEventIds: string[];
            conflictId: string;
            suggestion?: string | undefined;
        }[];
        gaps: {
            severity: "info" | "critical" | "warning";
            description: string;
            suggestedQuestions: string[];
            startYear: number;
            endYear: number;
            duration: number;
            gapId: string;
        }[];
    } | undefined;
}, {
    userId: string;
    interviewAnswers: {
        answerId: string;
        answer: string;
    }[];
    options?: {
        verifyDates?: boolean | undefined;
        detectConflicts?: boolean | undefined;
        identifyGaps?: boolean | undefined;
        groupByEra?: boolean | undefined;
        includeHistoricalContext?: boolean | undefined;
    } | undefined;
    existingTimeline?: {
        userId: string;
        metadata: {
            earliestYear: number;
            latestYear: number;
            totalEvents: number;
            verifiedEvents: number;
            eraSummaries: {
                era: string;
                startYear: number;
                endYear: number;
                eventCount: number;
                dominantThemes: string[];
                lifeStage: string;
            }[];
            birthYear?: number | undefined;
            deathYear?: number | undefined;
        };
        timelineId: string;
        events: {
            title: string;
            date: {
                type: "exact";
                year: number;
                month?: number | undefined;
                day?: number | undefined;
            } | {
                type: "era";
                description: string;
                era: string;
            } | {
                type: "approximate";
                year: number;
                range: number;
            };
            confidence: number;
            category: "education" | "career" | "family" | "birth" | "residence" | "travel" | "health" | "achievement" | "milestone" | "historical_context";
            description: string;
            eventId: string;
            importance: "critical" | "high" | "medium" | "low";
            sourceAnswerIds: string[];
            tags?: string[] | undefined;
            verified?: boolean | undefined;
            relatedEvents?: string[] | undefined;
        }[];
        conflicts: {
            type: "date_overlap" | "impossible_sequence" | "age_mismatch" | "contradiction";
            severity: "info" | "critical" | "warning";
            description: string;
            involvedEventIds: string[];
            conflictId: string;
            suggestion?: string | undefined;
        }[];
        gaps: {
            severity: "info" | "critical" | "warning";
            description: string;
            suggestedQuestions: string[];
            startYear: number;
            endYear: number;
            duration: number;
            gapId: string;
        }[];
    } | undefined;
}>;
/**
 * Timeline build result schema
 */
export declare const timelineBuildResultSchema: z.ZodObject<{
    timeline: z.ZodObject<{
        timelineId: z.ZodString;
        userId: z.ZodString;
        events: z.ZodArray<z.ZodObject<{
            eventId: z.ZodString;
            date: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
                type: z.ZodLiteral<"exact">;
                year: z.ZodNumber;
                month: z.ZodOptional<z.ZodNumber>;
                day: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                type: "exact";
                year: number;
                month?: number | undefined;
                day?: number | undefined;
            }, {
                type: "exact";
                year: number;
                month?: number | undefined;
                day?: number | undefined;
            }>, z.ZodObject<{
                type: z.ZodLiteral<"era">;
                era: z.ZodString;
                description: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                type: "era";
                description: string;
                era: string;
            }, {
                type: "era";
                description: string;
                era: string;
            }>, z.ZodObject<{
                type: z.ZodLiteral<"approximate">;
                year: z.ZodNumber;
                range: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                type: "approximate";
                year: number;
                range: number;
            }, {
                type: "approximate";
                year: number;
                range: number;
            }>]>;
            title: z.ZodString;
            description: z.ZodString;
            category: z.ZodEnum<["birth", "education", "career", "family", "residence", "travel", "health", "achievement", "milestone", "historical_context"]>;
            importance: z.ZodEnum<["critical", "high", "medium", "low"]>;
            verified: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            confidence: z.ZodNumber;
            sourceAnswerIds: z.ZodArray<z.ZodString, "many">;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            relatedEvents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            title: string;
            date: {
                type: "exact";
                year: number;
                month?: number | undefined;
                day?: number | undefined;
            } | {
                type: "era";
                description: string;
                era: string;
            } | {
                type: "approximate";
                year: number;
                range: number;
            };
            confidence: number;
            category: "education" | "career" | "family" | "birth" | "residence" | "travel" | "health" | "achievement" | "milestone" | "historical_context";
            description: string;
            eventId: string;
            importance: "critical" | "high" | "medium" | "low";
            sourceAnswerIds: string[];
            verified: boolean;
            tags?: string[] | undefined;
            relatedEvents?: string[] | undefined;
        }, {
            title: string;
            date: {
                type: "exact";
                year: number;
                month?: number | undefined;
                day?: number | undefined;
            } | {
                type: "era";
                description: string;
                era: string;
            } | {
                type: "approximate";
                year: number;
                range: number;
            };
            confidence: number;
            category: "education" | "career" | "family" | "birth" | "residence" | "travel" | "health" | "achievement" | "milestone" | "historical_context";
            description: string;
            eventId: string;
            importance: "critical" | "high" | "medium" | "low";
            sourceAnswerIds: string[];
            tags?: string[] | undefined;
            verified?: boolean | undefined;
            relatedEvents?: string[] | undefined;
        }>, "many">;
        metadata: z.ZodObject<{
            birthYear: z.ZodOptional<z.ZodNumber>;
            deathYear: z.ZodOptional<z.ZodNumber>;
            earliestYear: z.ZodNumber;
            latestYear: z.ZodNumber;
            totalEvents: z.ZodNumber;
            verifiedEvents: z.ZodNumber;
            eraSummaries: z.ZodArray<z.ZodObject<{
                era: z.ZodString;
                startYear: z.ZodNumber;
                endYear: z.ZodNumber;
                eventCount: z.ZodNumber;
                dominantThemes: z.ZodArray<z.ZodString, "many">;
                lifeStage: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                era: string;
                startYear: number;
                endYear: number;
                eventCount: number;
                dominantThemes: string[];
                lifeStage: string;
            }, {
                era: string;
                startYear: number;
                endYear: number;
                eventCount: number;
                dominantThemes: string[];
                lifeStage: string;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            earliestYear: number;
            latestYear: number;
            totalEvents: number;
            verifiedEvents: number;
            eraSummaries: {
                era: string;
                startYear: number;
                endYear: number;
                eventCount: number;
                dominantThemes: string[];
                lifeStage: string;
            }[];
            birthYear?: number | undefined;
            deathYear?: number | undefined;
        }, {
            earliestYear: number;
            latestYear: number;
            totalEvents: number;
            verifiedEvents: number;
            eraSummaries: {
                era: string;
                startYear: number;
                endYear: number;
                eventCount: number;
                dominantThemes: string[];
                lifeStage: string;
            }[];
            birthYear?: number | undefined;
            deathYear?: number | undefined;
        }>;
        conflicts: z.ZodArray<z.ZodObject<{
            conflictId: z.ZodString;
            type: z.ZodEnum<["date_overlap", "impossible_sequence", "age_mismatch", "contradiction"]>;
            severity: z.ZodEnum<["critical", "warning", "info"]>;
            description: z.ZodString;
            involvedEventIds: z.ZodArray<z.ZodString, "many">;
            suggestion: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: "date_overlap" | "impossible_sequence" | "age_mismatch" | "contradiction";
            severity: "info" | "critical" | "warning";
            description: string;
            involvedEventIds: string[];
            conflictId: string;
            suggestion?: string | undefined;
        }, {
            type: "date_overlap" | "impossible_sequence" | "age_mismatch" | "contradiction";
            severity: "info" | "critical" | "warning";
            description: string;
            involvedEventIds: string[];
            conflictId: string;
            suggestion?: string | undefined;
        }>, "many">;
        gaps: z.ZodArray<z.ZodObject<{
            gapId: z.ZodString;
            startYear: z.ZodNumber;
            endYear: z.ZodNumber;
            duration: z.ZodNumber;
            severity: z.ZodEnum<["critical", "warning", "info"]>;
            description: z.ZodString;
            suggestedQuestions: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            severity: "info" | "critical" | "warning";
            description: string;
            suggestedQuestions: string[];
            startYear: number;
            endYear: number;
            duration: number;
            gapId: string;
        }, {
            severity: "info" | "critical" | "warning";
            description: string;
            suggestedQuestions: string[];
            startYear: number;
            endYear: number;
            duration: number;
            gapId: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        metadata: {
            earliestYear: number;
            latestYear: number;
            totalEvents: number;
            verifiedEvents: number;
            eraSummaries: {
                era: string;
                startYear: number;
                endYear: number;
                eventCount: number;
                dominantThemes: string[];
                lifeStage: string;
            }[];
            birthYear?: number | undefined;
            deathYear?: number | undefined;
        };
        timelineId: string;
        events: {
            title: string;
            date: {
                type: "exact";
                year: number;
                month?: number | undefined;
                day?: number | undefined;
            } | {
                type: "era";
                description: string;
                era: string;
            } | {
                type: "approximate";
                year: number;
                range: number;
            };
            confidence: number;
            category: "education" | "career" | "family" | "birth" | "residence" | "travel" | "health" | "achievement" | "milestone" | "historical_context";
            description: string;
            eventId: string;
            importance: "critical" | "high" | "medium" | "low";
            sourceAnswerIds: string[];
            verified: boolean;
            tags?: string[] | undefined;
            relatedEvents?: string[] | undefined;
        }[];
        conflicts: {
            type: "date_overlap" | "impossible_sequence" | "age_mismatch" | "contradiction";
            severity: "info" | "critical" | "warning";
            description: string;
            involvedEventIds: string[];
            conflictId: string;
            suggestion?: string | undefined;
        }[];
        gaps: {
            severity: "info" | "critical" | "warning";
            description: string;
            suggestedQuestions: string[];
            startYear: number;
            endYear: number;
            duration: number;
            gapId: string;
        }[];
    }, {
        userId: string;
        metadata: {
            earliestYear: number;
            latestYear: number;
            totalEvents: number;
            verifiedEvents: number;
            eraSummaries: {
                era: string;
                startYear: number;
                endYear: number;
                eventCount: number;
                dominantThemes: string[];
                lifeStage: string;
            }[];
            birthYear?: number | undefined;
            deathYear?: number | undefined;
        };
        timelineId: string;
        events: {
            title: string;
            date: {
                type: "exact";
                year: number;
                month?: number | undefined;
                day?: number | undefined;
            } | {
                type: "era";
                description: string;
                era: string;
            } | {
                type: "approximate";
                year: number;
                range: number;
            };
            confidence: number;
            category: "education" | "career" | "family" | "birth" | "residence" | "travel" | "health" | "achievement" | "milestone" | "historical_context";
            description: string;
            eventId: string;
            importance: "critical" | "high" | "medium" | "low";
            sourceAnswerIds: string[];
            tags?: string[] | undefined;
            verified?: boolean | undefined;
            relatedEvents?: string[] | undefined;
        }[];
        conflicts: {
            type: "date_overlap" | "impossible_sequence" | "age_mismatch" | "contradiction";
            severity: "info" | "critical" | "warning";
            description: string;
            involvedEventIds: string[];
            conflictId: string;
            suggestion?: string | undefined;
        }[];
        gaps: {
            severity: "info" | "critical" | "warning";
            description: string;
            suggestedQuestions: string[];
            startYear: number;
            endYear: number;
            duration: number;
            gapId: string;
        }[];
    }>;
    addedEvents: z.ZodNumber;
    updatedEvents: z.ZodNumber;
    conflictsFound: z.ZodNumber;
    gapsIdentified: z.ZodNumber;
    summary: z.ZodString;
}, "strip", z.ZodTypeAny, {
    timeline: {
        userId: string;
        metadata: {
            earliestYear: number;
            latestYear: number;
            totalEvents: number;
            verifiedEvents: number;
            eraSummaries: {
                era: string;
                startYear: number;
                endYear: number;
                eventCount: number;
                dominantThemes: string[];
                lifeStage: string;
            }[];
            birthYear?: number | undefined;
            deathYear?: number | undefined;
        };
        timelineId: string;
        events: {
            title: string;
            date: {
                type: "exact";
                year: number;
                month?: number | undefined;
                day?: number | undefined;
            } | {
                type: "era";
                description: string;
                era: string;
            } | {
                type: "approximate";
                year: number;
                range: number;
            };
            confidence: number;
            category: "education" | "career" | "family" | "birth" | "residence" | "travel" | "health" | "achievement" | "milestone" | "historical_context";
            description: string;
            eventId: string;
            importance: "critical" | "high" | "medium" | "low";
            sourceAnswerIds: string[];
            verified: boolean;
            tags?: string[] | undefined;
            relatedEvents?: string[] | undefined;
        }[];
        conflicts: {
            type: "date_overlap" | "impossible_sequence" | "age_mismatch" | "contradiction";
            severity: "info" | "critical" | "warning";
            description: string;
            involvedEventIds: string[];
            conflictId: string;
            suggestion?: string | undefined;
        }[];
        gaps: {
            severity: "info" | "critical" | "warning";
            description: string;
            suggestedQuestions: string[];
            startYear: number;
            endYear: number;
            duration: number;
            gapId: string;
        }[];
    };
    summary: string;
    addedEvents: number;
    conflictsFound: number;
    gapsIdentified: number;
    updatedEvents: number;
}, {
    timeline: {
        userId: string;
        metadata: {
            earliestYear: number;
            latestYear: number;
            totalEvents: number;
            verifiedEvents: number;
            eraSummaries: {
                era: string;
                startYear: number;
                endYear: number;
                eventCount: number;
                dominantThemes: string[];
                lifeStage: string;
            }[];
            birthYear?: number | undefined;
            deathYear?: number | undefined;
        };
        timelineId: string;
        events: {
            title: string;
            date: {
                type: "exact";
                year: number;
                month?: number | undefined;
                day?: number | undefined;
            } | {
                type: "era";
                description: string;
                era: string;
            } | {
                type: "approximate";
                year: number;
                range: number;
            };
            confidence: number;
            category: "education" | "career" | "family" | "birth" | "residence" | "travel" | "health" | "achievement" | "milestone" | "historical_context";
            description: string;
            eventId: string;
            importance: "critical" | "high" | "medium" | "low";
            sourceAnswerIds: string[];
            tags?: string[] | undefined;
            verified?: boolean | undefined;
            relatedEvents?: string[] | undefined;
        }[];
        conflicts: {
            type: "date_overlap" | "impossible_sequence" | "age_mismatch" | "contradiction";
            severity: "info" | "critical" | "warning";
            description: string;
            involvedEventIds: string[];
            conflictId: string;
            suggestion?: string | undefined;
        }[];
        gaps: {
            severity: "info" | "critical" | "warning";
            description: string;
            suggestedQuestions: string[];
            startYear: number;
            endYear: number;
            duration: number;
            gapId: string;
        }[];
    };
    summary: string;
    addedEvents: number;
    conflictsFound: number;
    gapsIdentified: number;
    updatedEvents: number;
}>;
/**
 * Timeline verification request schema
 */
export declare const timelineVerificationRequestSchema: z.ZodObject<{
    timeline: z.ZodObject<{
        timelineId: z.ZodString;
        userId: z.ZodString;
        events: z.ZodArray<z.ZodObject<{
            eventId: z.ZodString;
            date: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
                type: z.ZodLiteral<"exact">;
                year: z.ZodNumber;
                month: z.ZodOptional<z.ZodNumber>;
                day: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                type: "exact";
                year: number;
                month?: number | undefined;
                day?: number | undefined;
            }, {
                type: "exact";
                year: number;
                month?: number | undefined;
                day?: number | undefined;
            }>, z.ZodObject<{
                type: z.ZodLiteral<"era">;
                era: z.ZodString;
                description: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                type: "era";
                description: string;
                era: string;
            }, {
                type: "era";
                description: string;
                era: string;
            }>, z.ZodObject<{
                type: z.ZodLiteral<"approximate">;
                year: z.ZodNumber;
                range: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                type: "approximate";
                year: number;
                range: number;
            }, {
                type: "approximate";
                year: number;
                range: number;
            }>]>;
            title: z.ZodString;
            description: z.ZodString;
            category: z.ZodEnum<["birth", "education", "career", "family", "residence", "travel", "health", "achievement", "milestone", "historical_context"]>;
            importance: z.ZodEnum<["critical", "high", "medium", "low"]>;
            verified: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            confidence: z.ZodNumber;
            sourceAnswerIds: z.ZodArray<z.ZodString, "many">;
            tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            relatedEvents: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            title: string;
            date: {
                type: "exact";
                year: number;
                month?: number | undefined;
                day?: number | undefined;
            } | {
                type: "era";
                description: string;
                era: string;
            } | {
                type: "approximate";
                year: number;
                range: number;
            };
            confidence: number;
            category: "education" | "career" | "family" | "birth" | "residence" | "travel" | "health" | "achievement" | "milestone" | "historical_context";
            description: string;
            eventId: string;
            importance: "critical" | "high" | "medium" | "low";
            sourceAnswerIds: string[];
            verified: boolean;
            tags?: string[] | undefined;
            relatedEvents?: string[] | undefined;
        }, {
            title: string;
            date: {
                type: "exact";
                year: number;
                month?: number | undefined;
                day?: number | undefined;
            } | {
                type: "era";
                description: string;
                era: string;
            } | {
                type: "approximate";
                year: number;
                range: number;
            };
            confidence: number;
            category: "education" | "career" | "family" | "birth" | "residence" | "travel" | "health" | "achievement" | "milestone" | "historical_context";
            description: string;
            eventId: string;
            importance: "critical" | "high" | "medium" | "low";
            sourceAnswerIds: string[];
            tags?: string[] | undefined;
            verified?: boolean | undefined;
            relatedEvents?: string[] | undefined;
        }>, "many">;
        metadata: z.ZodObject<{
            birthYear: z.ZodOptional<z.ZodNumber>;
            deathYear: z.ZodOptional<z.ZodNumber>;
            earliestYear: z.ZodNumber;
            latestYear: z.ZodNumber;
            totalEvents: z.ZodNumber;
            verifiedEvents: z.ZodNumber;
            eraSummaries: z.ZodArray<z.ZodObject<{
                era: z.ZodString;
                startYear: z.ZodNumber;
                endYear: z.ZodNumber;
                eventCount: z.ZodNumber;
                dominantThemes: z.ZodArray<z.ZodString, "many">;
                lifeStage: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                era: string;
                startYear: number;
                endYear: number;
                eventCount: number;
                dominantThemes: string[];
                lifeStage: string;
            }, {
                era: string;
                startYear: number;
                endYear: number;
                eventCount: number;
                dominantThemes: string[];
                lifeStage: string;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            earliestYear: number;
            latestYear: number;
            totalEvents: number;
            verifiedEvents: number;
            eraSummaries: {
                era: string;
                startYear: number;
                endYear: number;
                eventCount: number;
                dominantThemes: string[];
                lifeStage: string;
            }[];
            birthYear?: number | undefined;
            deathYear?: number | undefined;
        }, {
            earliestYear: number;
            latestYear: number;
            totalEvents: number;
            verifiedEvents: number;
            eraSummaries: {
                era: string;
                startYear: number;
                endYear: number;
                eventCount: number;
                dominantThemes: string[];
                lifeStage: string;
            }[];
            birthYear?: number | undefined;
            deathYear?: number | undefined;
        }>;
        conflicts: z.ZodArray<z.ZodObject<{
            conflictId: z.ZodString;
            type: z.ZodEnum<["date_overlap", "impossible_sequence", "age_mismatch", "contradiction"]>;
            severity: z.ZodEnum<["critical", "warning", "info"]>;
            description: z.ZodString;
            involvedEventIds: z.ZodArray<z.ZodString, "many">;
            suggestion: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: "date_overlap" | "impossible_sequence" | "age_mismatch" | "contradiction";
            severity: "info" | "critical" | "warning";
            description: string;
            involvedEventIds: string[];
            conflictId: string;
            suggestion?: string | undefined;
        }, {
            type: "date_overlap" | "impossible_sequence" | "age_mismatch" | "contradiction";
            severity: "info" | "critical" | "warning";
            description: string;
            involvedEventIds: string[];
            conflictId: string;
            suggestion?: string | undefined;
        }>, "many">;
        gaps: z.ZodArray<z.ZodObject<{
            gapId: z.ZodString;
            startYear: z.ZodNumber;
            endYear: z.ZodNumber;
            duration: z.ZodNumber;
            severity: z.ZodEnum<["critical", "warning", "info"]>;
            description: z.ZodString;
            suggestedQuestions: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            severity: "info" | "critical" | "warning";
            description: string;
            suggestedQuestions: string[];
            startYear: number;
            endYear: number;
            duration: number;
            gapId: string;
        }, {
            severity: "info" | "critical" | "warning";
            description: string;
            suggestedQuestions: string[];
            startYear: number;
            endYear: number;
            duration: number;
            gapId: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        metadata: {
            earliestYear: number;
            latestYear: number;
            totalEvents: number;
            verifiedEvents: number;
            eraSummaries: {
                era: string;
                startYear: number;
                endYear: number;
                eventCount: number;
                dominantThemes: string[];
                lifeStage: string;
            }[];
            birthYear?: number | undefined;
            deathYear?: number | undefined;
        };
        timelineId: string;
        events: {
            title: string;
            date: {
                type: "exact";
                year: number;
                month?: number | undefined;
                day?: number | undefined;
            } | {
                type: "era";
                description: string;
                era: string;
            } | {
                type: "approximate";
                year: number;
                range: number;
            };
            confidence: number;
            category: "education" | "career" | "family" | "birth" | "residence" | "travel" | "health" | "achievement" | "milestone" | "historical_context";
            description: string;
            eventId: string;
            importance: "critical" | "high" | "medium" | "low";
            sourceAnswerIds: string[];
            verified: boolean;
            tags?: string[] | undefined;
            relatedEvents?: string[] | undefined;
        }[];
        conflicts: {
            type: "date_overlap" | "impossible_sequence" | "age_mismatch" | "contradiction";
            severity: "info" | "critical" | "warning";
            description: string;
            involvedEventIds: string[];
            conflictId: string;
            suggestion?: string | undefined;
        }[];
        gaps: {
            severity: "info" | "critical" | "warning";
            description: string;
            suggestedQuestions: string[];
            startYear: number;
            endYear: number;
            duration: number;
            gapId: string;
        }[];
    }, {
        userId: string;
        metadata: {
            earliestYear: number;
            latestYear: number;
            totalEvents: number;
            verifiedEvents: number;
            eraSummaries: {
                era: string;
                startYear: number;
                endYear: number;
                eventCount: number;
                dominantThemes: string[];
                lifeStage: string;
            }[];
            birthYear?: number | undefined;
            deathYear?: number | undefined;
        };
        timelineId: string;
        events: {
            title: string;
            date: {
                type: "exact";
                year: number;
                month?: number | undefined;
                day?: number | undefined;
            } | {
                type: "era";
                description: string;
                era: string;
            } | {
                type: "approximate";
                year: number;
                range: number;
            };
            confidence: number;
            category: "education" | "career" | "family" | "birth" | "residence" | "travel" | "health" | "achievement" | "milestone" | "historical_context";
            description: string;
            eventId: string;
            importance: "critical" | "high" | "medium" | "low";
            sourceAnswerIds: string[];
            tags?: string[] | undefined;
            verified?: boolean | undefined;
            relatedEvents?: string[] | undefined;
        }[];
        conflicts: {
            type: "date_overlap" | "impossible_sequence" | "age_mismatch" | "contradiction";
            severity: "info" | "critical" | "warning";
            description: string;
            involvedEventIds: string[];
            conflictId: string;
            suggestion?: string | undefined;
        }[];
        gaps: {
            severity: "info" | "critical" | "warning";
            description: string;
            suggestedQuestions: string[];
            startYear: number;
            endYear: number;
            duration: number;
            gapId: string;
        }[];
    }>;
    factVerificationService: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    timeline: {
        userId: string;
        metadata: {
            earliestYear: number;
            latestYear: number;
            totalEvents: number;
            verifiedEvents: number;
            eraSummaries: {
                era: string;
                startYear: number;
                endYear: number;
                eventCount: number;
                dominantThemes: string[];
                lifeStage: string;
            }[];
            birthYear?: number | undefined;
            deathYear?: number | undefined;
        };
        timelineId: string;
        events: {
            title: string;
            date: {
                type: "exact";
                year: number;
                month?: number | undefined;
                day?: number | undefined;
            } | {
                type: "era";
                description: string;
                era: string;
            } | {
                type: "approximate";
                year: number;
                range: number;
            };
            confidence: number;
            category: "education" | "career" | "family" | "birth" | "residence" | "travel" | "health" | "achievement" | "milestone" | "historical_context";
            description: string;
            eventId: string;
            importance: "critical" | "high" | "medium" | "low";
            sourceAnswerIds: string[];
            verified: boolean;
            tags?: string[] | undefined;
            relatedEvents?: string[] | undefined;
        }[];
        conflicts: {
            type: "date_overlap" | "impossible_sequence" | "age_mismatch" | "contradiction";
            severity: "info" | "critical" | "warning";
            description: string;
            involvedEventIds: string[];
            conflictId: string;
            suggestion?: string | undefined;
        }[];
        gaps: {
            severity: "info" | "critical" | "warning";
            description: string;
            suggestedQuestions: string[];
            startYear: number;
            endYear: number;
            duration: number;
            gapId: string;
        }[];
    };
    factVerificationService?: any;
}, {
    timeline: {
        userId: string;
        metadata: {
            earliestYear: number;
            latestYear: number;
            totalEvents: number;
            verifiedEvents: number;
            eraSummaries: {
                era: string;
                startYear: number;
                endYear: number;
                eventCount: number;
                dominantThemes: string[];
                lifeStage: string;
            }[];
            birthYear?: number | undefined;
            deathYear?: number | undefined;
        };
        timelineId: string;
        events: {
            title: string;
            date: {
                type: "exact";
                year: number;
                month?: number | undefined;
                day?: number | undefined;
            } | {
                type: "era";
                description: string;
                era: string;
            } | {
                type: "approximate";
                year: number;
                range: number;
            };
            confidence: number;
            category: "education" | "career" | "family" | "birth" | "residence" | "travel" | "health" | "achievement" | "milestone" | "historical_context";
            description: string;
            eventId: string;
            importance: "critical" | "high" | "medium" | "low";
            sourceAnswerIds: string[];
            tags?: string[] | undefined;
            verified?: boolean | undefined;
            relatedEvents?: string[] | undefined;
        }[];
        conflicts: {
            type: "date_overlap" | "impossible_sequence" | "age_mismatch" | "contradiction";
            severity: "info" | "critical" | "warning";
            description: string;
            involvedEventIds: string[];
            conflictId: string;
            suggestion?: string | undefined;
        }[];
        gaps: {
            severity: "info" | "critical" | "warning";
            description: string;
            suggestedQuestions: string[];
            startYear: number;
            endYear: number;
            duration: number;
            gapId: string;
        }[];
    };
    factVerificationService?: any;
}>;
/**
 * Timeline verification result schema
 */
export declare const timelineVerificationResultSchema: z.ZodObject<{
    verifiedEvents: z.ZodArray<z.ZodObject<{
        eventId: z.ZodString;
        verified: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        eventId: string;
        verified: boolean;
    }, {
        eventId: string;
        verified: boolean;
    }>, "many">;
    verificationSummary: z.ZodString;
}, "strip", z.ZodTypeAny, {
    verifiedEvents: {
        eventId: string;
        verified: boolean;
    }[];
    verificationSummary: string;
}, {
    verifiedEvents: {
        eventId: string;
        verified: boolean;
    }[];
    verificationSummary: string;
}>;
//# sourceMappingURL=timeline.schemas.d.ts.map