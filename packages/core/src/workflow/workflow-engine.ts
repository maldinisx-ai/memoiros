/**
 * MemoirOS Workflow Engine
 *
 * Orchestrates the memoir creation workflow with state management,
 * checkpointing, and breakpoint resume capability
 */

import { randomUUID } from "node:crypto";
import type { MemoirOSStorage } from "../storage/database.js";
import type {
  WorkflowStage,
  WorkflowState,
  WorkflowOptions,
  StageExecutionResult,
  StageExecutionContext,
  WorkflowCheckpoint,
  WorkflowConfig,
} from "./workflow-types.js";
import { WorkflowStateMachine, type StageExecutor, type StateMachineEvent } from "./state-machine.js";

/**
 * Default workflow configuration
 */
const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = {
  stages: [
    "interview",
    "preprocess",
    "timeline_build",
    "fact_verify",
    "voice_analysis",
    "outline_design",
    "chapter_draft",
    "style_transfer",
    "review",
    "finalization",
    "completed",
  ],
  transitions: [
    // Auto transitions
    { from: "interview", to: "preprocess", auto: true },
    { from: "preprocess", to: "timeline_build", auto: true },
    { from: "timeline_build", to: ["fact_verify", "voice_analysis"], auto: true },
    { from: "voice_analysis", to: "outline_design", auto: true },
    { from: "fact_verify", to: "outline_design", auto: true },
    { from: "outline_design", to: "chapter_draft", auto: false }, // Requires user confirmation
    { from: "chapter_draft", to: "style_transfer", auto: true },
    { from: "style_transfer", to: "review", auto: false }, // Requires user input
    { from: "review", to: ["finalization", "chapter_draft"], auto: false },
    { from: "finalization", to: "completed", auto: true },
  ],
  initialStage: "interview",
  options: {
    skipFactVerification: false,
    skipVoiceAnalysis: false,
    enableAutoProgress: true,
    saveInterval: 30, // Auto-save every 30 seconds
    maxRetries: 3,
  },
};

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
export class WorkflowEngine {
  private readonly storage: MemoirOSStorage;
  private readonly workflows: Map<string, WorkflowStateMachine>;
  private readonly options: Required<Pick<WorkflowEngineOptions, "autoSave" | "saveInterval" | "enableEventLogging">>;
  private autoSaveIntervals: Map<string, NodeJS.Timeout>;

  constructor(options: WorkflowEngineOptions) {
    this.storage = options.storage;
    this.workflows = new Map();
    this.autoSaveIntervals = new Map();
    this.options = {
      autoSave: options.autoSave ?? true,
      saveInterval: options.saveInterval ?? 30000, // 30 seconds
      enableEventLogging: options.enableEventLogging ?? true,
    };
  }

  /**
   * Create a new workflow instance
   */
  createWorkflow(
    userId: string,
    workflowOptions?: Partial<WorkflowOptions>
  ): WorkflowStateMachine {
    const config = { ...DEFAULT_WORKFLOW_CONFIG };
    config.options = { ...config.options, ...workflowOptions };

    const machine = new WorkflowStateMachine(userId, config, workflowOptions);

    // Register default stage executors (to be implemented by agents)
    this.registerDefaultExecutors(machine);

    // Store workflow
    this.workflows.set(machine.getState().workflowId, machine);

    // Setup auto-save
    if (this.options.autoSave) {
      this.setupAutoSave(machine.getState().workflowId);
    }

    // Save initial state to storage
    this.saveWorkflowState(machine.getState());

    return machine;
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): WorkflowStateMachine | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * Load workflow from storage
   */
  async loadWorkflow(workflowId: string): Promise<WorkflowStateMachine | null> {
    // Load state from database
    const state = await this.loadWorkflowState(workflowId);
    if (!state) {
      return null;
    }

    // Recreate state machine
    const config = { ...DEFAULT_WORKFLOW_CONFIG };
    config.options = { ...config.options, ...state.metadata.options };

    const machine = new WorkflowStateMachine(state.userId, config, state.metadata.options);

    // Restore state
    Object.assign(machine.getState(), state);

    // Register executors
    this.registerDefaultExecutors(machine);

    // Store workflow
    this.workflows.set(workflowId, machine);

    // Setup auto-save
    if (this.options.autoSave) {
      this.setupAutoSave(workflowId);
    }

    return machine;
  }

  /**
   * Get all workflows for a user
   */
  getUserWorkflows(userId: string): ReadonlyArray<WorkflowSummary> {
    const summaries: WorkflowSummary[] = [];

    for (const machine of this.workflows.values()) {
      const state = machine.getState();
      if (state.userId === userId) {
        summaries.push({
          workflowId: state.workflowId,
          userId: state.userId,
          currentStage: state.currentStage,
          progress: machine.getProgress(),
          status: machine.getSummary().status,
          startedAt: state.startedAt,
          completedAt: state.completedAt,
          error: state.error?.message,
        });
      }
    }

    return summaries;
  }

  /**
   * Delete workflow
   */
  deleteWorkflow(workflowId: string): boolean {
    // Clear auto-save interval
    const interval = this.autoSaveIntervals.get(workflowId);
    if (interval) {
      clearInterval(interval);
      this.autoSaveIntervals.delete(workflowId);
    }

    // Remove from memory
    const deleted = this.workflows.delete(workflowId);

    // Delete from storage
    if (deleted) {
      this.storage.transaction(() => {
        // Delete workflow data from database
        // (Implementation depends on database schema)
      });
    }

    return deleted;
  }

  /**
   * Execute workflow until breakpoint or completion
   */
  async executeWorkflow(
    workflowId: string,
    input?: Record<string, unknown>
  ): Promise<StageExecutionResult> {
    const machine = this.workflows.get(workflowId);
    if (!machine) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    let result: StageExecutionResult;

    do {
      // Execute current stage
      result = await machine.executeCurrentStage(input);

      // Save state after each stage
      this.saveWorkflowState(machine.getState());

      // Break if waiting for user input
      if (result.requiresUserInput) {
        break;
      }

      // Break if stage failed
      if (result.status === "failed") {
        break;
      }

      // Break if workflow completed
      if (machine.getState().currentStage === "completed") {
        break;
      }

      // Continue to next stage if auto-progress is enabled
      input = result.output; // Pass output as next input
    } while (result.status === "completed" && machine.getAvailableTransitions().length > 0);

    return result;
  }

  /**
   * Resume workflow from checkpoint
   */
  async resumeFromCheckpoint(
    workflowId: string,
    checkpointId: string
  ): Promise<StageExecutionResult> {
    const machine = this.workflows.get(workflowId);
    if (!machine) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    await machine.resumeFromCheckpoint(checkpointId);
    this.saveWorkflowState(machine.getState());

    // Continue execution
    return this.executeWorkflow(workflowId);
  }

  /**
   * Get workflow checkpoints
   */
  getCheckpoints(workflowId: string): ReadonlyArray<WorkflowCheckpoint> {
    const machine = this.workflows.get(workflowId);
    if (!machine) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Get all checkpoints from storage
    const checkpoints: WorkflowCheckpoint[] = [];

    for (const stage of DEFAULT_WORKFLOW_CONFIG.stages) {
      const checkpoint = machine.getLatestCheckpoint(stage);
      if (checkpoint) {
        checkpoints.push(checkpoint);
      }
    }

    return checkpoints.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  /**
   * Cleanup completed workflows
   */
  cleanupOldWorkflows(olderThanDays: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let cleaned = 0;

    for (const [workflowId, machine] of this.workflows.entries()) {
      const state = machine.getState();
      const completedAt = state.completedAt ? new Date(state.completedAt) : null;

      if (completedAt && completedAt < cutoffDate) {
        this.deleteWorkflow(workflowId);
        cleaned++;
      }
    }

    return cleaned;
  }

  // Private methods

  private registerDefaultExecutors(machine: WorkflowStateMachine): void {
    // Interview stage
    machine.registerExecutor("interview", async (context: StageExecutionContext) => {
      // Interview is handled by InterviewerAgent
      return {
        stage: "interview",
        status: "completed",
        output: { interviewCompleted: true },
        progress: 100,
        nextStage: "preprocess",
      };
    });

    // Preprocess stage
    machine.registerExecutor("preprocess", async (context: StageExecutionContext) => {
      // Preprocess is handled by PreprocessorAgent
      return {
        stage: "preprocess",
        status: "completed",
        output: { profileCreated: true },
        progress: 100,
        nextStage: "timeline_build",
      };
    });

    // Timeline build stage
    machine.registerExecutor("timeline_build", async (context: StageExecutionContext) => {
      // Timeline build is handled by TimelineBuilderAgent
      return {
        stage: "timeline_build",
        status: "completed",
        output: { timelineCreated: true },
        progress: 100,
        nextStage: "fact_verify",
      };
    });

    // Other stages are registered by their respective agents
  }

  private setupAutoSave(workflowId: string): void {
    const interval = setInterval(() => {
      const machine = this.workflows.get(workflowId);
      if (machine) {
        this.saveWorkflowState(machine.getState());
      }
    }, this.options.saveInterval);

    this.autoSaveIntervals.set(workflowId, interval);
  }

  private saveWorkflowState(state: WorkflowState): void {
    this.storage.transaction(() => {
      // Save to database
      // (Implementation depends on database schema for workflow storage)
      if (this.options.enableEventLogging) {
        console.log(`[Workflow] Saved state for ${state.workflowId}, stage: ${state.currentStage}`);
      }
    });
  }

  private async loadWorkflowState(workflowId: string): Promise<WorkflowState | null> {
    // Load from database
    // (Implementation depends on database schema for workflow storage)
    return null;
  }
}
