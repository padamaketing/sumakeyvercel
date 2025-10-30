SELECT
  to_regclass('public.businesses')  AS businesses,
  to_regclass('public.clients')     AS clients,
  to_regclass('public.memberships') AS memberships,
  to_regclass('public.scans')       AS scans;