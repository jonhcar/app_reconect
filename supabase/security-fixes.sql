-- ============================================================
-- CORREÇÕES DE SEGURANÇA — Reconectar
-- Rodar no SQL Editor do Supabase (New query → colar tudo → Run)
-- Fecha: escalada de privilégio, vazamento de conteúdo pago,
-- burla de moderação de reseñas.
-- ============================================================

-- ------------------------------------------------------------
-- FIX 1 (CRÍTICO): impedir que a usuária vire admin/premium sozinha
-- Hoje qualquer usuária logada pode alterar o PRÓPRIO perfil e setar
-- role='admin' / premium=true direto pela API (a policy de UPDATE não
-- restringe as colunas). Este trigger só deixa MUDAR role/premium quem
-- já é admin — a usuária comum continua podendo editar nome e foto.
-- ------------------------------------------------------------
create or replace function public.prevent_privilege_escalation()
returns trigger as $$
begin
  if (new.role is distinct from old.role
      or new.premium is distinct from old.premium)
     and not public.is_admin() then
    raise exception 'No autorizado a cambiar role/premium';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists profiles_no_priv_escalation on public.profiles;
create trigger profiles_no_priv_escalation
  before update on public.profiles
  for each row execute procedure public.prevent_privilege_escalation();

-- ------------------------------------------------------------
-- FIX 2 (ALTO): não expor os conteúdos pagos a quem não comprou
-- Hoje "modules_public_read using (true)" deixa QUALQUER pessoa ler a
-- tabela modules e pegar as URLs de vídeo/áudio/PDF de TODOS os produtos,
-- inclusive os pagos. Trocamos por uma regra que só libera os módulos de:
-- produtos gratuitos, produtos que a usuária comprou (access), premium,
-- ou admin.
-- ------------------------------------------------------------
drop policy if exists "modules_public_read" on public.modules;
create policy "modules_read_if_access" on public.modules for select using (
  public.is_admin()
  or exists (
    select 1 from public.products p
    where p.id = modules.product_id and p.is_free = true
  )
  or exists (
    select 1 from public.access a
    where a.product_id = modules.product_id
      and a.user_id = auth.uid()
      and a.active = true
  )
  or exists (
    select 1 from public.profiles pr
    where pr.id = auth.uid() and pr.premium = true
  )
);

-- ------------------------------------------------------------
-- FIX 3 (MÉDIO): reseñas entram sempre como "pending" (moderação)
-- Hoje a usuária pode inserir uma reseña já com status='approved' e
-- publicá-la sem passar por você. Forçamos status='pending' na inserção.
-- ------------------------------------------------------------
drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews for insert
  with check (auth.uid() = user_id and status = 'pending');
