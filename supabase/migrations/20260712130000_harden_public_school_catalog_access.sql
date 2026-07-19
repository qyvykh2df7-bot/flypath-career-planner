BEGIN;

-- The school catalogue contains editorial and operational columns. RLS restricts rows, not
-- columns, so browser roles must not read these base tables directly. Public pages now receive
-- a closed DTO from the server-only catalogue boundary instead.
DO $$
DECLARE
  target_table text;
  existing_policy record;
  target_tables constant text[] := ARRAY[
    'schools',
    'programs',
    'modular_modules',
    'costs_and_payments',
    'extras',
    'risk_flags',
    'sources',
    'school_scores',
    'school_text_list_items',
    'university_tracks'
  ];
BEGIN
  FOREACH target_table IN ARRAY target_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target_table);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated', target_table);
    EXECUTE format('GRANT SELECT ON TABLE public.%I TO service_role', target_table);
  END LOOP;

  -- service_role bypasses RLS. Remove every SELECT/ALL policy on the base catalogue so no
  -- browser role can regain access through an old permissive policy name.
  FOR existing_policy IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY(target_tables)
      AND cmd IN ('SELECT', 'ALL')
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      existing_policy.policyname,
      existing_policy.tablename
    );
  END LOOP;
END $$;

COMMENT ON TABLE public.schools IS
  'Catálogo editorial. El navegador recibe solo el DTO público cerrado servido por FlyPath.';

COMMIT;
