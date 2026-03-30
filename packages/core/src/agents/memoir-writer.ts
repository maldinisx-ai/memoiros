/**
 * MemoirWriter Agent
 *
 * 基于 UserProfile 生成回忆录内容
 * 适配自 inkos Writer Agent
 */

import { BaseAgent } from "./base.js";
import type { UserProfile, Theme } from "./preprocessor.js";
import type { TimelineEvent, TimelineDate } from "../models/timeline.js";
import type { VoiceCharacteristics } from "../models/style.js";

export interface MemoirWriteRequest {
  readonly userId: string;
  readonly profile: UserProfile;
  readonly chapterNumber?: number;
  readonly focusPeriod?: {
    readonly startYear?: number;
    readonly endYear?: number;
    readonly theme?: string;
  };
  readonly targetWords?: number;
}

export interface MemoirWriteOutput {
  readonly chapterNumber: number;
  readonly title: string;
  readonly content: string;
  readonly wordCount: number;
  readonly periodCovered: {
    readonly start: string;
    readonly end: string;
  };
  readonly keyEvents: ReadonlyArray<string>;
}

export class MemoirWriterAgent extends BaseAgent {
  get name(): string {
    return "memoir-writer";
  }

  async writeChapter(request: MemoirWriteRequest): Promise<MemoirWriteOutput> {
    const chapterNumber = request.chapterNumber ?? 1;
    const targetWords = request.targetWords ?? 3000;

    // 确定本章要写的时间段
    const period = this.determineChapterPeriod(request.profile, chapterNumber, request.focusPeriod);

    // 筛选该时间段的事件
    const events = this.filterEventsByPeriod(request.profile.timeline, period);

    // 构建上下文
    const context = this.buildChapterContext(request.profile, events, period);

    // 生成系统提示
    const systemPrompt = this.buildSystemPrompt(request.profile, targetWords);

    // 生成用户提示
    const userPrompt = this.buildUserPrompt(chapterNumber, context, events, period);

    const response = await this.chat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.7, maxTokens: 8192 }
    );

    // 解析输出
    const parsed = this.parseOutput(response.content, chapterNumber);

    return {
      chapterNumber,
      title: parsed.title,
      content: parsed.content,
      wordCount: this.countWords(parsed.content),
      periodCovered: {
        start: period.start,
        end: period.end,
      },
      keyEvents: events.slice(0, 5).map(e => e.title),
    };
  }

  private determineChapterPeriod(
    profile: UserProfile,
    chapterNumber: number,
    focusPeriod?: { startYear?: number; endYear?: number; theme?: string }
  ): { start: string; end: string } {
    // 如果指定了关注时间段，使用它
    if (focusPeriod?.startYear && focusPeriod?.endYear) {
      return {
        start: `${focusPeriod.startYear}年`,
        end: `${focusPeriod.endYear}年`,
      };
    }

    // 否则基于时间线自动划分
    const timeline = profile.timeline;
    if (timeline.length === 0) {
      return { start: "早期", end: "近期" };
    }

    // 简单策略：按事件数量均分
    const eventsPerChapter = Math.max(5, Math.floor(timeline.length / 10));
    const startIndex = (chapterNumber - 1) * eventsPerChapter;
    const endIndex = Math.min(chapterNumber * eventsPerChapter, timeline.length);

    if (startIndex >= timeline.length) {
      return { start: "后期", end: "结尾" };
    }

    const startEvent = timeline[startIndex];
    const endEvent = timeline[endIndex - 1] || startEvent;

    return {
      start: this.formatEventDate(startEvent.date),
      end: this.formatEventDate(endEvent.date),
    };
  }

  private filterEventsByPeriod(
    timeline: ReadonlyArray<TimelineEvent>,
    period: { start: string; end: string }
  ): ReadonlyArray<TimelineEvent> {
    const startYear = this.extractYearFromString(period.start);
    const endYear = this.extractYearFromString(period.end);

    if (startYear === null || endYear === null) {
      // 无法解析年份，返回所有事件
      return timeline;
    }

    return timeline.filter(event => {
      const eventYear = this.extractYearFromEvent(event.date);
      return eventYear !== null && eventYear >= startYear && eventYear <= endYear;
    });
  }

  private buildChapterContext(
    profile: UserProfile,
    events: ReadonlyArray<TimelineEvent>,
    period: { start: string; end: string }
  ): string {
    const basicInfo = profile.basicInfo;
    const info = [
      basicInfo.birthYear ? `出生年份：${basicInfo.birthYear}` : "",
      (basicInfo.birthPlace) ? `出生地点：${basicInfo.birthPlace}` : "",
      basicInfo.education ? `教育背景：${basicInfo.education}` : "",
      basicInfo.career ? `职业经历：${basicInfo.career}` : "",
    ].filter(Boolean).join("\n");

    const themes = profile.themes.map(t => `- ${t.name}: ${t.description}`).join("\n");

    const eventsList = events.map(e => {
      const date = this.formatEventDate(e.date);
      return `- ${date}: ${e.title} - ${e.description}`;
    }).join("\n");

    return `## 基本信息
${info || "暂无"}

## 核心主题
${themes || "暂无"}

## 本章时间范围
${period.start} - ${period.end}

## 关键事件
${eventsList || "暂无"}`;
  }

  private buildSystemPrompt(profile: UserProfile, targetWords: number): string {
    // 基于用户的 voice profile 构建文风指导
    const voiceProfile = profile.voiceProfile;
    const styleGuidance = voiceProfile && voiceProfile.characteristics ? `
## 文风指导
- 句子长度：${voiceProfile.characteristics.avgSentenceLength || "中等"}
- 词汇水平：${voiceProfile.characteristics.vocabularyLevel || "中级"}
- 情感范围：${voiceProfile.characteristics.emotionalRange || "中等"}
- 细节程度：${voiceProfile.characteristics.detailLevel || "适中"}
` : "";

    return `你是一位专业的回忆录作家。你的任务是基于用户提供的真实人生经历，撰写生动、真实的回忆录章节。

## 写作原则
1. **真实性第一**：所有内容必须基于用户提供的事实，不得虚构
2. **细节生动**：用具体的生活细节和场景描写，让读者"看到"画面
3. **情感真挚**：真诚表达，避免煽情和矫揉造作
4. **时间清晰**：明确交代时间节点，保持时间线清晰
5. **人物立体**：通过具体事件展现人物性格，避免标签化描述
6. **语言朴实**：使用朴实自然的语言，避免华丽辞藻

## 去AI味铁律
- 禁止使用"然而""但是""虽然...但是"等转折词堆砌
- 禁止使用"不禁""仿佛""宛如"等AI高频词
- 情绪用细节传达：✗"他感到悲伤" → ✓"他攥紧了拳头，指节发白"
- 禁止替读者下结论：让读者从细节中感受
- 同一意象/体感禁止连续渲染超过两次

## 字数要求
目标字数：${targetWords}字
允许区间：${Math.floor(targetWords * 0.8)}-${Math.floor(targetWords * 1.2)}字
${styleGuidance}
## 输出格式
=== CHAPTER_TITLE ===
(章节标题，不含"第X章"）

=== CHAPTER_CONTENT ===
(正文内容)`;
  }

  private buildUserPrompt(
    chapterNumber: number,
    context: string,
    events: ReadonlyArray<TimelineEvent>,
    period: { start: string; end: string }
  ): string {
    const eventsSummary = events.length > 0
      ? events.map(e => `- ${e.title}: ${e.description}`).join("\n")
      : "（本章暂无具体事件记录）";

    return `请撰写回忆录第${chapterNumber}章，时间跨度：${period.start}至${period.end}。

${context}

## 写作建议
1. 选择1-3个核心事件重点描写
2. 融入当时的时代背景和社会环境
3. 通过具体场景展现人物性格和情感
4. 适当穿插回忆和感悟，但不要过度总结
5. 注意与前后的衔接，为后续内容留下空间

## 本章重点事件
${eventsSummary}`;
  }

  private parseOutput(content: string, chapterNumber: number): {
    title: string;
    content: string;
  } {
    const extract = (tag: string): string => {
      const regex = new RegExp(
        `=== ${tag} ===\\s*([\\s\\S]*?)(?==== [A-Z_]+ ===|$)`,
      );
      const match = content.match(regex);
      return match?.[1]?.trim() ?? "";
    };

    let title = extract("CHAPTER_TITLE");
    let chapterContent = extract("CHAPTER_CONTENT");

    // Fallback: 如果没有标签，尝试简单提取
    if (!title || title.length === 0) {
      const headingMatch = content.match(/^#+\s*(.+)/m);
      title = headingMatch && headingMatch[1] ? headingMatch[1].trim() : `第${chapterNumber}章`;
    }

    if (!chapterContent || chapterContent.length === 0) {
      // 移除可能的标题行
      chapterContent = content.replace(/^#+\s*.+\n+/m, "").trim();
    }

    return { title, content: chapterContent };
  }

  private formatEventDate(date: TimelineDate): string {
    if (date.type === "exact") {
      if (date.month && date.day) {
        return `${date.year}年${date.month}月${date.day}日`;
      }
      if (date.month) {
        return `${date.year}年${date.month}月`;
      }
      return `${date.year}年`;
    } else if (date.type === "approximate") {
      return `约${date.year}年`;
    } else {
      return date.description || date.era || "某时期";
    }
  }

  private extractYearFromString(dateString: string): number | null {
    const match = dateString.match(/(\d{4})/);
    return match ? parseInt(match[1], 10) : null;
  }

  private extractYearFromEvent(date: TimelineDate): number | null {
    if (date.type === "exact" || date.type === "approximate") {
      return date.year;
    }
    return null;
  }

  private countWords(text: string): number {
    // 简单的中英文混排字数统计
    // 统计中文字符 + 英文单词数
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    return chineseChars + englishWords;
  }
}
