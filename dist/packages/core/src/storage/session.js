/**
 * Session Management Module
 *
 * Handles user session creation, validation, and cleanup
 */
import { randomUUID } from "node:crypto";
import { randomBytes } from "node:crypto";
/**
 * Session configuration
 */
const SESSION_DURATION_HOURS = 24;
const TOKEN_LENGTH = 64;
/**
 * Session Manager
 */
export class SessionManager {
    storage;
    tableName = "user_sessions";
    constructor(storage) {
        this.storage = storage;
    }
    /**
     * Generate a secure random token
     */
    generateToken() {
        const bytes = randomBytes(TOKEN_LENGTH);
        return bytes.toString("hex");
    }
    /**
     * Generate a session ID
     */
    generateSessionId() {
        return randomUUID();
    }
    /**
     * Calculate expiration time
     */
    calculateExpiration(hours = SESSION_DURATION_HOURS) {
        const now = new Date();
        now.setHours(now.getHours() + hours);
        return now.toISOString();
    }
    /**
     * Check if session is expired
     */
    isExpired(expiresAt) {
        return new Date(expiresAt) < new Date();
    }
    /**
     * Create a new session for a user
     */
    createSession(userId, options) {
        const sessionId = this.generateSessionId();
        const token = this.generateToken();
        const now = new Date().toISOString();
        const expiresAt = this.calculateExpiration(options?.durationHours);
        const session = {
            sessionId,
            userId,
            token,
            expiresAt,
            createdAt: now,
            ipAddress: options?.ipAddress,
            userAgent: options?.userAgent,
            metadata: options?.metadata ?? {},
        };
        this.storage.transaction(() => {
            this.saveSession(session);
        });
        return session;
    }
    /**
     * Validate a session token
     */
    validateSession(token) {
        const session = this.findSessionByToken(token);
        if (!session) {
            return { valid: false, message: "Session not found" };
        }
        if (this.isExpired(session.expiresAt)) {
            // Clean up expired session
            this.deleteSession(session.sessionId);
            return { valid: false, message: "Session expired" };
        }
        return {
            valid: true,
            userId: session.userId,
            sessionId: session.sessionId,
            message: "Session valid",
        };
    }
    /**
     * Refresh a session (extend expiration)
     */
    refreshSession(sessionId, hours) {
        const session = this.loadSession(sessionId);
        if (!session) {
            return null;
        }
        if (this.isExpired(session.expiresAt)) {
            this.deleteSession(sessionId);
            return null;
        }
        const refreshedSession = {
            ...session,
            expiresAt: this.calculateExpiration(hours),
        };
        this.storage.transaction(() => {
            this.saveSession(refreshedSession);
        });
        return refreshedSession;
    }
    /**
     * Refresh session by token
     */
    refreshToken(token, hours) {
        const session = this.findSessionByToken(token);
        if (!session) {
            return null;
        }
        return this.refreshSession(session.sessionId, hours);
    }
    /**
     * End a session (logout)
     */
    endSession(sessionId) {
        const session = this.loadSession(sessionId);
        if (!session) {
            return false;
        }
        this.deleteSession(sessionId);
        return true;
    }
    /**
     * End session by token (logout)
     */
    endSessionByToken(token) {
        const session = this.findSessionByToken(token);
        if (!session) {
            return false;
        }
        return this.endSession(session.sessionId);
    }
    /**
     * End all sessions for a user (logout everywhere)
     */
    endAllSessions(userId) {
        const sessions = this.listSessions(userId);
        for (const session of sessions) {
            this.deleteSession(session.sessionId);
        }
        return sessions.length;
    }
    /**
     * Get all active sessions for a user
     */
    listSessions(userId) {
        const stmt = this.storage.db.prepare(`
      SELECT * FROM ${this.tableName}
      WHERE user_id = ? AND expires_at > datetime('now')
      ORDER BY created_at DESC
    `);
        const rows = stmt.all(userId);
        return rows.map(row => {
            const r = row;
            return {
                sessionId: r.session_id,
                userId: r.user_id,
                token: r.token,
                expiresAt: r.expires_at,
                createdAt: r.created_at,
                ipAddress: r.ip_address ?? undefined,
                userAgent: r.user_agent ?? undefined,
                metadata: JSON.parse(r.metadata),
            };
        });
    }
    /**
     * Get session by ID
     */
    getSession(sessionId) {
        return this.loadSession(sessionId);
    }
    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions() {
        const stmt = this.storage.db.prepare(`
      DELETE FROM ${this.tableName}
      WHERE expires_at < datetime('now')
    `);
        const result = stmt.run();
        return result.changes;
    }
    /**
     * Clean up expired sessions for a specific user
     */
    cleanupExpiredSessionsForUser(userId) {
        const stmt = this.storage.db.prepare(`
      DELETE FROM ${this.tableName}
      WHERE user_id = ? AND expires_at < datetime('now')
    `);
        const result = stmt.run(userId);
        return result.changes;
    }
    /**
     * Get session count for a user
     */
    getSessionCount(userId) {
        const stmt = this.storage.db.prepare(`
      SELECT COUNT(*) as count FROM ${this.tableName}
      WHERE user_id = ? AND expires_at > datetime('now')
    `);
        const row = stmt.get(userId);
        return row.count;
    }
    // ============================================
    // Private Methods
    // ============================================
    /**
     * Save session to database
     */
    saveSession(session) {
        const stmt = this.storage.db.prepare(`
      INSERT OR REPLACE INTO ${this.tableName}
      (session_id, user_id, token, expires_at, created_at, ip_address, user_agent, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(session.sessionId, session.userId, session.token, session.expiresAt, session.createdAt, session.ipAddress ?? null, session.userAgent ?? null, JSON.stringify(session.metadata));
    }
    /**
     * Load session by ID
     */
    loadSession(sessionId) {
        const stmt = this.storage.db.prepare(`
      SELECT * FROM ${this.tableName} WHERE session_id = ?
    `);
        const row = stmt.get(sessionId);
        if (!row) {
            return null;
        }
        return {
            sessionId: row.session_id,
            userId: row.user_id,
            token: row.token,
            expiresAt: row.expires_at,
            createdAt: row.created_at,
            ipAddress: row.ip_address ?? undefined,
            userAgent: row.user_agent ?? undefined,
            metadata: JSON.parse(row.metadata),
        };
    }
    /**
     * Find session by token
     */
    findSessionByToken(token) {
        const stmt = this.storage.db.prepare(`
      SELECT * FROM ${this.tableName} WHERE token = ?
    `);
        const row = stmt.get(token);
        if (!row) {
            return null;
        }
        return {
            sessionId: row.session_id,
            userId: row.user_id,
            token: row.token,
            expiresAt: row.expires_at,
            createdAt: row.created_at,
            ipAddress: row.ip_address ?? undefined,
            userAgent: row.user_agent ?? undefined,
            metadata: JSON.parse(row.metadata),
        };
    }
    /**
     * Delete session by ID
     */
    deleteSession(sessionId) {
        const stmt = this.storage.db.prepare(`
      DELETE FROM ${this.tableName} WHERE session_id = ?
    `);
        stmt.run(sessionId);
    }
}
//# sourceMappingURL=session.js.map