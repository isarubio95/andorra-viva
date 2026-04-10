---
sidebar_position: 3
title: Usuarios, roles y planes
---

# Usuarios, roles y planes

## Tipos de cuenta en el registro (UX)

En la pantalla de **alta** (`Signup`), el usuario elige un **tipo de cuenta** que se guarda en los metadatos de Supabase Auth:

- **Básico** (`basic`): usuario general del directorio.
- **Profesional** (`professional`): orientado a negocios; en el flujo puede elegir **plan** antes de completar el formulario.

Esos valores se envían en `signUp` como `user_metadata` (`role`, y opcionalmente `plan` para profesionales). No confundir este flujo de UI con el rol `admin`, que normalmente **no** se elige en el formulario público.

## Roles de aplicación (`app_role`)

En base de datos, el rol vive en el enum **`public.app_role`**:

| Valor | Significado |
|-------|-------------|
| `basic` | Usuario estándar. |
| `professional` | Cuenta profesional; se considera con acceso “pro” por rol. |
| `admin` | Administrador; puede gestionar roles y suscripciones de otros usuarios (vía RLS y `is_admin`). |

La tabla **`user_roles`** almacena `(user_id, role)` con **una sola fila por usuario**.

### Aprovisionamiento automático

El trigger **`on_auth_user_created`** ejecuta **`handle_new_user`** tras insertar en `auth.users`:

1. Lee `raw_user_meta_data->>'role'` y hace cast a `app_role`; si falta, usa `basic`.
2. Lee `raw_user_meta_data->>'plan'`; por defecto `free`.
3. **Upsert** en `user_roles`.
4. **Upsert** en `subscriptions`: si el rol es `professional`, asigna el `plan_id` solicitado; si no, **`free`**.

Los errores en este bloque **no bloquean** el alta (el trigger captura excepciones y devuelve `new` igualmente), para no impedir el registro por fallos de datos auxiliares.

### Políticas RLS sobre `user_roles`

- Cualquier usuario autenticado puede **leer su propio** rol.
- Los **admin** pueden leer, insertar, actualizar y borrar filas en `user_roles` (gestión de soporte).

La función **`is_admin(_user_id uuid default auth.uid())`** comprueba si el usuario tiene rol `admin` en `user_roles`.

## Suscripciones (`subscriptions`)

- Una fila **por usuario** (`unique (user_id)`).
- Estados válidos: `active`, `trialing`, `past_due`, `canceled`.
- Los usuarios ven su propia suscripción; los **admin** pueden leer y modificar todas (políticas dedicadas).

## `get_my_access()` — fuente única en cliente

El RPC **`get_my_access`** (autenticado) devuelve un JSON con:

- **`role`**: texto del rol (`basic` \| `professional` \| `admin`).
- **`plan_id`**: plan actual o `free`.
- **`subscription_status`**: estado de la suscripción.
- **`has_pro_access`**: booleano calculado en servidor con la misma regla que debe usar la UI:
  - `true` si el rol es **`professional`** o **`admin`**, **o** si hay plan distinto de `free` y el estado es **`active`** o **`trialing`**.

`AuthContext` en el frontend **prioriza** este RPC; si falla (por ejemplo entorno sin migración), hace **fallback** leyendo `user_roles` y `subscriptions` y recalcula `hasProAccess` en cliente con la misma lógica (`computeHasProAccess`).

## Badges en la interfaz

En cabecera, la UI resume:

- **ADMIN** si `role === 'admin'`
- **PRO** si `hasProAccess` (plan de pago activo/trial o rol pro/admin)
- **USER** en caso contrario

## Asignar un administrador

El rol **`admin`** no forma parte del flujo normal de signup de usuario final. Suele asignarse **manualmente** en base de datos (actualizar `user_roles` para el `user_id` correspondiente) o con herramientas de administración de Supabase, siempre respetando las políticas y la función `is_admin`.
