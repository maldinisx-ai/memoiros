/**
 * Workflow State Machine
 *
 * Manages workflow state transitions and execution
 */

import { randomUUID } from "node:crypto";
import {
  WorkflowStage,
  WorkflowStatus,
  WorkflowState,
  StageState,
  WorkflowOptions,
  WorkflowError,
  StageTransition,
  TransitionRule,
  StageExecutionResult,
  StageExecutionContext,
  WorkflowCheckpoint,
  WorkflowConfig,
} from "./workflow-types.js";

/**
 * Stage executor function type
 */
export type StageExecutor = (
  context: StageExecutionContext
) => Promise<StageExecutionResult> | StageExecutionResult;

/**
 * State machine events
 */
export type StateMachineEvent =
  | { readonly type: "stage_started"; readonly stage: WorkflowStage; readonly timestamp: string }
  | { readonly type: "stage_completed"; readonly stage: WorkflowStage; readonly timestamp: string }
  | { readonly type: "stage_failed"; readonly stage: WorkflowStage; readonly error: string; readonly timestamp: string }
  | { readonly type: "transition"; readonly transition: StageTransition; readonly timestamp: string }
  | { readonly type: "checkpoint_created"; readonly checkpointId: string; readonly timestamp: string }
  | { readonly type: "workflow_completed"; readonly workflowId: string; readonly timestamp: string };

/**
 * Workflow State Machine
 */
export class WorkflowStateMachine {
  private state: WorkflowState; // Mutable internally
  private readonly executors: Map<WorkflowStage, StageExecutor>;
  private readonly transitions: Map<WorkflowStage, TransitionRule[]>;
  private readonly eventLog: StateMachineEvent[] = [];
  private readonly checkpoints: Map<string, WorkflowCheckpoint>;
  private readonly config: WorkflowConfig;
  private readonly options: WorkflowOptions;

  constructor(
    userId: string,
    config: WorkflowConfig,
    options?: Partial<WorkflowOptions>
  ) {
    this.config = config;
    this.options = { ...config.options, ...options };
    this.executors = new Map();
    this.transitions = new Map();
    this.checkpoints = new Map();

    // Initialize state
    const now = new Date().toISOString();
    this.state = this.createInitialState(userId, now) as WorkflowState & {
      currentStage: WorkflowStage;
      stageStatuses: Array<StageState>;
      completedAt?: string;
      error?: WorkflowError | undefined;
    };

    // Build transition map
    this.buildTransitionMap();
  }

  /**
   * Get current workflow state
   */
  getState(): WorkflowState {
    // Return a deep clone to prevent external modification
    return JSON.parse(JSON.stringify(this.state)) as WorkflowState;
  }

  /**
   * Get event log
   */
  getEventLog(): ReadonlyArray<StateMachineEvent> {
    return this.eventLog;
  }

  /**
   * Register a stage executor
   */
  registerExecutor(stage: WorkflowStage, executor: StageExecutor): void {
    this.executors.set(stage, executor);
  }

  /**
   * Execute current stage
   */
  async executeCurrentStage(input?: Record<string, unknown>): Promise<StageExecutionResult> {
    const currentStage = this.state.currentStage;
    const executor = this.executors.get(currentStage);

    if (!executor) {
      throw new Error(`No executor registered for stage: ${currentStage}`);
    }

    // Update stage status to in_progress
    this.updateStageStatus(currentStage, "in_progress");
    this.logEvent({
      type: "stage_started",
      stage: currentStage,
      timestamp: new Date().toISOString(),
    });

    try {
      // Create execution context
      const context: StageExecutionContext = {
        workflowId: this.state.workflowId,
        userId: this.state.userId,
        stage: currentStage,
        input: input ?? {},
        checkpoint: this.getLatestCheckpoint(currentStage),
      };

      // Execute stage
      const result = await executor(context);

      // Update stage state
      this.updateStageResult(currentStage, result);

      // Log completion
      if (result.status === "completed") {
        this.logEvent({
          type: "stage_completed",
          stage: currentStage,
          timestamp: new Date().toISOString(),
        });

        // Create checkpoint
        await this.createCheckpoint(currentStage, result);
      } else if (result.status === "failed") {
        this.logEvent({
          type: "stage_failed",
          stage: currentStage,
          error: result.error ?? "Unknown error",
          timestamp: new Date().toISOString(),
        });
      }

      // Auto-transition if enabled and stage completed
      if (result.status === "completed" && this.options.enableAutoProgress && result.nextStage) {
        await this.transitionTo(result.nextStage, "Auto-progress after completion");
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Update stage status to failed
      this.updateStageStatus(currentStage, "failed");

      // Log failure
      this.logEvent({
        type: "stage_failed",
        stage: currentStage,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * Transition to a new stage
   */
  async transitionTo(stage: WorkflowStage, reason: string): Promise<void> {
    const currentStage = this.state.currentStage;

    // Validate transition
    if (!this.isValidTransition(currentStage, stage)) {
      throw new Error(
        `Invalid transition from ${currentStage} to ${stage}. ` +
        `Allowed transitions: ${this.getAllowedTransitions(currentStage).join(", ")}`
      );
    }

    // Check dependencies
    const stageState = this.getStageState(stage);
    if (!this.areDependenciesMet(stageState)) {
      throw new Error(
        `Cannot transition to ${stage}: dependencies not met. ` +
        `Required: ${stageState.dependencies.join(", ")}`
      );
    }

    // Perform transition
    const previousStage = currentStage;
    (this.state as { currentStage: WorkflowStage }).currentStage = stage;

    // Update new stage status to pending if not started
    const newStageState = this.getStageState(stage);
    if (newStageState.status === "pending") {
      this.updateStageStatus(stage, "pending");
    }

    // Log transition
    const transition: StageTransition = {
      from: previousStage,
      to: stage,
      reason,
      auto: reason.includes("Auto"),
    };

    this.logEvent({
      type: "transition",
      transition,
      timestamp: new Date().toISOString(),
    });

    // Check if workflow is completed
    if (stage === "completed") {
      (this.state as { completedAt: string }).completedAt = new Date().toISOString();
      this.logEvent({
        type: "workflow_completed",
        workflowId: this.state.workflowId,
        timestamp: (this.state as { completedAt: string }).completedAt,
      });
    }
  }

  /**
   * Save checkpoint for current stage
   */
  async createCheckpoint(
    stage: WorkflowStage,
    result: StageExecutionResult
  ): Promise<WorkflowCheckpoint> {
    const checkpoint: WorkflowCheckpoint = {
      checkpointId: randomUUID(),
      workflowId: this.state.workflowId,
      stage,
      timestamp: new Date().toISOString(),
      state: JSON.parse(JSON.stringify(this.state)), // Deep clone
      snapshot: result.output,
    };

    this.checkpoints.set(checkpoint.checkpointId, checkpoint);

    this.logEvent({
      type: "checkpoint_created",
      checkpointId: checkpoint.checkpointId,
      timestamp: checkpoint.timestamp,
    });

    return checkpoint;
  }

  /**
   * Get latest checkpoint for a stage
   */
  getLatestCheckpoint(stage: WorkflowStage): WorkflowCheckpoint | undefined {
    const stageCheckpoints = Array.from(this.checkpoints.values())
      .filter(cp => cp.stage === stage)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    return stageCheckpoints[0];
  }

  /**
   * Resume from checkpoint
   */
  async resumeFromCheckpoint(checkpointId: string): Promise<void> {
    const checkpoint = this.checkpoints.get(checkpointId);

    if (!checkpoint) {
      throw new Error(`Checkpoint not found: ${checkpointId}`);
    }

    // Restore state
    Object.assign(this.state, checkpoint.state);

    // Transition to checkpoint stage
    await this.transitionTo(checkpoint.stage, "Resumed from checkpoint");
  }

  /**
   * Retry failed stage
   */
  async retryCurrentStage(): Promise<StageExecutionResult> {
    const currentStage = this.state.currentStage;
    const stageState = this.getStageState(currentStage);

    if (stageState.status !== "failed") {
      throw new Error(`Cannot retry stage ${currentStage}: status is ${stageState.status}, not failed`);
    }

    // Check retry limit
    if (stageState.retryCount >= (this.options.maxRetries ?? 3)) {
      throw new Error(`Max retries (${this.options.maxRetries}) exceeded for stage ${currentStage}`);
    }

    // Increment retry count by creating new stage state
    const idx = this.state.stageStatuses.findIndex(s => s.stage === currentStage);
    if (idx >= 0) {
      const stageStatuses = this.state.stageStatuses as Array<StageState>;
      const existing = stageStatuses[idx];
      const newStageState: StageState = {
        ...existing,
        retryCount: existing.retryCount + 1,
      };
      stageStatuses[idx] = newStageState;
    }

    // Reset status to pending
    this.updateStageStatus(currentStage, "pending");

    // Execute again
    return this.executeCurrentStage();
  }

  /**
   * Get available transitions from current stage
   */
  getAvailableTransitions(): ReadonlyArray<WorkflowStage> {
    return this.getAllowedTransitions(this.state.currentStage);
  }

  /**
   * Check if workflow can transition to target stage
   */
  canTransitionTo(stage: WorkflowStage): boolean {
    return this.isValidTransition(this.state.currentStage, stage);
  }

  /**
   * Get workflow progress (0-100)
   */
  getProgress(): number {
    const totalStages = this.config.stages.length;
    const completedStages = this.state.stageStatuses.filter(
      s => s.status === "completed"
    ).length;

    return Math.round((completedStages / totalStages) * 100);
  }

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
  } {
    const currentStageState = this.getStageState(this.state.currentStage);

    return {
      workflowId: this.state.workflowId,
      userId: this.state.userId,
      currentStage: this.state.currentStage,
      progress: this.getProgress(),
      status: currentStageState.status,
      completedStages: this.state.stageStatuses.filter(s => s.status === "completed").length,
      totalStages: this.config.stages.length,
      error: this.state.error,
    };
  }

  // Private methods

  private createInitialState(userId: string, startedAt: string): WorkflowState {
    const stageStatuses: StageState[] = this.config.stages.map(stage => ({
      stage,
      status: stage === this.config.initialStage ? "pending" : "pending",
      progress: 0,
      data: {},
      dependencies: this.getDependencies(stage),
      retryCount: 0,
    }));

    const state: WorkflowState = {
      workflowId: randomUUID(),
      userId,
      currentStage: this.config.initialStage,
      stageStatuses,
      metadata: {
        targetChapters: 10,
        targetWords: 50000,
        structure: "chronological",
        interviewAnswers: 0,
        totalFacts: 0,
        totalTimelineEvents: 0,
        options: this.options,
      },
      startedAt,
    };

    return state;
  }

  private getStageState(stage: WorkflowStage): StageState {
    const state = this.state.stageStatuses.find(s => s.stage === stage);
    if (!state) {
      throw new Error(`Stage not found: ${stage}`);
    }
    return state;
  }

  private updateStageStatus(stage: WorkflowStage, status: WorkflowStatus): void {
    const idx = this.state.stageStatuses.findIndex(s => s.stage === stage);
    if (idx >= 0) {
      const stageStatuses = this.state.stageStatuses as Array<StageState>;
      const existing = stageStatuses[idx];
      const now = new Date().toISOString();

      let newStageState: StageState;

      if (status === "in_progress" && !existing.startedAt) {
        newStageState = {
          ...existing,
          status,
          startedAt: now,
        };
      } else if (status === "completed") {
        newStageState = {
          ...existing,
          status,
          completedAt: now,
          progress: 100,
        };
      } else {
        newStageState = {
          ...existing,
          status,
        };
      }

      stageStatuses[idx] = newStageState;
    }
  }

  private updateStageResult(stage: WorkflowStage, result: StageExecutionResult): void {
    const idx = this.state.stageStatuses.findIndex(s => s.stage === stage);
    if (idx >= 0) {
      const stageStatuses = this.state.stageStatuses as Array<StageState>;
      const existing = stageStatuses[idx];

      const newStageState: StageState = {
        ...existing,
        status: result.status,
        progress: result.progress,
        data: result.output,
        error: result.error,
      };

      stageStatuses[idx] = newStageState;
    }
  }

  private buildTransitionMap(): void {
    for (const rule of this.config.transitions) {
      const targets = Array.isArray(rule.to) ? rule.to : [rule.to];
      for (const target of targets) {
        let rules = this.transitions.get(rule.from);
        if (!rules) {
          rules = [];
          this.transitions.set(rule.from, rules);
        }
        // Create new rule with single target
        const singleTargetRule: TransitionRule = {
          from: rule.from,
          to: target,
          condition: rule.condition,
          auto: rule.auto,
        };
        rules.push(singleTargetRule);
      }
    }
  }

  private getAllowedTransitions(stage: WorkflowStage): ReadonlyArray<WorkflowStage> {
    const rules = this.transitions.get(stage) ?? [];
    return rules.map(r => r.to) as WorkflowStage[];
  }

  private isValidTransition(from: WorkflowStage, to: WorkflowStage): boolean {
    const allowed = this.getAllowedTransitions(from);
    return allowed.includes(to);
  }

  private getDependencies(stage: WorkflowStage): ReadonlyArray<WorkflowStage> {
    // Define default stage dependencies
    const dependencyMap: Record<WorkflowStage, ReadonlyArray<WorkflowStage>> = {
      interview: [],
      preprocess: ["interview"],
      timeline_build: ["preprocess"],
      fact_verify: ["timeline_build"],
      voice_analysis: ["preprocess"],
      outline_design: ["timeline_build", "voice_analysis"],
      chapter_draft: ["outline_design"],
      style_transfer: ["chapter_draft"],
      review: ["style_transfer"],
      finalization: ["review"],
      completed: ["finalization"],
    };

    return dependencyMap[stage] ?? [];
  }

  private areDependenciesMet(stageState: StageState): boolean {
    for (const dep of stageState.dependencies) {
      const depState = this.state.stageStatuses.find(s => s.stage === dep);
      if (!depState || depState.status !== "completed") {
        return false;
      }
    }
    return true;
  }

  private logEvent(event: StateMachineEvent): void {
    this.eventLog.push(event);
  }
}
