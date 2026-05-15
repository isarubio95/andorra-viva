/**
 * Inserta 12 negocios reales de Andorra (2 por categoría) asignados a usuarios de prueba.
 *
 * Requisitos: SUPABASE_SERVICE_ROLE_KEY y SUPABASE_URL (o VITE_SUPABASE_URL) en .env
 *
 * Uso: npm run seed:businesses
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_ASSETS_DIR = resolve(__dirname, 'seed-assets');

const SEED_TAG = '[seed:andorra-viva]';

/** Usuarios de prueba conocidos (TODO.md); el script también busca por email si faltan. */
const FALLBACK_TEST_USER_IDS = [
  '16063c50-119c-4587-b0ec-c2bd5d6d4c2d',
  '6d8dabcc-64a5-4e59-99ed-30374cc140e4',
  'ada4a9b9-c805-4436-a2ce-74f4719f0c1b',
  '326fd44b-3b53-4122-97bc-54195c9a66bc',
  'a028931d-83fd-455c-9f68-0f7367bcc900',
  '0df9c6a9-7178-49e4-8bcc-3ba49d1def6d',
];

const BUSINESSES = [
  // Gastronomía
  {
    name: "Borda de l'Avi",
    category: 'Gastronomía',
    location: 'Canillo',
    description: `${SEED_TAG} Restaurante de cocina tradicional andorrana en el corazón de Canillo. Especialidad en carnes a la brasa y platos de montaña.`,
    latitude: 42.5669,
    longitude: 1.5976,
    price_range: 3,
    phone: '+376 753 900',
    website: 'https://www.bordadelavi.com',
    imageFile: 'borda-de-l-avi.jpg',
    services: ['Terraza', 'Reservas online', 'Menú del día'],
  },
  {
    name: "Restaurant Plat'in",
    category: 'Gastronomía',
    location: 'Escaldes-Engordany',
    description: `${SEED_TAG} Cocina mediterránea y de autor en Escaldes, con terraza y carta de vinos seleccionada.`,
    latitude: 42.5089,
    longitude: 1.5397,
    price_range: 3,
    phone: '+376 800 999',
    website: 'https://www.platin.ad',
    imageFile: 'restaurant-platin.jpg',
    services: ['Terraza', 'Reservas online', 'Wifi'],
  },
  // Alojamiento
  {
    name: 'Hotel Plaza Andorra',
    category: 'Alojamiento',
    location: 'Andorra la Vella',
    description: `${SEED_TAG} Hotel céntrico en Andorra la Vella, ideal para escapadas urbanas y compras en el centro histórico.`,
    latitude: 42.5074,
    longitude: 1.5283,
    price_range: 2,
    phone: '+376 873 444',
    website: 'https://www.hotelplazaandorra.com',
    imageFile: 'hotel-plaza.jpg',
    services: ['Wifi', 'Parking', 'Gimnasio', 'Restaurante'],
  },
  {
    name: 'Sport Hotel Hermitage & Spa',
    category: 'Alojamiento',
    location: 'Soldeu',
    description: `${SEED_TAG} Hotel 5 estrellas en Soldeu, a pie de pistas de Grandvalira, con spa y gastronomía de alto nivel.`,
    latitude: 42.5765,
    longitude: 1.7312,
    price_range: 3,
    phone: '+376 800 222',
    website: 'https://www.sporthermitage.com',
    imageFile: 'hotel-hermitage.jpg',
    services: ['Spa', 'Piscina', 'Sauna', 'Ski-in', 'Gimnasio'],
  },
  // Ocio y entretenimiento
  {
    name: 'Palau de Gel',
    category: 'Ocio y entretenimiento',
    location: 'Canillo',
    description: `${SEED_TAG} Complejo deportivo y de ocio con pista de hielo, piscina, gimnasio y actividades para familias todo el año.`,
    latitude: 42.5665,
    longitude: 1.5973,
    price_range: 2,
    phone: '+376 800 900',
    website: 'https://www.palaudegel.com',
    imageFile: 'palau-de-gel.jpg',
    services: ['Piscina', 'Gimnasio', 'Niños', 'Eventos'],
  },
  {
    name: 'Micropolis · Centre d\'oci',
    category: 'Ocio y entretenimiento',
    location: 'Canillo',
    description: `${SEED_TAG} Centro de ocio con bolera, karting indoor, zona infantil y restauración en la parroquia de Canillo.`,
    latitude: 42.566,
    longitude: 1.5995,
    price_range: 2,
    phone: '+376 800 160',
    website: 'https://www.micropolis.ad',
    imageFile: 'micropolis.jpg',
    services: ['Niños', 'Restaurante', 'Parking', 'Eventos'],
  },
  // Turismo y experiencias
  {
    name: 'Naturlandia',
    category: 'Turismo y experiencias',
    location: 'Sant Julià de Lòria',
    description: `${SEED_TAG} Parque de aventura y naturaleza en la Rabassa: tirolinas, tobogán alpino, fauna autóctona y rutas panorámicas.`,
    latitude: 42.475,
    longitude: 1.502,
    price_range: 2,
    phone: '+376 741 000',
    website: 'https://www.naturlandia.ad',
    imageFile: 'naturlandia.jpg',
    services: ['Niños', 'Parking', 'Accesible'],
  },
  {
    name: 'Grandvalira',
    category: 'Turismo y experiencias',
    location: 'Soldeu',
    description: `${SEED_TAG} La estación de esquí más extensa del sur de Europa: pistas, actividades de nieve y experiencias todo el año en Soldeu y sectores vinculados.`,
    latitude: 42.576,
    longitude: 1.731,
    price_range: 3,
    phone: '+376 800 900',
    website: 'https://www.grandvalira.com',
    imageFile: 'grandvalira.jpg',
    services: ['Ski-in', 'Niños', 'Eventos'],
  },
  // Compras
  {
    name: 'Pyrénées Andorra',
    category: 'Compras',
    location: 'Andorra la Vella',
    description: `${SEED_TAG} Gran superficie comercial en el centre històric d'Andorra la Vella: moda, electrónica, perfumería y productos duty free.`,
    latitude: 42.508,
    longitude: 1.534,
    price_range: 2,
    phone: '+376 800 400',
    website: 'https://www.pyrenees.ad',
    imageFile: 'pyrenees.jpg',
    services: ['Wifi', 'Accesible'],
  },
  {
    name: 'Illa Carlemany',
    category: 'Compras',
    location: 'Escaldes-Engordany',
    description: `${SEED_TAG} Centro comercial y de ocio en Escaldes con boutiques, restauración, cine y aparcamiento subterráneo.`,
    latitude: 42.5095,
    longitude: 1.541,
    price_range: 2,
    phone: '+376 800 700',
    website: 'https://www.illacentre.com',
    imageFile: 'illa-carlemany.jpg',
    services: ['Parking', 'Wifi', 'Restaurante', 'Accesible'],
  },
  // Bienestar
  {
    name: 'Caldea',
    category: 'Bienestar',
    location: 'Escaldes-Engordany',
    description: `${SEED_TAG} Centro termolúdic y spa de referencia en los Pirineos: aguas termales, masajes, circuitos de relajación y vistas a la montaña.`,
    latitude: 42.5145,
    longitude: 1.5375,
    price_range: 3,
    phone: '+376 800 999',
    website: 'https://www.caldea.com',
    imageFile: 'caldea.jpg',
    services: ['Spa', 'Sauna', 'Masajes', 'Piscina', 'Reservas online'],
  },
  {
    name: 'Inúu',
    category: 'Bienestar',
    location: 'Escaldes-Engordany',
    description: `${SEED_TAG} Espacio de bienestar y relajación vinculado al complejo Caldea: tratamientos corporales, masajes y experiencias sensoriales.`,
    latitude: 42.514,
    longitude: 1.537,
    price_range: 3,
    phone: '+376 800 999',
    website: 'https://www.inuu.ad',
    imageFile: 'inuu.jpg',
    services: ['Spa', 'Masajes', 'Reservas online'],
  },
];

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

async function listTestUserIds(admin) {
  const ids = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    for (const u of users) {
      if (u.email?.startsWith('test.user.') && u.email.endsWith('@example.local')) {
        ids.push({ id: u.id, email: u.email });
      }
    }
    if (users.length < perPage) break;
    page += 1;
  }

  ids.sort((a, b) => a.email.localeCompare(b.email));
  return ids;
}

loadDotEnv();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Faltan SUPABASE_SERVICE_ROLE_KEY y SUPABASE_URL (o VITE_SUPABASE_URL) en .env');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

async function uploadBusinessImage(admin, ownerId, businessName, imageFile) {
  const filePath = resolve(SEED_ASSETS_DIR, imageFile);
  if (!existsSync(filePath)) {
    throw new Error(
      `Falta ${filePath}. Ejecuta antes: npm run seed:assets`
    );
  }

  const body = readFileSync(filePath);
  const contentType = 'image/jpeg';
  const storagePath = `seed/${ownerId}/${slugify(businessName)}.jpg`;

  const { error } = await admin.storage.from('business-images').upload(storagePath, body, {
    contentType,
    upsert: true,
  });
  if (error) {
    throw new Error(`Storage ${storagePath}: ${error.message}`);
  }

  const { data } = admin.storage.from('business-images').getPublicUrl(storagePath);
  return data.publicUrl;
}

async function ensureProfessional(ownerId) {
  const { error: roleErr } = await admin.from('user_roles').upsert(
    { user_id: ownerId, role: 'professional' },
    { onConflict: 'user_id' }
  );
  if (roleErr) console.warn(`  user_roles ${ownerId}:`, roleErr.message);

  const { error: subErr } = await admin.from('subscriptions').upsert(
    { user_id: ownerId, plan_id: 'basico', status: 'active' },
    { onConflict: 'user_id' }
  );
  if (subErr) console.warn(`  subscriptions ${ownerId}:`, subErr.message);
}

async function main() {
  let testUsers = await listTestUserIds(admin);

  if (testUsers.length < 6) {
    console.warn(`Solo ${testUsers.length} usuarios test por email; usando IDs de respaldo.`);
    const known = FALLBACK_TEST_USER_IDS.map((id, i) => ({
      id,
      email: `fallback.${i}@example.local`,
    }));
    const byId = new Map(testUsers.map((u) => [u.id, u]));
    for (const u of known) {
      if (!byId.has(u.id)) byId.set(u.id, u);
    }
    testUsers = [...byId.values()].sort((a, b) => a.email.localeCompare(b.email));
  }

  if (testUsers.length < 6) {
    console.error('Se necesitan al menos 6 usuarios de prueba. Ejecuta: npm run seed:test-users');
    process.exit(1);
  }

  const owners = testUsers.slice(0, 6);
  console.log('Usuarios asignados (1 categoría = 2 negocios cada uno):');
  owners.forEach((u, i) => console.log(`  ${i + 1}. ${u.email}`));

  const { error: delErr } = await admin.from('businesses').delete().like('description', `%${SEED_TAG}%`);
  if (delErr) {
    console.error('No se pudieron borrar seeds anteriores:', delErr.message);
    process.exit(1);
  }

  const categories = [
    'Gastronomía',
    'Alojamiento',
    'Ocio y entretenimiento',
    'Turismo y experiencias',
    'Compras',
    'Bienestar',
  ];

  const inserted = [];

  for (let catIndex = 0; catIndex < categories.length; catIndex++) {
    const owner = owners[catIndex];
    const pair = BUSINESSES.filter((b) => b.category === categories[catIndex]);

    await ensureProfessional(owner.id);

    for (const biz of pair) {
      const imageUrl = await uploadBusinessImage(admin, owner.id, biz.name, biz.imageFile);
      const { imageFile: _omit, ...bizRow } = biz;
      const row = {
        ...bizRow,
        owner_id: owner.id,
        image_url: imageUrl,
        rating: 0,
        review_count: 0,
        is_recommended: false,
        is_premium: false,
        gallery: [imageUrl],
      };

      const { data, error } = await admin.from('businesses').insert(row).select('id, name, category').single();
      if (error) {
        console.error(`Error insertando ${biz.name}:`, error.message);
        process.exit(1);
      }
      inserted.push({ ...data, owner: owner.email });
      console.log(`  OK [${biz.category}] ${biz.name} → ${owner.email}`);
    }
  }

  console.log('\n--- Resumen ---');
  console.log(`Negocios creados: ${inserted.length}`);
  console.log(`Marcador en descripción: ${SEED_TAG}`);
  console.log('Imágenes: 12 fotos temáticas (scripts/seed-assets) subidas a Supabase Storage.');
  console.log('Para repetir el seed, vuelve a ejecutar el script (reemplaza los anteriores).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
