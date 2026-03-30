/**
 * Zod schemas for Fact Verification models
 */
import { z } from "zod";
/**
 * Verification status schema
 */
export declare const verificationStatusSchema: z.ZodEnum<["PASS", "WARNING", "FAIL"]>;
/**
 * Issue severity schema
 */
export declare const issueSeveritySchema: z.ZodEnum<["critical", "warning", "info"]>;
/**
 * Issue category schema
 */
export declare const issueCategorySchema: z.ZodEnum<["timeline", "era_context", "entity", "logic", "general"]>;
/**
 * Strictness schema
 */
export declare const strictnessSchema: z.ZodEnum<["strict", "normal", "loose"]>;
/**
 * Verification source schema
 */
export declare const verificationSourceSchema: z.ZodObject<{
    url: z.ZodString;
    title: z.ZodString;
    excerpt: z.ZodString;
    reliability: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    url: string;
    title: string;
    excerpt: string;
    reliability: number;
}, {
    url: string;
    title: string;
    excerpt: string;
    reliability: number;
}>;
/**
 * Verification issue schema
 */
export declare const verificationIssueSchema: z.ZodObject<{
    severity: z.ZodEnum<["critical", "warning", "info"]>;
    category: z.ZodEnum<["timeline", "era_context", "entity", "logic", "general"]>;
    description: z.ZodString;
    suggestion: z.ZodString;
}, "strip", z.ZodTypeAny, {
    severity: "info" | "critical" | "warning";
    category: "timeline" | "era_context" | "entity" | "logic" | "general";
    description: string;
    suggestion: string;
}, {
    severity: "info" | "critical" | "warning";
    category: "timeline" | "era_context" | "entity" | "logic" | "general";
    description: string;
    suggestion: string;
}>;
/**
 * Fact verification result schema
 */
export declare const factVerificationResultSchema: z.ZodObject<{
    status: z.ZodEnum<["PASS", "WARNING", "FAIL"]>;
    fact: z.ZodString;
    summary: z.ZodString;
    issues: z.ZodArray<z.ZodObject<{
        severity: z.ZodEnum<["critical", "warning", "info"]>;
        category: z.ZodEnum<["timeline", "era_context", "entity", "logic", "general"]>;
        description: z.ZodString;
        suggestion: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        severity: "info" | "critical" | "warning";
        category: "timeline" | "era_context" | "entity" | "logic" | "general";
        description: string;
        suggestion: string;
    }, {
        severity: "info" | "critical" | "warning";
        category: "timeline" | "era_context" | "entity" | "logic" | "general";
        description: string;
        suggestion: string;
    }>, "many">;
    sources: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        title: z.ZodString;
        excerpt: z.ZodString;
        reliability: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        url: string;
        title: string;
        excerpt: string;
        reliability: number;
    }, {
        url: string;
        title: string;
        excerpt: string;
        reliability: number;
    }>, "many">;
    confidence: z.ZodNumber;
    suggestions: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    status: "PASS" | "WARNING" | "FAIL";
    issues: {
        severity: "info" | "critical" | "warning";
        category: "timeline" | "era_context" | "entity" | "logic" | "general";
        description: string;
        suggestion: string;
    }[];
    summary: string;
    confidence: number;
    suggestions: string[];
    fact: string;
    sources: {
        url: string;
        title: string;
        excerpt: string;
        reliability: number;
    }[];
}, {
    status: "PASS" | "WARNING" | "FAIL";
    issues: {
        severity: "info" | "critical" | "warning";
        category: "timeline" | "era_context" | "entity" | "logic" | "general";
        description: string;
        suggestion: string;
    }[];
    summary: string;
    confidence: number;
    suggestions: string[];
    fact: string;
    sources: {
        url: string;
        title: string;
        excerpt: string;
        reliability: number;
    }[];
}>;
/**
 * Fact verification context schema
 */
export declare const factVerificationContextSchema: z.ZodObject<{
    birthYear: z.ZodOptional<z.ZodNumber>;
    location: z.ZodOptional<z.ZodString>;
    era: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    era?: string | undefined;
    birthYear?: number | undefined;
    location?: string | undefined;
}, {
    era?: string | undefined;
    birthYear?: number | undefined;
    location?: string | undefined;
}>;
/**
 * Fact verification options schema
 */
export declare const factVerificationOptionsSchema: z.ZodObject<{
    strictness: z.ZodDefault<z.ZodOptional<z.ZodEnum<["strict", "normal", "loose"]>>>;
    enableWebVerification: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    maxSources: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    strictness: "strict" | "normal" | "loose";
    enableWebVerification: boolean;
    maxSources: number;
}, {
    strictness?: "strict" | "normal" | "loose" | undefined;
    enableWebVerification?: boolean | undefined;
    maxSources?: number | undefined;
}>;
/**
 * Fact verification request schema
 */
export declare const factVerificationRequestSchema: z.ZodObject<{
    fact: z.ZodString;
    context: z.ZodOptional<z.ZodObject<{
        birthYear: z.ZodOptional<z.ZodNumber>;
        location: z.ZodOptional<z.ZodString>;
        era: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        era?: string | undefined;
        birthYear?: number | undefined;
        location?: string | undefined;
    }, {
        era?: string | undefined;
        birthYear?: number | undefined;
        location?: string | undefined;
    }>>;
    options: z.ZodOptional<z.ZodObject<{
        strictness: z.ZodDefault<z.ZodOptional<z.ZodEnum<["strict", "normal", "loose"]>>>;
        enableWebVerification: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        maxSources: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        strictness: "strict" | "normal" | "loose";
        enableWebVerification: boolean;
        maxSources: number;
    }, {
        strictness?: "strict" | "normal" | "loose" | undefined;
        enableWebVerification?: boolean | undefined;
        maxSources?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    fact: string;
    options?: {
        strictness: "strict" | "normal" | "loose";
        enableWebVerification: boolean;
        maxSources: number;
    } | undefined;
    context?: {
        era?: string | undefined;
        birthYear?: number | undefined;
        location?: string | undefined;
    } | undefined;
}, {
    fact: string;
    options?: {
        strictness?: "strict" | "normal" | "loose" | undefined;
        enableWebVerification?: boolean | undefined;
        maxSources?: number | undefined;
    } | undefined;
    context?: {
        era?: string | undefined;
        birthYear?: number | undefined;
        location?: string | undefined;
    } | undefined;
}>;
/**
 * Extracted entities schema (for fact verification)
 */
export declare const factExtractedEntitiesSchema: z.ZodObject<{
    years: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    locations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    entities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    events: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    missingEntities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    years?: number[] | undefined;
    locations?: string[] | undefined;
    events?: string[] | undefined;
    missingEntities?: string[] | undefined;
    entities?: string[] | undefined;
}, {
    years?: number[] | undefined;
    locations?: string[] | undefined;
    events?: string[] | undefined;
    missingEntities?: string[] | undefined;
    entities?: string[] | undefined;
}>;
/**
 * Verification request batch schema (for multiple facts)
 */
export declare const batchVerificationRequestSchema: z.ZodObject<{
    facts: z.ZodArray<z.ZodString, "many">;
    context: z.ZodOptional<z.ZodObject<{
        birthYear: z.ZodOptional<z.ZodNumber>;
        location: z.ZodOptional<z.ZodString>;
        era: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        era?: string | undefined;
        birthYear?: number | undefined;
        location?: string | undefined;
    }, {
        era?: string | undefined;
        birthYear?: number | undefined;
        location?: string | undefined;
    }>>;
    options: z.ZodOptional<z.ZodObject<{
        strictness: z.ZodDefault<z.ZodOptional<z.ZodEnum<["strict", "normal", "loose"]>>>;
        enableWebVerification: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        maxSources: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        strictness: "strict" | "normal" | "loose";
        enableWebVerification: boolean;
        maxSources: number;
    }, {
        strictness?: "strict" | "normal" | "loose" | undefined;
        enableWebVerification?: boolean | undefined;
        maxSources?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    facts: string[];
    options?: {
        strictness: "strict" | "normal" | "loose";
        enableWebVerification: boolean;
        maxSources: number;
    } | undefined;
    context?: {
        era?: string | undefined;
        birthYear?: number | undefined;
        location?: string | undefined;
    } | undefined;
}, {
    facts: string[];
    options?: {
        strictness?: "strict" | "normal" | "loose" | undefined;
        enableWebVerification?: boolean | undefined;
        maxSources?: number | undefined;
    } | undefined;
    context?: {
        era?: string | undefined;
        birthYear?: number | undefined;
        location?: string | undefined;
    } | undefined;
}>;
/**
 * Batch verification result schema
 */
export declare const batchVerificationResultSchema: z.ZodObject<{
    results: z.ZodArray<z.ZodObject<{
        fact: z.ZodString;
        result: z.ZodObject<{
            status: z.ZodEnum<["PASS", "WARNING", "FAIL"]>;
            fact: z.ZodString;
            summary: z.ZodString;
            issues: z.ZodArray<z.ZodObject<{
                severity: z.ZodEnum<["critical", "warning", "info"]>;
                category: z.ZodEnum<["timeline", "era_context", "entity", "logic", "general"]>;
                description: z.ZodString;
                suggestion: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                severity: "info" | "critical" | "warning";
                category: "timeline" | "era_context" | "entity" | "logic" | "general";
                description: string;
                suggestion: string;
            }, {
                severity: "info" | "critical" | "warning";
                category: "timeline" | "era_context" | "entity" | "logic" | "general";
                description: string;
                suggestion: string;
            }>, "many">;
            sources: z.ZodArray<z.ZodObject<{
                url: z.ZodString;
                title: z.ZodString;
                excerpt: z.ZodString;
                reliability: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                url: string;
                title: string;
                excerpt: string;
                reliability: number;
            }, {
                url: string;
                title: string;
                excerpt: string;
                reliability: number;
            }>, "many">;
            confidence: z.ZodNumber;
            suggestions: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            status: "PASS" | "WARNING" | "FAIL";
            issues: {
                severity: "info" | "critical" | "warning";
                category: "timeline" | "era_context" | "entity" | "logic" | "general";
                description: string;
                suggestion: string;
            }[];
            summary: string;
            confidence: number;
            suggestions: string[];
            fact: string;
            sources: {
                url: string;
                title: string;
                excerpt: string;
                reliability: number;
            }[];
        }, {
            status: "PASS" | "WARNING" | "FAIL";
            issues: {
                severity: "info" | "critical" | "warning";
                category: "timeline" | "era_context" | "entity" | "logic" | "general";
                description: string;
                suggestion: string;
            }[];
            summary: string;
            confidence: number;
            suggestions: string[];
            fact: string;
            sources: {
                url: string;
                title: string;
                excerpt: string;
                reliability: number;
            }[];
        }>;
    }, "strip", z.ZodTypeAny, {
        fact: string;
        result: {
            status: "PASS" | "WARNING" | "FAIL";
            issues: {
                severity: "info" | "critical" | "warning";
                category: "timeline" | "era_context" | "entity" | "logic" | "general";
                description: string;
                suggestion: string;
            }[];
            summary: string;
            confidence: number;
            suggestions: string[];
            fact: string;
            sources: {
                url: string;
                title: string;
                excerpt: string;
                reliability: number;
            }[];
        };
    }, {
        fact: string;
        result: {
            status: "PASS" | "WARNING" | "FAIL";
            issues: {
                severity: "info" | "critical" | "warning";
                category: "timeline" | "era_context" | "entity" | "logic" | "general";
                description: string;
                suggestion: string;
            }[];
            summary: string;
            confidence: number;
            suggestions: string[];
            fact: string;
            sources: {
                url: string;
                title: string;
                excerpt: string;
                reliability: number;
            }[];
        };
    }>, "many">;
    totalProcessed: z.ZodNumber;
    passedCount: z.ZodNumber;
    warningCount: z.ZodNumber;
    failedCount: z.ZodNumber;
    summary: z.ZodString;
}, "strip", z.ZodTypeAny, {
    summary: string;
    results: {
        fact: string;
        result: {
            status: "PASS" | "WARNING" | "FAIL";
            issues: {
                severity: "info" | "critical" | "warning";
                category: "timeline" | "era_context" | "entity" | "logic" | "general";
                description: string;
                suggestion: string;
            }[];
            summary: string;
            confidence: number;
            suggestions: string[];
            fact: string;
            sources: {
                url: string;
                title: string;
                excerpt: string;
                reliability: number;
            }[];
        };
    }[];
    totalProcessed: number;
    passedCount: number;
    warningCount: number;
    failedCount: number;
}, {
    summary: string;
    results: {
        fact: string;
        result: {
            status: "PASS" | "WARNING" | "FAIL";
            issues: {
                severity: "info" | "critical" | "warning";
                category: "timeline" | "era_context" | "entity" | "logic" | "general";
                description: string;
                suggestion: string;
            }[];
            summary: string;
            confidence: number;
            suggestions: string[];
            fact: string;
            sources: {
                url: string;
                title: string;
                excerpt: string;
                reliability: number;
            }[];
        };
    }[];
    totalProcessed: number;
    passedCount: number;
    warningCount: number;
    failedCount: number;
}>;
//# sourceMappingURL=fact-verification.schemas.d.ts.map