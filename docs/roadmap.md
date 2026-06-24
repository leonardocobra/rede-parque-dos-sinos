# Roadmap — A Rede

> Tracker de produto do projeto (não há Jira/Linear; o tracker é esta pasta `docs/` + a memória).
> Formato **Now / Next / Later** — themes e outcomes, não tarefas. Atualizado em 2026-06-20.
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
  maturidade). Faz o pro *parecer legítimo* e *converter melhor*.
- **Referral hiperlocal (a ponte):** o valor que o pro **não consegue sozinho** é cliente novo que
  ele não conhece. A fonte hiperlocal disso é a indicação — hoje verbal e efêmera ("você conhece um
  bom encanador?"). **A Rede é o trilho que torna o referral persistente e clicável.** O
  protagonista do compartilhamento é o **morador indicando um pro de confiança para um vizinho** —
  não (só) o pro se autopromovendo.
- **Marketplace (destino):** não se dá cold-start nele; ele **cristaliza do grafo de referral**
  quando há liquidez. O **portão de pivô** é mensurável: quando moradores começarem a chegar
  *buscando* (intenção de demanda — tráfego direto/orgânico ao catálogo) e não só via link de
  referral de um pro, a demanda existe por conta própria e o marketplace deixa de ser aposta.

**Métrica-norte deste estágio** (substitui "views" e "maturidade" como sinal principal do `/admin`):
> Quantos profissionais tiveram o próprio perfil **compartilhado** este mês, e **quantos contatos**
> isso gerou *para eles*.

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
| Camada de eventos própria (tabela `eventos`, first-touch UTM por sessão) | Plataforma/Medição |
| Infra: Vitest, ESLint, Prettier, Tailwind | Plataforma |

## Now (o loop de enablement→referral)

O objetivo do Now é montar **o trilho de indicação** e deixar **um** perfil genuinamente
compartilhável e convertendo antes de qualquer esforço de tráfego. Tráfego central (SEO, ads) é
*Later* — fica melhor quanto mais perfis ricos já existirem; construir agora é otimizar casa vazia.

| Item | Por quê |
| --- | --- |
| **Compartilhar perfil em 1 toque** — dois atos distintos: **pro → própria audiência** ("meu cartão digital") e, prioritário, **morador → vizinho** ("indico esse profissional"). Mesmo botão, cópia e intenção opostas. | Motor de aquisição orgânico (referral) |
| **OG/preview de link impecável com o selo da Rede** (nome, foto, serviço) | Faz a indicação *parecer confiável* no preview do WhatsApp — infraestrutura que faz o referral converter |
| **Clique-pra-WhatsApp pré-preenchido** incluindo o nome do item/serviço de contexto e referenciando a Rede ("Vi seu perfil na Rede, quero orçamento de X") | Lead semi-estruturado de graça (sem fricção de form) **e** atribuível — o pro *vê* o contato chegar via Rede, o que faz ele valorizar o trilho |
| **Decisões de produto** (logo definitiva, critério do selo Verificado) | Baratas; só dependem do Leonardo |

> **Validar antes de investir nas features de share — a suposição mais arriscada:** o modelo repousa
> em o morador/cliente **efetivamente compartilhar**. Testar barato, na unha, com 1–2 pros e seus
> clientes, antes de polir o fluxo. Se compartilham espontaneamente → há produto. Se precisam ser
> empurrados toda vez → o problema é proposta de valor, não feature.

## Next (1–3 meses — fechar o loop de referral)

> **Status (2026-06-21):** itens 1 e 2 já entregues. Item 3 movido para Later (gatilho de adoção).
> Validação na mão (#0 abaixo) é o próximo passo real — sem código.

| # | Item | Por quê |
| --- | --- | --- |
| 0 | **Validação na mão** — testar com 1–2 pros reais se o morador compartilha espontaneamente, sem ser empurrado | Suposição mais arriscada do modelo; barata de testar antes de qualquer nova feature |
| 1 | ~~**Gancho de referral no fim da avaliação**~~ ✅ | Entregue em `app/avaliar/page.js` — card de indicação pós-envio com `share_pos_avaliacao` |
| 2 | ~~**"Peça uma avaliação"** no `/painel`~~ ✅ | Entregue — componente `PedirAvaliacao` em `PainelClient.js` |
| 4 | ~~**Observabilidade & Analytics — fase 1**~~ ✅ | Entregue — `/admin` + analytics por pro no `/painel` |
| 5 | ~~**Score de maturidade digital**~~ ✅ | Entregue — pílula Presença + distribuição no `/admin` |

## Later (direcional — exige gatilho ou decisão)

| Item | Gatilho |
| --- | --- |
| **Orçamento estruturado** (form: serviço, bairro, descrição, foto, urgência → entrega assíncrona ao pro) | **Volume de demanda** que valha capturar/medir. É o **artefato-ponte para o marketplace** — onde A Rede começa a *possuir dados de demanda* (o que se pede, em que bairro, o que fica sem resposta). Construir hoje é instrumentar demanda inexistente |
| **Pivô para marketplace** (matching/agregação de demanda, descoberta central) | **Portão de pivô:** moradores chegando com *intenção de demanda* (tráfego direto/orgânico ao catálogo buscando), não só via link de referral |
| **Tráfego central — SEO de categoria/bairro + (depois) gestão de campanhas como serviço** | Densidade de perfis ricos (o conteúdo dos pros é a superfície de SEO); a venda de "campanhas como serviço" exige antes provar que A Rede converte audiência em contato |
| **PR D — vitrine de itens no catálogo** (itens no card + selo "a partir de R$") | **≥5 profissionais com ≥1 item** (decisão 2026-06-19) — sem adoção, o sinal aparece sobre catálogo vazio |
| **Share por item/serviço** ("olha esse serviço") — URL com âncora/parâmetro de item, mensagem contextualizada, `share_item` instrumentado | **≥5 profissionais com ≥1 item** (decisão 2026-06-21) — hoje o share é só do perfil; sem itens adotados, o feature é invisível. Mesmo gatilho do PR D |
| **Observabilidade & Analytics — fase 2** (mesma engine exposta por profissional) | Após a fase 1 validar o motor com o Leonardo como piloto; decisão de serviço Python só aqui |
| **Checkout + pagamento no app** | **Decisão estratégica explícita** — conflita com o anti-escopo "gratuito e da comunidade" |
| OTP de WhatsApp → selo Verificado automático | Sobre a infra de auth atual |
| Resposta a avaliações pelo profissional | Fast-follow de produto |
| Expansão por bairro ("A Rede — [bairro]") | Provar densidade no Parque dos Sinos primeiro |

## Riscos e dependências

- **Suposição-mãe do modelo:** o referral só existe se o morador compartilhar. Se não compartilhar
  espontaneamente, o canal de aquisição orgânico não liga e o Leonardo volta a ser o gerador manual
  de demanda. **Validar barato antes de construir as features de share** (ver nota no Now).
- **Otimizar a perna perfil→contato como métrica central é ruído neste estágio** — com tráfego
  negligível, a diferença entre 5% e 20% de conversão são 1–2 cliques. O clique-pra-WhatsApp entra
  no Now como *trilho de atribuição*, não como otimização de funil.
- **Checkout (1b)** conflita com a tese comunitária documentada. É pivô de modelo de negócio, não
  feature. Decisão tomada (2026-06-18): não bundlar; estudar separadamente.
- **Capacidade = 1 pessoa.** Para cada item que entra em "Now", algo sai.

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
