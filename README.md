# Reconectar 💗

Plataforma de membresía (freemium) para conteúdos de bem-estar emocional — interface em espanhol, mobile-first.

**Stack:** React (Vite) + Tailwind · Supabase (banco/auth/storage) · Netlify (hosting + functions) · Anthropic Claude (quiz diário + chat Alma) · Resend (e-mail) · Hotmart (pagamentos via webhook).

## Estrutura

```
├── supabase/schema.sql          # Schema completo (rodar no SQL Editor do Supabase)
├── netlify/functions/           # Backend serverless
│   ├── send-email.js            # Envia PDF por e-mail (Resend)
│   ├── invoke-llm.js            # Gera o Quiz del Día (1x por dia, Claude)
│   ├── alma-chat.js             # Respostas da Alma (Claude)
│   └── hotmart-webhook.js       # Libera/bloqueia premium ao pagar/cancelar
├── src/
│   ├── api/supabaseClient.js    # Camada de API (objeto base44)
│   ├── context/AuthContext.jsx
│   ├── components/              # Layouts, ProductCard, UnlockModal, AudioPlayer…
│   └── pages/                   # Login, Home, ProductDetail, Perfil, Quiz, Alma
│       └── admin/               # Painel: produtos, categorias, usuárias, reseñas…
└── netlify.toml
```

## Setup (passo a passo)

### 1. Supabase
1. Crie o projeto em [supabase.com](https://supabase.com)
2. **SQL Editor** → cole `supabase/schema.sql` → Run
3. **Authentication → Providers**: ative Email (e Google, se quiser)
4. **Authentication → Email Templates → Confirm signup**: troque `{{ .ConfirmationURL }}` por `{{ .Token }}` (para o código de 6 dígitos funcionar)
5. **Storage**: crie um bucket público chamado `uploads`
6. **Project Settings → API**: copie a URL e a anon key

### 2. Local
```bash
cp .env.example .env   # preencha com suas chaves
npm install
npm run dev            # front apenas
npx netlify dev        # front + functions (recomendado)
```

### 3. Tornar-se admin
Após criar sua conta no app, rode no SQL Editor:
```sql
update public.profiles set role = 'admin' where email = 'seu@email.com';
```
O painel fica em `/admin`.

### 4. Deploy (Netlify)
1. Suba o repositório para o GitHub
2. Netlify → Add new site → Import from Git
3. Build: `npm run build` · Publish: `dist` (o `netlify.toml` já configura)
4. Em **Environment variables**, adicione TODAS as variáveis do `.env.example` (incluindo as `VITE_*`)

### 5. Hotmart
1. Ferramentas → Webhook (v2.0) → URL: `https://SEU-SITE.netlify.app/.netlify/functions/hotmart-webhook`
2. Copie o Hottok para `HOTMART_WEBHOOK_SECRET`
3. No admin do app (Ajustes), cole o link do checkout da Hotmart

## Fluxo freemium
- 1 produto marcado como **Gratuito (isca)** fica aberto para todas
- Os demais aparecem com cadeado 🔒; ao tocar, abre o modal "Desbloquear todo por 9,90" → checkout Hotmart
- Pagamento aprovado → webhook marca `premium = true` → tudo desbloqueado
- Cancelamento/reembolso → webhook remove o premium
