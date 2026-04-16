import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// RTL 16 auto-cleanup checks globalThis.afterEach, but Vitest doesn't set globals
// by default — register cleanup explicitly so the DOM is reset between tests.
afterEach(cleanup);
