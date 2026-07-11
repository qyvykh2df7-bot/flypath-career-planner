-- =============================================================================
-- FlyPath Backend Core: catálogo central de productos
-- Migración: 20260711180000_create_products.sql
--
-- Alcance: SOLO public.products (DDL + seed inicial de 11 productos).
-- Idempotente: IF NOT EXISTS, CREATE OR REPLACE, DROP TRIGGER IF EXISTS,
--              ON CONFLICT DO UPDATE.
--
-- NO modifica tablas del comparador de escuelas ni otras tablas existentes.
-- NO EJECUTAR en producción sin revisión previa.
-- =============================================================================

BEGIN;

-- gen_random_uuid() para la PK de products.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- A) public.products — catálogo central FlyPath
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_key text NOT NULL UNIQUE,
  name text NOT NULL,
  product_type text NOT NULL,
  sales_channel text NOT NULL,
  status text NOT NULL,
  description text,
  internal_notes text,
  external_url text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_product_type_check
    CHECK (product_type IN (
      'platform_product',
      'digital_product',
      'service',
      'external_product',
      'subscription',
      'free_product'
    )),
  CONSTRAINT products_sales_channel_check
    CHECK (sales_channel IN (
      'flypath',
      'stripe',
      'amazon',
      'external',
      'free'
    )),
  CONSTRAINT products_status_check
    CHECK (status IN (
      'active',
      'draft',
      'waitlist',
      'coming_soon',
      'archived'
    ))
);

COMMENT ON TABLE public.products IS
  'Catálogo central de productos y servicios FlyPath (Backend Core). Sin precios ni Stripe.';

COMMENT ON COLUMN public.products.product_key IS
  'Clave estable de producto (slug interno). Ej: aerocomms, career_planner.';

COMMENT ON COLUMN public.products.product_type IS
  'Tipo de producto: platform_product | digital_product | service | external_product | subscription | free_product.';

COMMENT ON COLUMN public.products.sales_channel IS
  'Canal de venta: flypath | stripe | amazon | external | free.';

COMMENT ON COLUMN public.products.status IS
  'Estado de catálogo: active | draft | waitlist | coming_soon | archived.';

COMMENT ON COLUMN public.products.description IS
  'Descripción pública opcional del producto.';

COMMENT ON COLUMN public.products.internal_notes IS
  'Notas internas de operaciones; no exponer en UI pública.';

COMMENT ON COLUMN public.products.external_url IS
  'URL externa (ej. Amazon) cuando sales_channel lo requiera.';

COMMENT ON COLUMN public.products.image_url IS
  'URL de imagen de catálogo.';

-- -----------------------------------------------------------------------------
-- B) Trigger updated_at — se actualiza automáticamente en cada UPDATE
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_products_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_set_updated_at ON public.products;
CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_products_updated_at();

COMMENT ON FUNCTION public.set_products_updated_at() IS
  'Actualiza products.updated_at antes de cada UPDATE en public.products.';

-- -----------------------------------------------------------------------------
-- C) Seed inicial — 11 productos (idempotente vía ON CONFLICT)
-- -----------------------------------------------------------------------------
INSERT INTO public.products (
  product_key,
  name,
  product_type,
  sales_channel,
  status
)
VALUES
  ('aerocomms', 'AeroComms', 'platform_product', 'flypath', 'active'),
  ('career_planner', 'Career Planner', 'platform_product', 'flypath', 'active'),
  ('preppl_guide', 'Guía Pre-PPL', 'digital_product', 'flypath', 'coming_soon'),
  ('como_ser_piloto_guide', 'Guía Cómo ser Piloto', 'digital_product', 'flypath', 'active'),
  ('mentoring_1_1', 'Mentoría 1:1', 'service', 'flypath', 'active'),
  ('flypath_accompaniment', 'Acompañamiento FlyPath', 'service', 'flypath', 'active'),
  ('pilot_logbook_blue', 'Pilot Logbook Blue', 'external_product', 'amazon', 'active'),
  ('pilot_logbook_black_deluxe', 'Pilot Logbook Black Deluxe', 'external_product', 'amazon', 'active'),
  ('pilot_logbook_green', 'Pilot Logbook Green', 'external_product', 'amazon', 'active'),
  ('pilot_logbook_pink', 'Pilot Logbook Pink', 'external_product', 'amazon', 'active'),
  ('flight_navigation_logbook', 'Flight Navigation Logbook', 'external_product', 'amazon', 'active')
ON CONFLICT (product_key) DO UPDATE SET
  name = EXCLUDED.name,
  product_type = EXCLUDED.product_type,
  sales_channel = EXCLUDED.sales_channel,
  status = EXCLUDED.status;

-- -----------------------------------------------------------------------------
-- D) RLS — tabla privada hasta crear vista pública sin internal_notes
-- -----------------------------------------------------------------------------
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- NOTA: Sin GRANT SELECT ni policies para anon/authenticated.
-- La tabla queda inaccesible vía API pública hasta una migración futura
-- que cree una vista pública (sin internal_notes) con su policy de lectura.
-- Altas y cambios de catálogo: service_role (bypass RLS) o policies admin.

COMMIT;
