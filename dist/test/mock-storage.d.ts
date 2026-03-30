/**
 * Mock Storage for Testing
 *
 * In-memory storage that implements the same interface as MemoirOSStorage
 * but doesn't require native dependencies
 */
import type { InterviewState, InterviewAnswer } from "../packages/core/src/models/interview.js";
import type { TimelineEvent } from "../packages/core/src/models/timeline.js";
export declare class MockStorage {
    private readonly interviews;
    private readonly questions;
    private readonly answers;
    private readonly timelineEvents;
    saveInterview(interview: {
        readonly interviewId: string;
        readonly userId: string;
        readonly status: "active" | "paused" | "completed";
        readonly startedAt: string;
        readonly completedAt?: string;
        readonly currentPhase: string;
        readonly metadata: Record<string, unknown>;
    }): void;
    loadInterview(interviewId: string): InterviewState | null;
    saveQuestion(question: {
        readonly questionId: string;
        readonly interviewId: string;
        readonly phase: string;
        readonly question: string;
        readonly questionType: "open" | "specific" | "followup" | "clarification";
        readonly targetEntities?: ReadonlyArray<string>;
        readonly priority: "high" | "medium" | "low";
        readonly askedAt?: string;
        readonly answered: boolean;
    }): void;
    saveAnswer(answer: {
        readonly answerId: string;
        readonly questionId: string;
        readonly answer: string;
        readonly answeredAt: string;
        readonly extractedEntities?: Record<string, unknown>;
        readonly sentiment?: "positive" | "neutral" | "negative" | "mixed";
        readonly needsFollowup: boolean;
        readonly followupTopics?: ReadonlyArray<string>;
    }): void;
    loadAnswers(interviewId: string): ReadonlyArray<InterviewAnswer>;
    saveTimelineEvent(event: {
        readonly eventId: string;
        readonly timelineId: string;
        readonly userId: string;
        readonly date: {
            readonly type: "exact" | "era" | "approximate";
            readonly year?: number;
            readonly month?: number;
            readonly day?: number;
            readonly era?: string;
            readonly range?: number;
        };
        readonly title: string;
        readonly description: string;
        readonly category: string;
        readonly importance: "critical" | "high" | "medium" | "low";
        readonly confidence: number;
        readonly tags?: ReadonlyArray<string>;
    }): void;
    loadTimelineEvents(userId: string): ReadonlyArray<TimelineEvent>;
    close(): void;
}
//# sourceMappingURL=mock-storage.d.ts.map