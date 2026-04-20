// @ts-check
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const MAX_CHUNK_SIZE_BYTES = 500_000;
const CHUNKS_DIR = ".next/static/chunks";

/**
 * @param {Map<string, number>} sizeByFile
 * @param {number} maxChunkSizeBytes
 * @returns {string[]}
 */
export function findThresholdViolations(sizeByFile, maxChunkSizeBytes) {
  const violations = [];
  const thresholdKb = Math.floor(maxChunkSizeBytes / 1024);

  for (const [file, bytes] of sizeByFile) {
    if (bytes > maxChunkSizeBytes) {
      const actualKb = Math.round(bytes / 1024);
      violations.push(`${file}: ${actualKb} KB exceeds threshold of ${thresholdKb} KB`);
    }
  }

  return violations;
}

/**
 * @param {string} dir
 * @returns {Map<string, number>}
 */
function collectChunkSizes(dir) {
  const sizeByFile = new Map();

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".js")) {
      const fullPath = join(dir, entry.name);
      const { size } = statSync(fullPath);
      sizeByFile.set(entry.name, size);
    }
  }

  return sizeByFile;
}

function main() {
  const sizeByFile = collectChunkSizes(CHUNKS_DIR);
  const violations = findThresholdViolations(sizeByFile, MAX_CHUNK_SIZE_BYTES);

  if (violations.length > 0) {
    process.stderr.write("Bundle size violations found:\n");
    for (const v of violations) {
      process.stderr.write(`  ✗ ${v}\n`);
    }
    process.exit(1);
  }

  process.stdout.write(
    `All ${sizeByFile.size} chunks within ${Math.floor(MAX_CHUNK_SIZE_BYTES / 1024)} KB threshold.\n`,
  );
}

// Only run when invoked directly, not when imported for testing
const isMain = process.argv[1] != null && new URL(import.meta.url).pathname === process.argv[1];

if (isMain) {
  main();
}
