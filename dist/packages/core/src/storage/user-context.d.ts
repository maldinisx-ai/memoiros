/**
 * User Context Manager
 *
 * Provides user isolation and context-aware transaction support
 */
import type { MemoirOSStorage } from "./database.js";
/**
 * User context data
 */
export interface UserContext {
    readonly userId: string;
    readonly currentInterviewId?: string;
    readonly currentTimelineId?: string;
    readonly voiceProfileId?: string;
    readonly metadata: {
        readonly createdAt: string;
        readonly lastActiveAt: string;
        readonly sessionCount: number;
    };
}
/**
 * User session data
 */
export interface UserSession {
    readonly sessionId: string;
    readonly userId: string;
    readonly interviewId?: string;
    readonly startedAt: string;
    lastActivityAt: string;
}
/**
 * User context manager options
 */
export interface UserContextManagerOptions {
    readonly sessionTimeout?: number;
    readonly maxSessionsPerUser?: number;
}
/**
 * User Context Manager
 *
 * Manages user sessions and provides transaction isolation
 */
export declare class UserContextManager {
    private readonly storage;
    private readonly sessions;
    private readonly userContexts;
    private readonly options;
    constructor(storage: MemoirOSStorage, options?: UserContextManagerOptions);
    /**
     * Get or create user context
     */
    getUserContext(userId: string): UserContext;
    /**
     * Update user context
     */
    updateUserContext(userId: string, updates: Partial<Pick<UserContext, "currentInterviewId" | "currentTimelineId" | "voiceProfileId">>): UserContext;
    /**
     * Create a new user session
     */
    createSession(userId: string, interviewId?: string): UserSession;
    /**
     * Get session by ID
     */
    getSession(sessionId: string): UserSession | null;
    /**
     * Execute operation within user context (transaction-isolated)
     *
     * This ensures that all operations for a user are isolated from other users
     */
    withUserContext<T>(userId: string, operation: (context: UserContext) => Promise<T> | T): Promise<T>;
    /**
     * Transfer user data (for GDPR right to data portability)
     *
     * @param userId - Source user ID
     * @param targetUserId - Target user ID (will receive copy of data)
     */
    transferUserData(userId: string, targetUserId: string): Promise<void>;
    /**
     * Clean up expired sessions for a specific user
     */
    private cleanupUserSessions;
    /**
     * Start background session cleanup
     */
    private startSessionCleanup;
    /**
     * Clean up all expired sessions
     */
    private cleanupExpiredSessions;
    /**
     * Get active session count for a user
     */
    getActiveSessionCount(userId: string): number;
    /**
     * End a specific session
     */
    endSession(sessionId: string): boolean;
    /**
     * End all sessions for a user
     */
    endAllUserSessions(userId: string): number;
}
//# sourceMappingURL=user-context.d.ts.map