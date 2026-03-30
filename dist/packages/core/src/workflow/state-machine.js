/**
 * Workflow State Machine
 *
 * Manages workflow state transitions and execution
 */
import { randomUUID } from "node:crypto";
/**
 * Workflow State Machine
 */
export class WorkflowStateMachine {
    state; // Mutable internally
    executors;
    transitions;
    eventLog = [];
    checkpoints;
    config;
    options;
    constructor(userId, config, options) {
        this.config = config;
        this.options = { ...config.options, ...options };
        this.executors = new Map();
        this.transitions = new Map();
        this.checkpoints = new Map();
        // Initialize state
        const now = new Date().toISOString();
        this.state = this.createInitialState(userId, now);
        // Build transition map
        this.buildTransitionMap();
    }
    /**
     * Get current workflow state
     */
    getState() {
        // Return a deep clone to prevent external modification
        return JSON.parse(JSON.stringify(this.state));
    }
    /**
     * Get event log
     */
    getEventLog() {
        return this.eventLog;
    }
    /**
     * Register a stage executor
     */
    registerExecutor(stage, executor) {
        this.executors.set(stage, executor);
    }
    /**
     * Execute current stage
     */
    async executeCurrentStage(input) {
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
            const context = {
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
            }
            else if (result.status === "failed") {
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
        }
        catch (error) {
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
    async transitionTo(stage, reason) {
        const currentStage = this.state.currentStage;
        // Validate transition
        if (!this.isValidTransition(currentStage, stage)) {
            throw new Error(`Invalid transition from ${currentStage} to ${stage}. ` +
                `Allowed transitions: ${this.getAllowedTransitions(currentStage).join(", ")}`);
        }
        // Check dependencies
        const stageState = this.getStageState(stage);
        if (!this.areDependenciesMet(stageState)) {
            throw new Error(`Cannot transition to ${stage}: dependencies not met. ` +
                `Required: ${stageState.dependencies.join(", ")}`);
        }
        // Perform transition
        const previousStage = currentStage;
        this.state.currentStage = stage;
        // Update new stage status to pending if not started
        const newStageState = this.getStageState(stage);
        if (newStageState.status === "pending") {
            this.updateStageStatus(stage, "pending");
        }
        // Log transition
        const transition = {
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
            this.state.completedAt = new Date().toISOString();
            this.logEvent({
                type: "workflow_completed",
                workflowId: this.state.workflowId,
                timestamp: this.state.completedAt,
            });
        }
    }
    /**
     * Save checkpoint for current stage
     */
    async createCheckpoint(stage, result) {
        const checkpoint = {
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
    getLatestCheckpoint(stage) {
        const stageCheckpoints = Array.from(this.checkpoints.values())
            .filter(cp => cp.stage === stage)
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        return stageCheckpoints[0];
    }
    /**
     * Resume from checkpoint
     */
    async resumeFromCheckpoint(checkpointId) {
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
    async retryCurrentStage() {
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
            const stageStatuses = this.state.stageStatuses;
            const existing = stageStatuses[idx];
            const newStageState = {
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
    getAvailableTransitions() {
        return this.getAllowedTransitions(this.state.currentStage);
    }
    /**
     * Check if workflow can transition to target stage
     */
    canTransitionTo(stage) {
        return this.isValidTransition(this.state.currentStage, stage);
    }
    /**
     * Get workflow progress (0-100)
     */
    getProgress() {
        const totalStages = this.config.stages.length;
        const completedStages = this.state.stageStatuses.filter(s => s.status === "completed").length;
        return Math.round((completedStages / totalStages) * 100);
    }
    /**
     * Get summary of current workflow state
     */
    getSummary() {
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
    createInitialState(userId, startedAt) {
        const stageStatuses = this.config.stages.map(stage => ({
            stage,
            status: stage === this.config.initialStage ? "pending" : "pending",
            progress: 0,
            data: {},
            dependencies: this.getDependencies(stage),
            retryCount: 0,
        }));
        const state = {
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
    getStageState(stage) {
        const state = this.state.stageStatuses.find(s => s.stage === stage);
        if (!state) {
            throw new Error(`Stage not found: ${stage}`);
        }
        return state;
    }
    updateStageStatus(stage, status) {
        const idx = this.state.stageStatuses.findIndex(s => s.stage === stage);
        if (idx >= 0) {
            const stageStatuses = this.state.stageStatuses;
            const existing = stageStatuses[idx];
            const now = new Date().toISOString();
            let newStageState;
            if (status === "in_progress" && !existing.startedAt) {
                newStageState = {
                    ...existing,
                    status,
                    startedAt: now,
                };
            }
            else if (status === "completed") {
                newStageState = {
                    ...existing,
                    status,
                    completedAt: now,
                    progress: 100,
                };
            }
            else {
                newStageState = {
                    ...existing,
                    status,
                };
            }
            stageStatuses[idx] = newStageState;
        }
    }
    updateStageResult(stage, result) {
        const idx = this.state.stageStatuses.findIndex(s => s.stage === stage);
        if (idx >= 0) {
            const stageStatuses = this.state.stageStatuses;
            const existing = stageStatuses[idx];
            const newStageState = {
                ...existing,
                status: result.status,
                progress: result.progress,
                data: result.output,
                error: result.error,
            };
            stageStatuses[idx] = newStageState;
        }
    }
    buildTransitionMap() {
        for (const rule of this.config.transitions) {
            const targets = Array.isArray(rule.to) ? rule.to : [rule.to];
            for (const target of targets) {
                let rules = this.transitions.get(rule.from);
                if (!rules) {
                    rules = [];
                    this.transitions.set(rule.from, rules);
                }
                // Create new rule with single target
                const singleTargetRule = {
                    from: rule.from,
                    to: target,
                    condition: rule.condition,
                    auto: rule.auto,
                };
                rules.push(singleTargetRule);
            }
        }
    }
    getAllowedTransitions(stage) {
        const rules = this.transitions.get(stage) ?? [];
        return rules.map(r => r.to);
    }
    isValidTransition(from, to) {
        const allowed = this.getAllowedTransitions(from);
        return allowed.includes(to);
    }
    getDependencies(stage) {
        // Define default stage dependencies
        const dependencyMap = {
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
    areDependenciesMet(stageState) {
        for (const dep of stageState.dependencies) {
            const depState = this.state.stageStatuses.find(s => s.stage === dep);
            if (!depState || depState.status !== "completed") {
                return false;
            }
        }
        return true;
    }
    logEvent(event) {
        this.eventLog.push(event);
    }
}
//# sourceMappingURL=state-machine.js.map