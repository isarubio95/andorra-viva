-- Permite a cada usuario profesional cambiar su plan (actualiza su propia fila en subscriptions)
-- Nota: el alta crea la fila vía trigger handle_new_user.

drop policy if exists "Users can update own subscription" on public.subscriptions;
create policy "Users can update own subscription"
on public.subscriptions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

