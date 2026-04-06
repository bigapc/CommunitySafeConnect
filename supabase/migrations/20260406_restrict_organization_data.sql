-- Restrict CommunitySafeConnect data to server-side access paths

do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'reports'
      and policyname = 'Allow public read reports'
  ) then
    drop policy "Allow public read reports" on public.reports;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'reports'
      and policyname = 'Allow public insert reports'
  ) then
    drop policy "Allow public insert reports" on public.reports;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'chat_messages'
      and policyname = 'Allow public read chat_messages'
  ) then
    drop policy "Allow public read chat_messages" on public.chat_messages;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'chat_messages'
      and policyname = 'Allow public insert chat_messages'
  ) then
    drop policy "Allow public insert chat_messages" on public.chat_messages;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime drop table public.chat_messages;
  end if;
end
$$;