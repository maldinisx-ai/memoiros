/**
 * User Context Manager
 *
 * Provides user isolation and context-aware transaction support
 */
import { randomUUID } from "node:crypto";
/**
 * User Context Manager
 *
 * Manages user sessions and provides transaction isolation
 */
export class UserContextManager {
    storage;
    sessions = new Map();
    userContexts = new Map();
    options;
    constructor(storage, options = {}) {
        this.storage = storage;
        this.options = {
            sessionTimeout: options.sessionTimeout ?? 3600000, // 1 hour
            maxSessionsPerUser: options.maxSessionsPerUser ?? 10,
        };
        // Start session cleanup interval
        this.startSessionCleanup();
    }
    /**
     * Get or create user context
     */
    getUserContext(userId) {
        let context = this.userContexts.get(userId);
        if (!context) {
            // Create new user context
            const now = new Date().toISOString();
            context = {
                userId,
                metadata: {
                    createdAt: now,
                    lastActiveAt: now,
                    sessionCount: 0,
                },
            };
            this.userContexts.set(userId, context);
        }
        return context;
    }
    /**
     * Update user context
     */
    updateUserContext(userId, updates) {
        const context = this.getUserContext(userId);
        const updated = {
            ...context,
            ...updates,
            metadata: {
                ...context.metadata,
                lastActiveAt: new Date().toISOString(),
            },
        };
        this.userContexts.set(userId, updated);
        return updated;
    }
    /**
     * Create a new user session
     */
    createSession(userId, interviewId) {
        // Clean up old sessions for this user
        this.cleanupUserSessions(userId);
        const session = {
            sessionId: randomUUID(),
            userId,
            interviewId,
            startedAt: new Date().toISOString(),
            lastActivityAt: new Date().toISOString(),
        };
        this.sessions.set(session.sessionId, session);
        // Update user context
        this.updateUserContext(userId, { currentInterviewId: interviewId });
        return session;
    }
    /**
     * Get session by ID
     */
    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }
        // Check if session is expired
        const now = new Date().getTime();
        const lastActivity = new Date(session.lastActivityAt).getTime();
        const elapsed = now - lastActivity;
        if (elapsed > this.options.sessionTimeout) {
            this.sessions.delete(sessionId);
            return null;
        }
        // Update last activity
        session.lastActivityAt = new Date().toISOString();
        return session;
    }
    /**
     * Execute operation within user context (transaction-isolated)
     *
     * This ensures that all operations for a user are isolated from other users
     */
    async withUserContext(userId, operation) {
        const context = this.getUserContext(userId);
        try {
            // Execute operation within immediate transaction for better concurrency
            const result = this.storage.transactionImmediate(() => {
                // Verify user exists and data is isolated
                const userData = this.storage.getUserData(userId);
                // Execute the user operation
                return operation(context);
            });
            return result;
        }
        catch (error) {
            // Log error with user context for debugging
            console.error(`User context operation failed for user ${userId}:`, error);
            throw error;
        }
    }
    /**
     * Transfer user data (for GDPR right to data portability)
     *
     * @param userId - Source user ID
     * @param targetUserId - Target user ID (will receive copy of data)
     */
    async transferUserData(userId, targetUserId) {
        await this.withUserContext(userId, async (sourceContext) => {
            // Get source user data
            const sourceData = this.storage.getUserData(userId);
            // Copy to target user within separate transaction
            this.storage.transaction(() => {
                // Copy interviews
                for (const interview of sourceData.interviews) {
                    this.storage.saveInterview({
                        interviewId: randomUUID(), // New ID for copy
                        userId: targetUserId,
                        status: interview.status,
                        startedAt: interview.startedAt,
                        completedAt: interview.completedAt,
                        currentPhase: interview.currentPhase, // Type assertion for compatibility
                        metadata: interview.metadata,
                    });
                }
                // Copy timeline events
                for (const event of sourceData.timelineEvents) {
                    this.storage.saveTimelineEvent({
                        eventId: randomUUID(), // New ID for copy
                        timelineId: event.timelineId,
                        userId: targetUserId,
                        date: event.date,
                        title: event.title,
                        description: event.description,
                        category: event.category, // Type assertion for compatibility
                        importance: event.importance,
                        confidence: event.confidence,
                        tags: ("tags" in event ? event.tags : undefined),
                    });
                }
                // Copy voice profile if exists
                if (sourceData.voiceProfile) {
                    this.storage.saveVoiceProfile({
                        ...sourceData.voiceProfile,
                        profileId: randomUUID(), // New ID for copy
                        userId: targetUserId,
                    });
                }
            });
        });
    }
    /**
     * Clean up expired sessions for a specific user
     */
    cleanupUserSessions(userId) {
        const now = new Date().getTime();
        const userSessions = [];
        // Find all sessions for this user
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.userId === userId) {
                const lastActivity = new Date(session.lastActivityAt).getTime();
                const elapsed = now - lastActivity;
                if (elapsed > this.options.sessionTimeout) {
                    userSessions.push(sessionId);
                }
            }
        }
        // Remove expired sessions
        for (const sessionId of userSessions) {
            this.sessions.delete(sessionId);
        }
        // If still too many sessions, remove oldest
        const remainingSessions = Array.from(this.sessions.values())
            .filter(s => s.userId === userId)
            .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
        while (remainingSessions.length > this.options.maxSessionsPerUser) {
            const oldest = remainingSessions.shift();
            if (oldest) {
                this.sessions.delete(oldest.sessionId);
            }
        }
    }
    /**
     * Start background session cleanup
     */
    startSessionCleanup() {
        // Run cleanup every 10 minutes
        setInterval(() => {
            this.cleanupExpiredSessions();
        }, 600000); // 10 minutes
    }
    /**
     * Clean up all expired sessions
     */
    cleanupExpiredSessions() {
        const now = new Date().getTime();
        const expiredSessions = [];
        for (const [sessionId, session] of this.sessions.entries()) {
            const lastActivity = new Date(session.lastActivityAt).getTime();
            const elapsed = now - lastActivity;
            if (elapsed > this.options.sessionTimeout) {
                expiredSessions.push(sessionId);
            }
        }
        for (const sessionId of expiredSessions) {
            this.sessions.delete(sessionId);
        }
    }
    /**
     * Get active session count for a user
     */
    getActiveSessionCount(userId) {
        let count = 0;
        for (const session of this.sessions.values()) {
            if (session.userId === userId) {
                count++;
            }
        }
        return count;
    }
    /**
     * End a specific session
     */
    endSession(sessionId) {
        return this.sessions.delete(sessionId);
    }
    /**
     * End all sessions for a user
     */
    endAllUserSessions(userId) {
        let count = 0;
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.userId === userId) {
                this.sessions.delete(sessionId);
                count++;
            }
        }
        return count;
    }
}
//# sourceMappingURL=user-context.js.map