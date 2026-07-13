# Reconectar — contexto do projeto

App de membresía freemium (interface em espanhol, mobile-first) para conteúdos de bem-estar emocional. Dono: João (jonhnetia@gmail.com) — **iniciante**: responder em pt-BR, passo a passo prático, um bloco por vez, custo zero (só planos free).

## Stack
React (Vite) + Tailwind · Supabase (banco/auth/storage) · Netlify (hosting + functions) · Hotmart (pagamentos via webhook) · Resend (e-mail) · Anthropic (IA, **desativada** via `VITE_ENABLE_IA=false` — única parte paga).

## Estado (2026-07-13)
- Projeto movido do OneDrive para `C:\projetos\reconectar` (se a pasta antiga `C:\Users\joaoc\OneDrive\VSCODE.IA\micro saas` ainda existir, pode apagar — esta aqui é a oficial, git completo)
- Supabase configurado e funcionando: projeto `kkvjuqhbihcbkhozcqip`, schema rodado (`supabase/schema.sql`), bucket `uploads` público com políticas de storage, confirm-email desligado
- Admin: jonhnetia@gmail.com (role=admin, premium=true) — painel em `/admin`
- `.env` preenchido (não versionado); IA desligada
- Ghostscript instalado (`C:\Program Files\gs\gs10.07.1`) para comprimir PDFs (limite Supabase: 50 MB/arquivo)
- E-mail de suporte é placeholder `soporte@reconectar.app` em `src/components/MemberLayout.jsx` e `src/pages/Profile.jsx`

## Próximos passos combinados
1. **GitHub**: João cria repo privado e passa a URL → fazer `git remote add` + push
2. **Netlify**: import do GitHub; adicionar TODAS as env vars do `.env.example` no painel
3. **Hotmart**: webhook → `/.netlify/functions/hotmart-webhook` + Hottok em `HOTMART_WEBHOOK_SECRET`; link do checkout em Admin → Ajustes
4. **Lovable**: landing de captura apontando para `/login` do app — paleta: rosa `#D44D6E`, malva `#7A3B5E`, creme `#FDF8F3`, dorado `#C9A24B`; fontes Playfair Display + Nunito Sans

## Comandos
- `npm run dev` — desenvolvimento (http://localhost:5173)
- `npx netlify dev` — com as functions
- `npm run build` — validar antes de commitar
