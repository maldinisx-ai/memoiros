/**
 * Storage Layer Index
 *
 * Exports database and user context management functionality
 */
export { MemoirOSStorage, type DatabaseConfig } from "./database.js";
export { UserContextManager, type UserContext, type UserSession, type UserContextManagerOptions, } from "./user-context.js";
export { MemCubeManager, type EmbeddingProvider, } from "./memcube-manager.js";
export { ChapterManager, } from "./chapter-manager.js";
export { AuthManager, type UserAccount, type UserRegistration, type UserLogin, type AuthResult, type UserAccountStatus, } from "./auth.js";
export { SessionManager, type Session, type SessionValidationResult, } from "./session.js";
//# sourceMappingURL=index.d.ts.map