---
sidebar_position: 4
title: Visitas y métricas
---

# Visitas y métricas

## Objetivo del sistema de visitas

Registrar **cuántos visitantes distintos** han visto un negocio, con estas reglas:

1. **Granularidad mensual (UTC)**: cada combinación **(negocio, visitante, mes)** produce **como máximo una fila** en `business_visits`.
2. **Identidad del visitante**:
   - Si hay **sesión JWT** (`auth.uid()` no nulo), la clave interna es siempre **`auth.uid()::text`**. Así no se puede suplantar la identidad enviando otra clave desde el cliente.
   - Si **no hay sesión**, se usa una cadena **`visitor_key`** generada en el navegador (p. ej. UUID en `localStorage`). Debe tener **longitud ≥ 8** (restricción en tabla y en la función).

Esto equilibra **privacidad aproximada** (sin login, cookie/localStorage) y **coherencia** (con login, una persona = un uid).

## Tabla `business_visits`

Campos relevantes:

- **`business_id`**: negocio visitado.
- **`visitor_key`**: identificador anónimo o, tras lógica del RPC, el uid en texto.
- **`visit_month`**: primer día del mes (date) en el que cuenta la visita; forma parte de la unicidad.
- **`visited_at`**: marca temporal del insert (útil para series diarias en métricas del propietario).

Índice único **`(business_id, visitor_key, visit_month)`** garantiza la regla “una visita por visitante y negocio al mes”.

### RLS

- **`INSERT`**: permitido a `anon` y `authenticated` (cualquiera puede registrar una visita), con política permisiva en inserción directa.
- **`SELECT`**: solo el **propietario del negocio** (`businesses.owner_id = auth.uid()`) puede leer las filas de sus negocios.

En la práctica, el cliente usa el RPC **`track_business_visit`** para insertar de forma uniforme.

## RPC `track_business_visit(p_business_id, p_visitor_key, p_visit_month)`

Implementación **security definer**:

1. Si **`auth.uid()`** existe → `visitor_key` efectivo = uid en texto (**ignora** el valor anónimo del cliente para ese caso).
2. Si no hay uid → exige `p_visitor_key` válido (no nulo, longitud ≥ 8); si no, sale sin error.
3. Comprueba que el `business_id` exista en `businesses`.
4. **`INSERT ... ON CONFLICT DO NOTHING`** sobre la clave única mensual: repetir la visita en el mismo mes no duplica filas.

El frontend (`trackBusinessVisit` en `api.ts`) calcula `p_visit_month` como el **primer día del mes actual en UTC** y pasa un `p_visitor_key` dummy corto si hay sesión (el servidor igualmente usa el uid).

## Visitantes anónimos: `localStorage`

La clave persistente se guarda bajo **`andorra-viva-visitor-key`** (`src/lib/visitor-key.ts`):

- **`getOrCreateVisitorKey()`**: obtiene o genera un UUID (o fallback) y lo guarda.
- Tras login, interesa **no perder** las visitas ya contadas con la clave anónima.

## RPC `merge_anonymous_business_visits(p_visitor_key)`

Ejecutable solo por usuarios **authenticated**. Tras iniciar sesión, `AuthContext` llama a **`mergeAnonymousVisitsForUser`** (`api.ts`), que a su vez invoca este RPC con la clave leída del `localStorage`.

Lógica:

1. Si no hay uid o la clave anónima es inválida / igual al uid, termina.
2. **Elimina** filas duplicadas: donde ya exista una visita del mismo negocio y mes con `visitor_key = uid`, borra la fila que aún tenía la clave anónima.
3. **Actualiza** el resto de filas con la clave anónima para poner `visitor_key = uid::text`.

Así las visitas hechas antes del login **se atribuyen** al usuario sin romper la unicidad mensual.

## Métricas y rankings

### `get_top_visited_businesses_month(_limit)`

- Cuenta filas de **`business_visits`** con **`visit_month` = mes actual (UTC)** agrupadas por negocio.
- Ordena por número de visitas descendente.
- **`EXECUTE` concedido a `anon` y `authenticated`**: puede alimentar la home pública sin exponer filas crudas (solo devuelve agregados).

La app enlaza estos ids con la tabla `businesses` para mostrar tarjetas.

### `get_my_business_metrics(_days)`

- Solo **authenticated**; internamente restringe a negocios donde **`owner_id = auth.uid()`**.
- Devuelve por negocio: visitas del mes, totales históricos, totales de reseñas, media de valoración, y **`daily_visits`** (JSON con conteos por día en la ventana de `_days` basados en **`visited_at`**).

## Resumen mental

| Situación | Clave de visitante | Duplicado mismo mes |
|-----------|-------------------|----------------------|
| Usuario sin login | UUID en `localStorage` | Ignorado (`ON CONFLICT DO NOTHING`) |
| Usuario con login | `auth.uid()` | Igual |
| Pasa de anónimo a login | RPC de merge reasigna filas | Sin duplicar gracias al paso de delete previo |
