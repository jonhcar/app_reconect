-- ============================================================
-- MIGRAÇÃO: vendas por produto (rodar no SQL Editor do Supabase)
-- Cada produto passa a ter seu próprio link de checkout e copy
-- de vendas; compras feitas antes do cadastro ficam pendentes
-- e são liberadas automaticamente quando a pessoa se cadastra.
-- ============================================================

-- 1. Novas colunas em products
alter table public.products add column if not exists checkout_url text;
alter table public.products add column if not exists sales_copy text;

-- 2. Compras pendentes (compra na Hotmart antes de criar conta no app)
create table if not exists public.pending_purchases (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  product_id uuid references public.products(id) on delete cascade,
  hotmart_transaction_id text,
  created_at timestamptz default now(),
  unique(email, product_id)
);

-- Só o back-end (service role) acessa; nenhuma policy pública
alter table public.pending_purchases enable row level security;

-- 3. Ao criar o perfil, libera as compras pendentes do mesmo e-mail
create or replace function public.claim_pending_purchases()
returns trigger as $$
begin
  insert into public.access (user_id, product_id, active, hotmart_transaction_id)
  select new.id, pp.product_id, true, pp.hotmart_transaction_id
  from public.pending_purchases pp
  where lower(pp.email) = lower(new.email)
  on conflict (user_id, product_id)
  do update set active = true;

  delete from public.pending_purchases where lower(email) = lower(new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_profile_created_claim_purchases on public.profiles;
create trigger on_profile_created_claim_purchases
  after insert on public.profiles
  for each row execute procedure public.claim_pending_purchases();
