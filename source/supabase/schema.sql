-- Sargotsav 2026 registrations
create table public.items (
  code text primary key,
  category text not null check (category in ('kids','children','subjunior','junior','teens')),
  name_en text not null,
  name_ml text not null,
  sort int not null default 0
);

create sequence public.reg_no_seq start 1;

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  reg_no text not null unique default ('SGV-' || lpad(nextval('public.reg_no_seq')::text, 4, '0')),
  name text not null check (char_length(name) between 2 and 80),
  dob date not null,
  gender text not null check (gender in ('boy','girl')),
  phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  category text not null check (category in ('kids','children','subjunior','junior','teens')),
  items text[] not null check (cardinality(items) between 1 and 3),
  lang text not null default 'en' check (lang in ('en','ml')),
  created_at timestamptz not null default now()
);
create unique index registrations_person_uniq on public.registrations (phone, lower(btrim(name)), dob);
create index registrations_category_idx on public.registrations (category, gender);
create index registrations_created_idx on public.registrations (created_at desc);

-- organisers who can read the entries (by login email)
create table public.admins (
  email text primary key check (email = lower(email))
);

alter table public.items enable row level security;
alter table public.registrations enable row level security;
alter table public.admins enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.email = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create policy "items are public" on public.items for select to anon, authenticated using (true);
create policy "admins read entries" on public.registrations for select to authenticated using ((select public.is_admin()));
create policy "admins delete entries" on public.registrations for delete to authenticated using ((select public.is_admin()));
create policy "admins see own row" on public.admins for select to authenticated using (email = lower(coalesce(auth.jwt() ->> 'email', '')));

grant select on public.items to anon, authenticated;
grant select, delete on public.registrations to authenticated;
grant select on public.admins to authenticated;
revoke all on public.registrations from anon;

-- category from DOB, counted on 1 June
create or replace function public.category_for(p_dob date) returns text
language sql immutable set search_path = ''
as $$
  select case
    when p_dob >= date '2019-06-01' then 'kids'
    when p_dob >= date '2017-06-01' then 'children'
    when p_dob >= date '2014-06-01' then 'subjunior'
    when p_dob >= date '2011-06-01' then 'junior'
    when p_dob >= date '2006-06-01' then 'teens'
    else null end;
$$;

-- The only way to add an entry. Validates everything server-side.
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
  return json_build_object('reg_no', v_row.reg_no, 'category', v_row.category, 'gender', v_row.gender);
end;
$$;
revoke execute on function public.register_entry(text,date,text,text,text,text[],text) from public;
grant execute on function public.register_entry(text,date,text,text,text,text[],text) to anon, authenticated;
insert into public.items(code,category,name_en,name_ml,sort) values
('kids_story_ml','kids','Storytelling (Malayalam)','കഥാ കഥനം (മലയാളം)',0),
('kids_action_ml','kids','Action Song (Malayalam)','ആംഗ്യപ്പാട്ട് (മലയാളം)',1),
('kids_action_ar','kids','Action Song (Arabic)','ആംഗ്യപ്പാട്ട് (അറബി)',2),
('kids_rhyme_en','kids','Nursery Rhyme (English)','നഴ്സറി റൈം (ഇംഗ്ലീഷ്)',3),
('kids_convsong_ml','kids','Conversational Song (Malayalam)','സംഭാഷണ ഗാനം (മലയാളം)',4),
('kids_speech_ml','kids','Speech (Malayalam)','പ്രസംഗം (മലയാളം)',5),
('kids_coloring','kids','Coloring (Crayon)','കളറിംഗ് (ക്രയോൺ)',6),
('ch_dictation_ar','children','Dictation (Arabic)','കേട്ടെഴുത്ത് (അറബി)',0),
('ch_memory_ar','children','Memory Test (Arabic)','ഓർമ പരിശോധന (അറബി)',1),
('ch_wordbuild_ar','children','Word Building (Arabic)','പദ നിർമാണം (അറബി)',2),
('ch_quiz','children','Quiz','പ്രശ്നോത്തരി',3),
('ch_pencil','children','Pencil Drawing','പെൻസിൽ ഡ്രോയിംഗ്',4),
('ch_story_ar','children','Storytelling (Arabic)','കഥാകഥനം (അറബി)',5),
('ch_tajweed','children','Tajweed','തജ്‌വീദ്',6),
('ch_hifz','children','Hifz','ഹിഫ്ദ്',7),
('ch_speech','children','Speech','പ്രസംഗം',8),
('ch_poem_ar','children','Poem Recitation (Arabic)','പദ്യം ചൊല്ലൽ (അറബി)',9),
('ch_islamicsong','children','Islamic Song','ഇസ്ലാമിക ഗാനം',10),
('sj_wordgame_ar','subjunior','Word Game (Arabic)','പദകേളി (അറബി)',0),
('sj_sentence_ar','subjunior','Sentence Making (Arabic)','വാക്യരചന (അറബി)',1),
('sj_pencil','subjunior','Pencil Drawing','പെൻസിൽ ഡ്രോയിംഗ്',2),
('sj_translation_ml','subjunior','Translation to Malayalam','വിവർത്തനം മലയാളത്തിലേക്ക്',3),
('sj_quiz','subjunior','Quiz','പ്രശ്നോത്തരി',4),
('sj_tajweed','subjunior','Tajweed','തജ്‌വീദ്',5),
('sj_hifz','subjunior','Hifz','ഹിഫ്ദ്',6),
('sj_azan','subjunior','Azan (Call to Prayer)','ബാങ്ക് വിളി',7),
('sj_speech_ml','subjunior','Speech (Malayalam)','പ്രസംഗം (മലയാളം)',8),
('sj_speech_en','subjunior','Speech (English)','പ്രസംഗം (ഇംഗ്ലീഷ്)',9),
('sj_poem_ar','subjunior','Poem Recitation (Arabic)','പദ്യം ചൊല്ലൽ (അറബി)',10),
('sj_mappila','subjunior','Mappilappattu','മാപ്പിളപ്പാട്ട്',11),
('sj_islamicsong_ml','subjunior','Islamic Song (Malayalam)','ഇസ്‌ലാമിക ഗാനം (മലയാളം)',12),
('sj_arabicsong','subjunior','Arabic Song','അറബി ഗാനം',13),
('jr_quiz','junior','Quiz','പ്രശ്നോത്തരി',0),
('jr_essay_ml','junior','Essay Writing (Malayalam)','പ്രബന്ധം (മലയാളം)',1),
('jr_tajweed','junior','Tajweed','തജ്‌വീദ്',2),
('jr_hifz','junior','Hifz','ഹിഫ്ദ്',3),
('jr_speech_ml','junior','Speech (Malayalam)','പ്രസംഗം (മലയാളം)',4),
('jr_poem_ar','junior','Poem Recitation (Arabic)','പദ്യം ചൊല്ലൽ (അറബി)',5),
('jr_photo','junior','Photography (Mobile)','ഫോട്ടോഗ്രാഫി (മൊബൈൽ)',6),
('jr_islamicsong','junior','Islamic Song','ഇസ്ലാമിക ഗാനം',7),
('jr_mappila','junior','Mappilappattu','മാപ്പിളപ്പാട്ട്',8),
('jr_arabicsong','junior','Arabic Song','അറബി ഗാനം',9),
('jr_reel','junior','Reel Making','റീൽ നിർമാണം',10),
('tn_essay_ml','teens','Essay Writing (Malayalam)','പ്രബന്ധം (മലയാളം)',0),
('tn_essay_ar','teens','Essay Writing (Arabic)','പ്രബന്ധം (അറബി)',1),
('tn_story_ml','teens','Story Writing (Malayalam)','കഥാരചന (മലയാളം)',2),
('tn_poetry_ml','teens','Poetry Writing (Malayalam)','കവിത രചന (മലയാളം)',3),
('tn_tajweed','teens','Tajweed','തജ്‌വീദ്',4),
('tn_speech_ml','teens','Speech (Malayalam)','പ്രസംഗം (മലയാളം)',5),
('tn_islamicsong','teens','Islamic Song','ഇസ്ലാമിക ഗാനം',6),
('tn_reel','teens','Reel Making','റീൽ നിർമാണം',7),
('tn_photo','teens','Photography (Mobile)','ഫോട്ടോഗ്രാഫി (മൊബൈൽ)',8),
('tn_poster','teens','Digital Poster Making','ഡിജിറ്റൽ പോസ്റ്റർ നിർമാണം',9),
('tn_calligraphy_ar','teens','Calligraphy (Arabic)','കാലിഗ്രാഫി അറബിക്',10);
