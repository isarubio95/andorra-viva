import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
import { DeleteObjectsCommand, S3Client } from 'https://esm.sh/@aws-sdk/client-s3@3.600.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

const RESPONSIVE_WIDTHS = [480, 768, 1280] as const;
const VARIANT_PATH_RE = /^(.*)-w(\d+)\.(webp|jpe?g|png)$/i;
const MAX_KEYS = 200;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function keyFromPublicUrl(url: string, publicBase: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  const base = publicBase.replace(/\/$/, '');
  if (trimmed.startsWith(`${base}/`)) {
    return decodeURIComponent(trimmed.slice(base.length + 1).split('?')[0] ?? '');
  }
  try {
    const parsed = new URL(trimmed);
    const path = parsed.pathname.replace(/^\//, '');
    return path ? decodeURIComponent(path) : null;
  } catch {
    return null;
  }
}

/** Incluye la key canónica y variantes -w480/-w768/-w1280 si aplica. */
function expandVariantKeys(key: string): string[] {
  const keys = new Set<string>([key]);
  const match = key.match(VARIANT_PATH_RE);
  if (!match) return [...keys];

  const stem = match[1];
  const ext = match[3].toLowerCase() === 'webp' ? 'webp' : match[3];
  for (const width of RESPONSIVE_WIDTHS) {
    keys.add(`${stem}-w${width}.${ext === 'jpg' || ext === 'jpeg' ? 'webp' : 'webp'}`);
    keys.add(`${stem}-w${width}.webp`);
  }
  return [...keys];
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const accountId = Deno.env.get('R2_ACCOUNT_ID');
    const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const bucketName = Deno.env.get('R2_BUCKET_NAME');
    const publicUrl = Deno.env.get('R2_PUBLIC_URL')?.replace(/\/$/, '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const cronSecret = Deno.env.get('CRON_SECRET');

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
      return jsonResponse({ error: 'R2 storage not configured' }, 500);
    }
    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse({ error: 'Server not configured' }, 500);
    }

    const cronHeader = req.headers.get('x-cron-secret');
    const isServiceCall = !!(cronSecret && cronHeader && cronHeader === cronSecret);

    let callerUserId: string | null = null;

    if (!isServiceCall) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401);

      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) return jsonResponse({ error: 'Unauthorized' }, 401);
      callerUserId = user.id;
    }

    const body = (await req.json()) as { urls?: string[]; keys?: string[] };
    const urls = Array.isArray(body.urls) ? body.urls : [];
    const explicitKeys = Array.isArray(body.keys) ? body.keys : [];

    const keySet = new Set<string>();
    for (const key of explicitKeys) {
      if (typeof key === 'string' && key.length > 0 && !key.includes('..')) {
        for (const expanded of expandVariantKeys(key)) keySet.add(expanded);
      }
    }
    for (const url of urls) {
      if (typeof url !== 'string') continue;
      const key = keyFromPublicUrl(url, publicUrl);
      if (!key || key.includes('..')) continue;
      if (callerUserId && !key.startsWith(`${callerUserId}/`)) continue;
      for (const expanded of expandVariantKeys(key)) keySet.add(expanded);
    }

    const keys = [...keySet].slice(0, MAX_KEYS);
    if (keys.length === 0) {
      return jsonResponse({ deleted: 0, keys: [] });
    }

    // Service calls (cron) may delete any key; user calls only own prefix (filtered above).
    if (!isServiceCall && !callerUserId) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });

    const result = await s3.send(
      new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {
          Objects: keys.map(Key => ({ Key })),
          Quiet: true,
        },
      }),
    );

    const errors = result.Errors?.map(e => ({ key: e.Key, code: e.Code, message: e.Message })) ?? [];

    // Silence unused service role (reserved for future audit logging)
    void serviceRoleKey;

    return jsonResponse({
      deleted: keys.length - errors.length,
      keys,
      errors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
});
