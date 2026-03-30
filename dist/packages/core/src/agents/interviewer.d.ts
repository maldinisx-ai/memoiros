/**
 * Interviewer Agent
 *
 * Guides users through storytelling by asking targeted questions
 * and extracting structured facts from their answers
 */
import type { AgentContext } from "./base.js";
import { BaseAgent } from "./base.js";
import type { InterviewRequest, InterviewResponse, QuestionGenerationOptions } from "../models/interview.js";
import { MemoirOSStorage } from "../storage/database.js";
/**
 * Interviewer Agent
 */
export declare class InterviewerAgent extends BaseAgent {
    private readonly storage;
    private readonly contextManagers;
    private readonly phaseTemplates;
    constructor(ctx: AgentContext, storage?: MemoirOSStorage | null);
    get name(): string;
    /**
     * Clean LLM response by removing markdown code blocks
     */
    private cleanJSONResponse;
    /**
     * Start or resume an interview
     */
    startInterview(request: InterviewRequest): Promise<InterviewResponse>;
    /**
     * Process user answer and generate follow-up
     */
    processAnswer(interviewId: string, questionId: string, answer: string, options?: QuestionGenerationOptions): Promise<InterviewResponse>;
    /**
     * Move to next phase
     */
    advancePhase(interviewId: string): Promise<InterviewResponse>;
    /**
     * Generate next question(s) with sliding window context
     */
    private generateNextQuestion;
    /**
     * Get or create context manager for an interview
     */
    private getContextManager;
    /**
     * Build prompt for question generation with sliding window context
     */
    private buildQuestionPrompt;
    /**
     * Extract entities from user answer
     */
    private extractEntities;
    /**
     * Detect sentiment in answer
     */
    private detectSentiment;
    /**
     * Extract facts from answer
     */
    private extractFacts;
    /**
     * Determine if follow-up is needed
     */
    private shouldFollowUp;
    /**
     * Get interview state (create if new)
     */
    private getOrCreateInterviewState;
    /**
     * Load interview state from storage
     */
    private loadInterviewState;
    /**
     * Update interview state with new answer
     */
    private updateInterviewState;
    /**
     * Save interview state to storage
     */
    private saveInterviewState;
    /**
     * Generate session summary
     */
    private generateSessionSummary;
    /**
     * Get fallback questions when LLM fails
     */
    private getFallbackQuestions;
    /**
     * Get display name for phase
     */
    private getPhaseDisplayName;
    /**
     * Generate unique ID
     */
    private generateId;
}
//# sourceMappingURL=interviewer.d.ts.map