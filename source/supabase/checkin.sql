-- Sargotsav check-in + emailed pass. Run after schema.sql and admin-setup.sql
-- (Supabase → SQL Editor → New query → paste → Run). Safe to run again.

-- 1. Each registration gets a secret, unguessable token. The QR on the pass carries only this
--    token (never the name, phone or date of birth). Knowing a reg. no. is not enough to open a pass.
alter table public.registrations
  add column if not exists checkin_token text not null unique
    default replace(replace(encode(extensions.gen_random_bytes(18), 'base64'), '+', '-'), '/', '_'),
  add column if not exists checked_in_at timestamptz,
  add column if not exists checked_in_by text,
  add column if not exists email_sent_at timestamptz,
  add column if not exists email_sends int not null default 0,
  add column if not exists email_error text;

-- 2. register_entry also hands back the token, so the form can draw the QR and ask for the email.
create or replace function public.register_entry(
  p_name text, p_dob date, p_gender text, p_phone text, p_email text, p_items text[], p_lang text default 'en'
) returns json
language plpgsql security definer set search_path = ''
as $$
declare
  v_phone text := right(regexp_replace(coalesce(p_phone,''), '\D', '', 'g'), 10);
  v_name text := regexp_replace(btrim(coalesce(p_name,'')), '\s+', ' ', 'g');
  v_email text := lower(btrim(coalesce(p_email,'')));
  v_cat text := public.category_for(p_dob);
  v_items text[];
  v_row public.registrations;
begin
  if now() > timestamptz '2026-11-14 23:59:59+05:30' then
    raise exception 'closed' using errcode = 'P0001';
  end if;
  if v_cat is null or p_dob > current_date then
    raise exception 'age' using errcode = 'P0001';
  end if;
  select array_agg(distinct x) into v_items from unnest(coalesce(p_items, '{}')) x;
  if v_items is null or cardinality(v_items) not between 1 and 3 then
    raise exception 'items_count' using errcode = 'P0001';
  end if;
  if exists (select 1 from unnest(v_items) x where not exists
      (select 1 from public.items i where i.code = x and i.category = v_cat)) then
    raise exception 'items_category' using errcode = 'P0001';
  end if;
  begin
    insert into public.registrations (name, dob, gender, phone, email, category, items, lang)
    values (v_name, p_dob, p_gender, v_phone, v_email, v_cat, v_items,
            case when p_lang = 'ml' then 'ml' else 'en' end)
    returning * into v_row;
  exception
    when unique_violation then raise exception 'duplicate' using errcode = 'P0001';
    when check_violation then raise exception 'invalid' using errcode = 'P0001';
  end;
  return json_build_object('reg_no', v_row.reg_no, 'category', v_row.category, 'gender', v_row.gender,
                           'token', v_row.checkin_token);
end;
$$;
revoke execute on function public.register_entry(text,date,text,text,text,text[],text) from public;
grant execute on function public.register_entry(text,date,text,text,text,text[],text) to anon, authenticated;

-- 3. Open a pass from its token (the "Open your pass" link in the email). No phone, email or DOB.
create or replace function public.get_pass(p_token text) returns json
language sql stable security definer set search_path = ''
as $$
  select json_build_object('reg_no', r.reg_no, 'name', r.name, 'category', r.category, 'gender', r.gender,
                           'items', r.items, 'lang', r.lang, 'token', r.checkin_token,
                           'checked_in', r.checked_in_at is not null)
  from public.registrations r
  where length(coalesce(p_token,'')) >= 20 and r.checkin_token = p_token;
$$;
revoke execute on function public.get_pass(text) from public;
grant execute on function public.get_pass(text) to anon, authenticated;

-- 4. Admin scanner: look up a contestant from a scanned token, or from a typed reg. no.
create or replace function public.checkin_lookup(p_code text) returns json
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_code text := btrim(coalesce(p_code,''));
  v_row public.registrations;
begin
  if not public.is_admin() then raise exception 'not_admin' using errcode = 'P0001'; end if;
  if v_code ~* '^(SGV-?)?[0-9]{1,5}$' then
    select * into v_row from public.registrations
    where reg_no = 'SGV-' || lpad(regexp_replace(v_code, '\D', '', 'g')::int::text, 4, '0');
  else
    select * into v_row from public.registrations where checkin_token = v_code;
  end if;
  if v_row.id is null then return null; end if;
  return json_build_object('id', v_row.id, 'reg_no', v_row.reg_no, 'name', v_row.name, 'dob', v_row.dob,
    'gender', v_row.gender, 'phone', v_row.phone, 'category', v_row.category, 'items', v_row.items,
    'checked_in_at', v_row.checked_in_at, 'checked_in_by', v_row.checked_in_by,
    'by_token', v_row.checkin_token = v_code);
end;
$$;

-- 5. Admin scanner: mark present (or undo a mistake). Marking twice keeps the first time.
create or replace function public.checkin_mark(p_id uuid, p_undo boolean default false) returns json
language plpgsql security definer set search_path = ''
as $$
declare
  v_me text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_row public.registrations;
  v_already boolean;
begin
  if not public.is_admin() then raise exception 'not_admin' using errcode = 'P0001'; end if;
  select checked_in_at is not null into v_already from public.registrations where id = p_id;
  if v_already is null then raise exception 'not_found' using errcode = 'P0001'; end if;
  if p_undo then
    update public.registrations set checked_in_at = null, checked_in_by = null where id = p_id returning * into v_row;
  else
    update public.registrations set checked_in_at = coalesce(checked_in_at, now()),
      checked_in_by = coalesce(checked_in_by, v_me) where id = p_id returning * into v_row;
  end if;
  return json_build_object('id', v_row.id, 'reg_no', v_row.reg_no, 'checked_in_at', v_row.checked_in_at,
    'checked_in_by', v_row.checked_in_by, 'already', v_already and not p_undo);
end;
$$;

revoke execute on function public.checkin_lookup(text) from public, anon;
revoke execute on function public.checkin_mark(uuid, boolean) from public, anon;
grant execute on function public.checkin_lookup(text) to authenticated;
grant execute on function public.checkin_mark(uuid, boolean) to authenticated;

create index if not exists registrations_checked_in_idx on public.registrations (checked_in_at);
