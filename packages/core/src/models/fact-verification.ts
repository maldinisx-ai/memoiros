/**
 * Fact Verification Result
 */

export interface FactVerificationResult {
  /** Overall verification status */
  readonly status: "PASS" | "WARNING" | "FAIL";
  /** The original fact/statement being verified */
  readonly fact: string;
  /** Verification summary */
  readonly summary: string;
  /** Individual verification issues */
  readonly issues: ReadonlyArray<VerificationIssue>;
  /** Sources used for verification */
  readonly sources: ReadonlyArray<VerificationSource>;
  /** Confidence score (0-1) */
  readonly confidence: number;
  /** Suggested corrections (if any) */
  readonly suggestions: ReadonlyArray<string>;
}

export interface VerificationIssue {
  /** Issue severity */
  readonly severity: "critical" | "warning" | "info";
  /** Issue category */
  readonly category: "timeline" | "era_context" | "entity" | "logic" | "general";
  /** Issue description */
  readonly description: string;
  /** Suggestion for fixing */
  readonly suggestion: string;
}

export interface VerificationSource {
  /** Source URL */
  readonly url: string;
  /** Source title */
  readonly title: string;
  /** Relevant excerpt from source */
  readonly excerpt: string;
  /** Source reliability score (0-1) */
  readonly reliability: number;
}

/**
 * Fact verification request
 */
export interface FactVerificationRequest {
  /** The fact/statement to verify */
  readonly fact: string;
  /** Optional context (birth year, location, etc.) */
  readonly context?: {
    readonly birthYear?: number;
    readonly location?: string;
    readonly era?: string;
  };
  /** Verification options */
  readonly options?: {
    /** Strictness level */
    readonly strictness?: "strict" | "normal" | "loose";
    /** Whether to use web verification */
    readonly enableWebVerification?: boolean;
    /** Maximum sources to check */
    readonly maxSources?: number;
  };
}

/**
 * Extracted entities from a fact statement
 */
export interface ExtractedEntities {
  /** Detected years/dates */
  years?: ReadonlyArray<number>;
  /** Detected locations */
  locations?: ReadonlyArray<string>;
  /** Detected people/organizations */
  entities?: ReadonlyArray<string>;
  /** Detected events */
  events?: ReadonlyArray<string>;
  /** Missing entities that would be useful to ask about */
  missingEntities?: ReadonlyArray<string>;
}
