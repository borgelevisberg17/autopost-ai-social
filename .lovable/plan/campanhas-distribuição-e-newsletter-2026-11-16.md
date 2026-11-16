# Campanhas, distribuição e newsletter

## O que vais ter

- **Página Campanhas** (`/admin/campanhas`): criar campanha, escolher produtos (ou deixar a IA escolher por stock/vendas/novidade), canais, público e pipeline de etapas.
- **Pipeline configurável**: etapas em sequência (ex.: Facebook → Instagram → WhatsApp → Email), cada uma com atraso, horário permitido e aprovação manual opcional. Estados: rascunho, agendada, a correr, pausada, concluída.
- **Públicos**:
  - Contactos que já falaram no WhatsApp (guardar sempre os contactos de quem entra em contacto com a loja numa lista de clientes para o marketing independente da aprovação da meta).
  - Subscritores da newsletter: formulário de adesão na loja, confirmação, cancelamento com 1 clique.
- **Agentes**:
  - Publicação Facebook/Instagram: gera texto por canal com dados reais e publica na Página/conta ligada.
  - Newsletter/email: gera email com produtos reais e envia aos subscritores ativos.
  - Distribuição: corre a cada 5 min, avança etapas vencidas, respeita limites do plano e regista tudo.
- **Sem autorização ainda**: tudo funciona até ao envio — cada etapa fica "Aguarda ligação do canal" com pré-visualização e texto para copiar. Ao colocar a chave/autorização nas Definições, as etapas passam a enviar sozinhas.
- **Configuração segura**: nas Definições da loja, campos para ID da Página Facebook, conta Instagram e token, guardados cifrados como o Stripe/Meta. Email usa o domínio de envio da plataforma (app@cachiluvia.com).

## Limites por plano

- Free: só rascunhos e cópia manual.
- Básico: Facebook/Instagram + newsletter.
- Pro: tudo, incluindo WhatsApp.

## Começar imediatamente 

## Detalhes técnicos

- Tabelas: `campaigns`, `campaign_steps`, `campaign_deliveries` (dedupe por destinatário+etapa), `newsletter_subscribers` (token de cancelamento), `marketing_consents`. Tudo com `company_id`, RLS por `is_company_member`, GRANTs.
- Edge functions: `campaign-dispatch` (cron, lock por etapa), `social-publish` (Graph API `/{page}/photos`, `/{ig}/media` + `media_publish`), `newsletter-subscribe`/`unsubscribe`, email via infraestrutura de email da Lovable.
- Credenciais `facebook`/`instagram` em `integration_credentials` (AES-GCM, escopo empresa).
- Testes: dedupe de envio, bloqueio por plano, cancelamento de newsletter.