// @vitest-environment node
import { describe, it, expect } from "vitest";
import { findThresholdViolations } from "./check-bundle-sizes.mjs";

describe("findThresholdViolations", () => {
  const maxChunkSizeBytes = 500_000;

  it("returns empty array when all chunks are within threshold", () => {
    const sizeByFile = new Map([
      ["main-abc123.js", 100_000],
      ["vendors-def456.js", 400_000],
    ]);

    const violations = findThresholdViolations(sizeByFile, maxChunkSizeBytes);

    expect(violations).toEqual([]);
  });

  it("returns violation for chunk exceeding threshold", () => {
    const sizeByFile = new Map([
      ["main-abc123.js", 100_000],
      ["heavy-chunk-xyz.js", 600_000],
    ]);

    const violations = findThresholdViolations(sizeByFile, maxChunkSizeBytes);

    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain("heavy-chunk-xyz.js");
    expect(violations[0]).toContain("586 KB");
    expect(violations[0]).toContain("488 KB");
  });

  it("returns multiple violations when multiple chunks exceed threshold", () => {
    const sizeByFile = new Map([
      ["chunk-a.js", 600_000],
      ["chunk-b.js", 800_000],
      ["chunk-ok.js", 200_000],
    ]);

    const violations = findThresholdViolations(sizeByFile, maxChunkSizeBytes);

    expect(violations).toHaveLength(2);
  });

  it("returns empty array when map is empty", () => {
    const sizeByFile = new Map<string, number>();

    const violations = findThresholdViolations(sizeByFile, maxChunkSizeBytes);

    expect(violations).toEqual([]);
  });

  it("includes exact size and threshold in violation message", () => {
    const sizeByFile = new Map([["big-chunk.js", 1_000_000]]);
    const threshold = 500_000;

    const violations = findThresholdViolations(sizeByFile, threshold);

    expect(violations[0]).toMatch(/big-chunk\.js/);
    expect(violations[0]).toMatch(/977 KB/); // 1_000_000 / 1024 ≈ 977 KB
    expect(violations[0]).toMatch(/488 KB/); // 500_000 / 1024 ≈ 488 KB
  });
});
