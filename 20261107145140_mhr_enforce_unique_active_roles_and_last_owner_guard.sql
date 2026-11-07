-- Prevent duplicate active assignments for the same user, role and site.
create unique index if not exists mhr_role_assignments_one_active_assignment_uidx
on public.mhr_role_assignments (user_id, role_code, coalesce(site_id, ''))
where is_active;

-- Protect the final active system-owner assignment even when updates bypass the UI.
create or replace function mhr_private.guard_last_active_system_owner()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, mhr_private
as $function$
declare
  v_remaining integer;
  v_removing_owner boolean := false;
begin
  if tg_op = 'DELETE' then
    v_removing_owner := old.role_code = 'system_owner' and old.is_active;
  else
    v_removing_owner := old.role_code = 'system_owner'
      and old.is_active
      and (new.role_code <> 'system_owner' or not new.is_active);
  end if;

  if v_removing_owner then
    perform pg_advisory_xact_lock(hashtext('mhr:last_active_system_owner')::bigint);
    select count(*) into v_remaining
    from public.mhr_role_assignments
    where role_code = 'system_owner'
      and is_active
      and id <> old.id;

    if v_remaining = 0 then
      raise exception 'Cannot deactivate or delete the last active system owner';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$function$;


drop trigger if exists mhr_guard_last_active_system_owner on public.mhr_role_assignments;
create trigger mhr_guard_last_active_system_owner
before update of role_code, is_active or delete
on public.mhr_role_assignments
for each row
execute function mhr_private.guard_last_active_system_owner();
