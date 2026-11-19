# Editor de lojas (estilo Shopify)

## O que cada loja poderá mudar
- **Identidade**: logótipo, ícone, nome exibido, cores (principal, fundo, texto, destaque), tipo de letra (6–8 pares escolhidos), cantos (retos/suaves/redondos).
- **Página inicial por secções**: banner principal, produtos em destaque, categorias, promoções, testemunhos, newsletter, sobre, FAQ, contactos. Adicionar, remover, reordenar (arrastar) e editar textos/imagens de cada secção.
- **Cabeçalho e rodapé**: menu, anúncio no topo, redes sociais, links.
- **Modelos prontos**: 4–5 temas de partida (ex.: Boutique, Mercado, Tecnologia, Minimal) para não começarem do zero.
- **Pré-visualização ao vivo** ao lado (telemóvel/computador), com **Guardar rascunho** e **Publicar** — os clientes só veem a versão publicada.
- **SEO e partilha**: título, descrição e imagem de partilha da loja.

## Limites por plano
- Free: tema pronto + cores e logótipo.
- Básico: secções e tipos de letra.
- Pro: tudo, incluindo várias versões guardadas.

## Detalhes técnicos
- Tabela `store_themes` (company_id, draft jsonb, published jsonb, published_at, versões) com RLS por `is_company_admin`; leitura pública só do `published` de lojas ativas via RPC.
- Esquema do tema validado (zod) no cliente e no servidor; imagens por links https (buckets públicos bloqueados).
- `Store.tsx` passa a renderizar secções a partir do tema publicado, com variáveis CSS por loja, mantendo carrinho/checkout atuais.
- Página `/admin/loja/editor` com painel de secções, inspetor e iframe de pré-visualização.
