# Spec — Fundação de SEO (A Rede)

> **Como usar este documento com o Claude Code**
> 1. Cole este arquivo no repositório (ex.: `docs/spec-seo-fundacao.md`) e aponte o Code para ele.
> 2. **Entre em plan mode antes de editar qualquer coisa.** A primeira tarefa é *investigar e confirmar* o estado atual (especialmente a Tarefa 0), não escrever código.
> 3. Apresente o plano de implementação contra os arquivos reais e aguarde aprovação antes de aplicar mudanças.
> 4. Implemente em ordem de fase. A Fase 1 destrava tudo; nada depois dela tem efeito de SEO se ela não estiver pronta.

---

## Contexto do projeto

- **Stack:** Next.js (App Router), JavaScript, Supabase (Postgres + client `lib/supabase.js`), Tailwind, deploy na Vercel.
- **Estrutura conhecida:** `app/page.js` (home), `app/catalogo/page.js` (catálogo com busca/filtros), `app/cadastro/page.js`, `app/avaliar/page.js`, `app/sobre/page.js`, `app/components/` (Nav, Footer), `app/config.js` (categorias), `supabase/migrations`, `supabase-setup.sql`.
- **Domínio:** marketplace comunitário de serviços locais (Jacareí–SP), com efeito de indicação entre vizinhos. Avaliações de profissionais já existem como dado (há fluxo em `app/avaliar`).

## Problema

O conteúdo dinâmico do site **não chega no HTML que o buscador recebe**. Verificação que motivou este spec: a home (`/`) retorna conteúdo completo no HTML do servidor, mas `/catalogo` retorna HTML praticamente vazio (apenas meta tags) — a lista de profissionais é montada no cliente via Supabase. Além disso, `/catalogo` repete o mesmo `title` e `meta description` da home. Resultado: as páginas de catálogo e de perfil — justamente as que precisam ranquear — são, na prática, invisíveis ou de baixíssima qualidade para o Google e para mecanismos de busca local. Toda otimização de conteúdo, palavra-chave ou dados estruturados é inútil enquanto isso não for resolvido.

## Objetivos (outcomes)

1. Catálogo e páginas de perfil entregam **conteúdo completo no HTML do servidor** (renderização no servidor ou pré-renderização), verificável com JavaScript desabilitado.
2. Cada página relevante tem **`title` e `meta description` únicos e descritivos**, refletindo serviço e localidade.
3. Páginas de perfil expõem **dados estruturados válidos** (perfil do profissional + avaliação agregada) que passam no Rich Results Test do Google.
4. Existe um **mecanismo de descoberta** (sitemap + links crawláveis) que permite ao buscador encontrar todos os perfis e páginas de categoria.
5. Existem **páginas locais por serviço × bairro/cidade**, renderizadas no servidor, capazes de ranquear para buscas locais e funilar para os perfis.
6. O profissional tem um **assistente que o ajuda a criar/otimizar seu Google Business Profile (GBP)** a partir dos dados já cadastrados.

## Não-objetivos (fora deste spec)

- **Score de completude/gamificação de perfil** — iniciativa separada (fase posterior).
- **Assistente de redação/keywords via LLM no perfil** — fase posterior; não confundir com o item de GBP.
- **Botão de "otimização automática de layout" com estimativa de "+X% de visitas"** — explicitamente descartado: alto esforço, baixo impacto no SEO local, risco de homogeneizar perfis e de prometer resultado não comprovável.
- **Integração com SemRush/Ahrefs ou qualquer dado pago de keyword** — inviável no custo para este projeto.
- **Otimização para AI Overviews (GEO/AEO)** — baixa prioridade aqui, pois busca local raramente dispara AI Overviews.

---

## Tarefa 0 (bloqueante) — Auditar antes de implementar

Execute em plan mode e **reporte os achados** antes de propor mudanças:

- [ ] Identificar a rota de perfil individual (ex.: `app/profissional/[slug]/page.js` ou equivalente) e confirmar o padrão de URL.
- [ ] Confirmar se cada perfil é **crawlável**: URL própria que retorna 200, conteúdo no HTML do servidor, navegada por `<a href>` real (não por `onClick`/navegação só client-side), sem exigir login.
- [ ] Verificar quais páginas usam `"use client"` no topo e fazem fetch do Supabase no cliente (provável causa do HTML vazio em `/catalogo`).
- [ ] Confirmar as políticas de RLS no Supabase: as tabelas de profissionais e avaliações permitem **leitura pública** (necessário para fetch no servidor).
- [ ] Mapear o schema das tabelas relevantes (campos de profissional, categoria, contato, região, avaliações/notas).
- [ ] Verificar se já existem `app/sitemap.js`, `app/robots.js`, e uso da Metadata API.

---

## Fase 1 — Destravar a indexação (P0)

### Requisito 1.1 — Renderizar catálogo e perfis no servidor
- Converter `app/catalogo/page.js` e a página de perfil para **Server Components** que buscam dados do Supabase no servidor (cliente server-side; para dados públicos, leitura com a anon key respeitando RLS).
- Para perfis, preferir **pré-renderização com `generateStaticParams` + revalidação incremental** (ISR) quando o volume permitir; caso contrário, render dinâmico no servidor.
- Manter interações client-side (busca/filtro) como ilhas client *dentro* da página server-rendered, sem mover o conteúdo principal de volta para o cliente.

**Aceite:**
- Dado o JavaScript desabilitado, quando eu abrir `/catalogo` e uma página de perfil, então a lista de profissionais e os dados do perfil aparecem no HTML.
- `curl` na URL do perfil retorna o nome, serviço, região e avaliações no corpo do HTML.

### Requisito 1.2 — Metadata única por página (Metadata API)
- Implementar `generateMetadata` em catálogo, categoria e perfil, com `title` e `description` específicos (ex.: "Manicure em Jacareí — [Nome] | A Rede"), além de Open Graph básico.
- Remover o `title`/`description` genérico herdado pela home nas páginas dinâmicas.

**Aceite:**
- Cada perfil e cada página de categoria tem `title` e `meta description` distintos, refletindo serviço + localidade.

### Requisito 1.3 — Descoberta: sitemap + robots + links crawláveis
- Criar `app/sitemap.js` dinâmico listando home, páginas de categoria, todas as páginas de perfil e (após a Fase 2) as páginas serviço×bairro. Apenas URLs canônicas, status 200.
- Criar/ajustar `app/robots.js` declarando o sitemap.
- Garantir que perfis e categorias sejam alcançáveis por `<a href>` reais a partir do catálogo.

**Aceite:**
- `/sitemap.xml` lista todas as URLs de perfil e categoria.
- Todo perfil é alcançável seguindo links a partir da home sem executar JavaScript.

### Requisito 1.4 — Dados estruturados (JSON-LD)
- No perfil: emitir JSON-LD no servidor com o profissional como `LocalBusiness`/`ProfessionalService` (ou subtipo adequado), incluindo `name`, `areaServed`, `description`, e — quando houver avaliações — `aggregateRating` e amostra de `review`.
- No catálogo/categoria: emitir `ItemList` referenciando os perfis listados.

**Aceite:**
- A URL do perfil passa no Google Rich Results Test sem erros, exibindo o negócio e a nota agregada quando existir.
- O preço/nota exibidos na página batem com os do JSON-LD (sem divergência).

---

## Fase 2 — Onde mora o tráfego local (P0/P1)

### Requisito 2.1 — Páginas locais serviço × bairro/cidade
- Criar rota dinâmica (ex.: `/[servico]/[local]` ou `/catalogo/[categoria]/[local]`) renderizada no servidor, listando os profissionais daquele serviço naquela localidade.
- Cada página: `title`/`description` únicos ("Diaristas no Parque dos Sinos, Jacareí | A Rede"), `ItemList` em JSON-LD, e um bloco de texto introdutório com a resposta direta logo no início.
- Gerar essas páginas a partir das combinações reais existentes (serviços × bairros com profissionais), incluí-las no sitemap, e linká-las internamente a partir das páginas de categoria.

**Aceite:**
- Para uma combinação serviço×bairro com profissionais cadastrados, existe uma URL própria, server-rendered, indexável, que lista esses profissionais e linka para os perfis.

### Requisito 2.2 — Assistente de Google Business Profile (P1)
- Fluxo guiado, acionável pelo profissional, que: (a) pré-preenche os dados do GBP a partir do cadastro na Rede (nome, categoria, área atendida, contato, descrição); (b) entrega um checklist de otimização (fotos, horário, categoria correta, link de volta para o perfil na Rede); (c) leva o profissional ao GBP por deep link para concluir a verificação.
- Escopo honesto: é um **assistente de preenchimento e orientação**, não um criador automático de GBP (a verificação é feita pelo próprio profissional no Google).

**Aceite:**
- O profissional consegue, a partir do perfil dele na Rede, obter um texto/dados prontos para colar no GBP e um passo a passo claro de verificação.

---

## Perguntas em aberto

- **(Eng.)** Volume atual de perfis? Define se a estratégia de perfil é estática (ISR) ou dinâmica no servidor.
- **(Eng.)** Padrão de URL desejado para perfis e para páginas serviço×bairro (slug por nome? por id? como tratar homônimos?).
- **(Produto)** Lista de bairros/localidades a cobrir na Fase 2 — começar só por Jacareí/Parque dos Sinos ou já generalizar?
- **(Dados)** As avaliações têm nota numérica e contagem suficientes para `aggregateRating`, ou só texto?

## Sugestão de faseamento

- **PR 1:** Tarefa 0 (auditoria) + Requisitos 1.1 e 1.2.
- **PR 2:** Requisitos 1.3 e 1.4.
- **PR 3:** Requisito 2.1.
- **PR 4:** Requisito 2.2.

Cada PR deve ser verificável de forma independente (ver critérios de aceite). Não iniciar a Fase 2 antes de a Fase 1 passar nos aceites.
