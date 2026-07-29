/**
 * Verifica el estado del corte limpio Stripe live (solo lectura + checks).
 * Uso: node scripts/verify-stripe-live-cut.mjs
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

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

const LIVE_PRICES = {
  basic: 'price_1Tya1fK4TTooP903c5T1qRO9',
  pro: 'price_1Tya1gK4TTooP90312TKRiPt',
  premium: 'price_1Tya1hK4TTooP903ayXxFvN7',
};

async function main() {
  const key = env.STRIPE_SECRET_KEY || '';
  const mode = key.startsWith('sk_live') || key.startsWith('rk_live')
    ? 'LIVE'
    : key.startsWith('sk_test') || key.startsWith('rk_test')
      ? 'TEST'
      : 'UNKNOWN';

  console.log('Local STRIPE_SECRET_KEY mode:', mode);
  if (mode !== 'LIVE') {
    console.warn(
      '⚠ .env aún no tiene sk_live_/rk_live_. Las Edge Functions no cobrarán en live hasta rotar secrets.',
    );
  }

  const sb = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: plans, error: pErr } = await sb
    .from('plans')
    .select('id,stripe_product_id,stripe_price_id')
    .in('id', ['basic', 'pro', 'premium']);
  if (pErr) throw pErr;

  for (const p of plans) {
    const expected = LIVE_PRICES[p.id];
    const ok = p.stripe_price_id === expected;
    console.log(
      `plan ${p.id}: price=${p.stripe_price_id} ${ok ? 'OK' : 'MISMATCH expected ' + expected}`,
    );
  }

  const { count: paid } = await sb
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .neq('plan_id', 'free');
  const { count: withStripe } = await sb
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .or('stripe_customer_id.not.is.null,stripe_subscription_id.not.is.null');
  const { count: events } = await sb
    .from('payment_events')
    .select('*', { count: 'exact', head: true });
  const { count: trimDue } = await sb
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .not('content_trim_due_at', 'is', null);

  console.log({ paidSubscriptions: paid, withStripeIds: withStripe, paymentEvents: events, trimDue });

  const lim = await sb.rpc('plan_content_limits', { p_plan_id: 'free' });
  const maxP = lim.data?.[0]?.max_photos ?? lim.data?.max_photos;
  const maxS = lim.data?.[0]?.max_services ?? lim.data?.max_services;
  const { data: biz } = await sb.from('businesses').select('name,gallery,services');
  const over = (biz || []).filter(
    (b) => (b.gallery || []).length > maxP || (b.services || []).length > maxS,
  );
  console.log(`Businesses over free limits (${maxP} fotos / ${maxS} servicios):`, over.length);
  for (const b of over) {
    console.log(
      `  - ${b.name}: ${(b.gallery || []).length} fotos, ${(b.services || []).length} servicios`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
