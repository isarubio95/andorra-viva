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

const PLAN_RANK: Record<string, number> = {
  free: 0,
  basic: 1,
  pro: 2,
  premium: 3,
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function priceIdFromPhaseItem(item: Stripe.SubscriptionSchedule.Phase.Item): string | null {
  const price = item.price;
  if (typeof price === 'string') return price;
  if (price && typeof price === 'object' && 'id' in price) return price.id;
  return null;
}

async function releaseSubscriptionSchedule(
  stripe: Stripe,
  subscription: Stripe.Subscription,
): Promise<Stripe.Subscription> {
  const scheduleRef = subscription.schedule;
  if (!scheduleRef) return subscription;

  const scheduleId = typeof scheduleRef === 'string' ? scheduleRef : scheduleRef.id;
  try {
    await stripe.subscriptionSchedules.release(scheduleId);
  } catch (err) {
    // Si ya está liberado/cancelado, seguimos con el retrieve fresco.
    console.warn('[checkout] release schedule:', err instanceof Error ? err.message : err);
  }
  return stripe.subscriptions.retrieve(subscription.id);
}

function mapStripeStatus(status: Stripe.Subscription.Status): string {
  if (status === 'trialing') return 'trialing';
  if (status === 'active') return 'active';
  if (status === 'past_due') return 'past_due';
  if (status === 'canceled') return 'canceled';
  return 'active';
}

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
      return jsonResponse({ error: 'Server not configured' }, 500);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const body = (await req.json()) as { planId?: string; returnOrigin?: string };
    const { planId } = body;
    const isFreeTarget = planId === 'free';
    if (!planId || (!PLAN_PRICE_ENV[planId] && !isFreeTarget)) {
      return jsonResponse({ error: 'Invalid plan' }, 400);
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

    if (!planRow) {
      return jsonResponse({ error: 'Plan not available for checkout' }, 400);
    }

    if (!isFreeTarget && Number(planRow.price) <= 0) {
      return jsonResponse({ error: 'Plan not available for checkout' }, 400);
    }

    const trialMonths =
      typeof planRow.trial_months === 'number' && planRow.trial_months > 0
        ? Math.floor(planRow.trial_months)
        : 0;

    let priceId: string | null = null;
    if (!isFreeTarget) {
      priceId =
        (typeof planRow.stripe_price_id === 'string' && planRow.stripe_price_id) ||
        Deno.env.get(PLAN_PRICE_ENV[planId]) ||
        null;
      if (!priceId) {
        return jsonResponse(
          {
            error:
              'Falta stripe_price_id del plan. Guárdalo desde Admin → Planes para sincronizar con Stripe.',
          },
          500,
        );
      }
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    const { data: subRow } = await supabase
      .from('subscriptions')
      .select('plan_id, stripe_customer_id, stripe_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let customerId = subRow?.stripe_customer_id as string | undefined;
    const existingSubscriptionId = subRow?.stripe_subscription_id as string | undefined;
    const currentPlanId = (subRow?.plan_id as string | undefined) ?? 'free';

    if (!customerId && !isFreeTarget) {
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

    // Ya hay suscripción Stripe: upgrade inmediato o downgrade al final del periodo.
    if (existingSubscriptionId) {
      let current = await stripe.subscriptions.retrieve(existingSubscriptionId);
      if (current.status === 'active' || current.status === 'trialing') {
        const currentRank = PLAN_RANK[currentPlanId] ?? 0;
        const nextRank = PLAN_RANK[planId] ?? 0;
        const isDowngrade = nextRank < currentRank;
        const periodEndIso = new Date(current.current_period_end * 1000).toISOString();

        // Pasar a free: cancelar al final del periodo; se mantiene el plan actual.
        if (isFreeTarget) {
          current = await releaseSubscriptionSchedule(stripe, current);
          if (!current.cancel_at_period_end) {
            current = await stripe.subscriptions.update(existingSubscriptionId, {
              cancel_at_period_end: true,
            });
          }

          await supabase
            .from('subscriptions')
            .update({
              pending_plan_id: 'free',
              cancel_at_period_end: true,
              current_period_end: periodEndIso,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);

          return jsonResponse({
            updated: true,
            scheduled: true,
            planId: currentPlanId,
            pendingPlanId: 'free',
            currentPeriodEnd: periodEndIso,
            url: `${appOrigin}/mi-cuenta?tab=plan&checkout=success`,
          });
        }

        if (!priceId) {
          return jsonResponse({ error: 'Missing price' }, 500);
        }

        if (!current.items.data[0]?.id) {
          return jsonResponse({ error: 'Subscription has no items' }, 500);
        }

        // Downgrade a plan de pago: schedule hasta fin de periodo.
        if (isDowngrade) {
          current = await releaseSubscriptionSchedule(stripe, current);
          if (current.cancel_at_period_end) {
            current = await stripe.subscriptions.update(existingSubscriptionId, {
              cancel_at_period_end: false,
            });
          }

          const schedule = await stripe.subscriptionSchedules.create({
            from_subscription: existingSubscriptionId,
          });

          const phase0 = schedule.phases[0];
          const phase0PriceId = priceIdFromPhaseItem(phase0.items[0]);
          if (!phase0PriceId) {
            return jsonResponse({ error: 'Current schedule phase has no price' }, 500);
          }

          await stripe.subscriptionSchedules.update(schedule.id, {
            end_behavior: 'release',
            phases: [
              {
                items: [
                  {
                    price: phase0PriceId,
                    quantity: phase0.items[0].quantity ?? 1,
                  },
                ],
                start_date: phase0.start_date,
                end_date: phase0.end_date,
                metadata: {
                  supabase_user_id: user.id,
                  plan_id: currentPlanId,
                },
              },
              {
                items: [{ price: priceId, quantity: 1 }],
                iterations: 1,
                metadata: {
                  supabase_user_id: user.id,
                  plan_id: planId,
                },
              },
            ],
          });

          await supabase
            .from('subscriptions')
            .update({
              pending_plan_id: planId,
              cancel_at_period_end: false,
              current_period_end: periodEndIso,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);

          return jsonResponse({
            updated: true,
            scheduled: true,
            planId: currentPlanId,
            pendingPlanId: planId,
            currentPeriodEnd: periodEndIso,
            url: `${appOrigin}/mi-cuenta?tab=plan&checkout=success`,
          });
        }

        // Upgrade (o mismo rango): cambio inmediato con prorrateo.
        current = await releaseSubscriptionSchedule(stripe, current);
        const upgradeItemId = current.items.data[0]?.id;
        if (!upgradeItemId) {
          return jsonResponse({ error: 'Subscription has no items' }, 500);
        }

        const updated = await stripe.subscriptions.update(existingSubscriptionId, {
          items: [{ id: upgradeItemId, price: priceId }],
          metadata: { supabase_user_id: user.id, plan_id: planId },
          proration_behavior: 'create_prorations',
          cancel_at_period_end: false,
        });

        await supabase
          .from('subscriptions')
          .update({
            plan_id: planId,
            pending_plan_id: null,
            cancel_at_period_end: false,
            status: mapStripeStatus(updated.status),
            stripe_subscription_id: updated.id,
            current_period_end: new Date(updated.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        return jsonResponse({
          updated: true,
          scheduled: false,
          planId,
          url: `${appOrigin}/mi-cuenta?tab=plan&checkout=success`,
        });
      }
    }

    if (isFreeTarget) {
      return jsonResponse(
        {
          error: 'No hay suscripción de pago en Stripe; el cambio se aplicará solo en la app.',
          localOnly: true,
        },
        400,
      );
    }

    // Downgrade sin suscripción Stripe: el cliente debe actualizar solo la BD.
    const currentRank = PLAN_RANK[currentPlanId] ?? 0;
    const nextRank = PLAN_RANK[planId] ?? 0;
    if (nextRank < currentRank) {
      return jsonResponse(
        {
          error: 'No hay suscripción Stripe activa; el cambio se aplicará solo en la app.',
          localOnly: true,
        },
        400,
      );
    }

    if (!priceId || !customerId) {
      return jsonResponse({ error: 'Missing customer or price' }, 500);
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

    return jsonResponse({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
});
