-- Habilitar RLS en plans (catálogo de precios público; gestión solo admin)

alter table public.plans enable row level security;

drop policy if exists "Anyone can read plans" on public.plans;
create policy "Anyone can read plans"
on public.plans for select
using (true);
