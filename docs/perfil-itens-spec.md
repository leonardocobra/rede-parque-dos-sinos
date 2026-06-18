# Spec — Itens/subserviços no perfil público (Frente 1a)

> PRD. **Frente 1, parte A.** Prioridade #1 de Next (`docs/roadmap.md`).
> Decisão com o Leonardo (2026-06-18): construir o catálogo de itens **agora**; checkout/pagamento
> (1b) fica como estudo estratégico separado, **não** bundlado aqui.
> Liga com: `docs/crescimento-catalogo.md`, `docs/interface-profissional.md`, `docs/modelo-descricao-servico.md`.

## Problem Statement

Hoje o profissional se descreve por **serviço** (`profissional_servicos`: serviço, categoria,
descrição, instagram). Falta granularidade para mostrar **o que ele de fato oferece**: uma
diarista não lista "faxina pesada / passar roupa / pós-obra"; um confeiteiro não mostra os bolos
com foto e preço. Isso limita três coisas: **conversão** (o visitante não vê o que quer comprar),
**SEO** (cada item é um termo de busca que não existe na página) e **densidade do catálogo** (menos
motivo para visitar e voltar). O perfil público é a maior alavanca de crescimento já entregue;
enriquecê-lo com itens multiplica seu valor sem nova rota.

## Goals

1. **Profissional cadastra itens dentro de cada serviço** — foto, descrição, preço opcional,
   disponibilidade/estoque — pelo `/painel`, sem intervenção manual.
2. **Visitante vê os itens no perfil público** com foto e preço quando houver → mais conversão para
   contato no WhatsApp.
3. **Cada item vira conteúdo indexável** (texto no perfil SSR) → mais entradas orgânicas de cauda longa.
4. **Não quebrar o fluxo atual**: perfis sem itens continuam idênticos ao de hoje.

## Non-Goals

- **Checkout / pagamento / carrinho** — Frente 1b, decisão estratégica à parte. Aqui o CTA continua
  sendo **WhatsApp** (mantém a tese comunitária e o canal direto).
- **Agenda/reserva com confirmação** — disponibilidade aqui é **informativa** (texto/flag), não um
  sistema de booking transacional.
- **Estoque transacional com baixa automática** — "estoque" aqui é um rótulo opcional
  (ex.: "sob encomenda", "pronta entrega"), não controle de inventário real.
- **Preço obrigatório** — preço é sempre opcional (muitos serviços são "sob orçamento").

## Modelo de dados (proposto)

Nova tabela `profissional_itens`, filha de `profissional_servicos` (1:N):

| Coluna | Tipo | Nota |
| --- | --- | --- |
| `id` | uuid PK | |
| `servico_id` | uuid FK → `profissional_servicos` | item pertence a um serviço |
| `profissional_id` | uuid FK → `profissionais` | desnormalizado p/ RLS e query |
| `titulo` | text | ex.: "Bolo vulcão", "Faxina pós-obra" |
| `descricao` | text null | opcional |
| `foto_url` | text null | reusa o bucket `fotos-profissionais` |
| `preco` | numeric null | **opcional**; exibir formatado em BRL |
| `preco_tipo` | text null | enum: `fixo` / `a_partir` / `sob_orcamento` |
| `disponibilidade` | text null | rótulo livre: "pronta entrega", "sob encomenda", "agenda cheia" |
| `ativo` | boolean default true | esconder sem apagar |
| `ordem` | int | ordenação manual |
| `criado_em` / `atualizado_em` | timestamptz | |

- **RLS**: mesma regra de dono dos serviços — `UPDATE/INSERT/DELETE` só quando
  `auth.uid() = (select user_id from profissionais where id = profissional_id)`; `SELECT` público.
- **Limite** sugerido por serviço (ex.: 20 itens) para conter abuso e custo de imagem.

## Requirements

### Must-Have (P0)

- **P0.1 Migration** versionada e idempotente (`profissional_itens` + índices + RLS).
- **P0.2 Painel** (`/painel`): dentro de cada serviço em `GerenciarServicos`, gerir itens —
  adicionar/editar/remover, upload de foto (reusar `CropFotoModal` + `validarFoto`), preço opcional.
- **P0.3 Perfil público** (`/profissional/[id]`): renderizar os itens por serviço (SSR), com foto,
  preço formatado e disponibilidade. Item sem foto/preço degrada graciosamente.
- **P0.4 Catálogo**: opcional nesta fase — no mínimo não regredir; idealmente indicar "X itens".
- **P0.5 Revalidação**: salvar item dispara `revalidarPerfil(id)` (padrão já usado no painel).

### Nice-to-Have (P1)

- Reordenar itens por drag/handle.
- Galeria/lightbox de fotos no perfil.
- Badge "a partir de R$ X" no card do catálogo.

## Success Metrics

- **Adoção**: % de profissionais com conta que cadastram ≥1 item em 30 dias. Alvo: ≥30%.
- **Conversão**: cliques de contato (WhatsApp) em perfis **com** itens vs. **sem** itens (requer a
  camada de eventos do roadmap — comparar quando disponível).
- **SEO**: nº de perfis indexados / impressões de cauda longa (Search Console).

## Open Questions

- [ ] Itens aparecem no card do catálogo ou só no perfil? (recomendo: só perfil no MVP)
- [ ] Formatação/moeda do preço fixa em BRL? (sim, mercado local)
- [ ] Teto de itens por serviço e de fotos por item? (sugiro 20 / 1 no MVP)

## Timeline / faseamento (PRs pequenos — regra do CLAUDE.md)

1. **PR A** — migration + RLS de `profissional_itens` (P0.1).
2. **PR B** — gestão de itens no `/painel` (P0.2, P0.5).
3. **PR C** — render dos itens no perfil público SSR (P0.3) + revalidação.
4. **PR D (fast-follow)** — sinais no catálogo (P0.4) e P1.

> **Testes** (regra do CLAUDE.md): cobrir RLS (dono não edita item alheio), formatação de preço,
> e degradação graciosa (item sem foto/preço).
