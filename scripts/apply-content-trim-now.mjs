/**
 * Aplica ya el recorte automático (vence la gracia y llama apply_overdue_plan_content_trims).
 * Uso: node scripts/apply-content-trim-now.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
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

const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const limRes = await sb.rpc('plan_content_limits', { p_plan_id: 'free' });
const maxP = limRes.data?.[0]?.max_photos ?? 3;
const maxS = limRes.data?.[0]?.max_services ?? 4;

const { data: before } = await sb.from('businesses').select('name,gallery,services');
const overBefore = (before || []).filter(
  (b) => (b.gallery || []).length > maxP || (b.services || []).length > maxS,
);
console.log(
  'over_before',
  overBefore.map((b) => ({
    name: b.name,
    photos: (b.gallery || []).length,
    services: (b.services || []).length,
  })),
);

// Usar ayer para evitar desfase de reloj cliente vs Postgres.
const past = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
const { data: due, error: dueErr } = await sb
  .from('subscriptions')
  .update({ content_trim_due_at: past })
  .not('content_trim_due_at', 'is', null)
  .select('user_id');
if (dueErr) throw dueErr;
console.log('expired_grace', (due || []).length);

const { data: result, error } = await sb.rpc('apply_overdue_plan_content_trims');
if (error) throw error;
console.log('rpc', JSON.stringify(result));

const discarded = Array.isArray(result?.discarded_urls)
  ? result.discarded_urls.filter((u) => typeof u === 'string' && u.length > 0)
  : [];
console.log('discarded_count', discarded.length);

let r2 = null;
if (
  discarded.length &&
  env.R2_ACCOUNT_ID &&
  env.R2_ACCESS_KEY_ID &&
  env.R2_SECRET_ACCESS_KEY &&
  env.R2_BUCKET_NAME
) {
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
    if (!m) return [...keys];
    const stem = m[1];
    for (const w of RESPONSIVE_WIDTHS) keys.add(`${stem}-w${w}.webp`);
    return [...keys];
  }

  const keySet = new Set();
  for (const url of discarded) {
    const k = keyFromUrl(url);
    if (k) for (const e of expand(k)) keySet.add(e);
  }
  const keys = [...keySet].slice(0, 200).map((Key) => ({ Key }));
  if (keys.length) {
    const out = await client.send(
      new DeleteObjectsCommand({
        Bucket: env.R2_BUCKET_NAME,
        Delete: { Objects: keys, Quiet: true },
      }),
    );
    r2 = { deleted: keys.length, errors: out.Errors?.length || 0 };
  } else {
    r2 = { deleted: 0, note: 'no keys parsed' };
  }
}
console.log('r2', r2);

const { data: after } = await sb.from('businesses').select('name,gallery,services');
const { count: trimLeft } = await sb
  .from('subscriptions')
  .select('*', { count: 'exact', head: true })
  .not('content_trim_due_at', 'is', null);
const stillOver = (after || []).filter(
  (b) => (b.gallery || []).length > maxP || (b.services || []).length > maxS,
);

console.log(
  JSON.stringify(
    {
      trimDueLeft: trimLeft,
      stillOver: stillOver.length,
      businesses: (after || []).map((b) => ({
        name: b.name,
        photos: (b.gallery || []).length,
        services: (b.services || []).length,
      })),
    },
    null,
    2,
  ),
);
