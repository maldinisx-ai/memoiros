/**
 * Mock Storage for Testing
 *
 * In-memory storage that implements the same interface as MemoirOSStorage
 * but doesn't require native dependencies
 */
export class MockStorage {
    interviews = new Map();
    questions = new Map();
    answers = new Map();
    timelineEvents = new Map();
    saveInterview(interview) {
        const metadata = {
            userBirthYear: interview.metadata.userBirthYear,
            userBirthplace: interview.metadata.userBirthplace,
            userOccupation: interview.metadata.userOccupation,
            interviewGoal: interview.metadata.interviewGoal,
            targetLength: interview.metadata.targetLength,
            completedPhases: Array.isArray(interview.metadata.completedPhases)
                ? interview.metadata.completedPhases
                : [],
        };
        const state = {
            interviewId: interview.interviewId,
            userId: interview.userId,
            status: interview.status,
            startedAt: interview.startedAt,
            completedAt: interview.completedAt,
            currentPhase: interview.currentPhase,
            questions: [],
            answers: [],
            extractedFacts: [],
            metadata,
        };
        this.interviews.set(interview.interviewId, state);
    }
    loadInterview(interviewId) {
        return this.interviews.get(interviewId) ?? null;
    }
    saveQuestion(question) {
        this.questions.set(question.questionId, question);
    }
    saveAnswer(answer) {
        const entities = answer.extractedEntities;
        const fullAnswer = {
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
    loadAnswers(interviewId) {
        return this.answers.get(interviewId) ?? [];
    }
    saveTimelineEvent(event) {
        // Convert date to proper TimelineDate type
        let timelineDate;
        if (event.date.type === "exact") {
            timelineDate = {
                type: "exact",
                year: event.date.year ?? new Date().getFullYear(),
                month: event.date.month,
                day: event.date.day,
            };
        }
        else if (event.date.type === "era" && event.date.era) {
            timelineDate = {
                type: "era",
                era: event.date.era,
                description: event.date.era,
            };
        }
        else if (event.date.type === "approximate" && event.date.year !== undefined) {
            timelineDate = {
                type: "approximate",
                year: event.date.year,
                range: event.date.range ?? 2,
            };
        }
        else {
            // Fallback
            timelineDate = {
                type: "era",
                era: "unknown",
                description: "未知时期",
            };
        }
        const fullEvent = {
            eventId: event.eventId,
            date: timelineDate,
            title: event.title,
            description: event.description,
            category: event.category,
            importance: event.importance,
            confidence: event.confidence,
            sourceAnswerIds: [],
            tags: event.tags,
        };
        const events = this.timelineEvents.get(event.userId) ?? [];
        events.push(fullEvent);
        this.timelineEvents.set(event.userId, events);
    }
    loadTimelineEvents(userId) {
        return this.timelineEvents.get(userId) ?? [];
    }
    close() {
        // No-op for mock storage
    }
}
//# sourceMappingURL=mock-storage.js.map