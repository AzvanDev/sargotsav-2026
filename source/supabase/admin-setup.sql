-- Sargotsav admin setup. Paste all of this into Supabase → SQL Editor → New query → Run.
alter table public.admins add column if not exists is_owner boolean not null default false;
alter table public.admins add column if not exists added_at timestamptz not null default now();
alter table public.admins add column if not exists added_by text;
alter table public.admins drop constraint if exists admins_email_format;
alter table public.admins add constraint admins_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

insert into public.admins(email, is_owner, added_by) values ('azvan2073@gmail.com', true, 'setup')
on conflict (email) do update set is_owner = true;

drop policy if exists "admins see own row" on public.admins;
drop policy if exists "admins see admin list" on public.admins;
drop policy if exists "admins add admins" on public.admins;
drop policy if exists "admins remove admins" on public.admins;
create policy "admins see admin list" on public.admins for select to authenticated using ((select public.is_admin()));
create policy "admins add admins" on public.admins for insert to authenticated
  with check ((select public.is_admin()) and is_owner = false);
create policy "admins remove admins" on public.admins for delete to authenticated
  using ((select public.is_admin()) and is_owner = false);
grant insert, delete on public.admins to authenticated;

create table if not exists public.admin_login_attempts (
  id bigint generated always as identity primary key,
  email text not null,
  ip text,
  ok boolean not null,
  at timestamptz not null default now()
);
create index if not exists admin_login_attempts_email_at on public.admin_login_attempts (email, at desc);
create index if not exists admin_login_attempts_ip_at on public.admin_login_attempts (ip, at desc);
alter table public.admin_login_attempts enable row level security;
revoke all on public.admin_login_attempts from anon, authenticated;
