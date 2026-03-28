/**
 * Fact Verifier Agent
 *
 * Verifies historical facts, timelines, and era context using web sources
 */
import { BaseAgent } from "./base.js";
import { BrowseClient } from "../utils/browse-client.js";
/**
 * Fact Verifier Agent
 *
 * Verifies user-provided facts against historical records
 */
export class FactVerifierAgent extends BaseAgent {
    browseClient;
    constructor(ctx) {
        super(ctx);
        try {
            this.browseClient = new BrowseClient();
        }
        catch {
            this.log?.warn("[FactVerifier] gstack browse not available, using LLM-only mode");
            this.browseClient = null;
        }
    }
    get name() {
        return "fact-verifier";
    }
    /**
     * Verify a fact statement
     */
    async verify(request) {
        this.log?.info(`[FactVerifier] Verifying: ${request.fact.slice(0, 60)}...`);
        // Step 1: Extract entities from the fact
        const entities = this.extractEntities(request.fact);
        this.log?.info(`[FactVerifier] Extracted entities:`, JSON.stringify(entities, null, 2));
        // Step 2: Determine verification strategy
        const strategy = this.determineStrategy(request, entities);
        this.log?.info(`[FactVerifier] Strategy: ${strategy.type}`);
        // Step 3: Execute verification based on strategy
        const result = await this.executeVerification(request, entities, strategy);
        this.log?.info(`[FactVerifier] Result: ${result.status} (${result.confidence.toFixed(2)})`);
        return result;
    }
    /**
     * Extract entities from a fact statement
     */
    extractEntities(fact) {
        const entities = {};
        // Extract years (4-digit numbers, 1900-2099)
        const yearMatches = fact.match(/\b(19|20)\d{2}\b/g);
        if (yearMatches) {
            entities.years = yearMatches.map(Number).filter(y => y >= 1900 && y <= 2099);
        }
        // Extract common location keywords
        const locationKeywords = [
            "北京", "上海", "广州", "深圳", "武汉", "成都", "西安", "南京",
            "Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Wuhan", "Chengdu",
            "中国", "China", "镇上", "县城", "农村"
        ];
        entities.locations = locationKeywords.filter(kw => fact.includes(kw));
        // Extract event keywords
        const eventKeywords = [
            "交粮", "公粮", "农业税", "文革", "改革开放", "高考",
            "奥运会", "世界杯", "疫情", "封城", "地震", "洪水"
        ];
        entities.events = eventKeywords.filter(kw => fact.includes(kw));
        return entities;
    }
    /**
     * Determine verification strategy
     */
    determineStrategy(request, entities) {
        // If era research is disabled, use LLM only
        if (request.options?.enableWebVerification === false) {
            return { type: "llm_only", sources: [] };
        }
        // If we have specific entities, use targeted search
        if (entities.events && entities.events.length > 0) {
            return {
                type: "targeted_search",
                sources: this.buildSourcesForEvents(entities.events)
            };
        }
        // If we have years but no specific events, use era context
        if (entities.years && entities.years.length > 0) {
            return {
                type: "era_context",
                sources: this.buildSourcesForEra(entities.years[0])
            };
        }
        // Default: general search
        return {
            type: "general_search",
            sources: ["baidu", "wikipedia"]
        };
    }
    /**
     * Build sources for specific events
     */
    buildSourcesForEvents(events) {
        const sources = [];
        for (const event of events) {
            // Map events to their primary information sources
            const eventSources = {
                "交粮": "https://baike.baidu.com/item/农业税",
                "公粮": "https://baike.baidu.com/item/农业税",
                "农业税": "https://baike.baidu.com/item/农业税",
                "改革开放": "https://baike.baidu.com/item/改革开放",
                "高考": "https://baike.baidu.com/item/高考",
            };
            const source = eventSources[event];
            if (source && !sources.includes(source)) {
                sources.push(source);
            }
        }
        // Always add general sources as fallback
        return sources.length > 0 ? sources : ["baidu", "wikipedia"];
    }
    /**
     * Build sources for a specific era
     */
    buildSourcesForEra(year) {
        // Map eras to relevant sources
        if (year >= 1949 && year < 1978) {
            return ["https://baike.baidu.com/item/计划经济"];
        }
        else if (year >= 1978 && year < 2000) {
            return ["https://baike.baidu.com/item/改革开放"];
        }
        else if (year >= 2000 && year < 2008) {
            return ["https://baike.baidu.com/item/中国加入世界贸易组织"];
        }
        else if (year >= 2008 && year < 2020) {
            return ["https://baike.baidu.com/item/2008年北京奥运会"];
        }
        else if (year >= 2020) {
            return ["https://baike.baidu.com/item/新型冠状病毒肺炎"];
        }
        return ["baidu", "wikipedia"];
    }
    /**
     * Execute verification based on strategy
     */
    async executeVerification(request, entities, strategy) {
        // Step 1: Get LLM judgment first (fast, zero cost)
        const llmJudgment = await this.getLLMJudgment(request, entities);
        // If high confidence and LLM-only mode, return early
        if (strategy.type === "llm_only" && llmJudgment.confidence >= 0.9) {
            return llmJudgment;
        }
        // Step 2: Use browse to verify (if available)
        const browseResults = this.browseClient
            ? await this.verifyWithBrowse(request, entities, strategy.sources)
            : {};
        // Step 3: Combine LLM and browse results
        return this.combineResults(llmJudgment, browseResults);
    }
    /**
     * Get LLM judgment on the fact
     */
    async getLLMJudgment(request, entities) {
        const systemPrompt = `你是一个事实验证专家。请判断用户提供的陈述是否正确。

要求：
1. 给出判断：PASS（正确）/WARNING（可能有问题）/FAIL（错误）
2. 提供置信度（0-1之间的小数）
3. 如果错误或警告，说明原因和建议

输出格式（JSON）：
{
  "status": "PASS|WARNING|FAIL",
  "summary": "一句话总结",
  "confidence": 0.95,
  "issues": [
    {
      "severity": "critical|warning|info",
      "category": "timeline|era_context|entity|logic|general",
      "description": "具体问题",
      "suggestion": "修改建议"
    }
  ],
  "suggestions": ["建议1", "建议2"]
}`;
        const userPrompt = `请验证以下陈述：

"${request.fact}"

${request.context ? `背景信息：${JSON.stringify(request.context)}` : ""}
${entities ? `提取的实体：${JSON.stringify(entities)}` : ""}`;
        try {
            const response = await this.chat([
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ], { temperature: 0.3 });
            return this.parseVerificationResult(response.content, request.fact);
        }
        catch (error) {
            this.log?.error(`[FactVerifier] LLM judgment failed: ${error}`);
            return {
                status: "WARNING",
                fact: request.fact,
                summary: "LLM判断失败，需要人工核实",
                issues: [],
                sources: [],
                confidence: 0,
                suggestions: ["请人工核实此陈述"],
            };
        }
    }
    /**
     * Verify using browse tool
     */
    async verifyWithBrowse(request, entities, sources) {
        if (!this.browseClient) {
            return { sources: [] };
        }
        const searchResults = await this.browseClient.searchAndExtract(request.fact.slice(0, 50), // Use first 50 chars as search query
        sources);
        if (searchResults.length === 0) {
            this.log?.warn("[FactVerifier] No browse results");
            return { sources: [] };
        }
        // Use LLM to analyze browse results
        const analysisPrompt = `基于以下搜索结果，验证陈述是否正确：

陈述："${request.fact}"

搜索结果：
${searchResults.map((r, i) => `
来源 ${i + 1}：${r.title || r.url}
URL：${r.url}
内容：${r.content.slice(0, 1000)}...
`).join("\n")}

请判断：
1. 陈述是否与搜索结果一致？
2. 如果不一致，具体哪里有问题？
3. 给出验证结论和建议

输出格式（JSON）：
{
  "status": "PASS|WARNING|FAIL",
  "summary": "验证结论",
  "issues": [...],
  "suggestions": [...]
}`;
        try {
            const response = await this.chat([
                { role: "system", content: "你是事实验证专家，基于搜索结果判断陈述的真实性。" },
                { role: "user", content: analysisPrompt }
            ], { temperature: 0.3 });
            const partialResult = this.parseVerificationResult(response.content, request.fact);
            // Add sources from browse results
            const verificationSources = searchResults.map(r => ({
                url: r.url,
                title: r.title || r.url,
                excerpt: r.content.slice(0, 200),
                reliability: 0.8, // Base reliability
            }));
            return {
                ...partialResult,
                sources: verificationSources,
            };
        }
        catch (error) {
            this.log?.error(`[FactVerifier] Browse analysis failed: ${error}`);
            return {
                sources: searchResults.map(r => ({
                    url: r.url,
                    title: r.title || r.url,
                    excerpt: r.content.slice(0, 200),
                    reliability: 0.5,
                })),
            };
        }
    }
    /**
     * Combine LLM and browse results
     */
    combineResults(llmResult, browseResult) {
        // If browse has sources, use browse result with higher confidence
        if (browseResult.sources && browseResult.sources.length > 0) {
            return {
                ...llmResult,
                ...browseResult,
                confidence: Math.min(llmResult.confidence + 0.2, 1.0), // Boost confidence with web verification
                sources: browseResult.sources || [],
            };
        }
        // Otherwise return LLM result
        return llmResult;
    }
    /**
     * Parse verification result from LLM response
     */
    parseVerificationResult(content, fact) {
        try {
            // Try to extract JSON
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    status: parsed.status ?? "WARNING",
                    fact,
                    summary: parsed.summary ?? "",
                    issues: parsed.issues ?? [],
                    sources: [],
                    confidence: parsed.confidence ?? 0.5,
                    suggestions: parsed.suggestions ?? [],
                };
            }
        }
        catch (error) {
            this.log?.warn(`[FactVerifier] Failed to parse result: ${error}`);
        }
        // Fallback
        return {
            status: "WARNING",
            fact,
            summary: "无法解析验证结果",
            issues: [],
            sources: [],
            confidence: 0,
            suggestions: ["请人工核实"],
        };
    }
}
//# sourceMappingURL=fact-verifier.js.map