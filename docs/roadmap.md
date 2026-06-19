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
| Itens/subserviços no perfil — migration + painel + render público (PRs #41/#42/#43) | Catálogo/Oferta |
| Painel como shell de módulos (navegação por pílulas) | Oferta/Plataforma |
| Infra: Vitest, ESLint, Prettier, Tailwind | Plataforma |

## A fundação compartilhada (pré-requisito de Now)

```
        ┌─ Frente 3 fase 1 (admin / Leonardo como piloto)
Camada  ├─ Frente 3 fase 2 (mesma engine, escopo por profissional — ex-2b)
de      └─ Frente 2a (score, parte "dados de canal")
eventos
(profile views por origem/UTM, cliques de contato WhatsApp,
 passos do funil — registrados no Supabase)
```

Construir **uma vez** a camada de eventos/UTM destrava tudo. Fazê-la primeiro evita reconstruir
instrumentação. Cumpre o princípio #7 de `crescimento-catalogo.md` ("sem medição é chute").

**Decisão (2026-06-18):** a antiga Frente 2b (analytics por profissional) vira **fase 2 da Frente
3** — mesmo motor de analytics, com o Leonardo como **piloto (tenant zero)** primeiro. Uma vez
validada, a mesma engine é exposta por profissional. Isso remove a dependência de já existir
tráfego, e a decisão de serviço Python só se coloca na hora de replicar para os profissionais.

## Now (fundação + destravar)

| Item | Por quê |
| --- | --- |
| **Camada de eventos/medição** (profile views por origem, cliques WhatsApp, funil, UTM) | Fundação compartilhada das Frentes 2 e 3 |
| Resolver instabilidade do Magic Link (Vercel redirect / SMTP) | Desbloqueia login E2E (hoje At Risk) |
| Decisões de produto (logo definitiva, critério do selo Verificado) | Baratas; só dependem do Leonardo |

## Next (1–3 meses, sobre a fundação)

Ordem revista com o Leonardo (2026-06-19): a Frente 1a (itens) foi entregue (A/B/C, PRs #41/#42/#43).
O **PR D** (vitrine de itens no catálogo) foi **deliberadamente pausado** — depende de adoção, não de
código (ver gatilho abaixo). Próxima prioridade migra para medição/score.

| # | Item | Frente | Spec | Valor/Esforço |
| --- | --- | --- | --- | --- |
| 1 | **Observabilidade & Analytics — fase 1** (motor único; Leonardo como piloto: comportamento da oferta, jornada/conversão, canais/UTM, performance) | 3 | `docs/observabilidade-spec.md` | Alto / Médio |
| 2 | **Score de maturidade digital** (diagnóstico + próximos passos no painel) | 2a | `docs/crescimento-score-analytics-spec.md` | Alto / Baixo-Médio |
| 3 | **PR D — vitrine de itens no catálogo** (itens no card expandido + selo "a partir de R$" no card colapsado) | 1a | `docs/perfil-itens-spec.md` (P0.4) | Médio / S–M |

> **PR D — gatilho de adoção (decisão 2026-06-19):** só fazer quando **≥5 profissionais tiverem ≥1
> item**. Sem adoção, o sinal aparece sobre catálogo vazio e não há conversão a medir (a leitura de
> eventos de 2026-06-19 mostrou base mínima e 0 itens). O render do PR C já cobre o perfil; o card
> expandido do catálogo fica quase de graça (a query do catálogo passa a trazer `profissional_itens`).
> P1 do PR D (lightbox de foto, reordenar itens por arraste) segue como Later.

## Later (direcional, exige decisão)

| Item | Frente | Gatilho |
| --- | --- | --- |
| **Observabilidade & Analytics — fase 2** (mesma engine exposta por profissional; UTM/canais/cohorts no painel do profissional) | 3 fase 2 (ex-2b) | Após a fase 1 validar o motor com o Leonardo como piloto; decisão de serviço Python só aqui |
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

## Decisões tomadas (2026-06-19)

- [x] **Frente 1a entregue** (A: migration · B: painel/itens + shell de pílulas · C: render no perfil —
      PRs #41/#42/#43 mergeados).
- [x] **Painel vira shell de módulos** (navegação por pílulas): módulos futuros (score, desempenho,
      avaliações) entram como mais uma pílula, sem refatorar.
- [x] **Layout dos itens no perfil: híbrido + carrossel** — carrossel com foto quando há fotos; lista
      de texto quando não há; nada quando não há itens.
- [x] **PR D pausado por gatilho de adoção** (≥5 profs com ≥1 item) — o gargalo agora é adoção/tráfego,
      não código de itens. Próxima prioridade migra para medição (Frente 3 fase 1) / score (2a).

## Decisões tomadas (2026-06-18)

- [x] **Frente 1: construir 1a (itens/subserviços) agora; checkout (1b) vira estudo estratégico futuro.**
- [x] **Primeira prioridade de Next: itens no perfil (Frente 1a).**
- [x] **Persistir o roadmap** como artefato versionado + uma spec por frente nova.
- [x] **Fundir a antiga Frente 2b na Frente 3** como fase 2: motor único de analytics, Leonardo como
      piloto (tenant zero) na fase 1; exposição por profissional depois de validado.

## Decisões em aberto (para o Leonardo)

- [ ] Logo definitiva (a sigla "AR" é placeholder) — ver `docs/posicionamento-marca.md`.
- [ ] Critério do selo Verificado manual — ver `docs/autenticacao-e-selo.md`.
- [ ] Quando abrir o 2º bairro (recomendação: após densidade no Parque dos Sinos).
- [ ] Frente 1b (checkout): seguir ou não com pagamento no app — decisão de modelo de negócio.
