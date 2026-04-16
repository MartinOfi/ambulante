import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// We import the store AFTER mocking localStorage so persist doesn't interfere.
// The store module is re-imported fresh per test via beforeEach reset.

describe("useUIStore", () => {
  beforeEach(() => {
    // Reset localStorage mock before each test
    localStorage.clear();
    // Reset the store to initial state between tests
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initial state", () => {
    it("starts with light theme", async () => {
      const { useUIStore } = await import("./ui");
      const state = useUIStore.getState();
      expect(state.theme).toBe("light");
    });

    it("starts with sidebar open", async () => {
      const { useUIStore } = await import("./ui");
      const state = useUIStore.getState();
      expect(state.isSidebarOpen).toBe(true);
    });
  });

  describe("setTheme", () => {
    it("updates theme to dark", async () => {
      const { useUIStore } = await import("./ui");
      useUIStore.getState().setTheme("dark");
      expect(useUIStore.getState().theme).toBe("dark");
    });

    it("updates theme back to light", async () => {
      const { useUIStore } = await import("./ui");
      useUIStore.getState().setTheme("dark");
      useUIStore.getState().setTheme("light");
      expect(useUIStore.getState().theme).toBe("light");
    });

    it("updates theme to system", async () => {
      const { useUIStore } = await import("./ui");
      useUIStore.getState().setTheme("system");
      expect(useUIStore.getState().theme).toBe("system");
    });
  });

  describe("toggleSidebar", () => {
    it("closes an open sidebar", async () => {
      const { useUIStore } = await import("./ui");
      // starts open (initial state)
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().isSidebarOpen).toBe(false);
    });

    it("opens a closed sidebar", async () => {
      const { useUIStore } = await import("./ui");
      useUIStore.getState().toggleSidebar(); // close
      useUIStore.getState().toggleSidebar(); // re-open
      expect(useUIStore.getState().isSidebarOpen).toBe(true);
    });
  });

  describe("setSidebarOpen", () => {
    it("explicitly sets sidebar to closed", async () => {
      const { useUIStore } = await import("./ui");
      useUIStore.getState().setSidebarOpen(false);
      expect(useUIStore.getState().isSidebarOpen).toBe(false);
    });

    it("explicitly sets sidebar to open", async () => {
      const { useUIStore } = await import("./ui");
      useUIStore.getState().setSidebarOpen(false);
      useUIStore.getState().setSidebarOpen(true);
      expect(useUIStore.getState().isSidebarOpen).toBe(true);
    });
  });

  describe("state immutability", () => {
    it("does not mutate previous state references on setTheme", async () => {
      const { useUIStore } = await import("./ui");
      const stateBefore = useUIStore.getState();
      useUIStore.getState().setTheme("dark");
      const stateAfter = useUIStore.getState();
      // The theme in the snapshot taken before must still be 'light'
      expect(stateBefore.theme).toBe("light");
      expect(stateAfter.theme).toBe("dark");
    });
  });
});
