import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async req => {
  const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
  const signature = req.headers.get('stripe-signature');

  if (!signature || !webhookSecret) {
    return new Response('Webhook not configured', { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const recordEvent = async (payload: {
    userId?: string | null;
    customerId?: string | null;
    subscriptionId?: string | null;
    eventType: string;
    amountCents?: number | null;
    currency?: string | null;
    status?: string | null;
    metadata?: Record<string, unknown>;
  }) => {
    await supabase.from('payment_events').upsert(
      {
        stripe_event_id: event.id,
        user_id: payload.userId ?? null,
        stripe_customer_id: payload.customerId ?? null,
        stripe_subscription_id: payload.subscriptionId ?? null,
        event_type: payload.eventType,
        amount_cents: payload.amountCents ?? null,
        currency: payload.currency ?? 'eur',
        status: payload.status ?? null,
        metadata: payload.metadata ?? {},
      },
      { onConflict: 'stripe_event_id' },
    );
  };

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          session.metadata?.supabase_user_id ??
          (typeof session.customer === 'string'
            ? (
                await supabase
                  .from('subscriptions')
                  .select('user_id')
                  .eq('stripe_customer_id', session.customer)
                  .maybeSingle()
              ).data?.user_id
            : null);
        const planId = session.metadata?.plan_id ?? 'pro';

        if (userId && session.subscription) {
          let subscriptionStatus = 'active';
          if (typeof session.subscription === 'string') {
            const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);
            subscriptionStatus =
              stripeSubscription.status === 'trialing' ? 'trialing' : 'active';
          }

          await supabase
            .from('subscriptions')
            .update({
              plan_id: planId,
              status: subscriptionStatus,
              stripe_customer_id:
                typeof session.customer === 'string' ? session.customer : null,
              stripe_subscription_id:
                typeof session.subscription === 'string' ? session.subscription : null,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

          await supabase.from('user_roles').upsert({
            user_id: userId,
            role: 'professional',
          });
        }

        await recordEvent({
          userId: userId as string | undefined,
          customerId: typeof session.customer === 'string' ? session.customer : null,
          subscriptionId:
            typeof session.subscription === 'string' ? session.subscription : null,
          eventType: event.type,
          amountCents: session.amount_total,
          currency: session.currency,
          status: 'completed',
          metadata: session.metadata as Record<string, unknown>,
        });
        break;
      }

      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === 'string' ? invoice.customer : null;
        const subscriptionId =
          typeof invoice.subscription === 'string' ? invoice.subscription : null;

        const { data: subRow } = customerId
          ? await supabase
              .from('subscriptions')
              .select('user_id')
              .eq('stripe_customer_id', customerId)
              .maybeSingle()
          : { data: null };

        if (subRow?.user_id) {
          await supabase
            .from('subscriptions')
            .update({
              status: event.type === 'invoice.paid' ? 'active' : 'past_due',
              stripe_subscription_id: subscriptionId,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', subRow.user_id);
        }

        await recordEvent({
          userId: subRow?.user_id,
          customerId,
          subscriptionId,
          eventType: event.type,
          amountCents: invoice.amount_paid,
          currency: invoice.currency,
          status: invoice.status,
        });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === 'string' ? subscription.customer : null;

        const { data: subRow } = customerId
          ? await supabase
              .from('subscriptions')
              .select('user_id')
              .eq('stripe_customer_id', customerId)
              .maybeSingle()
          : { data: null };

        if (subRow?.user_id) {
          const status =
            subscription.status === 'trialing'
              ? 'trialing'
              : subscription.status === 'active'
                ? 'active'
                : subscription.status === 'past_due'
                  ? 'past_due'
                  : subscription.status === 'canceled'
                    ? 'canceled'
                    : 'active';

          await supabase
            .from('subscriptions')
            .update({
              status,
              stripe_subscription_id: subscription.id,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', subRow.user_id);
        }

        await recordEvent({
          userId: subRow?.user_id,
          customerId,
          subscriptionId: subscription.id,
          eventType: event.type,
          status: subscription.status,
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === 'string' ? subscription.customer : null;

        const { data: subRow } = customerId
          ? await supabase
              .from('subscriptions')
              .select('user_id')
              .eq('stripe_customer_id', customerId)
              .maybeSingle()
          : { data: null };

        if (subRow?.user_id) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'canceled',
              plan_id: 'free',
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', subRow.user_id);
        }

        await recordEvent({
          userId: subRow?.user_id,
          customerId,
          subscriptionId: subscription.id,
          eventType: event.type,
          status: subscription.status,
        });
        break;
      }

      default:
        await recordEvent({ eventType: event.type });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Handler error';
    return new Response(message, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
