/**
 * Session Management Module
 *
 * Handles user session creation, validation, and cleanup
 */

import { randomUUID } from "node:crypto";
import { randomBytes, createHash } from "node:crypto";
import type { MemoirOSStorage } from "./database.js";

/**
 * Session configuration
 */
const SESSION_DURATION_HOURS = 24;
const TOKEN_LENGTH = 64;

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
export class SessionManager {
  private readonly storage: MemoirOSStorage;
  private readonly tableName = "user_sessions";

  constructor(storage: MemoirOSStorage) {
    this.storage = storage;
  }

  /**
   * Generate a secure random token
   */
  private generateToken(): string {
    const bytes = randomBytes(TOKEN_LENGTH);
    return bytes.toString("hex");
  }

  /**
   * Generate a session ID
   */
  private generateSessionId(): string {
    return randomUUID();
  }

  /**
   * Calculate expiration time
   */
  private calculateExpiration(hours: number = SESSION_DURATION_HOURS): string {
    const now = new Date();
    now.setHours(now.getHours() + hours);
    return now.toISOString();
  }

  /**
   * Check if session is expired
   */
  private isExpired(expiresAt: string): boolean {
    return new Date(expiresAt) < new Date();
  }

  /**
   * Create a new session for a user
   */
  createSession(
    userId: string,
    options?: {
      durationHours?: number;
      ipAddress?: string;
      userAgent?: string;
      metadata?: Record<string, unknown>;
    }
  ): Session {
    const sessionId = this.generateSessionId();
    const token = this.generateToken();
    const now = new Date().toISOString();
    const expiresAt = this.calculateExpiration(options?.durationHours);

    const session: Session = {
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
  validateSession(token: string): SessionValidationResult {
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
  refreshSession(sessionId: string, hours?: number): Session | null {
    const session = this.loadSession(sessionId);

    if (!session) {
      return null;
    }

    if (this.isExpired(session.expiresAt)) {
      this.deleteSession(sessionId);
      return null;
    }

    const refreshedSession: Session = {
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
  refreshToken(token: string, hours?: number): Session | null {
    const session = this.findSessionByToken(token);

    if (!session) {
      return null;
    }

    return this.refreshSession(session.sessionId, hours);
  }

  /**
   * End a session (logout)
   */
  endSession(sessionId: string): boolean {
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
  endSessionByToken(token: string): boolean {
    const session = this.findSessionByToken(token);

    if (!session) {
      return false;
    }

    return this.endSession(session.sessionId);
  }

  /**
   * End all sessions for a user (logout everywhere)
   */
  endAllSessions(userId: string): number {
    const sessions = this.listSessions(userId);

    for (const session of sessions) {
      this.deleteSession(session.sessionId);
    }

    return sessions.length;
  }

  /**
   * Get all active sessions for a user
   */
  listSessions(userId: string): Session[] {
    const stmt = (this.storage as any).db.prepare(`
      SELECT * FROM ${this.tableName}
      WHERE user_id = ? AND expires_at > datetime('now')
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(userId) as ReadonlyArray<unknown>;

    return rows.map(row => {
      const r = row as {
        session_id: string;
        user_id: string;
        token: string;
        expires_at: string;
        created_at: string;
        ip_address: string | null;
        user_agent: string | null;
        metadata: string;
      };

      return {
        sessionId: r.session_id,
        userId: r.user_id,
        token: r.token,
        expiresAt: r.expires_at,
        createdAt: r.created_at,
        ipAddress: r.ip_address ?? undefined,
        userAgent: r.user_agent ?? undefined,
        metadata: JSON.parse(r.metadata) as Record<string, unknown>,
      };
    });
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): Session | null {
    return this.loadSession(sessionId);
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): number {
    const stmt = (this.storage as any).db.prepare(`
      DELETE FROM ${this.tableName}
      WHERE expires_at < datetime('now')
    `);

    const result = stmt.run();
    return result.changes;
  }

  /**
   * Clean up expired sessions for a specific user
   */
  cleanupExpiredSessionsForUser(userId: string): number {
    const stmt = (this.storage as any).db.prepare(`
      DELETE FROM ${this.tableName}
      WHERE user_id = ? AND expires_at < datetime('now')
    `);

    const result = stmt.run(userId);
    return result.changes;
  }

  /**
   * Get session count for a user
   */
  getSessionCount(userId: string): number {
    const stmt = (this.storage as any).db.prepare(`
      SELECT COUNT(*) as count FROM ${this.tableName}
      WHERE user_id = ? AND expires_at > datetime('now')
    `);

    const row = stmt.get(userId) as { count: number };
    return row.count;
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * Save session to database
   */
  private saveSession(session: Session): void {
    const stmt = (this.storage as any).db.prepare(`
      INSERT OR REPLACE INTO ${this.tableName}
      (session_id, user_id, token, expires_at, created_at, ip_address, user_agent, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      session.sessionId,
      session.userId,
      session.token,
      session.expiresAt,
      session.createdAt,
      session.ipAddress ?? null,
      session.userAgent ?? null,
      JSON.stringify(session.metadata)
    );
  }

  /**
   * Load session by ID
   */
  private loadSession(sessionId: string): Session | null {
    const stmt = (this.storage as any).db.prepare(`
      SELECT * FROM ${this.tableName} WHERE session_id = ?
    `);

    const row = stmt.get(sessionId) as unknown as {
      session_id: string;
      user_id: string;
      token: string;
      expires_at: string;
      created_at: string;
      ip_address: string | null;
      user_agent: string | null;
      metadata: string;
    } | undefined;

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
      metadata: JSON.parse(row.metadata) as Record<string, unknown>,
    };
  }

  /**
   * Find session by token
   */
  private findSessionByToken(token: string): Session | null {
    const stmt = (this.storage as any).db.prepare(`
      SELECT * FROM ${this.tableName} WHERE token = ?
    `);

    const row = stmt.get(token) as unknown as {
      session_id: string;
      user_id: string;
      token: string;
      expires_at: string;
      created_at: string;
      ip_address: string | null;
      user_agent: string | null;
      metadata: string;
    } | undefined;

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
      metadata: JSON.parse(row.metadata) as Record<string, unknown>,
    };
  }

  /**
   * Delete session by ID
   */
  private deleteSession(sessionId: string): void {
    const stmt = (this.storage as any).db.prepare(`
      DELETE FROM ${this.tableName} WHERE session_id = ?
    `);

    stmt.run(sessionId);
  }
}