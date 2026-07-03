#!/usr/bin/env node
/**
 * Aplica las migraciones del panel admin al proyecto Supabase remoto.
 *
 * Requisitos:
 *   1. Vincular el proyecto: npx supabase link --project-ref TU_PROJECT_REF
 *   2. Tener acceso (login: npx supabase login)
 *   3. O bien definir SUPABASE_DB_PASSWORD con la contraseña de la BD
 *
 * Uso:
 *   node scripts/apply-admin-migrations.mjs
 *   npx supabase db push --linked --yes
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const migrations = [
  '20260703180000_admin_panel_site_settings.sql',
  '20260703190000_admin_reviews_delete_rpc.sql',
  '20260703200000_remove_legacy_plans.sql',
  '20260703210000_rename_basico_plan_to_free.sql',
];

console.log('Andorra Viva — migraciones del panel admin\n');
console.log('Archivos a aplicar:');
for (const m of migrations) {
  const path = join(root, 'supabase', 'migrations', m);
  console.log(`  ${existsSync(path) ? '✓' : '✗'} ${m}`);
}

console.log('\nEjecutando: npx supabase db push --linked --yes\n');

const result = spawnSync('npx', ['supabase', 'db push', '--linked', '--yes'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

if (result.status !== 0) {
  console.error(`
No se pudo aplicar automáticamente. Pasos manuales:

1. Vincula tu proyecto (si el enlace anterior falló):
   npx supabase login
   npx supabase link --project-ref jyjrvpglviozrsezocbj

2. Aplica migraciones:
   npx supabase db push --linked --yes

3. Despliega Edge Functions Stripe:
   npx supabase functions deploy create-checkout-session
   npx supabase functions deploy stripe-webhook --no-verify-jwt

4. Configura secrets en Supabase Dashboard → Edge Functions:
   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
   STRIPE_PRICE_BASIC, STRIPE_PRICE_PRO, STRIPE_PRICE_PREMIUM
   PUBLIC_SITE_URL
`);
  process.exit(result.status ?? 1);
}

console.log('\nMigraciones aplicadas correctamente.');
