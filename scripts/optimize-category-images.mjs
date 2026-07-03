/**
 * Convierte PNGs de categorías a WebP responsivos (640w / 960w).
 * Uso: node scripts/optimize-category-images.mjs
 */
import { readdir, unlink } from 'node:fs/promises';
import { resolve, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../public/categories');
const WIDTHS = [640, 960];
const QUALITY = 82;

const files = (await readdir(DIR)).filter(name => extname(name).toLowerCase() === '.png');

for (const file of files) {
  const stem = basename(file, '.png');
  const input = resolve(DIR, file);

  for (const width of WIDTHS) {
    const output = resolve(DIR, `${stem}-${width}.webp`);
    const info = await sharp(input)
      .resize(width, null, { withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: QUALITY, effort: 6 })
      .toFile(output);

    console.log(`OK ${stem}-${width}.webp (${info.width}x${info.height}, ${info.size} bytes)`);
  }
}

for (const file of files) {
  await unlink(resolve(DIR, file));
  console.log(`Removed ${file}`);
}
