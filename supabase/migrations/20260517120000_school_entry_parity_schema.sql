-- =============================================================================
-- FlyPath: schema de paridad SchoolEntry ↔ schoolsSpain.ts
-- Migración: 20260517120000_school_entry_parity_schema.sql
--
-- Alcance: SOLO schema (DDL). Sin UPDATE/DELETE de datos de escuelas.
-- Idempotente: IF NOT EXISTS / ADD COLUMN IF NOT EXISTS donde aplica.
--
-- NO EJECUTAR en producción sin revisión y backup previo.
-- =============================================================================

BEGIN;

-- pgcrypto: gen_random_uuid() para PK propias (item_id, track_id).
-- public.schools.school_id es text; todas las FK hacia schools usan text.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- A) schools — columnas de paridad comparador
-- -----------------------------------------------------------------------------
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS legacy_entry_id text,
  ADD COLUMN IF NOT EXISTS ato_name text,
  ADD COLUMN IF NOT EXISTS associated_university text,
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS listing_card_summary text,
  ADD COLUMN IF NOT EXISTS data_confidence text,
  ADD COLUMN IF NOT EXISTS excluded_from_public_comparator boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS comparator_exclusion_note text,
  ADD COLUMN IF NOT EXISTS aircraft_availability text,
  ADD COLUMN IF NOT EXISTS student_aircraft_ratio text,
  ADD COLUMN IF NOT EXISTS instructor_student_ratio text,
  ADD COLUMN IF NOT EXISTS job_support_summary text,
  ADD COLUMN IF NOT EXISTS employment_claims_type text,
  ADD COLUMN IF NOT EXISTS school_entry_snapshot jsonb;

-- Constraints (idempotente: ignorar si ya existen)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'schools_data_confidence_check'
  ) THEN
    ALTER TABLE public.schools
      ADD CONSTRAINT schools_data_confidence_check
      CHECK (data_confidence IS NULL OR data_confidence IN ('high', 'medium', 'low'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'schools_aircraft_availability_check'
  ) THEN
    ALTER TABLE public.schools
      ADD CONSTRAINT schools_aircraft_availability_check
      CHECK (
        aircraft_availability IS NULL
        OR aircraft_availability IN ('high', 'medium', 'low', 'unknown')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'schools_employment_claims_type_check'
  ) THEN
    ALTER TABLE public.schools
      ADD CONSTRAINT schools_employment_claims_type_check
      CHECK (
        employment_claims_type IS NULL
        OR employment_claims_type IN (
          'none', 'vague', 'clear_non_guaranteed', 'guaranteed_claimed', 'unknown'
        )
      );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS schools_legacy_entry_id_key
  ON public.schools (legacy_entry_id)
  WHERE legacy_entry_id IS NOT NULL;

COMMENT ON COLUMN public.schools.legacy_entry_id IS
  'ID estable de SchoolEntry en schoolsSpain.ts (ej. es-adventia-usal).';
COMMENT ON COLUMN public.schools.short_description IS
  'Copy comparador; distinto de public_notes operativas.';
COMMENT ON COLUMN public.schools.school_entry_snapshot IS
  'Snapshot JSON opcional del SchoolEntry fuente (auditoría / rollback).';

-- -----------------------------------------------------------------------------
-- B) school_scores — 1 fila por escuela
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_scores (
  school_id text PRIMARY KEY REFERENCES public.schools (school_id) ON DELETE CASCADE,
  document_transparency smallint NOT NULL DEFAULT 0,
  cost_clarity smallint NOT NULL DEFAULT 0,
  financial_risk smallint NOT NULL DEFAULT 0,
  commercial_risk smallint NOT NULL DEFAULT 0,
  operational_solidity smallint NOT NULL DEFAULT 0,
  data_confidence_score smallint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT school_scores_nonneg CHECK (
    document_transparency >= 0
    AND cost_clarity >= 0
    AND financial_risk >= 0
    AND commercial_risk >= 0
    AND operational_solidity >= 0
    AND data_confidence_score >= 0
  )
);

CREATE INDEX IF NOT EXISTS school_scores_school_id_idx
  ON public.school_scores (school_id);

-- -----------------------------------------------------------------------------
-- C) school_text_list_items — red_flag | pending_data | key_question
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_text_list_items (
  item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id text NOT NULL REFERENCES public.schools (school_id) ON DELETE CASCADE,
  list_type text NOT NULL,
  sort_index integer NOT NULL,
  item_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT school_text_list_items_list_type_check
    CHECK (list_type IN ('red_flag', 'pending_data', 'key_question')),
  CONSTRAINT school_text_list_items_sort_index_check
    CHECK (sort_index >= 0),
  CONSTRAINT school_text_list_items_school_list_sort_unique
    UNIQUE (school_id, list_type, sort_index)
);

CREATE INDEX IF NOT EXISTS school_text_list_items_school_list_sort_idx
  ON public.school_text_list_items (school_id, list_type, sort_index);

-- -----------------------------------------------------------------------------
-- D) university_tracks
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.university_tracks (
  track_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id text NOT NULL REFERENCES public.schools (school_id) ON DELETE CASCADE,
  university_name text NOT NULL,
  degree_type text NOT NULL,
  degree_name text NOT NULL,
  academic_duration_years numeric(4, 1) NOT NULL,
  ects integer NOT NULL,
  license_included_mode text NOT NULL,
  actual_license_outcome text NOT NULL,
  partner_ato text NOT NULL,
  academic_cost_eur integer NOT NULL DEFAULT 0,
  flight_cost_eur integer NOT NULL DEFAULT 0,
  total_estimated_cost_eur integer NOT NULL DEFAULT 0,
  class1_failure_policy text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS university_tracks_school_id_key
  ON public.university_tracks (school_id);

CREATE INDEX IF NOT EXISTS university_tracks_school_id_idx
  ON public.university_tracks (school_id);

-- -----------------------------------------------------------------------------
-- E) extras — MCC/JOC y UPRT
-- -----------------------------------------------------------------------------
ALTER TABLE public.extras
  ADD COLUMN IF NOT EXISTS mcc_joc_status text,
  ADD COLUMN IF NOT EXISTS mcc_joc_notes text,
  ADD COLUMN IF NOT EXISTS advanced_uprt_status text,
  ADD COLUMN IF NOT EXISTS advanced_uprt_notes text;

-- -----------------------------------------------------------------------------
-- F) programs — fleet summary literal para comparador
-- -----------------------------------------------------------------------------
ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS comparator_fleet_summary text;

-- -----------------------------------------------------------------------------
-- G) RLS — habilitar en tablas nuevas; solo SELECT público (sin escritura anon)
-- Ajustar USING si vuestras policies de schools son más restrictivas.
-- -----------------------------------------------------------------------------
ALTER TABLE public.school_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_text_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_tracks ENABLE ROW LEVEL SECURITY;

-- Grants de lectura (común en Supabase para tablas públicas de comparador)
GRANT SELECT ON public.school_scores TO anon, authenticated;
GRANT SELECT ON public.school_text_list_items TO anon, authenticated;
GRANT SELECT ON public.university_tracks TO anon, authenticated;

-- Policies SELECT (idempotentes)
DROP POLICY IF EXISTS school_scores_select_public ON public.school_scores;
CREATE POLICY school_scores_select_public
  ON public.school_scores
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS school_text_list_items_select_public ON public.school_text_list_items;
CREATE POLICY school_text_list_items_select_public
  ON public.school_text_list_items
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS university_tracks_select_public ON public.university_tracks;
CREATE POLICY university_tracks_select_public
  ON public.university_tracks
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- NOTA: No se crean policies INSERT/UPDATE/DELETE para anon.
-- El seed local debe usar SUPABASE_SERVICE_ROLE_KEY (bypass RLS).

COMMIT;
