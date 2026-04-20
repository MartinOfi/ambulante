// @ts-check
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_MAX_CHUNK_SIZE_KB = 500;
const CHUNKS_DIR = ".next/static/chunks";

/**
 * @param {Map<string, number>} sizeByFile
 * @param {number} maxChunkSizeKb
 * @returns {string[]}
 */
export function findThresholdViolations(sizeByFile, maxChunkSizeKb) {
  const violations = [];

  for (const [file, bytes] of sizeByFile) {
    const actualKb = Math.round(bytes / 1024);
    if (actualKb > maxChunkSizeKb) {
      violations.push(`${file}: ${actualKb} KB exceeds threshold of ${maxChunkSizeKb} KB`);
    }
  }

  return violations;
}

/**
 * @param {string} dir
 * @param {Map<string, number>} sizeByFile
 * @returns {Map<string, number>}
 */
function collectChunkSizes(dir, sizeByFile = new Map()) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectChunkSizes(fullPath, sizeByFile);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      sizeByFile.set(fullPath, statSync(fullPath).size);
    }
  }
  return sizeByFile;
}

function main() {
  if (!existsSync(CHUNKS_DIR)) {
    process.stderr.write(`Error: '${CHUNKS_DIR}' not found. Run 'pnpm analyze' first.\n`);
    process.exit(1);
  }

  const rawEnv = process.env.MAX_CHUNK_SIZE_KB;
  const maxChunkSizeKb = rawEnv ? Number(rawEnv) : DEFAULT_MAX_CHUNK_SIZE_KB;

  if (!Number.isFinite(maxChunkSizeKb) || maxChunkSizeKb <= 0) {
    process.stderr.write(`Error: MAX_CHUNK_SIZE_KB="${rawEnv}" is not a valid positive number.\n`);
    process.exit(1);
  }

  const sizeByFile = collectChunkSizes(CHUNKS_DIR);
  const violations = findThresholdViolations(sizeByFile, maxChunkSizeKb);

  if (violations.length > 0) {
    process.stderr.write("Bundle size violations found:\n");
    for (const v of violations) {
      process.stderr.write(`  ✗ ${v}\n`);
    }
    process.exit(1);
  }

  process.stdout.write(`All ${sizeByFile.size} chunks within ${maxChunkSizeKb} KB threshold.\n`);
}

// Only run when invoked directly, not when imported for testing
const isMain = process.argv[1] != null && new URL(import.meta.url).pathname === process.argv[1];

if (isMain) {
  main();
}
