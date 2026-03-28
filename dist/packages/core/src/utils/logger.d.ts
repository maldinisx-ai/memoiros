/**
 * Logger interface
 */
export interface Logger {
    info(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
    debug?(...args: unknown[]): void;
}
/**
 * Console logger
 */
export declare class ConsoleLogger implements Logger {
    private readonly prefix;
    constructor(prefix?: string);
    info(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
    debug(...args: unknown[]): void;
}
/**
 * No-op logger for silent mode
 */
export declare class NoopLogger implements Logger {
    info(): void;
    warn(): void;
    error(): void;
    debug(): void;
}
//# sourceMappingURL=logger.d.ts.map