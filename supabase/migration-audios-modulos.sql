-- Migração: vários áudios por módulo
-- Rodar no Supabase: SQL Editor → New query → colar → Run
-- Formato da coluna: [{ "name": "Meditación 2", "url": "https://..." }]

alter table public.modules
  add column if not exists audios jsonb default '[]';
