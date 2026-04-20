import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@vercel/edge-config", () => ({
  get: vi.fn(),
  getAll: vi.fn(),
}));

import { get, getAll } from "@vercel/edge-config";
import { FLAG_KEYS } from "@/shared/constants/flags";
import { flagsService } from "@/shared/services/flags";
import { logger } from "@/shared/utils/logger";

const mockGet = vi.mocked(get);
const mockGetAll = vi.mocked(getAll);

describe("flagsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.EDGE_CONFIG;
  });

  describe("getFlag", () => {
    it("returns value from Edge Config when EDGE_CONFIG is set", async () => {
      process.env.EDGE_CONFIG = "https://edge-config.vercel.com/ecfg_test?token=test";
      mockGet.mockResolvedValueOnce(false);

      const result = await flagsService.getFlag(FLAG_KEYS.ENABLE_ORDERS);

      expect(mockGet).toHaveBeenCalledWith(FLAG_KEYS.ENABLE_ORDERS);
      expect(result).toBe(false);
    });

    it("returns default value when Edge Config value is undefined", async () => {
      process.env.EDGE_CONFIG = "https://edge-config.vercel.com/ecfg_test?token=test";
      mockGet.mockResolvedValueOnce(undefined);

      const result = await flagsService.getFlag(FLAG_KEYS.ENABLE_ORDERS);

      expect(result).toBe(true);
    });

    it("returns default value when EDGE_CONFIG env var is not set", async () => {
      const result = await flagsService.getFlag(FLAG_KEYS.ENABLE_PUSH_NOTIFICATIONS);

      expect(mockGet).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it("returns default and logs error when Edge Config throws", async () => {
      process.env.EDGE_CONFIG = "https://edge-config.vercel.com/ecfg_test?token=test";
      mockGet.mockRejectedValueOnce(new Error("Edge Config unreachable"));
      const logSpy = vi.spyOn(logger, "error");

      const result = await flagsService.getFlag(FLAG_KEYS.ENABLE_REALTIME);

      expect(result).toBe(true);
      expect(logSpy).toHaveBeenCalledWith(
        "Failed to read feature flag from Edge Config",
        expect.objectContaining({ key: FLAG_KEYS.ENABLE_REALTIME }),
      );
    });
  });

  describe("getAllFlags", () => {
    it("returns all flags from Edge Config when available", async () => {
      process.env.EDGE_CONFIG = "https://edge-config.vercel.com/ecfg_test?token=test";
      mockGetAll.mockResolvedValueOnce({
        enable_orders: true,
        enable_realtime: false,
        enable_push_notifications: true,
        enable_store_dashboard: true,
      });

      const result = await flagsService.getAllFlags();

      expect(result[FLAG_KEYS.ENABLE_ORDERS]).toBe(true);
      expect(result[FLAG_KEYS.ENABLE_REALTIME]).toBe(false);
      expect(result[FLAG_KEYS.ENABLE_PUSH_NOTIFICATIONS]).toBe(true);
    });

    it("returns defaults when EDGE_CONFIG is not set", async () => {
      const result = await flagsService.getAllFlags();

      expect(mockGetAll).not.toHaveBeenCalled();
      expect(result[FLAG_KEYS.ENABLE_ORDERS]).toBe(true);
      expect(result[FLAG_KEYS.ENABLE_PUSH_NOTIFICATIONS]).toBe(false);
    });

    it("returns defaults and logs error when Edge Config throws", async () => {
      process.env.EDGE_CONFIG = "https://edge-config.vercel.com/ecfg_test?token=test";
      mockGetAll.mockRejectedValueOnce(new Error("Edge Config unreachable"));
      const logSpy = vi.spyOn(logger, "error");

      const result = await flagsService.getAllFlags();

      expect(result[FLAG_KEYS.ENABLE_ORDERS]).toBe(true);
      expect(logSpy).toHaveBeenCalledWith(
        "Failed to read all feature flags from Edge Config",
        expect.objectContaining({ error: "Edge Config unreachable" }),
      );
    });

    it("falls back to defaults for flags missing in partial Edge Config response", async () => {
      process.env.EDGE_CONFIG = "https://edge-config.vercel.com/ecfg_test?token=test";
      mockGetAll.mockResolvedValueOnce({
        enable_orders: false,
      });

      const result = await flagsService.getAllFlags();

      expect(result[FLAG_KEYS.ENABLE_ORDERS]).toBe(false);
      expect(result[FLAG_KEYS.ENABLE_REALTIME]).toBe(true);
      expect(result[FLAG_KEYS.ENABLE_PUSH_NOTIFICATIONS]).toBe(false);
    });

    it("ignores non-boolean values from Edge Config and uses defaults", async () => {
      process.env.EDGE_CONFIG = "https://edge-config.vercel.com/ecfg_test?token=test";
      mockGetAll.mockResolvedValueOnce({
        enable_orders: "yes",
        enable_realtime: 1,
      });

      const result = await flagsService.getAllFlags();

      expect(result[FLAG_KEYS.ENABLE_ORDERS]).toBe(true);
      expect(result[FLAG_KEYS.ENABLE_REALTIME]).toBe(true);
    });
  });
});
