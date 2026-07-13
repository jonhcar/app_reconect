# Reconectar — contexto do projeto

App de membresía freemium (interface em espanhol, mobile-first) para conteúdos de bem-estar emocional. Dono: João (jonhnetia@gmail.com) — **iniciante**: responder em pt-BR, passo a passo prático, um bloco por vez, custo zero (só planos free).

## Stack
React (Vite) + Tailwind · Supabase (banco/auth/storage) · Netlify (hosting + functions) · Hotmart (pagamentos via webhook) · Resend (e-mail) · Anthropic (IA, **desativada** via `VITE_ENABLE_IA=false` — única parte paga).

## Estado (2026-07-13)
- **No ar**: `https://app.clubdigital.site` (Netlify, deploy automático no push da `main`; repo privado `github.com/jonhcar/app_reconect`; URL interna delightful-heliotrope-6a9010.netlify.app). Raiz `clubdigital.site` reservada para a futura landing
- Supabase configurado: projeto `kkvjuqhbihcbkhozcqip`, schema + migração `supabase/migration-ventas-por-producto.sql` rodados, bucket `uploads` público, confirm-email desligado, Site URL/Redirects apontando para o domínio
- Env vars no Netlify: VITE_SUPABASE_*, SUPABASE_*, VITE_ENABLE_IA=false (Resend/Anthropic/HOTMART_WEBHOOK_SECRET ainda vazias)
- Admin: jonhnetia@gmail.com (role=admin) — painel em `/admin`
- **Modelo de venda: por produto** — cada produto tem `checkout_url` + `sales_copy` + `price` (campos no admin); produto bloqueado abre página de vendas com botão de compra individual; webhook Hotmart libera/revoga acesso por produto (via `hotmart_product_id`); compra antes do cadastro cai em `pending_purchases` e é liberada por trigger no signup. Flag `premium` do profile virou "acesso total" manual/legado
- Ghostscript instalado (`C:\Program Files\gs\gs10.07.1`) para comprimir PDFs (limite Supabase: 50 MB/arquivo)
- E-mail de suporte é placeholder `soporte@reconectar.app` em `src/components/MemberLayout.jsx` e `src/pages/Profile.jsx`

## Próximos passos combinados
1. **Hotmart**: João tem 3 produtos criados (vai subir o restante). Para cada um: pegar link de checkout + ID do produto → preencher no admin; configurar webhook (Ferramentas → Webhook v2.0) → `https://app.clubdigital.site/.netlify/functions/hotmart-webhook` + Hottok em `HOTMART_WEBHOOK_SECRET` (Netlify env)
2. **Copy de vendas**: preencher `sales_copy` e `price` de cada produto no admin
3. **Lovable**: landing de captura em `clubdigital.site` apontando para `https://app.clubdigital.site/login` — paleta: rosa `#D44D6E`, malva `#7A3B5E`, creme `#FDF8F3`, dorado `#C9A24B`; fontes Playfair Display + Nunito Sans
4. **Resend**: criar conta free, verificar domínio, preencher RESEND_API_KEY/EMAIL_FROM no Netlify

## Comandos
- `npm run dev` — desenvolvimento (http://localhost:5173)
- `npx netlify dev` — com as functions
- `npm run build` — validar antes de commitar
