/**
 * Style Imitator Agent
 *
 * Analyzes user's voice and rewrites text to match their style
 */

import { z } from "zod";
import type { AgentContext } from "./base.js";
import { BaseAgent } from "./base.js";
import type {
  VoiceProfile,
  VoiceCharacteristics,
  VoiceProfileCreationRequest,
  VoiceProfileAnalysis,
  StyleTransferRequest,
  StyleTransferResult,
  StyleChange,
  VoiceSample,
  ToneType,
} from "../models/style.js";

/**
 * Zod schema for voice analysis
 */
const VoiceAnalysisSchema = z.object({
  characteristics: z.object({
    avgSentenceLength: z.number(),
    sentenceComplexity: z.enum(["simple", "moderate", "complex"]),
    prefersShortSentences: z.boolean(),
    vocabularyLevel: z.enum(["basic", "intermediate", "advanced"]),
    commonWords: z.array(z.string()),
    idiosyncraticPhrases: z.array(z.string()),
    dominantTone: z.array(z.string()),
    emotionalRange: z.enum(["restricted", "moderate", "expressive"]),
    usesEllipsis: z.boolean(),
    usesEmDash: z.boolean(),
    exclamationFrequency: z.enum(["rare", "moderate", "frequent"]),
    dialect: z.array(z.string()),
    eraMarkers: z.array(z.string()),
    perspective: z.enum(["first_person", "third_person", "mixed"]),
    tense: z.enum(["past", "present", "mixed"]),
    detailLevel: z.enum(["sparse", "moderate", "rich"]),
  }),
  dominantTraits: z.array(z.string()),
  suggestions: z.array(z.string()),
});

/**
 * Zod schema for style transfer
 */
const StyleTransferSchema = z.object({
  rewrittenText: z.string().min(10),
  changes: z.array(z.object({
    type: z.enum([
      "sentence_structure", "vocabulary", "tone",
      "punctuation", "cultural_markers"
    ]),
    original: z.string(),
    modified: z.string(),
    reason: z.string(),
  })),
  confidence: z.number().min(0).max(1),
  warnings: z.array(z.string()).optional(),
});

/**
 * Style Imitator Agent
 */
export class StyleImitatorAgent extends BaseAgent {
  get name(): string {
    return "style-imitator";
  }

  /**
   * Create or update voice profile from samples
   */
  async createVoiceProfile(
    request: VoiceProfileCreationRequest
  ): Promise<VoiceProfileAnalysis> {
    this.log?.info(`[StyleImitator] Creating voice profile for user: ${request.userId}`);

    // Step 1: Analyze each sample
    const sampleAnalyses = await Promise.all(
      request.samples.map(sample => this.analyzeSample(sample))
    );

    // Step 2: Aggregate characteristics
    const aggregatedCharacteristics = this.aggregateCharacteristics(sampleAnalyses);

    // Step 3: Create voice profile
    const profile: VoiceProfile = {
      profileId: request.profileId ?? this.generateId("voice_profile"),
      userId: request.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      characteristics: aggregatedCharacteristics,
      sampleSources: request.samples.map(s => ({
        sourceId: s.sampleId,
        sourceType: s.sourceType,
        content: s.content,
        extractedAt: new Date().toISOString(),
        weight: 1 / request.samples.length,
      })),
      confidence: this.calculateProfileConfidence(sampleAnalyses),
    };

    // Step 4: Generate summary and suggestions
    const summary = this.generateVoiceSummary(profile);
    const dominantTraits = this.extractDominantTraits(profile);
    const suggestions = await this.generateVoiceSuggestions(profile);

    return {
      profile,
      summary,
      dominantTraits,
      suggestions,
    };
  }

  /**
   * Transfer style to text
   */
  async transferStyle(request: StyleTransferRequest): Promise<StyleTransferResult> {
    this.log?.info(`[StyleImitator] Transferring style to text (${request.sourceText.slice(0, 50)}...)`);

    const { sourceText, voiceProfile, options } = request;
    const intensity = options?.intensity ?? "moderate";

    // Build style prompt
    const stylePrompt = this.buildStylePrompt(sourceText, voiceProfile, options);

    try {
      const response = await this.chat([
        { role: "system", content: stylePrompt },
        { role: "user", content: sourceText }
      ], { temperature: 0.7 });

      const parsed = StyleTransferSchema.parse(JSON.parse(response.content));

      return {
        rewrittenText: this.adjustIntensity(sourceText, parsed.rewrittenText, intensity),
        confidence: parsed.confidence * voiceProfile.confidence,
        changes: parsed.changes,
        warnings: parsed.warnings,
      };
    } catch (error) {
      this.log?.error(`[StyleImitator] Style transfer failed: ${error}`);
      return {
        rewrittenText: sourceText,
        confidence: 0,
        changes: [],
        warnings: ["风格转换失败，返回原文"],
      };
    }
  }

  /**
   * Analyze a single voice sample
   */
  private async analyzeSample(
    sample: VoiceSample
  ): Promise<{ characteristics: Partial<VoiceCharacteristics>; confidence: number }> {
    const systemPrompt = `你是一个语言风格分析专家。请分析以下文本的语言特征。

分析维度：
1. 句子结构：平均长度、复杂度、偏好短句
2. 词汇水平：基础/中级/高级、常用词、个性化表达
3. 语气基调：怀旧、幽默、严肃、反思、对话式、正式、情感、客观
4. 情感表达：克制/适中/丰富
5. 标点符号：省略号、破折号、感叹号使用频率
6. 地域特色：方言词汇
7. 时代印记：特定年代的用语
8. 叙事视角：第一人称/第三人称
9. 时态：过去/现在
10. 细节程度：稀疏/适中/丰富

输出格式（JSON）：
{
  "characteristics": {
    "avgSentenceLength": 15,
    "sentenceComplexity": "moderate",
    "prefersShortSentences": true,
    "vocabularyLevel": "intermediate",
    "commonWords": ["那时候", "挺", "咱们"],
    "idiosyncraticPhrases": ["那个年代", "想当年"],
    "dominantTone": ["nostalgic", "conversational"],
    "emotionalRange": "moderate",
    "usesEllipsis": true,
    "usesEmDash": false,
    "exclamationFrequency": "rare",
    "dialect": ["咱们", "挺"],
    "eraMarkers": ["公社", "生产队"],
    "perspective": "first_person",
    "tense": "past",
    "detailLevel": "moderate"
  }
}`;

    try {
      const response = await this.chat([
        { role: "system", content: systemPrompt },
        { role: "user", content: sample.content }
      ], { temperature: 0.3 });

      const parsed = VoiceAnalysisSchema.parse(JSON.parse(response.content));

      return {
        characteristics: parsed.characteristics as VoiceCharacteristics,
        confidence: 0.8,  // Base confidence for single sample
      };
    } catch (error) {
      this.log?.error(`[StyleImitator] Sample analysis failed: ${error}`);
      return { characteristics: {}, confidence: 0 };
    }
  }

  /**
   * Aggregate characteristics from multiple samples
   */
  private aggregateCharacteristics(
    analyses: ReadonlyArray<{ characteristics: Partial<VoiceCharacteristics>; confidence: number }>
  ): VoiceCharacteristics {
    // Default characteristics
    const defaults: VoiceCharacteristics = {
      avgSentenceLength: 15,
      sentenceComplexity: "moderate",
      prefersShortSentences: false,
      vocabularyLevel: "intermediate",
      commonWords: [],
      idiosyncraticPhrases: [],
      dominantTone: ["conversational"],
      emotionalRange: "moderate",
      usesEllipsis: false,
      usesEmDash: false,
      exclamationFrequency: "moderate",
      dialect: [],
      eraMarkers: [],
      perspective: "first_person",
      tense: "past",
      detailLevel: "moderate",
    };

    // Filter out failed analyses
    const validAnalyses = analyses.filter(a => a.confidence > 0);
    if (validAnalyses.length === 0) return defaults;

    // Average numeric values
    const avgSentenceLength = this.average(
      validAnalyses.map(a => a.characteristics.avgSentenceLength ?? defaults.avgSentenceLength)
    );

    // Most frequent categorical values
    const sentenceComplexity = this.mostFrequent(
      validAnalyses.map(a => a.characteristics.sentenceComplexity ?? defaults.sentenceComplexity)
    ) ?? defaults.sentenceComplexity;

    const prefersShortSentences = this.mode(
      validAnalyses.map(a => a.characteristics.prefersShortSentences ?? defaults.prefersShortSentences)
    ) ?? defaults.prefersShortSentences;

    const vocabularyLevel = this.mostFrequent(
      validAnalyses.map(a => a.characteristics.vocabularyLevel ?? defaults.vocabularyLevel)
    ) ?? defaults.vocabularyLevel;

    // Aggregate arrays (remove duplicates, keep frequency)
    const commonWords = this.aggregateStringArrays(
      validAnalyses.map(a => a.characteristics.commonWords ?? [])
    );

    const idiosyncraticPhrases = this.aggregateStringArrays(
      validAnalyses.map(a => a.characteristics.idiosyncraticPhrases ?? [])
    );

    const dominantTone = this.aggregateStringArrays(
      validAnalyses.map(a => a.characteristics.dominantTone ?? [])
    );

    const emotionalRange = this.mostFrequent(
      validAnalyses.map(a => a.characteristics.emotionalRange ?? defaults.emotionalRange)
    ) ?? defaults.emotionalRange;

    const usesEllipsis = this.mode(
      validAnalyses.map(a => a.characteristics.usesEllipsis ?? defaults.usesEllipsis)
    ) ?? defaults.usesEllipsis;

    const usesEmDash = this.mode(
      validAnalyses.map(a => a.characteristics.usesEmDash ?? defaults.usesEmDash)
    ) ?? defaults.usesEmDash;

    const exclamationFrequency = this.mostFrequent(
      validAnalyses.map(a => a.characteristics.exclamationFrequency ?? defaults.exclamationFrequency)
    ) ?? defaults.exclamationFrequency;

    const dialect = this.aggregateStringArrays(
      validAnalyses.map(a => a.characteristics.dialect ?? [])
    );

    const eraMarkers = this.aggregateStringArrays(
      validAnalyses.map(a => a.characteristics.eraMarkers ?? [])
    );

    const perspective = this.mostFrequent(
      validAnalyses.map(a => a.characteristics.perspective ?? defaults.perspective)
    ) ?? defaults.perspective;

    const tense = this.mostFrequent(
      validAnalyses.map(a => a.characteristics.tense ?? defaults.tense)
    ) ?? defaults.tense;

    const detailLevel = this.mostFrequent(
      validAnalyses.map(a => a.characteristics.detailLevel ?? defaults.detailLevel)
    ) ?? defaults.detailLevel;

    return {
      avgSentenceLength,
      sentenceComplexity,
      prefersShortSentences,
      vocabularyLevel,
      commonWords,
      idiosyncraticPhrases,
      dominantTone: dominantTone as ReadonlyArray<ToneType>,
      emotionalRange,
      usesEllipsis,
      usesEmDash,
      exclamationFrequency,
      dialect,
      eraMarkers,
      perspective,
      tense,
      detailLevel,
    } as VoiceCharacteristics;
  }

  /**
   * Calculate profile confidence based on sample analyses
   */
  private calculateProfileConfidence(
    analyses: ReadonlyArray<{ characteristics: Partial<VoiceCharacteristics>; confidence: number }>
  ): number {
    const validAnalyses = analyses.filter(a => a.confidence > 0);
    if (validAnalyses.length === 0) return 0;

    // Average confidence, boosted by sample count
    const avgConfidence = validAnalyses.reduce((sum, a) => sum + a.confidence, 0) / validAnalyses.length;
    const sampleBonus = Math.min(validAnalyses.length * 0.05, 0.2);  // Max 20% bonus

    return Math.min(avgConfidence + sampleBonus, 1.0);
  }

  /**
   * Build style transfer prompt
   */
  private buildStylePrompt(
    sourceText: string,
    profile: VoiceProfile,
    options?: { readonly preserveFacts?: boolean; readonly focusAreas?: ReadonlyArray<string> }
  ): string {
    const c = profile.characteristics;

    return `你是一位专业的文字风格转换专家。请将用户的文字改写为指定风格。

【目标风格特征】
- 句子结构：${c.sentenceComplexity}，平均长度${c.avgSentenceLength}字${c.prefersShortSentences ? "，偏好短句" : ""}
- 词汇水平：${c.vocabularyLevel}
- 常用词：${c.commonWords.join("、") || "无特别偏好"}
- 个性化表达：${c.idiosyncraticPhrases.join("、") || "无"}
- 语气基调：${c.dominantTone.join("、")}
- 情感表达：${c.emotionalRange}
- 标点符号：省略号${c.usesEllipsis ? "✓" : "✗"} 破折号${c.usesEmDash ? "✓" : "✗"} 感叹号${c.exclamationFrequency}
- 方言特色：${c.dialect.join("、") || "无"}
- 时代印记：${c.eraMarkers.join("、") || "无"}
- 叙事视角：${c.perspective}
- 时态：${c.tense}
- 细节程度：${c.detailLevel}

${options?.preserveFacts ? "【重要】保持事实不变，只改写表达方式。" : ""}

${options?.focusAreas ? `重点关注：${options.focusAreas.join("、")}` : ""}

请改写以下文字，输出格式（JSON）：
{
  "rewrittenText": "改写后的文字",
  "changes": [
    {
      "type": "sentence_structure|vocabulary|tone|punctuation|cultural_markers",
      "original": "原文片段",
      "modified": "修改后片段",
      "reason": "修改原因"
    }
  ],
  "confidence": 0.9
}`;
  }

  /**
   * Adjust intensity of style transfer
   */
  private adjustIntensity(
    original: string,
    rewritten: string,
    intensity: "subtle" | "moderate" | "strong"
  ): string {
    if (intensity === "strong") {
      return rewritten;
    } else if (intensity === "moderate") {
      // Mix 50% original, 50% rewritten (simplified)
      return rewritten;
    } else {
      // Subtle: return mostly original with some style elements
      // For now, return rewritten but this could be more sophisticated
      return rewritten;
    }
  }

  /**
   * Generate voice summary
   */
  private generateVoiceSummary(profile: VoiceProfile): string {
    const c = profile.characteristics;

    const traits: string[] = [];
    traits.push(`${c.sentenceComplexity === "simple" ? "简单" : c.sentenceComplexity === "complex" ? "复杂" : "中等"}句式`);
    traits.push(`${c.vocabularyLevel === "basic" ? "基础" : c.vocabularyLevel === "advanced" ? "高级" : "中级"}词汇`);
    traits.push(c.dominantTone.join("、") + "基调");

    if (c.dialect.length > 0) {
      traits.push(`方言特色：${c.dialect.join("、")}`);
    }

    if (c.eraMarkers.length > 0) {
      traits.push(`时代印记：${c.eraMarkers.join("、")}`);
    }

    return `语言风格：${traits.join("，")}`;
  }

  /**
   * Extract dominant traits
   */
  private extractDominantTraits(profile: VoiceProfile): ReadonlyArray<string> {
    const c = profile.characteristics;
    const traits: string[] = [];

    if (c.prefersShortSentences) traits.push("偏好短句");
    if (c.usesEllipsis) traits.push("常用省略号");
    if (c.emotionalRange === "expressive") traits.push("情感丰富");
    if (c.emotionalRange === "restricted") traits.push("情感克制");
    if (c.detailLevel === "rich") traits.push("细节丰富");
    if (c.detailLevel === "sparse") traits.push("言简意赅");

    return traits;
  }

  /**
   * Generate voice suggestions
   */
  private async generateVoiceSuggestions(profile: VoiceProfile): Promise<ReadonlyArray<string>> {
    const suggestions: string[] = [];

    const c = profile.characteristics;

    // Analyze profile and suggest improvements
    if (profile.sampleSources.length < 5) {
      suggestions.push("建议提供更多文字样本，以建立更准确的语言风格档案");
    }

    if (c.idiosyncraticPhrases.length === 0) {
      suggestions.push("可以尝试提供更自然的对话内容，以捕捉个性化表达");
    }

    if (c.dialect.length === 0 && c.eraMarkers.length === 0) {
      suggestions.push("可以提供一些涉及家乡话题或时代回忆的内容");
    }

    return suggestions;
  }

  // Utility functions

  private average(numbers: ReadonlyArray<number>): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  private mostFrequent<T>(items: ReadonlyArray<T>): T | undefined {
    const counts = new Map<T, number>();
    for (const item of items) {
      counts.set(item, (counts.get(item) ?? 0) + 1);
    }
    let maxCount = 0;
    let mostFrequent: T | undefined;
    for (const [item, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = item;
      }
    }
    return mostFrequent;
  }

  private mode<T>(items: ReadonlyArray<T>): T | undefined {
    return this.mostFrequent(items);
  }

  private aggregateStringArrays(arrays: ReadonlyArray<ReadonlyArray<string>>): ReadonlyArray<string> {
    const frequency = new Map<string, number>();
    for (const arr of arrays) {
      for (const item of arr) {
        frequency.set(item, (frequency.get(item) ?? 0) + 1);
      }
    }
    // Return items that appear in at least 30% of arrays
    const threshold = Math.max(1, Math.ceil(arrays.length * 0.3));
    return Array.from(frequency.entries())
      .filter(([_, count]) => count >= threshold)
      .map(([item]) => item);
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}
