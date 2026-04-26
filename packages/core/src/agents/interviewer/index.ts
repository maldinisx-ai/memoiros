/**
 * Interviewer Agent
 *
 * Main agent class that orchestrates all interviewer operations
 * Guides users through storytelling by asking targeted questions
 * and extracting structured facts from their answers
 */


import { BaseAgent } from "../base.js";
import type { AgentContext } from "../base.js";
import type {
  InterviewRequest,
  InterviewResponse,
  InterviewState,
  InterviewQuestion,
  InterviewAnswer,
  InterviewPhase,
  QuestionGenerationOptions,
} from "../../models/interview.js";
import type { ExtractedEntities, ExtractedFact } from "../../models/interview.js";
import { MemoirOSStorage } from "../../storage/database.js";
import { createContextManager, type ContextManager } from "../../utils/context-manager.js";

// Import from modular structure
import * as Types from "./types.js";
import * as Utils from "./utils.js";
import * as QuestionBuilder from "./question-builder.js";
import * as Extractors from "./extractors.js";
import * as StateManager from "./state-manager.js";

/**
 * Re-export types for external use
 */
export * from "./types.js";

/**
 * Interviewer Agent
 */
export class InterviewerAgent extends BaseAgent {
  private readonly storage: MemoirOSStorage | null;
  private readonly contextManagers: Map<string, ContextManager> = new Map();

  // Phase-specific question templates
  private readonly phaseTemplates: Record<InterviewPhase, Types.QuestionTemplate> = Types.PHASE_TEMPLATES;

  constructor(ctx: AgentContext, storage?: MemoirOSStorage | null) {
    super(ctx);
    this.storage = storage ?? null;
  }

  get name(): string {
    return "interviewer";
  }

  /**
   * Start or resume an interview
   */
  async startInterview(request: InterviewRequest): Promise<InterviewResponse> {
    this.log?.info(`[Interviewer] Starting interview for user: ${request.userId}`);

    // Load or create interview state
    const interviewState = await StateManager.getOrCreateInterviewState(
      request,
      (id) => this.loadInterviewState(id),
      (state) => this.saveInterviewState(state)
    );

    // Generate next question(s)
    const nextQuestion = await this.generateNextQuestion(interviewState, {
      count: 1,
      includeFollowups: false,
    });

    return {
      interviewState,
      nextQuestion: nextQuestion[0],
      summary: this.generateSessionSummary(interviewState),
    };
  }

  /**
   * Process user answer and generate follow-up
   */
  async processAnswer(
    interviewId: string,
    questionId: string,
    answer: string,
    options?: QuestionGenerationOptions
  ): Promise<InterviewResponse> {
    this.log?.info(`[Interviewer] Processing answer for question: ${questionId}`);

    // Load interview state
    const interviewState = await this.loadInterviewState(interviewId);

    // Extract entities from answer
    const extractedEntities = await Extractors.extractEntities(this.ctx, answer, this.log);
    this.log?.info(`[Interviewer] Extracted entities:`, JSON.stringify(extractedEntities, null, 2));

    // Create answer record
    const answerRecord: InterviewAnswer = {
      answerId: Utils.generateId("ans", true),
      questionId,
      answer,
      answeredAt: new Date().toISOString(),
      extractedEntities,
      sentiment: await Extractors.detectSentiment(this.ctx, answer, this.log),
      needsFollowup: Extractors.shouldFollowUp(extractedEntities),
      followupTopics: extractedEntities.missingEntities,
    };

    // Add to context manager for sliding window
    const contextManager = this.getOrInitContextManager(interviewState);
    contextManager.addMessage({ role: "user", content: answer });

    // Update interview state
    const updatedState = await StateManager.updateInterviewState(
      interviewState,
      answerRecord,
      (state) => this.saveInterviewState(state)
    );

    // Extract facts from answer
    const facts = await Extractors.extractFacts(this.ctx, answer, extractedEntities, this.log);
    this.log?.info(`[Interviewer] Extracted ${facts.length} facts`);

    // Auto-detect phase based on conversation content
    const recentAnswers = updatedState.answers.map(a => a.answer).slice(-10);
    const detectedPhase = await this.detectPhase(updatedState, recentAnswers);

    // Update phase if changed
    let finalState = updatedState;
    if (detectedPhase !== updatedState.currentPhase) {
      this.log?.info(`[Interviewer] Phase changed from ${updatedState.currentPhase} to ${detectedPhase}`);
      finalState = {
        ...updatedState,
        currentPhase: detectedPhase,
        metadata: {
          ...updatedState.metadata,
          completedPhases: [
            ...updatedState.metadata.completedPhases,
            updatedState.currentPhase
          ],
        },
      };
      await this.saveInterviewState(finalState);
    }

    // Generate follow-up questions
    const followupQuestions = await this.generateNextQuestion(finalState, {
      count: options?.count ?? 2,
      includeFollowups: true,
      focusTopics: extractedEntities.missingEntities,
    });

    const phaseChanged = detectedPhase !== interviewState.currentPhase;

    return {
      interviewState: finalState,
      nextQuestion: followupQuestions[0],
      suggestedQuestions: followupQuestions.slice(1),
      summary: this.generateSessionSummary(finalState),
      needsClarification: extractedEntities.missingEntities,
      phaseChanged, // Indicate if phase was auto-detected as changed
    };
  }

  /**
   * Move to next phase
   */
  async advancePhase(interviewId: string): Promise<InterviewResponse> {
    const interviewState = await this.loadInterviewState(interviewId);
    const phases: ReadonlyArray<InterviewPhase> = [
      "warmup", "childhood", "education", "career", "family",
      "milestones", "reflections", "closing"
    ];

    const currentIndex = phases.indexOf(interviewState.currentPhase);
    if (currentIndex === -1 || currentIndex === phases.length - 1) {
      throw new Error("Cannot advance phase: at final phase");
    }

    const nextPhase = phases[currentIndex + 1];
    this.log?.info(`[Interviewer] Advancing from ${interviewState.currentPhase} to ${nextPhase}`);

    // Update state
    const updatedState: InterviewState = {
      ...interviewState,
      currentPhase: nextPhase,
      metadata: {
        ...interviewState.metadata,
        completedPhases: [...interviewState.metadata.completedPhases, interviewState.currentPhase],
      },
    };

    await this.saveInterviewState(updatedState);

    // Generate questions for new phase
    const nextQuestions = await this.generateNextQuestion(updatedState, { count: 2 });

    return {
      interviewState: updatedState,
      nextQuestion: nextQuestions[0],
      suggestedQuestions: nextQuestions.slice(1),
      summary: `进入${Utils.getPhaseDisplayName(nextPhase)}阶段`,
    };
  }

  /**
   * Generate next question(s) with sliding window context
   */
  private async generateNextQuestion(
    state: InterviewState,
    options: QuestionGenerationOptions
  ): Promise<ReadonlyArray<InterviewQuestion>> {
    const template = this.phaseTemplates[state.currentPhase];
    const contextManager = this.getOrInitContextManager(state);

    return QuestionBuilder.generateNextQuestion(
      this.ctx,
      state,
      template,
      contextManager,
      options,
      Utils.generateId,
      this.log
    );
  }

  /**
   * Automatically detect the interview phase based on conversation content
   */
  private async detectPhase(
    state: InterviewState,
    recentAnswers: ReadonlyArray<string>
  ): Promise<InterviewPhase> {
    if (recentAnswers.length === 0) {
      return state.currentPhase;
    }

    // Create prompt for phase detection
    const phases: ReadonlyArray<InterviewPhase> = [
      "warmup", "childhood", "education", "career", "family",
      "milestones", "reflections", "closing"
    ];

    const recentConversation = recentAnswers.slice(-5).join("\n\n");

    const prompt = `你是一个回忆录采访助手。请根据用户的回答判断当前采访处于哪个阶段。

阶段定义：
- warmup（热身）：自我介绍、基本信息、打破僵局
- childhood（童年）：小时候的回忆、成长经历、童年玩伴
- education（教育）：求学经历、校园生活、老师同学
- career（职业）：工作经历、职业发展、职场故事
- family（家庭）：家庭成员、家庭关系、家庭生活
- milestones（里程碑）：重要的人生节点、成就、转折点
- reflections（回顾）：人生感悟、反思、心得体会
- closing（收尾）：补充遗漏、总结、结束语

最近5次用户的回答：
${recentConversation}

请只返回一个阶段名称（英文），不要返回任何其他内容。当前阶段是：`;

    try {
      const response = await this.ctx.client.chat([
        { role: "user", content: prompt }
      ]);

      const detectedPhase = response.content.trim().toLowerCase();

      // Validate that the detected phase is one of the valid phases
      if (phases.includes(detectedPhase as InterviewPhase)) {
        this.log?.info(`[Interviewer] Phase detected: ${detectedPhase}`);
        return detectedPhase as InterviewPhase;
      }

      this.log?.warn(`[Interviewer] Invalid phase detected: ${detectedPhase}, keeping current phase`);
      return state.currentPhase;
    } catch (error) {
      this.log?.error(`[Interviewer] Failed to detect phase:`, error);
      return state.currentPhase;
    }
  }

  /**
   * Get or create context manager for an interview
   * Restores historical context from interview state if provided
   */
  private getOrInitContextManager(state: InterviewState): ContextManager {
    let manager = this.contextManagers.get(state.interviewId);
    if (!manager) {
      this.log?.info(`[Interviewer] Creating new ContextManager for ${state.interviewId}`);
      manager = createContextManager({
        windowSize: 10, // Keep last 10 messages
        summaryThreshold: 15, // Start summarizing after 15 messages
        maxSummaries: 5, // Keep last 5 summaries
      });
      this.contextManagers.set(state.interviewId, manager);

      // Restore historical context from existing questions and answers
      this.restoreContextFromState(manager, state);
    } else {
      this.log?.info(`[Interviewer] Reusing existing ContextManager for ${state.interviewId}`);
    }
    return manager;
  }

  /**
   * Restore conversation history from interview state into context manager
   */
  private restoreContextFromState(
    manager: ContextManager,
    state: InterviewState
  ): void {
    // Build message history from questions and answers
    // Only restore recent history to avoid overwhelming the context
    const recentPairs = this.getRecentQAPairs(state.questions, state.answers, 20);

    this.log?.info(`[Interviewer] Restoring ${recentPairs.length} Q&A pairs to context`);

    for (const { question, answer } of recentPairs) {
      if (question) {
        manager.addMessage({ role: "assistant", content: question });
      }
      if (answer) {
        manager.addMessage({ role: "user", content: answer });
      }
    }

    this.log?.info(`[Interviewer] Context restored. Total messages in context: ${manager.getContext().totalMessageCount}`);
  }

  /**
   * Get recent question-answer pairs from interview state
   */
  private getRecentQAPairs(
    questions: ReadonlyArray<InterviewQuestion>,
    answers: ReadonlyArray<InterviewAnswer>,
    limit: number
  ): ReadonlyArray<{ question?: string; answer?: string }> {
    // Create a map of questionId -> answer
    const answerMap = new Map(answers.map(a => [a.questionId, a]));

    // Get recent pairs
    const pairs: Array<{ question?: string; answer?: string }> = [];

    for (const question of questions) {
      const answer = answerMap.get(question.questionId);
      if (answer) {
        pairs.push({
          question: question.question,
          answer: answer.answer,
        });
      }
    }

    return pairs.slice(-limit);
  }

  /**
   * Load interview state from storage
   */
  private async loadInterviewState(interviewId: string): Promise<InterviewState> {
    return StateManager.loadInterviewState(interviewId, this.storage);
  }

  /**
   * Save interview state to storage
   */
  private async saveInterviewState(state: InterviewState): Promise<void> {
    return StateManager.saveInterviewState(state, this.storage, this.log);
  }

  /**
   * Generate session summary
   */
  private generateSessionSummary(state: InterviewState): string {
    const phase = Utils.getPhaseDisplayName(state.currentPhase);
    const answerCount = state.answers.length;
    const factCount = state.extractedFacts.length;

    return `当前阶段：${phase}，已回答 ${answerCount} 个问题，提取 ${factCount} 个事实`;
  }
}
