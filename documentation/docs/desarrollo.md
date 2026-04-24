---
sidebar_position: 6
title: Desarrollo local
---

# Desarrollo local

## Requisitos

- **Node.js** (versión acorde al proyecto raíz)
- Cuenta y proyecto **Supabase** si trabajas contra datos reales (URL + anon key + migraciones aplicadas)

## Aplicación principal (Vite)

En la raíz del monorepo (`andorra-viva/`):

```bash
npm install
npm run dev
```

Variables típicas en **`.env`** (no commitear):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Los listados (negocios, planes, reseñas) y las métricas salen siempre de **Supabase**; hace falta proyecto configurado y migraciones aplicadas.

## Sitio de documentación (Docusaurus)

`baseUrl` de producción es **`/docs/`** (misma web que la app en Vercel). En local, el servidor de Docusaurus sirve también bajo ese prefijo.

```bash
cd documentation
npm install   # la primera vez (o `npm install` en la raíz, que instala `documentation` vía `postinstall`)
npm start
# Abre http://localhost:3000/docs/  (intro en /docs/intro)
```

Build solo del sitio de docs:

```bash
cd documentation
npm run build
npm run serve
```

Desde la raíz: `npm run docs:dev`, `npm run docs:build`.

### Despliegue en Vercel junto a la app

1. Conecta el repo en Vercel (proyecto único, raíz del monorepo).
2. El **`npm run build`** de la raíz hace: **Vite** → `dist/` + **Docusaurus** → copia a **`dist/docs/`** (`scripts/merge-docusaurus-into-dist.mjs`).
3. **`vercel.json`** fija salida `dist` y el comando de build.

Tras el deploy, la documentación está en la misma URL que la app, bajo el prefijo **`/docs/`** (por ejemplo `https://tu-proyecto.vercel.app/docs/` y `.../docs/intro`).

La app React sigue en **`/`**, **`/login`**, etc. Vercel sirve primero los archivos estáticos que existan en `dist`; las rutas bajo `/docs/` no pasan por React Router.

En el build en Vercel, si existe la variable **`VERCEL_URL`**, Docusaurus la usa como `url` del sitio (metadatos / Open Graph).

## Seed: usuarios y visitas de prueba

Script: `scripts/seed-test-users-and-visits.mjs`  
Comando: `npm run seed:test-users` (en la raíz)

Requiere en `.env`:

- `SUPABASE_SERVICE_ROLE_KEY` (**secreto**; no usar en el cliente)
- `SUPABASE_URL` o `VITE_SUPABASE_URL`

Opcional:

- `SEED_TEST_USER_PASSWORD` — contraseña común de los usuarios creados (por defecto `TestUser123!`)
- `SEED_USER_COUNT` (default 10)
- `SEED_VISIT_COUNT` (default 50)

Crea usuarios con email `test.user.<timestamp>.<i>@example.local` y registra visitas aleatorias en `business_visits` respetando la unicidad mensual.

## Migraciones SQL

Aplicar con la CLI de Supabase según el flujo del equipo (`supabase db push`, enlaces locales, etc.). Las reglas descritas en esta documentación provienen de los archivos en `supabase/migrations/`.
