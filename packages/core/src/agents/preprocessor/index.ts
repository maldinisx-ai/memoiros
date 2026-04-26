/**
 * Preprocessor Agent
 *
 * 整合所有 Agent 提取的信息，为小说编辑准备结构化数据
 * Refactored into modular structure for better maintainability
 */

import { BaseAgent } from "../base.js";
import type { AgentContext } from "../base.js";
import type {
  InterviewState,
  InterviewAnswer,
  ExtractedEntities,
  ExtractedFact,
} from "../../models/interview.js";
import type { PreprocessRequest, PreprocessResult, UserProfile, PreprocessMetadata } from "./types.js";
import { extractBasicInfo, extractEntities, extractFacts, buildTimeline } from "./extractors.js";
import { analyzeVoiceProfile, extractThemes, buildStoryStructure } from "./analyzers.js";

/**
 * Re-export types for external use
 */
export * from "./types.js";
export { getDefaultVoiceProfile, generateId, cleanJSONResponse } from "./utils.js";

/**
 * Preprocessor Agent
 *
 * Main class that coordinates all preprocessing operations
 */
export class PreprocessorAgent extends BaseAgent {
  private readonly storage: any; // FileStorage or MemoirOSStorage

  constructor(ctx: AgentContext, storage?: any) {
    super(ctx);
    this.storage = storage ?? null;
  }

  get name(): string {
    return "preprocessor";
  }

  /**
   * Main entry point: process interview data and generate user profile
   *
   * @param request - Preprocess request with userId and options
   * @returns Preprocess result with profile, summary, and suggestions
   */
  async preprocess(request: PreprocessRequest): Promise<PreprocessResult> {
    this.log?.info(`[Preprocessor] Starting preprocessing for user: ${request.userId}`);

    // 1. Load interview data
    const interviewData = await this.loadInterviewData(request.userId, request.interviewId);
    this.log?.info(`[Preprocessor] Loaded ${interviewData.answers.length} answers`);

    // 2. Extract basic information
    const basicInfo = await extractBasicInfo(this.ctx, interviewData);
    this.log?.info(`[Preprocessor] Basic info extracted:`, basicInfo);

    // 3. Extract entities (aggregate from all answers)
    const entities = await extractEntities(interviewData);

    // 4. Extract facts (aggregate from all answers)
    const facts = await extractFacts(this.ctx, interviewData);
    this.log?.info(`[Preprocessor] Extracted ${facts.length} facts`);

    // 5. Build timeline (if requested)
    const timeline = request.includeTimeline !== false
      ? await buildTimeline(this.ctx, interviewData, entities)
      : [];

    // 6. Analyze voice profile (if requested)
    const voiceProfile = request.includeVoiceProfile !== false
      ? await analyzeVoiceProfile(this.ctx.client, interviewData.answers)
      : (await import("./utils.js")).getDefaultVoiceProfile();

    // 7. Extract themes
    const themes = await extractThemes(this.ctx.client, interviewData, timeline);
    this.log?.info(`[Preprocessor] Extracted ${themes.length} themes`);

    // 8. Build story structure
    const storyStructure = await buildStoryStructure(this.ctx.client, interviewData, timeline);
    this.log?.info(`[Preprocessor] Story structure built`);

    // 9. Generate metadata
    const metadata = this.generateMetadata(interviewData, entities, facts);

    // 10. Create user profile
    const profile: UserProfile = {
      userId: request.userId,
      interviewId: interviewData.interviewId,
      basicInfo,
      timeline,
      entities,
      facts,
      voiceProfile,
      themes,
      storyStructure,
      metadata,
    };

    // 11. Generate summary and suggestions
    const summary = await this.generateSummary(profile);
    const suggestions = await this.generateSuggestions(profile);

    this.log?.info(`[Preprocessor] Preprocessing complete`);

    return { profile, summary, suggestions };
  }

  /**
   * Load interview data from storage
   *
   * @param userId - User ID
   * @param interviewId - Optional interview ID
   * @returns Interview data with answers
   */
  private async loadInterviewData(
    userId: string,
    interviewId?: string
  ): Promise<InterviewState & { answers: ReadonlyArray<InterviewAnswer> }> {
    if (this.storage && interviewId) {
      // Load from storage with answers
      const data = await this.storage.loadInterviewWithData(interviewId);
      if (data) {
        return data as InterviewState & { answers: ReadonlyArray<InterviewAnswer> };
      }
    }

    // Fallback: return minimal state
    return {
      interviewId: interviewId ?? `int_${Date.now()}`,
      userId,
      status: "active",
      startedAt: new Date().toISOString(),
      currentPhase: "warmup",
      questions: [],
      answers: [],
      extractedFacts: [],
      metadata: { completedPhases: [] },
    };
  }

  /**
   * Generate metadata
   *
   * @param interviewData - Interview data
   * @param entities - Extracted entities
   * @param facts - Extracted facts
   * @returns Preprocess metadata
   */
  private generateMetadata(
    interviewData: InterviewState,
    entities: ExtractedEntities,
    facts: ReadonlyArray<ExtractedFact>
  ): PreprocessMetadata {
    const gaps: string[] = [];

    if (!entities.years || entities.years.length === 0) {
      gaps.push("缺少时间信息");
    }
    if (!entities.locations || entities.locations.length === 0) {
      gaps.push("缺少地点信息");
    }
    if (!entities.people || entities.people.length === 0) {
      gaps.push("缺少人物信息");
    }

    const confidence = Math.min(
      1,
      (facts.length * 0.1) +
      (entities.years?.length || 0) * 0.05 +
      (entities.locations?.length || 0) * 0.05 +
      (entities.people?.length || 0) * 0.05
    );

    return {
      processedAt: new Date().toISOString(),
      totalAnswers: interviewData.answers?.length || 0,
      completedPhases: interviewData.metadata?.completedPhases || [],
      currentPhase: interviewData.currentPhase,
      confidence,
      gaps,
    };
  }

  /**
   * Generate summary
   *
   * @param profile - User profile
   * @returns Generated summary text
   */
  private async generateSummary(profile: UserProfile): Promise<string> {
    const systemPrompt = `你是一个编辑助手。请根据以下用户画像生成一段简洁的总结。

总结应包括：
- 用户基本信息
- 主要人生阶段
- 核心主题
- 故事风格

控制在 200 字以内。`;

    const profileSummary = `
用户：${profile.userId}
出生：${profile.basicInfo.birthYear || '未知'}年 ${profile.basicInfo.birthMonth || ''} ${profile.basicInfo.birthPlace || ''}
主要事件：${profile.timeline.slice(0, 5).map(e => e.title).join('、')}
主题：${profile.themes.map(t => t.name).join('、')}
情感基调：${profile.voiceProfile.characteristics.dominantTone.join('、')}
`;

    const response = await this.chat([
      { role: "system", content: systemPrompt },
      { role: "user", content: profileSummary },
    ], { temperature: 0.7 });

    return response.content;
  }

  /**
   * Generate suggestions for improvement
   *
   * @param profile - User profile
   * @returns Array of improvement suggestions
   */
  private async generateSuggestions(profile: UserProfile): Promise<ReadonlyArray<string>> {
    const suggestions: string[] = [];

    // Check for gaps
    if (profile.metadata.gaps.length > 0) {
      suggestions.push(`建议补充：${profile.metadata.gaps.join("、")}`);
    }

    // Check timeline coverage
    const years = profile.timeline
      .map(e => e.date.type === "exact" || e.date.type === "approximate" ? e.date.year : undefined)
      .filter((y): y is number => y !== undefined);
    if (years.length > 0) {
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      const coverage = maxYear - minYear;

      if (coverage < 20 && profile.basicInfo.birthYear) {
        const age = new Date().getFullYear() - profile.basicInfo.birthYear;
        if (age > 30) {
          suggestions.push("时间线覆盖不足，建议补充更多人生阶段的内容");
        }
      }
    }

    // Check confidence
    if (profile.metadata.confidence < 0.5) {
      suggestions.push("信息置信度较低，建议提供更多具体事件和细节");
    }

    // Check phase completion
    const completedPhases = profile.metadata.completedPhases.length;
    if (completedPhases < 8) {
      suggestions.push(`采访进度 ${completedPhases}/8 阶段，建议继续完成剩余阶段`);
    }

    // Default suggestions
    if (suggestions.length === 0) {
      suggestions.push("信息收集良好，可以开始撰写回忆录");
      suggestions.push("建议添加更多个人感悟和情感细节");
    }

    return suggestions;
  }
}
