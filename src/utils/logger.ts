/** Supported log levels in ascending severity. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Lightweight structured logger for Playwright tests.
 *
 * Prefixes every line with an ISO timestamp, the log level, and an optional
 * test-specific context label so that output from parallel workers is easy
 * to trace back to a specific test.
 */
export class Logger {
  private readonly minLevel: number;

  /**
   * @param context - A short label injected into every log line (e.g. test title).
   * @param minLevel - Minimum level to emit. Defaults to 'debug' locally and
   *                   'info' on CI (reads the CI env var).
   */
  constructor(
    private readonly context: string,
    minLevel?: LogLevel,
  ) {
    const defaultLevel: LogLevel = process.env.CI ? 'info' : 'debug';
    this.minLevel = LEVELS[minLevel ?? defaultLevel];
  }

  debug(message: string, data?: unknown): void {
    this.emit('debug', message, data);
  }

  info(message: string, data?: unknown): void {
    this.emit('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.emit('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.emit('error', message, data);
  }

  private emit(level: LogLevel, message: string, data?: unknown): void {
    if (LEVELS[level] < this.minLevel) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase().padEnd(5)}] [${this.context}]`;
    const line = data !== undefined
      ? `${prefix} ${message} ${JSON.stringify(data)}`
      : `${prefix} ${message}`;

    // Route to the appropriate console method so that test reporters can
    // colour-code output and CI log collectors can filter by level.
    switch (level) {
      case 'debug': console.debug(line); break;
      case 'info':  console.info(line);  break;
      case 'warn':  console.warn(line);  break;
      case 'error': console.error(line); break;
    }
  }
}
