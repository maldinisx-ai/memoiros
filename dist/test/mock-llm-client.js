/**
 * Mock LLM Client for Testing
 *
 * Returns appropriate mock responses based on the request context
 */
export function createMockLLMClient() {
    return {
        provider: "test-mock",
        chat: async (messages) => {
            const systemPrompt = messages.find(m => m.role === "system")?.content ?? "";
            const userPrompt = messages.find(m => m.role === "user")?.content ?? "";
            // Interviewer: Question generation
            if (systemPrompt.includes("采访者") && systemPrompt.includes("生成合适的采访问题")) {
                return {
                    content: JSON.stringify({
                        questions: [{
                                question: "您能介绍一下您的童年吗？比如出生在哪里，哪一年出生的？",
                                questionType: "open",
                                targetEntities: ["year", "location"],
                                priority: "high",
                            }],
                        suggestedTopics: ["童年记忆", "家乡", "家庭"],
                        followupAreas: [],
                    }),
                };
            }
            // Interviewer: Question generation (warmup phase)
            if (systemPrompt.includes("warmup") && systemPrompt.includes("热身")) {
                return {
                    content: JSON.stringify({
                        questions: [{
                                question: "您能介绍一下您的童年吗？小时候在哪里长大的？",
                                questionType: "open",
                                targetEntities: ["year", "location"],
                                priority: "high",
                            }],
                        suggestedTopics: ["童年记忆"],
                        followupAreas: [],
                    }),
                };
            }
            // Interviewer: Entity extraction
            if (systemPrompt.includes("信息提取专家") && systemPrompt.includes("提取关键实体")) {
                return {
                    content: JSON.stringify({
                        years: [1985],
                        locations: ["湖北", "小县城"],
                        people: [],
                        events: ["交粮"],
                        emotions: ["开心"],
                        missingEntities: [],
                    }),
                };
            }
            // Interviewer: Fact extraction
            if (systemPrompt.includes("事实提取专家") && systemPrompt.includes("提取客观事实")) {
                return {
                    content: JSON.stringify({
                        facts: [{
                                fact: "1985年出生于湖北某县城",
                                confidence: 0.95,
                                era: "1980s",
                                category: "childhood",
                            }],
                    }),
                };
            }
            // Interviewer: Sentiment detection
            if (systemPrompt.includes("判断这段话的情感倾向")) {
                return {
                    content: "positive",
                };
            }
            // Timeline Builder: Event extraction - check userPrompt content
            if (userPrompt.includes("1985年出生") || userPrompt.includes("武汉大学") || userPrompt.includes("湖北")) {
                return {
                    content: JSON.stringify({
                        events: [{
                                date: {
                                    type: "exact",
                                    year: 1985,
                                },
                                title: "出生",
                                description: "出生于湖北某县城",
                                category: "birth",
                                importance: "critical",
                                confidence: 0.95,
                                tags: ["童年", "家乡"],
                            }, {
                                date: {
                                    type: "exact",
                                    year: 2003,
                                },
                                title: "上大学",
                                description: "考入武汉大学计算机专业",
                                category: "education",
                                importance: "high",
                                confidence: 0.9,
                                tags: ["教育", "大学"],
                            }],
                    }),
                };
            }
            // Timeline Builder: Generic fallback for any timeline-related request
            if (systemPrompt.includes("事件") || systemPrompt.includes("Timeline") || systemPrompt.includes("人生事件")) {
                return {
                    content: JSON.stringify({
                        events: [{
                                date: {
                                    type: "exact",
                                    year: 1985,
                                },
                                title: "出生",
                                description: "出生于湖北某县城",
                                category: "birth",
                                importance: "critical",
                                confidence: 0.95,
                                tags: ["童年", "家乡"],
                            }],
                    }),
                };
            }
            // Timeline Builder: Conflict detection
            if (systemPrompt.includes("时间线逻辑检查专家") && systemPrompt.includes("逻辑冲突")) {
                return {
                    content: JSON.stringify({
                        conflicts: [{
                                type: "age_mismatch",
                                severity: "critical",
                                description: "5岁上大学不太可能",
                                involvedEventIds: ["出生", "上大学"],
                                suggestion: "请核实出生年份或大学入学年份",
                            }],
                    }),
                };
            }
            // Timeline Builder: Gap analysis
            if (systemPrompt.includes("空白期") && systemPrompt.includes("生成问题")) {
                return {
                    content: JSON.stringify({
                        questions: [
                            `在1985年到1990年之间，您在做什么？`,
                            "这段时间有什么重要的事情发生吗？",
                            "您能回忆一下那段时期的生活吗？",
                        ],
                    }),
                };
            }
            // Fact Verifier: Verification
            if (systemPrompt.includes("事实验证专家") && systemPrompt.includes("判断用户提供的陈述是否正确")) {
                // Check for COVID-19 related facts
                if (userPrompt.includes("2020") && userPrompt.includes("武汉") && userPrompt.includes("春节")) {
                    return {
                        content: JSON.stringify({
                            status: "WARNING",
                            summary: "2020年1月23日武汉封城，春节聚餐需要添加疫情背景说明",
                            confidence: 0.95,
                            issues: [{
                                    severity: "warning",
                                    category: "era_context",
                                    description: "2020年春节武汉已封城，聚餐可能不符合当时情况",
                                    suggestion: "建议说明疫情背景或核实时间",
                                }],
                            suggestions: ["添加疫情背景说明", "核实具体时间"],
                        }),
                    };
                }
                return {
                    content: JSON.stringify({
                        status: "PASS",
                        summary: "陈述符合历史事实",
                        confidence: 0.9,
                        issues: [],
                        suggestions: [],
                    }),
                };
            }
            // Fact Verifier: Browse analysis
            if (systemPrompt.includes("基于以下搜索结果") && systemPrompt.includes("验证陈述是否正确")) {
                return {
                    content: JSON.stringify({
                        status: "PASS",
                        summary: "搜索结果支持该陈述",
                        issues: [],
                        suggestions: [],
                    }),
                };
            }
            // Style Imitator: Voice analysis
            if (systemPrompt.includes("语言风格分析专家") && systemPrompt.includes("分析以下文本的语言特征")) {
                return {
                    content: JSON.stringify({
                        characteristics: {
                            avgSentenceLength: 15,
                            sentenceComplexity: "moderate",
                            prefersShortSentences: true,
                            vocabularyLevel: "intermediate",
                            commonWords: ["那时候", "挺"],
                            idiosyncraticPhrases: [],
                            dominantTone: ["nostalgic"],
                            emotionalRange: "moderate",
                            usesEllipsis: true,
                            usesEmDash: false,
                            exclamationFrequency: "rare",
                            dialect: [],
                            eraMarkers: [],
                            perspective: "first_person",
                            tense: "past",
                            detailLevel: "moderate",
                        },
                        dominantTraits: ["偏好短句", "常用省略号"],
                        suggestions: ["提供更多样本以提高准确性"],
                    }),
                };
            }
            // Style Imitator: Style transfer
            if (systemPrompt.includes("文字风格转换专家") && systemPrompt.includes("改写以下文字")) {
                return {
                    content: JSON.stringify({
                        rewrittenText: "那时候家里条件挺艰苦的，但大家都很开心。我们几个孩子经常在村头的小河沟里摸鱼捉虾，日子过得简单快乐。",
                        changes: [{
                                type: "vocabulary",
                                original: "我的童年生活很快乐",
                                modified: "那时候家里条件挺艰苦的，但大家都很开心",
                                reason: "使用更符合时代背景的表达",
                            }],
                        confidence: 0.85,
                    }),
                };
            }
            // Default fallback response
            return {
                content: JSON.stringify({
                    response: "Mock response",
                }),
            };
        },
    };
}
//# sourceMappingURL=mock-llm-client.js.map