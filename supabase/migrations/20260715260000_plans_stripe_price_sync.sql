-- IDs de Stripe en el catálogo de planes (fuente de verdad para Checkout).
-- Los Prices de Stripe son inmutables: al cambiar el precio del plan se crea uno nuevo
-- y se guarda aquí su id (ver Edge Function sync-plan-stripe).

alter table public.plans
  add column if not exists stripe_product_id text,
  add column if not exists stripe_price_id text;

comment on column public.plans.stripe_product_id is
  'Product ID de Stripe (prod_...) para planes de pago.';
comment on column public.plans.stripe_price_id is
  'Price ID activo de Stripe (price_...) usado en Checkout/suscripciones.';

-- Productos del entorno test + precios alineados con el panel (9.99 / 24.99 / 39.99 €)
update public.plans set
  stripe_product_id = 'prod_UtJLuv522dJbR9',
  stripe_price_id = 'price_1TtX26KE3jdEaqVcQGgoyrJR'
where id = 'basic';

update public.plans set
  stripe_product_id = 'prod_UtJLMTQuVNK1i0',
  stripe_price_id = 'price_1TtX27KE3jdEaqVcvucanRg2'
where id = 'pro';

update public.plans set
  stripe_product_id = 'prod_UtJLVmeiwOUqOM',
  stripe_price_id = 'price_1TtX28KE3jdEaqVc66iNWOZv'
where id = 'premium';
