# Spec — Score de maturidade digital (Frente 2)

> PRD. **Frente 2.** Score de maturidade digital (Next).
> **A antiga Frente 2b (analytics por profissional) foi fundida na Frente 3** como fase 2 — ver
> `docs/observabilidade-spec.md`. Motivo: é o mesmo motor de analytics da observabilidade, só com
> escopo por profissional; o Leonardo pilota primeiro (tenant zero) e depois replica.
> Liga com: `docs/crescimento-catalogo.md`, `docs/roadmap.md`, `docs/observabilidade-spec.md`.

## Problem Statement

O profissional não sabe **onde está** na sua presença digital nem **o que fazer a seguir**. A Rede
tem dados (perfil no app, avaliações, foto, itens) e poderia orientar — virando não só um catálogo,
mas um **copiloto de crescimento** da oferta. Isso aumenta a retenção da oferta (motivo para voltar
ao `/painel`) e melhora a qualidade do catálogo (perfis mais completos convertem mais).
Num segundo momento, dar ao profissional **dados reais de canal** (quantos viram o perfil por
origem, quantos viraram contato/transação) transforma o copiloto em ferramenta de marketing.

## Frente 2a — Score de maturidade digital (Next)

### Conceito

Um score 0–100 (ou níveis Bronze/Prata/Ouro) por perfil, calculado de forma **heurística**, com
sugestões de próximos passos. Sem infra nova — parte derivada de dados já no banco, parte checklist
auto-declarado.

### Dimensões avaliadas

| Dimensão | Fonte | Exemplo de sinal |
| --- | --- | --- |
| Perfil no app | banco | tem foto? descrição? ≥1 serviço? itens com preço? |
| Avaliações | `avaliacoes` | nº de avaliações, nota, % "contrataria novamente" |
| Selos | banco | Recomendado? Verificado? |
| Instagram | banco / checklist | handle preenchido? ativo? (auto-declarado) |
| WhatsApp | banco | telefone válido/normalizado? |
| Google (Perfil da Empresa) | checklist | tem ficha no Google? (auto-declarado) |
| SEO/compartilhamento | derivado | perfil já compartilhado? link na bio? |
| Tráfego pago | checklist | já rodou campanha? (auto-declarado) |

### O que o profissional vê (no `/painel`)

- Score + nível, com explicação do que mais pesa.
- **Top 3 próximos passos** priorizados (ex.: "Adicione uma foto → +12 pts", "Peça 2 avaliações para
  virar Recomendado").
- Evolução do score ao longo do tempo (quando houver histórico).

### Requirements 2a

- **P0** Função de cálculo do score (pura, testável) a partir do estado do perfil.
- **P0** Bloco de score + sugestões no `/painel`.
- **P0** Checklist auto-declarado persistido (poucos campos novos em `profissionais` ou tabela
  `perfil_maturidade`).
- **P1** Histórico do score (snapshot periódico) para mostrar evolução.

### Esforço / Valor

Baixo-Médio / Alto. Não depende da camada de eventos para o MVP (heurístico + auto-declarado).
A parte "dados de canal" do score melhora quando a Frente 3 fase 2 (analytics por profissional)
existir.

## Analytics por profissional (movido para a Frente 3)

A entrega de dados de canal ao profissional — **quantos viram o perfil por canal (UTM), quantos
viraram contato/transação, cohorts** — era a antiga Frente 2b. Foi **fundida na Frente 3** como
fase 2, porque usa exatamente o mesmo motor de analytics da observabilidade (só muda o escopo: a
Rede inteira vs. um profissional). O Leonardo pilota o motor na fase 1; a exposição por profissional
vem depois de validado. A decisão sobre serviço Python / PostHog / job de materialização também
mora lá. Ver `docs/observabilidade-spec.md`.

## Success Metrics (Frente 2 — score)

- **Engajamento**: % de contas que abrem o bloco de score e completam ≥1 sugestão em 30 dias.
- **Qualidade**: aumento médio de completude de perfil após lançamento do score.

## Open Questions

- [ ] Score numérico (0–100) ou níveis (Bronze/Prata/Ouro)? (níveis comunicam melhor; recomendo)
- [ ] Quais sinais são auto-declarados vs. verificados? (declarar não infla credibilidade pública)
