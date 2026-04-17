import sharp from "sharp";
import { readdir } from "fs/promises";
import { join, extname, basename } from "path";

const INPUT_DIR = "public/images";
const QUALITY = 82;

const files = await readdir(INPUT_DIR);
const jpgs = files.filter((f) => [".jpg", ".jpeg"].includes(extname(f).toLowerCase()));

for (const file of jpgs) {
  const input = join(INPUT_DIR, file);
  const output = join(INPUT_DIR, `${basename(file, extname(file))}.webp`);
  const info = await sharp(input).webp({ quality: QUALITY }).toFile(output);
  const kb = (info.size / 1024).toFixed(0);
  console.log(`${file} → ${basename(output)} (${kb} KB)`);
}
