-- =============================================================================
-- FlyPath Backend Core: endurecimiento de permisos en public.products
-- Migración: 20260712000000_harden_products_permissions.sql
--
-- Alcance: SOLO REVOKE explícito para anon y authenticated.
-- Depende de: public.products (20260711180000, ya aplicada).
-- Idempotente: REVOKE es seguro de re-ejecutar.
--
-- No modifica columnas, datos, índices, constraints, policies ni grants de
-- service_role. No altera 20260711180000_create_products.sql.
-- NO EJECUTAR en producción sin revisión previa.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- A) Defensa explícita — consistencia con el resto del Backend Core
-- -----------------------------------------------------------------------------
-- public.products ya tiene RLS activado desde 20260711180000_create_products.sql.
-- No existen policies públicas para anon ni authenticated.
--
-- Esta migración añade REVOKE ALL explícito, igual que leads, email_sequences,
-- email_enrollments, email_jobs, email_deliveries, user_events, content_items
-- y admin_notes.
--
-- service_role conserva acceso completo (bypass RLS y permisos de tabla por
-- defecto en Supabase). Rutas servidor y Warhome operan con service_role.

REVOKE ALL ON TABLE public.products FROM anon;
REVOKE ALL ON TABLE public.products FROM authenticated;

COMMIT;
