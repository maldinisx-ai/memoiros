/**
 * Interviewer Agent
 *
 * Guides users through storytelling by asking targeted questions
 * and extracting structured facts from their answers
 */

import { z } from "zod";
import type { AgentContext } from "./base.js";
import { BaseAgent } from "./base.js";
import type {
  InterviewRequest,
  InterviewResponse,
  InterviewState,
  InterviewQuestion,
  InterviewAnswer,
  InterviewPhase,
  ExtractedEntities,
  ExtractedFact,
  QuestionGenerationOptions,
} from "../models/interview.js";
import { MemoirOSStorage } from "../storage/database.js";
import { join } from "node:path";
import { createContextManager, type ContextManager } from "../utils/context-manager.js";

/**
 * Zod schema for LLM question generation
 */
const QuestionGenerationSchema = z.object({
  questions: z.array(z.object({
    question: z.string().min(10),
    questionType: z.enum(["open", "specific", "followup", "clarification"]),
    targetEntities: z.array(z.string()).optional(),
    priority: z.enum(["high", "medium", "low"]),
    rationale: z.string().optional(),  // Why this question is important
  })),
  suggestedTopics: z.array(z.string()).optional(),
  followupAreas: z.array(z.string()).optional(),
});

/**
 * Zod schema for entity extraction
 */
const EntityExtractionSchema = z.object({
  years: z.array(z.number()).optional(),
  locations: z.array(z.string()).optional(),
  people: z.array(z.string()).optional(),
  events: z.array(z.string()).optional(),
  emotions: z.array(z.string()).optional(),
  missingEntities: z.array(z.string()).optional(),  // Entities that would be useful to ask about
});

/**
 * Interviewer Agent
 */
export class InterviewerAgent extends BaseAgent {
  private readonly storage: MemoirOSStorage | null;
  private readonly contextManagers: Map<string, ContextManager> = new Map();

  // Phase-specific question templates
  private readonly phaseTemplates: Record<InterviewPhase, QuestionTemplate> = {
    warmup: {
      goals: ["建立信任", "了解基本信息", "让用户放松"],
      sampleTopics: ["童年记忆", "家乡", "家庭"],
      questionCount: 3,
    },
    childhood: {
      goals: ["收集童年故事", "了解成长环境", "记录早期记忆"],
      sampleTopics: ["小学", "玩伴", "童年游戏", "第一次记忆"],
      questionCount: 5,
    },
    education: {
      goals: ["了解学习经历", "重要老师", "学校生活"],
      sampleTopics: ["最喜欢的科目", "校园生活", "同学", "升学"],
      questionCount: 4,
    },
    career: {
      goals: ["了解职业发展", "工作经历", "成就"],
      sampleTopics: ["第一份工作", "职业选择", "重要项目", "同事"],
      questionCount: 5,
    },
    family: {
      goals: ["了解家庭关系", "重要家庭事件", "家族故事"],
      sampleTopics: ["父母", "兄弟姐妹", "婚姻", "子女"],
      questionCount: 4,
    },
    milestones: {
      goals: ["记录人生大事", "转折点", "重要决定"],
      sampleTopics: ["搬家", "重大变故", "成功时刻", "挑战"],
      questionCount: 5,
    },
    reflections: {
      goals: ["回顾人生", "总结经验", "传承智慧"],
      sampleTopics: ["最自豪的事", "最后悔的事", "人生感悟"],
      questionCount: 3,
    },
    closing: {
      goals: ["收尾", "补充遗漏", "感谢"],
      sampleTopics: ["还有什么想说的", "对后代的话"],
      questionCount: 2,
    },
  };

  constructor(ctx: AgentContext, storage?: MemoirOSStorage | null) {
    super(ctx);
    this.storage = storage ?? null;
  }

  get name(): string {
    return "interviewer";
  }

  /**
   * Clean LLM response by removing markdown code blocks
   */
  private cleanJSONResponse(content: string): string {
    // Remove markdown code blocks (```json, ```, etc.)
    let cleaned = content.replace(/```(?:json)?\s*/g, "").trim();
    // Remove trailing ``` if present
    cleaned = cleaned.replace(/```\s*$/g, "").trim();
    return cleaned;
  }

  /**
   * Start or resume an interview
   */
  async startInterview(request: InterviewRequest): Promise<InterviewResponse> {
    this.log?.info(`[Interviewer] Starting interview for user: ${request.userId}`);

    // Load or create interview state
    const interviewState = await this.getOrCreateInterviewState(request);

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
    const extractedEntities = await this.extractEntities(answer);
    this.log?.info(`[Interviewer] Extracted entities:`, JSON.stringify(extractedEntities, null, 2));

    // Create answer record
    const answerRecord: InterviewAnswer = {
      answerId: this.generateId("ans"),
      questionId,
      answer,
      answeredAt: new Date().toISOString(),
      extractedEntities,
      sentiment: await this.detectSentiment(answer),
      needsFollowup: this.shouldFollowUp(extractedEntities),
      followupTopics: extractedEntities.missingEntities,
    };

    // Add to context manager for sliding window
    const contextManager = this.getContextManager(interviewId);
    contextManager.addMessage({ role: "user", content: answer });

    // Update interview state
    const updatedState = await this.updateInterviewState(interviewState, answerRecord);

    // Extract facts from answer
    const facts = await this.extractFacts(answer, extractedEntities);
    this.log?.info(`[Interviewer] Extracted ${facts.length} facts`);

    // Generate follow-up questions
    const followupQuestions = await this.generateNextQuestion(updatedState, {
      count: options?.count ?? 2,
      includeFollowups: true,
      focusTopics: extractedEntities.missingEntities,
    });

    return {
      interviewState: updatedState,
      nextQuestion: followupQuestions[0],
      suggestedQuestions: followupQuestions.slice(1),
      summary: this.generateSessionSummary(updatedState),
      needsClarification: extractedEntities.missingEntities,
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
      summary: `进入${this.getPhaseDisplayName(nextPhase)}阶段`,
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
    const contextManager = this.getContextManager(state.interviewId);

    // Build system prompt
    const systemPrompt = this.buildQuestionPrompt(state, template, options);

    // Build messages with context manager (includes summaries + recent messages)
    const llmMessages = contextManager.buildLLMMessages(systemPrompt);

    try {
      this.log?.info(`[Interviewer] Calling LLM for question generation...`);
      const response = await this.chat(llmMessages, { temperature: 0.7 });

      this.log?.info(`[Interviewer] LLM response: ${response.content.slice(200)}...`);
      const cleanedContent = this.cleanJSONResponse(response.content);
      const parsed = QuestionGenerationSchema.parse(JSON.parse(cleanedContent));
      this.log?.info(`[Interviewer] Parsed ${parsed.questions.length} questions`);

      // Log context statistics
      const stats = contextManager.getStats();
      this.log?.info(`[Interviewer] Context stats: ${JSON.stringify(stats)}`);

      // Add the user message to context (for next round)
      contextManager.addMessage({ role: "user", content: "请根据当前情况生成合适的采访问题。" });

      return parsed.questions.map((q, i) => ({
        questionId: this.generateId("q"),
        phase: state.currentPhase,
        question: q.question,
        questionType: q.questionType,
        targetEntities: q.targetEntities,
        priority: q.priority,
        answered: false,
      }));
    } catch (error) {
      this.log?.error(`[Interviewer] Question generation failed: ${error}`);

      // Fallback to template questions
      return this.getFallbackQuestions(state, options.count ?? 1);
    }
  }

  /**
   * Get or create context manager for an interview
   */
  private getContextManager(interviewId: string): ContextManager {
    let manager = this.contextManagers.get(interviewId);
    if (!manager) {
      manager = createContextManager({
        windowSize: 10, // Keep last 10 messages
        summaryThreshold: 15, // Start summarizing after 15 messages
        maxSummaries: 5, // Keep last 5 summaries
      });
      this.contextManagers.set(interviewId, manager);
    }
    return manager;
  }

  /**
   * Build prompt for question generation with sliding window context
   */
  private buildQuestionPrompt(
    state: InterviewState,
    template: QuestionTemplate,
    options: QuestionGenerationOptions
  ): string {
    const contextManager = this.getContextManager(state.interviewId);

    // Build previous answers context
    const previousAnswers = state.answers.slice(-3);  // Last 3 answers for context

    return `你是一位专业的回忆录采访者，正在引导用户讲述他们的人生故事。

当前阶段：${this.getPhaseDisplayName(state.currentPhase)}
阶段目标：${template.goals.join("、")}
建议话题：${template.sampleTopics.join("、")}

用户信息：
${state.metadata.userBirthYear ? `- 出生年份：${state.metadata.userBirthYear}` : ""}
${state.metadata.userBirthplace ? `- 出生地：${state.metadata.userBirthplace}` : ""}

${previousAnswers.length > 0 ? `
最近回答：
${previousAnswers.map(a => `- Q: ${state.questions.find(q => q.questionId === a.questionId)?.question}\n  A: ${a.answer.slice(100)}`).join("\n")}
` : ""}

${options.focusTopics ? `
需要特别关注的话题：${options.focusTopics.join("、")}
` : ""}

请生成 ${options.count ?? 1} 个采访问题。

要求：
1. 问题要自然、温暖、有引导性
2. 避免是非题，多用开放式问题
3. 根据用户之前的回答，追问细节
4. 适当引导用户提供时间、地点、情感等信息

输出格式（JSON）：
{
  "questions": [
    {
      "question": "具体问题内容",
      "questionType": "open|specific|followup|clarification",
      "targetEntities": ["year", "location", "emotion", "person"],
      "priority": "high|medium|low",
      "rationale": "为什么问这个问题"
    }
  ],
  "suggestedTopics": ["建议后续探讨的话题"],
  "followupAreas": ["需要深入挖掘的领域"]
}`;
  }

  /**
   * Extract entities from user answer
   */
  private async extractEntities(answer: string): Promise<ExtractedEntities> {
    const systemPrompt = `你是一个信息提取专家。请从用户的回答中提取关键实体。

输出格式（JSON）：
{
  "years": [1980, 1995],
  "locations": ["北京", "家乡"],
  "people": ["父亲", "老师"],
  "events": ["高考", "结婚"],
  "emotions": ["开心", "紧张"],
  "missingEntities": ["year", "location"]  // 缺失但有用的实体类型
}`;

    try {
      const response = await this.chat([
        { role: "system", content: systemPrompt },
        { role: "user", content: `从以下回答中提取实体：\n\n${answer}` }
      ], { temperature: 0.3 });

      const cleanedContent = this.cleanJSONResponse(response.content);
      return EntityExtractionSchema.parse(JSON.parse(cleanedContent));
    } catch (error) {
      this.log?.error(`[Interviewer] Entity extraction failed: ${error}`);
      return {};
    }
  }

  /**
   * Detect sentiment in answer
   */
  private async detectSentiment(answer: string): Promise<"positive" | "neutral" | "negative" | "mixed"> {
    try {
      const response = await this.chat([
        { role: "system", content: "判断这段话的情感倾向，只回答：positive/neutral/negative/mixed" },
        { role: "user", content: answer }
      ], { temperature: 0.1 });

      const sentiment = response.content.trim().toLowerCase();
      if (["positive", "neutral", "negative", "mixed"].includes(sentiment)) {
        return sentiment as "positive" | "neutral" | "negative" | "mixed";
      }
    } catch (error) {
      this.log?.error(`[Interviewer] Sentiment detection failed: ${error}`);
    }
    return "neutral";
  }

  /**
   * Extract facts from answer
   */
  private async extractFacts(
    answer: string,
    entities: ExtractedEntities
  ): Promise<ReadonlyArray<ExtractedFact>> {
    const systemPrompt = `你是一个事实提取专家。请从用户的回答中提取客观事实。

事实应该：
1. 是客观陈述，不是观点
2. 包含具体的时间、地点或人物
3. 可以独立验证

输出格式（JSON）：
{
  "facts": [
    {
      "fact": "具体事实陈述",
      "confidence": 0.9,
      "era": "1980s",
      "category": "childhood"
    }
  ]
}`;

    try {
      const response = await this.chat([
        { role: "system", content: systemPrompt },
        { role: "user", content: `从以下回答中提取事实：\n\n${answer}` }
      ], { temperature: 0.3 });

      const cleanedContent = this.cleanJSONResponse(response.content);
      const parsed = JSON.parse(cleanedContent);
      return (parsed.facts || []).map((f: unknown) => ({
        factId: this.generateId("fact"),
        ...(f as Omit<ExtractedFact, "factId" | "sourceAnswerIds">),
        sourceAnswerIds: [],
      }));
    } catch (error) {
      this.log?.error(`[Interviewer] Fact extraction failed: ${error}`);
      return [];
    }
  }

  /**
   * Determine if follow-up is needed
   */
  private shouldFollowUp(entities: ExtractedEntities): boolean {
    return (
      !entities.years ||
      entities.years.length === 0 ||
      !entities.locations ||
      entities.locations.length === 0 ||
      (entities.missingEntities !== undefined && entities.missingEntities.length > 0)
    );
  }

  /**
   * Get interview state (create if new)
   */
  private async getOrCreateInterviewState(request: InterviewRequest): Promise<InterviewState> {
    if (request.interviewId) {
      return this.loadInterviewState(request.interviewId);
    }

    // Create new interview
    const newState: InterviewState = {
      interviewId: this.generateId("int"),
      userId: request.userId,
      status: "active",
      startedAt: new Date().toISOString(),
      currentPhase: request.phase ?? "warmup",
      questions: [],
      answers: [],
      extractedFacts: [],
      metadata: {
        completedPhases: [],
      },
    };

    await this.saveInterviewState(newState);
    return newState;
  }

  /**
   * Load interview state from storage
   */
  private async loadInterviewState(interviewId: string): Promise<InterviewState> {
    if (!this.storage) {
      // Return minimal state for in-memory interviews
      return {
        interviewId,
        userId: "unknown",
        status: "active",
        startedAt: new Date().toISOString(),
        currentPhase: "warmup",
        questions: [],
        answers: [],
        extractedFacts: [],
        metadata: { completedPhases: [] },
      };
    }

    const interview = this.storage.loadInterview(interviewId);

    if (!interview) {
      // Return minimal state for new interview
      return {
        interviewId,
        userId: "unknown",
        status: "active",
        startedAt: new Date().toISOString(),
        currentPhase: "warmup",
        questions: [],
        answers: [],
        extractedFacts: [],
        metadata: { completedPhases: [] },
      };
    }

    // Load questions and answers
    const answers = this.storage.loadAnswers(interviewId);

    return {
      interviewId: interview.interviewId,
      userId: interview.userId,
      status: interview.status,
      startedAt: interview.startedAt,
      completedAt: interview.completedAt,
      currentPhase: interview.currentPhase as InterviewPhase,
      questions: [], // TODO: Load questions from storage
      answers: answers.map(a => ({
        answerId: a.answerId,
        questionId: a.questionId,
        answer: a.answer,
        answeredAt: a.answeredAt,
        extractedEntities: a.extractedEntities as ExtractedEntities | undefined,
        sentiment: undefined,
        needsFollowup: false,
      })),
      extractedFacts: [],
      metadata: {
        completedPhases: Array.isArray(interview.metadata?.completedPhases)
          ? interview.metadata.completedPhases as InterviewState["metadata"]["completedPhases"]
          : [],
      },
    };
  }

  /**
   * Update interview state with new answer
   */
  private async updateInterviewState(
    state: InterviewState,
    answer: InterviewAnswer
  ): Promise<InterviewState> {
    const updated: InterviewState = {
      ...state,
      answers: [...state.answers, answer],
      questions: state.questions.map(q =>
        q.questionId === answer.questionId
          ? { ...q, answered: true, askedAt: answer.answeredAt }
          : q
      ),
    };

    await this.saveInterviewState(updated);
    return updated;
  }

  /**
   * Save interview state to storage
   */
  private async saveInterviewState(state: InterviewState): Promise<void> {
    if (!this.storage) {
      this.log?.info(`[Interviewer] Storage not available, skipping save for: ${state.interviewId}`);
      return;
    }

    this.storage.saveInterview({
      interviewId: state.interviewId,
      userId: state.userId,
      status: state.status,
      startedAt: state.startedAt,
      completedAt: state.completedAt,
      currentPhase: state.currentPhase,
      metadata: {
        userBirthYear: state.metadata.userBirthYear,
        userBirthplace: state.metadata.userBirthplace,
        userOccupation: state.metadata.userOccupation,
        interviewGoal: state.metadata.interviewGoal,
        targetLength: state.metadata.targetLength,
        completedPhases: state.metadata.completedPhases,
      },
    });

    // Save answers
    for (const answer of state.answers) {
      this.storage.saveAnswer({
        answerId: answer.answerId,
        questionId: answer.questionId,
        interviewId: state.interviewId,
        answer: answer.answer,
        answeredAt: answer.answeredAt,
        extractedEntities: answer.extractedEntities as Record<string, unknown> | undefined,
        sentiment: answer.sentiment,
        needsFollowup: answer.needsFollowup,
        followupTopics: answer.followupTopics ? [...answer.followupTopics] : undefined,
      });
    }
  }

  /**
   * Generate session summary
   */
  private generateSessionSummary(state: InterviewState): string {
    const phase = this.getPhaseDisplayName(state.currentPhase);
    const answerCount = state.answers.length;
    const factCount = state.extractedFacts.length;

    return `当前阶段：${phase}，已回答 ${answerCount} 个问题，提取 ${factCount} 个事实`;
  }

  /**
   * Get fallback questions when LLM fails
   */
  private getFallbackQuestions(state: InterviewState, count: number): ReadonlyArray<InterviewQuestion> {
    const fallbacks: Record<InterviewPhase, ReadonlyArray<string>> = {
      warmup: [
        "您能简单介绍一下自己吗？比如出生在哪里，哪一年出生的？",
        "您最早的记忆是什么？",
        "小时候的家是什么样子的？",
      ],
      childhood: [
        "您小时候最喜欢玩什么游戏？",
        "和您一起长大的小伙伴，您还记得谁？",
        "小学时有什么印象深刻的老师吗？",
      ],
      education: [
        "您在学校最喜欢哪门功课？",
        "上学时发生过什么有趣的事？",
        "您是怎么选择自己专业的？",
      ],
      career: [
        "您的第一份工作是什么？",
        "工作中遇到过什么挑战？",
        "您最自豪的工作成就是什么？",
      ],
      family: [
        "您能说说您的父母吗？",
        "您是怎么认识您的配偶的？",
        "家里有什么特别的传统？",
      ],
      milestones: [
        "人生中最重要的转折点是什么？",
        "最困难的时候是怎么度过的？",
        '有什么时刻让您觉得"一切都值得"？',
      ],
      reflections: [
        "如果重来一次，您会做什么不同的选择？",
        "您最想传承给下一代的是什么？",
        "回首人生，您有什么感悟？",
      ],
      closing: [
        "还有什么想补充的吗？",
        "您想对后代说些什么？",
      ],
    };

    const questions = fallbacks[state.currentPhase] ?? fallbacks.warmup;

    return questions.slice(0, count).map((question, i) => ({
      questionId: this.generateId("q"),
      phase: state.currentPhase,
      question,
      questionType: "open" as const,
      priority: "medium" as const,
      answered: false,
    }));
  }

  /**
   * Get display name for phase
   */
  private getPhaseDisplayName(phase: InterviewPhase): string {
    const names: Record<InterviewPhase, string> = {
      warmup: "热身",
      childhood: "童年",
      education: "教育",
      career: "职业",
      family: "家庭",
      milestones: "里程碑",
      reflections: "回顾",
      closing: "收尾",
    };
    return names[phase] ?? phase;
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

/**
 * Question template for each phase
 */
interface QuestionTemplate {
  readonly goals: ReadonlyArray<string>;
  readonly sampleTopics: ReadonlyArray<string>;
  readonly questionCount: number;
}
