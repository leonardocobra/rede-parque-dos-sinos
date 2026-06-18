# Spec — Observabilidade interna da plataforma (Frente 3)

> PRD. **Frente 3.** Prioridade #2 de Next (`docs/roadmap.md`). Feature **interna** (admin/Leonardo).
> Liga com: `docs/crescimento-catalogo.md` (princípio "sem medição é chute"),
> `docs/crescimento-score-analytics-spec.md` (compartilha a camada de eventos).

## Problem Statement

Hoje o Leonardo **não enxerga** a plataforma: não sabe quem está ativo, quem atualizou o perfil ou
inseriu foto, como está o volume de cadastro por categoria, como as pessoas se movem entre as
páginas, nem quantos visitantes reais existem e qual a conversão da jornada. Sem isso, toda decisão
de produto e crescimento é palpite. Esta frente entrega os olhos da operação — e a **camada de
eventos** que ela exige é a mesma fundação da Frente 2b, então construir aqui rende duas vezes.

## Goals

1. **Comportamento da oferta**: visão de quem está ativo, quem atualiza perfil/foto, completude.
2. **Saúde do catálogo**: volume de cadastro por categoria, distribuição de selos, perfis sem foto/itens.
3. **Jornada e conversão**: visitantes reais, conversão entre páginas (home → catálogo → perfil →
   clique de contato).
4. **Performance da plataforma**: latência e tempo de carregamento de tela (Web Vitals).
5. Tudo **interno** e protegido — só o admin vê.

## Non-Goals

- Não é o analytics **do profissional** (isso é Frente 2b) — aqui é a visão **da Rede**.
- Não substituir ferramentas prontas onde elas bastam (Vercel Analytics/Speed Insights).
- Não construir BI completo; foco nas perguntas operacionais do dia a dia.

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
> Supabase** (controle total, custo zero, casa com a Frente 2b) vs. adotar **PostHog/Plausible**
> (mais rápido, menos controle). Recomendação: tabela própria para os eventos de funil/contato
> (que viram produto na Frente 2b) + Vercel Analytics/Speed Insights para tráfego e performance.

## Requirements

### Must-Have (P0)

- **P0.1 Camada de eventos** (tabela + captura de page/profile view, contact click, UTM). Fundação.
- **P0.2 Painel admin protegido** (`/admin` ou similar) — acesso restrito ao Leonardo (auth + allowlist).
- **P0.3 Visão da oferta**: cadastros por categoria, % com foto, % com itens, atualizados nos
  últimos 30/90 dias, contas vs. anônimos, selos concedidos.
- **P0.4 Visão da jornada**: visitantes/sessões, funil home → catálogo → perfil → contato com taxas
  de conversão entre etapas.
- **P0.5 Performance**: Web Vitals / tempo de carregamento (via Vercel Speed Insights ou coleta própria).

### Nice-to-Have (P1)

- Série temporal (tendência semanal de cadastros, visitas, conversão).
- Top perfis por visualização e por clique de contato.
- Alertas simples (ex.: queda de cadastros vs. baseline).

### Future (P2)

- Cohorts de retenção de visitantes.
- Atribuição de origem mais rica (compartilha base com Frente 2b).

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

1. **PR A** — camada de eventos (tabela + captura page/profile/contact + UTM) (P0.1). Fundação.
2. **PR B** — `/admin` protegido + visão da oferta (P0.2, P0.3).
3. **PR C** — visão da jornada/funil (P0.4) + performance (P0.5).
4. **PR D (fast-follow)** — séries temporais, tops e alertas (P1).

> **Testes** (regra do CLAUDE.md): gate do `/admin` (não-admin é barrado), agregações corretas,
> e captura de evento sem PII.
