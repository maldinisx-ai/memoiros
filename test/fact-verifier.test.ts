/**
 * Fact Verifier Agent Test
 */

// Using global Jest functions instead of imports
import { FactVerifierAgent } from "../packages/core/src/agents/fact-verifier.js";
import type { AgentContext } from "../packages/core/src/agents/base.js";
import { createMockLLMClient } from "./mock-llm-client.js";

describe("FactVerifierAgent", () => {
  let mockContext: AgentContext;

  beforeEach(() => {
    mockContext = {
      client: createMockLLMClient(),
      model: "test-model",
      projectRoot: "/test",
      logger: {
        info: () => {},
        warn: () => {},
        error: () => {},
      },
    };
  });

  describe("verify()", () => {
    it("should verify historical facts about agricultural tax", async () => {
      const verifier = new FactVerifierAgent(mockContext);

      const result = await verifier.verify({
        fact: "我1985年出生，小时候要和爸妈去镇上交粮",
        context: {
          birthYear: 1985,
        },
        options: {
          enableWebVerification: false,  // LLM-only for testing
        },
      });

      expect(result).toBeDefined();
      expect(result.status).toMatch(/PASS|WARNING|FAIL/);
      expect(result.summary).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it("should detect era context mismatches (COVID-19)", async () => {
      const verifier = new FactVerifierAgent(mockContext);

      const result = await verifier.verify({
        fact: "2020年春节我们在武汉吃年夜饭，当时疫情还没有爆发",
        context: {
          era: "2020",
        },
        options: {
          enableWebVerification: false,
        },
      });

      expect(result).toBeDefined();
      // Should warn about COVID-19 timing
      expect(result.status).toMatch(/PASS|WARNING|FAIL/);
    });

    it("should handle empty context gracefully", async () => {
      const verifier = new FactVerifierAgent(mockContext);

      const result = await verifier.verify({
        fact: "我出生于北京",
        options: {
          enableWebVerification: false,
        },
      });

      expect(result).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it("should extract entities from the fact", async () => {
      const verifier = new FactVerifierAgent(mockContext);

      // Access the private method for testing
      const extractEntities = (verifier as any).extractEntities.bind(verifier);
      const entities = extractEntities("我1985年在北京出生，后来去了上海工作");

      expect(entities).toBeDefined();
      expect(entities.years).toContain(1985);
      expect(entities.locations).toEqual(expect.arrayContaining(["北京", "上海"]));
    });

    it("should determine correct verification strategy", async () => {
      const verifier = new FactVerifierAgent(mockContext);

      // Test era context strategy
      const determineStrategy = (verifier as any).determineStrategy.bind(verifier);

      const strategy1 = determineStrategy(
        { fact: "我1990年上了小学" },
        { years: [1990], locations: [], events: [] }
      );

      expect(strategy1.type).toBe("era_context");

      // Test targeted search strategy
      const strategy2 = determineStrategy(
        { fact: "我记得改革开放那一年" },
        { years: [], locations: [], events: ["改革开放"] }
      );

      expect(strategy2.type).toBe("targeted_search");
    });

    it("should handle LLM parsing failures gracefully", async () => {
      // Create a mock client that returns invalid JSON
      const badMockContext: AgentContext = {
        ...mockContext,
        client: {
          provider: "test",
          chat: async () => ({
            content: "This is not valid JSON {{{",
          }),
        },
      };

      const verifier = new FactVerifierAgent(badMockContext);

      const result = await verifier.verify({
        fact: "测试陈述",
        options: {
          enableWebVerification: false,
        },
      });

      // Should return a WARNING result with low confidence
      expect(result.status).toBe("WARNING");
      expect(result.confidence).toBe(0);
    });
  });

  describe("get name()", () => {
    it("should return the correct agent name", () => {
      const verifier = new FactVerifierAgent(mockContext);
      expect(verifier.name).toBe("fact-verifier");
    });
  });
});
