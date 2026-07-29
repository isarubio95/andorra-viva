/**
 * Borra de R2 una lista de URLs descartadas por el trim (stdin JSON o argv).
 * Uso: node scripts/delete-r2-urls.mjs urls.json
 */
import fs from 'fs';
import { S3Client, DeleteObjectsCommand } from '@aws-sdk/client-s3';

const env = Object.fromEntries(
  fs
    .readFileSync('.env', 'utf8')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const file = process.argv[2];
if (!file) {
  console.error('Uso: node scripts/delete-r2-urls.mjs <urls.json>');
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
const discarded = Array.isArray(raw) ? raw : raw.discarded_urls || [];
const r2Only = discarded.filter((u) => typeof u === 'string' && u.includes('r2.dev'));

const publicBase = (env.R2_PUBLIC_URL || env.VITE_R2_PUBLIC_URL || '').replace(/\/$/, '');
const client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const RESPONSIVE_WIDTHS = [480, 768, 1280];
const VARIANT_PATH_RE = /^(.*)-w(\d+)\.(webp|jpe?g|png)$/i;

function keyFromUrl(url) {
  const trimmed = String(url || '').trim();
  if (!trimmed) return null;
  if (publicBase && trimmed.startsWith(`${publicBase}/`)) {
    return decodeURIComponent(trimmed.slice(publicBase.length + 1).split('?')[0] || '');
  }
  try {
    return decodeURIComponent(new URL(trimmed).pathname.replace(/^\//, ''));
  } catch {
    return null;
  }
}

function expand(key) {
  const keys = new Set([key]);
  const m = key.match(VARIANT_PATH_RE);
  if (m) {
    const stem = m[1];
    for (const w of RESPONSIVE_WIDTHS) keys.add(`${stem}-w${w}.webp`);
  } else {
    const base = key.replace(/\.(jpe?g|png|webp)$/i, '');
    for (const w of RESPONSIVE_WIDTHS) keys.add(`${base}-w${w}.webp`);
  }
  return [...keys];
}

const keySet = new Set();
for (const url of r2Only) {
  const k = keyFromUrl(url);
  if (k) for (const e of expand(k)) keySet.add(e);
}
const keys = [...keySet].map((Key) => ({ Key }));
console.log({ input: discarded.length, r2Only: r2Only.length, keys: keys.length });

if (!keys.length) {
  console.log('Nada que borrar en R2');
  process.exit(0);
}

const out = await client.send(
  new DeleteObjectsCommand({
    Bucket: env.R2_BUCKET_NAME,
    Delete: { Objects: keys, Quiet: false },
  }),
);
console.log(
  JSON.stringify(
    {
      deleted: (out.Deleted || []).length,
      errors: out.Errors || [],
    },
    null,
    2,
  ),
);
