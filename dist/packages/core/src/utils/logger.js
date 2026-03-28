/**
 * Logger interface
 */
/**
 * Console logger
 */
export class ConsoleLogger {
    prefix;
    constructor(prefix = "") {
        this.prefix = prefix;
    }
    info(...args) {
        console.log(`[${this.prefix}]`, ...args);
    }
    warn(...args) {
        console.warn(`[${this.prefix}]`, ...args);
    }
    error(...args) {
        console.error(`[${this.prefix}]`, ...args);
    }
    debug(...args) {
        console.debug(`[${this.prefix}]`, ...args);
    }
}
/**
 * No-op logger for silent mode
 */
export class NoopLogger {
    info() { }
    warn() { }
    error() { }
    debug() { }
}
//# sourceMappingURL=logger.js.map