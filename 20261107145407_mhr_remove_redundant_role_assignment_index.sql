-- The schema already has mhr_role_assignments_unique_active with the same definition.
-- Keep the original index and remove the duplicate introduced during hardening.
drop index if exists public.mhr_role_assignments_one_active_assignment_uidx;
