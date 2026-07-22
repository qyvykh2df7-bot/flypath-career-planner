-- =============================================================================
-- FlyPath Phase 10G: align legacy AeroComms Pro grace grants
-- The preceding grace-period fix corrected subscriptions already marked
-- past_due. Align their non-revoked entitlement grants to the same window.
-- =============================================================================

BEGIN;

UPDATE public.entitlement_grants AS entitlement_grant
  SET status = 'active',
      starts_at = LEAST(entitlement_grant.starts_at, subscription.grace_period_ends_at),
      ends_at = subscription.grace_period_ends_at,
      revoked_at = NULL,
      revocation_reason = NULL
FROM public.subscriptions AS subscription
JOIN public.entitlements AS entitlement
  ON entitlement.entitlement_key = 'aerocomms_pro'
WHERE entitlement_grant.subscription_id = subscription.id
  AND entitlement_grant.entitlement_id = entitlement.id
  AND entitlement_grant.status <> 'revoked'
  AND subscription.status = 'past_due'
  AND subscription.grace_period_ends_at IS NOT NULL
  AND entitlement_grant.ends_at IS DISTINCT FROM subscription.grace_period_ends_at;

COMMIT;
