# Direção visual — Social proof em movimento

## Movimento

A mesma direção “Livro & Mercado” existente: precisão editorial de um livro de contas com energia de mercado contemporâneo africano/lusófono.

## Princípios

- Pessoas, perfis e canais fazem parte do cenário da operação — não são cartões SaaS soltos.
- Superfícies opacas, linhas visíveis, cantos firmes e sombras discretas.
- A interação deve ser legível: hover, focus, seleção e navegação explícita.

## Cor e composição

Papel quente, carvão, verde-oliva, terracota e azul-petróleo. Os perfis orbitam a prova social como uma camada viva de fundo; os canais usam composições editoriais full-bleed.

## Tipografia e voz

DM Sans para a interface e IBM Plex Mono para metadados. Voz direta, humana e operacional.

## Interação

- Avatares respondem a hover/focus com escala suave e revelam nome/canal.
- WhatsApp funciona como um Status mini-carousel com tabs, setas e estados selecionáveis.
- Respeitar `prefers-reduced-motion`.

## Ativos

- `public/media/facebook-commerce.png`: composição larga full-bleed para Facebook.
- `public/media/instagram-social-post.png`: composição vertical full-bleed para Instagram.

## Painel admin — referência premium (2026-09)

- **Movimento:** traduzir a referência fornecida como uma mesa editorial de operações: leve, clara e precisa, mantendo a direção existente “Livro & Mercado”.
- **Princípios:** rail lateral claro e bem agrupado; barra superior curta com pesquisa e notificações; cartões com limites nítidos, hierarquia consistente e sem gradientes decorativos; destacar o que requer ação sem inventar estados.
- **Composição:** overview modular com indicadores, desempenho, necessidades de atenção, canais, atividade/auditoria, pedidos recentes e produtos, usando apenas as rotas e dados já existentes.
- **Cor:** papel quente e branco marfim, carvão para texto, verde-sálvia para estados positivos e terracota para chamadas/alertas.
- **Interação:** preservar pesquisa global, notificações, troca de loja, seletor de período, links, ações e navegação inferior móvel; manter foco visível e estados de carregamento/vazio.
- **Tipografia:** DM Sans para controlos e corpo, a serif system (`font-serif`) em títulos e valores para o tom editorial da referência, e IBM Plex Mono nos metadados; sem dependências novas.

## Área Canais — referência de acompanhamento de plataformas (2026-09)

A captura enviada pelo utilizador é a referência visual para `/admin/canais`: o destino deve acompanhar plataformas de venda separadamente da visão geral, com escolha da plataforma, contexto do canal, estado de ligação e última sincronização, catálogo e pedidos recentes em painéis próprios. Reutilizar `social_connections`, `products` e `orders`; apresentar apenas estados reais. O catálogo base não equivale a catálogo sincronizado por plataforma, e um pedido registado não equivale a uma integração ativa. Não exibir estados fictícios, OAuth ou coleções sem suporte no backend.
