/**
 * Zod schemas for Style/Voice Profile models
 */
import { z } from "zod";
/**
 * Tone types schema
 */
export declare const toneTypeSchema: z.ZodEnum<["nostalgic", "humorous", "serious", "reflective", "conversational", "formal", "emotional", "matter-of-fact"]>;
/**
 * Sentence complexity schema
 */
export declare const sentenceComplexitySchema: z.ZodEnum<["simple", "moderate", "complex"]>;
/**
 * Vocabulary level schema
 */
export declare const vocabularyLevelSchema: z.ZodEnum<["basic", "intermediate", "advanced"]>;
/**
 * Exclamation frequency schema
 */
export declare const exclamationFrequencySchema: z.ZodEnum<["rare", "moderate", "frequent"]>;
/**
 * Emotional range schema
 */
export declare const emotionalRangeSchema: z.ZodEnum<["restricted", "moderate", "expressive"]>;
/**
 * Perspective schema
 */
export declare const perspectiveSchema: z.ZodEnum<["first_person", "third_person", "mixed"]>;
/**
 * Tense schema
 */
export declare const tenseSchema: z.ZodEnum<["past", "present", "mixed"]>;
/**
 * Detail level schema
 */
export declare const detailLevelSchema: z.ZodEnum<["sparse", "moderate", "rich"]>;
/**
 * Source type schema
 */
export declare const sourceTypeSchema: z.ZodEnum<["interview_answer", "written_sample", "voice_transcript", "voice_recording"]>;
/**
 * Style focus area schema
 */
export declare const styleFocusAreaSchema: z.ZodEnum<["sentence_structure", "vocabulary", "tone", "punctuation", "cultural_markers"]>;
/**
 * Style intensity schema
 */
export declare const styleIntensitySchema: z.ZodEnum<["subtle", "moderate", "strong"]>;
/**
 * Voice characteristics schema
 */
export declare const voiceCharacteristicsSchema: z.ZodObject<{
    avgSentenceLength: z.ZodNumber;
    sentenceComplexity: z.ZodEnum<["simple", "moderate", "complex"]>;
    prefersShortSentences: z.ZodBoolean;
    vocabularyLevel: z.ZodEnum<["basic", "intermediate", "advanced"]>;
    commonWords: z.ZodArray<z.ZodString, "many">;
    idiosyncraticPhrases: z.ZodArray<z.ZodString, "many">;
    dominantTone: z.ZodArray<z.ZodEnum<["nostalgic", "humorous", "serious", "reflective", "conversational", "formal", "emotional", "matter-of-fact"]>, "many">;
    emotionalRange: z.ZodEnum<["restricted", "moderate", "expressive"]>;
    usesEllipsis: z.ZodBoolean;
    usesEmDash: z.ZodBoolean;
    exclamationFrequency: z.ZodEnum<["rare", "moderate", "frequent"]>;
    dialect: z.ZodArray<z.ZodString, "many">;
    eraMarkers: z.ZodArray<z.ZodString, "many">;
    perspective: z.ZodEnum<["first_person", "third_person", "mixed"]>;
    tense: z.ZodEnum<["past", "present", "mixed"]>;
    detailLevel: z.ZodEnum<["sparse", "moderate", "rich"]>;
}, "strip", z.ZodTypeAny, {
    avgSentenceLength: number;
    sentenceComplexity: "moderate" | "simple" | "complex";
    prefersShortSentences: boolean;
    vocabularyLevel: "basic" | "intermediate" | "advanced";
    commonWords: string[];
    idiosyncraticPhrases: string[];
    dominantTone: ("nostalgic" | "humorous" | "serious" | "reflective" | "conversational" | "formal" | "emotional" | "matter-of-fact")[];
    emotionalRange: "moderate" | "restricted" | "expressive";
    usesEllipsis: boolean;
    usesEmDash: boolean;
    exclamationFrequency: "moderate" | "rare" | "frequent";
    dialect: string[];
    eraMarkers: string[];
    perspective: "mixed" | "first_person" | "third_person";
    tense: "mixed" | "past" | "present";
    detailLevel: "moderate" | "sparse" | "rich";
}, {
    avgSentenceLength: number;
    sentenceComplexity: "moderate" | "simple" | "complex";
    prefersShortSentences: boolean;
    vocabularyLevel: "basic" | "intermediate" | "advanced";
    commonWords: string[];
    idiosyncraticPhrases: string[];
    dominantTone: ("nostalgic" | "humorous" | "serious" | "reflective" | "conversational" | "formal" | "emotional" | "matter-of-fact")[];
    emotionalRange: "moderate" | "restricted" | "expressive";
    usesEllipsis: boolean;
    usesEmDash: boolean;
    exclamationFrequency: "moderate" | "rare" | "frequent";
    dialect: string[];
    eraMarkers: string[];
    perspective: "mixed" | "first_person" | "third_person";
    tense: "mixed" | "past" | "present";
    detailLevel: "moderate" | "sparse" | "rich";
}>;
/**
 * Sample source schema
 */
export declare const sampleSourceSchema: z.ZodObject<{
    sourceId: z.ZodString;
    sourceType: z.ZodEnum<["interview_answer", "written_sample", "voice_transcript", "voice_recording"]>;
    content: z.ZodString;
    extractedAt: z.ZodString;
    weight: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    content: string;
    sourceType: "interview_answer" | "written_sample" | "voice_transcript" | "voice_recording";
    sourceId: string;
    extractedAt: string;
    weight: number;
}, {
    content: string;
    sourceType: "interview_answer" | "written_sample" | "voice_transcript" | "voice_recording";
    sourceId: string;
    extractedAt: string;
    weight: number;
}>;
/**
 * Voice profile schema
 */
export declare const voiceProfileSchema: z.ZodObject<{
    profileId: z.ZodString;
    userId: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    characteristics: z.ZodObject<{
        avgSentenceLength: z.ZodNumber;
        sentenceComplexity: z.ZodEnum<["simple", "moderate", "complex"]>;
        prefersShortSentences: z.ZodBoolean;
        vocabularyLevel: z.ZodEnum<["basic", "intermediate", "advanced"]>;
        commonWords: z.ZodArray<z.ZodString, "many">;
        idiosyncraticPhrases: z.ZodArray<z.ZodString, "many">;
        dominantTone: z.ZodArray<z.ZodEnum<["nostalgic", "humorous", "serious", "reflective", "conversational", "formal", "emotional", "matter-of-fact"]>, "many">;
        emotionalRange: z.ZodEnum<["restricted", "moderate", "expressive"]>;
        usesEllipsis: z.ZodBoolean;
        usesEmDash: z.ZodBoolean;
        exclamationFrequency: z.ZodEnum<["rare", "moderate", "frequent"]>;
        dialect: z.ZodArray<z.ZodString, "many">;
        eraMarkers: z.ZodArray<z.ZodString, "many">;
        perspective: z.ZodEnum<["first_person", "third_person", "mixed"]>;
        tense: z.ZodEnum<["past", "present", "mixed"]>;
        detailLevel: z.ZodEnum<["sparse", "moderate", "rich"]>;
    }, "strip", z.ZodTypeAny, {
        avgSentenceLength: number;
        sentenceComplexity: "moderate" | "simple" | "complex";
        prefersShortSentences: boolean;
        vocabularyLevel: "basic" | "intermediate" | "advanced";
        commonWords: string[];
        idiosyncraticPhrases: string[];
        dominantTone: ("nostalgic" | "humorous" | "serious" | "reflective" | "conversational" | "formal" | "emotional" | "matter-of-fact")[];
        emotionalRange: "moderate" | "restricted" | "expressive";
        usesEllipsis: boolean;
        usesEmDash: boolean;
        exclamationFrequency: "moderate" | "rare" | "frequent";
        dialect: string[];
        eraMarkers: string[];
        perspective: "mixed" | "first_person" | "third_person";
        tense: "mixed" | "past" | "present";
        detailLevel: "moderate" | "sparse" | "rich";
    }, {
        avgSentenceLength: number;
        sentenceComplexity: "moderate" | "simple" | "complex";
        prefersShortSentences: boolean;
        vocabularyLevel: "basic" | "intermediate" | "advanced";
        commonWords: string[];
        idiosyncraticPhrases: string[];
        dominantTone: ("nostalgic" | "humorous" | "serious" | "reflective" | "conversational" | "formal" | "emotional" | "matter-of-fact")[];
        emotionalRange: "moderate" | "restricted" | "expressive";
        usesEllipsis: boolean;
        usesEmDash: boolean;
        exclamationFrequency: "moderate" | "rare" | "frequent";
        dialect: string[];
        eraMarkers: string[];
        perspective: "mixed" | "first_person" | "third_person";
        tense: "mixed" | "past" | "present";
        detailLevel: "moderate" | "sparse" | "rich";
    }>;
    sampleSources: z.ZodArray<z.ZodObject<{
        sourceId: z.ZodString;
        sourceType: z.ZodEnum<["interview_answer", "written_sample", "voice_transcript", "voice_recording"]>;
        content: z.ZodString;
        extractedAt: z.ZodString;
        weight: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        content: string;
        sourceType: "interview_answer" | "written_sample" | "voice_transcript" | "voice_recording";
        sourceId: string;
        extractedAt: string;
        weight: number;
    }, {
        content: string;
        sourceType: "interview_answer" | "written_sample" | "voice_transcript" | "voice_recording";
        sourceId: string;
        extractedAt: string;
        weight: number;
    }>, "many">;
    confidence: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    confidence: number;
    userId: string;
    profileId: string;
    characteristics: {
        avgSentenceLength: number;
        sentenceComplexity: "moderate" | "simple" | "complex";
        prefersShortSentences: boolean;
        vocabularyLevel: "basic" | "intermediate" | "advanced";
        commonWords: string[];
        idiosyncraticPhrases: string[];
        dominantTone: ("nostalgic" | "humorous" | "serious" | "reflective" | "conversational" | "formal" | "emotional" | "matter-of-fact")[];
        emotionalRange: "moderate" | "restricted" | "expressive";
        usesEllipsis: boolean;
        usesEmDash: boolean;
        exclamationFrequency: "moderate" | "rare" | "frequent";
        dialect: string[];
        eraMarkers: string[];
        perspective: "mixed" | "first_person" | "third_person";
        tense: "mixed" | "past" | "present";
        detailLevel: "moderate" | "sparse" | "rich";
    };
    createdAt: string;
    updatedAt: string;
    sampleSources: {
        content: string;
        sourceType: "interview_answer" | "written_sample" | "voice_transcript" | "voice_recording";
        sourceId: string;
        extractedAt: string;
        weight: number;
    }[];
}, {
    confidence: number;
    userId: string;
    profileId: string;
    characteristics: {
        avgSentenceLength: number;
        sentenceComplexity: "moderate" | "simple" | "complex";
        prefersShortSentences: boolean;
        vocabularyLevel: "basic" | "intermediate" | "advanced";
        commonWords: string[];
        idiosyncraticPhrases: string[];
        dominantTone: ("nostalgic" | "humorous" | "serious" | "reflective" | "conversational" | "formal" | "emotional" | "matter-of-fact")[];
        emotionalRange: "moderate" | "restricted" | "expressive";
        usesEllipsis: boolean;
        usesEmDash: boolean;
        exclamationFrequency: "moderate" | "rare" | "frequent";
        dialect: string[];
        eraMarkers: string[];
        perspective: "mixed" | "first_person" | "third_person";
        tense: "mixed" | "past" | "present";
        detailLevel: "moderate" | "sparse" | "rich";
    };
    createdAt: string;
    updatedAt: string;
    sampleSources: {
        content: string;
        sourceType: "interview_answer" | "written_sample" | "voice_transcript" | "voice_recording";
        sourceId: string;
        extractedAt: string;
        weight: number;
    }[];
}>;
/**
 * Voice sample metadata schema
 */
export declare const voiceSampleMetadataSchema: z.ZodObject<{
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
}>;
/**
 * Voice sample schema
 */
export declare const voiceSampleSchema: z.ZodObject<{
    sampleId: z.ZodString;
    content: z.ZodString;
    sourceType: z.ZodEnum<["interview_answer", "written_sample", "voice_transcript", "voice_recording"]>;
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
    sourceType: "interview_answer" | "written_sample" | "voice_transcript" | "voice_recording";
    sampleId: string;
    metadata?: {
        context?: string | undefined;
        recordedAt?: string | undefined;
        topic?: string | undefined;
    } | undefined;
}, {
    content: string;
    sourceType: "interview_answer" | "written_sample" | "voice_transcript" | "voice_recording";
    sampleId: string;
    metadata?: {
        context?: string | undefined;
        recordedAt?: string | undefined;
        topic?: string | undefined;
    } | undefined;
}>;
/**
 * Style transfer options schema
 */
export declare const styleTransferOptionsSchema: z.ZodObject<{
    preserveFacts: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    intensity: z.ZodDefault<z.ZodOptional<z.ZodEnum<["subtle", "moderate", "strong"]>>>;
    focusAreas: z.ZodOptional<z.ZodArray<z.ZodEnum<["sentence_structure", "vocabulary", "tone", "punctuation", "cultural_markers"]>, "many">>;
}, "strip", z.ZodTypeAny, {
    preserveFacts: boolean;
    intensity: "subtle" | "moderate" | "strong";
    focusAreas?: ("sentence_structure" | "vocabulary" | "tone" | "punctuation" | "cultural_markers")[] | undefined;
}, {
    preserveFacts?: boolean | undefined;
    intensity?: "subtle" | "moderate" | "strong" | undefined;
    focusAreas?: ("sentence_structure" | "vocabulary" | "tone" | "punctuation" | "cultural_markers")[] | undefined;
}>;
/**
 * Style transfer request schema
 */
export declare const styleTransferRequestSchema: z.ZodObject<{
    sourceText: z.ZodString;
    voiceProfile: z.ZodObject<{
        profileId: z.ZodString;
        userId: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        characteristics: z.ZodObject<{
            avgSentenceLength: z.ZodNumber;
            sentenceComplexity: z.ZodEnum<["simple", "moderate", "complex"]>;
            prefersShortSentences: z.ZodBoolean;
            vocabularyLevel: z.ZodEnum<["basic", "intermediate", "advanced"]>;
            commonWords: z.ZodArray<z.ZodString, "many">;
            idiosyncraticPhrases: z.ZodArray<z.ZodString, "many">;
            dominantTone: z.ZodArray<z.ZodEnum<["nostalgic", "humorous", "serious", "reflective", "conversational", "formal", "emotional", "matter-of-fact"]>, "many">;
            emotionalRange: z.ZodEnum<["restricted", "moderate", "expressive"]>;
            usesEllipsis: z.ZodBoolean;
            usesEmDash: z.ZodBoolean;
            exclamationFrequency: z.ZodEnum<["rare", "moderate", "frequent"]>;
            dialect: z.ZodArray<z.ZodString, "many">;
            eraMarkers: z.ZodArray<z.ZodString, "many">;
            perspective: z.ZodEnum<["first_person", "third_person", "mixed"]>;
            tense: z.ZodEnum<["past", "present", "mixed"]>;
            detailLevel: z.ZodEnum<["sparse", "moderate", "rich"]>;
        }, "strip", z.ZodTypeAny, {
            avgSentenceLength: number;
            sentenceComplexity: "moderate" | "simple" | "complex";
            prefersShortSentences: boolean;
            vocabularyLevel: "basic" | "intermediate" | "advanced";
            commonWords: string[];
            idiosyncraticPhrases: string[];
            dominantTone: ("nostalgic" | "humorous" | "serious" | "reflective" | "conversational" | "formal" | "emotional" | "matter-of-fact")[];
            emotionalRange: "moderate" | "restricted" | "expressive";
            usesEllipsis: boolean;
            usesEmDash: boolean;
            exclamationFrequency: "moderate" | "rare" | "frequent";
            dialect: string[];
            eraMarkers: string[];
            perspective: "mixed" | "first_person" | "third_person";
            tense: "mixed" | "past" | "present";
            detailLevel: "moderate" | "sparse" | "rich";
        }, {
            avgSentenceLength: number;
            sentenceComplexity: "moderate" | "simple" | "complex";
            prefersShortSentences: boolean;
            vocabularyLevel: "basic" | "intermediate" | "advanced";
            commonWords: string[];
            idiosyncraticPhrases: string[];
            dominantTone: ("nostalgic" | "humorous" | "serious" | "reflective" | "conversational" | "formal" | "emotional" | "matter-of-fact")[];
            emotionalRange: "moderate" | "restricted" | "expressive";
            usesEllipsis: boolean;
            usesEmDash: boolean;
            exclamationFrequency: "moderate" | "rare" | "frequent";
            dialect: string[];
            eraMarkers: string[];
            perspective: "mixed" | "first_person" | "third_person";
            tense: "mixed" | "past" | "present";
            detailLevel: "moderate" | "sparse" | "rich";
        }>;
        sampleSources: z.ZodArray<z.ZodObject<{
            sourceId: z.ZodString;
            sourceType: z.ZodEnum<["interview_answer", "written_sample", "voice_transcript", "voice_recording"]>;
            content: z.ZodString;
            extractedAt: z.ZodString;
            weight: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            content: string;
            sourceType: "interview_answer" | "written_sample" | "voice_transcript" | "voice_recording";
            sourceId: string;
            extractedAt: string;
            weight: number;
        }, {
            content: string;
            sourceType: "interview_answer" | "written_sample" | "voice_transcript" | "voice_recording";
            sourceId: string;
            extractedAt: string;
            weight: number;
        }>, "many">;
        confidence: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        confidence: number;
        userId: string;
        profileId: string;
        characteristics: {
            avgSentenceLength: number;
            sentenceComplexity: "moderate" | "simple" | "complex";
            prefersShortSentences: boolean;
            vocabularyLevel: "basic" | "intermediate" | "advanced";
            commonWords: string[];
            idiosyncraticPhrases: string[];
            dominantTone: ("nostalgic" | "humorous" | "serious" | "reflective" | "conversational" | "formal" | "emotional" | "matter-of-fact")[];
            emotionalRange: "moderate" | "restricted" | "expressive";
            usesEllipsis: boolean;
            usesEmDash: boolean;
            exclamationFrequency: "moderate" | "rare" | "frequent";
            dialect: string[];
            eraMarkers: string[];
            perspective: "mixed" | "first_person" | "third_person";
            tense: "mixed" | "past" | "present";
            detailLevel: "moderate" | "sparse" | "rich";
        };
        createdAt: string;
        updatedAt: string;
        sampleSources: {
            content: string;
            sourceType: "interview_answer" | "written_sample" | "voice_transcript" | "voice_recording";
            sourceId: string;
            extractedAt: string;
            weight: number;
        }[];
    }, {
        confidence: number;
        userId: string;
        profileId: string;
        characteristics: {
            avgSentenceLength: number;
            sentenceComplexity: "moderate" | "simple" | "complex";
            prefersShortSentences: boolean;
            vocabularyLevel: "basic" | "intermediate" | "advanced";
            commonWords: string[];
            idiosyncraticPhrases: string[];
            dominantTone: ("nostalgic" | "humorous" | "serious" | "reflective" | "conversational" | "formal" | "emotional" | "matter-of-fact")[];
            emotionalRange: "moderate" | "restricted" | "expressive";
            usesEllipsis: boolean;
            usesEmDash: boolean;
            exclamationFrequency: "moderate" | "rare" | "frequent";
            dialect: string[];
            eraMarkers: string[];
            perspective: "mixed" | "first_person" | "third_person";
            tense: "mixed" | "past" | "present";
            detailLevel: "moderate" | "sparse" | "rich";
        };
        createdAt: string;
        updatedAt: string;
        sampleSources: {
            content: string;
            sourceType: "interview_answer" | "written_sample" | "voice_transcript" | "voice_recording";
            sourceId: string;
            extractedAt: string;
            weight: number;
        }[];
    }>;
    options: z.ZodOptional<z.ZodObject<{
        preserveFacts: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        intensity: z.ZodDefault<z.ZodOptional<z.ZodEnum<["subtle", "moderate", "strong"]>>>;
        focusAreas: z.ZodOptional<z.ZodArray<z.ZodEnum<["sentence_structure", "vocabulary", "tone", "punctuation", "cultural_markers"]>, "many">>;
    }, "strip", z.ZodTypeAny, {
        preserveFacts: boolean;
        intensity: "subtle" | "moderate" | "strong";
        focusAreas?: ("sentence_structure" | "vocabulary" | "tone" | "punctuation" | "cultural_markers")[] | undefined;
    }, {
        preserveFacts?: boolean | undefined;
        intensity?: "subtle" | "moderate" | "strong" | undefined;
        focusAreas?: ("sentence_structure" | "vocabulary" | "tone" | "punctuation" | "cultural_markers")[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    sourceText: string;
    voiceProfile: {
        confidence: number;
        userId: string;
        profileId: string;
        characteristics: {
            avgSentenceLength: number;
            sentenceComplexity: "moderate" | "simple" | "complex";
            prefersShortSentences: boolean;
            vocabularyLevel: "basic" | "intermediate" | "advanced";
            commonWords: string[];
            idiosyncraticPhrases: string[];
            dominantTone: ("nostalgic" | "humorous" | "serious" | "reflective" | "conversational" | "formal" | "emotional" | "matter-of-fact")[];
            emotionalRange: "moderate" | "restricted" | "expressive";
            usesEllipsis: boolean;
            usesEmDash: boolean;
            exclamationFrequency: "moderate" | "rare" | "frequent";
            dialect: string[];
            eraMarkers: string[];
            perspective: "mixed" | "first_person" | "third_person";
            tense: "mixed" | "past" | "present";
            detailLevel: "moderate" | "sparse" | "rich";
        };
        createdAt: string;
        updatedAt: string;
        sampleSources: {
            content: string;
            sourceType: "interview_answer" | "written_sample" | "voice_transcript" | "voice_recording";
            sourceId: string;
            extractedAt: string;
            weight: number;
        }[];
    };
    options?: {
        preserveFacts: boolean;
        intensity: "subtle" | "moderate" | "strong";
        focusAreas?: ("sentence_structure" | "vocabulary" | "tone" | "punctuation" | "cultural_markers")[] | undefined;
    } | undefined;
}, {
    sourceText: string;
    voiceProfile: {
        confidence: number;
        userId: string;
        profileId: string;
        characteristics: {
            avgSentenceLength: number;
            sentenceComplexity: "moderate" | "simple" | "complex";
            prefersShortSentences: boolean;
            vocabularyLevel: "basic" | "intermediate" | "advanced";
            commonWords: string[];
            idiosyncraticPhrases: string[];
            dominantTone: ("nostalgic" | "humorous" | "serious" | "reflective" | "conversational" | "formal" | "emotional" | "matter-of-fact")[];
            emotionalRange: "moderate" | "restricted" | "expressive";
            usesEllipsis: boolean;
            usesEmDash: boolean;
            exclamationFrequency: "moderate" | "rare" | "frequent";
            dialect: string[];
            eraMarkers: string[];
            perspective: "mixed" | "first_person" | "third_person";
            tense: "mixed" | "past" | "present";
            detailLevel: "moderate" | "sparse" | "rich";
        };
        createdAt: string;
        updatedAt: string;
        sampleSources: {
            content: string;
            sourceType: "interview_answer" | "written_sample" | "voice_transcript" | "voice_recording";
            sourceId: string;
            extractedAt: string;
            weight: number;
        }[];
    };
    options?: {
        preserveFacts?: boolean | undefined;
        intensity?: "subtle" | "moderate" | "strong" | undefined;
        focusAreas?: ("sentence_structure" | "vocabulary" | "tone" | "punctuation" | "cultural_markers")[] | undefined;
    } | undefined;
}>;
/**
 * Style change schema
 */
export declare const styleChangeSchema: z.ZodObject<{
    type: z.ZodEnum<["sentence_structure", "vocabulary", "tone", "punctuation", "cultural_markers"]>;
    original: z.ZodString;
    modified: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "sentence_structure" | "vocabulary" | "tone" | "punctuation" | "cultural_markers";
    original: string;
    modified: string;
    reason: string;
}, {
    type: "sentence_structure" | "vocabulary" | "tone" | "punctuation" | "cultural_markers";
    original: string;
    modified: string;
    reason: string;
}>;
/**
 * Style transfer result schema
 */
export declare const styleTransferResultSchema: z.ZodObject<{
    rewrittenText: z.ZodString;
    confidence: z.ZodNumber;
    changes: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["sentence_structure", "vocabulary", "tone", "punctuation", "cultural_markers"]>;
        original: z.ZodString;
        modified: z.ZodString;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "sentence_structure" | "vocabulary" | "tone" | "punctuation" | "cultural_markers";
        original: string;
        modified: string;
        reason: string;
    }, {
        type: "sentence_structure" | "vocabulary" | "tone" | "punctuation" | "cultural_markers";
        original: string;
        modified: string;
        reason: string;
    }>, "many">;
    warnings: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    confidence: number;
    rewrittenText: string;
    changes: {
        type: "sentence_structure" | "vocabulary" | "tone" | "punctuation" | "cultural_markers";
        original: string;
        modified: string;
        reason: string;
    }[];
    warnings?: string[] | undefined;
}, {
    confidence: number;
    rewrittenText: string;
    changes: {
        type: "sentence_structure" | "vocabulary" | "tone" | "punctuation" | "cultural_markers";
        original: string;
        modified: string;
        reason: string;
    }[];
    warnings?: string[] | undefined;
}>;
/**
 * Voice profile creation request schema
 */
export declare const voiceProfileCreationRequestSchema: z.ZodObject<{
    userId: z.ZodString;
    samples: z.ZodArray<z.ZodObject<{
        sampleId: z.ZodString;
        content: z.ZodString;
        sourceType: z.ZodEnum<["interview_answer", "written_sample", "voice_transcript", "voice_recording"]>;
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
        sourceType: "interview_answer" | "written_sample" | "voice_transcript" | "voice_recording";
        sampleId: string;
        metadata?: {
            context?: string | undefined;
            recordedAt?: string | undefined;
            topic?: string | undefined;
        } | undefined;
    }, {
        content: string;
        sourceType: "interview_answer" | "written_sample" | "voice_transcript" | "voice_recording";
        sampleId: string;
        metadata?: {
            context?: string | undefined;
            recordedAt?: string | undefined;
            topic?: string | undefined;
        } | undefined;
    }>, "many">;
    profileId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    samples: {
        content: string;
        sourceType: "interview_answer" | "written_sample" | "voice_transcript" | "voice_recording";
        sampleId: string;
        metadata?: {
            context?: string | undefined;
            recordedAt?: string | undefined;
            topic?: string | undefined;
        } | undefined;
    }[];
    profileId?: string | undefined;
}, {
    userId: string;
    samples: {
        content: string;
        sourceType: "interview_answer" | "written_sample" | "voice_transcript" | "voice_recording";
        sampleId: string;
        metadata?: {
            context?: string | undefined;
            recordedAt?: string | undefined;
            topic?: string | undefined;
        } | undefined;
    }[];
    profileId?: string | undefined;
}>;
/**
 * Voice profile analysis result schema
 */
export declare const voiceProfileAnalysisSchema: z.ZodObject<{
    profile: z.ZodObject<{
        profileId: z.ZodString;
        userId: z.ZodString;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        characteristics: z.ZodObject<{
            avgSentenceLength: z.ZodNumber;
            sentenceComplexity: z.ZodEnum<["simple", "moderate", "complex"]>;
            prefersShortSentences: z.ZodBoolean;
            vocabularyLevel: z.ZodEnum<["basic", "intermediate", "advanced"]>;
            commonWords: z.ZodArray<z.ZodString, "many">;
            idiosyncraticPhrases: z.ZodArray<z.ZodString, "many">;
            dominantTone: z.ZodArray<z.ZodEnum<["nostalgic", "humorous", "serious", "reflective", "conversational", "formal", "emotional", "matter-of-fact"]>, "many">;
            emotionalRange: z.ZodEnum<["restricted", "moderate", "expressive"]>;
            usesEllipsis: z.ZodBoolean;
            usesEmDash: z.ZodBoolean;
            exclamationFrequency: z.ZodEnum<["rare", "moderate", "frequent"]>;
            dialect: z.ZodArray<z.ZodString, "many">;
            eraMarkers: z.ZodArray<z.ZodString, "many">;
            perspective: z.ZodEnum<["first_person", "third_person", "mixed"]>;
            tense: z.ZodEnum<["past", "present", "mixed"]>;
            detailLevel: z.ZodEnum<["sparse", "moderate", "rich"]>;
        }, "strip", z.ZodTypeAny, {
            avgSentenceLength: number;
            sentenceComplexity: "moderate" | "simple" | "complex";
            prefersShortSentences: boolean;
            vocabularyLevel: "basic" | "intermediate" | "advanced";
            commonWords: string[];
            idiosyncraticPhrases: string[];
            dominantTone: ("nostalgic" | "humorous" | "serious" | "reflective" | "conversational" | "formal" | "emotional" | "matter-of-fact")[];
            emotionalRange: "moderate" | "restricted" | "expressive";
            usesEllipsis: boolean;
            usesEmDash: boolean;
            exclamationFrequency: "moderate" | "rare" | "frequent";
            dialect: string[];
            eraMarkers: string[];
            perspective: "mixed" | "first_person" | "third_person";
            tense: "mixed" | "past" | "present";
            detailLevel: "moderate" | "sparse" | "rich";
        }, {
            avgSentenceLength: number;
            sentenceComplexity: "moderate" | "simple" | "complex";
            prefersShortSentences: boolean;
            vocabularyLevel: "basic" | "intermediate" | "advanced";
            commonWords: string[];
            idiosyncraticPhrases: string[];
            dominantTone: ("nostalgic" | "humorous" | "serious" | "reflective" | "conversational" | "formal" | "emotional" | "matter-of-fact")[];
            emotionalRange: "moderate" | "restricted" | "expressive";
            usesEllipsis: boolean;
            usesEmDash: boolean;
            exclamationFrequency: "moderate" | "rare" | "frequent";
            dialect: string[];
            eraMarkers: string[];
            perspective: "mixed" | "first_person" | "third_person";
            tense: "mixed" | "past" | "present";
            detailLevel: "moderate" | "sparse" | "rich";
        }>;
        sampleSources: z.ZodArray<z.ZodObject<{
            sourceId: z.ZodString;
            sourceType: z.ZodEnum<["interview_answer", "written_sample", "voice_transcript", "voice_recording"]>;
            content: z.ZodString;
            extractedAt: z.ZodString;
            weight: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            content: string;
            sourceType: "interview_answer" | "written_sample" | "voice_transcript" | "voice_recording";
            sourceId: string;
            extractedAt: string;
            weight: number;
        }, {
            content: string;
            sourceType: "interview_answer" | "written_sample" | "voice_transcript" | "voice_recording";
            sourceId: string;
            extractedAt: string;
            weight: number;
        }>, "many">;
        confidence: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        confidence: number;
        userId: string;
        profileId: string;
        characteristics: {
            avgSentenceLength: number;
            sentenceComplexity: "moderate" | "simple" | "complex";
            prefersShortSentences: boolean;
            vocabularyLevel: "basic" | "intermediate" | "advanced";
            commonWords: string[];
            idiosyncraticPhrases: string[];
            dominantTone: ("nostalgic" | "humorous" | "serious" | "reflective" | "conversational" | "formal" | "emotional" | "matter-of-fact")[];
            emotionalRange: "moderate" | "restricted" | "expressive";
            usesEllipsis: boolean;
            usesEmDash: boolean;
            exclamationFrequency: "moderate" | "rare" | "frequent";
            dialect: string[];
            eraMarkers: string[];
            perspective: "mixed" | "first_person" | "third_person";
            tense: "mixed" | "past" | "present";
            detailLevel: "moderate" | "sparse" | "rich";
        };
        createdAt: string;
        updatedAt: string;
        sampleSources: {
            content: string;
            sourceType: "interview_answer" | "written_sample" | "voice_transcript" | "voice_recording";
            sourceId: string;
            extractedAt: string;
            weight: number;
        }[];
    }, {
        confidence: number;
        userId: string;
        profileId: string;
        characteristics: {
            avgSentenceLength: number;
            sentenceComplexity: "moderate" | "simple" | "complex";
            prefersShortSentences: boolean;
            vocabularyLevel: "basic" | "intermediate" | "advanced";
            commonWords: string[];
            idiosyncraticPhrases: string[];
            dominantTone: ("nostalgic" | "humorous" | "serious" | "reflective" | "conversational" | "formal" | "emotional" | "matter-of-fact")[];
            emotionalRange: "moderate" | "restricted" | "expressive";
            usesEllipsis: boolean;
            usesEmDash: boolean;
            exclamationFrequency: "moderate" | "rare" | "frequent";
            dialect: string[];
            eraMarkers: string[];
            perspective: "mixed" | "first_person" | "third_person";
            tense: "mixed" | "past" | "present";
            detailLevel: "moderate" | "sparse" | "rich";
        };
        createdAt: string;
        updatedAt: string;
        sampleSources: {
            content: string;
            sourceType: "interview_answer" | "written_sample" | "voice_transcript" | "voice_recording";
            sourceId: string;
            extractedAt: string;
            weight: number;
        }[];
    }>;
    summary: z.ZodString;
    dominantTraits: z.ZodArray<z.ZodString, "many">;
    suggestions: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    summary: string;
    suggestions: string[];
    dominantTraits: string[];
    profile: {
        confidence: number;
        userId: string;
        profileId: string;
        characteristics: {
            avgSentenceLength: number;
            sentenceComplexity: "moderate" | "simple" | "complex";
            prefersShortSentences: boolean;
            vocabularyLevel: "basic" | "intermediate" | "advanced";
            commonWords: string[];
            idiosyncraticPhrases: string[];
            dominantTone: ("nostalgic" | "humorous" | "serious" | "reflective" | "conversational" | "formal" | "emotional" | "matter-of-fact")[];
            emotionalRange: "moderate" | "restricted" | "expressive";
            usesEllipsis: boolean;
            usesEmDash: boolean;
            exclamationFrequency: "moderate" | "rare" | "frequent";
            dialect: string[];
            eraMarkers: string[];
            perspective: "mixed" | "first_person" | "third_person";
            tense: "mixed" | "past" | "present";
            detailLevel: "moderate" | "sparse" | "rich";
        };
        createdAt: string;
        updatedAt: string;
        sampleSources: {
            content: string;
            sourceType: "interview_answer" | "written_sample" | "voice_transcript" | "voice_recording";
            sourceId: string;
            extractedAt: string;
            weight: number;
        }[];
    };
}, {
    summary: string;
    suggestions: string[];
    dominantTraits: string[];
    profile: {
        confidence: number;
        userId: string;
        profileId: string;
        characteristics: {
            avgSentenceLength: number;
            sentenceComplexity: "moderate" | "simple" | "complex";
            prefersShortSentences: boolean;
            vocabularyLevel: "basic" | "intermediate" | "advanced";
            commonWords: string[];
            idiosyncraticPhrases: string[];
            dominantTone: ("nostalgic" | "humorous" | "serious" | "reflective" | "conversational" | "formal" | "emotional" | "matter-of-fact")[];
            emotionalRange: "moderate" | "restricted" | "expressive";
            usesEllipsis: boolean;
            usesEmDash: boolean;
            exclamationFrequency: "moderate" | "rare" | "frequent";
            dialect: string[];
            eraMarkers: string[];
            perspective: "mixed" | "first_person" | "third_person";
            tense: "mixed" | "past" | "present";
            detailLevel: "moderate" | "sparse" | "rich";
        };
        createdAt: string;
        updatedAt: string;
        sampleSources: {
            content: string;
            sourceType: "interview_answer" | "written_sample" | "voice_transcript" | "voice_recording";
            sourceId: string;
            extractedAt: string;
            weight: number;
        }[];
    };
}>;
//# sourceMappingURL=style.schemas.d.ts.map