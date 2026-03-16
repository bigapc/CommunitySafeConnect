-- Idempotent migration for CommunitySafeConnect reports table

create extension if not exists "uuid-ossp";

create table if not exists public.reports (
  id uuid primary key default uuid_generate_v4(),
  description text,
  created_at timestamptz not null default now()
);

alter table public.reports
  add column if not exists id uuid default uuid_generate_v4();

alter table public.reports
  add column if not exists description text;

alter table public.reports
  add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reports_pkey'
      and conrelid = 'public.reports'::regclass
  ) then
    alter table public.reports
      add constraint reports_pkey primary key (id);
  end if;
end
$$;

alter table public.reports enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'reports'
      and policyname = 'Allow public read reports'
  ) then
    create policy "Allow public read reports"
      on public.reports
      for select
      to anon, authenticated
      using (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'reports'
      and policyname = 'Allow public insert reports'
  ) then
    create policy "Allow public insert reports"
      on public.reports
      for insert
      to anon, authenticated
      with check (true);
  end if;
end
$$;
