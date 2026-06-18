# Spec — Score de maturidade digital & Analytics por profissional (Frente 2)

> PRD. **Frente 2.** `2a` (score) é Next; `2b` (analytics Python) é Later.
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
A parte "dados de canal" do score melhora quando a Frente 2b existir.

## Frente 2b — Analytics por profissional (Later)

### Conceito

Dar ao profissional dados de canal: **quantos usuários novos viram o perfil por canal (UTM),
quantos concluíram transação ou entraram em contato no WhatsApp, cohorts e outros insights.**

### Pré-requisitos (dependência dura)

- **Camada de eventos/UTM** do roadmap (`docs/roadmap.md` → Now): captura de origem/UTM no perfil,
  evento de clique de contato, passos do funil. Sem isso, 2b é chute.
- Decidir o **canal de processamento**: começar com **Vercel Analytics + queries no Supabase** e só
  introduzir um **serviço Python** se isso provar insuficiente.

### Sobre o módulo Python (decisão de arquitetura)

> ⚠️ Adicionar um serviço Python ao stack Next/Vercel/Supabase é uma decisão relevante (deploy,
> observabilidade, custo, manutenção por 1 pessoa). **Recomendação:** não começar por ele.
> Validar primeiro o que UTM + eventos no Supabase + Vercel Analytics entregam. Se houver demanda
> real por cohorts/atribuição multi-touch que o SQL não cobre bem, então avaliar:
> - um job Python (ex.: Vercel Cron / função serverless) que lê eventos do Supabase e materializa
>   agregados (UTM por canal, cohorts, funil) em tabelas de leitura; ou
> - uma ferramenta pronta (PostHog, Plausible com UTM) antes de construir.

### O que o profissional veria (futuro)

- Visualizações do perfil por canal (Instagram, Google, busca, direto, link compartilhado).
- Conversão por canal: views → cliques de WhatsApp → (futuro) transação.
- Cohorts simples (ex.: quem viu na semana X voltou?).

### Esforço / Valor

Alto / Alto (mas Later). O valor real depende de já existir tráfego mensurável e oferta com itens.

## Success Metrics (Frente 2)

- **2a Engajamento**: % de contas que abrem o bloco de score e completam ≥1 sugestão em 30 dias.
- **2a Qualidade**: aumento médio de completude de perfil após lançamento do score.
- **2b**: adoção de UTM (links com origem) e clareza de atribuição dos contatos por canal.

## Open Questions

- [ ] Score numérico (0–100) ou níveis (Bronze/Prata/Ouro)? (níveis comunicam melhor; recomendo)
- [ ] Quais sinais são auto-declarados vs. verificados? (declarar não infla credibilidade pública)
- [ ] 2b: construir do zero, usar PostHog/Plausible, ou job Python? — **decidir só após 2a + eventos**.
