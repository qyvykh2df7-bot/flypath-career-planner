-- =============================================================================
-- FlyPath Backend Core: catálogo interno de contenidos
-- Migración: 20260711270000_create_content_items.sql
--
-- Alcance: SOLO public.content_items (DDL + RLS privado).
-- Depende de: public.products (20260711180000), auth.users (Supabase Auth).
-- Idempotente: IF NOT EXISTS, CREATE OR REPLACE, DROP TRIGGER IF EXISTS.
--
-- Sin bloques, versiones, tags, media, SEO avanzado, jobs ni seeds.
-- Gestión vía Warhome y service_role (futuro).
-- visibility = public no implica acceso directo desde Supabase aún.
-- NO EJECUTAR en producción sin revisión previa.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- A) public.content_items — contenidos publicados, borradores e internos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products (id) ON DELETE SET NULL,
  content_type text NOT NULL,
  title text NOT NULL,
  slug text,
  summary text,
  body text,
  status text NOT NULL DEFAULT 'draft',
  visibility text NOT NULL DEFAULT 'internal',
  language_code text NOT NULL DEFAULT 'es',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  published_at timestamptz,
  archived_at timestamptz,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_items_content_type_check
    CHECK (content_type IN (
      'article',
      'guide',
      'resource',
      'page',
      'email',
      'social_post',
      'video',
      'idea',
      'internal_document',
      'other'
    )),
  CONSTRAINT content_items_status_check
    CHECK (status IN (
      'draft',
      'review',
      'scheduled',
      'published',
      'archived'
    )),
  CONSTRAINT content_items_visibility_check
    CHECK (visibility IN (
      'public',
      'private',
      'internal',
      'unlisted'
    )),
  CONSTRAINT content_items_title_nonempty_check
    CHECK (length(btrim(title)) > 0),
  CONSTRAINT content_items_slug_format_check
    CHECK (
      slug IS NULL
      OR (
        length(btrim(slug)) > 0
        AND slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
      )
    ),
  CONSTRAINT content_items_language_code_check
    CHECK (
      length(btrim(language_code)) > 0
      AND language_code ~ '^[a-z]{2}(-[A-Z]{2})?$'
    ),
  CONSTRAINT content_items_metadata_object_check
    CHECK (jsonb_typeof(metadata) = 'object'),
  CONSTRAINT content_items_published_at_check
    CHECK (status <> 'published' OR published_at IS NOT NULL),
  CONSTRAINT content_items_archived_at_check
    CHECK (status <> 'archived' OR archived_at IS NOT NULL)
);

COMMENT ON TABLE public.content_items IS
  'Catálogo interno de contenidos FlyPath. Sin acceso público directo desde Supabase aún.';

COMMENT ON COLUMN public.content_items.product_id IS
  'Producto opcional asociado. SET NULL si se elimina el producto.';

COMMENT ON COLUMN public.content_items.content_type IS
  'Tipo: article | guide | resource | page | email | social_post | video | idea | internal_document | other.';

COMMENT ON COLUMN public.content_items.slug IS
  'URL slug opcional (minúsculas, números, guiones). Único cuando no es NULL.';

COMMENT ON COLUMN public.content_items.status IS
  'Estado editorial: draft | review | scheduled | published | archived.';

COMMENT ON COLUMN public.content_items.visibility IS
  'Visibilidad prevista: public | private | internal | unlisted. Sin policies públicas aún.';

COMMENT ON COLUMN public.content_items.language_code IS
  'Código de idioma: es, en, fr o es-ES, en-US, etc.';

COMMENT ON COLUMN public.content_items.metadata IS
  'Metadatos adicionales (JSON objeto). Sin esquema fijo aún.';

COMMENT ON COLUMN public.content_items.published_at IS
  'Obligatorio cuando status = published.';

COMMENT ON COLUMN public.content_items.archived_at IS
  'Obligatorio cuando status = archived.';

COMMENT ON COLUMN public.content_items.created_by IS
  'Usuario que creó el contenido (Warhome). SET NULL si se elimina el usuario.';

COMMENT ON COLUMN public.content_items.updated_by IS
  'Último usuario que editó el contenido. SET NULL si se elimina el usuario.';

-- -----------------------------------------------------------------------------
-- B) CONSTRAINTS — definidos en CREATE TABLE (ver sección A)
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- C) Unicidad parcial — slug único solo cuando está definido
-- -----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS content_items_slug_unique
  ON public.content_items (slug)
  WHERE slug IS NOT NULL;

COMMENT ON INDEX public.content_items_slug_unique IS
  'Slug único entre contenidos publicados/internos que lo definen. Múltiples NULL permitidos.';

-- -----------------------------------------------------------------------------
-- D) Trigger updated_at — se actualiza automáticamente en cada UPDATE
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_content_items_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS content_items_set_updated_at ON public.content_items;
CREATE TRIGGER content_items_set_updated_at
  BEFORE UPDATE ON public.content_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_content_items_updated_at();

COMMENT ON FUNCTION public.set_content_items_updated_at() IS
  'Actualiza content_items.updated_at antes de cada UPDATE.';

-- -----------------------------------------------------------------------------
-- E) Índices — consultas editoriales y por producto
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS content_items_product_id_idx
  ON public.content_items (product_id);

CREATE INDEX IF NOT EXISTS content_items_content_type_idx
  ON public.content_items (content_type);

CREATE INDEX IF NOT EXISTS content_items_status_idx
  ON public.content_items (status);

CREATE INDEX IF NOT EXISTS content_items_visibility_idx
  ON public.content_items (visibility);

CREATE INDEX IF NOT EXISTS content_items_language_code_idx
  ON public.content_items (language_code);

CREATE INDEX IF NOT EXISTS content_items_published_at_idx
  ON public.content_items (published_at);

CREATE INDEX IF NOT EXISTS content_items_archived_at_idx
  ON public.content_items (archived_at);

CREATE INDEX IF NOT EXISTS content_items_created_by_idx
  ON public.content_items (created_by);

CREATE INDEX IF NOT EXISTS content_items_created_at_idx
  ON public.content_items (created_at);

CREATE INDEX IF NOT EXISTS content_items_updated_at_idx
  ON public.content_items (updated_at);

CREATE INDEX IF NOT EXISTS content_items_status_published_at_idx
  ON public.content_items (status, published_at);

CREATE INDEX IF NOT EXISTS content_items_content_type_status_idx
  ON public.content_items (content_type, status);

CREATE INDEX IF NOT EXISTS content_items_product_id_status_idx
  ON public.content_items (product_id, status);

-- -----------------------------------------------------------------------------
-- F) RLS — tabla privada; Warhome y rutas servidor con service_role
-- -----------------------------------------------------------------------------
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.content_items FROM anon;
REVOKE ALL ON public.content_items FROM authenticated;

-- NOTA: Sin GRANT ni policies para anon/authenticated.
-- Aunque visibility = public, el acceso web irá por rutas Next.js, no por Supabase directo.

COMMIT;
