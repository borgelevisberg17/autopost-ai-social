# Vendora recebe mensagens do WhatsApp diretamente

Em vez de depender de um conector, a Vendora passa a ter o seu próprio endereço de receção de mensagens, ligado diretamente à API oficial do WhatsApp (Meta Cloud API). A Meta envia cada mensagem dos clientes para a Vendora, o agente de atendimento responde com dados reais e a resposta volta pelo mesmo número.

```text
Cliente WhatsApp → Meta → Vendora (receção) → identifica a empresa pelo número
                                         → agente responde (catálogo/pedido reais)
                                         → envia resposta pela Meta → Cliente
```

## O que o utilizador vai ver

- **Canais → WhatsApp:** formulário para ligar o número da empresa (ID do número e ID da conta Business da Meta), estado "a aguardar mensagens / ativo", e o endereço + código de verificação para colar na configuração da Meta.
- **Caixa de conversas (nova página "Conversas"):** lista de conversas por cliente, mensagens recebidas e respostas do agente, indicação quando o agente passou para a equipa, e caixa para a equipa responder manualmente.
- **Interruptor por empresa:** "Agente responde automaticamente" ligado/desligado.
- **Janela de teste** continua no painel de Agentes.

## Comportamento do agente

- Responde só com produtos, preços, stock e pedidos reais da empresa daquele número.
- Estado de pedido só com o código completo do pedido.
- Passa para a equipa quando não sabe ou o cliente pede uma pessoa; a partir daí deixa de responder nessa conversa até a equipa a devolver.
- Responde apenas dentro da janela de 24h da Meta (mensagens iniciadas pelo cliente).
- Cada mensagem recebida, resposta e passagem para a equipa fica registada.

## Segurança

- Cada pedido da Meta é verificado pela assinatura oficial antes de ser processado; pedidos não assinados são rejeitados.
- Mensagens repetidas pela Meta são ignoradas (sem respostas duplicadas).
- O token da Meta fica guardado como segredo do servidor, nunca no banco nem no navegador.
- Conversas e mensagens só são visíveis para membros da empresa.

## Do seu lado (fora da app)

1. Criar uma app no portal de programadores da Meta com o produto WhatsApp.
2. Fornecer-me três valores, que guardo como segredos: token de acesso permanente (System User), segredo da app, e um código de verificação à sua escolha.
3. Colar o endereço de receção da Vendora na configuração de webhook da Meta e subscrever "messages".
4. Registar o número Business e indicar o seu ID na página Canais.

Nesta fase, todas as empresas usam a app Meta da Vendora (um token). Ligação self-service por empresa (Embedded Signup) fica para uma fase seguinte, porque exige aprovação da Vendora como Tech Provider na Meta.

## Detalhes técnicos

- **Banco (uma migração):** `whatsapp_accounts` (company_id, phone_number_id único, waba_id, display_phone, status, auto_reply), `conversations` (company_id, channel, customer_phone, customer_id opcional, status open/handoff/closed, last_inbound_at), `messages` (conversation_id, company_id, direction in/out, sender customer/agent/staff, body, external_id único para idempotência, status, created_at). GRANT + RLS com `is_company_member`; escrita do webhook via service role.
- **Edge function `whatsapp-webhook`** (verify_jwt=false, pública): GET responde ao desafio `hub.verify_token`; POST valida `X-Hub-Signature-256` (HMAC SHA-256 com o segredo da app, comparação em tempo constante), resolve empresa por `phone_number_id`, grava mensagem com `external_id` (ON CONFLICT ignora), responde 200 rapidamente e processa a resposta do agente.
- **Lógica do agente partilhada** em `supabase/functions/_shared/sales-brain.ts`, usada pelo webhook (service role, filtrado pela empresa resolvida) e pela função de teste `sales-agent` existente.
- **Envio:** `POST graph.facebook.com/v21.0/{phone_number_id}/messages` com o token secreto; guarda id/estado; atualizações de estado (entregue/lido) atualizam `messages.status`.
- **Edge function `whatsapp-send`** para respostas manuais da equipa (verifica membro e janela de 24h).
- Segredos: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`.
- Registo em `agent_runs`/`agent_actions` como os restantes agentes; `AGENTS.md` atualizado com a regra do webhook próprio.

## Validação

- Simular pedidos da Meta assinados e não assinados contra a função (aceita/rejeita).
- Simular mensagem de cliente → conversa criada, agente responde com preço real, duplicado ignorado.
- Verificar isolamento entre duas empresas e a caixa de conversas no painel.
- Envio real só fica testável depois de fornecer as credenciais da Meta.
