/**
 * Genera iconos PWA / apple-touch desde public/app-icon.svg
 * Uso: node scripts/generate-app-icons.mjs
 */
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(ROOT, 'public/app-icon.svg');
const OUT = resolve(ROOT, 'public');

const targets = [
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'favicon.png', size: 32 },
];

const svg = await readFile(SRC);

for (const { name, size } of targets) {
  const info = await sharp(svg)
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(resolve(OUT, name));
  console.log(`OK ${name} (${info.width}x${info.height}, ${info.size} bytes)`);
}
