-- ============================================================
-- SCHEMA COMPLETO PARA SUPABASE - Reconectar
-- Rode isso no SQL Editor do Supabase (Project > SQL Editor > New query)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Profiles (extensão de auth.users)
-- ------------------------------------------------------------
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  photo_url text,
  role text default 'user' check (role in ('user', 'admin')),
  premium boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper: verifica se o usuário logado é admin (security definer p/ evitar recursão de RLS)
create function public.is_admin()
returns boolean as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$ language sql security definer stable;

-- ------------------------------------------------------------
-- 2. Products
-- ------------------------------------------------------------
create table public.products (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  cover_image text,
  type text, -- ex: 'diario', 'ebook', 'curso'
  category text, -- nome da categoria (ex: 'Bienestar y autoestima')
  is_free boolean default false,
  published boolean default true,
  featured boolean default false,
  hotmart_product_id text,
  price numeric,
  checkout_url text, -- link de pago do produto na Hotmart
  sales_copy text,   -- texto de venda mostrado a quem ainda não comprou
  journal_sections jsonb default '[]', -- [{id, title, fields: [{id, label, type}]}]
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 3. Modules
-- ------------------------------------------------------------
create table public.modules (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade,
  title text not null,
  description text,
  "order" integer default 0,
  video_url text,
  audio_url text,
  duration_minutes integer,
  materials jsonb default '[]', -- [{name, url, is_printable}]
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 4. Access
-- ------------------------------------------------------------
create table public.access (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  active boolean default true,
  hotmart_transaction_id text,
  granted_at timestamptz default now(),
  unique(user_id, product_id)
);

-- ------------------------------------------------------------
-- 5. Progress
-- ------------------------------------------------------------
create table public.progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  module_id uuid references public.modules(id) on delete cascade,
  completed boolean default false,
  updated_at timestamptz default now(),
  unique(user_id, module_id)
);

-- ------------------------------------------------------------
-- 6. Favorites
-- ------------------------------------------------------------
create table public.favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

-- ------------------------------------------------------------
-- 7. Reviews
-- ------------------------------------------------------------
create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  rating integer check (rating between 1 and 5),
  comment text,
  user_name text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 8. AppSettings
-- ------------------------------------------------------------
create table public.app_settings (
  id uuid default gen_random_uuid() primary key,
  welcome_message text,
  hotmart_link text,
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 9. Categories
-- ------------------------------------------------------------
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null unique
);

-- ------------------------------------------------------------
-- 10. Quiz estático
-- ------------------------------------------------------------
create table public.quiz_results (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  answers jsonb,
  recommended_category text,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 11. Daily Quiz (gerado por IA, um por dia)
-- ------------------------------------------------------------
create table public.daily_quizzes (
  id uuid default gen_random_uuid() primary key,
  date date not null unique,
  title text,
  intro text,
  questions jsonb, -- [{pregunta, opciones: [{texto, perfil}]}]
  perfiles jsonb,  -- [{nombre, mensaje, recomendacion}]
  created_at timestamptz default now()
);

create table public.daily_quiz_results (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  quiz_date date not null,
  quiz_title text,
  profile_name text,
  message text,
  recommendation text,
  created_at timestamptz default now(),
  unique(user_id, quiz_date)
);

-- ------------------------------------------------------------
-- 12. Journal Entries
-- ------------------------------------------------------------
create table public.journal_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  date date not null,
  answers jsonb default '[]', -- [{field_id, value}]
  created_at timestamptz default now(),
  unique(user_id, product_id, date)
);

-- ------------------------------------------------------------
-- 13. Reading Progress
-- ------------------------------------------------------------
create table public.reading_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  material_url text not null,
  last_page integer default 1,
  total_pages integer,
  updated_at timestamptz default now(),
  unique(user_id, material_url)
);

-- ------------------------------------------------------------
-- 14. Alma - conversas com o agente de IA
-- ------------------------------------------------------------
create table public.alma_conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text default 'Nueva conversación',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.alma_messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.alma_conversations(id) on delete cascade,
  role text check (role in ('user', 'assistant')),
  content text,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 15. Pending Purchases (compra na Hotmart antes do cadastro)
-- ------------------------------------------------------------
create table public.pending_purchases (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  product_id uuid references public.products(id) on delete cascade,
  hotmart_transaction_id text,
  created_at timestamptz default now(),
  unique(email, product_id)
);

-- Ao criar o perfil, libera as compras pendentes do mesmo e-mail
create function public.claim_pending_purchases()
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

create trigger on_profile_created_claim_purchases
  after insert on public.profiles
  for each row execute procedure public.claim_pending_purchases();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.modules enable row level security;
alter table public.access enable row level security;
alter table public.progress enable row level security;
alter table public.favorites enable row level security;
alter table public.reviews enable row level security;
alter table public.app_settings enable row level security;
alter table public.categories enable row level security;
alter table public.quiz_results enable row level security;
alter table public.daily_quizzes enable row level security;
alter table public.daily_quiz_results enable row level security;
alter table public.alma_conversations enable row level security;
alter table public.alma_messages enable row level security;
alter table public.journal_entries enable row level security;
alter table public.reading_progress enable row level security;
alter table public.pending_purchases enable row level security; -- sem policies: só o service role acessa

-- Profiles: cada uma vê/edita só o seu; admin vê todos
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id or public.is_admin());

-- Catálogo: leitura pública
create policy "products_public_read" on public.products for select using (published = true or public.is_admin());
create policy "modules_public_read" on public.modules for select using (true);
create policy "categories_public_read" on public.categories for select using (true);
create policy "daily_quizzes_public_read" on public.daily_quizzes for select using (true);
create policy "app_settings_public_read" on public.app_settings for select using (true);

-- Dados pessoais: só a dona vê/edita
create policy "access_own" on public.access for select using (auth.uid() = user_id or public.is_admin());
create policy "progress_own" on public.progress for all using (auth.uid() = user_id);
create policy "favorites_own" on public.favorites for all using (auth.uid() = user_id);
create policy "reviews_select_approved" on public.reviews for select using (status = 'approved' or auth.uid() = user_id or public.is_admin());
create policy "reviews_insert_own" on public.reviews for insert with check (auth.uid() = user_id);
create policy "quiz_results_own" on public.quiz_results for all using (auth.uid() = user_id);
create policy "daily_quiz_results_own" on public.daily_quiz_results for all using (auth.uid() = user_id);
create policy "alma_conversations_own" on public.alma_conversations for all using (auth.uid() = user_id);
create policy "alma_messages_own" on public.alma_messages for all using (
  exists (select 1 from public.alma_conversations c where c.id = conversation_id and c.user_id = auth.uid())
);
create policy "journal_entries_own" on public.journal_entries for all using (auth.uid() = user_id);
create policy "reading_progress_own" on public.reading_progress for all using (auth.uid() = user_id);

-- Admin: gestão completa do catálogo e moderação
create policy "admin_all_products" on public.products for all using (public.is_admin());
create policy "admin_all_modules" on public.modules for all using (public.is_admin());
create policy "admin_all_categories" on public.categories for all using (public.is_admin());
create policy "admin_all_app_settings" on public.app_settings for all using (public.is_admin());
create policy "admin_manage_reviews" on public.reviews for update using (public.is_admin());
create policy "admin_delete_reviews" on public.reviews for delete using (public.is_admin());
create policy "admin_manage_access" on public.access for all using (public.is_admin());

-- Storage: políticas do bucket "uploads" (crie o bucket público antes)
create policy "uploads_insert_auth" on storage.objects
  for insert to authenticated with check (bucket_id = 'uploads');
create policy "uploads_read_public" on storage.objects
  for select using (bucket_id = 'uploads');
create policy "uploads_update_own" on storage.objects
  for update to authenticated using (bucket_id = 'uploads' and owner = auth.uid());
create policy "uploads_delete_own" on storage.objects
  for delete to authenticated using (bucket_id = 'uploads' and owner = auth.uid());

-- Config inicial
insert into public.app_settings (welcome_message, hotmart_link)
values ('Tu viaje empieza aquí 💗', '');

insert into public.categories (name) values
  ('Relaciones y pareja'),
  ('Bienestar y autoestima'),
  ('Fitness en casa y gimnasio'),
  ('Ingresos extra y nuevas habilidades');
