import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const PROJECT_ROOT = join(import.meta.dirname, "../..");
const COMPONENT_EXTENSIONS = new Set([".tsx", ".jsx"]);
const IGNORED_DIRS = new Set(["node_modules", ".next", ".git", "dist", "build"]);
// [\s>] matches `<img ` and `<img\n` (vertically-formatted JSX)
const RAW_IMG_RE = /<img[\s>]/gi;

function collectComponentFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry)) continue;

    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      results.push(...collectComponentFiles(fullPath));
    } else if (COMPONENT_EXTENSIONS.has(extname(entry))) {
      results.push(fullPath);
    }
  }

  return results;
}

describe("Image optimization invariant", () => {
  it("has no raw <img> tags — all images must use next/image", () => {
    const files = collectComponentFiles(PROJECT_ROOT);
    const violations: string[] = [];

    for (const filePath of files) {
      const content = readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      RAW_IMG_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      // eslint-disable-next-line no-cond-assign
      while ((match = RAW_IMG_RE.exec(content)) !== null) {
        const lineIndex = content.slice(0, match.index).split("\n").length - 1;
        const trimmed = lines[lineIndex].trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
        violations.push(`${filePath}:${lineIndex + 1} → ${trimmed}`);
      }
    }

    expect(violations, `Raw <img> tags found:\n${violations.join("\n")}`).toHaveLength(0);
  });
});
