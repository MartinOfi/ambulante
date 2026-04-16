import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ParseError, parseResponse } from "./parseResponse";

const storeSchema = z.object({
  id: z.string(),
  name: z.string(),
  isOpen: z.boolean(),
});

describe("parseResponse", () => {
  describe("happy path", () => {
    it("resolves with parsed data when the promise resolves with valid data", async () => {
      const rawData = { id: "s1", name: "Empanadas XYZ", isOpen: true };
      const result = await parseResponse(storeSchema, Promise.resolve(rawData));
      expect(result).toEqual(rawData);
    });

    it("strips unknown fields via Zod (strict default strip mode)", async () => {
      const rawData = { id: "s1", name: "Empanadas XYZ", isOpen: true, extra: "ignored" };
      const result = await parseResponse(storeSchema, Promise.resolve(rawData));
      expect(result).not.toHaveProperty("extra");
    });

    it("infers the correct TypeScript type (compile-time — type is checked by tsc)", async () => {
      const result = await parseResponse(
        storeSchema,
        Promise.resolve({ id: "1", name: "X", isOpen: false }),
      );
      // If this line compiles, the return type is z.infer<typeof storeSchema>
      const _name: string = result.name;
      expect(_name).toBe("X");
    });
  });

  describe("validation errors", () => {
    it("throws ParseError when data is missing required fields", async () => {
      const invalidData = { id: "s1" }; // missing name and isOpen
      await expect(parseResponse(storeSchema, Promise.resolve(invalidData))).rejects.toBeInstanceOf(
        ParseError,
      );
    });

    it("throws ParseError with the underlying ZodError attached", async () => {
      const invalidData = { id: 123, name: "X", isOpen: true }; // id should be string
      try {
        await parseResponse(storeSchema, Promise.resolve(invalidData));
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ParseError);
        const parseErr = err as ParseError;
        expect(parseErr.cause).toBeDefined();
        expect(parseErr.schemaName).toBe("ZodObject");
      }
    });

    it("throws ParseError with a descriptive message", async () => {
      await expect(parseResponse(storeSchema, Promise.resolve(null))).rejects.toThrow(
        /schema validation failed/i,
      );
    });
  });

  describe("network / upstream errors", () => {
    it("re-throws original error when the promise rejects (non-Zod error)", async () => {
      const networkError = new Error("Network timeout");
      await expect(parseResponse(storeSchema, Promise.reject(networkError))).rejects.toThrow(
        "Network timeout",
      );
    });

    it("does NOT wrap upstream errors in ParseError", async () => {
      const upstreamError = new Error("500 Internal Server Error");
      try {
        await parseResponse(storeSchema, Promise.reject(upstreamError));
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).not.toBeInstanceOf(ParseError);
      }
    });
  });

  describe("logger integration", () => {
    it("logs an error when schema validation fails", async () => {
      const logErrorSpy = vi.fn();
      const invalidData = { wrong: "shape" };

      await expect(
        parseResponse(storeSchema, Promise.resolve(invalidData), { onError: logErrorSpy }),
      ).rejects.toBeInstanceOf(ParseError);

      expect(logErrorSpy).toHaveBeenCalledOnce();
    });
  });
});
