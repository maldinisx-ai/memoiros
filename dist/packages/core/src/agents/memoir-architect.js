/**
 * MemoirArchitect Agent
 *
 * 基于 UserProfile 生成回忆录大纲
 * 适配自 inkos Architect Agent
 */
import { BaseAgent } from "./base.js";
export class MemoirArchitectAgent extends BaseAgent {
    get name() {
        return "memoir-architect";
    }
    async generateOutline(request) {
        const targetChapters = request.targetChapters ?? 10;
        const structure = request.structure ?? this.determineBestStructure(request.profile);
        // 构建上下文
        const context = this.buildContext(request.profile);
        // 生成系统提示
        const systemPrompt = this.buildSystemPrompt(structure, targetChapters);
        // 生成用户提示
        const userPrompt = this.buildUserPrompt(context, targetChapters, structure);
        const response = await this.chat([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ], { temperature: 0.5, maxTokens: 8192 });
        // 解析输出
        const parsed = this.parseOutput(response.content, request.profile, targetChapters, structure);
        return parsed;
    }
    determineBestStructure(profile) {
        // 如果有明确的时间线，优先用时间顺序
        if (profile.timeline.length > 10) {
            return "chronological";
        }
        // 如果有明确的主题，考虑用主题结构
        if (profile.themes.length > 3) {
            return "thematic";
        }
        // 默认混合结构
        return "mixed";
    }
    buildContext(profile) {
        const basicInfo = profile.basicInfo;
        const info = [
            basicInfo.birthYear ? `出生年份：${basicInfo.birthYear}` : "",
            (basicInfo.birthPlace) ? `出生地点：${basicInfo.birthPlace}` : "",
            basicInfo.education ? `教育背景：${basicInfo.education}` : "",
            basicInfo.career ? `职业经历：${basicInfo.career}` : "",
        ].filter(Boolean).join("\n");
        const themes = profile.themes.map(t => `- ${t.name}: ${t.description}`).join("\n");
        const storyStructure = profile.storyStructure;
        const structure = storyStructure ? `
## 故事结构
- 开篇：${storyStructure.opening?.title || "暂无"}
- 发展：${storyStructure.development?.map(d => d.title).join("、") || "暂无"}
- 高潮：${storyStructure.climax?.title || "暂无"}
- 结尾：${storyStructure.resolution?.title || "暂无"}
` : "";
        const timelinePreview = profile.timeline.slice(0, 20).map(e => {
            const date = this.formatEventDate(e.date);
            return `- ${date}: ${e.title}`;
        }).join("\n");
        return `## 基本信息
${info || "暂无"}

## 核心主题
${themes || "暂无"}
${structure}
## 时间线预览（前20个事件）
${timelinePreview || "暂无"}`;
    }
    buildSystemPrompt(structure, targetChapters) {
        const structureDesc = {
            chronological: "按时间顺序组织，从童年到老年，线性讲述人生故事",
            thematic: "按主题组织，如家庭、事业、友情等，每个主题独立成章",
            mixed: "混合结构，主线按时间推进，局部穿插主题深度挖掘",
        };
        return `你是一位专业的回忆录策划编辑。你的任务是基于用户的人生经历，设计一本引人入胜的回忆录大纲。

## 回忆录结构
当前采用：${structureDesc[structure]}

## 大纲设计原则
1. **叙事弧线**：确保有清晰的起承转合，避免流水账
2. **重点突出**：识别人生中的转折点和高光时刻，重点着墨
3. **节奏平衡**：合理安排详略，重要事件详写，过渡时期简写
4. **情感层次**：从事件到感悟，层层递进
5. **时代背景**：将个人经历与时代变迁相结合，增加厚度

## 章节规划
- 目标章节数：${targetChapters}章
- 每章字数：2500-3500字
- 总字数预期：${targetChapters * 3000}字左右

## 输出格式
=== MEMOIR_TITLE ===
(回忆录标题）

=== MEMOIR_SUBTITLE ===
(副标题/一句话简介）

=== MEMOIR_SUMMARY ===
(200字左右的简介，概括整本回忆录的核心内容和亮点)

=== MAIN_THEMES ===
(列出3-5个核心主题，每行一个)

=== CHAPTER_OUTLINE ===
(逐章大纲，格式如下)
## 第N章：章节标题
**时间跨度**：XXXX年 - XXXX年
**核心焦点**：一句话概括本章主要内容
**关键事件**：
- 事件1
- 事件2
**预计字数**：XXXX字

（重复以上格式，列出所有章节）`;
    }
    buildUserPrompt(context, targetChapters, structure) {
        return `请基于以下人生经历，设计一本${targetChapters}章的回忆录大纲。

${context}

## 设计要求
1. 标题要简洁有力，能体现回忆录的核心主题
2. 副标题用一句话概括全书精华
3. 简介要吸引读者，突出亮点
4. 章节划分要合理，每章有明确焦点
5. 关键事件要覆盖，但不必面面俱到`;
    }
    parseOutput(content, profile, targetChapters, actualStructure) {
        const extract = (tag) => {
            const regex = new RegExp(`=== ${tag} ===\\s*([\\s\\S]*?)(?==== [A-Z_]+ ===|$)`);
            const match = content.match(regex);
            return match?.[1]?.trim() ?? "";
        };
        const title = extract("MEMOIR_TITLE") || "我的人生回忆录";
        const subtitle = extract("MEMOIR_SUBTITLE") || "一段值得铭记的人生旅程";
        const summary = extract("MEMOIR_SUMMARY") || "";
        const mainThemesRaw = extract("MAIN_THEMES");
        const themes = mainThemesRaw
            .split("\n")
            .map(line => line.replace(/^[-*]\s*/, "").trim())
            .filter(Boolean);
        const chapterOutlineRaw = extract("CHAPTER_OUTLINE");
        const chapters = this.parseChapterOutline(chapterOutlineRaw, targetChapters);
        return {
            title,
            subtitle,
            summary,
            structure: actualStructure,
            chapters,
            themes,
        };
    }
    parseChapterOutline(raw, targetChapters) {
        const chapters = [];
        const chapterRegex = /##\s*第(\d+)章[：:]\s*(.+?)\n([\s\S]*?)(?=##\s*第\d+章|$)/g;
        let match;
        let count = 0;
        while ((match = chapterRegex.exec(raw)) !== null && count < targetChapters) {
            const chapterNumber = parseInt(match[1] || "0", 10);
            const chapterTitle = (match[2] || "").trim();
            const body = (match[3] || "").trim();
            // 提取时间跨度
            const periodMatch = body.match(/\*?\*?时间跨度\*?\*?\s*[：:]\s*(.+)/i);
            const periodRaw = periodMatch ? periodMatch[1]?.trim() : "未定";
            const period = this.parsePeriod(periodRaw);
            // 提取核心焦点
            const focusMatch = body.match(/\*?\*?核心焦点\*?\*?\s*[：:]\s*(.+)/i);
            const focus = focusMatch ? focusMatch[1]?.trim() : chapterTitle;
            // 提取关键事件
            const eventsMatch = body.match(/\*?\*?关键事件\*?\*?\s*[：:]\s*\n([\s\S]*?)(?=\*?\*?|\n\n|$)/i);
            const eventsRaw = eventsMatch ? eventsMatch[1]?.trim() : "";
            const keyEvents = eventsRaw
                .split("\n")
                .map(line => line.replace(/^[-*]\s*/, "").trim())
                .filter(Boolean);
            // 提取预计字数
            const wordsMatch = body.match(/\*?\*?预计字数\*?\*?\s*[：:]\s*(\d+)/i);
            const estimatedWords = wordsMatch ? parseInt(wordsMatch[1] || "3000", 10) : 3000;
            chapters.push({
                chapterNumber,
                title: chapterTitle,
                period,
                focus,
                keyEvents,
                estimatedWords,
            });
            count++;
        }
        // 如果解析失败，返回默认大纲
        if (chapters.length === 0) {
            return this.generateDefaultOutline(targetChapters);
        }
        return chapters;
    }
    parsePeriod(raw) {
        // 尝试解析 "XXXX年 - XXXX年" 格式
        const match = raw.match(/(\d{4})年?\s*[—-至]\s*(\d{4})年?/);
        if (match) {
            return {
                start: `${match[1]}年`,
                end: `${match[2]}年`,
            };
        }
        // 简单返回原始文本
        const parts = raw.split(/[—-至]/);
        return {
            start: parts[0]?.trim() || "初期",
            end: parts[1]?.trim() || "后期",
        };
    }
    generateDefaultOutline(targetChapters) {
        const chapters = [];
        const decadeSpan = Math.floor(80 / targetChapters);
        for (let i = 0; i < targetChapters; i++) {
            const startYear = i * decadeSpan;
            const endYear = (i + 1) * decadeSpan;
            chapters.push({
                chapterNumber: i + 1,
                title: `第${i + 1}阶段`,
                period: {
                    start: `${startYear === 0 ? "出生" : startYear + "岁"}`,
                    end: `${endYear}岁`,
                },
                focus: `人生第${i + 1}阶段的重要经历`,
                keyEvents: [],
                estimatedWords: 3000,
            });
        }
        return chapters;
    }
    formatEventDate(date) {
        if (date.type === "exact") {
            if (date.month && date.day) {
                return `${date.year}年${date.month}月${date.day}日`;
            }
            if (date.month) {
                return `${date.year}年${date.month}月`;
            }
            return `${date.year}年`;
        }
        else if (date.type === "approximate") {
            return `约${date.year}年`;
        }
        else {
            return date.description || date.era || "某时期";
        }
    }
}
//# sourceMappingURL=memoir-architect.js.map