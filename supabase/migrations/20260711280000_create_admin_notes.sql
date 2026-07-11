-- =============================================================================
-- FlyPath Backend Core: notas internas de administración (Warhome)
-- Migración: 20260711280000_create_admin_notes.sql
--
-- Alcance: SOLO public.admin_notes (DDL + RLS privado).
-- Depende de: auth.users (Supabase Auth), public.leads (20260711200000),
--             public.products (20260711180000), public.content_items (20260711270000).
-- Idempotente: IF NOT EXISTS, CREATE OR REPLACE, DROP TRIGGER IF EXISTS.
--
-- Sin comentarios encadenados, adjuntos, menciones, notificaciones ni seeds.
-- Gestión exclusiva vía Warhome y service_role (futuro).
-- NO EJECUTAR en producción sin revisión previa.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- A) public.admin_notes — notas internas asociadas a entidades o generales
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads (id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products (id) ON DELETE SET NULL,
  content_item_id uuid REFERENCES public.content_items (id) ON DELETE SET NULL,
  note_type text NOT NULL DEFAULT 'general',
  title text,
  body text NOT NULL,
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'open',
  is_pinned boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  resolved_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  resolved_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_notes_note_type_check
    CHECK (note_type IN (
      'general',
      'sales',
      'support',
      'mentoring',
      'product',
      'content',
      'technical',
      'compliance',
      'follow_up',
      'other'
    )),
  CONSTRAINT admin_notes_priority_check
    CHECK (priority IN (
      'low',
      'normal',
      'high',
      'urgent'
    )),
  CONSTRAINT admin_notes_status_check
    CHECK (status IN (
      'open',
      'in_progress',
      'resolved',
      'archived'
    )),
  CONSTRAINT admin_notes_title_nonempty_check
    CHECK (title IS NULL OR length(btrim(title)) > 0),
  CONSTRAINT admin_notes_body_nonempty_check
    CHECK (length(btrim(body)) > 0),
  CONSTRAINT admin_notes_metadata_object_check
    CHECK (jsonb_typeof(metadata) = 'object'),
  CONSTRAINT admin_notes_resolved_at_check
    CHECK (status <> 'resolved' OR resolved_at IS NOT NULL),
  CONSTRAINT admin_notes_archived_at_check
    CHECK (status <> 'archived' OR archived_at IS NOT NULL)
);

COMMENT ON TABLE public.admin_notes IS
  'Notas internas de Warhome. Sin acceso público ni desde navegador directo.';

COMMENT ON COLUMN public.admin_notes.user_id IS
  'Usuario autenticado asociado (opcional). SET NULL si se elimina en auth.users.';

COMMENT ON COLUMN public.admin_notes.lead_id IS
  'Lead asociado (opcional). SET NULL si se elimina el lead.';

COMMENT ON COLUMN public.admin_notes.product_id IS
  'Producto asociado (opcional). SET NULL si se elimina el producto.';

COMMENT ON COLUMN public.admin_notes.content_item_id IS
  'Contenido asociado (opcional). SET NULL si se elimina el content_item.';

COMMENT ON COLUMN public.admin_notes.note_type IS
  'Tipo: general | sales | support | mentoring | product | content | technical | compliance | follow_up | other.';

COMMENT ON COLUMN public.admin_notes.body IS
  'Texto principal de la nota. Obligatorio y no vacío.';

COMMENT ON COLUMN public.admin_notes.priority IS
  'Prioridad: low | normal | high | urgent.';

COMMENT ON COLUMN public.admin_notes.status IS
  'Estado: open | in_progress | resolved | archived.';

COMMENT ON COLUMN public.admin_notes.is_pinned IS
  'Si true, la nota aparece destacada en listados de Warhome.';

COMMENT ON COLUMN public.admin_notes.metadata IS
  'Metadatos adicionales (JSON objeto). Sin esquema fijo aún.';

COMMENT ON COLUMN public.admin_notes.created_by IS
  'Admin que creó la nota. SET NULL si se elimina el usuario.';

COMMENT ON COLUMN public.admin_notes.updated_by IS
  'Último admin que editó la nota. SET NULL si se elimina el usuario.';

COMMENT ON COLUMN public.admin_notes.resolved_by IS
  'Admin que resolvió la nota. SET NULL si se elimina el usuario.';

COMMENT ON COLUMN public.admin_notes.resolved_at IS
  'Obligatorio cuando status = resolved.';

COMMENT ON COLUMN public.admin_notes.archived_at IS
  'Obligatorio cuando status = archived.';

-- -----------------------------------------------------------------------------
-- B) CONSTRAINTS — definidos en CREATE TABLE (ver sección A)
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- C) Trigger updated_at — se actualiza automáticamente en cada UPDATE
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_admin_notes_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS admin_notes_set_updated_at ON public.admin_notes;
CREATE TRIGGER admin_notes_set_updated_at
  BEFORE UPDATE ON public.admin_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_admin_notes_updated_at();

COMMENT ON FUNCTION public.set_admin_notes_updated_at() IS
  'Actualiza admin_notes.updated_at antes de cada UPDATE.';

-- -----------------------------------------------------------------------------
-- D) Índices — consultas por entidad, estado y prioridad
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS admin_notes_user_id_idx
  ON public.admin_notes (user_id);

CREATE INDEX IF NOT EXISTS admin_notes_lead_id_idx
  ON public.admin_notes (lead_id);

CREATE INDEX IF NOT EXISTS admin_notes_product_id_idx
  ON public.admin_notes (product_id);

CREATE INDEX IF NOT EXISTS admin_notes_content_item_id_idx
  ON public.admin_notes (content_item_id);

CREATE INDEX IF NOT EXISTS admin_notes_note_type_idx
  ON public.admin_notes (note_type);

CREATE INDEX IF NOT EXISTS admin_notes_priority_idx
  ON public.admin_notes (priority);

CREATE INDEX IF NOT EXISTS admin_notes_status_idx
  ON public.admin_notes (status);

CREATE INDEX IF NOT EXISTS admin_notes_is_pinned_idx
  ON public.admin_notes (is_pinned);

CREATE INDEX IF NOT EXISTS admin_notes_created_by_idx
  ON public.admin_notes (created_by);

CREATE INDEX IF NOT EXISTS admin_notes_resolved_at_idx
  ON public.admin_notes (resolved_at);

CREATE INDEX IF NOT EXISTS admin_notes_archived_at_idx
  ON public.admin_notes (archived_at);

CREATE INDEX IF NOT EXISTS admin_notes_created_at_idx
  ON public.admin_notes (created_at);

CREATE INDEX IF NOT EXISTS admin_notes_updated_at_idx
  ON public.admin_notes (updated_at);

CREATE INDEX IF NOT EXISTS admin_notes_lead_id_created_at_idx
  ON public.admin_notes (lead_id, created_at);

CREATE INDEX IF NOT EXISTS admin_notes_user_id_created_at_idx
  ON public.admin_notes (user_id, created_at);

CREATE INDEX IF NOT EXISTS admin_notes_status_priority_idx
  ON public.admin_notes (status, priority);

CREATE INDEX IF NOT EXISTS admin_notes_status_created_at_idx
  ON public.admin_notes (status, created_at);

CREATE INDEX IF NOT EXISTS admin_notes_is_pinned_updated_at_idx
  ON public.admin_notes (is_pinned, updated_at);

-- -----------------------------------------------------------------------------
-- E) RLS — tabla estrictamente interna; solo Warhome y service_role
-- -----------------------------------------------------------------------------
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.admin_notes FROM anon;
REVOKE ALL ON public.admin_notes FROM authenticated;

-- NOTA: Sin GRANT ni policies para anon/authenticated.
-- Gestión exclusiva: Warhome y rutas API con SUPABASE_SERVICE_ROLE_KEY.

COMMIT;
