/**
 * Timeline Builder Agent
 *
 * Extracts events from interview answers and builds a chronological timeline
 */
import { z } from "zod";
import { BaseAgent } from "./base.js";
/**
 * Zod schema for event extraction
 */
const EventExtractionSchema = z.object({
    events: z.array(z.object({
        date: z.object({
            type: z.enum(["exact", "era", "approximate"]),
            year: z.number().optional(),
            month: z.number().min(1).max(12).optional(),
            day: z.number().min(1).max(31).optional(),
            era: z.string().optional(),
            range: z.number().optional(),
        }),
        title: z.string().min(3),
        description: z.string().min(10),
        category: z.enum([
            "birth", "education", "career", "family", "residence",
            "travel", "health", "achievement", "milestone", "historical_context"
        ]),
        importance: z.enum(["critical", "high", "medium", "low"]),
        confidence: z.number().min(0).max(1),
        tags: z.array(z.string()).optional(),
    })),
});
/**
 * Zod schema for conflict detection
 */
const ConflictDetectionSchema = z.object({
    conflicts: z.array(z.object({
        type: z.enum(["date_overlap", "impossible_sequence", "age_mismatch", "contradiction"]),
        severity: z.enum(["critical", "warning", "info"]),
        description: z.string(),
        involvedEventIds: z.array(z.string()),
        suggestion: z.string().optional(),
    })),
});
/**
 * Zod schema for gap analysis
 */
const GapAnalysisSchema = z.object({
    gaps: z.array(z.object({
        startYear: z.number(),
        endYear: z.number(),
        duration: z.number(),
        severity: z.enum(["critical", "warning", "info"]),
        description: z.string(),
        suggestedQuestions: z.array(z.string()),
    })),
});
/**
 * Timeline Builder Agent
 */
export class TimelineBuilderAgent extends BaseAgent {
    get name() {
        return "timeline-builder";
    }
    /**
     * Build timeline from interview answers
     */
    async buildTimeline(request) {
        this.log?.info(`[TimelineBuilder] Building timeline for user: ${request.userId}`);
        // Step 1: Extract events from answers
        const extractedEvents = await this.extractEventsFromAnswers(request);
        // Step 2: Merge with existing timeline (if any)
        const mergedEvents = request.existingTimeline
            ? this.mergeEvents(extractedEvents, request.existingTimeline.events)
            : extractedEvents;
        // Step 3: Detect conflicts
        const conflicts = request.options?.detectConflicts !== false
            ? await this.detectConflicts(mergedEvents)
            : [];
        // Step 4: Identify gaps
        const gaps = request.options?.identifyGaps !== false
            ? await this.identifyGaps(mergedEvents)
            : [];
        // Step 5: Build metadata
        const metadata = this.buildMetadata(mergedEvents, conflicts, gaps);
        // Step 6: Create timeline
        const timeline = {
            timelineId: this.generateId("timeline"),
            userId: request.userId,
            events: mergedEvents,
            metadata,
            conflicts,
            gaps,
        };
        this.log?.info(`[TimelineBuilder] Built timeline with ${mergedEvents.length} events`);
        return {
            timeline,
            addedEvents: extractedEvents.length,
            updatedEvents: request.existingTimeline ? mergedEvents.length - extractedEvents.length : 0,
            conflictsFound: conflicts.length,
            gapsIdentified: gaps.length,
            summary: this.generateSummary(timeline),
        };
    }
    /**
     * Extract events from interview answers
     */
    async extractEventsFromAnswers(request) {
        const allEvents = [];
        for (const { answerId, answer } of request.interviewAnswers) {
            const events = await this.extractEventsFromAnswer(answer, answerId);
            allEvents.push(...events);
        }
        // Sort by date
        return this.sortEventsByDate(allEvents);
    }
    /**
     * Extract events from a single answer
     */
    async extractEventsFromAnswer(answer, sourceAnswerId) {
        const systemPrompt = `你是一个事件提取专家。请从用户的回答中提取人生事件。

对于每个事件，请提取：
1. 日期（尽可能精确，不精确时标注 era 或 approximate）
2. 事件标题（简短概括）
3. 事件描述（详细说明）
4. 事件类型（education, career, family, residence, travel, health, achievement, milestone）
5. 重要程度（critical=人生转折点, high=重要事件, medium=一般事件, low=细节）
6. 置信度（0-1之间）

输出格式（JSON）：
{
  "events": [
    {
      "date": {
        "type": "exact|era|approximate",
        "year": 1985,
        "month": 9,
        "day": 1
      },
      "title": "出生",
      "description": "出生于湖北省某县城",
      "category": "birth",
      "importance": "critical",
      "confidence": 0.95,
      "tags": ["童年", "家乡"]
    }
  ]
}

日期类型说明：
- exact: 确切日期（有具体年月日或年月）
- era: 时代描述（如"80年代"、"童年时期"、"文革期间"）
- approximate: 近似年份（如"大约1990年"、"90年代初"）`;
        try {
            const response = await this.chat([
                { role: "system", content: systemPrompt },
                { role: "user", content: `从以下回答中提取事件：\n\n${answer}` }
            ], { temperature: 0.3 });
            const parsed = EventExtractionSchema.parse(JSON.parse(response.content));
            return parsed.events.map((e, i) => ({
                eventId: this.generateId(`evt_${sourceAnswerId}_${i}`),
                date: this.normalizeDate(e.date),
                title: e.title,
                description: e.description,
                category: e.category,
                importance: e.importance,
                confidence: e.confidence,
                sourceAnswerIds: [sourceAnswerId],
                tags: e.tags,
                relatedEvents: [],
            }));
        }
        catch (error) {
            this.log?.error(`[TimelineBuilder] Event extraction failed: ${error}`);
            return [];
        }
    }
    /**
     * Normalize date to TimelineDate format
     */
    normalizeDate(date) {
        if (date.type === "exact" && date.year !== undefined) {
            return {
                type: "exact",
                year: date.year,
                month: date.month,
                day: date.day,
            };
        }
        else if (date.type === "era" && date.era) {
            return {
                type: "era",
                era: date.era,
                description: `${date.era}`,
            };
        }
        else if (date.type === "approximate" && date.year !== undefined) {
            return {
                type: "approximate",
                year: date.year,
                range: date.range ?? 2,
            };
        }
        // Fallback to era
        return {
            type: "era",
            era: "未知时期",
            description: "时间信息不明确",
        };
    }
    /**
     * Sort events by date
     */
    sortEventsByDate(events) {
        return [...events].sort((a, b) => {
            const yearA = this.extractYear(a.date);
            const yearB = this.extractYear(b.date);
            return yearA - yearB;
        });
    }
    /**
     * Extract year from TimelineDate for sorting
     */
    extractYear(date) {
        switch (date.type) {
            case "exact":
                return date.year ?? 0;
            case "approximate":
                return date.year ?? 0;
            case "era":
                // Try to extract year from era string
                const match = date.era?.match(/\d{4}/);
                return match ? parseInt(match[0], 10) : 0;
        }
    }
    /**
     * Merge new events with existing events
     */
    mergeEvents(newEvents, existingEvents) {
        const merged = [...existingEvents];
        const existingIds = new Set(existingEvents.map(e => e.eventId));
        for (const newEvent of newEvents) {
            // Check for similar events
            const similarIndex = merged.findIndex(e => this.areEventsSimilar(e, newEvent));
            if (similarIndex !== -1) {
                // Merge similar events
                const existing = merged[similarIndex];
                merged[similarIndex] = {
                    ...existing,
                    description: `${existing.description}\n${newEvent.description}`,
                    sourceAnswerIds: [...existing.sourceAnswerIds, ...newEvent.sourceAnswerIds],
                    confidence: Math.max(existing.confidence, newEvent.confidence),
                    tags: [...(existing.tags ?? []), ...(newEvent.tags ?? [])],
                };
            }
            else if (!existingIds.has(newEvent.eventId)) {
                merged.push(newEvent);
            }
        }
        return this.sortEventsByDate(merged);
    }
    /**
     * Check if two events are similar (potential duplicates)
     */
    areEventsSimilar(a, b) {
        // Same category and similar title
        const titleSimilarity = this.stringSimilarity(a.title, b.title);
        const sameCategory = a.category === b.category;
        const yearSimilar = Math.abs(this.extractYear(a.date) - this.extractYear(b.date)) <= 1;
        return (sameCategory && titleSimilarity > 0.7) || (sameCategory && yearSimilar);
    }
    /**
     * Calculate string similarity (simple version)
     */
    stringSimilarity(a, b) {
        const longer = a.length > b.length ? a : b;
        const shorter = a.length > b.length ? b : a;
        if (longer.length === 0)
            return 1.0;
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }
    /**
     * Levenshtein distance
     */
    levenshteinDistance(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                }
                else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1, // insertion
                    matrix[i - 1][j] + 1 // deletion
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    }
    /**
     * Detect conflicts in timeline
     */
    async detectConflicts(events) {
        const conflicts = [];
        // Check for date overlaps (events that can't both be true)
        const exactEvents = events.filter(e => e.date.type === "exact");
        for (let i = 0; i < exactEvents.length; i++) {
            for (let j = i + 1; j < exactEvents.length; j++) {
                const a = exactEvents[i];
                const b = exactEvents[j];
                if (this.areEventsConflicting(a, b)) {
                    conflicts.push({
                        conflictId: this.generateId("conflict"),
                        type: "date_overlap",
                        severity: "warning",
                        description: `事件时间冲突："${a.title}"和"${b.title}"可能发生在同一时间`,
                        involvedEventIds: [a.eventId, b.eventId],
                        suggestion: "请核实这两个事件的具体时间",
                    });
                }
            }
        }
        // Use LLM for deeper conflict detection
        const llmConflicts = await this.detectLLMConflicts(events);
        conflicts.push(...llmConflicts);
        return conflicts;
    }
    /**
     * Check if two events conflict
     */
    areEventsConflicting(a, b) {
        // Same category, same year, different titles = potential conflict
        if (a.category === b.category && a.title !== b.title) {
            const yearA = this.extractYear(a.date);
            const yearB = this.extractYear(b.date);
            if (yearA === yearB && yearA !== 0) {
                return true;
            }
        }
        return false;
    }
    /**
     * Use LLM to detect deeper conflicts
     */
    async detectLLMConflicts(events) {
        const eventsSummary = events.map(e => `- [${e.category}] ${e.title} (${this.formatDate(e.date)})`).join("\n");
        const systemPrompt = `你是一个时间线逻辑检查专家。请检查以下人生事件是否存在逻辑冲突。

检查内容：
1. 年龄合理性（如：5岁上大学）
2. 时间顺序（如：毕业在入学之前）
3. 地理冲突（如：同时在北京和上海）
4. 事件矛盾（如：同年结婚和离婚）

输出格式（JSON）：
{
  "conflicts": [
    {
      "type": "impossible_sequence|age_mismatch|contradiction",
      "severity": "critical|warning|info",
      "description": "冲突描述",
      "involvedEventIds": ["事件1标题", "事件2标题"],
      "suggestion": "建议如何解决"
    }
  ]
}`;
        try {
            const response = await this.chat([
                { role: "system", content: systemPrompt },
                { role: "user", content: `检查以下事件的时间线逻辑：\n\n${eventsSummary}` }
            ], { temperature: 0.3 });
            const parsed = ConflictDetectionSchema.parse(JSON.parse(response.content));
            return parsed.conflicts.map((c, i) => ({
                conflictId: this.generateId(`llm_conflict_${i}`),
                ...c,
                involvedEventIds: c.involvedEventIds, // These are titles, not IDs - will need mapping
            }));
        }
        catch (error) {
            this.log?.error(`[TimelineBuilder] LLM conflict detection failed: ${error}`);
            return [];
        }
    }
    /**
     * Identify gaps in timeline
     */
    async identifyGaps(events) {
        if (events.length < 2) {
            return [];
        }
        const gaps = [];
        const sortedEvents = this.sortEventsByDate(events);
        for (let i = 0; i < sortedEvents.length - 1; i++) {
            const current = sortedEvents[i];
            const next = sortedEvents[i + 1];
            const yearCurrent = this.extractYear(current.date);
            const yearNext = this.extractYear(next.date);
            const gap = yearNext - yearCurrent;
            // Gap of 3+ years is notable
            if (gap >= 3 && yearCurrent > 0 && yearNext > 0) {
                gaps.push({
                    gapId: this.generateId(`gap_${i}`),
                    startYear: yearCurrent,
                    endYear: yearNext,
                    duration: gap,
                    severity: gap >= 5 ? "warning" : "info",
                    description: `${yearCurrent}年到${yearNext}年之间有${gap}年的空白期`,
                    suggestedQuestions: await this.generateGapQuestions(yearCurrent, yearNext),
                });
            }
        }
        return gaps;
    }
    /**
     * Generate questions for timeline gaps
     */
    async generateGapQuestions(startYear, endYear) {
        const systemPrompt = `用户时间线中，${startYear}年到${endYear}年之间有${endYear - startYear}年的空白期。

请生成3-5个问题，帮助用户回忆这段时期发生了什么。

输出格式（JSON）：
{
  "questions": ["问题1", "问题2", "问题3"]
}`;
        try {
            const response = await this.chat([
                { role: "system", content: systemPrompt },
                { role: "user", content: "请生成引导性问题" }
            ], { temperature: 0.7 });
            const parsed = JSON.parse(response.content);
            return parsed.questions ?? [];
        }
        catch (error) {
            this.log?.error(`[TimelineBuilder] Gap question generation failed: ${error}`);
            return [
                `在${startYear}年到${endYear}年之间，您在做什么？`,
                `这段时间有什么重要的事情发生吗？`,
            ];
        }
    }
    /**
     * Build timeline metadata
     */
    buildMetadata(events, conflicts, gaps) {
        const years = events.map(e => this.extractYear(e.date)).filter(y => y > 0);
        const earliestYear = Math.min(...years, new Date().getFullYear());
        const latestYear = Math.max(...years, new Date().getFullYear());
        const birthEvent = events.find(e => e.category === "birth");
        const birthYear = birthEvent ? this.extractYear(birthEvent.date) : undefined;
        return {
            birthYear,
            deathYear: undefined,
            earliestYear,
            latestYear,
            totalEvents: events.length,
            verifiedEvents: events.filter(e => e.verified).length,
            eraSummaries: this.buildEraSummaries(events, earliestYear, latestYear),
        };
    }
    /**
     * Build era summaries
     */
    buildEraSummaries(events, startYear, endYear) {
        const eras = [];
        const eraSize = 5; // 5-year eras
        for (let year = startYear; year <= endYear; year += eraSize) {
            const eraEnd = Math.min(year + eraSize - 1, endYear);
            const eraEvents = events.filter(e => {
                const eventYear = this.extractYear(e.date);
                return eventYear >= year && eventYear <= eraEnd;
            });
            if (eraEvents.length > 0) {
                eras.push({
                    era: `${year}s初`,
                    startYear: year,
                    endYear: eraEnd,
                    eventCount: eraEvents.length,
                    dominantThemes: this.extractThemes(eraEvents),
                    lifeStage: this.determineLifeStage(year, startYear),
                });
            }
        }
        return eras;
    }
    /**
     * Extract dominant themes from events
     */
    extractThemes(events) {
        const categoryCount = {};
        for (const event of events) {
            categoryCount[event.category] = (categoryCount[event.category] ?? 0) + 1;
        }
        return Object.entries(categoryCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([category]) => category);
    }
    /**
     * Determine life stage for a year
     */
    determineLifeStage(year, birthYear) {
        const age = year - birthYear;
        if (age < 6)
            return "幼儿期";
        if (age < 12)
            return "童年期";
        if (age < 18)
            return "青春期";
        if (age < 25)
            return "青年期";
        if (age < 40)
            return "壮年期";
        if (age < 60)
            return "中年期";
        return "老年期";
    }
    /**
     * Format date for display
     */
    formatDate(date) {
        switch (date.type) {
            case "exact":
                if (date.day && date.month) {
                    return `${date.year}年${date.month}月${date.day}日`;
                }
                else if (date.month) {
                    return `${date.year}年${date.month}月`;
                }
                return `${date.year}年`;
            case "approximate":
                return `约${date.year}年（±${date.range}年）`;
            case "era":
                return date.era;
        }
    }
    /**
     * Generate summary
     */
    generateSummary(timeline) {
        const { metadata, conflicts, gaps } = timeline;
        return `时间线已构建：
- 时间跨度：${metadata.earliestYear}年 - ${metadata.latestYear}年（${metadata.latestYear - metadata.earliestYear + 1}年）
- 事件总数：${metadata.totalEvents}
- 已验证事件：${metadata.verifiedEvents}
- 发现冲突：${conflicts.length}个
- 发现空白：${gaps.length}个`;
    }
    /**
     * Generate unique ID
     */
    generateId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }
}
//# sourceMappingURL=timeline-builder.js.map