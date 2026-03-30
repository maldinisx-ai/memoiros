/**
 * Interview models
 */

/**
 * Interview state
 */
export interface InterviewState {
  readonly interviewId: string;
  readonly userId: string;
  readonly status: "active" | "paused" | "completed";
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly currentPhase: InterviewPhase;
  readonly questions: ReadonlyArray<InterviewQuestion>;
  readonly answers: ReadonlyArray<InterviewAnswer>;
  readonly extractedFacts: ReadonlyArray<ExtractedFact>;
  readonly metadata: InterviewMetadata;
}

/**
 * Interview phases
 */
export type InterviewPhase =
  | "warmup"           // Initial rapport building
  | "childhood"        // Early years
  | "education"        // School years
  | "career"           // Work life
  | "family"           // Family and relationships
  | "milestones"       // Major life events
  | "reflections"      // Looking back
  | "closing";         // Wrap up

/**
 * Interview question
 */
export interface InterviewQuestion {
  readonly questionId: string;
  readonly phase: InterviewPhase;
  readonly question: string;
  readonly questionType: "open" | "specific" | "followup" | "clarification";
  readonly targetEntities?: ReadonlyArray<string>;  // e.g., ["year", "location", "emotion"]
  readonly priority: "high" | "medium" | "low";
  readonly askedAt?: string;
  readonly answered: boolean;
}

/**
 * Interview answer
 */
export interface InterviewAnswer {
  readonly answerId: string;
  readonly questionId: string;
  readonly answer: string;
  readonly answeredAt: string;
  readonly extractedEntities?: ExtractedEntities;
  readonly sentiment?: "positive" | "neutral" | "negative" | "mixed";
  readonly needsFollowup: boolean;
  readonly followupTopics?: ReadonlyArray<string>;
}

/**
 * Extracted entities from an answer
 */
export interface ExtractedEntities {
  readonly years?: ReadonlyArray<number>;
  readonly locations?: ReadonlyArray<string>;
  readonly people?: ReadonlyArray<string>;
  readonly events?: ReadonlyArray<string>;
  readonly emotions?: ReadonlyArray<string>;
  readonly missingEntities?: ReadonlyArray<string>;  // Entities that would be useful to ask about
}

/**
 * Extracted fact from interview
 */
export interface ExtractedFact {
  readonly factId: string;
  readonly fact: string;
  readonly sourceAnswerIds: ReadonlyArray<string>;
  readonly confidence: number;
  readonly era?: string;          // e.g., "1980s", "1990-1995"
  readonly category?: string;     // e.g., "childhood", "education", "career"
  readonly verified?: boolean;    // Whether fact has been verified
}

/**
 * Interview metadata
 */
export interface InterviewMetadata {
  readonly userBirthYear?: number;
  readonly userBirthplace?: string;
  readonly userOccupation?: string;
  readonly interviewGoal?: string;  // e.g., "family_history", "personal_memoir"
  readonly targetLength?: number;   // Target word count for final memoir
  readonly completedPhases: ReadonlyArray<InterviewPhase>;
}

/**
 * Interview request
 */
export interface InterviewRequest {
  readonly interviewId?: string;   // Resume existing interview
  readonly userId: string;
  readonly phase?: InterviewPhase; // Start at specific phase
  readonly context?: InterviewContext;
}

/**
 * Interview context
 */
export interface InterviewContext {
  readonly previousAnswers?: ReadonlyArray<InterviewAnswer>;
  readonly currentTopic?: string;
  readonly userMood?: string;
  readonly sessionNotes?: ReadonlyArray<string>;
}

/**
 * Interview response
 */
export interface InterviewResponse {
  readonly interviewState: InterviewState;
  readonly nextQuestion?: InterviewQuestion;
  readonly suggestedQuestions?: ReadonlyArray<InterviewQuestion>;
  readonly summary?: string;        // Summary of what was learned in this session
  readonly needsClarification?: ReadonlyArray<string>;  // Topics that need more detail
}

/**
 * Question generation options
 */
export interface QuestionGenerationOptions {
  readonly count?: number;         // Number of questions to generate (default: 1)
  readonly includeFollowups?: boolean;
  readonly focusTopics?: ReadonlyArray<string>;
  readonly difficulty?: "easy" | "medium" | "deep";
}
