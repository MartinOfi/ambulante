import { describe, expect, it } from "vitest";

import { extractErrorMessage } from "./errorMessage";
import { QUERY_ERROR_MESSAGE, MUTATION_ERROR_MESSAGE } from "@/shared/constants/ui-messages";

describe("extractErrorMessage", () => {
  describe("query errors (default message)", () => {
    it("returns query fallback for network error", () => {
      expect(extractErrorMessage(new Error("Network Error"))).toBe(QUERY_ERROR_MESSAGE);
    });

    it("returns query fallback for 5xx error", () => {
      expect(extractErrorMessage({ status: 503 })).toBe(QUERY_ERROR_MESSAGE);
    });

    it("returns query fallback for null", () => {
      expect(extractErrorMessage(null)).toBe(QUERY_ERROR_MESSAGE);
    });

    it("returns query fallback for undefined", () => {
      expect(extractErrorMessage(undefined)).toBe(QUERY_ERROR_MESSAGE);
    });

    it("returns query fallback for plain string error", () => {
      expect(extractErrorMessage("something broke")).toBe(QUERY_ERROR_MESSAGE);
    });
  });

  describe("mutation errors (explicit context)", () => {
    it("returns mutation fallback when context is mutation", () => {
      expect(extractErrorMessage(new Error("Network Error"), "mutation")).toBe(
        MUTATION_ERROR_MESSAGE,
      );
    });

    it("returns mutation fallback for 5xx mutation error", () => {
      expect(extractErrorMessage({ status: 500 }, "mutation")).toBe(MUTATION_ERROR_MESSAGE);
    });
  });

  describe("4xx errors — always suppressed (handled in-feature)", () => {
    it("returns null for 400 error", () => {
      expect(extractErrorMessage({ status: 400 })).toBeNull();
    });

    it("returns null for 401 error", () => {
      expect(extractErrorMessage({ status: 401 })).toBeNull();
    });

    it("returns null for 404 error", () => {
      expect(extractErrorMessage({ status: 404 })).toBeNull();
    });

    it("returns null for 422 error", () => {
      expect(extractErrorMessage({ status: 422 })).toBeNull();
    });

    it("returns null for 4xx mutation error too", () => {
      expect(extractErrorMessage({ status: 403 }, "mutation")).toBeNull();
    });
  });
});
