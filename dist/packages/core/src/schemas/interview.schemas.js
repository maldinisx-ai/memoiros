/**
 * Zod schemas for Interview models
 */
import { z } from "zod";
/**
 * Interview phases
 */
export const interviewPhaseSchema = z.enum([
    "warmup",
    "childhood",
    "education",
    "career",
    "family",
    "milestones",
    "reflections",
    "closing",
]);
/**
 * Interview status schema
 */
export const interviewStatusSchema = z.enum(["active", "paused", "completed"]);
/**
 * Question types schema
 */
export const questionTypeSchema = z.enum(["open", "specific", "followup", "clarification"]);
/**
 * Priority schema
 */
export const prioritySchema = z.enum(["high", "medium", "low"]);
/**
 * Sentiment schema
 */
export const sentimentSchema = z.enum(["positive", "neutral", "negative", "mixed"]);
/**
 * Difficulty schema
 */
export const difficultySchema = z.enum(["easy", "medium", "deep"]);
/**
 * Extracted entities schema
 */
export const extractedEntitiesSchema = z.object({
    years: z.array(z.number().int().min(1000).max(2030)).optional(),
    locations: z.array(z.string().min(1).max(100)).optional(),
    people: z.array(z.string().min(1).max(100)).optional(),
    events: z.array(z.string().min(1).max(200)).optional(),
    emotions: z.array(z.string().min(1).max(50)).optional(),
    missingEntities: z.array(z.string().min(1).max(100)).optional(),
});
/**
 * Interview question schema
 */
export const interviewQuestionSchema = z.object({
    questionId: z.string().uuid(),
    phase: interviewPhaseSchema,
    question: z.string().min(1).max(1000),
    questionType: questionTypeSchema,
    targetEntities: z.array(z.string().min(1).max(50)).optional(),
    priority: prioritySchema,
    askedAt: z.string().datetime().optional(),
    answered: z.boolean(),
});
/**
 * Interview answer schema
 */
export const interviewAnswerSchema = z.object({
    answerId: z.string().uuid(),
    questionId: z.string().uuid(),
    answer: z.string().min(1).max(10000),
    answeredAt: z.string().datetime(),
    extractedEntities: extractedEntitiesSchema.optional(),
    sentiment: sentimentSchema.optional(),
    needsFollowup: z.boolean(),
    followupTopics: z.array(z.string().min(1).max(200)).optional(),
});
/**
 * Extracted fact schema
 */
export const extractedFactSchema = z.object({
    factId: z.string().uuid(),
    fact: z.string().min(1).max(500),
    sourceAnswerIds: z.array(z.string().uuid()).min(1),
    confidence: z.number().min(0).max(1),
    era: z.string().min(1).max(50).optional(),
    category: z.string().min(1).max(50).optional(),
    verified: z.boolean().optional().default(false),
});
/**
 * Interview metadata schema
 */
export const interviewMetadataSchema = z.object({
    userBirthYear: z.number().int().min(1900).max(2024).optional(),
    userBirthplace: z.string().min(1).max(200).optional(),
    userOccupation: z.string().min(1).max(100).optional(),
    interviewGoal: z.string().min(1).max(100).optional(),
    targetLength: z.number().int().min(1000).max(500000).optional(),
    completedPhases: z.array(interviewPhaseSchema),
});
/**
 * Interview state schema
 */
export const interviewStateSchema = z.object({
    interviewId: z.string().uuid(),
    userId: z.string().min(1).max(100),
    status: interviewStatusSchema,
    startedAt: z.string().datetime(),
    completedAt: z.string().datetime().optional(),
    currentPhase: interviewPhaseSchema,
    questions: z.array(interviewQuestionSchema),
    answers: z.array(interviewAnswerSchema),
    extractedFacts: z.array(extractedFactSchema),
    metadata: interviewMetadataSchema,
});
/**
 * Interview context schema
 */
export const interviewContextSchema = z.object({
    previousAnswers: z.array(interviewAnswerSchema).optional(),
    currentTopic: z.string().min(1).max(200).optional(),
    userMood: z.string().min(1).max(100).optional(),
    sessionNotes: z.array(z.string().min(1).max(500)).optional(),
});
/**
 * Interview request schema
 */
export const interviewRequestSchema = z.object({
    interviewId: z.string().uuid().optional(),
    userId: z.string().min(1).max(100),
    phase: interviewPhaseSchema.optional(),
    context: interviewContextSchema.optional(),
});
/**
 * Interview response schema
 */
export const interviewResponseSchema = z.object({
    interviewState: interviewStateSchema,
    nextQuestion: interviewQuestionSchema.optional(),
    suggestedQuestions: z.array(interviewQuestionSchema).optional(),
    summary: z.string().min(1).max(5000).optional(),
    needsClarification: z.array(z.string().min(1).max(200)).optional(),
});
/**
 * Question generation options schema
 */
export const questionGenerationOptionsSchema = z.object({
    count: z.number().int().min(1).max(10).optional().default(1),
    includeFollowups: z.boolean().optional().default(false),
    focusTopics: z.array(z.string().min(1).max(100)).max(5).optional(),
    difficulty: difficultySchema.optional().default("medium"),
});
/**
 * Interview answer submission schema
 */
export const interviewAnswerSubmissionSchema = z.object({
    interviewId: z.string().uuid(),
    questionId: z.string().uuid(),
    answer: z.string().min(1).max(10000),
    answeredAt: z.string().datetime().optional(),
    userId: z.string().min(1).max(100),
});
//# sourceMappingURL=interview.schemas.js.map