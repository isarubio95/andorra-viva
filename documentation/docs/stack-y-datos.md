---
sidebar_position: 2
title: Stack y modelo de datos
---

# Stack y modelo de datos

## Stack del frontend

- **Vite** + **React 18** + **TypeScript**
- **React Router** para rutas
- **Supabase JS** (`@supabase/supabase-js`) como cliente de Auth, base de datos y RPCs
- **TanStack Query**, **shadcn/ui** (Radix), **Tailwind CSS 4.2** (`@tailwindcss/vite`, tema en `src/index.css` con `@theme inline`) para UI

El código de integración con Supabase para listados, métricas y tracking vive principalmente en `src/services/api.ts`. El contexto de sesión y permisos está en `src/contexts/AuthContext.tsx`.

## Backend: Supabase

- **Auth**: usuarios en `auth.users`; metadatos de registro (nombre, rol elegido en signup, plan) en `raw_user_meta_data`.
- **Datos públicos**: tablas en el esquema `public` con **Row Level Security (RLS)**.
- **Lógica encapsulada**: funciones PL/pgSQL expuestas como **RPC** al cliente (`track_business_visit`, `merge_anonymous_business_visits`, `submit_business_review`, `get_my_access`, etc.).

Las migraciones versionadas están en `supabase/migrations/`.

## Entidades principales

### `businesses`

Negocios del directorio. Incluyen campos de presentación y agregados mantenidos al publicar reseñas:

- **`owner_id`**: usuario autenticado propietario (para RLS de edición y lectura de visitas propias).
- **`rating`**, **`review_count`**: recalculados al crear o editar una reseña vía `submit_business_review`.

### `business_visits`

Filas que representan **una visita contabilizada** a un negocio. La regla de negocio es: **como máximo una visita por par (negocio, visitante) en un mismo mes natural (UTC)**. Ver [Visitas y métricas](./visitas-y-metricas).

### `reviews`

Reseñas con **valoración 1–5** y **comentario opcional**. **Una fila por par (negocio, usuario)**; una nueva envío actualiza la existente. Ver [Reseñas y comentarios](./resenas-y-comentarios).

### `user_roles` y `app_role`

Rol de aplicación por usuario: enum PostgreSQL `app_role` con valores `basic`, `professional`, `admin`. Tabla `user_roles` con una fila por `user_id`.

### `subscriptions` y `plans`

Suscripción del usuario: plan (`plan_id` enlazado a `plans`), estado (`active`, `trialing`, `past_due`, `canceled`). Se crea/actualiza al registrarse el usuario (trigger `handle_new_user`).

### Funciones de agregación

- **`get_top_visited_businesses_month`**: ranking de negocios por visitas del **mes actual** (lectura pública vía RPC).
- **`get_my_business_metrics`**: métricas para negocios del usuario autenticado (visitas del mes, totales, reseñas, media de valoración, serie diaria).

Estas funciones están definidas en migraciones SQL y se invocan desde `api.ts`.
