import { type ZodError, type ZodType, type z } from "zod";
import { logger as defaultLogger } from "@/shared/utils/logger";

export interface ParseResponseOptions {
  readonly onError?: (message: string, context?: Record<string, unknown>) => void;
}

export class ParseError extends Error {
  readonly cause: ZodError;
  readonly schemaName: string;

  constructor(zodError: ZodError, schemaName: string) {
    super(`Schema validation failed: ${zodError.message}`);
    this.name = "ParseError";
    this.cause = zodError;
    this.schemaName = schemaName;
  }
}

export async function parseResponse<TSchema extends ZodType>(
  schema: TSchema,
  promise: Promise<unknown>,
  options: ParseResponseOptions = {},
): Promise<z.infer<TSchema>> {
  const reportError = options.onError ?? defaultLogger.error.bind(defaultLogger);

  const data = await promise;

  const result = schema.safeParse(data);

  if (!result.success) {
    const schemaName = schema.constructor.name;
    reportError("parseResponse: schema validation failed", {
      schemaName,
      issues: result.error.issues,
    });
    throw new ParseError(result.error, schemaName);
  }

  return result.data;
}
