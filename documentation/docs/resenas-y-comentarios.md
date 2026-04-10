---
sidebar_position: 5
title: Reseñas y comentarios
---

# Reseñas y comentarios

En el producto, “comentario” es el **texto opcional** de una **reseña** (valoración + comentario). Toda la lógica sensible está en la tabla **`reviews`** y en el RPC **`submit_business_review`**.

## Tabla `reviews`

Campos típicos (según migraciones):

- **`business_id`**, **`user_id`**: vínculo al negocio y al autor autenticado.
- **`user_name`**: nombre mostrado; el RPC lo rellena con `full_name` de metadatos o parte local del email.
- **`rating`**: entero **1 a 5**.
- **`comment`**: texto libre opcional; puede ser `NULL` o cadena vacía normalizada.

## Una reseña por usuario y negocio

Existe un índice único **`(business_id, user_id)`**. Eso implica:

- El primer envío **inserta** una fila.
- Envíos posteriores del mismo usuario al mismo negocio **actualizan** la misma fila (misma valoración nueva o comentario editado).

No hay “hilos” de comentarios anónimos ni respuestas en cadena en este modelo: es **reseña por usuario**.

## RPC `submit_business_review(p_business_id, p_rating, p_comment)`

- Solo **`authenticated`**.
- Valida rating 1–5 y existencia del negocio.
- Hace **`INSERT ... ON CONFLICT (business_id, user_id) DO UPDATE`**, actualizando `user_name`, `rating`, `comment` y refrescando **`created_at`** a la hora actual (el último guardado cuenta como “versión actual” en listados ordenados por fecha).

### Recálculo en `businesses`

Tras el upsert, la función recalcula para ese negocio:

- **`rating`**: media de todas las valoraciones (`numeric`).
- **`review_count`**: número de filas en `reviews` para ese `business_id`.

Así el listado de negocios puede mostrar agregados sin escanear `reviews` en cada lectura.

## Lectura pública y RLS

- **`SELECT`** en `reviews` está permitido a **`anon` y `authenticated`** con política de lectura pública (todas las reseñas visibles para ficha del negocio).
- Hay también política para que usuarios autenticados lean las propias filas (refuerzo coherente con `user_id = auth.uid()`).

Los **insert/update directos** desde el cliente no son el camino previsto: el cliente usa el **RPC**, que ejecuta como **security definer** y centraliza validación.

## Frontend

- **`getReviewsByBusiness`**: lista reseñas de un negocio.
- **`getMyReviewForBusiness`**: obtiene la reseña del usuario actual si existe (para pre-rellenar formulario de edición).
- **`submitBusinessReview`**: envía `p_comment` recortado; cadena vacía se envía como `null` al RPC vía `nullif(trim(...), '')` en SQL.

## Diferencia respecto a las visitas

| Aspecto | Visitas | Reseñas |
|--------|---------|---------|
| Quién puede crear | Anónimo o autenticado (tracking) | Solo autenticado |
| Unicidad | Por negocio + visitante + mes | Por negocio + usuario (vida entera, editable) |
| Comentario | No aplica | Opcional en `reviews.comment` |
