/**
 * MemoirOS Demo - Using Real LLM API
 *
 * This example shows how to use MemoirOS with real LLM providers
 */

import { createLLMClient, loadLLMConfig, FactVerifierAgent, InterviewerAgent } from "../packages/core/src/index.js";
import type { AgentContext } from "../packages/core/src/agents/base.js";

// Option 1: Load config from environment variables
const llmConfig = loadLLMConfig();

// Option 2: Specify config explicitly
// const llmConfig = {
//   provider: "anthropic" as const,
//   apiKey: process.env.ANTHROPIC_API_KEY,
//   model: "claude-3-5-sonnet-20241022",
// };

// Create LLM client
const llmClient = createLLMClient(llmConfig);

console.log(`Using LLM provider: ${llmClient.provider}`);

// Create agent context
const agentContext: AgentContext = {
  client: llmClient,
  model: llmConfig.model ?? "default",
  projectRoot: process.cwd(),
  logger: {
    info: (msg: string) => console.log(`[INFO] ${msg}`),
    warn: (msg: string) => console.warn(`[WARN] ${msg}`),
    error: (msg: string) => console.error(`[ERROR] ${msg}`),
  },
};

// Demo 1: Fact Verification with Real LLM
async function demoFactVerification() {
  console.log("\n=== Demo 1: Fact Verification ===\n");

  const verifier = new FactVerifierAgent(agentContext);

  const result = await verifier.verify({
    fact: "我1985年出生，小时候要和爸妈去镇上交粮",
    context: {
      birthYear: 1985,
    },
    options: {
      enableWebVerification: false,  // Set to true to enable web verification
    },
  });

  console.log(`Status: ${result.status}`);
  console.log(`Summary: ${result.summary}`);
  console.log(`Confidence: ${result.confidence.toFixed(2)}`);

  if (result.issues.length > 0) {
    console.log("\nIssues:");
    for (const issue of result.issues) {
      console.log(`  - [${issue.severity}] ${issue.description}`);
    }
  }
}

// Demo 2: Interview with Real LLM
async function demoInterview() {
  console.log("\n=== Demo 2: Interview Session ===\n");

  const interviewer = new InterviewerAgent(agentContext);

  // Start interview
  const interview = await interviewer.startInterview({
    userId: "demo-user",
  });

  console.log(`Phase: ${interview.interviewState.currentPhase}`);
  console.log(`Question: ${interview.nextQuestion?.question}`);

  // Process answer
  const answer = "我1985年出生在湖北的一个小县城，那时候家里条件挺艰苦的，但大家都很开心。";

  console.log(`\nUser Answer: ${answer}`);

  const response = await interviewer.processAnswer(
    interview.interviewState.interviewId,
    interview.nextQuestion!.questionId,
    answer
  );

  console.log(`\nNext Question: ${response.nextQuestion?.question}`);

  if (response.needsClarification && response.needsClarification.length > 0) {
    console.log(`\nNeeds more info on: ${response.needsClarification.join(", ")}`);
  }
}

// Demo 3: Compare Different Providers
async function demoCompareProviders() {
  console.log("\n=== Demo 3: Provider Comparison ===\n");

  const facts = [
    "我1985年出生，小时候要和爸妈去镇上交粮",
    "2020年春节我们在武汉吃年夜饭",
  ];

  const providers = [
    { name: "Anthropic", config: { provider: "anthropic" as const, apiKey: process.env.ANTHROPIC_API_KEY } },
    { name: "OpenAI", config: { provider: "openai" as const, apiKey: process.env.OPENAI_API_KEY } },
    { name: "Ollama", config: { provider: "ollama" as const, baseURL: "http://localhost:11434/api/chat" } },
  ];

  for (const fact of facts) {
    console.log(`\nFact: ${fact}`);
    console.log("-".repeat(50));

    for (const { name, config } of providers) {
      try {
        // Check if API key is available
        if (config.provider !== "ollama" && !config.apiKey) {
          console.log(`  ${name}: Skipped (no API key)`);
          continue;
        }

        const client = createLLMClient(config);
        const context: AgentContext = {
          client,
          model: "default",
          projectRoot: process.cwd(),
          logger: { info: () => {}, warn: () => {}, error: () => {} },
        };

        const verifier = new FactVerifierAgent(context);
        const result = await verifier.verify({
          fact,
          options: { enableWebVerification: false },
        });

        console.log(`  ${name}: ${result.status} (${result.confidence.toFixed(2)}) - ${result.summary}`);
      } catch (error) {
        console.log(`  ${name}: Error - ${(error as Error).message}`);
      }
    }
  }
}

// Main
async function main() {
  try {
    await demoFactVerification();
    await demoInterview();
    // Uncomment to compare providers (requires API keys)
    // await demoCompareProviders();

    console.log("\n=== Demo Complete ===\n");
  } catch (error) {
    console.error("Demo failed:", error);
    process.exit(1);
  }
}

main();
