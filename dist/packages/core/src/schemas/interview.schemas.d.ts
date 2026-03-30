/**
 * Zod schemas for Interview models
 */
import { z } from "zod";
/**
 * Interview phases
 */
export declare const interviewPhaseSchema: z.ZodEnum<["warmup", "childhood", "education", "career", "family", "milestones", "reflections", "closing"]>;
/**
 * Interview status schema
 */
export declare const interviewStatusSchema: z.ZodEnum<["active", "paused", "completed"]>;
/**
 * Question types schema
 */
export declare const questionTypeSchema: z.ZodEnum<["open", "specific", "followup", "clarification"]>;
/**
 * Priority schema
 */
export declare const prioritySchema: z.ZodEnum<["high", "medium", "low"]>;
/**
 * Sentiment schema
 */
export declare const sentimentSchema: z.ZodEnum<["positive", "neutral", "negative", "mixed"]>;
/**
 * Difficulty schema
 */
export declare const difficultySchema: z.ZodEnum<["easy", "medium", "deep"]>;
/**
 * Extracted entities schema
 */
export declare const extractedEntitiesSchema: z.ZodObject<{
    years: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    locations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    people: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    events: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    emotions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    missingEntities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    years?: number[] | undefined;
    locations?: string[] | undefined;
    people?: string[] | undefined;
    events?: string[] | undefined;
    emotions?: string[] | undefined;
    missingEntities?: string[] | undefined;
}, {
    years?: number[] | undefined;
    locations?: string[] | undefined;
    people?: string[] | undefined;
    events?: string[] | undefined;
    emotions?: string[] | undefined;
    missingEntities?: string[] | undefined;
}>;
/**
 * Interview question schema
 */
export declare const interviewQuestionSchema: z.ZodObject<{
    questionId: z.ZodString;
    phase: z.ZodEnum<["warmup", "childhood", "education", "career", "family", "milestones", "reflections", "closing"]>;
    question: z.ZodString;
    questionType: z.ZodEnum<["open", "specific", "followup", "clarification"]>;
    targetEntities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    priority: z.ZodEnum<["high", "medium", "low"]>;
    askedAt: z.ZodOptional<z.ZodString>;
    answered: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    questionId: string;
    phase: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing";
    question: string;
    questionType: "open" | "specific" | "followup" | "clarification";
    priority: "high" | "medium" | "low";
    answered: boolean;
    targetEntities?: string[] | undefined;
    askedAt?: string | undefined;
}, {
    questionId: string;
    phase: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing";
    question: string;
    questionType: "open" | "specific" | "followup" | "clarification";
    priority: "high" | "medium" | "low";
    answered: boolean;
    targetEntities?: string[] | undefined;
    askedAt?: string | undefined;
}>;
/**
 * Interview answer schema
 */
export declare const interviewAnswerSchema: z.ZodObject<{
    answerId: z.ZodString;
    questionId: z.ZodString;
    answer: z.ZodString;
    answeredAt: z.ZodString;
    extractedEntities: z.ZodOptional<z.ZodObject<{
        years: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        locations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        people: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        events: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        emotions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        missingEntities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        years?: number[] | undefined;
        locations?: string[] | undefined;
        people?: string[] | undefined;
        events?: string[] | undefined;
        emotions?: string[] | undefined;
        missingEntities?: string[] | undefined;
    }, {
        years?: number[] | undefined;
        locations?: string[] | undefined;
        people?: string[] | undefined;
        events?: string[] | undefined;
        emotions?: string[] | undefined;
        missingEntities?: string[] | undefined;
    }>>;
    sentiment: z.ZodOptional<z.ZodEnum<["positive", "neutral", "negative", "mixed"]>>;
    needsFollowup: z.ZodBoolean;
    followupTopics: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    questionId: string;
    answerId: string;
    answer: string;
    answeredAt: string;
    needsFollowup: boolean;
    extractedEntities?: {
        years?: number[] | undefined;
        locations?: string[] | undefined;
        people?: string[] | undefined;
        events?: string[] | undefined;
        emotions?: string[] | undefined;
        missingEntities?: string[] | undefined;
    } | undefined;
    sentiment?: "positive" | "neutral" | "negative" | "mixed" | undefined;
    followupTopics?: string[] | undefined;
}, {
    questionId: string;
    answerId: string;
    answer: string;
    answeredAt: string;
    needsFollowup: boolean;
    extractedEntities?: {
        years?: number[] | undefined;
        locations?: string[] | undefined;
        people?: string[] | undefined;
        events?: string[] | undefined;
        emotions?: string[] | undefined;
        missingEntities?: string[] | undefined;
    } | undefined;
    sentiment?: "positive" | "neutral" | "negative" | "mixed" | undefined;
    followupTopics?: string[] | undefined;
}>;
/**
 * Extracted fact schema
 */
export declare const extractedFactSchema: z.ZodObject<{
    factId: z.ZodString;
    fact: z.ZodString;
    sourceAnswerIds: z.ZodArray<z.ZodString, "many">;
    confidence: z.ZodNumber;
    era: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    verified: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    confidence: number;
    fact: string;
    factId: string;
    sourceAnswerIds: string[];
    verified: boolean;
    category?: string | undefined;
    era?: string | undefined;
}, {
    confidence: number;
    fact: string;
    factId: string;
    sourceAnswerIds: string[];
    category?: string | undefined;
    era?: string | undefined;
    verified?: boolean | undefined;
}>;
/**
 * Interview metadata schema
 */
export declare const interviewMetadataSchema: z.ZodObject<{
    userBirthYear: z.ZodOptional<z.ZodNumber>;
    userBirthplace: z.ZodOptional<z.ZodString>;
    userOccupation: z.ZodOptional<z.ZodString>;
    interviewGoal: z.ZodOptional<z.ZodString>;
    targetLength: z.ZodOptional<z.ZodNumber>;
    completedPhases: z.ZodArray<z.ZodEnum<["warmup", "childhood", "education", "career", "family", "milestones", "reflections", "closing"]>, "many">;
}, "strip", z.ZodTypeAny, {
    completedPhases: ("warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing")[];
    userBirthYear?: number | undefined;
    userBirthplace?: string | undefined;
    userOccupation?: string | undefined;
    interviewGoal?: string | undefined;
    targetLength?: number | undefined;
}, {
    completedPhases: ("warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing")[];
    userBirthYear?: number | undefined;
    userBirthplace?: string | undefined;
    userOccupation?: string | undefined;
    interviewGoal?: string | undefined;
    targetLength?: number | undefined;
}>;
/**
 * Interview state schema
 */
export declare const interviewStateSchema: z.ZodObject<{
    interviewId: z.ZodString;
    userId: z.ZodString;
    status: z.ZodEnum<["active", "paused", "completed"]>;
    startedAt: z.ZodString;
    completedAt: z.ZodOptional<z.ZodString>;
    currentPhase: z.ZodEnum<["warmup", "childhood", "education", "career", "family", "milestones", "reflections", "closing"]>;
    questions: z.ZodArray<z.ZodObject<{
        questionId: z.ZodString;
        phase: z.ZodEnum<["warmup", "childhood", "education", "career", "family", "milestones", "reflections", "closing"]>;
        question: z.ZodString;
        questionType: z.ZodEnum<["open", "specific", "followup", "clarification"]>;
        targetEntities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        priority: z.ZodEnum<["high", "medium", "low"]>;
        askedAt: z.ZodOptional<z.ZodString>;
        answered: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        questionId: string;
        phase: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing";
        question: string;
        questionType: "open" | "specific" | "followup" | "clarification";
        priority: "high" | "medium" | "low";
        answered: boolean;
        targetEntities?: string[] | undefined;
        askedAt?: string | undefined;
    }, {
        questionId: string;
        phase: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing";
        question: string;
        questionType: "open" | "specific" | "followup" | "clarification";
        priority: "high" | "medium" | "low";
        answered: boolean;
        targetEntities?: string[] | undefined;
        askedAt?: string | undefined;
    }>, "many">;
    answers: z.ZodArray<z.ZodObject<{
        answerId: z.ZodString;
        questionId: z.ZodString;
        answer: z.ZodString;
        answeredAt: z.ZodString;
        extractedEntities: z.ZodOptional<z.ZodObject<{
            years: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            locations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            people: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            events: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            emotions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            missingEntities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            years?: number[] | undefined;
            locations?: string[] | undefined;
            people?: string[] | undefined;
            events?: string[] | undefined;
            emotions?: string[] | undefined;
            missingEntities?: string[] | undefined;
        }, {
            years?: number[] | undefined;
            locations?: string[] | undefined;
            people?: string[] | undefined;
            events?: string[] | undefined;
            emotions?: string[] | undefined;
            missingEntities?: string[] | undefined;
        }>>;
        sentiment: z.ZodOptional<z.ZodEnum<["positive", "neutral", "negative", "mixed"]>>;
        needsFollowup: z.ZodBoolean;
        followupTopics: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        questionId: string;
        answerId: string;
        answer: string;
        answeredAt: string;
        needsFollowup: boolean;
        extractedEntities?: {
            years?: number[] | undefined;
            locations?: string[] | undefined;
            people?: string[] | undefined;
            events?: string[] | undefined;
            emotions?: string[] | undefined;
            missingEntities?: string[] | undefined;
        } | undefined;
        sentiment?: "positive" | "neutral" | "negative" | "mixed" | undefined;
        followupTopics?: string[] | undefined;
    }, {
        questionId: string;
        answerId: string;
        answer: string;
        answeredAt: string;
        needsFollowup: boolean;
        extractedEntities?: {
            years?: number[] | undefined;
            locations?: string[] | undefined;
            people?: string[] | undefined;
            events?: string[] | undefined;
            emotions?: string[] | undefined;
            missingEntities?: string[] | undefined;
        } | undefined;
        sentiment?: "positive" | "neutral" | "negative" | "mixed" | undefined;
        followupTopics?: string[] | undefined;
    }>, "many">;
    extractedFacts: z.ZodArray<z.ZodObject<{
        factId: z.ZodString;
        fact: z.ZodString;
        sourceAnswerIds: z.ZodArray<z.ZodString, "many">;
        confidence: z.ZodNumber;
        era: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
        verified: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        confidence: number;
        fact: string;
        factId: string;
        sourceAnswerIds: string[];
        verified: boolean;
        category?: string | undefined;
        era?: string | undefined;
    }, {
        confidence: number;
        fact: string;
        factId: string;
        sourceAnswerIds: string[];
        category?: string | undefined;
        era?: string | undefined;
        verified?: boolean | undefined;
    }>, "many">;
    metadata: z.ZodObject<{
        userBirthYear: z.ZodOptional<z.ZodNumber>;
        userBirthplace: z.ZodOptional<z.ZodString>;
        userOccupation: z.ZodOptional<z.ZodString>;
        interviewGoal: z.ZodOptional<z.ZodString>;
        targetLength: z.ZodOptional<z.ZodNumber>;
        completedPhases: z.ZodArray<z.ZodEnum<["warmup", "childhood", "education", "career", "family", "milestones", "reflections", "closing"]>, "many">;
    }, "strip", z.ZodTypeAny, {
        completedPhases: ("warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing")[];
        userBirthYear?: number | undefined;
        userBirthplace?: string | undefined;
        userOccupation?: string | undefined;
        interviewGoal?: string | undefined;
        targetLength?: number | undefined;
    }, {
        completedPhases: ("warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing")[];
        userBirthYear?: number | undefined;
        userBirthplace?: string | undefined;
        userOccupation?: string | undefined;
        interviewGoal?: string | undefined;
        targetLength?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    status: "active" | "paused" | "completed";
    interviewId: string;
    userId: string;
    startedAt: string;
    currentPhase: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing";
    metadata: {
        completedPhases: ("warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing")[];
        userBirthYear?: number | undefined;
        userBirthplace?: string | undefined;
        userOccupation?: string | undefined;
        interviewGoal?: string | undefined;
        targetLength?: number | undefined;
    };
    questions: {
        questionId: string;
        phase: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing";
        question: string;
        questionType: "open" | "specific" | "followup" | "clarification";
        priority: "high" | "medium" | "low";
        answered: boolean;
        targetEntities?: string[] | undefined;
        askedAt?: string | undefined;
    }[];
    answers: {
        questionId: string;
        answerId: string;
        answer: string;
        answeredAt: string;
        needsFollowup: boolean;
        extractedEntities?: {
            years?: number[] | undefined;
            locations?: string[] | undefined;
            people?: string[] | undefined;
            events?: string[] | undefined;
            emotions?: string[] | undefined;
            missingEntities?: string[] | undefined;
        } | undefined;
        sentiment?: "positive" | "neutral" | "negative" | "mixed" | undefined;
        followupTopics?: string[] | undefined;
    }[];
    extractedFacts: {
        confidence: number;
        fact: string;
        factId: string;
        sourceAnswerIds: string[];
        verified: boolean;
        category?: string | undefined;
        era?: string | undefined;
    }[];
    completedAt?: string | undefined;
}, {
    status: "active" | "paused" | "completed";
    interviewId: string;
    userId: string;
    startedAt: string;
    currentPhase: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing";
    metadata: {
        completedPhases: ("warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing")[];
        userBirthYear?: number | undefined;
        userBirthplace?: string | undefined;
        userOccupation?: string | undefined;
        interviewGoal?: string | undefined;
        targetLength?: number | undefined;
    };
    questions: {
        questionId: string;
        phase: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing";
        question: string;
        questionType: "open" | "specific" | "followup" | "clarification";
        priority: "high" | "medium" | "low";
        answered: boolean;
        targetEntities?: string[] | undefined;
        askedAt?: string | undefined;
    }[];
    answers: {
        questionId: string;
        answerId: string;
        answer: string;
        answeredAt: string;
        needsFollowup: boolean;
        extractedEntities?: {
            years?: number[] | undefined;
            locations?: string[] | undefined;
            people?: string[] | undefined;
            events?: string[] | undefined;
            emotions?: string[] | undefined;
            missingEntities?: string[] | undefined;
        } | undefined;
        sentiment?: "positive" | "neutral" | "negative" | "mixed" | undefined;
        followupTopics?: string[] | undefined;
    }[];
    extractedFacts: {
        confidence: number;
        fact: string;
        factId: string;
        sourceAnswerIds: string[];
        category?: string | undefined;
        era?: string | undefined;
        verified?: boolean | undefined;
    }[];
    completedAt?: string | undefined;
}>;
/**
 * Interview context schema
 */
export declare const interviewContextSchema: z.ZodObject<{
    previousAnswers: z.ZodOptional<z.ZodArray<z.ZodObject<{
        answerId: z.ZodString;
        questionId: z.ZodString;
        answer: z.ZodString;
        answeredAt: z.ZodString;
        extractedEntities: z.ZodOptional<z.ZodObject<{
            years: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
            locations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            people: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            events: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            emotions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            missingEntities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            years?: number[] | undefined;
            locations?: string[] | undefined;
            people?: string[] | undefined;
            events?: string[] | undefined;
            emotions?: string[] | undefined;
            missingEntities?: string[] | undefined;
        }, {
            years?: number[] | undefined;
            locations?: string[] | undefined;
            people?: string[] | undefined;
            events?: string[] | undefined;
            emotions?: string[] | undefined;
            missingEntities?: string[] | undefined;
        }>>;
        sentiment: z.ZodOptional<z.ZodEnum<["positive", "neutral", "negative", "mixed"]>>;
        needsFollowup: z.ZodBoolean;
        followupTopics: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        questionId: string;
        answerId: string;
        answer: string;
        answeredAt: string;
        needsFollowup: boolean;
        extractedEntities?: {
            years?: number[] | undefined;
            locations?: string[] | undefined;
            people?: string[] | undefined;
            events?: string[] | undefined;
            emotions?: string[] | undefined;
            missingEntities?: string[] | undefined;
        } | undefined;
        sentiment?: "positive" | "neutral" | "negative" | "mixed" | undefined;
        followupTopics?: string[] | undefined;
    }, {
        questionId: string;
        answerId: string;
        answer: string;
        answeredAt: string;
        needsFollowup: boolean;
        extractedEntities?: {
            years?: number[] | undefined;
            locations?: string[] | undefined;
            people?: string[] | undefined;
            events?: string[] | undefined;
            emotions?: string[] | undefined;
            missingEntities?: string[] | undefined;
        } | undefined;
        sentiment?: "positive" | "neutral" | "negative" | "mixed" | undefined;
        followupTopics?: string[] | undefined;
    }>, "many">>;
    currentTopic: z.ZodOptional<z.ZodString>;
    userMood: z.ZodOptional<z.ZodString>;
    sessionNotes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    previousAnswers?: {
        questionId: string;
        answerId: string;
        answer: string;
        answeredAt: string;
        needsFollowup: boolean;
        extractedEntities?: {
            years?: number[] | undefined;
            locations?: string[] | undefined;
            people?: string[] | undefined;
            events?: string[] | undefined;
            emotions?: string[] | undefined;
            missingEntities?: string[] | undefined;
        } | undefined;
        sentiment?: "positive" | "neutral" | "negative" | "mixed" | undefined;
        followupTopics?: string[] | undefined;
    }[] | undefined;
    currentTopic?: string | undefined;
    userMood?: string | undefined;
    sessionNotes?: string[] | undefined;
}, {
    previousAnswers?: {
        questionId: string;
        answerId: string;
        answer: string;
        answeredAt: string;
        needsFollowup: boolean;
        extractedEntities?: {
            years?: number[] | undefined;
            locations?: string[] | undefined;
            people?: string[] | undefined;
            events?: string[] | undefined;
            emotions?: string[] | undefined;
            missingEntities?: string[] | undefined;
        } | undefined;
        sentiment?: "positive" | "neutral" | "negative" | "mixed" | undefined;
        followupTopics?: string[] | undefined;
    }[] | undefined;
    currentTopic?: string | undefined;
    userMood?: string | undefined;
    sessionNotes?: string[] | undefined;
}>;
/**
 * Interview request schema
 */
export declare const interviewRequestSchema: z.ZodObject<{
    interviewId: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
    phase: z.ZodOptional<z.ZodEnum<["warmup", "childhood", "education", "career", "family", "milestones", "reflections", "closing"]>>;
    context: z.ZodOptional<z.ZodObject<{
        previousAnswers: z.ZodOptional<z.ZodArray<z.ZodObject<{
            answerId: z.ZodString;
            questionId: z.ZodString;
            answer: z.ZodString;
            answeredAt: z.ZodString;
            extractedEntities: z.ZodOptional<z.ZodObject<{
                years: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
                locations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                people: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                events: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                emotions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                missingEntities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                years?: number[] | undefined;
                locations?: string[] | undefined;
                people?: string[] | undefined;
                events?: string[] | undefined;
                emotions?: string[] | undefined;
                missingEntities?: string[] | undefined;
            }, {
                years?: number[] | undefined;
                locations?: string[] | undefined;
                people?: string[] | undefined;
                events?: string[] | undefined;
                emotions?: string[] | undefined;
                missingEntities?: string[] | undefined;
            }>>;
            sentiment: z.ZodOptional<z.ZodEnum<["positive", "neutral", "negative", "mixed"]>>;
            needsFollowup: z.ZodBoolean;
            followupTopics: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            questionId: string;
            answerId: string;
            answer: string;
            answeredAt: string;
            needsFollowup: boolean;
            extractedEntities?: {
                years?: number[] | undefined;
                locations?: string[] | undefined;
                people?: string[] | undefined;
                events?: string[] | undefined;
                emotions?: string[] | undefined;
                missingEntities?: string[] | undefined;
            } | undefined;
            sentiment?: "positive" | "neutral" | "negative" | "mixed" | undefined;
            followupTopics?: string[] | undefined;
        }, {
            questionId: string;
            answerId: string;
            answer: string;
            answeredAt: string;
            needsFollowup: boolean;
            extractedEntities?: {
                years?: number[] | undefined;
                locations?: string[] | undefined;
                people?: string[] | undefined;
                events?: string[] | undefined;
                emotions?: string[] | undefined;
                missingEntities?: string[] | undefined;
            } | undefined;
            sentiment?: "positive" | "neutral" | "negative" | "mixed" | undefined;
            followupTopics?: string[] | undefined;
        }>, "many">>;
        currentTopic: z.ZodOptional<z.ZodString>;
        userMood: z.ZodOptional<z.ZodString>;
        sessionNotes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        previousAnswers?: {
            questionId: string;
            answerId: string;
            answer: string;
            answeredAt: string;
            needsFollowup: boolean;
            extractedEntities?: {
                years?: number[] | undefined;
                locations?: string[] | undefined;
                people?: string[] | undefined;
                events?: string[] | undefined;
                emotions?: string[] | undefined;
                missingEntities?: string[] | undefined;
            } | undefined;
            sentiment?: "positive" | "neutral" | "negative" | "mixed" | undefined;
            followupTopics?: string[] | undefined;
        }[] | undefined;
        currentTopic?: string | undefined;
        userMood?: string | undefined;
        sessionNotes?: string[] | undefined;
    }, {
        previousAnswers?: {
            questionId: string;
            answerId: string;
            answer: string;
            answeredAt: string;
            needsFollowup: boolean;
            extractedEntities?: {
                years?: number[] | undefined;
                locations?: string[] | undefined;
                people?: string[] | undefined;
                events?: string[] | undefined;
                emotions?: string[] | undefined;
                missingEntities?: string[] | undefined;
            } | undefined;
            sentiment?: "positive" | "neutral" | "negative" | "mixed" | undefined;
            followupTopics?: string[] | undefined;
        }[] | undefined;
        currentTopic?: string | undefined;
        userMood?: string | undefined;
        sessionNotes?: string[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    interviewId?: string | undefined;
    phase?: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing" | undefined;
    context?: {
        previousAnswers?: {
            questionId: string;
            answerId: string;
            answer: string;
            answeredAt: string;
            needsFollowup: boolean;
            extractedEntities?: {
                years?: number[] | undefined;
                locations?: string[] | undefined;
                people?: string[] | undefined;
                events?: string[] | undefined;
                emotions?: string[] | undefined;
                missingEntities?: string[] | undefined;
            } | undefined;
            sentiment?: "positive" | "neutral" | "negative" | "mixed" | undefined;
            followupTopics?: string[] | undefined;
        }[] | undefined;
        currentTopic?: string | undefined;
        userMood?: string | undefined;
        sessionNotes?: string[] | undefined;
    } | undefined;
}, {
    userId: string;
    interviewId?: string | undefined;
    phase?: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing" | undefined;
    context?: {
        previousAnswers?: {
            questionId: string;
            answerId: string;
            answer: string;
            answeredAt: string;
            needsFollowup: boolean;
            extractedEntities?: {
                years?: number[] | undefined;
                locations?: string[] | undefined;
                people?: string[] | undefined;
                events?: string[] | undefined;
                emotions?: string[] | undefined;
                missingEntities?: string[] | undefined;
            } | undefined;
            sentiment?: "positive" | "neutral" | "negative" | "mixed" | undefined;
            followupTopics?: string[] | undefined;
        }[] | undefined;
        currentTopic?: string | undefined;
        userMood?: string | undefined;
        sessionNotes?: string[] | undefined;
    } | undefined;
}>;
/**
 * Interview response schema
 */
export declare const interviewResponseSchema: z.ZodObject<{
    interviewState: z.ZodObject<{
        interviewId: z.ZodString;
        userId: z.ZodString;
        status: z.ZodEnum<["active", "paused", "completed"]>;
        startedAt: z.ZodString;
        completedAt: z.ZodOptional<z.ZodString>;
        currentPhase: z.ZodEnum<["warmup", "childhood", "education", "career", "family", "milestones", "reflections", "closing"]>;
        questions: z.ZodArray<z.ZodObject<{
            questionId: z.ZodString;
            phase: z.ZodEnum<["warmup", "childhood", "education", "career", "family", "milestones", "reflections", "closing"]>;
            question: z.ZodString;
            questionType: z.ZodEnum<["open", "specific", "followup", "clarification"]>;
            targetEntities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            priority: z.ZodEnum<["high", "medium", "low"]>;
            askedAt: z.ZodOptional<z.ZodString>;
            answered: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            questionId: string;
            phase: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing";
            question: string;
            questionType: "open" | "specific" | "followup" | "clarification";
            priority: "high" | "medium" | "low";
            answered: boolean;
            targetEntities?: string[] | undefined;
            askedAt?: string | undefined;
        }, {
            questionId: string;
            phase: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing";
            question: string;
            questionType: "open" | "specific" | "followup" | "clarification";
            priority: "high" | "medium" | "low";
            answered: boolean;
            targetEntities?: string[] | undefined;
            askedAt?: string | undefined;
        }>, "many">;
        answers: z.ZodArray<z.ZodObject<{
            answerId: z.ZodString;
            questionId: z.ZodString;
            answer: z.ZodString;
            answeredAt: z.ZodString;
            extractedEntities: z.ZodOptional<z.ZodObject<{
                years: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
                locations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                people: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                events: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                emotions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                missingEntities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                years?: number[] | undefined;
                locations?: string[] | undefined;
                people?: string[] | undefined;
                events?: string[] | undefined;
                emotions?: string[] | undefined;
                missingEntities?: string[] | undefined;
            }, {
                years?: number[] | undefined;
                locations?: string[] | undefined;
                people?: string[] | undefined;
                events?: string[] | undefined;
                emotions?: string[] | undefined;
                missingEntities?: string[] | undefined;
            }>>;
            sentiment: z.ZodOptional<z.ZodEnum<["positive", "neutral", "negative", "mixed"]>>;
            needsFollowup: z.ZodBoolean;
            followupTopics: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            questionId: string;
            answerId: string;
            answer: string;
            answeredAt: string;
            needsFollowup: boolean;
            extractedEntities?: {
                years?: number[] | undefined;
                locations?: string[] | undefined;
                people?: string[] | undefined;
                events?: string[] | undefined;
                emotions?: string[] | undefined;
                missingEntities?: string[] | undefined;
            } | undefined;
            sentiment?: "positive" | "neutral" | "negative" | "mixed" | undefined;
            followupTopics?: string[] | undefined;
        }, {
            questionId: string;
            answerId: string;
            answer: string;
            answeredAt: string;
            needsFollowup: boolean;
            extractedEntities?: {
                years?: number[] | undefined;
                locations?: string[] | undefined;
                people?: string[] | undefined;
                events?: string[] | undefined;
                emotions?: string[] | undefined;
                missingEntities?: string[] | undefined;
            } | undefined;
            sentiment?: "positive" | "neutral" | "negative" | "mixed" | undefined;
            followupTopics?: string[] | undefined;
        }>, "many">;
        extractedFacts: z.ZodArray<z.ZodObject<{
            factId: z.ZodString;
            fact: z.ZodString;
            sourceAnswerIds: z.ZodArray<z.ZodString, "many">;
            confidence: z.ZodNumber;
            era: z.ZodOptional<z.ZodString>;
            category: z.ZodOptional<z.ZodString>;
            verified: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        }, "strip", z.ZodTypeAny, {
            confidence: number;
            fact: string;
            factId: string;
            sourceAnswerIds: string[];
            verified: boolean;
            category?: string | undefined;
            era?: string | undefined;
        }, {
            confidence: number;
            fact: string;
            factId: string;
            sourceAnswerIds: string[];
            category?: string | undefined;
            era?: string | undefined;
            verified?: boolean | undefined;
        }>, "many">;
        metadata: z.ZodObject<{
            userBirthYear: z.ZodOptional<z.ZodNumber>;
            userBirthplace: z.ZodOptional<z.ZodString>;
            userOccupation: z.ZodOptional<z.ZodString>;
            interviewGoal: z.ZodOptional<z.ZodString>;
            targetLength: z.ZodOptional<z.ZodNumber>;
            completedPhases: z.ZodArray<z.ZodEnum<["warmup", "childhood", "education", "career", "family", "milestones", "reflections", "closing"]>, "many">;
        }, "strip", z.ZodTypeAny, {
            completedPhases: ("warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing")[];
            userBirthYear?: number | undefined;
            userBirthplace?: string | undefined;
            userOccupation?: string | undefined;
            interviewGoal?: string | undefined;
            targetLength?: number | undefined;
        }, {
            completedPhases: ("warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing")[];
            userBirthYear?: number | undefined;
            userBirthplace?: string | undefined;
            userOccupation?: string | undefined;
            interviewGoal?: string | undefined;
            targetLength?: number | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        status: "active" | "paused" | "completed";
        interviewId: string;
        userId: string;
        startedAt: string;
        currentPhase: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing";
        metadata: {
            completedPhases: ("warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing")[];
            userBirthYear?: number | undefined;
            userBirthplace?: string | undefined;
            userOccupation?: string | undefined;
            interviewGoal?: string | undefined;
            targetLength?: number | undefined;
        };
        questions: {
            questionId: string;
            phase: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing";
            question: string;
            questionType: "open" | "specific" | "followup" | "clarification";
            priority: "high" | "medium" | "low";
            answered: boolean;
            targetEntities?: string[] | undefined;
            askedAt?: string | undefined;
        }[];
        answers: {
            questionId: string;
            answerId: string;
            answer: string;
            answeredAt: string;
            needsFollowup: boolean;
            extractedEntities?: {
                years?: number[] | undefined;
                locations?: string[] | undefined;
                people?: string[] | undefined;
                events?: string[] | undefined;
                emotions?: string[] | undefined;
                missingEntities?: string[] | undefined;
            } | undefined;
            sentiment?: "positive" | "neutral" | "negative" | "mixed" | undefined;
            followupTopics?: string[] | undefined;
        }[];
        extractedFacts: {
            confidence: number;
            fact: string;
            factId: string;
            sourceAnswerIds: string[];
            verified: boolean;
            category?: string | undefined;
            era?: string | undefined;
        }[];
        completedAt?: string | undefined;
    }, {
        status: "active" | "paused" | "completed";
        interviewId: string;
        userId: string;
        startedAt: string;
        currentPhase: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing";
        metadata: {
            completedPhases: ("warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing")[];
            userBirthYear?: number | undefined;
            userBirthplace?: string | undefined;
            userOccupation?: string | undefined;
            interviewGoal?: string | undefined;
            targetLength?: number | undefined;
        };
        questions: {
            questionId: string;
            phase: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing";
            question: string;
            questionType: "open" | "specific" | "followup" | "clarification";
            priority: "high" | "medium" | "low";
            answered: boolean;
            targetEntities?: string[] | undefined;
            askedAt?: string | undefined;
        }[];
        answers: {
            questionId: string;
            answerId: string;
            answer: string;
            answeredAt: string;
            needsFollowup: boolean;
            extractedEntities?: {
                years?: number[] | undefined;
                locations?: string[] | undefined;
                people?: string[] | undefined;
                events?: string[] | undefined;
                emotions?: string[] | undefined;
                missingEntities?: string[] | undefined;
            } | undefined;
            sentiment?: "positive" | "neutral" | "negative" | "mixed" | undefined;
            followupTopics?: string[] | undefined;
        }[];
        extractedFacts: {
            confidence: number;
            fact: string;
            factId: string;
            sourceAnswerIds: string[];
            category?: string | undefined;
            era?: string | undefined;
            verified?: boolean | undefined;
        }[];
        completedAt?: string | undefined;
    }>;
    nextQuestion: z.ZodOptional<z.ZodObject<{
        questionId: z.ZodString;
        phase: z.ZodEnum<["warmup", "childhood", "education", "career", "family", "milestones", "reflections", "closing"]>;
        question: z.ZodString;
        questionType: z.ZodEnum<["open", "specific", "followup", "clarification"]>;
        targetEntities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        priority: z.ZodEnum<["high", "medium", "low"]>;
        askedAt: z.ZodOptional<z.ZodString>;
        answered: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        questionId: string;
        phase: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing";
        question: string;
        questionType: "open" | "specific" | "followup" | "clarification";
        priority: "high" | "medium" | "low";
        answered: boolean;
        targetEntities?: string[] | undefined;
        askedAt?: string | undefined;
    }, {
        questionId: string;
        phase: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing";
        question: string;
        questionType: "open" | "specific" | "followup" | "clarification";
        priority: "high" | "medium" | "low";
        answered: boolean;
        targetEntities?: string[] | undefined;
        askedAt?: string | undefined;
    }>>;
    suggestedQuestions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        questionId: z.ZodString;
        phase: z.ZodEnum<["warmup", "childhood", "education", "career", "family", "milestones", "reflections", "closing"]>;
        question: z.ZodString;
        questionType: z.ZodEnum<["open", "specific", "followup", "clarification"]>;
        targetEntities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        priority: z.ZodEnum<["high", "medium", "low"]>;
        askedAt: z.ZodOptional<z.ZodString>;
        answered: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        questionId: string;
        phase: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing";
        question: string;
        questionType: "open" | "specific" | "followup" | "clarification";
        priority: "high" | "medium" | "low";
        answered: boolean;
        targetEntities?: string[] | undefined;
        askedAt?: string | undefined;
    }, {
        questionId: string;
        phase: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing";
        question: string;
        questionType: "open" | "specific" | "followup" | "clarification";
        priority: "high" | "medium" | "low";
        answered: boolean;
        targetEntities?: string[] | undefined;
        askedAt?: string | undefined;
    }>, "many">>;
    summary: z.ZodOptional<z.ZodString>;
    needsClarification: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    interviewState: {
        status: "active" | "paused" | "completed";
        interviewId: string;
        userId: string;
        startedAt: string;
        currentPhase: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing";
        metadata: {
            completedPhases: ("warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing")[];
            userBirthYear?: number | undefined;
            userBirthplace?: string | undefined;
            userOccupation?: string | undefined;
            interviewGoal?: string | undefined;
            targetLength?: number | undefined;
        };
        questions: {
            questionId: string;
            phase: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing";
            question: string;
            questionType: "open" | "specific" | "followup" | "clarification";
            priority: "high" | "medium" | "low";
            answered: boolean;
            targetEntities?: string[] | undefined;
            askedAt?: string | undefined;
        }[];
        answers: {
            questionId: string;
            answerId: string;
            answer: string;
            answeredAt: string;
            needsFollowup: boolean;
            extractedEntities?: {
                years?: number[] | undefined;
                locations?: string[] | undefined;
                people?: string[] | undefined;
                events?: string[] | undefined;
                emotions?: string[] | undefined;
                missingEntities?: string[] | undefined;
            } | undefined;
            sentiment?: "positive" | "neutral" | "negative" | "mixed" | undefined;
            followupTopics?: string[] | undefined;
        }[];
        extractedFacts: {
            confidence: number;
            fact: string;
            factId: string;
            sourceAnswerIds: string[];
            verified: boolean;
            category?: string | undefined;
            era?: string | undefined;
        }[];
        completedAt?: string | undefined;
    };
    summary?: string | undefined;
    nextQuestion?: {
        questionId: string;
        phase: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing";
        question: string;
        questionType: "open" | "specific" | "followup" | "clarification";
        priority: "high" | "medium" | "low";
        answered: boolean;
        targetEntities?: string[] | undefined;
        askedAt?: string | undefined;
    } | undefined;
    suggestedQuestions?: {
        questionId: string;
        phase: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing";
        question: string;
        questionType: "open" | "specific" | "followup" | "clarification";
        priority: "high" | "medium" | "low";
        answered: boolean;
        targetEntities?: string[] | undefined;
        askedAt?: string | undefined;
    }[] | undefined;
    needsClarification?: string[] | undefined;
}, {
    interviewState: {
        status: "active" | "paused" | "completed";
        interviewId: string;
        userId: string;
        startedAt: string;
        currentPhase: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing";
        metadata: {
            completedPhases: ("warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing")[];
            userBirthYear?: number | undefined;
            userBirthplace?: string | undefined;
            userOccupation?: string | undefined;
            interviewGoal?: string | undefined;
            targetLength?: number | undefined;
        };
        questions: {
            questionId: string;
            phase: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing";
            question: string;
            questionType: "open" | "specific" | "followup" | "clarification";
            priority: "high" | "medium" | "low";
            answered: boolean;
            targetEntities?: string[] | undefined;
            askedAt?: string | undefined;
        }[];
        answers: {
            questionId: string;
            answerId: string;
            answer: string;
            answeredAt: string;
            needsFollowup: boolean;
            extractedEntities?: {
                years?: number[] | undefined;
                locations?: string[] | undefined;
                people?: string[] | undefined;
                events?: string[] | undefined;
                emotions?: string[] | undefined;
                missingEntities?: string[] | undefined;
            } | undefined;
            sentiment?: "positive" | "neutral" | "negative" | "mixed" | undefined;
            followupTopics?: string[] | undefined;
        }[];
        extractedFacts: {
            confidence: number;
            fact: string;
            factId: string;
            sourceAnswerIds: string[];
            category?: string | undefined;
            era?: string | undefined;
            verified?: boolean | undefined;
        }[];
        completedAt?: string | undefined;
    };
    summary?: string | undefined;
    nextQuestion?: {
        questionId: string;
        phase: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing";
        question: string;
        questionType: "open" | "specific" | "followup" | "clarification";
        priority: "high" | "medium" | "low";
        answered: boolean;
        targetEntities?: string[] | undefined;
        askedAt?: string | undefined;
    } | undefined;
    suggestedQuestions?: {
        questionId: string;
        phase: "warmup" | "childhood" | "education" | "career" | "family" | "milestones" | "reflections" | "closing";
        question: string;
        questionType: "open" | "specific" | "followup" | "clarification";
        priority: "high" | "medium" | "low";
        answered: boolean;
        targetEntities?: string[] | undefined;
        askedAt?: string | undefined;
    }[] | undefined;
    needsClarification?: string[] | undefined;
}>;
/**
 * Question generation options schema
 */
export declare const questionGenerationOptionsSchema: z.ZodObject<{
    count: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    includeFollowups: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    focusTopics: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    difficulty: z.ZodDefault<z.ZodOptional<z.ZodEnum<["easy", "medium", "deep"]>>>;
}, "strip", z.ZodTypeAny, {
    count: number;
    includeFollowups: boolean;
    difficulty: "medium" | "easy" | "deep";
    focusTopics?: string[] | undefined;
}, {
    count?: number | undefined;
    includeFollowups?: boolean | undefined;
    focusTopics?: string[] | undefined;
    difficulty?: "medium" | "easy" | "deep" | undefined;
}>;
/**
 * Interview answer submission schema
 */
export declare const interviewAnswerSubmissionSchema: z.ZodObject<{
    interviewId: z.ZodString;
    questionId: z.ZodString;
    answer: z.ZodString;
    answeredAt: z.ZodOptional<z.ZodString>;
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    interviewId: string;
    userId: string;
    questionId: string;
    answer: string;
    answeredAt?: string | undefined;
}, {
    interviewId: string;
    userId: string;
    questionId: string;
    answer: string;
    answeredAt?: string | undefined;
}>;
//# sourceMappingURL=interview.schemas.d.ts.map