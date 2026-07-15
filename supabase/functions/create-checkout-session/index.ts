import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLAN_PRICE_ENV: Record<string, string> = {
  basic: 'STRIPE_PRICE_BASIC',
  pro: 'STRIPE_PRICE_PRO',
  premium: 'STRIPE_PRICE_PREMIUM',
};

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const siteUrl = Deno.env.get('PUBLIC_SITE_URL') ?? 'https://andorra-viva.vercel.app';

    if (!stripeKey || !supabaseUrl || !supabaseAnonKey) {
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

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as { planId?: string; returnOrigin?: string };
    const { planId } = body;
    if (!planId || !PLAN_PRICE_ENV[planId]) {
      return new Response(JSON.stringify({ error: 'Invalid plan' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const allowedOrigins = new Set(
      [siteUrl, 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'].map(u =>
        u.replace(/\/$/, ''),
      ),
    );
    const requestedOrigin = (body.returnOrigin ?? '').replace(/\/$/, '');
    const appOrigin = allowedOrigins.has(requestedOrigin) ? requestedOrigin : siteUrl;

    const { data: planRow } = await supabase
      .from('plans')
      .select('trial_months, stripe_price_id, price')
      .eq('id', planId)
      .maybeSingle();

    if (!planRow || Number(planRow.price) <= 0) {
      return new Response(JSON.stringify({ error: 'Plan not available for checkout' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const trialMonths =
      typeof planRow.trial_months === 'number' && planRow.trial_months > 0
        ? Math.floor(planRow.trial_months)
        : 0;

    const priceId =
      (typeof planRow.stripe_price_id === 'string' && planRow.stripe_price_id) ||
      Deno.env.get(PLAN_PRICE_ENV[planId]);
    if (!priceId) {
      return new Response(
        JSON.stringify({
          error:
            'Falta stripe_price_id del plan. Guárdalo desde Admin → Planes para sincronizar con Stripe.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    const { data: subRow } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let customerId = subRow?.stripe_customer_id as string | undefined;
    const existingSubscriptionId = subRow?.stripe_subscription_id as string | undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
    }

    // Ya hay suscripción Stripe: cambiar precio (upgrade/downgrade) sin nuevo Checkout.
    if (existingSubscriptionId) {
      const current = await stripe.subscriptions.retrieve(existingSubscriptionId);
      if (current.status === 'active' || current.status === 'trialing') {
        const itemId = current.items.data[0]?.id;
        if (!itemId) {
          return new Response(JSON.stringify({ error: 'Subscription has no items' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const updated = await stripe.subscriptions.update(existingSubscriptionId, {
          items: [{ id: itemId, price: priceId }],
          metadata: { supabase_user_id: user.id, plan_id: planId },
          proration_behavior: 'create_prorations',
        });

        const status =
          updated.status === 'trialing'
            ? 'trialing'
            : updated.status === 'active'
              ? 'active'
              : updated.status === 'past_due'
                ? 'past_due'
                : 'active';

        await supabase
          .from('subscriptions')
          .update({
            plan_id: planId,
            status,
            stripe_subscription_id: updated.id,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify({
            updated: true,
            planId,
            url: `${appOrigin}/mi-cuenta?tab=plan&checkout=success`,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }
    }

    const subscriptionData: Stripe.Checkout.SessionCreateParams['subscription_data'] = {
      metadata: { supabase_user_id: user.id, plan_id: planId },
    };

    if (trialMonths > 0) {
      subscriptionData.trial_period_days = trialMonths * 30;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appOrigin}/mi-cuenta?tab=plan&checkout=success`,
      cancel_url: `${appOrigin}/mi-cuenta?tab=plan&checkout=cancel`,
      metadata: { supabase_user_id: user.id, plan_id: planId },
      subscription_data: subscriptionData,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
