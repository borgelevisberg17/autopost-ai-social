# Roadmap

- [ ] Ligação automática Meta — ativa quando a plataforma guardar o ID da aplicação e os IDs de configuração (Embedded Signup e Facebook Login for Business) e a Vendora for Tech Provider aprovado pela Meta
- [x] Campanhas com pipeline por canal, contactos WhatsApp guardados como clientes, newsletter com cancelamento
- [ ] Envio de email marketing — precisa de um serviço próprio de email marketing (o email da app só permite emails individuais)
- [ ] Envio WhatsApp a contactos com mais de 24h — precisa de modelo de mensagem aprovado pela Meta
- [ ] Autorizar grupos específicos por empresa, respostas por chamada e marketing agendado — aguarda decisão entre grupos oficiais Meta (OBA, até 8 participantes) e exigência dos grupos comuns existentes, sem acesso pela API oficial

- [x] Reconciliar e aplicar alterações pendentes sem alterar o formato dos pedidos
- [x] Unificar estado WhatsApp entre Conversas e Definições e verificar com sessão real

- [x] Centralizar preços e diagnóstico Meta nas Definições da plataforma
- [x] Preservar segredos Meta existentes ao guardar apenas o ID da aplicação
- [x] Validar pertença do número à conta Business e guardar encaminhamento antes de subscrever eventos
- [ ] Validar aplicação e subscrever número Business para mensagens individuais reais — depende de IDs Meta
- [ ] Grupos WhatsApp — depende de conta oficial elegível e implementação específica de grupos
- [ ] Publicação de produtos Facebook/Instagram — depende de páginas, contas e permissões autorizadas

- [x] Formulário Stripe por empresa, criptografado, sem fallback para conta da plataforma
- [ ] Autorizar contas próprias PayPal — falta integração de autorização individual das contas Business
- [ ] Cobrança de subscrições — preços Básico/Pro ainda por definir e conta de pagamentos por autorizar
- [x] Confirmar administração com a conta existente e acesso dentro da aplicação
- [x] Aplicar limites Free/Básico/Pro à navegação e aos acessos diretos
- [x] Formulário Meta no painel e ação de subscrição do webhook
- [ ] Ativar Meta — falta ID da aplicação e registo de pelo menos um número Business

- [x] Consolidar catálogo de planos, limites no servidor e utilização por empresa
- [x] Administração da plataforma: empresas, preços, cupões e concessões temporárias auditadas
- [x] Republicar análise e validar gráficos e restrições de subscrição
- [ ] Cobrança recorrente dos planos e aplicação financeira dos cupões — depende de configuração Stripe/PayPal da plataforma

- [x] Empresas (multiempresa, moeda própria)
- [x] Produtos e stock
- [x] Loja pública + carrinho + pedidos
- [x] Painel de vendas
- [x] Agente de marketing com regras e registo (publicado)
- [x] Agente de análise com métricas reais e sugestões (publicado)
- [x] Agente de vendas para teste interno (publicado)
- [ ] Publicação real na Meta (Facebook/Instagram/WhatsApp) — precisa de credenciais Meta
- [ ] Ligar o agente de vendas ao WhatsApp Business — fica para a próxima fase
- [x] Credenciais Meta partilhadas e validação de número dentro de cada loja
- [ ] Ativar callback da Meta e registar os números Business de cada loja
- [x] Mostrar crescimento mensal real de vendas e subscrições, plano e estado da loja
- [ ] Permissões por agente, 2FA, artigos/blog
- [ ] Pagamentos online
