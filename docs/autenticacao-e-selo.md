# Autenticação do profissional & Selo "Verificado"

> Estratégia. Acompanha o PR `melhoria/auth-selo-verificado`.
> Decisão com o Leonardo (2026-06-16): **login leve só para o profissional**,
> visitante e avaliação seguem sem login. Base para o selo de verificação.

## 1. Problema

Hoje tudo é anônimo:

- Qualquer um cadastra qualquer profissional (inclusive em nome de outra pessoa).
- Ninguém consegue **editar** o próprio cadastro depois de enviado (erro de telefone = cadastro perdido).
- Não há como provar que "este cadastro é mesmo desta pessoa" → sem base para confiança forte.

Isso limita duas coisas que o Leonardo quer: **confiança** (selo) e **qualidade do catálogo**
(cadastros mantidos atualizados pelos próprios donos).

## 2. As três estratégias avaliadas

| Estratégia                                 | Fricção                  | Confiança             | Esforço          | Veredito                        |
| ------------------------------------------ | ------------------------ | --------------------- | ---------------- | ------------------------------- |
| **A. Sem auth, verificação 100% manual**   | Zero                     | Baixa (selo sem dono) | Baixo            | Insuficiente p/ editar cadastro |
| **B. Login leve do profissional** ✅       | Baixa (só quem cadastra) | Média→Alta            | Médio            | **Escolhida**                   |
| **C. Verificação por OTP de WhatsApp/SMS** | Média                    | Alta (dono do número) | Alto (custo SMS) | Futuro, sobre a B               |

**Por que B:** o visitante — que é a maioria do tráfego e o que queremos **crescer** — continua
sem nenhuma barreira. Só o profissional (poucos, alta intenção) cria conta, e só para **gerir o
próprio cadastro**. É o melhor equilíbrio fricção × confiança × esforço.

> A opção C (confirmar o número de WhatsApp por código) é a evolução natural: o WhatsApp já é o
> canal de contato do catálogo, então "número verificado" é um selo forte e barato de explicar.
> Fica como fase 3, montada sobre a infra da fase B.

## 3. Recomendado ≠ Verificado (dois selos, dois significados)

São coisas diferentes e ambos os selos convivem no card:

| Selo            | O que diz                       | Como se ganha                                            | Visual                                      |
| --------------- | ------------------------------- | -------------------------------------------------------- | ------------------------------------------- |
| **Recomendado** | "A comunidade aprova"           | Calculado: ≥80% "contrataria novamente" e ≥3 avaliações  | Vermelho claro / texto vermelho (já existe) |
| **Verificado**  | "A Rede confirmou a identidade" | **Manual** (você concede) ou, na fase 3, OTP de WhatsApp | Preto / texto branco com ✓ (este PR)        |

Um profissional novo pode ser **Verificado** (identidade ok) sem ser **Recomendado** (ainda sem
avaliações) — e vice-versa. Não confundir os dois é central para a credibilidade do catálogo.

## 4. Modelo de dados (migration versionada, não aplicada)

`supabase/migrations/20260617_auth_e_verificacao.sql`:

- `profissionais.user_id UUID → auth.users` — dono do cadastro. `NULL` = legado/anônimo.
- `profissionais.verificado BOOLEAN DEFAULT false` — selo manual.
- `profissionais.verificado_em TIMESTAMPTZ` — quando foi concedido.

**Regra de ouro de segurança:** `verificado` **nunca** é editável por política pública. Só você
(admin, via `service_role` ou painel do Supabase) concede. O profissional jamais pode marcar a si
mesmo como verificado.

## 5. Fluxo de autenticação proposto (Supabase Auth)

Recomendação: **Magic Link por e-mail** (sem senha) — mais simples de operar, sem gestão de senha,
e o Supabase já entrega pronto. Telefone/OTP fica para a fase 3.

```
Cadastro (anônimo, como hoje)
        │
        ▼
"Quer poder editar depois? Crie sua conta"  ← opcional no fim do cadastro
        │  e-mail → magic link
        ▼
Sessão do profissional
        │
        ├─ vincula o cadastro recém-criado (user_id = auth.uid())
        ├─ /painel: editar serviço, foto, descrição, contato
        └─ "Reivindicar" um cadastro antigo sem dono (claim)
```

### Telas novas (próximo PR, não neste)

- `/entrar` — pede e-mail, dispara magic link.
- `/painel` — lista os cadastros do usuário + edição inline.
- Banner opcional no fim do `/cadastro`: "crie uma conta para editar depois".

### RLS (já esboçada e comentada na migration)

- `UPDATE` liberado só para `auth.uid() = user_id`.
- "Claim": `UPDATE` de cadastro com `user_id IS NULL`, fixando o novo dono.
- INSERT público **permanece** (não quebra o fluxo anônimo atual).

## 6. Como o selo entra no app agora (este PR)

O card do catálogo já renderiza o selo **Verificado** quando `p.verificado` é verdadeiro
(`app/catalogo/page.js`). Como a coluna ainda não existe em produção, o selo fica **inerte** — não
aparece para ninguém até a migration rodar e você marcar alguém como verificado. Zero risco de
regressão; o código já está pronto para o dado.

## 7. Roadmap sugerido

1. **Fase 1 (este PR)** — selo no card (inerte) + migration versionada + esta estratégia.
2. **Fase 2** — Magic Link + `/painel` de edição + RLS de dono/claim. Concessão manual do selo.
3. **Fase 3** — verificação por OTP de WhatsApp → vira o selo "Verificado" automático.

## 8. Decisões em aberto (para o Leonardo)

- [ ] **Confirmar Magic Link por e-mail** como método (vs. exigir telefone desde já)?
- [ ] **Critério do selo manual**: o que basta para verificar? (responder no WhatsApp da Rede? enviar doc? indicação de vizinho?)
- [ ] **Cadastro anônimo continua permitido** ou passa a exigir conta? (recomendo manter anônimo + oferecer conta, para não criar barreira de oferta)
- [ ] Texto do tooltip do selo: hoje "Identidade confirmada pela Rede".
