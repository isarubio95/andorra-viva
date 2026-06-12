/**
 * Inserta reseñas aleatorias para todos los negocios usando usuarios existentes en Auth.
 * Cada negocio recibe varias reseñas de usuarios que no son el titular.
 *
 * Requisitos: SUPABASE_SERVICE_ROLE_KEY y SUPABASE_URL (o VITE_SUPABASE_URL) en .env
 *
 * Uso: npm run seed:reviews
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

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function userDisplayName(user) {
  return (
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'Usuario'
  );
}

const COMMENTS = {
  positive: [
    'Muy buena experiencia, volveré sin duda.',
    'Atención excelente y ambiente acogedor.',
    'Relación calidad-precio muy buena para Andorra.',
    'Todo perfecto, lo recomiendo a familiares y amigos.',
    'Personal amable y servicio rápido.',
    'Un sitio de referencia en la zona.',
    'Superó mis expectativas, gran descubrimiento.',
    'Muy profesionales y detallistas.',
    'Ambiente agradable y trato cercano.',
    'Volveremos la próxima vez que estemos por aquí.',
  ],
  mixed: [
    'En general bien, aunque el servicio fue un poco lento.',
    'Buena calidad, pero el precio es algo elevado.',
    'Buen sitio, aunque habría que mejorar la reserva online.',
    'Correcto, sin más. Cumple lo esperado.',
    'Buena atención, pero el parking es complicado.',
    'Repetiría, aunque esperaba un poco más.',
  ],
  category: {
    Gastronomía: [
      'Platos muy sabrosos y raciones generosas.',
      'Carta variada y producto de calidad.',
      'La terraza con vistas es un plus.',
      'Menú del día muy recomendable.',
    ],
    Alojamiento: [
      'Habitación limpia y cómoda.',
      'Desayuno variado y buena ubicación.',
      'Check-in rápido y buen descanso.',
      'Instalaciones cuidadas y personal atento.',
    ],
    'Ocio y entretenimiento': [
      'Actividad divertida para toda la familia.',
      'Muy entretenido, ideal para pasar la tarde.',
      'Buena organización y material en buen estado.',
    ],
    'Turismo y experiencias': [
      'Guía muy preparado y ruta bien planificada.',
      'Experiencia única, merece la pena.',
      'Vistas espectaculares y explicaciones claras.',
    ],
    Compras: [
      'Buena selección de productos.',
      'Trato comercial excelente.',
      'Variedad y buenos precios.',
    ],
    Bienestar: [
      'Sesión muy relajante, salí renovado.',
      'Instalaciones limpias y ambiente tranquilo.',
      'Tratamiento profesional de principio a fin.',
    ],
  },
};

function pickComment(category, rating) {
  const pool = rating >= 4 ? COMMENTS.positive : rating === 3 ? COMMENTS.mixed : COMMENTS.mixed;
  const catPool = COMMENTS.category[category] ?? [];
  const combined = [...pool, ...catPool];
  return combined[randomInt(combined.length)];
}

function pickRating() {
  const roll = randomInt(100);
  if (roll < 45) return 5;
  if (roll < 75) return 4;
  if (roll < 90) return 3;
  if (roll < 97) return 2;
  return 1;
}

async function listAllUsers(admin) {
  const users = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const batch = data?.users ?? [];
    users.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
  }

  return users;
}

loadDotEnv();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const minReviews = Number(process.env.SEED_REVIEWS_MIN || 4);
const maxReviews = Number(process.env.SEED_REVIEWS_MAX || 8);

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

async function recalcBusinessRatings(businessIds) {
  for (const businessId of businessIds) {
    const { data: stats, error: statsErr } = await admin
      .from('reviews')
      .select('rating')
      .eq('business_id', businessId);

    if (statsErr) {
      console.warn(`  No se pudo leer reseñas de ${businessId}:`, statsErr.message);
      continue;
    }

    const rows = stats ?? [];
    const review_count = rows.length;
    const rating =
      review_count === 0
        ? 0
        : Math.round((rows.reduce((s, r) => s + r.rating, 0) / review_count) * 100) / 100;

    const { error: updErr } = await admin
      .from('businesses')
      .update({ rating, review_count })
      .eq('id', businessId);

    if (updErr) {
      console.warn(`  No se pudo actualizar rating de ${businessId}:`, updErr.message);
    }
  }
}

async function main() {
  const users = await listAllUsers(admin);
  if (users.length < 2) {
    console.error('Se necesitan al menos 2 usuarios en Auth. Ejecuta: npm run seed:test-users');
    process.exit(1);
  }

  const { data: businesses, error: bizErr } = await admin
    .from('businesses')
    .select('id, name, owner_id, category');

  if (bizErr) {
    console.error('Error leyendo businesses:', bizErr.message);
    process.exit(1);
  }

  if (!businesses?.length) {
    console.error('No hay negocios en public.businesses.');
    process.exit(1);
  }

  console.log(`Usuarios existentes: ${users.length}`);
  console.log(`Negocios: ${businesses.length}`);
  console.log(`Objetivo: ${minReviews}-${maxReviews} reseñas por negocio (sin incluir al titular)\n`);

  let inserted = 0;
  let skipped = 0;
  const touchedBusinessIds = new Set();

  for (const business of businesses) {
    const eligible = users.filter((u) => u.id !== business.owner_id);
    if (eligible.length === 0) {
      console.warn(`  ${business.name}: sin usuarios elegibles (solo titular)`);
      continue;
    }

    const target = Math.min(
      eligible.length,
      minReviews + randomInt(Math.max(1, maxReviews - minReviews + 1))
    );
    const reviewers = shuffle(eligible).slice(0, target);

    for (const user of reviewers) {
      const rating = pickRating();
      const comment = pickComment(business.category, rating);
      const row = {
        business_id: business.id,
        user_id: user.id,
        user_name: userDisplayName(user),
        rating,
        comment,
      };

      const { error } = await admin.from('reviews').insert(row);
      if (error) {
        if (error.code === '23505') {
          skipped++;
          continue;
        }
        console.warn(`  Error en ${business.name} / ${user.email}:`, error.message);
        continue;
      }
      inserted++;
      touchedBusinessIds.add(business.id);
    }

    console.log(`  OK ${business.name}: ${reviewers.length} reseñas asignadas`);
  }

  console.log('\nRecalculando rating y review_count…');
  await recalcBusinessRatings(businesses.map((b) => b.id));

  console.log('\n--- Resumen ---');
  console.log(`Reseñas insertadas: ${inserted}`);
  console.log(`Omitidas (ya existían): ${skipped}`);
  console.log(`Negocios actualizados: ${businesses.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
