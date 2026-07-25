-- Downgrade diferido: el plan actual se mantiene hasta current_period_end.
-- pending_plan_id = plan que se aplicará al renovar / al cancelar al final del periodo.

alter table public.subscriptions
  add column if not exists pending_plan_id text references public.plans (id),
  add column if not exists cancel_at_period_end boolean not null default false;

comment on column public.subscriptions.pending_plan_id is
  'Plan programado tras current_period_end (downgrade diferido). Null si no hay cambio pendiente.';

comment on column public.subscriptions.cancel_at_period_end is
  'True si la suscripción Stripe se cancelará al final del periodo (p. ej. pasar a free).';

create index if not exists idx_subscriptions_pending_plan
  on public.subscriptions (pending_plan_id)
  where pending_plan_id is not null;
