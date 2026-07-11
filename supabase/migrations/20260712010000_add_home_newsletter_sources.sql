-- =============================================================================
-- FlyPath Backend Core: añadir home_newsletter a fuentes y listas permitidas
-- Migración: 20260712010000_add_home_newsletter_sources.sql
--
-- Necesario para captura de newsletter desde la home (integrate-home-newsletter-leads).
-- Idempotente: DROP CONSTRAINT IF EXISTS + ADD CONSTRAINT.
-- =============================================================================

BEGIN;

ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_first_source_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_first_source_check
  CHECK (first_source IN (
    'newsletter',
    'home_newsletter',
    'career_planner',
    'preppl',
    'aerocomms',
    'mentoring',
    'flypath_accompaniment',
    'guide',
    'school_comparator',
    'contact_form',
    'registration',
    'manual',
    'other'
  ));

ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_latest_source_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_latest_source_check
  CHECK (latest_source IN (
    'newsletter',
    'home_newsletter',
    'career_planner',
    'preppl',
    'aerocomms',
    'mentoring',
    'flypath_accompaniment',
    'guide',
    'school_comparator',
    'contact_form',
    'registration',
    'manual',
    'other'
  ));

ALTER TABLE public.email_subscriptions DROP CONSTRAINT IF EXISTS email_subscriptions_list_key_check;
ALTER TABLE public.email_subscriptions ADD CONSTRAINT email_subscriptions_list_key_check
  CHECK (list_key IN (
    'newsletter',
    'home_newsletter',
    'career_planner',
    'preppl',
    'aerocomms',
    'mentoring',
    'general_marketing'
  ));

ALTER TABLE public.email_subscriptions DROP CONSTRAINT IF EXISTS email_subscriptions_source_check;
ALTER TABLE public.email_subscriptions ADD CONSTRAINT email_subscriptions_source_check
  CHECK (source IN (
    'newsletter',
    'home_newsletter',
    'career_planner',
    'preppl',
    'aerocomms',
    'mentoring',
    'flypath_accompaniment',
    'guide',
    'school_comparator',
    'contact_form',
    'registration',
    'manual',
    'other'
  ));

COMMIT;
