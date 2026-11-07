-- Structural regression checks for clinical-data role boundaries.
-- Run with psql or the Supabase SQL editor; no pgTAP extension is required.
begin;
do $test$
declare
  v_helper text;
  v_policy_count integer;
  v_policy_ok boolean;
  v_rls boolean;
  v_medical_review_policy text;
  v_central_review_policy text;
begin
  select pg_get_functiondef('mhr_private.can_access_medical_case(uuid)'::regprocedure)
    into v_helper;
  if position('system_owner' in v_helper) > 0 then
    raise exception 'FAIL: medical-case helper grants system_owner access';
  end if;

  select relrowsecurity into v_rls
  from pg_class where oid = 'public.mhr_worker_medical_profiles'::regclass;
  if not coalesce(v_rls, false) then
    raise exception 'FAIL: worker medical profile RLS is not enabled';
  end if;

  select count(*), bool_and(
    position('system_owner' in coalesce(qual, '') || coalesce(with_check, '')) = 0
  ) into v_policy_count, v_policy_ok
  from pg_policies
  where schemaname = 'public'
    and tablename = 'mhr_worker_medical_profiles'
    and policyname in ('mhr_medical_profile_insert', 'mhr_medical_profile_select', 'mhr_medical_profile_update');
  if v_policy_count <> 3 or not coalesce(v_policy_ok, false) then
    raise exception 'FAIL: medical profile policies are missing or grant system_owner access';
  end if;

  select qual into v_medical_review_policy
  from pg_policies where schemaname='public' and tablename='mhr_medical_reviews' and policyname='mhr_medical_reviews_select';
  select qual into v_central_review_policy
  from pg_policies where schemaname='public' and tablename='mhr_central_reviews' and policyname='mhr_central_reviews_select';
  if position('mhr_private.can_access_medical_case(case_id)' in coalesce(v_medical_review_policy, '')) = 0
     or position('mhr_private.can_access_medical_case(case_id)' in coalesce(v_central_review_policy, '')) = 0 then
    raise exception 'FAIL: medical review tables are not using the restricted medical-case helper';
  end if;
end
$test$;
rollback;
