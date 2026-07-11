-- =============================================================================
-- FlyPath Backend Core: registro interno de eventos de producto y marketing
-- Migración: 20260711260000_create_user_events.sql
--
-- Alcance: SOLO public.user_events (DDL + RLS privado).
-- Depende de: auth.users (Supabase Auth), public.leads (20260711200000),
--             public.products (20260711180000).
-- Idempotente: IF NOT EXISTS.
--
-- Append-only: sin updated_at ni triggers de actualización.
-- Sin particionado, retención, agregaciones, RPC, seeds ni acceso desde navegador.
-- Inserción vía service_role en rutas servidor (futuro).
-- NO EJECUTAR en producción sin revisión previa.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- A) public.user_events — historial de eventos (usuario, lead, producto o anónimo)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads (id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products (id) ON DELETE SET NULL,
  event_name text NOT NULL,
  event_category text NOT NULL,
  source text,
  session_id text,
  anonymous_id text,
  page_path text,
  referrer text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_events_event_name_format_check
    CHECK (
      length(btrim(event_name)) > 0
      AND event_name ~ '^[a-z][a-z0-9_]*$'
    ),
  CONSTRAINT user_events_event_category_check
    CHECK (event_category IN (
      'auth',
      'lead',
      'product',
      'content',
      'email',
      'purchase',
      'navigation',
      'engagement',
      'system'
    )),
  CONSTRAINT user_events_source_nonempty_check
    CHECK (source IS NULL OR length(btrim(source)) > 0),
  CONSTRAINT user_events_session_id_nonempty_check
    CHECK (session_id IS NULL OR length(btrim(session_id)) > 0),
  CONSTRAINT user_events_anonymous_id_nonempty_check
    CHECK (anonymous_id IS NULL OR length(btrim(anonymous_id)) > 0),
  CONSTRAINT user_events_metadata_object_check
    CHECK (jsonb_typeof(metadata) = 'object')
);

COMMENT ON TABLE public.user_events IS
  'Historial append-only de eventos de producto, marketing y comportamiento. Sin edición normal.';

COMMENT ON COLUMN public.user_events.user_id IS
  'Usuario autenticado opcional. SET NULL si se elimina en auth.users.';

COMMENT ON COLUMN public.user_events.lead_id IS
  'Lead opcional asociado al evento. SET NULL si se elimina el lead.';

COMMENT ON COLUMN public.user_events.product_id IS
  'Producto opcional relacionado. SET NULL si se elimina el producto.';

COMMENT ON COLUMN public.user_events.event_name IS
  'Nombre del evento en snake_case (p. ej. page_viewed, lead_created).';

COMMENT ON COLUMN public.user_events.event_category IS
  'Categoría: auth | lead | product | content | email | purchase | navigation | engagement | system.';

COMMENT ON COLUMN public.user_events.source IS
  'Origen del evento (p. ej. web, api, warhome). Opcional.';

COMMENT ON COLUMN public.user_events.session_id IS
  'Identificador de sesión de navegación. Opcional.';

COMMENT ON COLUMN public.user_events.anonymous_id IS
  'Identificador anónimo del visitante (cookie/local). Opcional.';

COMMENT ON COLUMN public.user_events.metadata IS
  'Payload JSON objeto con propiedades adicionales del evento.';

COMMENT ON COLUMN public.user_events.occurred_at IS
  'Momento en que ocurrió el evento (puede diferir de created_at si se ingiere con retraso).';

COMMENT ON COLUMN public.user_events.created_at IS
  'Momento de inserción en la base de datos.';

-- -----------------------------------------------------------------------------
-- B) CONSTRAINTS — definidos en CREATE TABLE (ver sección A)
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- C) Índices — consultas por actor, evento y tiempo
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS user_events_user_id_idx
  ON public.user_events (user_id);

CREATE INDEX IF NOT EXISTS user_events_lead_id_idx
  ON public.user_events (lead_id);

CREATE INDEX IF NOT EXISTS user_events_product_id_idx
  ON public.user_events (product_id);

CREATE INDEX IF NOT EXISTS user_events_event_name_idx
  ON public.user_events (event_name);

CREATE INDEX IF NOT EXISTS user_events_event_category_idx
  ON public.user_events (event_category);

CREATE INDEX IF NOT EXISTS user_events_source_idx
  ON public.user_events (source);

CREATE INDEX IF NOT EXISTS user_events_session_id_idx
  ON public.user_events (session_id);

CREATE INDEX IF NOT EXISTS user_events_anonymous_id_idx
  ON public.user_events (anonymous_id);

CREATE INDEX IF NOT EXISTS user_events_occurred_at_idx
  ON public.user_events (occurred_at);

CREATE INDEX IF NOT EXISTS user_events_created_at_idx
  ON public.user_events (created_at);

CREATE INDEX IF NOT EXISTS user_events_user_id_occurred_at_idx
  ON public.user_events (user_id, occurred_at);

CREATE INDEX IF NOT EXISTS user_events_lead_id_occurred_at_idx
  ON public.user_events (lead_id, occurred_at);

CREATE INDEX IF NOT EXISTS user_events_product_id_occurred_at_idx
  ON public.user_events (product_id, occurred_at);

CREATE INDEX IF NOT EXISTS user_events_event_name_occurred_at_idx
  ON public.user_events (event_name, occurred_at);

-- -----------------------------------------------------------------------------
-- D) Inmutabilidad — sin updated_at ni triggers (append-only)
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- E) RLS — tabla privada; solo service_role desde rutas servidor
-- -----------------------------------------------------------------------------
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.user_events FROM anon;
REVOKE ALL ON public.user_events FROM authenticated;

-- NOTA: Sin GRANT ni policies para anon/authenticated.
-- Inserción de eventos: rutas API con SUPABASE_SERVICE_ROLE_KEY.

COMMIT;
