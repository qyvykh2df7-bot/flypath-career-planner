-- =============================================================================
-- FlyPath Phase 12A.7: Content OS Brand DNA + Historical Content Library
-- Migration: 20260729150000_add_content_os_brand_dna_and_historical_library.sql
--
-- Adds one private PilotFeliu brand profile and extends the existing Content OS
-- library so published historical pieces and their initial metrics can be
-- imported atomically. No public access or autonomous AI behavior is added.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- A) Brand DNA: one private profile for the PilotFeliu workspace
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.content_brand_profiles (
  workspace_key text PRIMARY KEY,
  brand_name text NOT NULL,
  brand_description text NOT NULL,
  audiences text[] NOT NULL,
  products jsonb NOT NULL,
  content_pillars text[] NOT NULL,
  objectives text[] NOT NULL,
  tone_style text NOT NULL,
  tone_personality text NOT NULL,
  tone_communication text NOT NULL,
  tone_avoid text NOT NULL,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT content_brand_profiles_workspace_check
    CHECK (workspace_key = 'pilotfeliu'),
  CONSTRAINT content_brand_profiles_name_check
    CHECK (length(btrim(brand_name)) BETWEEN 1 AND 120),
  CONSTRAINT content_brand_profiles_description_check
    CHECK (length(btrim(brand_description)) BETWEEN 1 AND 2000),
  CONSTRAINT content_brand_profiles_audiences_check
    CHECK (
      cardinality(audiences) BETWEEN 1 AND 30
      AND char_length(array_to_string(audiences, E'\n')) <= 6000
    ),
  CONSTRAINT content_brand_profiles_products_check
    CHECK (
      jsonb_typeof(products) = 'object'
      AND products ?& ARRAY['guide', 'career_planner', 'aerocomms', 'mentorships']
      AND (products - ARRAY['guide', 'career_planner', 'aerocomms', 'mentorships']) = '{}'::jsonb
      AND length(btrim(products->>'guide')) BETWEEN 1 AND 1000
      AND length(btrim(products->>'career_planner')) BETWEEN 1 AND 1000
      AND length(btrim(products->>'aerocomms')) BETWEEN 1 AND 1000
      AND length(btrim(products->>'mentorships')) BETWEEN 1 AND 1000
    ),
  CONSTRAINT content_brand_profiles_pillars_check
    CHECK (
      cardinality(content_pillars) BETWEEN 1 AND 30
      AND char_length(array_to_string(content_pillars, E'\n')) <= 6000
    ),
  CONSTRAINT content_brand_profiles_objectives_check
    CHECK (
      cardinality(objectives) BETWEEN 1 AND 4
      AND objectives <@ ARRAY[
        'growth',
        'community',
        'authority',
        'conversion'
      ]::text[]
    ),
  CONSTRAINT content_brand_profiles_tone_check
    CHECK (
      length(btrim(tone_style)) BETWEEN 1 AND 2000
      AND length(btrim(tone_personality)) BETWEEN 1 AND 2000
      AND length(btrim(tone_communication)) BETWEEN 1 AND 2000
      AND length(btrim(tone_avoid)) BETWEEN 1 AND 2000
    )
);

DROP TRIGGER IF EXISTS content_brand_profiles_set_updated_at
  ON public.content_brand_profiles;
CREATE TRIGGER content_brand_profiles_set_updated_at
  BEFORE UPDATE ON public.content_brand_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_content_os_updated_at();

INSERT INTO public.content_brand_profiles (
  workspace_key,
  brand_name,
  brand_description,
  audiences,
  products,
  content_pillars,
  objectives,
  tone_style,
  tone_personality,
  tone_communication,
  tone_avoid
)
VALUES (
  'pilotfeliu',
  'PilotFeliu',
  'Piloto comercial que crea contenido sobre aviación, carrera profesional y ayuda a futuros pilotos.',
  ARRAY[
    'Futuros pilotos',
    'Estudiantes',
    'Pilotos jóvenes',
    'Personas interesadas en la carrera aeronáutica'
  ]::text[],
  jsonb_build_object(
    'guide', 'Cómo ser Piloto y recursos educativos',
    'career_planner', 'Planificación de carrera',
    'aerocomms', 'Inglés aeronáutico y fraseología',
    'mentorships', 'Asesoramiento personalizado'
  ),
  ARRAY[
    'Vida de piloto',
    'Formación',
    'Escuelas',
    'Carrera aeronáutica',
    'Entrevistas',
    'Errores comunes',
    'Inglés aeronáutico',
    'ATC y fraseología',
    'Historias personales',
    'Productos'
  ]::text[],
  ARRAY['growth', 'authority', 'community', 'conversion']::text[],
  'Claro, directo y útil.',
  'Cercano, ambicioso, resiliente y profesional.',
  'Hablar desde la experiencia, explicar con sencillez y mantener una voz humana.',
  'Política, familia, patrimonio personal, conflictos con la compañía e información profesional sensible.'
)
ON CONFLICT (workspace_key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.upsert_content_os_brand_profile(
  p_admin_user_id uuid,
  p_brand_name text,
  p_brand_description text,
  p_audiences text[],
  p_products jsonb,
  p_content_pillars text[],
  p_objectives text[],
  p_tone_style text,
  p_tone_personality text,
  p_tone_communication text,
  p_tone_avoid text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = p_admin_user_id
      AND is_active = true
      AND role IN ('admin', 'owner')
  ) THEN
    RAISE EXCEPTION 'content_os_admin_required';
  END IF;

  INSERT INTO public.content_brand_profiles (
    workspace_key,
    brand_name,
    brand_description,
    audiences,
    products,
    content_pillars,
    objectives,
    tone_style,
    tone_personality,
    tone_communication,
    tone_avoid,
    created_by,
    updated_by
  )
  VALUES (
    'pilotfeliu',
    p_brand_name,
    p_brand_description,
    p_audiences,
    p_products,
    p_content_pillars,
    p_objectives,
    p_tone_style,
    p_tone_personality,
    p_tone_communication,
    p_tone_avoid,
    p_admin_user_id,
    p_admin_user_id
  )
  ON CONFLICT (workspace_key) DO UPDATE
  SET
    brand_name = EXCLUDED.brand_name,
    brand_description = EXCLUDED.brand_description,
    audiences = EXCLUDED.audiences,
    products = EXCLUDED.products,
    content_pillars = EXCLUDED.content_pillars,
    objectives = EXCLUDED.objectives,
    tone_style = EXCLUDED.tone_style,
    tone_personality = EXCLUDED.tone_personality,
    tone_communication = EXCLUDED.tone_communication,
    tone_avoid = EXCLUDED.tone_avoid,
    updated_by = p_admin_user_id;

  RETURN 'pilotfeliu';
END;
$$;

-- -----------------------------------------------------------------------------
-- B) Historical content metadata on the existing private library
-- -----------------------------------------------------------------------------

ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS content_origin text NOT NULL DEFAULT 'planned',
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS content_pillar text,
  ADD COLUMN IF NOT EXISTS related_product_key text;

ALTER TABLE public.content_items
  DROP CONSTRAINT IF EXISTS content_items_platform_check,
  DROP CONSTRAINT IF EXISTS content_items_content_os_required_fields_check,
  DROP CONSTRAINT IF EXISTS content_items_content_os_lengths_check;

ALTER TABLE public.content_items
  ADD CONSTRAINT content_items_platform_check
    CHECK (
      platform IS NULL
      OR (
        content_origin = 'planned'
        AND platform IN (
          'tiktok_pilotfeliu',
          'instagram_pilotfeliu',
          'instagram_flypath',
          'youtube'
        )
      )
      OR (
        content_origin = 'historical'
        AND platform IN (
          'tiktok_pilotfeliu',
          'instagram_pilotfeliu',
          'instagram_flypath',
          'youtube',
          'other'
        )
      )
    ),
  ADD CONSTRAINT content_items_content_origin_check
    CHECK (content_origin IN ('planned', 'historical')),
  ADD CONSTRAINT content_items_content_os_required_fields_check
    CHECK (
      workspace_key IS NULL
      OR (
        platform IS NOT NULL
        AND (
          content_origin = 'historical'
          OR (
            objective IS NOT NULL
            AND hook IS NOT NULL
            AND length(btrim(hook)) > 0
            AND script IS NOT NULL
            AND length(btrim(script)) > 0
            AND cta IS NOT NULL
            AND length(btrim(cta)) > 0
          )
        )
      )
    ),
  ADD CONSTRAINT content_items_content_os_lengths_check
    CHECK (
      workspace_key IS NULL
      OR (
        char_length(title) <= 160
        AND (summary IS NULL OR char_length(summary) <= 5000)
        AND (hook IS NULL OR char_length(hook) <= 1000)
        AND (script IS NULL OR char_length(script) <= 30000)
        AND (cta IS NULL OR char_length(cta) <= 1000)
        AND (notes IS NULL OR char_length(notes) <= 10000)
        AND (source_url IS NULL OR char_length(source_url) <= 2000)
        AND (content_pillar IS NULL OR char_length(content_pillar) <= 100)
      )
    ),
  ADD CONSTRAINT content_items_historical_fields_check
    CHECK (
      content_origin <> 'historical'
      OR (
        workspace_key = 'pilotfeliu'
        AND status = 'published'
        AND published_at IS NOT NULL
        AND (
          source_url IS NULL
          OR source_url ~ '^https?://'
        )
        AND (
          related_product_key IS NULL
          OR related_product_key IN (
            'guide',
            'career_planner',
            'aerocomms',
            'mentorships'
          )
        )
      )
    );

CREATE INDEX IF NOT EXISTS content_items_workspace_origin_published_idx
  ON public.content_items (workspace_key, content_origin, published_at DESC);

-- -----------------------------------------------------------------------------
-- C) Historical metric support
-- -----------------------------------------------------------------------------

ALTER TABLE public.content_metrics
  ADD COLUMN IF NOT EXISTS saves integer NOT NULL DEFAULT 0;

ALTER TABLE public.content_metrics
  DROP CONSTRAINT IF EXISTS content_metrics_nonnegative_check;

ALTER TABLE public.content_metrics
  ADD CONSTRAINT content_metrics_nonnegative_check
    CHECK (
      views BETWEEN 0 AND 1000000000
      AND likes BETWEEN 0 AND 1000000000
      AND comments BETWEEN 0 AND 1000000000
      AND shares BETWEEN 0 AND 1000000000
      AND saves BETWEEN 0 AND 1000000000
      AND followers_gained BETWEEN 0 AND 1000000000
      AND leads_generated BETWEEN 0 AND 1000000000
      AND sales_attributed BETWEEN 0 AND 1000000000
    );

-- -----------------------------------------------------------------------------
-- D) Atomic historical import
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.import_content_os_historical_item(
  p_admin_user_id uuid,
  p_title text,
  p_platform text,
  p_published_on date,
  p_source_url text,
  p_description text,
  p_hook text,
  p_cta text,
  p_content_pillar text,
  p_objective text,
  p_related_product_key text,
  p_metrics jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_item_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = p_admin_user_id
      AND is_active = true
      AND role IN ('admin', 'owner')
  ) THEN
    RAISE EXCEPTION 'content_os_admin_required';
  END IF;

  IF length(btrim(p_title)) NOT BETWEEN 1 AND 160
    OR p_platform NOT IN (
      'tiktok_pilotfeliu',
      'instagram_pilotfeliu',
      'instagram_flypath',
      'youtube',
      'other'
    )
    OR p_published_on IS NULL
    OR (p_source_url IS NOT NULL AND (
      char_length(p_source_url) > 2000
      OR p_source_url !~ '^https?://'
    ))
    OR (p_description IS NOT NULL AND char_length(p_description) > 5000)
    OR (p_hook IS NOT NULL AND char_length(p_hook) > 1000)
    OR (p_cta IS NOT NULL AND char_length(p_cta) > 1000)
    OR (p_content_pillar IS NOT NULL AND char_length(p_content_pillar) > 100)
    OR (p_objective IS NOT NULL AND p_objective NOT IN (
      'growth', 'community', 'authority', 'conversion'
    ))
    OR (p_related_product_key IS NOT NULL AND p_related_product_key NOT IN (
      'guide', 'career_planner', 'aerocomms', 'mentorships'
    ))
  THEN
    RAISE EXCEPTION 'content_os_historical_item_invalid';
  END IF;

  IF p_metrics IS NOT NULL AND (
    jsonb_typeof(p_metrics) <> 'object'
    OR NOT p_metrics ?& ARRAY[
      'views',
      'likes',
      'comments',
      'shares',
      'saves',
      'followers_gained',
      'leads_generated',
      'sales_attributed'
    ]
    OR (
      p_metrics - ARRAY[
        'views',
        'likes',
        'comments',
        'shares',
        'saves',
        'followers_gained',
        'leads_generated',
        'sales_attributed'
      ]
    ) <> '{}'::jsonb
    OR EXISTS (
      SELECT 1
      FROM jsonb_each_text(p_metrics) AS metric(key, value)
      WHERE metric.key IN (
        'views',
        'likes',
        'comments',
        'shares',
        'saves',
        'followers_gained',
        'leads_generated',
        'sales_attributed'
      )
      AND (
        metric.value !~ '^\d+$'
        OR metric.value::numeric > 1000000000
      )
    )
  ) THEN
    RAISE EXCEPTION 'content_os_historical_metrics_invalid';
  END IF;

  INSERT INTO public.content_items (
    content_type,
    title,
    summary,
    status,
    visibility,
    language_code,
    workspace_key,
    platform,
    objective,
    hook,
    script,
    cta,
    content_origin,
    source_url,
    content_pillar,
    related_product_key,
    published_at,
    proposal_source,
    proposal_status,
    created_by,
    updated_by
  )
  VALUES (
    'video',
    btrim(p_title),
    NULLIF(btrim(p_description), ''),
    'published',
    'internal',
    'es',
    'pilotfeliu',
    p_platform,
    p_objective,
    COALESCE(NULLIF(btrim(p_hook), ''), ''),
    '',
    COALESCE(NULLIF(btrim(p_cta), ''), ''),
    'historical',
    NULLIF(btrim(p_source_url), ''),
    NULLIF(btrim(p_content_pillar), ''),
    p_related_product_key,
    p_published_on::timestamp AT TIME ZONE 'Europe/Madrid',
    'manual',
    'approved',
    p_admin_user_id,
    p_admin_user_id
  )
  RETURNING id INTO new_item_id;

  IF p_metrics IS NOT NULL THEN
    INSERT INTO public.content_metrics (
      content_item_id,
      recorded_on,
      views,
      likes,
      comments,
      shares,
      saves,
      followers_gained,
      leads_generated,
      sales_attributed,
      created_by,
      updated_by
    )
    VALUES (
      new_item_id,
      p_published_on,
      (p_metrics->>'views')::integer,
      (p_metrics->>'likes')::integer,
      (p_metrics->>'comments')::integer,
      (p_metrics->>'shares')::integer,
      (p_metrics->>'saves')::integer,
      (p_metrics->>'followers_gained')::integer,
      (p_metrics->>'leads_generated')::integer,
      (p_metrics->>'sales_attributed')::integer,
      p_admin_user_id,
      p_admin_user_id
    );
  END IF;

  RETURN new_item_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- E) Private access
-- -----------------------------------------------------------------------------

ALTER TABLE public.content_brand_profiles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.content_brand_profiles
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.content_brand_profiles TO service_role;

REVOKE ALL ON FUNCTION public.upsert_content_os_brand_profile(
  uuid, text, text, text[], jsonb, text[], text[], text, text, text, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_content_os_brand_profile(
  uuid, text, text, text[], jsonb, text[], text[], text, text, text, text
) TO service_role;

REVOKE ALL ON FUNCTION public.import_content_os_historical_item(
  uuid, text, text, date, text, text, text, text, text, text, text, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.import_content_os_historical_item(
  uuid, text, text, date, text, text, text, text, text, text, text, jsonb
) TO service_role;

COMMIT;
