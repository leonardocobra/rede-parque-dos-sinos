# Spec — AI Native Lab (arquitetura)

> **Frente paralela de portfólio.** Lab de IA aplicada sobre A Rede, para demonstrar competências em
> LLM Applications, Agents, MCP, RAG, Evals e Observabilidade de IA. **Sucesso = aprendizado +
> portfólio**, não monetização (PRD do Leonardo, 2026-06-24).
>
> **Posição no produto (decisão 2026-06-24):** _frente paralela_, **não** pivô. Não altera a tese
> `enablement → referral → marketplace` do [roadmap.md](roadmap.md). A IA serve ao **enablement**
> (onboarding com menos fricção, busca melhor), não antecipa o marketplace. Onde uma fase tocaria
> decisões de produto (ex.: descoberta central), fica marcado e **gated** pela mesma régua do roadmap.

## Princípios

1. **Não inflar o stack.** 1 pessoa mantém isto. Reusar Next/Vercel/Supabase/Vitest/`/admin` antes de
   adicionar qualquer serviço novo. O único stack novo inevitável é um provider de _embeddings_ (a
   Anthropic não oferece embeddings) — e mesmo assim o _vector store_ fica dentro do Supabase (pgvector).
2. **Medir desde a primeira chamada.** A observabilidade de IA (Fase 5) começa **parcial junto da Fase
   1**, não no fim. Instrumentar tokens/custo/latência custa minutos e dá os números de "AI Operations"
   desde o dia 1.
3. **Servidor é o único lugar que fala com o LLM.** A API key nunca vai ao browser; custo e rate-limit
   têm um gargalo único no servidor.
4. **A IA não recebe poder cru sobre o banco.** Agente usa _tools_ read-only parametrizadas, nunca SQL
   livre contra a produção.

## Restrição de arquitetura nº 1 — a camada de servidor

Hoje todo acesso a dados é client-side com a `anon` key ([lib/supabase.js](../lib/supabase.js)). A IA
**não pode** seguir esse modelo:

- A API key do LLM não pode ser `NEXT_PUBLIC_*` (vazaria no bundle).
- Custo e rate-limit exigem um ponto único de controle.

Logo, a IA introduz a camada que o app ainda não tem de forma sistemática: **Route Handlers do Next**
(`app/api/.../route.js`, runtime **Node**, no Vercel — decisão 2026-06-24) como o _único_ lugar que fala
com o LLM e com o `service_role`. Esse é o maior delta do projeto, maior que qualquer fase isolada.

```
Browser (chat UI)
   │  POST /api/onboarding (stream)
   ▼
Next Route Handler (Node, Vercel) ── API key Claude (server-only)
   │   ├─ tool-use loop (Claude SDK)
   │   ├─ Zod: valida o structured output
   │   └─ log de invocação (tokens, custo, latência) → ai_invocacoes
   ▼
Supabase (service_role no servidor)
   ├─ profissionais / profissional_servicos   (Fase 1 — já existem)
   ├─ eventos                                   (já existe)
   ├─ ai_invocacoes        ← NOVA               (Fase 5)
   └─ embeddings (pgvector) ← NOVA              (Fase 3)
```

### Atenção (Vercel)

- **Timeout serverless:** plano define o limite (Hobby ~10s; Pro ~60s+). Respostas de chat usam
  **streaming** para não esbarrar nisso.
- **Runtime Node**, não Edge — o SDK da Anthropic roda em Node sem fricção.

## Decisão de provider

A Anthropic **não tem API de embeddings** → o provider não é único:

| Camada                          | Escolha                                                                       | Porquê                                                           |
| ------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Extração/classificação (Fase 1) | **Claude Haiku 4.5**                                                          | Barato/rápido, structured output via tool-use; ~90% das chamadas |
| Geração de descrição (Fase 1)   | **Claude Opus 4.8** (ou Sonnet 4.6)                                           | Qualidade do texto que vira portfólio                            |
| Agente sobre Postgres (Fase 2)  | **Claude Sonnet/Haiku** + tool-use                                            | Loop de tool-calling nativo do SDK                               |
| **Embeddings (Fase 3)**         | **Voyage AI** (recomendado pela Anthropic) ou OpenAI `text-embedding-3-small` | Anthropic não oferece; decisão isolada                           |
| Vector store (Fase 3)           | **pgvector no Supabase**                                                      | Zero serviço novo                                                |

## Arquitetura por fase

### Fase 1 — Onboarding conversacional

- Route Handler com **streaming**. LLM faz tool-use: `extrair_perfil(...)`, `sugerir_descricao(...)`,
  validados com **Zod** antes de tocar o banco.
- Persiste no **mesmo par** `profissionais` + `profissional_servicos` que o `/cadastro` usa hoje. O
  form atual ([cadastro/page.js](../app/cadastro/page.js)) vira **fallback**, não é descartado.
- O form já é rico (1–3 serviços com categoria/descrição/Instagram, bio, foto+crop, conta por Magic
  Link). **Maior risco:** a conversa precisa vencer o form em fricção real, não só na demo.
- **Aprendizados:** Prompt Engineering, Structured Outputs, Tool Calling.

### Fase 2 — Marketplace Agent (sobre Postgres)

- **Não** dar SQL livre ao LLM contra produção. Conjunto pequeno de _tools_ read-only parametrizadas
  (`contar_por_categoria`, `bairros_com_menos_oferta`, `perfis_completos`), executadas com um **role
  read-only** dedicado.
- Supabase **MCP** = ferramenta de _desenvolvimento_; em produção o agente usa tool-use do SDK contra
  essas funções seguras.
- **Toca produto?** Descoberta/insight via agente fica do lado _enablement_ (ajuda o admin/pro), não
  vira descoberta central de marketplace sem passar pelo portão de pivô do roadmap.
- **Aprendizados:** Agent Design, Tool Usage, Agent Memory.

### Fase 3 — Busca semântica (RAG)

- `CREATE EXTENSION vector` no Supabase; coluna de embedding em **`profissional_servicos`** (a descrição
  _por serviço_ é a unidade semântica certa — ver memória "Modelo de descrição de serviço").
- Pipeline: ao salvar serviço → gera embedding → index `ivfflat` → busca por similaridade no Route
  Handler.
- **Aprendizados:** RAG, Embedding Pipelines, Retrieval Quality.

### Fase 4 — Evals

- Reusa o **Vitest** já configurado. 50 cenários como fixtures JSON.
- Precisão de classificação = determinística; qualidade de descrição/retrieval = **LLM-as-judge** (Claude).
- Roda em CI → vira regression test. **Sobe na ordem:** logo após a Fase 1 — sem eval, não se sabe se a
  conversa é melhor que o form.
- **Aprendizados:** LLM Evals, Benchmarking, Regression Testing.

### Fase 5 — Observabilidade de IA

- Tabela nova **`ai_invocacoes`** (`modelo`, `tokens_in`/`tokens_out`, `custo`, `latencia`, `sucesso`,
  `eval_score`) seguindo **exatamente** o padrão anônimo + `service_role` da
  [`eventos`](../supabase/migrations/20260618_camada_eventos.sql).
- Exposta numa aba nova do **`/admin`** já existente.
- **Quase de graça** — a fundação de observabilidade de _produto_ (eventos, `/admin`, UTM) já está pronta
  ([observabilidade-spec.md](observabilidade-spec.md)); aqui é a de _IA_ (latência/tokens/custo/erro).
- **Aprendizados:** AI Operations, Observabilidade, Performance Management.

## Sequência recomendada

> Fundação de servidor (Route Handler + segredo + `ai_invocacoes`) → **Fase 1** → **Fase 4** (evals da
> Fase 1) → **Fase 2** → **Fase 3** → **Fase 5** completa.

A da Fase 5 começa parcial já na fundação; a Fase 4 sobe para logo após a Fase 1.

## Faseamento em PRs (pequenos, regra do CLAUDE.md)

1. **PR 0 — Fundação de servidor:** primeiro Route Handler, segredo `ANTHROPIC_API_KEY` (server-only),
   cliente Supabase com `service_role` no servidor, tabela `ai_invocacoes` + log da 1ª chamada.
2. **PR 1 — Fase 1 (onboarding):** chat + tool-use + Zod, persistência no par de tabelas, `/cadastro`
   como fallback.
3. **PR 2 — Fase 4 (evals da Fase 1):** harness Vitest + 50 cenários + LLM-as-judge.
4. **PR 3 — Fase 2 (agente):** tools read-only + role dedicado.
5. **PR 4 — Fase 3 (RAG):** pgvector + pipeline de embedding + busca.
6. **PR 5 — Fase 5 (observabilidade de IA):** aba no `/admin`.

## Riscos e questões em aberto

- **Conflito com a tese de produto:** mantido como frente _paralela_; se alguma fase começar a empurrar
  descoberta central/marketplace, reabrir a decisão no roadmap antes — não deixar a IA pivotar o produto
  por inércia.
- **Custo:** produto é gratuito/comunitário; LLM tem custo marginal. Haiku como default + cap de
  rate-limit no Route Handler. Medir desde o PR 0.
- [ ] Provider de embeddings: Voyage vs. OpenAI — decidir no PR 4 (Fase 3), não antes.
- [ ] Modelo de geração da descrição: Opus 4.8 vs. Sonnet 4.6 — calibrar com os evals (PR 2).
- [ ] Onboarding por chat realmente reduz fricção vs. o form atual? — a Fase 4 responde com número.
