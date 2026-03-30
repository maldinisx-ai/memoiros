/**
 * Zod schemas for Style/Voice Profile models
 */
import { z } from "zod";
/**
 * Tone types schema
 */
export const toneTypeSchema = z.enum([
    "nostalgic",
    "humorous",
    "serious",
    "reflective",
    "conversational",
    "formal",
    "emotional",
    "matter-of-fact",
]);
/**
 * Sentence complexity schema
 */
export const sentenceComplexitySchema = z.enum(["simple", "moderate", "complex"]);
/**
 * Vocabulary level schema
 */
export const vocabularyLevelSchema = z.enum(["basic", "intermediate", "advanced"]);
/**
 * Exclamation frequency schema
 */
export const exclamationFrequencySchema = z.enum(["rare", "moderate", "frequent"]);
/**
 * Emotional range schema
 */
export const emotionalRangeSchema = z.enum(["restricted", "moderate", "expressive"]);
/**
 * Perspective schema
 */
export const perspectiveSchema = z.enum(["first_person", "third_person", "mixed"]);
/**
 * Tense schema
 */
export const tenseSchema = z.enum(["past", "present", "mixed"]);
/**
 * Detail level schema
 */
export const detailLevelSchema = z.enum(["sparse", "moderate", "rich"]);
/**
 * Source type schema
 */
export const sourceTypeSchema = z.enum([
    "interview_answer",
    "written_sample",
    "voice_transcript",
    "voice_recording",
]);
/**
 * Style focus area schema
 */
export const styleFocusAreaSchema = z.enum([
    "sentence_structure",
    "vocabulary",
    "tone",
    "punctuation",
    "cultural_markers",
]);
/**
 * Style intensity schema
 */
export const styleIntensitySchema = z.enum(["subtle", "moderate", "strong"]);
/**
 * Voice characteristics schema
 */
export const voiceCharacteristicsSchema = z.object({
    // Sentence structure
    avgSentenceLength: z.number().min(1).max(100),
    sentenceComplexity: sentenceComplexitySchema,
    prefersShortSentences: z.boolean(),
    // Vocabulary
    vocabularyLevel: vocabularyLevelSchema,
    commonWords: z.array(z.string().min(1).max(50)).max(100),
    idiosyncraticPhrases: z.array(z.string().min(1).max(100)).max(50),
    // Tone and mood
    dominantTone: z.array(toneTypeSchema).min(1).max(3),
    emotionalRange: emotionalRangeSchema,
    // Punctuation and formatting
    usesEllipsis: z.boolean(),
    usesEmDash: z.boolean(),
    exclamationFrequency: exclamationFrequencySchema,
    // Cultural markers
    dialect: z.array(z.string().min(1).max(100)).max(20),
    eraMarkers: z.array(z.string().min(1).max(50)).max(30),
    // Narrative style
    perspective: perspectiveSchema,
    tense: tenseSchema,
    detailLevel: detailLevelSchema,
});
/**
 * Sample source schema
 */
export const sampleSourceSchema = z.object({
    sourceId: z.string().uuid(),
    sourceType: sourceTypeSchema,
    content: z.string().min(1).max(10000),
    extractedAt: z.string().datetime(),
    weight: z.number().min(0).max(1),
});
/**
 * Voice profile schema
 */
export const voiceProfileSchema = z.object({
    profileId: z.string().uuid(),
    userId: z.string().min(1).max(100),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    characteristics: voiceCharacteristicsSchema,
    sampleSources: z.array(sampleSourceSchema).min(1),
    confidence: z.number().min(0).max(1),
});
/**
 * Voice sample metadata schema
 */
export const voiceSampleMetadataSchema = z.object({
    context: z.string().min(1).max(500).optional(),
    recordedAt: z.string().datetime().optional(),
    topic: z.string().min(1).max(200).optional(),
});
/**
 * Voice sample schema
 */
export const voiceSampleSchema = z.object({
    sampleId: z.string().uuid(),
    content: z.string().min(1).max(10000),
    sourceType: sourceTypeSchema,
    metadata: voiceSampleMetadataSchema.optional(),
});
/**
 * Style transfer options schema
 */
export const styleTransferOptionsSchema = z.object({
    preserveFacts: z.boolean().optional().default(true),
    intensity: styleIntensitySchema.optional().default("moderate"),
    focusAreas: z.array(styleFocusAreaSchema).max(5).optional(),
});
/**
 * Style transfer request schema
 */
export const styleTransferRequestSchema = z.object({
    sourceText: z.string().min(1).max(50000),
    voiceProfile: voiceProfileSchema,
    options: styleTransferOptionsSchema.optional(),
});
/**
 * Style change schema
 */
export const styleChangeSchema = z.object({
    type: styleFocusAreaSchema,
    original: z.string().min(1).max(1000),
    modified: z.string().min(1).max(1000),
    reason: z.string().min(1).max(500),
});
/**
 * Style transfer result schema
 */
export const styleTransferResultSchema = z.object({
    rewrittenText: z.string().min(1).max(50000),
    confidence: z.number().min(0).max(1),
    changes: z.array(styleChangeSchema),
    warnings: z.array(z.string().min(1).max(500)).optional(),
});
/**
 * Voice profile creation request schema
 */
export const voiceProfileCreationRequestSchema = z.object({
    userId: z.string().min(1).max(100),
    samples: z.array(voiceSampleSchema).min(1).max(100),
    profileId: z.string().uuid().optional(),
});
/**
 * Voice profile analysis result schema
 */
export const voiceProfileAnalysisSchema = z.object({
    profile: voiceProfileSchema,
    summary: z.string().min(1).max(2000),
    dominantTraits: z.array(z.string().min(1).max(100)).min(1).max(10),
    suggestions: z.array(z.string().min(1).max(200)).max(10),
});
//# sourceMappingURL=style.schemas.js.map