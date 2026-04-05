-- Idempotent migration for CommunitySafeConnect chat_messages table

create extension if not exists "uuid-ossp";

create table if not exists public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  username text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'chat_messages'
      and policyname = 'Allow public read chat_messages'
  ) then
    create policy "Allow public read chat_messages"
      on public.chat_messages
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
      and tablename = 'chat_messages'
      and policyname = 'Allow public insert chat_messages'
  ) then
    create policy "Allow public insert chat_messages"
      on public.chat_messages
      for insert
      to anon, authenticated
      with check (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end
$$;
