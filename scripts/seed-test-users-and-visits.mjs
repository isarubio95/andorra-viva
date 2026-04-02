/**
 * Crea 10 usuarios de prueba (Auth) y registra hasta 50 visitas aleatorias en business_visits.
 *
 * Requisitos:
 * - Variables de entorno:
 *   - SUPABASE_SERVICE_ROLE_KEY (obligatoria; nunca la subas al repo)
 *   - SUPABASE_URL o VITE_SUPABASE_URL
 * - Tabla public.businesses con al menos un id
 * - Migración business_visits aplicada
 *
 * Uso:
 *   node scripts/seed-test-users-and-visits.mjs
 *   # o con npm:
 *   npm run seed:test-users
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomInt } from 'node:crypto';

function loadDotEnv() {
  const p = resolve(process.cwd(), '.env');
  if (!existsSync(p)) return;
  const text = readFileSync(p, 'utf8');
  for (const line of text.split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function visitMonthUtc() {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

loadDotEnv();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const testPassword = process.env.SEED_TEST_USER_PASSWORD || 'TestUser123!';
const userCount = Number(process.env.SEED_USER_COUNT || 10);
const visitTarget = Number(process.env.SEED_VISIT_COUNT || 50);

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Faltan variables: SUPABASE_SERVICE_ROLE_KEY y SUPABASE_URL (o VITE_SUPABASE_URL).\n' +
      'Añade la service role en .env local (no la commitees).'
  );
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: businesses, error: bizErr } = await admin.from('businesses').select('id').limit(500);
  if (bizErr) {
    console.error('Error leyendo businesses:', bizErr.message);
    process.exit(1);
  }
  const businessIds = (businesses ?? []).map((b) => b.id).filter(Boolean);
  if (businessIds.length === 0) {
    console.error('No hay negocios en public.businesses. Crea al menos uno antes de ejecutar el seed.');
    process.exit(1);
  }

  const stamp = Date.now();
  const createdUsers = [];

  console.log(`Creando ${userCount} usuarios (email confirmado)…`);
  for (let i = 0; i < userCount; i++) {
    const email = `test.user.${stamp}.${i}@example.local`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: testPassword,
      email_confirm: true,
      user_metadata: { full_name: `Usuario prueba ${i + 1}` },
    });
    if (error) {
      console.error(`No se pudo crear ${email}:`, error.message);
      continue;
    }
    createdUsers.push({ id: data.user.id, email });
    console.log(`  OK ${email} → ${data.user.id}`);
  }

  if (createdUsers.length === 0) {
    console.error('No se creó ningún usuario. Abortando visitas.');
    process.exit(1);
  }

  /** visitor_key en app suele ser UUID de sesión o string largo; usamos el user id (>= 8 chars). */
  const visitorKeys = createdUsers.map((u) => u.id);
  const month = visitMonthUtc();
  const maxPossible = businessIds.length * visitorKeys.length;
  const target = Math.min(visitTarget, maxPossible);

  if (target < visitTarget) {
    console.warn(
      `Solo caben ${maxPossible} visitas únicas este mes (negocio × visitante). Objetivo ajustado a ${target}.`
    );
  }

  console.log(`Insertando hasta ${target} filas en business_visits (mes ${month})…`);

  let inserted = 0;
  let attempts = 0;
  const maxAttempts = target * 80;

  while (inserted < target && attempts < maxAttempts) {
    attempts++;
    const business_id = businessIds[randomInt(businessIds.length)];
    const visitor_key = visitorKeys[randomInt(visitorKeys.length)];
    const { error } = await admin.from('business_visits').insert({
      business_id,
      visitor_key,
      visit_month: month,
    });
    if (error) {
      if (error.code === '23505') continue;
      console.warn('Insert visita:', error.message);
      continue;
    }
    inserted++;
  }

  console.log('\n--- Resumen ---');
  console.log(`Usuarios creados: ${createdUsers.length}`);
  console.log(`Contraseña común: ${testPassword}`);
  console.log(`Visitas insertadas: ${inserted} / objetivo ${target}`);
  if (inserted < target) {
    console.warn('No se alcanzó el objetivo (¿demasiados intentos duplicados?). Vuelve a ejecutar o añade negocios/usuarios.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
