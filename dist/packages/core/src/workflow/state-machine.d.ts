/**
 * Workflow State Machine
 *
 * Manages workflow state transitions and execution
 */
import { WorkflowStage, WorkflowStatus, WorkflowState, WorkflowOptions, WorkflowError, StageTransition, StageExecutionResult, StageExecutionContext, WorkflowCheckpoint, WorkflowConfig } from "./workflow-types.js";
/**
 * Stage executor function type
 */
export type StageExecutor = (context: StageExecutionContext) => Promise<StageExecutionResult> | StageExecutionResult;
/**
 * State machine events
 */
export type StateMachineEvent = {
    readonly type: "stage_started";
    readonly stage: WorkflowStage;
    readonly timestamp: string;
} | {
    readonly type: "stage_completed";
    readonly stage: WorkflowStage;
    readonly timestamp: string;
} | {
    readonly type: "stage_failed";
    readonly stage: WorkflowStage;
    readonly error: string;
    readonly timestamp: string;
} | {
    readonly type: "transition";
    readonly transition: StageTransition;
    readonly timestamp: string;
} | {
    readonly type: "checkpoint_created";
    readonly checkpointId: string;
    readonly timestamp: string;
} | {
    readonly type: "workflow_completed";
    readonly workflowId: string;
    readonly timestamp: string;
};
/**
 * Workflow State Machine
 */
export declare class WorkflowStateMachine {
    private state;
    private readonly executors;
    private readonly transitions;
    private readonly eventLog;
    private readonly checkpoints;
    private readonly config;
    private readonly options;
    constructor(userId: string, config: WorkflowConfig, options?: Partial<WorkflowOptions>);
    /**
     * Get current workflow state
     */
    getState(): WorkflowState;
    /**
     * Get event log
     */
    getEventLog(): ReadonlyArray<StateMachineEvent>;
    /**
     * Register a stage executor
     */
    registerExecutor(stage: WorkflowStage, executor: StageExecutor): void;
    /**
     * Execute current stage
     */
    executeCurrentStage(input?: Record<string, unknown>): Promise<StageExecutionResult>;
    /**
     * Transition to a new stage
     */
    transitionTo(stage: WorkflowStage, reason: string): Promise<void>;
    /**
     * Save checkpoint for current stage
     */
    createCheckpoint(stage: WorkflowStage, result: StageExecutionResult): Promise<WorkflowCheckpoint>;
    /**
     * Get latest checkpoint for a stage
     */
    getLatestCheckpoint(stage: WorkflowStage): WorkflowCheckpoint | undefined;
    /**
     * Resume from checkpoint
     */
    resumeFromCheckpoint(checkpointId: string): Promise<void>;
    /**
     * Retry failed stage
     */
    retryCurrentStage(): Promise<StageExecutionResult>;
    /**
     * Get available transitions from current stage
     */
    getAvailableTransitions(): ReadonlyArray<WorkflowStage>;
    /**
     * Check if workflow can transition to target stage
     */
    canTransitionTo(stage: WorkflowStage): boolean;
    /**
     * Get workflow progress (0-100)
     */
    getProgress(): number;
    /**
     * Get summary of current workflow state
     */
    getSummary(): {
        readonly workflowId: string;
        readonly userId: string;
        readonly currentStage: WorkflowStage;
        readonly progress: number;
        readonly status: WorkflowStatus;
        readonly completedStages: number;
        readonly totalStages: number;
        readonly error?: WorkflowError;
    };
    private createInitialState;
    private getStageState;
    private updateStageStatus;
    private updateStageResult;
    private buildTransitionMap;
    private getAllowedTransitions;
    private isValidTransition;
    private getDependencies;
    private areDependenciesMet;
    private logEvent;
}
//# sourceMappingURL=state-machine.d.ts.map