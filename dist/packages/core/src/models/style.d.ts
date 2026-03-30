/**
 * Style models for voice imitation
 */
/**
 * Voice profile - captures user's writing/speaking style
 */
export interface VoiceProfile {
    readonly profileId: string;
    readonly userId: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly characteristics: VoiceCharacteristics;
    readonly sampleSources: ReadonlyArray<SampleSource>;
    readonly confidence: number;
}
/**
 * Voice characteristics extracted from samples
 */
export interface VoiceCharacteristics {
    readonly avgSentenceLength: number;
    readonly sentenceComplexity: "simple" | "moderate" | "complex";
    readonly prefersShortSentences: boolean;
    readonly vocabularyLevel: "basic" | "intermediate" | "advanced";
    readonly commonWords: ReadonlyArray<string>;
    readonly idiosyncraticPhrases: ReadonlyArray<string>;
    readonly dominantTone: ReadonlyArray<ToneType>;
    readonly emotionalRange: "restricted" | "moderate" | "expressive";
    readonly usesEllipsis: boolean;
    readonly usesEmDash: boolean;
    readonly exclamationFrequency: "rare" | "moderate" | "frequent";
    readonly dialect: ReadonlyArray<string>;
    readonly eraMarkers: ReadonlyArray<string>;
    readonly perspective: "first_person" | "third_person" | "mixed";
    readonly tense: "past" | "present" | "mixed";
    readonly detailLevel: "sparse" | "moderate" | "rich";
}
/**
 * Tone types
 */
export type ToneType = "nostalgic" | "humorous" | "serious" | "reflective" | "conversational" | "formal" | "emotional" | "matter-of-fact";
/**
 * Sample source - where the voice profile data came from
 */
export interface SampleSource {
    readonly sourceId: string;
    readonly sourceType: "interview_answer" | "written_sample" | "voice_transcript" | "voice_recording";
    readonly content: string;
    readonly extractedAt: string;
    readonly weight: number;
}
/**
 * Style transfer request
 */
export interface StyleTransferRequest {
    readonly sourceText: string;
    readonly voiceProfile: VoiceProfile;
    readonly options?: StyleTransferOptions;
}
/**
 * Style transfer options
 */
export interface StyleTransferOptions {
    readonly preserveFacts?: boolean;
    readonly intensity?: "subtle" | "moderate" | "strong";
    readonly focusAreas?: ReadonlyArray<StyleFocusArea>;
}
/**
 * Areas of style to focus on
 */
export type StyleFocusArea = "sentence_structure" | "vocabulary" | "tone" | "punctuation" | "cultural_markers";
/**
 * Style transfer result
 */
export interface StyleTransferResult {
    readonly rewrittenText: string;
    readonly confidence: number;
    readonly changes: ReadonlyArray<StyleChange>;
    readonly warnings?: ReadonlyArray<string>;
}
/**
 * Individual style change made
 */
export interface StyleChange {
    readonly type: StyleFocusArea;
    readonly original: string;
    readonly modified: string;
    readonly reason: string;
}
/**
 * Voice profile creation request
 */
export interface VoiceProfileCreationRequest {
    readonly userId: string;
    readonly samples: ReadonlyArray<VoiceSample>;
    readonly profileId?: string;
}
/**
 * Voice sample
 */
export interface VoiceSample {
    readonly sampleId: string;
    readonly content: string;
    readonly sourceType: "interview_answer" | "written_sample" | "voice_transcript";
    readonly metadata?: {
        readonly context?: string;
        readonly recordedAt?: string;
        readonly topic?: string;
    };
}
/**
 * Voice profile analysis result
 */
export interface VoiceProfileAnalysis {
    readonly profile: VoiceProfile;
    readonly summary: string;
    readonly dominantTraits: ReadonlyArray<string>;
    readonly suggestions: ReadonlyArray<string>;
}
//# sourceMappingURL=style.d.ts.map