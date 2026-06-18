# Roadmap — A Rede

> Tracker de produto do projeto (não há Jira/Linear; o tracker é esta pasta `docs/` + a memória).
> Formato **Now / Next / Later** — themes e outcomes, não tarefas. Atualizado em 2026-06-18.
> Capacidade: **1 pessoa** (Leonardo). "Later" é genuinamente depois — o gargalo é tempo.

## Status geral

O backlog técnico documentado está **concluído**: auth P0 + fast-follows P1 entregues, e a
infraestrutura (Vitest, ESLint, Prettier, Tailwind) configurada. O que resta do ciclo anterior é
**P2 (deliberadamente adiado)** e **decisões de produto em aberto**. A próxima fase é de
crescimento, organizada em 3 frentes novas — duas delas compartilham uma fundação comum
(camada de eventos/medição).

## Entregue (Done)

| Item | Tema |
| --- | --- |
| Rebrand "A Rede" (marca-mãe, bairro = contexto) — `app/brand.js` | Marca |
| Perfil público SSR `/profissional/[id]` + OG image | Crescimento/SEO |
| SEO técnico (sitemap, robots, JSON-LD, metadataBase) | Crescimento/SEO |
| Compartilhamento (botão WhatsApp, páginas de categoria) | Crescimento |
| Auth Magic Link + `/painel` (edição, claim, métricas, selos) | Oferta |
| Descrição por serviço + múltiplos serviços | Catálogo |
| Infra: Vitest, ESLint, Prettier, Tailwind | Plataforma |

## A fundação compartilhada (pré-requisito de Now)

```
        ┌─ Frente 3 (observabilidade admin)
Camada  ├─ Frente 2b (analytics por profissional, UTM, cohorts)
de      └─ Frente 2a (score, parte "dados de canal")
eventos
(profile views por origem/UTM, cliques de contato WhatsApp,
 passos do funil — registrados no Supabase)
```

Construir **uma vez** a camada de eventos/UTM destrava três entregas. Fazê-la primeiro evita
reconstruir instrumentação três vezes. Cumpre o princípio #7 de `crescimento-catalogo.md`
("sem medição é chute").

## Now (fundação + destravar)

| Item | Por quê |
| --- | --- |
| **Camada de eventos/medição** (profile views por origem, cliques WhatsApp, funil, UTM) | Fundação compartilhada das Frentes 2 e 3 |
| Resolver instabilidade do Magic Link (Vercel redirect / SMTP) | Desbloqueia login E2E (hoje At Risk) |
| Decisões de produto (logo definitiva, critério do selo Verificado) | Baratas; só dependem do Leonardo |

## Next (1–3 meses, sobre a fundação)

Ordem definida com o Leonardo (2026-06-18):

| # | Item | Frente | Spec | Valor/Esforço |
| --- | --- | --- | --- | --- |
| 1 | **Itens/subserviços no perfil** (foto, descrição, preço opcional, disponibilidade/estoque) | 1a | `docs/perfil-itens-spec.md` | Alto / Médio |
| 2 | **Observabilidade admin** (comportamento dos profissionais, performance, conversão da jornada) | 3 | `docs/observabilidade-spec.md` | Alto / Médio |
| 3 | **Score de maturidade digital** (diagnóstico + próximos passos no painel) | 2a | `docs/crescimento-score-analytics-spec.md` | Alto / Baixo-Médio |

## Later (direcional, exige decisão)

| Item | Frente | Gatilho |
| --- | --- | --- |
| Analytics Python (UTM, gestão de canais, cohorts, conversão por canal) | 2b | Após a camada de eventos provar valor; só se Vercel Analytics for insuficiente |
| **Checkout + pagamento no app** | 1b | **Decisão estratégica explícita** — conflita com o anti-escopo "gratuito e da comunidade" |
| OTP de WhatsApp → selo Verificado automático | Auth fase 3 | Sobre a infra de auth atual |
| Resposta a avaliações pelo profissional | Auth fase 3 | Fast-follow de produto |
| Expansão por bairro ("A Rede — [bairro]") | Marca | Provar densidade em 1 bairro primeiro |

## Riscos e dependências

- **1b (checkout)** conflita com a tese comunitária documentada (`painel-profissional-spec.md`,
  `interface-profissional.md`: "agenda/orçamento/pagamento → vira outro produto"). É um pivô de
  modelo de negócio, não uma feature. **Decisão tomada (2026-06-18): construir 1a agora e estudar
  1b separadamente depois — não bundlar.**
- **2b (Python)** adiciona um runtime fora do stack Next/Vercel/Supabase. Só justifica depois que a
  camada de eventos mostrar que o Vercel Analytics + Supabase são insuficientes.
- **Capacidade = 1 pessoa.** Para cada item que entra em "Now", algo sai. Por isso a fundação primeiro.

## Decisões tomadas (2026-06-18)

- [x] **Frente 1: construir 1a (itens/subserviços) agora; checkout (1b) vira estudo estratégico futuro.**
- [x] **Primeira prioridade de Next: itens no perfil (Frente 1a).**
- [x] **Persistir o roadmap** como artefato versionado + uma spec por frente nova.

## Decisões em aberto (para o Leonardo)

- [ ] Logo definitiva (a sigla "AR" é placeholder) — ver `docs/posicionamento-marca.md`.
- [ ] Critério do selo Verificado manual — ver `docs/autenticacao-e-selo.md`.
- [ ] Quando abrir o 2º bairro (recomendação: após densidade no Parque dos Sinos).
- [ ] Frente 1b (checkout): seguir ou não com pagamento no app — decisão de modelo de negócio.
