/**
 * Authentication Module
 *
 * Handles user registration, login, and password management
 */
import type { MemoirOSStorage } from "./database.js";
/**
 * User account status
 */
export type UserAccountStatus = "active" | "suspended" | "deleted";
/**
 * User account data
 * Note: salt is embedded in passwordHash by bcrypt, no separate field needed
 */
export interface UserAccount {
    userId: string;
    username: string;
    email?: string;
    phone?: string;
    passwordHash: string;
    status: UserAccountStatus;
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string;
    metadata: Record<string, unknown>;
}
/**
 * User registration data
 */
export interface UserRegistration {
    username: string;
    email?: string;
    phone?: string;
    password: string;
    metadata?: Record<string, unknown>;
}
/**
 * User login data
 */
export interface UserLogin {
    identifier: string;
    password: string;
}
/**
 * Authentication result
 */
export interface AuthResult {
    success: boolean;
    userId?: string;
    message: string;
}
/**
 * Password reset token data
 */
export interface PasswordResetToken {
    tokenId: string;
    userId: string;
    token: string;
    expiresAt: string;
    usedAt?: string;
    createdAt: string;
}
/**
 * Password reset request
 */
export interface PasswordResetRequest {
    identifier: string;
}
/**
 * Password reset confirmation
 */
export interface PasswordResetConfirm {
    token: string;
    newPassword: string;
}
/**
 * Authentication Manager
 */
export declare class AuthManager {
    private readonly storage;
    private readonly tableName;
    constructor(storage: MemoirOSStorage);
    /**
     * Hash password using bcrypt
     * bcrypt automatically generates and embeds a salt
     */
    private hashPassword;
    /**
     * Verify password against hash using bcrypt
     */
    private verifyPassword;
    /**
     * Initialize user accounts table
     */
    initializeSchema(): void;
    /**
     * Register a new user
     */
    register(data: UserRegistration): Promise<AuthResult>;
    /**
     * Login user
     */
    login(data: UserLogin): Promise<AuthResult>;
    /**
     * Change password
     */
    changePassword(userId: string, oldPassword: string, newPassword: string): Promise<AuthResult>;
    /**
     * Suspend user account
     */
    suspendUser(userId: string): AuthResult;
    /**
     * Activate user account
     */
    activateUser(userId: string): AuthResult;
    /**
     * Get user account by ID
     */
    getUserAccount(userId: string): UserAccount | null;
    /**
     * Request password reset (generate token)
     * Returns the reset token - in production, send this via email
     */
    requestPasswordReset(data: PasswordResetRequest): Promise<AuthResult & {
        resetToken?: string;
    }>;
    /**
     * Reset password using token
     */
    resetPassword(data: PasswordResetConfirm): Promise<AuthResult>;
    /**
     * Clean up expired reset tokens (maintenance task)
     */
    cleanupExpiredTokens(): void;
    /**
     * Generate a secure random reset token
     */
    private generateResetToken;
    /**
     * Save reset token to database
     */
    private saveResetToken;
    /**
     * Load reset token by token string
     */
    private loadResetToken;
    /**
     * Save user account to database
     */
    private saveUserAccount;
    /**
     * Load user account by ID
     */
    private loadUserAccount;
    /**
     * Find user by username
     */
    private findUserByUsername;
    /**
     * Find user by email
     */
    private findUserByEmail;
    /**
     * Find user by phone
     */
    private findUserByPhone;
}
//# sourceMappingURL=auth.d.ts.map