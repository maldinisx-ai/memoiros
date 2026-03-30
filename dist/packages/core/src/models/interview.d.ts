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
export type InterviewPhase = "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing";
/**
 * Interview question
 */
export interface InterviewQuestion {
    readonly questionId: string;
    readonly phase: InterviewPhase;
    readonly question: string;
    readonly questionType: "open" | "specific" | "followup" | "clarification";
    readonly targetEntities?: ReadonlyArray<string>;
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
    readonly missingEntities?: ReadonlyArray<string>;
}
/**
 * Extracted fact from interview
 */
export interface ExtractedFact {
    readonly factId: string;
    readonly fact: string;
    readonly sourceAnswerIds: ReadonlyArray<string>;
    readonly confidence: number;
    readonly era?: string;
    readonly category?: string;
    readonly verified?: boolean;
}
/**
 * Interview metadata
 */
export interface InterviewMetadata {
    readonly userBirthYear?: number;
    readonly userBirthplace?: string;
    readonly userOccupation?: string;
    readonly interviewGoal?: string;
    readonly targetLength?: number;
    readonly completedPhases: ReadonlyArray<InterviewPhase>;
}
/**
 * Interview request
 */
export interface InterviewRequest {
    readonly interviewId?: string;
    readonly userId: string;
    readonly phase?: InterviewPhase;
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
    readonly summary?: string;
    readonly needsClarification?: ReadonlyArray<string>;
}
/**
 * Question generation options
 */
export interface QuestionGenerationOptions {
    readonly count?: number;
    readonly includeFollowups?: boolean;
    readonly focusTopics?: ReadonlyArray<string>;
    readonly difficulty?: "easy" | "medium" | "deep";
}
//# sourceMappingURL=interview.d.ts.map