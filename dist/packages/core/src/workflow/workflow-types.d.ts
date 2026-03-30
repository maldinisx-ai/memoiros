/**
 * Workflow Engine Types
 *
 * Defines the state machine and workflow types for MemoirOS
 */
/**
 * Workflow stages
 */
export type WorkflowStage = "interview" | "preprocess" | "timeline_build" | "fact_verify" | "voice_analysis" | "outline_design" | "chapter_draft" | "style_transfer" | "review" | "finalization" | "completed";
/**
 * Workflow state status
 */
export type WorkflowStatus = "pending" | "in_progress" | "waiting_user" | "completed" | "failed" | "skipped";
/**
 * Workflow state definition
 */
export interface WorkflowState {
    readonly workflowId: string;
    readonly userId: string;
    currentStage: WorkflowStage;
    stageStatuses: ReadonlyArray<StageState>;
    metadata: {
        readonly targetChapters: number;
        readonly targetWords: number;
        readonly structure: "chronological" | "thematic" | "mixed";
        readonly interviewAnswers: number;
        readonly totalFacts: number;
        readonly totalTimelineEvents: number;
        readonly options: WorkflowOptions;
    };
    readonly startedAt: string;
    completedAt?: string;
    error?: WorkflowError;
}
/**
 * Individual stage state
 */
export interface StageState {
    readonly stage: WorkflowStage;
    readonly status: WorkflowStatus;
    readonly startedAt?: string;
    readonly completedAt?: string;
    readonly progress: number;
    readonly data: Record<string, unknown>;
    readonly dependencies: ReadonlyArray<WorkflowStage>;
    readonly error?: string;
    readonly retryCount: number;
}
/**
 * Workflow options
 */
export interface WorkflowOptions {
    readonly skipFactVerification?: boolean;
    readonly skipVoiceAnalysis?: boolean;
    readonly enableAutoProgress?: boolean;
    readonly saveInterval?: number;
    readonly maxRetries?: number;
}
/**
 * Workflow error
 */
export interface WorkflowError {
    readonly stage: WorkflowStage;
    readonly message: string;
    readonly code: string;
    readonly details?: Record<string, unknown>;
    readonly timestamp: string;
}
/**
 * Stage transition result
 */
export interface StageTransition {
    readonly from: WorkflowStage;
    readonly to: WorkflowStage;
    readonly reason: string;
    readonly auto?: boolean;
}
/**
 * Checkpoint data for breakpoint resume
 */
export interface WorkflowCheckpoint {
    readonly checkpointId: string;
    readonly workflowId: string;
    readonly stage: WorkflowStage;
    readonly timestamp: string;
    readonly state: WorkflowState;
    readonly snapshot: Record<string, unknown>;
}
/**
 * Stage execution context
 */
export interface StageExecutionContext {
    readonly workflowId: string;
    readonly userId: string;
    readonly stage: WorkflowStage;
    readonly input: Record<string, unknown>;
    readonly checkpoint?: WorkflowCheckpoint;
}
/**
 * Stage execution result
 */
export interface StageExecutionResult {
    readonly stage: WorkflowStage;
    readonly status: WorkflowStatus;
    readonly output: Record<string, unknown>;
    readonly progress: number;
    readonly nextStage?: WorkflowStage;
    readonly error?: string;
    readonly requiresUserInput?: boolean;
    readonly userPrompt?: string;
}
/**
 * Transition rule
 */
export interface TransitionRule {
    readonly from: WorkflowStage;
    readonly to: WorkflowStage | readonly WorkflowStage[];
    readonly condition?: (state: WorkflowState) => boolean;
    readonly auto?: boolean;
}
/**
 * Workflow configuration
 */
export interface WorkflowConfig {
    readonly stages: ReadonlyArray<WorkflowStage>;
    readonly transitions: ReadonlyArray<TransitionRule>;
    readonly initialStage: WorkflowStage;
    readonly options: WorkflowOptions;
}
//# sourceMappingURL=workflow-types.d.ts.map