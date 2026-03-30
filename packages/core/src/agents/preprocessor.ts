/**
 * Preprocessor Agent
 *
 * 整合所有 Agent 提取的信息，为小说编辑准备结构化数据
 */

import { z } from "zod";
import { BaseAgent } from "./base.js";
import type { AgentContext, LLMMessage } from "./base.js";
import type {
  InterviewState,
  InterviewAnswer,
  ExtractedEntities,
  ExtractedFact,
} from "../models/interview.js";
import type {
  VoiceProfile,
  VoiceCharacteristics,
} from "../models/style.js";
import type {
  TimelineEvent,
  TimelineDate,
} from "../models/timeline.js";

/**
 * User profile for memoir writing
 */
export interface UserProfile {
  readonly userId: string;
  readonly interviewId: string;
  readonly basicInfo: BasicInfo;
  readonly timeline: ReadonlyArray<TimelineEvent>;
  readonly entities: ExtractedEntities;
  readonly facts: ReadonlyArray<ExtractedFact>;
  readonly voiceProfile: VoiceProfile;
  readonly themes: ReadonlyArray<Theme>;
  readonly storyStructure: StoryStructure;
  readonly metadata: PreprocessMetadata;
}

export interface BasicInfo {
  readonly name?: string;
  readonly birthYear?: number;
  readonly birthMonth?: number;
  readonly birthDay?: number;
  readonly birthPlace?: string;
  readonly education?: string;
  readonly career?: string;
  readonly gender?: string;
  readonly occupation?: string;
}

export interface Theme {
  readonly themeId: string;
  readonly name: string;
  readonly description: string;
  readonly relatedEvents: ReadonlyArray<string>;
  readonly emotionalTone: string;
}

export interface StoryStructure {
  readonly opening: StoryPhase;
  readonly development: ReadonlyArray<StoryPhase>;
  readonly climax: StoryPhase;
  readonly resolution: StoryPhase;
}

export interface StoryPhase {
  readonly phaseId: string;
  readonly title: string;
  readonly timeRange: string;
  readonly keyEvents: ReadonlyArray<string>;
  readonly emotionalArc: string;
}

export interface PreprocessMetadata {
  readonly processedAt: string;
  readonly totalAnswers: number;
  readonly completedPhases: ReadonlyArray<string>;
  readonly currentPhase: string;
  readonly confidence: number;
  readonly gaps: ReadonlyArray<string>;
}

/**
 * Preprocess request
 */
export interface PreprocessRequest {
  readonly userId: string;
  readonly interviewId?: string;
  readonly includeTimeline?: boolean;
  readonly includeVoiceProfile?: boolean;
}

/**
 * Preprocess result
 */
export interface PreprocessResult {
  readonly profile: UserProfile;
  readonly summary: string;
  readonly suggestions: ReadonlyArray<string>;
}

/**
 * Schema for theme extraction
 */
const ThemeExtractionSchema = z.object({
  themes: z.array(z.object({
    name: z.string(),
    description: z.string(),
    emotionalTone: z.string(),
    relatedEvents: z.array(z.string()),
  })),
});

/**
 * Schema for story structure extraction
 */
const StoryStructureSchema = z.object({
  opening: z.object({
    phaseId: z.string().optional(),
    title: z.string(),
    timeRange: z.string(),
    keyEvents: z.array(z.string()),
    emotionalArc: z.string(),
  }),
  development: z.array(z.object({
    phaseId: z.string().optional(),
    title: z.string(),
    timeRange: z.string(),
    keyEvents: z.array(z.string()),
    emotionalArc: z.string(),
  })),
  climax: z.object({
    phaseId: z.string().optional(),
    title: z.string(),
    timeRange: z.string(),
    keyEvents: z.array(z.string()),
    emotionalArc: z.string(),
  }),
  resolution: z.object({
    phaseId: z.string().optional(),
    title: z.string(),
    timeRange: z.string(),
    keyEvents: z.array(z.string()),
    emotionalArc: z.string(),
  }),
});

/**
 * Preprocessor Agent
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
   */
  async preprocess(request: PreprocessRequest): Promise<PreprocessResult> {
    this.log?.info(`[Preprocessor] Starting preprocessing for user: ${request.userId}`);

    // 1. Load interview data
    const interviewData = await this.loadInterviewData(request.userId, request.interviewId);
    this.log?.info(`[Preprocessor] Loaded ${interviewData.answers.length} answers`);

    // 2. Extract basic information
    const basicInfo = await this.extractBasicInfo(interviewData);
    this.log?.info(`[Preprocessor] Basic info extracted:`, basicInfo);

    // 3. Extract entities (aggregate from all answers)
    const entities = await this.extractEntities(interviewData);

    // 4. Extract facts (aggregate from all answers)
    const facts = await this.extractFacts(interviewData);
    this.log?.info(`[Preprocessor] Extracted ${facts.length} facts`);

    // 5. Build timeline (if requested)
    const timeline = request.includeTimeline !== false
      ? await this.buildTimeline(interviewData, entities)
      : [];

    // 6. Analyze voice profile (if requested)
    const voiceProfile = request.includeVoiceProfile !== false
      ? await this.analyzeVoiceProfile(interviewData.answers)
      : this.getDefaultVoiceProfile();

    // 7. Extract themes
    const themes = await this.extractThemes(interviewData, timeline);
    this.log?.info(`[Preprocessor] Extracted ${themes.length} themes`);

    // 8. Build story structure
    const storyStructure = await this.buildStoryStructure(interviewData, timeline);
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
   */
  private async loadInterviewData(userId: string, interviewId?: string): Promise<InterviewState & { answers: ReadonlyArray<InterviewAnswer> }> {
    if (this.storage && interviewId) {
      // Load from storage
      const data = await this.storage.loadInterview(interviewId);
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
   * Extract basic information from answers
   */
  private async extractBasicInfo(interviewData: InterviewState & { answers: ReadonlyArray<InterviewAnswer> }): Promise<BasicInfo> {
    const allAnswers = interviewData.answers.map(a => a.answer).join("\n");

    const systemPrompt = `你是一个信息提取专家。请从以下采访回答中提取用户的基本信息。

如果某些信息没有明确提到，请留空而不是编造。

返回 JSON 格式：
{
  "name": "用户姓名（如果提到）",
  "birthYear": 出生年份（数字），
  "birthMonth": 出生月份（数字），
  "birthDay": 出生日期（数字），
  "birthPlace": "出生地点（省市区县镇村庄）",
  "gender": "性别",
  "occupation": "职业"
}`;

    const response = await this.chat([
      { role: "system", content: systemPrompt },
      { role: "user", content: `采访回答：\n\n${allAnswers}` },
    ], { temperature: 0.3 });

    try {
      // Extract JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*?[\s\S]*?\}/);
      if (jsonMatch) {
        const cleaned = jsonMatch[0].replace(/`/g, '"').replace(/'/g, '"');
        const parsed = JSON.parse(cleaned) as BasicInfo;
        this.log?.info(`[Preprocessor] Successfully parsed basic info`, parsed);
        return parsed;
      }

      // Fallback: Try to extract using regex patterns
      const yearMatch = response.content.match(/(\d{4})\s*年/);
      const monthMatch = response.content.match(/(\d{1,2})\s*月/);
      const dayMatch = response.content.match(/(\d{1,2})\s*(日|号)/);

      // Enhanced location regex to capture Chinese addresses
      const locationMatch = response.content.match(/(?:出生(?:地|点|在)|位于)\s*([^\n\r]+)/);

      // Fallback: search in original answers if LLM response doesn't contain location
      let birthPlace: string | undefined;
      if (locationMatch) {
        birthPlace = locationMatch[1].trim();
      } else {
        // Try to find location in original answers
        const locationInAnswers = allAnswers.match(/出生[地在]?\s*[：:]?\s*([^\n\r，。、]+)/);
        if (locationInAnswers) {
          birthPlace = locationInAnswers[1].trim();
        }
      }

      const basicInfo: BasicInfo = {
        birthYear: yearMatch ? parseInt(yearMatch[1], 10) : undefined,
        birthMonth: monthMatch ? parseInt(monthMatch[1], 10) : undefined,
        birthDay: dayMatch ? parseInt(dayMatch[1], 10) : undefined,
        birthPlace,
        name: undefined,
        education: undefined,
        career: undefined,
        gender: undefined,
        occupation: undefined,
      };

      this.log?.info(`[Preprocessor] Extracted basic info (by regex fallback):`, basicInfo);
      return basicInfo;
    } catch (error) {
      this.log?.error(`[Preprocessor] Failed to parse basic info: ${error}`);
      this.log?.error(`[Preprocessor] LLM response: ${response.content.slice(200)}`);
      return {}; // Return empty basic info on error
    }
  }

  /**
   * Extract and aggregate entities from all answers
   */
  private async extractEntities(interviewData: InterviewState & { answers: ReadonlyArray<InterviewAnswer> }): Promise<ExtractedEntities> {
    const yearsSet = new Set<number>();
    const locationsSet = new Set<string>();
    const peopleSet = new Set<string>();
    const eventsSet = new Set<string>();
    const emotionsSet = new Set<string>();
    const missingEntitiesSet = new Set<string>();

    for (const answer of interviewData.answers) {
      if (answer.extractedEntities) {
        const entities = answer.extractedEntities as ExtractedEntities;
        if (entities.years) entities.years.forEach(y => yearsSet.add(y));
        if (entities.locations) entities.locations.forEach(l => locationsSet.add(l));
        if (entities.people) entities.people.forEach(p => peopleSet.add(p));
        if (entities.events) entities.events.forEach(e => eventsSet.add(e));
        if (entities.emotions) entities.emotions.forEach(e => emotionsSet.add(e));
      }
    }

    return {
      years: Array.from(yearsSet),
      locations: Array.from(locationsSet),
      people: Array.from(peopleSet),
      events: Array.from(eventsSet),
      emotions: Array.from(emotionsSet),
      missingEntities: Array.from(missingEntitiesSet),
    };
  }

  /**
   * Extract and aggregate facts from all answers
   */
  private async extractFacts(interviewData: InterviewState & { answers: ReadonlyArray<InterviewAnswer> }): Promise<ReadonlyArray<ExtractedFact>> {
    // Use facts already extracted by InterviewerAgent
    if (interviewData.extractedFacts && interviewData.extractedFacts.length > 0) {
      return interviewData.extractedFacts;
    }

    // If no facts extracted yet, do it now
    const systemPrompt = `你是一个事实提取专家。请从以下采访回答中提取关键事实。

事实应该是：
- 具体的事件
- 明确的时间信息
- 重要的人生节点

返回 JSON 格式：
{
  "facts": [
    {
      "fact": "事实描述",
      "year": 年份（数字），
      "category": "类别（birth/education/career/family/milestone/other）",
      "confidence": 置信度（0-1之间的数字）
    }
  ]
}`;

    const allAnswers = interviewData.answers.map(a => a.answer).join("\n");

    const response = await this.chat([
      { role: "system", content: systemPrompt },
      { role: "user", content: `采访回答：\n\n${allAnswers}` },
    ], { temperature: 0.3 });

    const cleaned = this.cleanJSONResponse(response.content);
    const parsed = JSON.parse(cleaned) as { facts: ReadonlyArray<{ fact: string; year?: number; category: string; confidence: number }> };

    return parsed.facts.map(f => ({
      factId: this.generateId("fact"),
      fact: f.fact,
      sourceAnswerIds: [],
      confidence: f.confidence,
      category: f.category as any,
      year: f.year,
    }));
  }

  /**
   * Build timeline from facts and entities
   */
  private async buildTimeline(
    interviewData: InterviewState & { answers: ReadonlyArray<InterviewAnswer> },
    entities: ExtractedEntities
  ): Promise<ReadonlyArray<TimelineEvent>> {
    try {
      const systemPrompt = `你是一个时间线构建专家。请根据以下信息构建人生时间线。

信息：
- 实体：${JSON.stringify(entities)}
- 事实：${JSON.stringify(interviewData.extractedFacts || [])}

请按时间顺序排列事件，返回 JSON 格式：
{
  "events": [
    {
      "title": "事件标题",
      "description": "详细描述",
      "date": {
        "type": "exact",
        "year": 年份,
        "month": 月份（可选），
        "day": 日期（可选）
      },
      "category": "birth/education/career/family/milestone/other",
      "importance": "critical/high/medium/low"
    }
  ]
}`;

      const response = await this.chat([
        { role: "system", content: systemPrompt },
        { role: "user", content: "请构建时间线" },
      ], { temperature: 0.5 });

      const cleaned = this.cleanJSONResponse(response.content);
      const parsed = JSON.parse(cleaned) as { events: ReadonlyArray<{ title: string; description: string; date: TimelineDate; category: string; importance: string }> };

      return parsed.events.map((e, i) => ({
        eventId: this.generateId("evt"),
        timelineId: `timeline_${interviewData.userId}`,
        userId: interviewData.userId,
        date: e.date,
        title: e.title,
        description: e.description,
        category: e.category as any,
        importance: e.importance as any,
        confidence: 0.8,
        sourceAnswerIds: [],
        verified: false,
      }));
    } catch (error) {
      this.log?.error(`[Preprocessor] Failed to build timeline: ${error}`);
      // Return empty timeline on error
      return [];
    }
  }

  /**
   * Analyze user's voice profile from answers
   */
  private async analyzeVoiceProfile(answers: ReadonlyArray<InterviewAnswer>): Promise<VoiceProfile> {
    const now = new Date().toISOString();

    // This would normally use StyleImitatorAgent
    // For now, return a basic profile
    return {
      profileId: this.generateId("voice"),
      userId: "",
      createdAt: now,
      updatedAt: now,
      characteristics: {
        avgSentenceLength: 15,
        sentenceComplexity: "moderate",
        prefersShortSentences: false,
        vocabularyLevel: "intermediate",
        commonWords: [],
        idiosyncraticPhrases: [],
        dominantTone: [],
        emotionalRange: "moderate",
        usesEllipsis: false,
        usesEmDash: false,
        exclamationFrequency: "moderate",
        dialect: [],
        eraMarkers: [],
        perspective: "first_person",
        tense: "past",
        detailLevel: "moderate",
      },
      sampleSources: answers.slice(0, 10).map(a => ({
        sampleId: a.answerId,
        sourceId: a.answerId,
        sourceType: "interview_answer" as const,
        content: a.answer,
        extractedAt: now,
        weight: 1,
      })),
      confidence: 0.7,
    };
  }

  /**
   * Extract themes from interview data
   */
  private async extractThemes(
    interviewData: InterviewState & { answers: ReadonlyArray<InterviewAnswer> },
    timeline: ReadonlyArray<TimelineEvent>
  ): Promise<ReadonlyArray<Theme>> {
    try {
      const systemPrompt = `你是一个主题分析专家。请从以下采访数据中提取主要的主题。

主题是贯穿用户人生的核心话题，如：家庭、奋斗、成长、家乡、传承等。

返回 JSON 格式：
{
  "themes": [
    {
      "name": "主题名称",
      "description": "主题描述",
      "emotionalTone": "情感基调（如温暖/励志/怀旧）",
      "relatedEvents": ["相关事件ID或描述"]
    }
  ]
}`;

      const allAnswers = interviewData.answers.map(a => a.answer).join("\n");
      const timelineSummary = timeline.map(e => {
        const year = e.date.type === "exact" || e.date.type === "approximate"
          ? e.date.year.toString()
          : e.date.era || "?";
        return `${year}: ${e.title}`;
      }).join("\n");

      const response = await this.chat([
        { role: "system", content: systemPrompt },
        { role: "user", content: `采访回答：\n\n${allAnswers}\n\n时间线：\n${timelineSummary}` },
      ], { temperature: 0.7 });

      const cleaned = this.cleanJSONResponse(response.content);
      const parsed = ThemeExtractionSchema.parse(JSON.parse(cleaned));

      return parsed.themes.map((t, i) => ({
        themeId: this.generateId("theme"),
        name: t.name,
        description: t.description,
        emotionalTone: t.emotionalTone,
        relatedEvents: t.relatedEvents,
      }));
    } catch (error) {
      this.log?.error(`[Preprocessor] Failed to extract themes: ${error}`);
      // Return default themes
      return [
        {
          themeId: this.generateId("theme"),
          name: "成长历程",
          description: "用户的人生经历和成长故事",
          emotionalTone: "平和",
          relatedEvents: [],
        },
      ];
    }
  }

  /**
   * Build story structure
   */
  private async buildStoryStructure(
    interviewData: InterviewState & { answers: ReadonlyArray<InterviewAnswer> },
    timeline: ReadonlyArray<TimelineEvent>
  ): Promise<StoryStructure> {
    try {
      const systemPrompt = `你是一个故事结构专家。请根据以下信息构建回忆录的故事结构。

信息：
- 当前阶段：${interviewData.currentPhase}
- 已完成阶段：${interviewData.metadata?.completedPhases || []}
- 时间线事件：${timeline.map(e => {
        const year = e.date.type === "exact" || e.date.type === "approximate"
          ? e.date.year.toString()
          : e.date.era || "?";
        return `${year}: ${e.title}`;
      }).join(", ")}

回忆录应该分为：
1. 开篇 - 出生、家庭背景、童年早期
2. 发展 - 成长、求学、工作、家庭建立
3. 高潮 - 人生转折、重大成就、关键挑战
4. 结尾 - 回顾、感悟、传承

返回 JSON 格式：
{
  "opening": {
    "title": "开篇标题",
    "timeRange": "时间范围描述",
    "keyEvents": ["关键事件"],
    "emotionalArc": "情感弧线"
  },
  "development": [
    {
      "title": "发展阶段标题",
      "timeRange": "时间范围",
      "keyEvents": ["关键事件"],
      "emotionalArc": "情感弧线"
    }
  ],
  "climax": {
    "title": "高潮标题",
    "timeRange": "时间范围",
    "keyEvents": ["关键事件"],
    "emotionalArc": "情感弧线"
  },
  "resolution": {
    "title": "结尾标题",
    "timeRange": "时间范围",
    "keyEvents": ["关键事件"],
    "emotionalArc": "情感弧线"
  }
}`;

      const response = await this.chat([
        { role: "system", content: systemPrompt },
        { role: "user", content: "请构建故事结构" },
      ], { temperature: 0.7 });

      const cleaned = this.cleanJSONResponse(response.content);
      const parsed = JSON.parse(cleaned);

      // Handle LLM returning object instead of array for development
      if (parsed.development && !Array.isArray(parsed.development)) {
        parsed.development = [parsed.development];
      }

      return StoryStructureSchema.parse(parsed) as StoryStructure;
    } catch (error) {
      this.log?.error(`[Preprocessor] Failed to build story structure: ${error}`);
      // Return default story structure
      return {
        opening: {
          phaseId: this.generateId("phase"),
          title: "开篇",
          timeRange: "出生至童年",
          keyEvents: [],
          emotionalArc: "平静叙述",
        },
        development: [
          {
            phaseId: this.generateId("phase"),
            title: "成长",
            timeRange: "青少年时期",
            keyEvents: [],
            emotionalArc: "逐渐展开",
          },
        ],
        climax: {
          phaseId: this.generateId("phase"),
          title: "转折",
          timeRange: "中年时期",
          keyEvents: [],
          emotionalArc: "达到高峰",
        },
        resolution: {
          phaseId: this.generateId("phase"),
          title: "回顾",
          timeRange: "当下",
          keyEvents: [],
          emotionalArc: "平和沉淀",
        },
      };
    }
  }

  /**
   * Generate metadata
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

  /**
   * Get default voice profile
   */
  private getDefaultVoiceProfile(): VoiceProfile {
    return {
      profileId: "default",
      userId: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      characteristics: {
        avgSentenceLength: 15,
        sentenceComplexity: "moderate",
        prefersShortSentences: false,
        vocabularyLevel: "intermediate",
        commonWords: [],
        idiosyncraticPhrases: [],
        dominantTone: [],
        emotionalRange: "moderate",
        usesEllipsis: false,
        usesEmDash: false,
        exclamationFrequency: "moderate",
        dialect: [],
        eraMarkers: [],
        perspective: "first_person",
        tense: "past",
        detailLevel: "moderate",
      },
      sampleSources: [],
      confidence: 0.5,
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Clean LLM response by removing markdown code blocks
   */
  private cleanJSONResponse(content: string): string {
    let cleaned = content.replace(/```(?:json)?\s*/g, "").trim();
    cleaned = cleaned.replace(/```\s*$/g, "").trim();
    return cleaned;
  }
}
