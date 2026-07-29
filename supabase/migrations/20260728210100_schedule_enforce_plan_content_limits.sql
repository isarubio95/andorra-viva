-- Programa el auto-recorte diario si pg_cron + pg_net están disponibles (Supabase).
-- Requiere secrets: CRON_SECRET en Edge Functions, y project URL.

do $$
declare
  has_cron boolean;
  has_net boolean;
  project_url text;
  cron_secret text;
begin
  select exists (select 1 from pg_extension where extname = 'pg_cron') into has_cron;
  select exists (select 1 from pg_extension where extname = 'pg_net') into has_net;

  if not has_cron or not has_net then
    raise notice 'pg_cron/pg_net no disponibles: programa enforce-plan-content-limits en el dashboard de Supabase (cron diario).';
    return;
  end if;

  -- URL del proyecto (Supabase inyecta a menudo via settings; fallback a app.settings)
  begin
    project_url := nullif(current_setting('app.settings.supabase_url', true), '');
  exception when others then
    project_url := null;
  end;

  begin
    cron_secret := nullif(current_setting('app.settings.cron_secret', true), '');
  exception when others then
    cron_secret := null;
  end;

  if project_url is null or cron_secret is null then
    raise notice 'Falta app.settings.supabase_url o app.settings.cron_secret: configura el cron de enforce-plan-content-limits manualmente.';
    return;
  end if;

  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'enforce-plan-content-limits-daily';

  perform cron.schedule(
    'enforce-plan-content-limits-daily',
    '15 3 * * *',
    format(
      $cron$
      select net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', %L
        ),
        body := '{}'::jsonb
      );
      $cron$,
      rtrim(project_url, '/') || '/functions/v1/enforce-plan-content-limits',
      cron_secret
    )
  );
end;
$$;
