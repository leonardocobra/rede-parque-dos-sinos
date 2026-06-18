# Spec — Observabilidade & Analytics da plataforma (Frente 3)

> PRD. **Frente 3.** Prioridade #2 de Next (`docs/roadmap.md`). **Motor único de analytics** em
> duas fases:
> - **Fase 1 (Next)** — visão da Rede para o **admin/Leonardo como piloto (tenant zero)**.
> - **Fase 2 (Later)** — mesma engine exposta **por profissional** (absorve a antiga Frente 2b).
>
> Liga com: `docs/crescimento-catalogo.md` (princípio "sem medição é chute"),
> `docs/crescimento-score-analytics-spec.md` (a parte "dados de canal" do score vem daqui).

## Por que motor único + piloto

A observabilidade da Rede e o analytics por profissional são **o mesmo motor** lendo a mesma camada
de eventos — só muda o **escopo**: tudo (admin) vs. um `profissional_id` (profissional). Construir
uma engine multi-tenant e usar o **Leonardo como piloto** primeiro:

1. valida o produto **sem depender** de já existir tráfego nos perfis;
2. dá os olhos da operação de imediato (decisão por número, não palpite);
3. adia a decisão de **serviço Python / PostHog** para a hora de replicar a escala — não antes.

## Problem Statement

Hoje o Leonardo **não enxerga** a plataforma: não sabe quem está ativo, quem atualizou o perfil ou
inseriu foto, como está o volume de cadastro por categoria, como as pessoas se movem entre as
páginas, nem quantos visitantes reais existem, por qual canal chegaram (UTM) e qual a conversão da
jornada. Sem isso, toda decisão de produto e crescimento é palpite. A mesma falta atinge o
profissional, que não sabe quantos viram seu perfil por canal nem quantos viraram contato — daí o
motor servir aos dois (fases 1 e 2).

## Goals

### Fase 1 — admin / piloto (Next)

1. **Comportamento da oferta**: visão de quem está ativo, quem atualiza perfil/foto, completude.
2. **Saúde do catálogo**: volume de cadastro por categoria, distribuição de selos, perfis sem foto/itens.
3. **Jornada e conversão**: visitantes reais, conversão entre páginas (home → catálogo → perfil →
   clique de contato).
4. **Canais/UTM**: por qual canal o tráfego chega (Instagram, Google, busca, direto, link
   compartilhado) e como cada canal converte.
5. **Performance da plataforma**: latência e tempo de carregamento de tela (Web Vitals).
6. Tudo **interno** e protegido — só o admin vê.

### Fase 2 — por profissional (Later, ex-2b)

7. **Mesma engine, escopo por `profissional_id`**: o profissional vê quantos viram seu perfil por
   canal (UTM), quantos viraram contato/transação, e cohorts simples — exposto no `/painel`.

## Non-Goals

- **Fase 1 não expõe nada ao profissional** — é a visão da Rede; a exposição por profissional é a fase 2.
- Não substituir ferramentas prontas onde elas bastam (Vercel Analytics/Speed Insights).
- Não construir BI completo; foco nas perguntas operacionais do dia a dia.
- Não decidir **agora** por serviço Python — ver "Sobre processamento pesado" abaixo.

## A camada de eventos (fundação — compartilhada com Frente 2)

Tabela `eventos` (ou uso de ferramenta) registrando, no mínimo:

| Evento | Campos-chave |
| --- | --- |
| `page_view` | rota, origem/UTM, sessão, timestamp |
| `profile_view` | profissional_id, origem/UTM, sessão |
| `contact_click` | profissional_id, canal (whatsapp/instagram), sessão |
| `funnel_step` | etapa (home/catalogo/perfil/contato), sessão |

- Captura **anônima** (sessão sem PII), respeitando a simplicidade do produto.
- Origem/UTM: ler `utm_*` da URL e `document.referrer` na entrada.
- Escrita: rota de API leve (`/api/evento`) com INSERT público restrito, ou ferramenta externa.

> **Decisão de abordagem (a definir):** começar com **Vercel Analytics + tabela `eventos` no
> Supabase** (controle total, custo zero, casa com a fase 2) vs. adotar **PostHog/Plausible**
> (mais rápido, menos controle). Recomendação: tabela própria para os eventos de funil/contato
> (que viram produto na fase 2) + Vercel Analytics/Speed Insights para tráfego e performance.

### Sobre processamento pesado (a decisão do "Python")

> ⚠️ Adicionar um serviço **Python** ao stack Next/Vercel/Supabase é uma decisão relevante (deploy,
> observabilidade, custo, manutenção por 1 pessoa). **Não começar por ele.** A fase 1 (piloto) deve
> rodar sobre **SQL no Supabase + Vercel Analytics**. Só na fase 2 (replicar para N profissionais),
> e só se cohorts/atribuição multi-touch não couberem bem em SQL, avaliar:
> - um **job de materialização** (Vercel Cron / função serverless, em JS ou Python) que lê `eventos`
>   e grava agregados (UTM por canal, cohorts, funil) em tabelas de leitura; ou
> - uma **ferramenta pronta** (PostHog, Plausible com UTM) antes de construir.

## Requirements

### Fase 1 — Must-Have (P0)

- **P0.1 Camada de eventos** (tabela + captura de page/profile view, contact click, UTM). Fundação.
- **P0.2 Painel admin protegido** (`/admin` ou similar) — acesso restrito ao Leonardo (auth + allowlist).
- **P0.3 Visão da oferta**: cadastros por categoria, % com foto, % com itens, atualizados nos
  últimos 30/90 dias, contas vs. anônimos, selos concedidos.
- **P0.4 Visão da jornada**: visitantes/sessões, funil home → catálogo → perfil → contato com taxas
  de conversão entre etapas.
- **P0.5 Canais/UTM**: agregação de views e conversões por canal de origem.
- **P0.6 Performance**: Web Vitals / tempo de carregamento (via Vercel Speed Insights ou coleta própria).

### Fase 1 — Nice-to-Have (P1)

- Série temporal (tendência semanal de cadastros, visitas, conversão).
- Top perfis por visualização e por clique de contato.
- Alertas simples (ex.: queda de cadastros vs. baseline).
- Cohorts de retenção de visitantes.

### Fase 2 — por profissional (Later, ex-2b)

- **F2.1** Mesma engine filtrada por `profissional_id`, exposta no `/painel`: views por canal,
  conversão para contato, cohorts simples.
- **F2.2** Decisão de processamento pesado (job de materialização vs. ferramenta) — ver acima.
- **F2.3** RLS/escopo: o profissional só vê os próprios números.

## Privacidade e segurança

- Eventos **anônimos** (sem PII); sessão é id efêmero.
- `/admin` nunca acessível por política pública; gate por `auth.uid()` em allowlist do admin.
- Não expor dados individuais de visitante; só agregados.

## Success Metrics

- **Cobertura**: % de page/profile views capturados vs. tráfego real (sanidade da instrumentação).
- **Uso**: o admin consulta o painel ao menos 1x/semana para decidir prioridade.
- **Decisão**: ao menos 1 decisão de roadmap por mês passa a citar número, não palpite.

## Open Questions

- [ ] Eventos: tabela própria no Supabase, ferramenta (PostHog/Plausible), ou híbrido? (recomendo híbrido)
- [ ] Gate do `/admin`: allowlist de e-mail no Supabase Auth basta? (sim no MVP)
- [ ] Performance: adotar Vercel Speed Insights (rápido) vs. coleta própria de Web Vitals?

## Timeline / faseamento (PRs pequenos)

**Fase 1 — piloto (Next):**

1. **PR A** — camada de eventos (tabela + captura page/profile/contact + UTM) (P0.1). Fundação.
2. **PR B** — `/admin` protegido + visão da oferta (P0.2, P0.3).
3. **PR C** — jornada/funil + canais/UTM (P0.4, P0.5) + performance (P0.6).
4. **PR D (fast-follow)** — séries temporais, tops, alertas, cohorts (P1).

**Fase 2 — por profissional (Later):** só após o piloto validar o motor.

5. **PR E** — analytics por `profissional_id` no `/painel` (F2.1, F2.3).
6. **PR F (se necessário)** — job de materialização / ferramenta para cohorts/atribuição (F2.2).

> **Testes** (regra do CLAUDE.md): gate do `/admin` (não-admin é barrado), agregações corretas,
> captura de evento sem PII e, na fase 2, escopo por profissional (um não vê dados do outro).
