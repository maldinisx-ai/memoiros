/**
 * Zod schemas for Database operations
 */
import { z } from "zod";
/**
 * Database configuration schema
 */
export declare const databaseConfigSchema: z.ZodObject<{
    dataDir: z.ZodOptional<z.ZodString>;
    filename: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    filename: string;
    dataDir?: string | undefined;
}, {
    dataDir?: string | undefined;
    filename?: string | undefined;
}>;
/**
 * Database configuration type
 */
export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;
/**
 * Interview save type
 */
export type InterviewSave = z.infer<typeof interviewSaveSchema>;
/**
 * Question save type
 */
export type QuestionSave = z.infer<typeof questionSaveSchema>;
/**
 * Answer save type
 */
export type AnswerSave = z.infer<typeof answerSaveSchema>;
/**
 * Timeline event save type
 */
export type TimelineEventSave = z.infer<typeof timelineEventSaveSchema>;
/**
 * Voice profile save type
 */
export type VoiceProfileSave = z.infer<typeof voiceProfileSaveSchema>;
/**
 * Interview save schema
 */
export declare const interviewSaveSchema: z.ZodObject<{
    interviewId: z.ZodString;
    userId: z.ZodString;
    status: z.ZodEnum<["active", "paused", "completed"]>;
    startedAt: z.ZodString;
    completedAt: z.ZodOptional<z.ZodString>;
    currentPhase: z.ZodEnum<["warmup", "childhood", "education", "career", "family", "milestones", "reflections", "closing"]>;
    metadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    status: "active" | "paused" | "completed";
    interviewId: string;
    userId: string;
    startedAt: string;
    currentPhase: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing";
    metadata: Record<string, unknown>;
    completedAt?: string | undefined;
}, {
    status: "active" | "paused" | "completed";
    interviewId: string;
    userId: string;
    startedAt: string;
    currentPhase: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing";
    metadata: Record<string, unknown>;
    completedAt?: string | undefined;
}>;
/**
 * Question save schema
 */
export declare const questionSaveSchema: z.ZodObject<{
    questionId: z.ZodString;
    interviewId: z.ZodString;
    phase: z.ZodString;
    question: z.ZodString;
    questionType: z.ZodEnum<["open", "specific", "followup", "clarification"]>;
    targetEntities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    priority: z.ZodEnum<["high", "medium", "low"]>;
    askedAt: z.ZodOptional<z.ZodString>;
    answered: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    interviewId: string;
    questionId: string;
    phase: string;
    question: string;
    questionType: "open" | "specific" | "followup" | "clarification";
    priority: "high" | "medium" | "low";
    answered: boolean;
    targetEntities?: string[] | undefined;
    askedAt?: string | undefined;
}, {
    interviewId: string;
    questionId: string;
    phase: string;
    question: string;
    questionType: "open" | "specific" | "followup" | "clarification";
    priority: "high" | "medium" | "low";
    answered: boolean;
    targetEntities?: string[] | undefined;
    askedAt?: string | undefined;
}>;
/**
 * Answer save schema
 */
export declare const answerSaveSchema: z.ZodObject<{
    answerId: z.ZodString;
    questionId: z.ZodString;
    interviewId: z.ZodString;
    answer: z.ZodString;
    answeredAt: z.ZodString;
    extractedEntities: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    sentiment: z.ZodOptional<z.ZodEnum<["positive", "neutral", "negative", "mixed"]>>;
    needsFollowup: z.ZodBoolean;
    followupTopics: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    interviewId: string;
    questionId: string;
    answerId: string;
    answer: string;
    answeredAt: string;
    needsFollowup: boolean;
    extractedEntities?: Record<string, unknown> | undefined;
    sentiment?: "positive" | "neutral" | "negative" | "mixed" | undefined;
    followupTopics?: string[] | undefined;
}, {
    interviewId: string;
    questionId: string;
    answerId: string;
    answer: string;
    answeredAt: string;
    needsFollowup: boolean;
    extractedEntities?: Record<string, unknown> | undefined;
    sentiment?: "positive" | "neutral" | "negative" | "mixed" | undefined;
    followupTopics?: string[] | undefined;
}>;
/**
 * Timeline event save schema
 */
export declare const timelineEventSaveSchema: z.ZodObject<{
    eventId: z.ZodString;
    timelineId: z.ZodString;
    userId: z.ZodString;
    date: z.ZodObject<{
        type: z.ZodEnum<["exact", "era", "approximate"]>;
        year: z.ZodOptional<z.ZodNumber>;
        month: z.ZodOptional<z.ZodNumber>;
        day: z.ZodOptional<z.ZodNumber>;
        era: z.ZodOptional<z.ZodString>;
        range: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "exact" | "era" | "approximate";
        era?: string | undefined;
        year?: number | undefined;
        month?: number | undefined;
        day?: number | undefined;
        range?: number | undefined;
    }, {
        type: "exact" | "era" | "approximate";
        era?: string | undefined;
        year?: number | undefined;
        month?: number | undefined;
        day?: number | undefined;
        range?: number | undefined;
    }>;
    title: z.ZodString;
    description: z.ZodString;
    category: z.ZodEnum<["birth", "education", "career", "family", "residence", "travel", "health", "achievement", "milestone", "historical_context"]>;
    importance: z.ZodEnum<["critical", "high", "medium", "low"]>;
    confidence: z.ZodNumber;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    date: {
        type: "exact" | "era" | "approximate";
        era?: string | undefined;
        year?: number | undefined;
        month?: number | undefined;
        day?: number | undefined;
        range?: number | undefined;
    };
    confidence: number;
    category: "education" | "career" | "family" | "birth" | "residence" | "travel" | "health" | "achievement" | "milestone" | "historical_context";
    description: string;
    userId: string;
    eventId: string;
    timelineId: string;
    importance: "critical" | "high" | "medium" | "low";
    tags?: string[] | undefined;
}, {
    title: string;
    date: {
        type: "exact" | "era" | "approximate";
        era?: string | undefined;
        year?: number | undefined;
        month?: number | undefined;
        day?: number | undefined;
        range?: number | undefined;
    };
    confidence: number;
    category: "education" | "career" | "family" | "birth" | "residence" | "travel" | "health" | "achievement" | "milestone" | "historical_context";
    description: string;
    userId: string;
    eventId: string;
    timelineId: string;
    importance: "critical" | "high" | "medium" | "low";
    tags?: string[] | undefined;
}>;
/**
 * Voice profile save schema
 */
export declare const voiceProfileSaveSchema: z.ZodObject<{
    profileId: z.ZodString;
    userId: z.ZodString;
    characteristics: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    confidence: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    confidence: number;
    userId: string;
    profileId: string;
    characteristics: Record<string, unknown>;
}, {
    confidence: number;
    userId: string;
    profileId: string;
    characteristics: Record<string, unknown>;
}>;
/**
 * API request validation schemas
 */
/**
 * Create interview request schema (API)
 */
export declare const createInterviewRequestSchema: z.ZodObject<{
    userId: z.ZodString;
    phase: z.ZodOptional<z.ZodEnum<["warmup", "childhood", "education", "career", "family", "milestones", "reflections", "closing"]>>;
    context: z.ZodOptional<z.ZodObject<{
        previousAnswers: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
        currentTopic: z.ZodOptional<z.ZodString>;
        userMood: z.ZodOptional<z.ZodString>;
        sessionNotes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        previousAnswers?: any[] | undefined;
        currentTopic?: string | undefined;
        userMood?: string | undefined;
        sessionNotes?: string[] | undefined;
    }, {
        previousAnswers?: any[] | undefined;
        currentTopic?: string | undefined;
        userMood?: string | undefined;
        sessionNotes?: string[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    phase?: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing" | undefined;
    context?: {
        previousAnswers?: any[] | undefined;
        currentTopic?: string | undefined;
        userMood?: string | undefined;
        sessionNotes?: string[] | undefined;
    } | undefined;
}, {
    userId: string;
    phase?: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing" | undefined;
    context?: {
        previousAnswers?: any[] | undefined;
        currentTopic?: string | undefined;
        userMood?: string | undefined;
        sessionNotes?: string[] | undefined;
    } | undefined;
}>;
/**
 * Submit answer request schema (API)
 */
export declare const submitAnswerRequestSchema: z.ZodObject<{
    interviewId: z.ZodString;
    questionId: z.ZodString;
    answer: z.ZodString;
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    interviewId: string;
    userId: string;
    questionId: string;
    answer: string;
}, {
    interviewId: string;
    userId: string;
    questionId: string;
    answer: string;
}>;
/**
 * Build timeline request schema (API)
 */
export declare const buildTimelineRequestSchema: z.ZodObject<{
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
    options: z.ZodOptional<z.ZodObject<{
        verifyDates: z.ZodOptional<z.ZodBoolean>;
        detectConflicts: z.ZodOptional<z.ZodBoolean>;
        identifyGaps: z.ZodOptional<z.ZodBoolean>;
        groupByEra: z.ZodOptional<z.ZodBoolean>;
        includeHistoricalContext: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        verifyDates?: boolean | undefined;
        detectConflicts?: boolean | undefined;
        identifyGaps?: boolean | undefined;
        groupByEra?: boolean | undefined;
        includeHistoricalContext?: boolean | undefined;
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
        verifyDates?: boolean | undefined;
        detectConflicts?: boolean | undefined;
        identifyGaps?: boolean | undefined;
        groupByEra?: boolean | undefined;
        includeHistoricalContext?: boolean | undefined;
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
}>;
/**
 * Create voice profile request schema (API)
 */
export declare const createVoiceProfileRequestSchema: z.ZodObject<{
    userId: z.ZodString;
    samples: z.ZodArray<z.ZodObject<{
        content: z.ZodString;
        sourceType: z.ZodEnum<["interview_answer", "written_sample", "voice_transcript"]>;
        metadata: z.ZodOptional<z.ZodObject<{
            context: z.ZodOptional<z.ZodString>;
            recordedAt: z.ZodOptional<z.ZodString>;
            topic: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            context?: string | undefined;
            recordedAt?: string | undefined;
            topic?: string | undefined;
        }, {
            context?: string | undefined;
            recordedAt?: string | undefined;
            topic?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        content: string;
        sourceType: "interview_answer" | "written_sample" | "voice_transcript";
        metadata?: {
            context?: string | undefined;
            recordedAt?: string | undefined;
            topic?: string | undefined;
        } | undefined;
    }, {
        content: string;
        sourceType: "interview_answer" | "written_sample" | "voice_transcript";
        metadata?: {
            context?: string | undefined;
            recordedAt?: string | undefined;
            topic?: string | undefined;
        } | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    userId: string;
    samples: {
        content: string;
        sourceType: "interview_answer" | "written_sample" | "voice_transcript";
        metadata?: {
            context?: string | undefined;
            recordedAt?: string | undefined;
            topic?: string | undefined;
        } | undefined;
    }[];
}, {
    userId: string;
    samples: {
        content: string;
        sourceType: "interview_answer" | "written_sample" | "voice_transcript";
        metadata?: {
            context?: string | undefined;
            recordedAt?: string | undefined;
            topic?: string | undefined;
        } | undefined;
    }[];
}>;
/**
 * Style transfer request schema (API)
 */
export declare const apiStyleTransferRequestSchema: z.ZodObject<{
    sourceText: z.ZodString;
    userId: z.ZodString;
    options: z.ZodOptional<z.ZodObject<{
        preserveFacts: z.ZodOptional<z.ZodBoolean>;
        intensity: z.ZodOptional<z.ZodEnum<["subtle", "moderate", "strong"]>>;
        focusAreas: z.ZodOptional<z.ZodArray<z.ZodEnum<["sentence_structure", "vocabulary", "tone", "punctuation", "cultural_markers"]>, "many">>;
    }, "strip", z.ZodTypeAny, {
        preserveFacts?: boolean | undefined;
        intensity?: "subtle" | "moderate" | "strong" | undefined;
        focusAreas?: ("sentence_structure" | "vocabulary" | "tone" | "punctuation" | "cultural_markers")[] | undefined;
    }, {
        preserveFacts?: boolean | undefined;
        intensity?: "subtle" | "moderate" | "strong" | undefined;
        focusAreas?: ("sentence_structure" | "vocabulary" | "tone" | "punctuation" | "cultural_markers")[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    sourceText: string;
    options?: {
        preserveFacts?: boolean | undefined;
        intensity?: "subtle" | "moderate" | "strong" | undefined;
        focusAreas?: ("sentence_structure" | "vocabulary" | "tone" | "punctuation" | "cultural_markers")[] | undefined;
    } | undefined;
}, {
    userId: string;
    sourceText: string;
    options?: {
        preserveFacts?: boolean | undefined;
        intensity?: "subtle" | "moderate" | "strong" | undefined;
        focusAreas?: ("sentence_structure" | "vocabulary" | "tone" | "punctuation" | "cultural_markers")[] | undefined;
    } | undefined;
}>;
/**
 * Verify fact request schema (API)
 */
export declare const verifyFactRequestSchema: z.ZodObject<{
    fact: z.ZodString;
    context: z.ZodOptional<z.ZodObject<{
        birthYear: z.ZodOptional<z.ZodNumber>;
        location: z.ZodOptional<z.ZodString>;
        era: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        era?: string | undefined;
        birthYear?: number | undefined;
        location?: string | undefined;
    }, {
        era?: string | undefined;
        birthYear?: number | undefined;
        location?: string | undefined;
    }>>;
    options: z.ZodOptional<z.ZodObject<{
        strictness: z.ZodOptional<z.ZodEnum<["strict", "normal", "loose"]>>;
        enableWebVerification: z.ZodOptional<z.ZodBoolean>;
        maxSources: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        strictness?: "strict" | "normal" | "loose" | undefined;
        enableWebVerification?: boolean | undefined;
        maxSources?: number | undefined;
    }, {
        strictness?: "strict" | "normal" | "loose" | undefined;
        enableWebVerification?: boolean | undefined;
        maxSources?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    fact: string;
    options?: {
        strictness?: "strict" | "normal" | "loose" | undefined;
        enableWebVerification?: boolean | undefined;
        maxSources?: number | undefined;
    } | undefined;
    context?: {
        era?: string | undefined;
        birthYear?: number | undefined;
        location?: string | undefined;
    } | undefined;
}, {
    fact: string;
    options?: {
        strictness?: "strict" | "normal" | "loose" | undefined;
        enableWebVerification?: boolean | undefined;
        maxSources?: number | undefined;
    } | undefined;
    context?: {
        era?: string | undefined;
        birthYear?: number | undefined;
        location?: string | undefined;
    } | undefined;
}>;
/**
 * Error response schema (API)
 */
export declare const apiErrorResponseSchema: z.ZodObject<{
    error: z.ZodString;
    message: z.ZodString;
    code: z.ZodOptional<z.ZodString>;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    error: string;
    message: string;
    code?: string | undefined;
    details?: Record<string, unknown> | undefined;
}, {
    error: string;
    message: string;
    code?: string | undefined;
    details?: Record<string, unknown> | undefined;
}>;
/**
 * Success response schema (API)
 */
export declare const apiSuccessResponseSchema: z.ZodObject<{
    success: z.ZodDefault<z.ZodBoolean>;
    data: z.ZodUnknown;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    message?: string | undefined;
    data?: unknown;
}, {
    message?: string | undefined;
    success?: boolean | undefined;
    data?: unknown;
}>;
/**
 * Pagination params schema
 */
export declare const paginationParamsSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortOrder: "asc" | "desc";
    sortBy?: string | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
//# sourceMappingURL=database.schemas.d.ts.map