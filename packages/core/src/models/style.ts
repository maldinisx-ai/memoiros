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
  // Sentence structure
  readonly avgSentenceLength: number;
  readonly sentenceComplexity: "simple" | "moderate" | "complex";
  readonly prefersShortSentences: boolean;

  // Vocabulary
  readonly vocabularyLevel: "basic" | "intermediate" | "advanced";
  readonly commonWords: ReadonlyArray<string>;
  readonly idiosyncraticPhrases: ReadonlyArray<string>;  // Unique expressions

  // Tone and mood
  readonly dominantTone: ReadonlyArray<ToneType>;
  readonly emotionalRange: "restricted" | "moderate" | "expressive";

  // Punctuation and formatting
  readonly usesEllipsis: boolean;
  readonly usesEmDash: boolean;
  readonly exclamationFrequency: "rare" | "moderate" | "frequent";

  // Cultural markers
  readonly dialect: ReadonlyArray<string>;  // Regional expressions
  readonly eraMarkers: ReadonlyArray<string>;  // Words/phrases from specific era

  // Narrative style
  readonly perspective: "first_person" | "third_person" | "mixed";
  readonly tense: "past" | "present" | "mixed";
  readonly detailLevel: "sparse" | "moderate" | "rich";
}

/**
 * Tone types
 */
export type ToneType =
  | "nostalgic"
  | "humorous"
  | "serious"
  | "reflective"
  | "conversational"
  | "formal"
  | "emotional"
  | "matter-of-fact";

/**
 * Sample source - where the voice profile data came from
 */
export interface SampleSource {
  readonly sourceId: string;
  readonly sourceType: "interview_answer" | "written_sample" | "voice_transcript" | "voice_recording";
  readonly content: string;
  readonly extractedAt: string;
  readonly weight: number;  // How much this sample contributes to the profile
}

/**
 * Style transfer request
 */
export interface StyleTransferRequest {
  readonly sourceText: string;          // Text to rewrite
  readonly voiceProfile: VoiceProfile;  // Target voice profile
  readonly options?: StyleTransferOptions;
}

/**
 * Style transfer options
 */
export interface StyleTransferOptions {
  readonly preserveFacts?: boolean;     // Don't change factual information
  readonly intensity?: "subtle" | "moderate" | "strong";  // How strongly to apply the style
  readonly focusAreas?: ReadonlyArray<StyleFocusArea>;
}

/**
 * Areas of style to focus on
 */
export type StyleFocusArea =
  | "sentence_structure"
  | "vocabulary"
  | "tone"
  | "punctuation"
  | "cultural_markers";

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
  readonly profileId?: string;  // Update existing profile
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
