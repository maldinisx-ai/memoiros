/**
 * Session Management Module
 *
 * Handles user session creation, validation, and cleanup
 */
import type { MemoirOSStorage } from "./database.js";
/**
 * Session data
 */
export interface Session {
    sessionId: string;
    userId: string;
    token: string;
    expiresAt: string;
    createdAt: string;
    ipAddress?: string;
    userAgent?: string;
    metadata: Record<string, unknown>;
}
/**
 * Session validation result
 */
export interface SessionValidationResult {
    valid: boolean;
    userId?: string;
    sessionId?: string;
    message: string;
}
/**
 * Session Manager
 */
export declare class SessionManager {
    private readonly storage;
    private readonly tableName;
    constructor(storage: MemoirOSStorage);
    /**
     * Generate a secure random token
     */
    private generateToken;
    /**
     * Generate a session ID
     */
    private generateSessionId;
    /**
     * Calculate expiration time
     */
    private calculateExpiration;
    /**
     * Check if session is expired
     */
    private isExpired;
    /**
     * Create a new session for a user
     */
    createSession(userId: string, options?: {
        durationHours?: number;
        ipAddress?: string;
        userAgent?: string;
        metadata?: Record<string, unknown>;
    }): Session;
    /**
     * Validate a session token
     */
    validateSession(token: string): SessionValidationResult;
    /**
     * Refresh a session (extend expiration)
     */
    refreshSession(sessionId: string, hours?: number): Session | null;
    /**
     * Refresh session by token
     */
    refreshToken(token: string, hours?: number): Session | null;
    /**
     * End a session (logout)
     */
    endSession(sessionId: string): boolean;
    /**
     * End session by token (logout)
     */
    endSessionByToken(token: string): boolean;
    /**
     * End all sessions for a user (logout everywhere)
     */
    endAllSessions(userId: string): number;
    /**
     * Get all active sessions for a user
     */
    listSessions(userId: string): Session[];
    /**
     * Get session by ID
     */
    getSession(sessionId: string): Session | null;
    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions(): number;
    /**
     * Clean up expired sessions for a specific user
     */
    cleanupExpiredSessionsForUser(userId: string): number;
    /**
     * Get session count for a user
     */
    getSessionCount(userId: string): number;
    /**
     * Save session to database
     */
    private saveSession;
    /**
     * Load session by ID
     */
    private loadSession;
    /**
     * Find session by token
     */
    private findSessionByToken;
    /**
     * Delete session by ID
     */
    private deleteSession;
}
//# sourceMappingURL=session.d.ts.map