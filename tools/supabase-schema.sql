-- =========================================================================
-- CashAuto — databáze pro ostrý provoz (Supabase / PostgreSQL)
-- Spusťte JEDNOU celé v Supabase → SQL Editor. Postup: tools/OSTRY-PROVOZ.md
--
-- Co to dělá:
--   profiles  … profil každého účtu; role 'client' nebo 'staff'
--   cases     … případy (žádosti z webu a celá CRM pipeline)
--   pravidla (RLS): klient vidí jen svůj profil a své případy (podle potvrzeného e-mailu),
--                   správce vidí a mění vše, nepřihlášený smí jen podat žádost.
--   Roli 'staff' nejde nastavit z webu — jen zde v SQL Editoru (viz konec souboru).
-- =========================================================================

-- ---------- profily ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  name       text not null default '',
  company    text not null default '',
  ico        text not null default '',
  phone      text not null default '',
  role       text not null default 'client' check (role in ('client', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'staff');
$$;

drop policy if exists "profil cteni" on public.profiles;
create policy "profil cteni" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff());
drop policy if exists "profil zalozeni" on public.profiles;
create policy "profil zalozeni" on public.profiles for insert to authenticated
  with check (id = auth.uid() and role = 'client');
drop policy if exists "profil uprava" on public.profiles;
create policy "profil uprava" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Z webu (role anon / authenticated) nejde změnit roli, id ani e-mail profilu.
create or replace function public.profiles_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') then
    new.role := old.role;
    new.id := old.id;
    new.email := old.email;
  end if;
  new.ico := left(regexp_replace(coalesce(new.ico, ''), '\D', '', 'g'), 8);
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.profiles_guard();

-- Profil se založí sám při registraci (údaje z registračního formuláře).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, company, ico, phone)
  values (
    new.id, new.email,
    left(coalesce(new.raw_user_meta_data ->> 'name', ''), 120),
    left(coalesce(new.raw_user_meta_data ->> 'company', ''), 160),
    left(regexp_replace(coalesce(new.raw_user_meta_data ->> 'ico', ''), '\D', '', 'g'), 8),
    left(coalesce(new.raw_user_meta_data ->> 'phone', ''), 30)
  )
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- případy ----------
create sequence if not exists public.case_seq start 6000;
create table if not exists public.cases (
  id         text primary key default ('AK-' || nextval('public.case_seq')),
  stage      text not null default 'lead' check (stage in ('lead', 'call', 'scoring', 'technik', 'approval', 'insurance', 'done')),
  position   integer not null default 0,
  line       text not null default 'auto' check (line in ('auto', 'agro', 'tech')),
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cases_stage_idx on public.cases (stage, position);
create index if not exists cases_email_idx on public.cases (lower(data ->> 'email'));
alter table public.cases enable row level security;

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;
drop trigger if exists cases_touch on public.cases;
create trigger cases_touch before update on public.cases
  for each row execute function public.touch_updated_at();

drop policy if exists "pripady spravce" on public.cases;
create policy "pripady spravce" on public.cases for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
drop policy if exists "pripady klient cte sve" on public.cases;
create policy "pripady klient cte sve" on public.cases for select to authenticated
  using (lower(data ->> 'email') = lower(auth.jwt() ->> 'email'));
-- Žádost z webu: kdokoliv smí VLOŽIT nový případ do fáze „lead“ (číst ho už nesmí).
drop policy if exists "pripady zadost z webu" on public.cases;
create policy "pripady zadost z webu" on public.cases for insert to anon, authenticated
  with check (stage = 'lead' and position = 0 and pg_column_size(data) < 20000);
grant usage on sequence public.case_seq to anon, authenticated;

-- =========================================================================
-- PRVNÍ SPRÁVCE: nejdřív si na webu založte běžný účet (prihlaseni.html → Nový účet),
-- potvrďte e-mail a pak zde spusťte (se svým e-mailem):
--
--   update public.profiles set role = 'staff' where email = 'vas@email.cz';
--
-- Odebrání práv správce:
--   update public.profiles set role = 'client' where email = 'vas@email.cz';
-- =========================================================================
