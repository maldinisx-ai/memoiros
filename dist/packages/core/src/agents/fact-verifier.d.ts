/**
 * Fact Verifier Agent
 *
 * Verifies historical facts, timelines, and era context using web sources
 */
import type { AgentContext } from "./base.js";
import { BaseAgent } from "./base.js";
import type { FactVerificationRequest, FactVerificationResult } from "../models/fact-verification.js";
/**
 * Fact Verifier Agent
 *
 * Verifies user-provided facts against historical records
 */
export declare class FactVerifierAgent extends BaseAgent {
    private readonly browseClient;
    constructor(ctx: AgentContext);
    get name(): string;
    /**
     * Verify a fact statement
     */
    verify(request: FactVerificationRequest): Promise<FactVerificationResult>;
    /**
     * Extract entities from a fact statement
     */
    private extractEntities;
    /**
     * Determine verification strategy
     */
    private determineStrategy;
    /**
     * Build sources for specific events
     */
    private buildSourcesForEvents;
    /**
     * Build sources for a specific era
     */
    private buildSourcesForEra;
    /**
     * Execute verification based on strategy
     */
    private executeVerification;
    /**
     * Get LLM judgment on the fact
     */
    private getLLMJudgment;
    /**
     * Verify using browse tool
     */
    private verifyWithBrowse;
    /**
     * Combine LLM and browse results
     */
    private combineResults;
    /**
     * Parse verification result from LLM response
     */
    private parseVerificationResult;
}
//# sourceMappingURL=fact-verifier.d.ts.map