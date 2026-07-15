import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PAID_PLAN_IDS = new Set(['basic', 'pro', 'premium']);

type SyncPayload = {
  planId?: string;
  name?: string;
  price?: number;
  features?: string[];
  is_popular?: boolean;
  trial_months?: number;
  promo_label?: string | null;
};

function eurosToCents(price: number): number {
  return Math.round(price * 100);
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeKey || !supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Server not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roleRow } = await supabaseUser
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleRow?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = (await req.json()) as SyncPayload;
    const planId = payload.planId?.trim();
    if (!planId) {
      return new Response(JSON.stringify({ error: 'Missing planId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const name = (payload.name ?? '').trim();
    const price = Number(payload.price);
    if (!name) {
      return new Response(JSON.stringify({ error: 'Invalid name' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!Number.isFinite(price) || price < 0) {
      return new Response(JSON.stringify({ error: 'Invalid price' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const trialMonths = Math.max(0, Math.floor(Number(payload.trial_months ?? 0)));
    const features = Array.isArray(payload.features)
      ? payload.features.map(f => String(f).trim()).filter(Boolean)
      : [];
    const promoLabel =
      trialMonths > 0 && payload.promo_label != null && String(payload.promo_label).trim() !== ''
        ? String(payload.promo_label).trim()
        : null;

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: current, error: loadError } = await admin
      .from('plans')
      .select('id, name, price, stripe_product_id, stripe_price_id')
      .eq('id', planId)
      .maybeSingle();

    if (loadError || !current) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let stripeProductId = (current.stripe_product_id as string | null) ?? null;
    let stripePriceId = (current.stripe_price_id as string | null) ?? null;
    let stripeSynced = false;

    if (PAID_PLAN_IDS.has(planId) && price > 0) {
      const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
      const amountCents = eurosToCents(price);

      if (!stripeProductId) {
        const product = await stripe.products.create({
          name: `Andorra Viva ${name}`,
          metadata: { plan_id: planId },
        });
        stripeProductId = product.id;
      } else {
        await stripe.products.update(stripeProductId, {
          name: `Andorra Viva ${name}`,
          metadata: { plan_id: planId },
          active: true,
        });
      }

      let needsNewPrice = !stripePriceId;
      let previousPriceId = stripePriceId;

      if (stripePriceId) {
        try {
          const existing = await stripe.prices.retrieve(stripePriceId);
          needsNewPrice =
            !existing.active ||
            existing.unit_amount !== amountCents ||
            existing.currency !== 'eur' ||
            existing.recurring?.interval !== 'month';
        } catch (err) {
          // Precio borrado o inaccesible en Stripe → recrear
          const msg = err instanceof Error ? err.message : String(err);
          if (/no such price/i.test(msg)) {
            needsNewPrice = true;
            previousPriceId = null;
            stripePriceId = null;
          } else {
            throw err;
          }
        }
      }

      if (needsNewPrice) {
        const created = await stripe.prices.create({
          product: stripeProductId,
          currency: 'eur',
          unit_amount: amountCents,
          recurring: { interval: 'month' },
          metadata: { plan_id: planId },
          nickname: `${planId}-${amountCents}`,
        });

        if (previousPriceId && previousPriceId !== created.id) {
          try {
            await stripe.prices.update(previousPriceId, { active: false });
          } catch {
            // El precio anterior puede estar ya archivado o borrado
          }
        }

        stripePriceId = created.id;
        await stripe.products.update(stripeProductId, {
          default_price: created.id,
        });
      }

      stripeSynced = true;
    } else {
      // Plan gratuito u oferta a 0 €: no usar Stripe
      stripePriceId = null;
    }

    const { error: updateError } = await admin
      .from('plans')
      .update({
        name,
        price,
        features,
        is_popular: !!payload.is_popular,
        trial_months: trialMonths,
        promo_label: promoLabel,
        stripe_product_id: stripeProductId,
        stripe_price_id: stripePriceId,
      })
      .eq('id', planId);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        planId,
        stripe_product_id: stripeProductId,
        stripe_price_id: stripePriceId,
        stripe_synced: stripeSynced,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
