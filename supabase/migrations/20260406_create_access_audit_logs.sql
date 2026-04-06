-- Access audit log storage for session and policy actions

create extension if not exists "uuid-ossp";

create table if not exists public.access_audit_logs (
  id uuid primary key default uuid_generate_v4(),
  action text not null,
  scope text not null,
  retention_mode text not null,
  retained_until timestamptz,
  request_path text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.access_audit_logs
  add column if not exists id uuid default uuid_generate_v4();

alter table public.access_audit_logs
  add column if not exists action text;

alter table public.access_audit_logs
  add column if not exists scope text;

alter table public.access_audit_logs
  add column if not exists retention_mode text;

alter table public.access_audit_logs
  add column if not exists retained_until timestamptz;

alter table public.access_audit_logs
  add column if not exists request_path text;

alter table public.access_audit_logs
  add column if not exists ip_address text;

alter table public.access_audit_logs
  add column if not exists user_agent text;

alter table public.access_audit_logs
  add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'access_audit_logs_pkey'
      and conrelid = 'public.access_audit_logs'::regclass
  ) then
    alter table public.access_audit_logs
      add constraint access_audit_logs_pkey primary key (id);
  end if;
end
$$;

alter table public.access_audit_logs
  alter column action set not null;

alter table public.access_audit_logs
  alter column scope set not null;

alter table public.access_audit_logs
  alter column retention_mode set not null;

alter table public.access_audit_logs enable row level security;
