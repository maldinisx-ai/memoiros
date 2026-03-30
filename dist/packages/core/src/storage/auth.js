/**
 * Authentication Module
 *
 * Handles user registration, login, and password management
 */
import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
/**
 * Password hashing configuration
 * bcrypt handles salt generation internally, rounds determine cost factor
 */
const BCRYPT_ROUNDS = 12;
/**
 * Authentication Manager
 */
export class AuthManager {
    storage;
    tableName = "user_accounts";
    constructor(storage) {
        this.storage = storage;
    }
    /**
     * Hash password using bcrypt
     * bcrypt automatically generates and embeds a salt
     */
    async hashPassword(password) {
        return await bcrypt.hash(password, BCRYPT_ROUNDS);
    }
    /**
     * Verify password against hash using bcrypt
     */
    async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }
    /**
     * Initialize user accounts table
     */
    initializeSchema() {
        // This is called by database.ts during initialization
        // The actual schema is defined in database.ts
    }
    /**
     * Register a new user
     */
    async register(data) {
        // Validate input
        if (!data.username || data.username.length < 3) {
            return { success: false, message: "Username must be at least 3 characters" };
        }
        if (!data.password || data.password.length < 6) {
            return { success: false, message: "Password must be at least 6 characters" };
        }
        if (!data.email && !data.phone) {
            return { success: false, message: "Either email or phone is required" };
        }
        // Check if user already exists
        const existing = this.findUserByUsername(data.username);
        if (existing) {
            return { success: false, message: "Username already exists" };
        }
        if (data.email) {
            const existingEmail = this.findUserByEmail(data.email);
            if (existingEmail) {
                return { success: false, message: "Email already registered" };
            }
        }
        if (data.phone) {
            const existingPhone = this.findUserByPhone(data.phone);
            if (existingPhone) {
                return { success: false, message: "Phone already registered" };
            }
        }
        // Create user account
        const userId = randomUUID();
        const passwordHash = await this.hashPassword(data.password);
        const now = new Date().toISOString();
        const user = {
            userId,
            username: data.username,
            email: data.email,
            phone: data.phone,
            passwordHash,
            status: "active",
            createdAt: now,
            updatedAt: now,
            metadata: data.metadata ?? {},
        };
        this.storage.transaction(() => {
            this.saveUserAccount(user);
        });
        return { success: true, userId, message: "User registered successfully" };
    }
    /**
     * Login user
     */
    async login(data) {
        // Find user by identifier (username, email, or phone)
        let user = null;
        // Try username first
        user = this.findUserByUsername(data.identifier);
        // Try email
        if (!user && data.identifier.includes("@")) {
            user = this.findUserByEmail(data.identifier);
        }
        // Try phone
        if (!user && /^\d+$/.test(data.identifier)) {
            user = this.findUserByPhone(data.identifier);
        }
        if (!user) {
            return { success: false, message: "User not found" };
        }
        if (user.status !== "active") {
            return { success: false, message: `Account is ${user.status}` };
        }
        // Verify password using bcrypt
        const isValid = await this.verifyPassword(data.password, user.passwordHash);
        if (!isValid) {
            return { success: false, message: "Invalid password" };
        }
        // Update last login time
        this.storage.transaction(() => {
            const updatedUser = {
                ...user,
                lastLoginAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            this.saveUserAccount(updatedUser);
        });
        return { success: true, userId: user.userId, message: "Login successful" };
    }
    /**
     * Change password
     */
    async changePassword(userId, oldPassword, newPassword) {
        const user = this.loadUserAccount(userId);
        if (!user) {
            return { success: false, message: "User not found" };
        }
        if (newPassword.length < 6) {
            return { success: false, message: "New password must be at least 6 characters" };
        }
        // Verify old password using bcrypt
        const isValid = await this.verifyPassword(oldPassword, user.passwordHash);
        if (!isValid) {
            return { success: false, message: "Invalid old password" };
        }
        // Generate new password hash (bcrypt includes new salt)
        const newHash = await this.hashPassword(newPassword);
        this.storage.transaction(() => {
            const updatedUser = {
                ...user,
                passwordHash: newHash,
                updatedAt: new Date().toISOString(),
            };
            this.saveUserAccount(updatedUser);
        });
        return { success: true, userId, message: "Password changed successfully" };
    }
    /**
     * Suspend user account
     */
    suspendUser(userId) {
        const user = this.loadUserAccount(userId);
        if (!user) {
            return { success: false, message: "User not found" };
        }
        this.storage.transaction(() => {
            const updatedUser = {
                ...user,
                status: "suspended",
                updatedAt: new Date().toISOString(),
            };
            this.saveUserAccount(updatedUser);
        });
        return { success: true, userId, message: "User suspended" };
    }
    /**
     * Activate user account
     */
    activateUser(userId) {
        const user = this.loadUserAccount(userId);
        if (!user) {
            return { success: false, message: "User not found" };
        }
        this.storage.transaction(() => {
            const updatedUser = {
                ...user,
                status: "active",
                updatedAt: new Date().toISOString(),
            };
            this.saveUserAccount(updatedUser);
        });
        return { success: true, userId, message: "User activated" };
    }
    /**
     * Get user account by ID
     */
    getUserAccount(userId) {
        return this.loadUserAccount(userId);
    }
    /**
     * Request password reset (generate token)
     * Returns the reset token - in production, send this via email
     */
    async requestPasswordReset(data) {
        // Find user by identifier
        let user = null;
        // Try username first
        user = this.findUserByUsername(data.identifier);
        // Try email
        if (!user && data.identifier.includes("@")) {
            user = this.findUserByEmail(data.identifier);
        }
        // Try phone
        if (!user && /^\d+$/.test(data.identifier)) {
            user = this.findUserByPhone(data.identifier);
        }
        if (!user) {
            // Don't reveal if user exists or not for security
            return { success: true, message: "If the account exists, a password reset link will be sent" };
        }
        if (user.status !== "active") {
            return { success: false, message: `Account is ${user.status}` };
        }
        // Generate reset token (valid for 1 hour)
        const tokenId = randomUUID();
        const resetToken = this.generateResetToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
        const createdAt = new Date().toISOString();
        const tokenData = {
            tokenId,
            userId: user.userId,
            token: resetToken,
            expiresAt,
            createdAt,
        };
        this.storage.transaction(() => {
            this.saveResetToken(tokenData);
        });
        // In production, send this via email
        // For now, return it directly for testing
        return {
            success: true,
            userId: user.userId,
            message: "Password reset token generated",
            resetToken,
        };
    }
    /**
     * Reset password using token
     */
    async resetPassword(data) {
        if (!data.token || !data.newPassword) {
            return { success: false, message: "Token and new password are required" };
        }
        if (data.newPassword.length < 6) {
            return { success: false, message: "New password must be at least 6 characters" };
        }
        // Find valid reset token
        const tokenData = this.loadResetToken(data.token);
        if (!tokenData) {
            return { success: false, message: "Invalid or expired reset token" };
        }
        // Check if token is expired
        if (new Date(tokenData.expiresAt) < new Date()) {
            return { success: false, message: "Reset token has expired" };
        }
        // Check if token is already used
        if (tokenData.usedAt) {
            return { success: false, message: "Reset token has already been used" };
        }
        // Load user account
        const user = this.loadUserAccount(tokenData.userId);
        if (!user) {
            return { success: false, message: "User not found" };
        }
        // Generate new password hash
        const newHash = await this.hashPassword(data.newPassword);
        this.storage.transaction(() => {
            // Update user password
            const updatedUser = {
                ...user,
                passwordHash: newHash,
                updatedAt: new Date().toISOString(),
            };
            this.saveUserAccount(updatedUser);
            // Mark token as used
            const updatedToken = {
                ...tokenData,
                usedAt: new Date().toISOString(),
            };
            this.saveResetToken(updatedToken);
        });
        return { success: true, userId: user.userId, message: "Password reset successfully" };
    }
    /**
     * Clean up expired reset tokens (maintenance task)
     */
    cleanupExpiredTokens() {
        const stmt = this.storage.db.prepare(`
      DELETE FROM password_reset_tokens
      WHERE expires_at < datetime('now') OR used_at IS NOT NULL
    `);
        stmt.run();
    }
    // ============================================
    // Private Methods
    // ============================================
    /**
     * Generate a secure random reset token
     */
    generateResetToken() {
        const crypto = require("node:crypto");
        return crypto.randomBytes(32).toString("hex");
    }
    /**
     * Save reset token to database
     */
    saveResetToken(token) {
        const stmt = this.storage.db.prepare(`
      INSERT OR REPLACE INTO password_reset_tokens
      (token_id, user_id, token, expires_at, used_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
        stmt.run(token.tokenId, token.userId, token.token, token.expiresAt, token.usedAt ?? null, token.createdAt);
    }
    /**
     * Load reset token by token string
     */
    loadResetToken(token) {
        const stmt = this.storage.db.prepare(`
      SELECT * FROM password_reset_tokens WHERE token = ?
    `);
        const row = stmt.get(token);
        if (!row) {
            return null;
        }
        return {
            tokenId: row.token_id,
            userId: row.user_id,
            token: row.token,
            expiresAt: row.expires_at,
            usedAt: row.used_at ?? undefined,
            createdAt: row.created_at,
        };
    }
    /**
     * Save user account to database
     */
    saveUserAccount(user) {
        const stmt = this.storage.db.prepare(`
      INSERT OR REPLACE INTO ${this.tableName}
      (user_id, username, email, phone, password_hash, status,
       created_at, updated_at, last_login_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(user.userId, user.username, user.email ?? null, user.phone ?? null, user.passwordHash, user.status, user.createdAt, user.updatedAt, user.lastLoginAt ?? null, JSON.stringify(user.metadata));
    }
    /**
     * Load user account by ID
     */
    loadUserAccount(userId) {
        const stmt = this.storage.db.prepare(`
      SELECT * FROM ${this.tableName} WHERE user_id = ?
    `);
        const row = stmt.get(userId);
        if (!row) {
            return null;
        }
        return {
            userId: row.user_id,
            username: row.username,
            email: row.email ?? undefined,
            phone: row.phone ?? undefined,
            passwordHash: row.password_hash,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            lastLoginAt: row.last_login_at ?? undefined,
            metadata: JSON.parse(row.metadata),
        };
    }
    /**
     * Find user by username
     */
    findUserByUsername(username) {
        const stmt = this.storage.db.prepare(`
      SELECT * FROM ${this.tableName} WHERE username = ?
    `);
        const row = stmt.get(username);
        if (!row) {
            return null;
        }
        return {
            userId: row.user_id,
            username: row.username,
            email: row.email ?? undefined,
            phone: row.phone ?? undefined,
            passwordHash: row.password_hash,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            lastLoginAt: row.last_login_at ?? undefined,
            metadata: JSON.parse(row.metadata),
        };
    }
    /**
     * Find user by email
     */
    findUserByEmail(email) {
        const stmt = this.storage.db.prepare(`
      SELECT * FROM ${this.tableName} WHERE email = ?
    `);
        const row = stmt.get(email);
        if (!row) {
            return null;
        }
        return {
            userId: row.user_id,
            username: row.username,
            email: row.email ?? undefined,
            phone: row.phone ?? undefined,
            passwordHash: row.password_hash,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            lastLoginAt: row.last_login_at ?? undefined,
            metadata: JSON.parse(row.metadata),
        };
    }
    /**
     * Find user by phone
     */
    findUserByPhone(phone) {
        const stmt = this.storage.db.prepare(`
      SELECT * FROM ${this.tableName} WHERE phone = ?
    `);
        const row = stmt.get(phone);
        if (!row) {
            return null;
        }
        return {
            userId: row.user_id,
            username: row.username,
            email: row.email ?? undefined,
            phone: row.phone ?? undefined,
            passwordHash: row.password_hash,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            lastLoginAt: row.last_login_at ?? undefined,
            metadata: JSON.parse(row.metadata),
        };
    }
}
//# sourceMappingURL=auth.js.map