# Vendora Commerce OS

Aplicação web para gerir catálogo, stock, pedidos, canais de venda e automação comercial num só lugar.

## Stack

- React 18, TypeScript e Vite
- Tailwind CSS e componentes shadcn/ui
- Supabase Auth, Postgres, RLS e Edge Functions

## Desenvolvimento local

Requisitos: Node.js 20+ e npm.

```sh
npm ci
cp .env.example .env
npm run dev
```

Defina as variáveis abaixo no `.env` local antes de usar autenticação e dados:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Para compilar e validar o código:

```sh
npm run lint
npm run build
```

## Geração de conteúdo com IA

A Edge Function `marketing-agent` usa o serviço Lovable AI já integrado ao projeto. Mantenha `LOVABLE_API_KEY` configurada nos segredos do projeto para gerar rascunhos; a função valida autenticação, permissões e dados do produto antes de chamar o serviço.

## Deploy

O frontend é uma aplicação Vite estática e pode ser publicado num serviço compatível com SPA. Configure os valores Supabase como variáveis de ambiente e encaminhe rotas desconhecidas para `index.html` (a configuração do repositório já inclui `vercel.json`). As migrações e funções Supabase vivem em `supabase/`.
