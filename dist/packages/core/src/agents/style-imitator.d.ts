/**
 * Style Imitator Agent
 *
 * Analyzes user's voice and rewrites text to match their style
 */
import { BaseAgent } from "./base.js";
import type { VoiceProfileCreationRequest, VoiceProfileAnalysis, StyleTransferRequest, StyleTransferResult } from "../models/style.js";
/**
 * Style Imitator Agent
 */
export declare class StyleImitatorAgent extends BaseAgent {
    get name(): string;
    /**
     * Create or update voice profile from samples
     */
    createVoiceProfile(request: VoiceProfileCreationRequest): Promise<VoiceProfileAnalysis>;
    /**
     * Transfer style to text
     */
    transferStyle(request: StyleTransferRequest): Promise<StyleTransferResult>;
    /**
     * Analyze a single voice sample
     */
    private analyzeSample;
    /**
     * Aggregate characteristics from multiple samples
     */
    private aggregateCharacteristics;
    /**
     * Calculate profile confidence based on sample analyses
     */
    private calculateProfileConfidence;
    /**
     * Build style transfer prompt
     */
    private buildStylePrompt;
    /**
     * Adjust intensity of style transfer
     */
    private adjustIntensity;
    /**
     * Generate voice summary
     */
    private generateVoiceSummary;
    /**
     * Extract dominant traits
     */
    private extractDominantTraits;
    /**
     * Generate voice suggestions
     */
    private generateVoiceSuggestions;
    private average;
    private mostFrequent;
    private mode;
    private aggregateStringArrays;
    private generateId;
}
//# sourceMappingURL=style-imitator.d.ts.map