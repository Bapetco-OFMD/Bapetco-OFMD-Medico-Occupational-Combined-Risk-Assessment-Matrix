-- OMHSQ database schema (run in Supabase SQL Editor)
-- IMPORTANT: review this schema and privacy notice with your organization's
-- data-protection / legal / clinical governance leads before real-world use.

create extension if not exists pgcrypto;

create table if not exists public.omhsq_user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('worker','professional','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.omhsq_support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  consent boolean not null check (consent = true),
  consent_version text not null,
  domains text[] not null default '{}',
  help_request text not null check (help_request in ('yes','no','information')),
  urgent_safety text not null check (urgent_safety in ('yes','no','prefer_not')),
  optional_note text,
  status text not null default 'new' check (status in ('new','contacted','referred','closed')),
  language text not null default 'ar' check (language in ('ar','en'))
);

create index if not exists omhsq_support_requests_user_created_idx
  on public.omhsq_support_requests(user_id, created_at desc);
create index if not exists omhsq_support_requests_created_idx
  on public.omhsq_support_requests(created_at desc);

alter table public.omhsq_user_roles enable row level security;
alter table public.omhsq_support_requests enable row level security;

-- Helper function avoids recursive role-table policy evaluation.
create or replace function public.omhsq_is_authorized_professional()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.omhsq_user_roles r
    where r.user_id = auth.uid()
      and r.role in ('professional','admin')
  );
$$;

revoke all on function public.omhsq_is_authorized_professional() from public;
grant execute on function public.omhsq_is_authorized_professional() to authenticated;

drop policy if exists "users read own role" on public.omhsq_user_roles;
create policy "users read own role"
on public.omhsq_user_roles for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "workers insert own support request" on public.omhsq_support_requests;
create policy "workers insert own support request"
on public.omhsq_support_requests for insert
to authenticated
with check (user_id = auth.uid() and consent = true);

drop policy if exists "workers read own support requests" on public.omhsq_support_requests;
create policy "workers read own support requests"
on public.omhsq_support_requests for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "authorized professionals read support requests" on public.omhsq_support_requests;
create policy "authorized professionals read support requests"
on public.omhsq_support_requests for select
to authenticated
using (public.omhsq_is_authorized_professional());

-- Deliberately no browser-side policy to create roles or update/delete requests.
-- Assign the first professional/admin manually in SQL Editor after creating that account:
-- insert into public.omhsq_user_roles (user_id, role)
-- select id, 'admin' from auth.users where email = 'YOUR_ADMIN_EMAIL';
--
-- Never grant admin by accepting a role from the public signup form.
