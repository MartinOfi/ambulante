// server-only guard: this module must never be bundled into client code.
// Next.js App Router will throw at build time if a client component imports this.
import "server-only";

import pino from "pino";

import type { ErrorHook, LogContext, Logger } from "@/shared/utils/logger";

type NodeEnv = "development" | "test" | "production";

const LOG_LEVELS = {
  debug: "debug",
  info: "info",
  warn: "warn",
  error: "error",
} as const;

type PinoInstance = ReturnType<typeof pino>;

function buildPinoTransport(env: NodeEnv): pino.TransportSingleOptions | undefined {
  if (env === "production") {
    return undefined;
  }
  return {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  };
}

function buildBaseLogger(env: NodeEnv): PinoInstance {
  const transport = buildPinoTransport(env);
  return pino({
    level: env === "production" ? LOG_LEVELS.info : LOG_LEVELS.debug,
    ...(transport !== undefined ? { transport } : {}),
  });
}

function wrapPinoChild(pinoChild: PinoInstance): Logger {
  const registeredHook: { current: ErrorHook | null } = { current: null };

  return {
    debug(message: string, context?: LogContext): void {
      pinoChild.debug(context ?? {}, message);
    },

    info(message: string, context?: LogContext): void {
      pinoChild.info(context ?? {}, message);
    },

    warn(message: string, context?: LogContext): void {
      pinoChild.warn(context ?? {}, message);
    },

    error(message: string, context?: LogContext): void {
      pinoChild.error(context ?? {}, message);
      registeredHook.current?.(message, context);
    },

    registerErrorHook(hook: ErrorHook): void {
      registeredHook.current = hook;
    },
  };
}

export function generateRequestId(): string {
  return crypto.randomUUID();
}

export function createRequestLogger(requestId: string): Logger {
  const child = baseLogger.child({ requestId }) as PinoInstance;
  return wrapPinoChild(child);
}

const resolvedEnv = (process.env.NODE_ENV as NodeEnv | undefined) ?? "development";

const baseLogger: PinoInstance = buildBaseLogger(resolvedEnv);

export const serverLogger: Logger = wrapPinoChild(baseLogger);
