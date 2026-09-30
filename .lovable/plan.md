# Vendora: fundação completa de dados e identidade “Livro & Mercado”

## Diagnóstico

- O banco ativo ainda contém apenas o núcleo inicial: empresas, membros, produtos, pedidos, itens, ações do agente e as tabelas antigas por utilizador.
- Duas migrações já existentes no projeto — clientes/inventário/agentes/canais/notificações/auditoria e o enriquecimento do fluxo de pedidos — ainda não foram aplicadas. A interface já consulta essas tabelas, portanto há hoje uma divergência real entre aplicação e banco.
- `business_settings` e `content_history` pertencem ao utilizador, enquanto a Vendora agora é multiempresa. Esses dados precisam passar a pertencer à empresa.
- O modelo atual ainda não representa variantes, múltiplos locais de stock, carrinhos, pagamentos, entregas, conversas, publicações multicanal, métricas, consentimentos, subscrições e webhooks.
- A interface mistura preto/cinza com azul genérico, índigo/violeta, gradientes, transparências e muitos valores de cor escritos página a página. Isso impede uma identidade única e consistente.

## Direção visual escolhida

**“Livro & Mercado”**: a precisão de um livro de contas com a energia de um mercado contemporâneo africano/lusófono. É uma alternativa própria ao azul seguro de Shopify/Hootsuite, ao violeta de Odoo/Gorgias e ao preto-lima de Klaviyo.

- Base clara em papel quente, texto carvão e superfícies totalmente opacas.
- Terracota como cor principal; oliva para sucesso e crescimento; ocre para atenção; tijolo para erro.
- Sem gradientes, glassmorphism, blur decorativo, brilhos ou fundos com círculos abstratos.
- Títulos e valores-chave em **Fraunces**; interface e texto corrido em **Work Sans**. Números monetários usam algarismos tabulares.
- Cantos firmes de 4px, divisórias visíveis e sombras mínimas. O aspeto lembra etiquetas, recibos e carimbos, sem parecer artesanal ou antigo.
- Gráficos planos em terracota, oliva, ocre e azul-petróleo; nunca preenchimentos em gradiente.
- Modo escuro em carvão quente, mantendo contraste e a mesma identidade — não violeta/preto tecnológico.

## Implementação

### 1. Alinhar imediatamente o banco e o código

- Aplicar, sem alterar o conteúdo, as duas migrações existentes ainda ausentes no banco ativo.
- Confirmar tabelas, índices, funções, permissões e políticas após cada aplicação.
- Atualizar os tipos gerados usados pela aplicação para refletirem o banco real.
- Preservar todos os dados atuais e tornar cada passo repetível e seguro.

### 2. Consolidar a base multiempresa

Criar uma migração adicional que estabeleça a empresa como proprietária de toda informação comercial:

- **Empresa e equipa:** ampliar `companies`; criar `company_settings`, `company_invitations` e permissões detalhadas dos membros sem colocar funções no perfil do utilizador.
- **Catálogo:** `categories`, `product_variants`, `product_media`, `collections`, relações de coleção e regras de preço/desconto.
- **Stock:** `locations`, `inventory_levels`, reservas e movimentos ligados a variante, local, pedido, canal e ator; o stock disponível passa a ser calculado de forma consistente.
- **Clientes:** perfis por empresa, endereços, identificadores por canal, etiquetas, consentimentos e histórico de contacto.
- **Compra e pedidos:** carrinhos e itens; enriquecer pedidos com cliente, subtotal, desconto, portes, impostos, moeda, moradas, origem, idempotência e referência pública segura.
- **Pagamentos e entrega:** transações, reembolsos, entregas e itens entregues, preparados para fornecedores externos sem guardar segredos no banco público.
- **Canais e integrações:** contas por canal, listagens de produto, estado de sincronização, webhooks recebidos e tentativas de processamento.
- **Conteúdo social:** campanhas, peças-base, versões específicas por plataforma, recursos, agenda, publicações e métricas por publicação. Migrar o histórico antigo sem perda.
- **Atendimento:** conversas, participantes e mensagens para WhatsApp e website, com ligação opcional a cliente, produto e pedido.
- **Analytics:** eventos normalizados e agregados diários por empresa, canal, produto e campanha para evitar cálculos caros no navegador.
- **Agentes:** configurações, permissões, horários, execuções, aprovações e ações auditáveis; manter compatibilidade com `agent_actions`.
- **SaaS:** planos, subscrições, limites e consumo por empresa, preparados para pagamentos futuros.

### 3. Segurança e integridade desde a origem

- Cada nova tabela de negócio terá `company_id`, índices, `GRANT` explícito, RLS e políticas com `is_company_member`/`is_company_admin` na mesma migração.
- Acesso público será feito por funções/consultas públicas limitadas, em vez de expor linhas completas de empresas e pedidos.
- Substituir a consulta pública de estado do pedido por referência secreta do cliente; adicionar idempotência ao checkout.
- Validar estados e transições de pedido, pagamento, entrega, publicação e agente no servidor.
- Registos financeiros, auditoria, métricas brutas e ações de IA serão imutáveis para clientes comuns.
- Tokens de redes e pagamentos ficam apenas em segredos seguros; no banco ficam identificadores e estados não sensíveis.
- Adicionar retenção, consentimento, tentativas de webhook, rate limits lógicos e trilhos de auditoria necessários para operação real.

### 4. Adaptar a aplicação ao modelo consolidado

- Mover configurações de negócio do utilizador para a empresa selecionada.
- Atualizar produtos, inventário, pedidos, clientes, agentes, aprovações e analytics para as novas relações sem remover funções atuais.
- Manter o checkout atual funcional enquanto passa a gravar cliente, evento, movimento de stock e referência segura.
- Exibir claramente módulos ainda dependentes de contas externas, sem simular conexões ou dados.

### 5. Aplicar uma única identidade ao sistema inteiro

- Substituir os tokens globais por “Livro & Mercado” e remover utilitários de gradiente/glass.
- Centralizar cores semânticas de sucesso, alerta, erro, informação, estados de pedido e canais.
- Converter todas as páginas públicas, autenticação, onboarding, painel, loja e estados vazios para os mesmos tokens; remover cores cruas e estilos isolados.
- Sidebar com marca terracota linear, cartões planos, tabelas de estilo contábil, botões tipo carimbo, etiquetas compactas e gráficos sem gradiente.
- Reorganizar a página pública em português e com imagem real do produto/experiência, sem a aparência de template SaaS genérico.
- Manter navegação inferior no telemóvel, densidade eficiente no desktop e alvos de toque adequados.

## Validação

- Verificar migrações, RLS, privilégios e isolamento entre duas empresas.
- Testar ponta a ponta: criar empresa, produto/variante, ajustar stock, comprar, acompanhar pedido, cancelar/repor stock e gerar conteúdo com dados reais.
- Testar configurações por empresa e garantir que nenhuma preferência vaza entre empresas do mesmo utilizador.
- Rever visualmente login, onboarding, painel, produtos, inventário, pedidos, clientes, agentes, analytics e loja em desktop e telemóvel.
- Confirmar ausência de gradientes, glassmorphism, cores cruas, sobreposições, erros de execução e erros de compilação.

## Limites desta etapa

- A base ficará preparada para Meta/WhatsApp e pagamentos, mas publicação, mensagens e cobranças reais continuam dependentes das respetivas contas e credenciais externas.
- Não serão inventadas métricas, clientes, vendas ou estados de conexão para preencher telas.
