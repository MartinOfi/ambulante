import { afterEach, describe, expect, it, vi } from "vitest";
import { STORAGE_BUCKETS } from "@/shared/constants/storage";

describe("services/index factory", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  describe("when NEXT_PUBLIC_SUPABASE_URL is absent (mock mode)", () => {
    it("authService resolves signIn without throwing", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
      const { authService } = await import("./index");
      const result = await authService.signIn({ email: "client@test.com", password: "password" });
      expect(result.success).toBe(true);
    });

    it("realtimeService has the expected interface", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
      const { realtimeService } = await import("./index");
      expect(realtimeService).toHaveProperty("subscribe");
      expect(realtimeService).toHaveProperty("unsubscribe");
      expect(realtimeService).toHaveProperty("status");
      expect(realtimeService).toHaveProperty("onStatusChange");
      expect(realtimeService).toHaveProperty("reconnect");
      expect(realtimeService).toHaveProperty("destroy");
    });

    it("pushService has the expected interface", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
      const { pushService } = await import("./index");
      expect(pushService).toHaveProperty("getPermissionStatus");
      expect(pushService).toHaveProperty("requestPermission");
      expect(pushService).toHaveProperty("subscribe");
      expect(pushService).toHaveProperty("unsubscribe");
      expect(pushService).toHaveProperty("sendTestNotification");
    });

    it("storageService has the expected interface", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
      const { storageService } = await import("./index");
      expect(storageService).toHaveProperty("upload");
      expect(storageService).toHaveProperty("remove");
      expect(storageService).toHaveProperty("getPublicUrl");
    });

    it("storageService.upload returns a successful mock result", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
      const { storageService } = await import("./index");
      const result = await storageService.upload({
        bucket: STORAGE_BUCKETS.STORE_LOGOS,
        path: "test/image.jpg",
        file: new Blob(["test"]),
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.path).toBe("test/image.jpg");
        expect(typeof result.data.url).toBe("string");
      }
    });

    it("storageService.getPublicUrl returns a string URL", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
      const { storageService } = await import("./index");
      const url = storageService.getPublicUrl({
        bucket: STORAGE_BUCKETS.STORE_LOGOS,
        path: "test.jpg",
      });
      expect(typeof url).toBe("string");
      expect(url.length).toBeGreaterThan(0);
    });

    it("storageService.upload URL matches getPublicUrl for the same bucket+path", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
      const { storageService } = await import("./index");
      const bucket = STORAGE_BUCKETS.STORE_LOGOS;
      const path = "logos/store.png";
      const result = await storageService.upload({ bucket, path, file: new Blob(["x"]) });
      expect(result.success).toBe(true);
      if (result.success) {
        const publicUrl = storageService.getPublicUrl({ bucket, path });
        expect(result.data.url).toBe(publicUrl);
        expect(result.data.url).toContain("mock-storage.ambulante.local");
      }
    });
  });

  describe("when NEXT_PUBLIC_SUPABASE_URL is set (supabase stub mode)", () => {
    it("authService has the expected interface", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://xyz.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
      const { authService } = await import("./index");
      expect(authService).toHaveProperty("signIn");
      expect(authService).toHaveProperty("signUp");
      expect(authService).toHaveProperty("signInWithMagicLink");
      expect(authService).toHaveProperty("signInWithGoogle");
      expect(authService).toHaveProperty("signOut");
      expect(authService).toHaveProperty("getSession");
      expect(authService).toHaveProperty("getUser");
      expect(authService).toHaveProperty("onAuthStateChange");
    });

    it("realtimeService.subscribe throws a TODO error", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://xyz.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
      const { realtimeService } = await import("./index");
      expect(() => realtimeService.subscribe("orders", () => {})).toThrow("TODO");
    });

    it("pushService.subscribe throws a TODO error", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://xyz.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
      const { pushService } = await import("./index");
      await expect(pushService.subscribe()).rejects.toThrow("TODO");
    });

    it("storageService.upload returns StorageResult (does not throw)", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://xyz.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
      const { storageService } = await import("./index");
      const result = await storageService.upload({
        bucket: STORAGE_BUCKETS.STORE_LOGOS,
        path: "test.jpg",
        file: new Blob(),
      });
      expect(result).toHaveProperty("success");
    });

    it("throws at module load when URL is set but ANON_KEY is missing", async () => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://xyz.supabase.co");
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
      await expect(import("./index")).rejects.toThrow("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    });
  });
});
