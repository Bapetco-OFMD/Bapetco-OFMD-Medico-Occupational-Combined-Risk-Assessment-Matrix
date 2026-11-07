-- Medical records are visible to the worker concerned and authorized clinical roles.
-- System ownership grants operational administration, not automatic clinical access.

create or replace function mhr_private.can_access_medical_case(p_case uuid)
returns boolean
language sql
stable
security definer
set search_path to 'pg_catalog', 'public', 'mhr_private'
as $function$
  select exists (
    select 1
    from public.mhr_cases c
    where c.id = p_case
      and (
        c.worker_user_id = (select auth.uid())
        or mhr_private.has_role('site_doctor', c.site_id)
        or mhr_private.has_role('review_doctor')
        or mhr_private.has_role('occupational_health_responsible')
      )
  );
$function$;

-- Worker-owned profile writes remain possible; site doctors retain clinical update access.
drop policy if exists mhr_medical_profile_insert on public.mhr_worker_medical_profiles;
create policy mhr_medical_profile_insert
on public.mhr_worker_medical_profiles
for insert to authenticated
with check (
  exists (
    select 1
    from public.mhr_worker_records w
    where w.id = mhr_worker_medical_profiles.worker_record_id
      and (
        w.worker_user_id = (select auth.uid())
        or mhr_private.has_role('site_doctor', w.site_id)
      )
  )
);

drop policy if exists mhr_medical_profile_select on public.mhr_worker_medical_profiles;
create policy mhr_medical_profile_select
on public.mhr_worker_medical_profiles
for select to authenticated
using (
  exists (
    select 1
    from public.mhr_worker_records w
    where w.id = mhr_worker_medical_profiles.worker_record_id
      and (
        w.worker_user_id = (select auth.uid())
        or mhr_private.has_role('site_doctor', w.site_id)
        or mhr_private.has_role('review_doctor')
        or mhr_private.has_role('occupational_health_responsible')
      )
  )
);

drop policy if exists mhr_medical_profile_update on public.mhr_worker_medical_profiles;
create policy mhr_medical_profile_update
on public.mhr_worker_medical_profiles
for update to authenticated
using (
  exists (
    select 1
    from public.mhr_worker_records w
    where w.id = mhr_worker_medical_profiles.worker_record_id
      and (
        mhr_private.has_role('site_doctor', w.site_id)
        or (
          w.worker_user_id = (select auth.uid())
          and not exists (
            select 1
            from public.mhr_cases c
            where c.worker_record_id = w.id
              and c.workflow_status in ('submitted', 'parallel_review', 'central_review')
              and c.locked_at is not null
          )
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.mhr_worker_records w
    where w.id = mhr_worker_medical_profiles.worker_record_id
      and (
        mhr_private.has_role('site_doctor', w.site_id)
        or (
          w.worker_user_id = (select auth.uid())
          and not exists (
            select 1
            from public.mhr_cases c
            where c.worker_record_id = w.id
              and c.workflow_status in ('submitted', 'parallel_review', 'central_review')
              and c.locked_at is not null
          )
        )
      )
  )
);
