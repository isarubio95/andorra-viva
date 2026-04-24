---
sidebar_position: 1
title: Introducción
---

# Andorra Viva — Documentación técnica

Esta documentación describe la **lógica de negocio y de datos** de la aplicación **Andorra Viva**: directorio de negocios, métricas de visitas, reseñas y el modelo de usuarios (roles, planes y acceso “pro”).

## Qué encontrarás aquí

| Sección | Contenido |
|--------|-----------|
| [Stack y datos](./stack-y-datos) | Frontend (Vite + React), Supabase, tablas principales |
| [Usuarios, roles y planes](./usuarios-roles-y-planes) | `app_role`, `user_roles`, `subscriptions`, `get_my_access` |
| [Visitas y métricas](./visitas-y-metricas) | `business_visits`, `visitor_key`, RPCs de tracking y ranking |
| [Reseñas y comentarios](./resenas-y-comentarios) | Tabla `reviews`, `submit_business_review`, una reseña por usuario y negocio |
| [Desarrollo local](./desarrollo) | Variables de entorno, seed de usuarios de prueba |

## Principio general

La aplicación delega en **PostgreSQL (Supabase)** reglas sensibles (unicidad de visitas por mes, reasignación al iniciar sesión, cálculo de medias de valoración) mediante **funciones `security definer`** y **RLS**, mientras el cliente React llama a **RPCs** y lee tablas según políticas.
