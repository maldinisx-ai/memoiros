/**
 * Zod schemas for Database operations
 */

import { z } from "zod";

/**
 * Database configuration schema
 */
export const databaseConfigSchema = z.object({
  dataDir: z.string().optional(),
  filename: z.string().optional().default("memoiros.db"),
});

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
export const interviewSaveSchema = z.object({
  interviewId: z.string().uuid(),
  userId: z.string().min(1).max(100),
  status: z.enum(["active", "paused", "completed"]),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  currentPhase: z.enum([
    "warmup",
    "childhood",
    "education",
    "career",
    "family",
    "milestones",
    "reflections",
    "closing",
  ]),
  metadata: z.record(z.unknown()),
});

/**
 * Question save schema
 */
export const questionSaveSchema = z.object({
  questionId: z.string().uuid(),
  interviewId: z.string().uuid(),
  phase: z.string().min(1).max(50),
  question: z.string().min(1).max(1000),
  questionType: z.enum(["open", "specific", "followup", "clarification"]),
  targetEntities: z.array(z.string().min(1).max(50)).optional(),
  priority: z.enum(["high", "medium", "low"]),
  askedAt: z.string().datetime().optional(),
  answered: z.boolean(),
});

/**
 * Answer save schema
 */
export const answerSaveSchema = z.object({
  answerId: z.string().uuid(),
  questionId: z.string().uuid(),
  interviewId: z.string().uuid(),
  answer: z.string().min(1).max(10000),
  answeredAt: z.string().datetime(),
  extractedEntities: z.record(z.unknown()).optional(),
  sentiment: z.enum(["positive", "neutral", "negative", "mixed"]).optional(),
  needsFollowup: z.boolean(),
  followupTopics: z.array(z.string().min(1).max(200)).optional(),
});

/**
 * Timeline event save schema
 */
export const timelineEventSaveSchema = z.object({
  eventId: z.string().uuid(),
  timelineId: z.string().uuid(),
  userId: z.string().min(1).max(100),
  date: z.object({
    type: z.enum(["exact", "era", "approximate"]),
    year: z.number().int().min(1000).max(3000).optional(),
    month: z.number().int().min(1).max(12).optional(),
    day: z.number().int().min(1).max(31).optional(),
    era: z.string().optional(),
    range: z.number().int().optional(),
  }),
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(5000),
  category: z.enum([
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
  ]),
  importance: z.enum(["critical", "high", "medium", "low"]),
  confidence: z.number().min(0).max(1),
  tags: z.array(z.string().min(1).max(50)).optional(),
});

/**
 * Voice profile save schema
 */
export const voiceProfileSaveSchema = z.object({
  profileId: z.string().uuid(),
  userId: z.string().min(1).max(100),
  characteristics: z.record(z.unknown()),
  confidence: z.number().min(0).max(1),
});

/**
 * API request validation schemas
 */

/**
 * Create interview request schema (API)
 */
export const createInterviewRequestSchema = z.object({
  userId: z.string().min(1).max(100),
  phase: z.enum([
    "warmup",
    "childhood",
    "education",
    "career",
    "family",
    "milestones",
    "reflections",
    "closing",
  ]).optional(),
  context: z.object({
    previousAnswers: z.array(z.any()).optional(),
    currentTopic: z.string().optional(),
    userMood: z.string().optional(),
    sessionNotes: z.array(z.string()).optional(),
  }).optional(),
});

/**
 * Submit answer request schema (API)
 */
export const submitAnswerRequestSchema = z.object({
  interviewId: z.string().uuid(),
  questionId: z.string().uuid(),
  answer: z.string().min(1).max(10000),
  userId: z.string().min(1).max(100),
});

/**
 * Build timeline request schema (API)
 */
export const buildTimelineRequestSchema = z.object({
  userId: z.string().min(1).max(100),
  interviewAnswers: z.array(
    z.object({
      answerId: z.string().uuid(),
      answer: z.string().min(1).max(10000),
    })
  ).min(1),
  options: z.object({
    verifyDates: z.boolean().optional(),
    detectConflicts: z.boolean().optional(),
    identifyGaps: z.boolean().optional(),
    groupByEra: z.boolean().optional(),
    includeHistoricalContext: z.boolean().optional(),
  }).optional(),
});

/**
 * Create voice profile request schema (API)
 */
export const createVoiceProfileRequestSchema = z.object({
  userId: z.string().min(1).max(100),
  samples: z.array(
    z.object({
      content: z.string().min(1).max(10000),
      sourceType: z.enum([
        "interview_answer",
        "written_sample",
        "voice_transcript",
      ]),
      metadata: z.object({
        context: z.string().optional(),
        recordedAt: z.string().datetime().optional(),
        topic: z.string().optional(),
      }).optional(),
    })
  ).min(1).max(100),
});

/**
 * Style transfer request schema (API)
 */
export const apiStyleTransferRequestSchema = z.object({
  sourceText: z.string().min(1).max(50000),
  userId: z.string().min(1).max(100),
  options: z.object({
    preserveFacts: z.boolean().optional(),
    intensity: z.enum(["subtle", "moderate", "strong"]).optional(),
    focusAreas: z.array(
      z.enum([
        "sentence_structure",
        "vocabulary",
        "tone",
        "punctuation",
        "cultural_markers",
      ])
    ).max(5).optional(),
  }).optional(),
});

/**
 * Verify fact request schema (API)
 */
export const verifyFactRequestSchema = z.object({
  fact: z.string().min(1).max(1000),
  context: z.object({
    birthYear: z.number().int().min(1900).max(2024).optional(),
    location: z.string().min(1).max(200).optional(),
    era: z.string().min(1).max(50).optional(),
  }).optional(),
  options: z.object({
    strictness: z.enum(["strict", "normal", "loose"]).optional(),
    enableWebVerification: z.boolean().optional(),
    maxSources: z.number().int().min(1).max(20).optional(),
  }).optional(),
});

/**
 * Error response schema (API)
 */
export const apiErrorResponseSchema = z.object({
  error: z.string().min(1),
  message: z.string().min(1).max(1000),
  code: z.string().optional(),
  details: z.record(z.unknown()).optional(),
});

/**
 * Success response schema (API)
 */
export const apiSuccessResponseSchema = z.object({
  success: z.boolean().default(true),
  data: z.unknown(),
  message: z.string().optional(),
});

/**
 * Pagination params schema
 */
export const paginationParamsSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});
