-- Tüm uygulama domain state'i workspace bazlı JSON doküman olarak Postgres'te.
-- Auth JWT cihazda kalır; finansal/onboarding veri AsyncStorage'dan buraya taşınır.

alter table public.users
  add column if not exists display_name text,
  add column if not exists age integer;

create table if not exists public.workspace_docs (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  doc_key text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (workspace_id, doc_key),
  constraint workspace_docs_key_check check (
    doc_key in (
      'onboarding',
      'finance',
      'cards',
      'investments',
      'goals',
      'assets',
      'notification_prefs',
      'notifications',
      'profile'
    )
  )
);

create index if not exists workspace_docs_updated_idx
  on public.workspace_docs (updated_at desc);

create or replace function public.touch_workspace_docs()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists workspace_docs_touch on public.workspace_docs;
create trigger workspace_docs_touch
  before update on public.workspace_docs
  for each row execute function public.touch_workspace_docs();
