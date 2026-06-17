# Spec — Login leve do profissional & Painel `/painel`

> PRD. **Frente 2, fase 2.** Sucede o perfil público (`/profissional/[id]`, já entregue).
> Decisões com o Leonardo (2026-06-17): **Magic Link por e-mail**; cadastro segue anônimo com
> oferta de conta; selo "Verificado" concedido manualmente após contato no WhatsApp da Rede.
> Liga com: `docs/autenticacao-e-selo.md`, `docs/interface-profissional.md`, `docs/crescimento-catalogo.md`.

## Problem Statement

Depois de se cadastrar, o profissional **perde o controle** do próprio cadastro: não corrige um
telefone errado (= cliente perdido), não troca a foto, não atualiza serviço ou descrição. Também
não há como provar que "este cadastro é mesmo desta pessoa", o que impede um selo de confiança
forte. Sem um lugar próprio e logado, não existe loop de retenção do lado da **oferta** — o
profissional não tem motivo para voltar, e o catálogo envelhece.

## Goals

1. **Profissional edita o próprio cadastro sem intervenção manual** — meta: ≥60% dos cadastros com
   dono são editados ao menos uma vez nos primeiros 60 dias após criar conta.
2. **Criar base técnica de identidade** (vínculo `user_id`) que destrava o selo "Verificado" e a
   futura verificação por WhatsApp (fase 3).
3. **Não adicionar fricção à oferta** — taxa de novos cadastros (anônimos) **não cai** após o lançamento.
4. **Iniciar o loop de retenção da oferta** — meta: ≥30% dos profissionais com conta retornam ao
   `/painel` ao menos 1x/mês.
5. **Reivindicação de cadastros legados** — ≥20% dos cadastros anônimos antigos reivindicados por
   seus donos em 90 dias (entre os que criam conta).

## Non-Goals

- **Chat/mensagens internas** — o WhatsApp já resolve o contato; manter o canal direto (anti-escopo de `interface-profissional.md`).
- **Agenda / orçamento / pagamento no app** — vira outro produto, fora da tese comunitária.
- **Planos pagos / destaque pago** — cedo demais; mata a percepção de "gratuito e da comunidade".
- **OTP de WhatsApp / verificação automática** — fica para a **fase 3**, montada sobre esta infra.
- **Responder a avaliações pelo painel** — desejável, mas fica para um fast-follow (P1/fase 2+), não bloqueia o MVP de edição.
- **Login para visitante ou para avaliar** — permanecem **sem conta**; só o profissional autentica.

## User Stories

### Profissional (oferta)

1. _Como profissional que acabou de cadastrar, quero criar uma conta por e-mail, para poder editar
   meu cadastro depois sem refazer tudo._
2. _Como profissional, quero entrar pelo link enviado ao meu e-mail (sem senha), para acessar meu
   painel de forma simples._
3. _Como profissional logado, quero editar serviço, descrição, foto, contato, bairro e regiões,
   para corrigir erros e manter meu cadastro atualizado._
4. _Como profissional que cadastrou de forma anônima antes, quero reivindicar aquele cadastro,
   para passar a gerenciá-lo pela minha conta._
5. _Como profissional logado, quero ver o status dos meus selos (Recomendado / Verificado),
   para saber onde estou e o que falta._
6. _Como profissional logado, quero ver métricas simples (visualizações do perfil, nº de avaliações,
   nota média), para me sentir dono e motivado a voltar._

### Admin (Leonardo / a Rede)

7. _Como admin, quero conceder o selo "Verificado" a um profissional após confirmar a identidade
   pelo WhatsApp, sem que o profissional consiga marcar a si mesmo._

### Edge / estados

8. _Como profissional, quero uma mensagem clara se o magic link expirar ou for inválido, para
   pedir outro sem confusão._
9. _Como profissional, quero ver meu painel vazio com uma instrução clara caso minha conta ainda
   não tenha cadastro vinculado (orientação para reivindicar ou cadastrar)._

## Requirements

### Must-Have (P0) — o MVP não sobe sem isto

**P0.1 — Aplicar a migration de auth/verificação**
A migration `supabase/migrations/20260617_auth_e_verificacao.sql` (`user_id`, `verificado`,
`verificado_em`, índice) é aplicada em produção.

- [ ] Dado o schema atual, quando a migration roda, então `profissionais` ganha as 3 colunas sem perder dados.
- [ ] A migration é idempotente (`IF NOT EXISTS`) e pode rodar mais de uma vez sem erro.

**P0.2 — Auth por Magic Link (Supabase Auth)**
Tela `/entrar`: pede e-mail, dispara magic link; callback estabelece a sessão.

- [ ] Dado um e-mail válido em `/entrar`, quando envio, então recebo o link e ao clicar fico autenticado e sou levado ao `/painel`.
- [ ] Dado um link expirado/inválido, quando clico, então vejo erro claro e a opção de reenviar.
- [ ] Sessão persiste entre recarregamentos; existe ação de "sair".

**P0.3 — Vínculo do cadastro à conta (no cadastro novo)**
Ao fim do `/cadastro`, banner opcional "crie uma conta para editar depois". Se o profissional
cria conta na sequência, o cadastro recém-criado recebe `user_id = auth.uid()`.

- [ ] Dado um cadastro recém-enviado, quando o autor cria conta logo após, então aquele cadastro fica com `user_id` da conta.
- [ ] **O fluxo anônimo continua intacto**: quem não quer conta cadastra normalmente (INSERT público preservado).

**P0.4 — Painel `/painel` com edição**
Rota protegida que lista os cadastros do usuário (normalmente 1) e permite editar campos.

- [ ] Dado usuário logado dono de um cadastro, quando edito serviço/descrição/foto/telefone/instagram/bairro/regiões/experiência e salvo, então as mudanças persistem e aparecem no catálogo e no perfil público.
- [ ] Dado usuário **não** logado, quando acesso `/painel`, então sou redirecionado a `/entrar`.
- [ ] O campo `verificado` **não** é editável no painel (nem na UI nem aceito pela API).

**P0.5 — RLS de dono e de claim**
Ativar as políticas hoje comentadas na migration.

- [ ] `UPDATE` permitido só quando `auth.uid() = user_id`.
- [ ] "Claim": `UPDATE` de cadastro com `user_id IS NULL` fixando `user_id = auth.uid()`.
- [ ] `INSERT` público **permanece** (não quebra cadastro anônimo).
- [ ] **Negativo:** um usuário não consegue editar cadastro de outro, nem alterar `verificado` por política pública.

**P0.6 — Concessão manual do selo Verificado (operação do admin)**
Sem UI nova obrigatória: concessão via painel do Supabase / `service_role`, setando
`verificado = true` e `verificado_em = now()`. (Critério: identidade confirmada por WhatsApp da Rede.)

- [ ] Dado que marco `verificado = true`, quando o card/perfil renderiza, então o selo "Verificado" aparece (o app já lê `p.verificado`).
- [ ] Documentar o passo-a-passo da concessão para o admin.

### Nice-to-Have (P1) — fast-follow

- **P1.1 Reivindicação self-service no painel** — botão "reivindicar um cadastro" buscando por
  telefone/nome para o dono assumir um cadastro legado (em vez de só no fluxo pós-cadastro).
- **P1.2 Métricas no painel** — visualizações do perfil (Vercel Analytics), nº de avaliações, nota
  média; texto motivacional do status dos selos ("Verificação: pendente — fale com a Rede").
- **P1.3 Banner de status dos selos** — "Você é Recomendado ✓" / "Verificação pendente".

### Future Considerations (P2) — não construir agora, mas não bloquear

- **P2.1 OTP de WhatsApp** → selo "Verificado" automático (fase 3). O `user_id` e o campo
  `verificado` já acomodam isso.
- **P2.2 Resposta a avaliações** pelo profissional (direito de resposta).
- **P2.3 Múltiplos cadastros por conta** — o modelo (`user_id` 1:N) já suporta; UI fica para depois.

## Success Metrics

### Leading (dias–semanas)

- **Adoção de conta:** % de novos cadastros que criam conta no fluxo pós-cadastro. Alvo: ≥40% / Stretch: ≥60%.
- **Ativação de edição:** % de contas que editam ≥1 vez em 30 dias. Alvo: ≥50%.
- **Saúde da oferta:** taxa de novos cadastros (anônimos + com conta) **não cai** vs. baseline pré-lançamento (guard-rail).
- **Erro de login:** % de magic links que falham/expiram sem completar sessão. Alvo: <10%.

### Lagging (semanas–meses)

- **Retenção da oferta:** % de profissionais com conta que voltam ao `/painel` 1x/mês. Alvo: ≥30%.
- **Frescor do catálogo:** % de cadastros editados nos últimos 90 dias (proxy de catálogo vivo).
- **Confiança:** nº de selos "Verificado" concedidos / mês (depende da operação manual).

> Medição: Vercel Analytics (já ativo) para páginas/visualizações; consultas no Supabase para
> contagem de contas, edições (comparar `criado_em` vs. updates) e selos.

## Open Questions

- [ ] **(produto/Leonardo)** Texto e gatilho do banner pós-cadastro — aparece sempre ou só quando há e-mail informado? _(não-bloqueante)_
- [ ] **(produto/Leonardo)** Reivindicação self-service (P1.1) entra já no MVP ou fica como fast-follow? _(não-bloqueante; recomendo fast-follow)_
- [ ] **(eng)** Cliente Supabase: hoje só anon key no browser (`lib/supabase.js`). Auth/sessão e RLS exigem revisar SSR/cookies — usar `@supabase/ssr`? _(bloqueante p/ P0.2 e P0.4)_
- [ ] **(eng)** Confirmar URL de redirect do magic link em produção (Vercel) e em dev. _(bloqueante p/ P0.2)_
- [ ] **(produto)** Texto final do tooltip do selo (hoje "Identidade confirmada pela Rede"). _(não-bloqueante)_

## Timeline Considerations

- **Sem prazo contratual.** Sequência conforme `interface-profissional.md`: perfil público (feito) →
  **auth + painel (esta spec)** → fast-follows.
- **Dependências:** P0.4/P0.5 dependem de P0.1 (migration aplicada) e P0.2 (sessão funcionando).
- **Faseamento sugerido para caber em PRs pequenos (regra do CLAUDE.md):**
  1. **PR A** — aplicar migration + ativar RLS de dono/claim (P0.1, P0.5) + doc da concessão do selo (P0.6).
  2. **PR B** — Magic Link `/entrar` + sessão + "sair" (P0.2), incluindo migração do cliente Supabase p/ SSR.
  3. **PR C** — `/painel` com edição + vínculo no pós-cadastro (P0.3, P0.4).
  4. **PR D (fast-follow)** — métricas, banner de selos e reivindicação self-service (P1).
- **Testes:** a suíte ainda não está configurada (pendência do CLAUDE.md). Configurar Vitest deve
  preceder PR B/C, com testes de RLS (dono não edita cadastro alheio) e do fluxo de claim.
