/**
 * Interviewer Agent - Question Builder
 *
 * Question generation logic and prompt building
 */

import type { AgentContext } from "../base.js";
import type {
  InterviewState,
  InterviewQuestion,
  InterviewPhase,
  QuestionGenerationOptions,
} from "../../models/interview.js";
import type { QuestionTemplate } from "./types.js";
import { QuestionGenerationSchema } from "./types.js";
import { cleanJSONResponse, getPhaseDisplayName } from "./utils.js";
import type { ContextManager } from "../../utils/context-manager.js";

/**
 * Build prompt for question generation with sliding window context
 */
export function buildQuestionPrompt(
  state: InterviewState,
  template: QuestionTemplate,
  options: QuestionGenerationOptions
): string {
  // Build previous answers context
  const previousAnswers = state.answers.slice(-3);  // Last 3 answers for context

  return `你是一位专业的回忆录采访者，正在引导用户讲述他们的人生故事。

当前阶段：${getPhaseDisplayName(state.currentPhase)}
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
      "questionType": "open",
      "targetEntities": ["year", "location", "emotion", "person"],
      "priority": "high",
      "rationale": "为什么问这个问题"
    }
  ],
  "suggestedTopics": ["建议后续探讨的话题"],
  "followupAreas": ["需要深入挖掘的领域"]
}

重要：
- questionType 必须是以下四个值之一：open（开放式）、specific（具体）、followup（追问）、clarification（澄清）
- priority 必须是以下三个值之一：high、medium、low
- 每个字段只使用一个值，不要用 | 符号组合多个值`;
}

/**
 * Generate next question(s) with sliding window context and retry mechanism
 */
export async function generateNextQuestion(
  ctx: AgentContext,
  state: InterviewState,
  template: QuestionTemplate,
  contextManager: ContextManager,
  options: QuestionGenerationOptions,
  generateId: (prefix: string, useUUID?: boolean) => string,
  log?: any,
  retryCount: number = 0
): Promise<ReadonlyArray<InterviewQuestion>> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 1000;

  // Build system prompt
  const systemPrompt = buildQuestionPrompt(state, template, options);

  // Build messages with context manager (includes summaries + recent messages)
  const llmMessages = contextManager.buildLLMMessages(systemPrompt);

  try {
    // Increase temperature on retries to get more diverse responses
    const temperature = 0.7 + (retryCount * 0.1);

    log?.info(`[Interviewer] Calling LLM for question generation... (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
    const response = await ctx.client.chat(llmMessages, { temperature });

    // Debug: log raw LLM response (first 500 chars)
    console.log('[DEBUG] Question generation raw response:', response.content.substring(0, 500));

    log?.info(`[Interviewer] LLM response: ${response.content.slice(200)}...`);
    const cleanedContent = cleanJSONResponse(response.content);

    // Try to parse JSON
    let parsed;
    try {
      parsed = QuestionGenerationSchema.parse(JSON.parse(cleanedContent));
    } catch (parseError) {
      log?.warn(`[Interviewer] JSON parse or validation failed: ${parseError}`);

      // If we have retries left, wait and retry
      if (retryCount < MAX_RETRIES) {
        log?.info(`[Interviewer] Retrying in ${RETRY_DELAY_MS}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        return generateNextQuestion(ctx, state, template, contextManager, options, generateId, log, retryCount + 1);
      }

      // No more retries, use fallback
      log?.error(`[Interviewer] Max retries reached, using fallback questions`);
      return getFallbackQuestions(state, options.count ?? 1, generateId);
    }

    log?.info(`[Interviewer] Parsed ${parsed.questions.length} questions`);

    // Filter out questions with empty or too short content
    // Schema requires min 10 characters, enforce it here as well
    const validQuestions = parsed.questions.filter((q) =>
      q.question && q.question.trim().length >= 10
    );

    if (validQuestions.length === 0) {
      log?.warn(`[Interviewer] No valid questions found in LLM response`);

      // If we have retries left, retry
      if (retryCount < MAX_RETRIES) {
        log?.info(`[Interviewer] Retrying question generation... (${retryCount + 1}/${MAX_RETRIES + 1})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        return generateNextQuestion(ctx, state, template, contextManager, options, generateId, log, retryCount + 1);
      }

      // No more retries, use fallback
      log?.error(`[Interviewer] Max retries reached, using fallback questions`);
      return getFallbackQuestions(state, options.count ?? 1, generateId);
    }

    log?.info(`[Interviewer] Using ${validQuestions.length} valid questions`);

    // Log context statistics
    const stats = contextManager.getStats();
    log?.info(`[Interviewer] Context stats: ${JSON.stringify(stats)}`);

    // Add the user message to context (for next round)
    contextManager.addMessage({ role: "user", content: "请根据当前情况生成合适的采访问题。" });

    return validQuestions.map((q, i) => ({
      questionId: generateId("q", true),
      phase: state.currentPhase,
      question: q.question,
      questionType: q.questionType,
      targetEntities: q.targetEntities,
      priority: q.priority,
      answered: false,
    }));
  } catch (error) {
    log?.error(`[Interviewer] Question generation failed: ${error}`);

    // If we have retries left, retry
    if (retryCount < MAX_RETRIES && error instanceof Error) {
      log?.info(`[Interviewer] Retrying after error: ${error.message} (${retryCount + 1}/${MAX_RETRIES + 1})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return generateNextQuestion(ctx, state, template, contextManager, options, generateId, log, retryCount + 1);
    }

    // No more retries or different error type, use fallback
    log?.error(`[Interviewer] Max retries reached or fatal error, using fallback questions`);
    return getFallbackQuestions(state, options.count ?? 1, generateId);
  }
}

/**
 * Get fallback questions when LLM fails
 *
 * Cycles through available questions to avoid repeating the same one
 */
export function getFallbackQuestions(
  state: InterviewState,
  count: number,
  generateId: (prefix: string, useUUID?: boolean) => string
): ReadonlyArray<InterviewQuestion> {
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

  const phaseQuestions = fallbacks[state.currentPhase] ?? fallbacks.warmup;

  // Find which fallback questions have already been used in this phase
  const usedFallbackQuestions = new Set<string>();
  for (const q of state.questions) {
    if (q.phase === state.currentPhase && phaseQuestions.includes(q.question)) {
      usedFallbackQuestions.add(q.question);
    }
  }

  // Select the next unused questions
  const selectedQuestions: string[] = [];
  for (const question of phaseQuestions) {
    if (selectedQuestions.length >= count) break;
    if (!usedFallbackQuestions.has(question)) {
      selectedQuestions.push(question);
      usedFallbackQuestions.add(question); // Mark as used for this batch
    }
  }

  // If all questions have been used, cycle back (start from beginning)
  if (selectedQuestions.length < count) {
    for (const question of phaseQuestions) {
      if (selectedQuestions.length >= count) break;
      selectedQuestions.push(question);
    }
  }

  return selectedQuestions.map((question) => ({
    questionId: generateId("q", true),
    phase: state.currentPhase,
    question,
    questionType: "open" as const,
    priority: "medium" as const,
    answered: false,
  }));
}
