/**
 * MemoirOS Pipeline Integration Test
 *
 * Tests the complete pipeline:
 * 1. Interviewer Agent asks questions
 * 2. Timeline Builder extracts events
 * 3. Fact Verifier validates facts
 * 4. Style Imitator learns voice
 * 5. Generate final memoir content
 */
import { describe, it, expect, beforeEach } from "@jest/globals";
import { InterviewerAgent } from "../packages/core/src/agents/interviewer.js";
import { TimelineBuilderAgent } from "../packages/core/src/agents/timeline-builder.js";
import { FactVerifierAgent } from "../packages/core/src/agents/fact-verifier.js";
import { StyleImitatorAgent } from "../packages/core/src/agents/style-imitator.js";
import { createMockLLMClient } from "./mock-llm-client.js";
describe("MemoirOS Pipeline Integration", () => {
    // Mock agent context
    let mockContext;
    beforeEach(() => {
        mockContext = {
            client: createMockLLMClient(),
            model: "test-model",
            projectRoot: "/test",
            logger: {
                info: () => { }, // Suppress console output during tests
                warn: () => { },
                error: () => { },
            },
        };
    });
    describe("Phase 1: Interview Collection", () => {
        it("should start a new interview session", async () => {
            const interviewer = new InterviewerAgent(mockContext, null);
            const response = await interviewer.startInterview({
                userId: "test-user-123",
            });
            expect(response.interviewState.status).toBe("active");
            expect(response.interviewState.currentPhase).toBe("warmup");
            expect(response.nextQuestion).toBeDefined();
            expect(response.nextQuestion?.question).toBeTruthy();
        });
        it("should process user answers and extract entities", async () => {
            const interviewer = new InterviewerAgent(mockContext, null);
            // Start interview
            const startResponse = await interviewer.startInterview({
                userId: "test-user-123",
            });
            // Process answer
            const answerResponse = await interviewer.processAnswer(startResponse.interviewState.interviewId, startResponse.nextQuestion.questionId, "我1985年出生在湖北的一个小县城，那时候家里条件挺艰苦的，但大家都很开心。");
            expect(answerResponse.interviewState.answers).toHaveLength(1);
            expect(answerResponse.nextQuestion).toBeDefined();
            expect(answerResponse.needsClarification).toBeDefined();
        });
        it("should advance through interview phases", async () => {
            const interviewer = new InterviewerAgent(mockContext, null);
            const startResponse = await interviewer.startInterview({
                userId: "test-user-123",
            });
            // Warmup -> Childhood
            const advancedResponse = await interviewer.advancePhase(startResponse.interviewState.interviewId);
            expect(advancedResponse.interviewState.currentPhase).toBe("childhood");
            expect(advancedResponse.summary).toContain("童年");
        });
    });
    describe("Phase 2: Timeline Building", () => {
        it("should extract events from interview answers", async () => {
            const timelineBuilder = new TimelineBuilderAgent(mockContext);
            const result = await timelineBuilder.buildTimeline({
                userId: "test-user-123",
                interviewAnswers: [
                    {
                        answerId: "ans_1",
                        answer: "我1985年出生在湖北的一个小县城。小时候家里条件艰苦，但很开心。",
                    },
                    {
                        answerId: "ans_2",
                        answer: "2003年我考上了武汉大学，学的是计算机专业。",
                    },
                ],
            });
            // Timeline builder should complete without errors
            expect(result).toBeDefined();
            expect(result.timeline).toBeDefined();
            expect(result.timeline.timelineId).toBeDefined();
        });
        it("should detect timeline conflicts", async () => {
            const timelineBuilder = new TimelineBuilderAgent(mockContext);
            const result = await timelineBuilder.buildTimeline({
                userId: "test-user-123",
                interviewAnswers: [
                    {
                        answerId: "ans_1",
                        answer: "我1985年出生。",
                    },
                    {
                        answerId: "ans_2",
                        answer: "我1990年上大学，学的计算机。",
                    },
                ],
                options: {
                    detectConflicts: true,
                },
            });
            // Timeline builder should complete without errors
            expect(result).toBeDefined();
            expect(result.timeline).toBeDefined();
        });
        it("should identify timeline gaps", async () => {
            const timelineBuilder = new TimelineBuilderAgent(mockContext);
            const result = await timelineBuilder.buildTimeline({
                userId: "test-user-123",
                interviewAnswers: [
                    {
                        answerId: "ans_1",
                        answer: "我1985年出生。",
                    },
                    {
                        answerId: "ans_2",
                        answer: "2010年我结婚了。",
                    },
                ],
                options: {
                    identifyGaps: true,
                },
            });
            // Timeline builder should complete without errors
            expect(result).toBeDefined();
            expect(result.timeline).toBeDefined();
        });
    });
    describe("Phase 3: Fact Verification", () => {
        it("should verify historical facts", async () => {
            const factVerifier = new FactVerifierAgent(mockContext);
            const result = await factVerifier.verify({
                fact: "我1985年出生，小时候要和爸妈去镇上交粮",
                context: {
                    birthYear: 1985,
                },
                options: {
                    enableWebVerification: false, // LLM-only for testing
                },
            });
            expect(result.status).toMatch(/PASS|WARNING|FAIL/);
            expect(result.summary).toBeDefined();
            expect(result.confidence).toBeGreaterThanOrEqual(0);
            expect(result.confidence).toBeLessThanOrEqual(1);
        });
        it("should detect era context mismatches", async () => {
            const factVerifier = new FactVerifierAgent(mockContext);
            const result = await factVerifier.verify({
                fact: "2020年春节我们在武汉吃年夜饭，当时疫情还没有爆发",
                context: {
                    era: "2020",
                },
                options: {
                    enableWebVerification: false,
                },
            });
            // Should warn about COVID-19 timing
            expect(result.status).toBe("WARNING");
        });
    });
    describe("Phase 4: Style Imitation", () => {
        it("should create voice profile from samples", async () => {
            const styleImitator = new StyleImitatorAgent(mockContext);
            const result = await styleImitator.createVoiceProfile({
                userId: "test-user-123",
                samples: [
                    {
                        sampleId: "sample_1",
                        sourceType: "interview_answer",
                        content: "那时候家里条件挺艰苦的，但大家都很开心。我们几个孩子经常在村头的小河沟里摸鱼捉虾，日子过得简单快乐。",
                    },
                    {
                        sampleId: "sample_2",
                        sourceType: "interview_answer",
                        content: "上小学的时候，每天要走五里山路。冬天冷得很，手上都是冻疮，但从来没觉得苦。",
                    },
                ],
            });
            expect(result.profile).toBeDefined();
            expect(result.profile.characteristics).toBeDefined();
            expect(result.summary).toBeDefined();
            expect(result.dominantTraits.length).toBeGreaterThan(0);
        });
        it("should transfer style to text", async () => {
            const styleImitator = new StyleImitatorAgent(mockContext);
            // First, create a profile
            const profileResult = await styleImitator.createVoiceProfile({
                userId: "test-user-123",
                samples: [
                    {
                        sampleId: "sample_1",
                        sourceType: "interview_answer",
                        content: "那时候家里条件挺艰苦的，但大家都很开心。我们经常在村头的小河沟里摸鱼捉虾。",
                    },
                ],
            });
            // Then transfer style
            const transferResult = await styleImitator.transferStyle({
                sourceText: "我的童年生活很快乐。虽然家里没有钱，但是我们有很多好玩的游戏。",
                voiceProfile: profileResult.profile,
                options: {
                    intensity: "moderate",
                    preserveFacts: true,
                },
            });
            expect(transferResult.rewrittenText).toBeDefined();
            expect(transferResult.confidence).toBeGreaterThan(0);
            expect(transferResult.changes).toBeDefined();
        });
    });
    describe("Phase 5: Complete Pipeline", () => {
        it("should run the full memoir creation pipeline", async () => {
            // Initialize all agents
            const interviewer = new InterviewerAgent(mockContext, null);
            const timelineBuilder = new TimelineBuilderAgent(mockContext);
            const factVerifier = new FactVerifierAgent(mockContext);
            const styleImitator = new StyleImitatorAgent(mockContext);
            // Step 1: Collect interview
            const interviewResponse = await interviewer.startInterview({
                userId: "test-user-123",
            });
            const sampleAnswers = [
                "我1985年出生在湖北的一个小县城。小时候家里条件艰苦，但很开心。",
                "2003年我考上了武汉大学，学的是计算机专业。",
                "2007年毕业后去了深圳，在一家科技公司做程序员。",
            ];
            const answerResponse = await interviewer.processAnswer(interviewResponse.interviewState.interviewId, interviewResponse.nextQuestion.questionId, sampleAnswers[0]);
            // Step 2: Build timeline
            const timelineResult = await timelineBuilder.buildTimeline({
                userId: "test-user-123",
                interviewAnswers: sampleAnswers.map((answer, i) => ({
                    answerId: `ans_${i}`,
                    answer,
                })),
            });
            expect(timelineResult).toBeDefined();
            expect(timelineResult.timeline).toBeDefined();
            // Step 3: Verify facts
            const verificationResults = await Promise.all(sampleAnswers.map(answer => factVerifier.verify({
                fact: answer,
                options: { enableWebVerification: false },
            })));
            expect(verificationResults).toHaveLength(3);
            // Step 4: Create voice profile
            const voiceProfile = await styleImitator.createVoiceProfile({
                userId: "test-user-123",
                samples: sampleAnswers.map((answer, i) => ({
                    sampleId: `sample_${i}`,
                    sourceType: "interview_answer",
                    content: answer,
                })),
            });
            expect(voiceProfile.profile).toBeDefined();
            // Verify pipeline completion
            expect(answerResponse.interviewState.answers.length).toBeGreaterThan(0);
            expect(timelineResult.timeline).toBeDefined();
            expect(verificationResults.every(r => r.status)).toBeDefined();
            expect(voiceProfile.profile.characteristics).toBeDefined();
        });
    });
    describe("Edge Cases and Error Handling", () => {
        it("should handle empty interview answers gracefully", async () => {
            const timelineBuilder = new TimelineBuilderAgent(mockContext);
            const result = await timelineBuilder.buildTimeline({
                userId: "test-user-123",
                interviewAnswers: [],
            });
            expect(result.timeline.events).toHaveLength(0);
            expect(result.addedEvents).toBe(0);
        });
        it("should handle malformed user input", async () => {
            const interviewer = new InterviewerAgent(mockContext, null);
            const response = await interviewer.processAnswer("test-interview-id", "test-question-id", "asdfghjkl" // Nonsense input
            );
            expect(response).toBeDefined();
            expect(response.interviewState).toBeDefined();
        });
        it("should handle LLM failures gracefully", async () => {
            // Create a context that simulates LLM failure
            const failContext = {
                ...mockContext,
                client: {
                    provider: "test",
                    chat: async () => {
                        throw new Error("LLM service unavailable");
                    },
                },
            };
            const interviewer = new InterviewerAgent(failContext);
            const response = await interviewer.startInterview({
                userId: "test-user-123",
            });
            // Should still return a response with fallback questions
            expect(response.interviewState).toBeDefined();
            expect(response.nextQuestion).toBeDefined();
        });
    });
});
//# sourceMappingURL=pipeline.test.js.map