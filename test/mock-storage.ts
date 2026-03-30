/**
 * Mock Storage for Testing
 *
 * In-memory storage that implements the same interface as MemoirOSStorage
 * but doesn't require native dependencies
 */

import type {
  InterviewState,
  InterviewQuestion,
  InterviewAnswer,
  InterviewPhase,
  InterviewMetadata,
  ExtractedEntities
} from "../packages/core/src/models/interview.js";
import type { TimelineEvent, TimelineDate } from "../packages/core/src/models/timeline.js";

export class MockStorage {
  private readonly interviews = new Map<string, InterviewState>();
  private readonly questions = new Map<string, InterviewQuestion>();
  private readonly answers = new Map<string, InterviewAnswer[]>();
  private readonly timelineEvents = new Map<string, TimelineEvent[]>();

  saveInterview(interview: {
    readonly interviewId: string;
    readonly userId: string;
    readonly status: "active" | "paused" | "completed";
    readonly startedAt: string;
    readonly completedAt?: string;
    readonly currentPhase: string;
    readonly metadata: Record<string, unknown>;
  }): void {
    const metadata: InterviewMetadata = {
      userBirthYear: interview.metadata.userBirthYear as number | undefined,
      userBirthplace: interview.metadata.userBirthplace as string | undefined,
      userOccupation: interview.metadata.userOccupation as string | undefined,
      interviewGoal: interview.metadata.interviewGoal as string | undefined,
      targetLength: interview.metadata.targetLength as number | undefined,
      completedPhases: Array.isArray(interview.metadata.completedPhases)
        ? interview.metadata.completedPhases as InterviewPhase[]
        : [],
    };

    const state: InterviewState = {
      interviewId: interview.interviewId,
      userId: interview.userId,
      status: interview.status,
      startedAt: interview.startedAt,
      completedAt: interview.completedAt,
      currentPhase: interview.currentPhase as InterviewPhase,
      questions: [],
      answers: [],
      extractedFacts: [],
      metadata,
    };

    this.interviews.set(interview.interviewId, state);
  }

  loadInterview(interviewId: string): InterviewState | null {
    return this.interviews.get(interviewId) ?? null;
  }

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
  }): void {
    this.questions.set(question.questionId, question as InterviewQuestion);
  }

  saveAnswer(answer: {
    readonly answerId: string;
    readonly questionId: string;
    readonly answer: string;
    readonly answeredAt: string;
    readonly extractedEntities?: Record<string, unknown>;
    readonly sentiment?: "positive" | "neutral" | "negative" | "mixed";
    readonly needsFollowup: boolean;
    readonly followupTopics?: ReadonlyArray<string>;
  }): void {
    const entities = answer.extractedEntities as ExtractedEntities | undefined;
    const fullAnswer: InterviewAnswer = {
      answerId: answer.answerId,
      questionId: answer.questionId,
      answer: answer.answer,
      answeredAt: answer.answeredAt,
      extractedEntities: entities,
      sentiment: answer.sentiment,
      needsFollowup: answer.needsFollowup,
      followupTopics: answer.followupTopics,
    };

    const answers = this.answers.get(answer.answerId) ?? [];
    answers.push(fullAnswer);
    this.answers.set(answer.answerId, answers);
  }

  loadAnswers(interviewId: string): ReadonlyArray<InterviewAnswer> {
    return this.answers.get(interviewId) ?? [];
  }

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
  }): void {
    // Convert date to proper TimelineDate type
    let timelineDate: TimelineDate;
    if (event.date.type === "exact") {
      timelineDate = {
        type: "exact",
        year: event.date.year ?? new Date().getFullYear(),
        month: event.date.month,
        day: event.date.day,
      };
    } else if (event.date.type === "era" && event.date.era) {
      timelineDate = {
        type: "era",
        era: event.date.era,
        description: event.date.era,
      };
    } else if (event.date.type === "approximate" && event.date.year !== undefined) {
      timelineDate = {
        type: "approximate",
        year: event.date.year,
        range: event.date.range ?? 2,
      };
    } else {
      // Fallback
      timelineDate = {
        type: "era",
        era: "unknown",
        description: "未知时期",
      };
    }

    const fullEvent: TimelineEvent = {
      eventId: event.eventId,
      date: timelineDate,
      title: event.title,
      description: event.description,
      category: event.category as TimelineEvent["category"],
      importance: event.importance,
      confidence: event.confidence,
      sourceAnswerIds: [],
      tags: event.tags,
    };

    const events = this.timelineEvents.get(event.userId) ?? [];
    events.push(fullEvent);
    this.timelineEvents.set(event.userId, events);
  }

  loadTimelineEvents(userId: string): ReadonlyArray<TimelineEvent> {
    return this.timelineEvents.get(userId) ?? [];
  }

  close(): void {
    // No-op for mock storage
  }
}
