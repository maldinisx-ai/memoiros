/**
 * MemoirOS Workflow Engine
 *
 * Orchestrates the memoir creation workflow with state management,
 * checkpointing, and breakpoint resume capability
 */
import type { MemoirOSStorage } from "../storage/database.js";
import type { WorkflowStage, WorkflowOptions, StageExecutionResult, WorkflowCheckpoint } from "./workflow-types.js";
import { WorkflowStateMachine } from "./state-machine.js";
/**
 * Workflow engine options
 */
export interface WorkflowEngineOptions {
    readonly storage: MemoirOSStorage;
    readonly autoSave?: boolean;
    readonly saveInterval?: number;
    readonly enableEventLogging?: boolean;
}
/**
 * Workflow summary
 */
export interface WorkflowSummary {
    readonly workflowId: string;
    readonly userId: string;
    readonly currentStage: WorkflowStage;
    readonly progress: number;
    readonly status: string;
    readonly startedAt: string;
    readonly completedAt?: string;
    readonly error?: string;
}
/**
 * Workflow Engine
 *
 * Manages multiple workflow instances with persistence and checkpointing
 */
export declare class WorkflowEngine {
    private readonly storage;
    private readonly workflows;
    private readonly options;
    private autoSaveIntervals;
    constructor(options: WorkflowEngineOptions);
    /**
     * Create a new workflow instance
     */
    createWorkflow(userId: string, workflowOptions?: Partial<WorkflowOptions>): WorkflowStateMachine;
    /**
     * Get workflow by ID
     */
    getWorkflow(workflowId: string): WorkflowStateMachine | undefined;
    /**
     * Load workflow from storage
     */
    loadWorkflow(workflowId: string): Promise<WorkflowStateMachine | null>;
    /**
     * Get all workflows for a user
     */
    getUserWorkflows(userId: string): ReadonlyArray<WorkflowSummary>;
    /**
     * Delete workflow
     */
    deleteWorkflow(workflowId: string): boolean;
    /**
     * Execute workflow until breakpoint or completion
     */
    executeWorkflow(workflowId: string, input?: Record<string, unknown>): Promise<StageExecutionResult>;
    /**
     * Resume workflow from checkpoint
     */
    resumeFromCheckpoint(workflowId: string, checkpointId: string): Promise<StageExecutionResult>;
    /**
     * Get workflow checkpoints
     */
    getCheckpoints(workflowId: string): ReadonlyArray<WorkflowCheckpoint>;
    /**
     * Cleanup completed workflows
     */
    cleanupOldWorkflows(olderThanDays?: number): number;
    private registerDefaultExecutors;
    private setupAutoSave;
    private saveWorkflowState;
    private loadWorkflowState;
}
//# sourceMappingURL=workflow-engine.d.ts.map