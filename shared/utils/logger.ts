// Why a transport abstraction instead of calling console directly:
// F8.1 will register a Sentry transport here without touching any call site.
// This keeps the logger open for extension but closed for modification.

export type LogContext = Record<string, unknown>;

export type ErrorHook = (message: string, context?: LogContext) => void;

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  registerErrorHook(hook: ErrorHook): void;
}

type NodeEnv = "development" | "test" | "production";

const LOG_LEVEL_PREFIX = {
  debug: "[DEBUG]",
  info: "[INFO]",
  warn: "[WARN]",
  error: "[ERROR]",
} as const;

function buildDevLogger(registeredHook: { current: ErrorHook | null }): Logger {
  return {
    debug(message: string, context?: LogContext): void {
      console.debug(LOG_LEVEL_PREFIX.debug, message, context);
    },
    info(message: string, context?: LogContext): void {
      console.info(LOG_LEVEL_PREFIX.info, message, context);
    },
    warn(message: string, context?: LogContext): void {
      console.warn(LOG_LEVEL_PREFIX.warn, message, context);
    },
    error(message: string, context?: LogContext): void {
      console.error(LOG_LEVEL_PREFIX.error, message, context);
      registeredHook.current?.(message, context);
    },
    registerErrorHook(hook: ErrorHook): void {
      registeredHook.current = hook;
    },
  };
}

function buildProdLogger(registeredHook: { current: ErrorHook | null }): Logger {
  return {
    debug(_message: string, _context?: LogContext): void {
      // Intentionally silent in production — debug noise has no receiver.
    },
    info(_message: string, _context?: LogContext): void {
      // Intentionally silent in production — structured logs go via the hook.
    },
    warn(_message: string, _context?: LogContext): void {
      // Intentionally silent in production — structured logs go via the hook.
    },
    error(message: string, context?: LogContext): void {
      // In production, errors are routed to the registered hook (e.g. Sentry).
      // F8.1 registers the real implementation; until then this is a noop stub.
      registeredHook.current?.(message, context);
    },
    // F8.1 contract: call logger.registerErrorHook(Sentry.captureException)
    // once at app boot (e.g. in app/layout.tsx or instrumentation.ts).
    // Calling it again replaces the previous hook — last registration wins.
    registerErrorHook(hook: ErrorHook): void {
      registeredHook.current = hook;
    },
  };
}

export function createLogger(env: NodeEnv = "development"): Logger {
  const registeredHook: { current: ErrorHook | null } = { current: null };

  if (env === "production") {
    return buildProdLogger(registeredHook);
  }

  return buildDevLogger(registeredHook);
}

const resolvedEnv = (process.env.NODE_ENV as NodeEnv | undefined) ?? "development";

export const logger: Logger = createLogger(resolvedEnv);
