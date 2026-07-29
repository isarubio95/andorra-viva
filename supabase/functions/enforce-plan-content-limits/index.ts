import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const cronSecret = Deno.env.get('CRON_SECRET');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: 'Server not configured' }, 500);
    }

    const cronHeader = req.headers.get('x-cron-secret');
    if (!cronSecret || !cronHeader || cronHeader !== cronSecret) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await admin.rpc('apply_overdue_plan_content_trims');
    if (error) {
      console.error('[enforce-plan-content-limits] rpc:', error.message);
      return jsonResponse({ error: error.message }, 500);
    }

    const payload = (data ?? {}) as {
      trimmed_businesses?: number;
      discarded_urls?: string[];
    };
    const discarded = Array.isArray(payload.discarded_urls)
      ? payload.discarded_urls.filter((u): u is string => typeof u === 'string' && u.length > 0)
      : [];

    let r2Result: unknown = null;
    if (discarded.length > 0) {
      const deleteRes = await fetch(`${supabaseUrl}/functions/v1/r2-delete-objects`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: anonKey ?? serviceRoleKey,
          'Content-Type': 'application/json',
          'x-cron-secret': cronSecret,
        },
        body: JSON.stringify({ urls: discarded }),
      });
      r2Result = await deleteRes.json().catch(() => ({ status: deleteRes.status }));
      if (!deleteRes.ok) {
        console.error('[enforce-plan-content-limits] r2-delete:', r2Result);
      }
    }

    return jsonResponse({
      ok: true,
      trimmed_businesses: payload.trimmed_businesses ?? 0,
      discarded_count: discarded.length,
      r2: r2Result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
});
