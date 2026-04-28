import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// server-only throws in jsdom — mock it globally so server-only modules are
// testable. The Next.js build pipeline enforces the boundary in production.
vi.mock("server-only", () => ({}));

// RTL 16 auto-cleanup checks globalThis.afterEach, but Vitest doesn't set globals
// by default — register cleanup explicitly so the DOM is reset between tests.
afterEach(cleanup);
