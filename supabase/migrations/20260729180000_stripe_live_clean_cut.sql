-- Corte limpio Stripe test → live.
-- Idempotente: fija IDs live, resetea suscripciones de pago y limpia payment_events de test.
-- NO reaplicar la migración 20260715260000 (vuelve a sembrar IDs de test).

-- A. Catálogo de planes → Products/Prices live (STANSA APP CORPORATION)
update public.plans set
  stripe_product_id = 'prod_UyX5Yp3QVpysB6',
  stripe_price_id = 'price_1Tya1fK4TTooP903c5T1qRO9'
where id = 'basic';

update public.plans set
  stripe_product_id = 'prod_UyX5a4VOEtG3zU',
  stripe_price_id = 'price_1Tya1gK4TTooP90312TKRiPt'
where id = 'pro';

update public.plans set
  stripe_product_id = 'prod_UyX5f2BL7bOkgV',
  stripe_price_id = 'price_1Tya1hK4TTooP903ayXxFvN7'
where id = 'premium';

-- B. Suscripciones: sin cobro Stripe de test; plan free
update public.subscriptions
set
  plan_id = 'free',
  status = 'active',
  stripe_customer_id = null,
  stripe_subscription_id = null,
  current_period_end = null,
  pending_plan_id = null,
  cancel_at_period_end = false,
  content_trim_due_at = null
where stripe_customer_id is not null
   or stripe_subscription_id is not null
   or plan_id in ('basic', 'pro', 'premium');

-- Alinear caché de plan en negocios (por si el trigger no cubrió todos)
update public.businesses b
set owner_plan_id = coalesce(s.plan_id, 'free')
from public.subscriptions s
where s.user_id = b.owner_id
  and b.owner_plan_id is distinct from coalesce(s.plan_id, 'free');

update public.businesses
set owner_plan_id = 'free'
where owner_id is not null
  and not exists (
    select 1 from public.subscriptions s where s.user_id = businesses.owner_id
  )
  and owner_plan_id is distinct from 'free';

-- C. Historial de pagos de test
delete from public.payment_events;

-- Gracia 7 días para dueños over-limit respecto al plan free (fotos/servicios)
update public.subscriptions s
set content_trim_due_at = now() + interval '7 days'
where exists (
  select 1
  from public.businesses b
  cross join lateral public.plan_content_limits(coalesce(s.plan_id, 'free')) lim
  where b.owner_id = s.user_id
    and (
      cardinality(coalesce(b.gallery, '{}'::text[])) > lim.max_photos
      or cardinality(coalesce(b.services, '{}'::text[])) > lim.max_services
    )
);
