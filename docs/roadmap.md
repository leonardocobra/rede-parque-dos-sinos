# Roadmap — A Rede

> Tracker de produto do projeto (não há Jira/Linear; o tracker é esta pasta `docs/` + a memória).
> Formato **Now / Next / Later** — themes e outcomes, não tarefas. Atualizado em 2026-09-05.
> Capacidade: **1 pessoa** (Leonardo). "Later" é genuinamente depois — o gargalo é tempo.

## Tese de produto (2026-06-20)

**A Rede é um produto de _enablement_, não um marketplace — ainda.** O propósito é dar ao
profissional autônomo local um posicionamento digital que ele não consegue construir sozinho. O
marketplace de 2 lados é o **destino**, não o ponto de partida.

```
ENABLEMENT  ──ponte──▶  REFERRAL HIPERLOCAL  ──portão──▶  MARKETPLACE
(on-ramp)               (canal de aquisição               (destino)
                         orgânico)
```

- **Enablement (on-ramp):** perfil compartilhável + clicável, prova social, coaching (score de
  maturidade). Faz o pro _parecer legítimo_ e _converter melhor_.
- **Referral hiperlocal (a ponte):** o valor que o pro **não consegue sozinho** é cliente novo que
  ele não conhece. A fonte hiperlocal disso é a indicação — hoje verbal e efêmera ("você conhece um
  bom encanador?"). **A Rede é o trilho que torna o referral persistente e clicável.** O
  protagonista do compartilhamento é o **morador indicando um pro de confiança para um vizinho** —
  não (só) o pro se autopromovendo.
- **Marketplace (destino):** não se dá cold-start nele; ele **cristaliza do grafo de referral**
  quando há liquidez. O **portão de pivô** é mensurável: quando moradores começarem a chegar
  _buscando_ (intenção de demanda — tráfego direto/orgânico ao catálogo) e não só via link de
  referral de um pro, a demanda existe por conta própria e o marketplace deixa de ser aposta.

**Métrica-norte deste estágio** (substitui "views" e "maturidade" como sinal principal do `/admin`):

> Quantos profissionais tiveram o próprio perfil **compartilhado** este mês, e **quantos contatos**
> isso gerou _para eles_.

**Por que enablement antes de marketplace, dada a capacidade de 1 pessoa:** liquidez hiperlocal com
1 pessoa e produto gratuito é brutal — no marketplace, o Leonardo seria o motor de demanda para
sempre. No enablement→referral, a aquisição é **descentralizada** (cada morador satisfeito é uma
fonte) e o sistema anda pelas redes da própria comunidade. Isso escala com 1 pessoa; o marketplace
prematuro não.

## Status geral

O backlog técnico documentado está **concluído**: auth P0 + fast-follows P1 entregues, e a
infraestrutura (Vitest, ESLint, Prettier, Tailwind) configurada. A camada de eventos/medição é a
fundação compartilhada. A fase atual é **crescimento via enablement→referral**, reordenada
(2026-06-20) em torno do loop de indicação hiperlocal.

### Lacuna de execução (2026-06-24 → 2026-09-05)

**73 dias sem nenhum commit em nenhuma branch.** O último dia de trabalho (2026-06-24) concentrou
10 PRs (#73–#82) — **todos do AI Native Lab**, a frente explicitamente declarada como _paralela de
portfólio, não pivô_. A frente principal parou no mesmo dia.

O próximo passo real do roadmap era, e continua sendo, o item **#0 — Validação na mão**: o único
item sem código. Ele não foi feito. A energia migrou para o que era codável. Isso é fuga da
validação, e o item validado é a **suposição-mãe do modelo inteiro** (ver Riscos).

> **Regra adotada (2026-09-05):** enquanto a validação #0 não tiver resultado, nenhuma frente nova
> entra no Now — nem AI Lab, nem SEO, nem features de catálogo.

## Entregue (Done)

| Item                                                                                                                                                                                                | Tema                        |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Rebrand "A Rede" (marca-mãe, bairro = contexto) — `app/brand.js`                                                                                                                                    | Marca                       |
| Perfil público SSR `/profissional/[id]` + OG image                                                                                                                                                  | Crescimento/SEO             |
| SEO técnico (sitemap, robots, JSON-LD, metadataBase)                                                                                                                                                | Crescimento/SEO             |
| Compartilhamento (botão WhatsApp, páginas de categoria)                                                                                                                                             | Crescimento                 |
| Auth Magic Link + `/painel` (edição, claim, métricas, selos)                                                                                                                                        | Oferta                      |
| Descrição por serviço + múltiplos serviços                                                                                                                                                          | Catálogo                    |
| Itens/subserviços no perfil — migration + painel + render público (PRs #41/#42/#43)                                                                                                                 | Catálogo/Oferta             |
| Painel como shell de módulos (navegação por pílulas)                                                                                                                                                | Oferta/Plataforma           |
| Camada de eventos própria (tabela `eventos`, first-touch UTM por sessão)                                                                                                                            | Plataforma/Medição          |
| Infra: Vitest, ESLint, Prettier, Tailwind                                                                                                                                                           | Plataforma                  |
| Métricas de referral no `/admin` (métrica-norte) + bloco de indicações no `/painel` (PRs #60/#62)                                                                                                   | Medição/Referral            |
| OG image do perfil com foto real e sinais de confiança (PRs #56/#57/#58/#59)                                                                                                                        | Referral                    |
| **Fundação de SEO fase 2** — `/catalogo` SSR, links crawláveis + JSON-LD ItemList, páginas serviço × bairro, assistente de Google Business Profile (PRs #66–#69)                                    | Crescimento/SEO             |
| **AI Native Lab fases 1–5** — fundação de servidor, onboarding conversacional, agente sobre Postgres, RAG/pgvector + embeddings Voyage, harness de evals, observabilidade no `/admin` (PRs #73–#82) | Frente paralela (portfólio) |
| Busca semântica como fallback no catálogo, com threshold (PR #82)                                                                                                                                   | Catálogo/IA                 |

## Now (validar o trilho — sem código)

O trilho de indicação **já está construído**. O que falta não é feature: é saber se ele é usado.
Tráfego central (SEO, ads) segue _Later_ — fica melhor quanto mais perfis ricos já existirem.

| #   | Item                                                                                                                      | Status                             | Por quê                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| 0   | **Validação na mão** — 2 pros reais, ~2 semanas, observar se o morador compartilha **espontaneamente**, sem ser empurrado | **Not Started** (desde 2026-06-21) | Suposição-mãe do modelo. Tudo depois disso é aposta cega         |
| 1   | **Decisões de produto** — logo definitiva, critério do selo Verificado                                                    | **Not Started**                    | Custo ~1h, só dependem do Leonardo, paradas desde junho          |
| 2   | **Dívida operacional** — rodar o reembed `?forcar=true` em `/api/admin/gerar-embeddings` pós-deploy do PR #82             | **Blocked** (esquecido em 24/06)   | Busca semântica pode estar em prod com embeddings desatualizados |
| —   | ~~Compartilhar perfil em 1 toque~~                                                                                        | ✅ Done                            | `BotoesCompartilhar` / `DivulgarPorCanal` — duas superfícies     |
| —   | ~~OG/preview com selo da Rede~~                                                                                           | ✅ Done                            | PR #56                                                           |
| —   | ~~Clique-pra-WhatsApp pré-preenchido~~                                                                                    | ✅ Done                            | Instrumentado após o fix do CHECK de `eventos.tipo` (PR #70)     |

> **A suposição mais arriscada, agora sem desculpa de infraestrutura:** o modelo repousa em o
> morador/cliente **efetivamente compartilhar**. Se compartilham espontaneamente → há produto. Se
> precisam ser empurrados toda vez → o problema é proposta de valor, não feature. As features de
> share existem há 2 meses; o que não existe é o dado.

## Cenário competitivo (2026-09-05)

**Connect+ — `appconnectplus.com.br`** — mesmo formato, **mesma cidade**. Villa Branca é bairro de
Jacareí, igual ao Parque dos Sinos.

|                   | A Rede                                 | Connect+                                                       |
| ----------------- | -------------------------------------- | -------------------------------------------------------------- |
| Alcance           | 1 bairro                               | **5 bairros** (SJC + Jacareí), subdomínio por bairro           |
| Oferta            | Profissionais autônomos                | Lojas físicas + serviços + eventos + classificados + promoções |
| Densidade alegada | dezenas                                | **+5.000 comércios**                                           |
| Monetização       | gratuito (anti-escopo explícito)       | **Freemium: Grátis / Prata R$29,90 / Ouro R$60 + patrocínio**  |
| Demanda           | referral morador→vizinho               | captura de e-mail do morador + ofertas como isca               |
| Prova social      | avaliações, selo, painel com analytics | **nenhuma**                                                    |
| Referral          | trilho de indicação instrumentado      | **nenhum**                                                     |

**Leitura:**

1. **Valida a tese de bairro e mata o conforto do "sou o único".** Alguém monetiza o formato a ~15 km
   de distância, com expansão multi-bairro já rodando.
2. **Eles pegaram o problema fácil; A Rede pegou o difícil — e isso é a favor.** "+5.000 comércios"
   com categorias no estilo Google Business é catálogo raspado do Maps. Loja tem endereço fixo e já
   existe em base pública. **Autônomo não existe em base nenhuma** — é exatamente por isso que o
   enablement tem valor. Catálogo raspado é largo e morto; o nosso é estreito e vivo.
3. **O fosso da Rede é confiança, e eles não têm nada disso.** Mas fosso não vale nada sobre catálogo
   vazio — o que devolve a prioridade ao item #0.

**Não** reagir puxando itens do Later (orçamento estruturado, marketplace, PR D). O gatilho deles é
adoção, e adoção é justamente o que a validação #0 vai revelar se existe.

## Next (1–3 meses — fechar o loop de referral)

> **Status (2026-09-05):** todo o Next original está entregue. A validação na mão foi **promovida ao
> Now** — é o gargalo, não um "próximo". O Next fica deliberadamente **vazio até a validação #0
> retornar um resultado**: o que entra aqui depende inteiramente de o morador compartilhar ou não.
>
> - **Se compartilha espontaneamente** → o canal orgânico liga. Next = densidade de perfis no Parque
>   dos Sinos (recrutamento de pros) + share por item, cujo gatilho de adoção passa a ser plausível.
> - **Se precisa ser empurrado** → o problema é proposta de valor. Next = voltar à tese, não à
>   feature. Reabrir o que o pro ganha de concreto (e reavaliar o anti-escopo "gratuito").

| #   | Item                                              | Por quê                                                                                   |
| --- | ------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 0   | ~~**Validação na mão**~~ → **movido para o Now**  | Não é "próximo": é o gargalo atual                                                        |
| 1   | ~~**Gancho de referral no fim da avaliação**~~ ✅ | Entregue em `app/avaliar/page.js` — card de indicação pós-envio com `share_pos_avaliacao` |
| 2   | ~~**"Peça uma avaliação"** no `/painel`~~ ✅      | Entregue — componente `PedirAvaliacao` em `PainelClient.js`                               |
| 4   | ~~**Observabilidade & Analytics — fase 1**~~ ✅   | Entregue — `/admin` + analytics por pro no `/painel`                                      |
| 5   | ~~**Score de maturidade digital**~~ ✅            | Entregue — pílula Presença + distribuição no `/admin`                                     |

## Later (direcional — exige gatilho ou decisão)

| Item                                                                                                                                      | Gatilho                                                                                                                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Orçamento estruturado** (form: serviço, bairro, descrição, foto, urgência → entrega assíncrona ao pro)                                  | **Volume de demanda** que valha capturar/medir. É o **artefato-ponte para o marketplace** — onde A Rede começa a _possuir dados de demanda_ (o que se pede, em que bairro, o que fica sem resposta). Construir hoje é instrumentar demanda inexistente |
| **Pivô para marketplace** (matching/agregação de demanda, descoberta central)                                                             | **Portão de pivô:** moradores chegando com _intenção de demanda_ (tráfego direto/orgânico ao catálogo buscando), não só via link de referral                                                                                                           |
| **Tráfego central — SEO de categoria/bairro + (depois) gestão de campanhas como serviço**                                                 | Densidade de perfis ricos (o conteúdo dos pros é a superfície de SEO); a venda de "campanhas como serviço" exige antes provar que A Rede converte audiência em contato                                                                                 |
| **PR D — vitrine de itens no catálogo** (itens no card + selo "a partir de R$")                                                           | **≥5 profissionais com ≥1 item** (decisão 2026-06-19) — sem adoção, o sinal aparece sobre catálogo vazio                                                                                                                                               |
| **Share por item/serviço** ("olha esse serviço") — URL com âncora/parâmetro de item, mensagem contextualizada, `share_item` instrumentado | **≥5 profissionais com ≥1 item** (decisão 2026-06-21) — hoje o share é só do perfil; sem itens adotados, o feature é invisível. Mesmo gatilho do PR D                                                                                                  |
| **Observabilidade & Analytics — fase 2** (mesma engine exposta por profissional)                                                          | Após a fase 1 validar o motor com o Leonardo como piloto; decisão de serviço Python só aqui                                                                                                                                                            |
| **Checkout + pagamento no app**                                                                                                           | **Decisão estratégica explícita** — conflita com o anti-escopo "gratuito e da comunidade"                                                                                                                                                              |
| OTP de WhatsApp → selo Verificado automático                                                                                              | Sobre a infra de auth atual                                                                                                                                                                                                                            |
| Resposta a avaliações pelo profissional                                                                                                   | Fast-follow de produto                                                                                                                                                                                                                                 |
| Expansão por bairro ("A Rede — [bairro]")                                                                                                 | Provar densidade no Parque dos Sinos primeiro                                                                                                                                                                                                          |

## Riscos e dependências

- **Suposição-mãe do modelo:** o referral só existe se o morador compartilhar. Se não compartilhar
  espontaneamente, o canal de aquisição orgânico não liga e o Leonardo volta a ser o gerador manual
  de demanda. **Validar barato antes de construir as features de share** (ver nota no Now).
- **Otimizar a perna perfil→contato como métrica central é ruído neste estágio** — com tráfego
  negligível, a diferença entre 5% e 20% de conversão são 1–2 cliques. O clique-pra-WhatsApp entra
  no Now como _trilho de atribuição_, não como otimização de funil.
- **Checkout (1b)** conflita com a tese comunitária documentada. É pivô de modelo de negócio, não
  feature. Decisão tomada (2026-06-18): não bundlar; estudar separadamente.
- **Capacidade = 1 pessoa.** Para cada item que entra em "Now", algo sai.
- **Relógio de densidade no Parque dos Sinos (novo, 2026-09-05).** O Connect+ opera 5 bairros na
  mesma região e já monetiza. Se chegar ao Parque dos Sinos com catálogo raspado antes de A Rede ter
  densidade, ocupa o mindshare do bairro com um produto pior. Isso **não** antecipa a expansão por
  bairro (segue Later) — cria urgência em _profundidade aqui_, não em largura.
- **Risco de execução (novo, 2026-09-05): fuga da validação para o codável.** O padrão já ocorreu uma
  vez — 73 dias parados após 10 PRs de uma frente paralela, com o item não-código intocado. A
  mitigação é a regra do Status geral: nenhuma frente nova no Now antes do resultado do #0.

## Decisões tomadas (2026-09-05)

- [x] **Validação na mão promovida ao Now; Next fica vazio até ela retornar.** O trilho de share está
      construído há 2 meses — o que falta é o dado, não a feature.
- [x] **Congelamento de frentes novas** enquanto o #0 não tiver resultado (inclui AI Lab, SEO fase 3 e
      itens de catálogo). Mitigação explícita do padrão de fuga da validação.
- [x] **Registrado o concorrente direto Connect+** (`appconnectplus.com.br`) — mesmo formato, mesma
      cidade, 5 bairros, freemium R$29,90/R$60. Reforça a tese de enablement (eles catalogam lojas
      raspáveis; A Rede habilita autônomos que não existem em base nenhuma) e cria o **relógio de
      densidade** no Parque dos Sinos.
- [x] **Não reagir ao Connect+ puxando itens do Later.** Os gatilhos de adoção continuam válidos.
- [x] **Roadmap reconciliado com o entregue:** Fundação de SEO fase 2 (#66–#69) e AI Native Lab fases
      1–5 (#73–#82) estavam em produção sem registro aqui.

## Decisões tomadas (2026-06-24)

- [x] **AI Native Lab = frente _paralela_ de portfólio, não pivô.** Lab de IA aplicada (onboarding
      conversacional, agente sobre Postgres, RAG, evals, observabilidade de IA) sobre A Rede, medindo
      aprendizado/portfólio — **não** monetização. Não altera a tese `enablement→referral→marketplace`;
      a IA serve ao enablement. Spec: `docs/ai-native-lab-arquitetura.md`.
- [x] **Provider e runtime:** Claude (Haiku 4.5 extração / Opus 4.8 geração) + embeddings de terceiro
      (Voyage/OpenAI — Anthropic não tem) + pgvector no Supabase; chamadas LLM em Route Handlers no
      Vercel (Node), API key server-only. O maior delta é a camada de servidor que o app ainda não tem.

## Decisões tomadas (2026-06-21)

- [x] **Share por item/serviço → Later** com gatilho igual ao PR D (≥5 profissionais com ≥1 item).
      Hoje o share é só do perfil (`/profissional/[id]`); sem adoção de itens o feature é invisível.
- [x] **Next totalmente entregue:** gancho pós-avaliação, "peça uma avaliação", analytics fase 1+2 e
      score de maturidade todos em produção. Próximo passo real é a validação na mão (sem código).

## Decisões tomadas (2026-06-20)

- [x] **Identidade: enablement, não marketplace.** Marketplace é destino, não ponto de partida.
- [x] **A ponte é o referral hiperlocal** (cliente → vizinho) como canal de aquisição orgânico; o
      protagonista do share é o morador indicando, não só o pro se autopromovendo.
- [x] **Portão de pivô para marketplace explícito:** moradores chegando com intenção de demanda.
- [x] **Métrica-norte do `/admin`:** profissionais com perfil compartilhado no mês + contatos
      gerados para eles (substitui views/maturidade como sinal principal).
- [x] **Orçamento estruturado é Later** (artefato-ponte para o marketplace), não Now — agora basta o
      clique-pra-WhatsApp pré-preenchido com contexto do item (semi-estruturado, sem fricção).
- [x] **Avaliação reposicionada como artefato de referral** — pedido no painel; gancho de indicação
      no fim do fluxo de avaliação.

## Decisões tomadas (2026-06-19)

- [x] **Frente 1a entregue** (A: migration · B: painel/itens + shell de pílulas · C: render no perfil —
      PRs #41/#42/#43 mergeados).
- [x] **Painel vira shell de módulos** (navegação por pílulas).
- [x] **Layout dos itens no perfil: híbrido + carrossel.**
- [x] **PR D pausado por gatilho de adoção** (≥5 profs com ≥1 item).

## Decisões tomadas (2026-06-18)

- [x] **Frente 1: construir 1a (itens/subserviços) agora; checkout (1b) vira estudo estratégico futuro.**
- [x] **Persistir o roadmap** como artefato versionado + uma spec por frente nova.
- [x] **Fundir a antiga Frente 2b na Frente 3** como fase 2: motor único de analytics, Leonardo como
      piloto (tenant zero) na fase 1.

## Decisões em aberto (para o Leonardo)

- [ ] Logo definitiva (a sigla "AR" é placeholder) — ver `docs/posicionamento-marca.md`.
- [ ] Critério do selo Verificado manual — ver `docs/autenticacao-e-selo.md`.
- [ ] Quando abrir o 2º bairro (recomendação: após densidade no Parque dos Sinos).
- [ ] Frente 1b (checkout): seguir ou não com pagamento no app — decisão de modelo de negócio.
- [ ] Revisar redirect do Magic Link em produção (Vercel) — cliente já migrado para `@supabase/ssr`.
