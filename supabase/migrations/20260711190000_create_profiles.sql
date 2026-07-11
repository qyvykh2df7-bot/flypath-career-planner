-- =============================================================================
-- FlyPath Backend Core: perfiles de usuario (1:1 con auth.users)
-- Migración: 20260711190000_create_profiles.sql
--
-- Alcance: SOLO public.profiles (DDL + RLS por usuario autenticado).
-- Idempotente: IF NOT EXISTS, CREATE OR REPLACE, DROP TRIGGER IF EXISTS,
--              DROP POLICY IF EXISTS.
--
-- Sin trigger automático al registrarse en auth.users (se decidirá con Auth).
-- NO EJECUTAR en producción sin revisión previa.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- A) public.profiles — datos generales del usuario FlyPath
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text,
  country_code text,
  preferred_language text NOT NULL DEFAULT 'es',
  timezone text,
  training_stage text,
  career_goal text,
  avatar_url text,
  marketing_consent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_preferred_language_check
    CHECK (preferred_language IN ('es', 'en')),
  CONSTRAINT profiles_country_code_check
    CHECK (country_code IS NULL OR country_code ~ '^[A-Z]{2}$'),
  CONSTRAINT profiles_training_stage_check
    CHECK (
      training_stage IS NULL
      OR training_stage IN (
        'exploring',
        'pre_ppl',
        'ppl_student',
        'ppl_holder',
        'atpl_theory',
        'commercial_training',
        'licensed_pilot',
        'airline_pilot',
        'other'
      )
    ),
  CONSTRAINT profiles_career_goal_check
    CHECK (
      career_goal IS NULL
      OR career_goal IN (
        'airline_pilot',
        'private_pilot',
        'flight_instructor',
        'career_change',
        'aviation_enthusiast',
        'undecided',
        'other'
      )
    )
);

COMMENT ON TABLE public.profiles IS
  'Perfil general FlyPath 1:1 con auth.users. Sin progreso de productos ni datos de pago.';

COMMENT ON COLUMN public.profiles.user_id IS
  'PK y FK a auth.users. El perfil se elimina en cascada si se borra el usuario.';

COMMENT ON COLUMN public.profiles.full_name IS
  'Nombre para mostrar. Opcional hasta completar onboarding.';

COMMENT ON COLUMN public.profiles.country_code IS
  'Código ISO 3166-1 alpha-2 en mayúsculas (ej. ES, FR, IE). NULL si no se conoce.';

COMMENT ON COLUMN public.profiles.preferred_language IS
  'Idioma preferido de la UI. Valores permitidos: es | en.';

COMMENT ON COLUMN public.profiles.timezone IS
  'Zona horaria IANA (ej. Europe/Madrid). Opcional.';

COMMENT ON COLUMN public.profiles.training_stage IS
  'Etapa formativa actual del usuario. NULL hasta que el usuario la indique.';

COMMENT ON COLUMN public.profiles.career_goal IS
  'Objetivo profesional declarado. NULL hasta que el usuario lo indique.';

COMMENT ON COLUMN public.profiles.avatar_url IS
  'URL del avatar del usuario. Opcional.';

COMMENT ON COLUMN public.profiles.marketing_consent IS
  'Consentimiento explícito para comunicaciones de marketing. Por defecto false.';

-- -----------------------------------------------------------------------------
-- B) Trigger updated_at — se actualiza automáticamente en cada UPDATE
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_profiles_updated_at();

COMMENT ON FUNCTION public.set_profiles_updated_at() IS
  'Actualiza profiles.updated_at antes de cada UPDATE en public.profiles.';

-- -----------------------------------------------------------------------------
-- C) RLS — cada usuario solo accede a su propio perfil
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM authenticated;

GRANT SELECT ON public.profiles TO authenticated;

GRANT INSERT (
  user_id,
  full_name,
  country_code,
  preferred_language,
  timezone,
  training_stage,
  career_goal,
  avatar_url,
  marketing_consent
) ON public.profiles TO authenticated;

GRANT UPDATE (
  full_name,
  country_code,
  preferred_language,
  timezone,
  training_stage,
  career_goal,
  avatar_url,
  marketing_consent
) ON public.profiles TO authenticated;

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- NOTA: Sin policy DELETE para authenticated ni anon.
-- created_at y updated_at: solo defaults/trigger; sin GRANT de escritura.
-- user_id: insertable al crear perfil; no actualizable vía API autenticada.
-- Borrado de perfil vía ON DELETE CASCADE desde auth.users o service_role.

COMMIT;
