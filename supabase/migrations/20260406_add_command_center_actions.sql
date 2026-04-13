-- Command center moderation metadata

alter table public.reports
  add column if not exists reviewed boolean not null default false;

alter table public.reports
  add column if not exists reviewed_at timestamptz;

alter table public.reports
  add column if not exists reviewed_by text;

alter table public.chat_messages
  add column if not exists flagged boolean not null default false;

alter table public.chat_messages
  add column if not exists flagged_at timestamptz;

alter table public.chat_messages
  add column if not exists flagged_reason text;

alter table public.chat_messages
  add column if not exists flagged_by text;