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
export class ConsoleLogger implements Logger {
  constructor(private readonly prefix = "") {}

  info(...args: unknown[]): void {
    console.log(`[${this.prefix}]`, ...args);
  }

  warn(...args: unknown[]): void {
    console.warn(`[${this.prefix}]`, ...args);
  }

  error(...args: unknown[]): void {
    console.error(`[${this.prefix}]`, ...args);
  }

  debug(...args: unknown[]): void {
    console.debug(`[${this.prefix}]`, ...args);
  }
}

/**
 * No-op logger for silent mode
 */
export class NoopLogger implements Logger {
  info(): void {}
  warn(): void {}
  error(): void {}
  debug(): void {}
}
