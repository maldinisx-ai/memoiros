/**
 * Fact Verifier Agent Test
 */
import { FactVerifierAgent } from "../packages/core/src/agents/fact-verifier.js";
/**
 * Mock LLM client for testing
 */
class MockLLMClient {
    provider = "mock";
    async chat() {
        return {
            content: JSON.stringify({
                status: "PASS",
                summary: "基于常识判断，此陈述合理",
                confidence: 0.95,
                issues: [],
                suggestions: [],
            }),
            usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        };
    }
}
/**
 * Test cases
 */
const testCases = [
    {
        name: "农业税验证（已测试成功的案例）",
        request: {
            fact: "我1985年出生，小时候要和爸妈去镇上交粮",
            context: { birthYear: 1985 },
            options: { enableWebVerification: true },
        },
        expected: {
            status: "PASS",
            summaryIncludes: ["农业税", "2006", "公粮"],
        },
    },
    {
        name: "时间线冲突测试",
        request: {
            fact: "2010年我用iPhone 5打游戏",
            options: { enableWebVerification: true },
        },
        expected: {
            status: "FAIL",
            issuesIncludes: ["2012年", "发布"],
        },
    },
    {
        name: "疫情时期测试",
        request: {
            fact: "2020年春节我们在武汉吃年夜饭",
            options: { enableWebVerification: true },
        },
        expected: {
            status: "WARNING",
            issuesIncludes: ["封城", "疫情"],
        },
    },
];
/**
 * Run test
 */
async function runTest(testCase) {
    console.log(`\n🧪 测试: ${testCase.name}`);
    console.log(`📝 陈述: ${testCase.request.fact}`);
    // Create mock context
    const ctx = {
        client: new MockLLMClient(),
        model: "mock",
        projectRoot: "/mock",
        logger: {
            info: (...args) => console.log("  INFO:", ...args),
            warn: (...args) => console.warn("  WARN:", ...args),
            error: (...args) => console.error("  ERROR:", ...args),
        },
    };
    // Create agent
    const agent = new FactVerifierAgent(ctx);
    try {
        // Run verification
        const result = await agent.verify(testCase.request);
        // Display result
        console.log(`\n✅ 验证完成`);
        console.log(`   状态: ${result.status}`);
        console.log(`   置信度: ${(result.confidence * 100).toFixed(0)}%`);
        console.log(`   总结: ${result.summary}`);
        if (result.issues.length > 0) {
            console.log(`   发现问题:`);
            result.issues.forEach((issue, i) => {
                console.log(`     ${i + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
                console.log(`        建议: ${issue.suggestion}`);
            });
        }
        if (result.sources.length > 0) {
            console.log(`   来源:`);
            result.sources.forEach((source, i) => {
                console.log(`     ${i + 1}. ${source.title}`);
                console.log(`        ${source.url}`);
            });
        }
        if (result.suggestions.length > 0) {
            console.log(`   建议:`);
            result.suggestions.forEach((s, i) => {
                console.log(`     ${i + 1}. ${s}`);
            });
        }
        // Verify expectations
        if (testCase.expected.status) {
            if (result.status !== testCase.expected.status) {
                console.log(`\n⚠️  期望状态: ${testCase.expected.status}, 实际: ${result.status}`);
            }
        }
        if (testCase.expected.summaryIncludes) {
            const summaryLower = result.summary.toLowerCase();
            testCase.expected.summaryIncludes.forEach(term => {
                if (!summaryLower.includes(term.toLowerCase())) {
                    console.log(`\n⚠️  总结应包含: ${term}`);
                }
            });
        }
        console.log(`\n✅ 测试通过`);
    }
    catch (error) {
        console.error(`\n❌ 测试失败:`, error);
    }
}
/**
 * Main test runner
 */
async function main() {
    console.log("=".repeat(60));
    console.log("Fact Verifier Agent 测试套件");
    console.log("=".repeat(60));
    for (const testCase of testCases) {
        await runTest(testCase);
    }
    console.log("\n" + "=".repeat(60));
    console.log("所有测试完成");
    console.log("=".repeat(60));
}
// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}
export { main, runTest, testCases };
//# sourceMappingURL=fact-verifier.test.js.map