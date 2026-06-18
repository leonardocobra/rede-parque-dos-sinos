# Passo a passo — SMTP customizado (Resend) no Supabase

> **Por quê.** O serviço de e-mail embutido do Supabase é limitado a poucos envios por hora
> (erro `over_email_send_rate_limit` / HTTP 429) e usa o remetente compartilhado
> `noreply@mail.app.supabase.io`, que o Outlook/Hotmail costuma jogar no spam. O login por
> magic link da Rede depende desse e-mail chegar. Configurar um SMTP próprio (Resend) com o
> domínio `arede.app.br` autenticado resolve **os dois** problemas: acaba o rate limit baixo e
> melhora muito a entrega.

- **Projeto Supabase:** `rede-parque-dos-sinos` (ref `yekscrvewqwabnvbzyxk`, região `sa-east-1`)
- **Domínio de produção:** `arede.app.br`
- **Custo:** plano Free do Resend (US$ 0) — 3.000 e-mails/mês, 100/dia, 1 domínio. Suficiente
  para o volume de login atual.

---

## 1. Criar conta e verificar o domínio no Resend

1. Crie a conta em <https://resend.com> (Free).
2. **Domains → Add Domain** → informe `arede.app.br`.
   - Recomendado usar um subdomínio de envio, ex. `mail.arede.app.br`, para não interferir em
     outros e-mails do domínio raiz. O Resend sugere isso automaticamente.
3. O Resend mostra **3 registros DNS** para adicionar no provedor de DNS do `arede.app.br`
   (onde o domínio está hospedado — provavelmente o mesmo painel onde aponta para a Vercel):

   | Tipo  | Para que serve        | Observação                                   |
   | ----- | --------------------- | -------------------------------------------- |
   | `MX`  | Recebimento (bounces) | aponta para o host do Resend                 |
   | `TXT` | **SPF**               | autoriza o Resend a enviar pelo domínio      |
   | `TXT` | **DKIM**              | assina os e-mails (chave gerada pelo Resend) |

   Copie os valores **exatamente** como o painel do Resend exibe (eles são específicos da conta).

4. Adicione os 3 registros no DNS e volte ao Resend → **Verify**. A propagação costuma levar de
   minutos a algumas horas. Só prossiga quando o domínio aparecer como **Verified**.
5. _(Opcional, recomendado)_ Adicione um registro **DMARC** (`TXT` em `_dmarc.arede.app.br`)
   começando com `v=DMARC1; p=none;` — ajuda ainda mais na reputação/entrega.

## 2. Gerar a API key / credenciais SMTP no Resend

No Resend, o SMTP usa estes valores fixos + uma API key como senha:

- **Host:** `smtp.resend.com`
- **Porta:** `465` (SSL) — ou `587` (STARTTLS)
- **Usuário:** `resend`
- **Senha:** uma **API key** criada em **API Keys → Create API Key** (permissão _Sending access_).
  Copie a key na hora — ela só é exibida uma vez.

## 3. Configurar o SMTP no Supabase

No painel do Supabase do projeto `rede-parque-dos-sinos`:

1. **Authentication → Emails → SMTP Settings** (em versões recentes: **Project Settings →
   Authentication → SMTP**).
2. Ative **Enable Custom SMTP** e preencha:

   | Campo        | Valor                                                        |
   | ------------ | ------------------------------------------------------------ |
   | Sender email | `nao-responder@mail.arede.app.br` (use o domínio verificado) |
   | Sender name  | `A Rede`                                                     |
   | Host         | `smtp.resend.com`                                            |
   | Port         | `465`                                                        |
   | Username     | `resend`                                                     |
   | Password     | a API key do passo 2                                         |

   > ⚠️ O **Sender email** precisa estar no domínio verificado no Resend, senão os envios falham.

3. Salve.

## 4. Ajustar os rate limits do Supabase

Com SMTP próprio, o limite baixo embutido deixa de fazer sentido.

1. **Authentication → Rate Limits** → aumente **"Rate limit for sending emails"** para um valor
   compatível com o Free do Resend (ex.: respeitando os 100/dia globais do plano).
2. Confirme que **Authentication → URL Configuration** tem o redirect correto:
   - **Site URL:** `https://arede.app.br`
   - **Redirect URLs:** inclua `https://arede.app.br/auth/callback` (e a URL de preview da Vercel,
     se usar magic link em previews).

   > A tela [`app/entrar/page.js`](../app/entrar/page.js) envia `emailRedirectTo` como
   > `${origin}/auth/callback`; essa URL precisa estar na allowlist acima ou o link falha.

## 5. Testar

1. Em <https://arede.app.br/entrar>, peça um link com um e-mail **@hotmail.com / @outlook.com**
   (era o caso problemático) e outro **@gmail.com**.
2. Confirme que o e-mail chega (cheque também o spam na primeira vez).
3. No Resend, **Logs/Emails**, confirme o status `delivered`.
4. No Supabase, **Logs → Auth**, confirme `mail.send` sem `over_email_send_rate_limit`.
5. Clique o link e verifique que cai autenticado (sem `?erro=link`).

## Diagnóstico rápido (se ainda falhar)

| Sintoma                                | Causa provável                              | Onde olhar                         |
| -------------------------------------- | ------------------------------------------- | ---------------------------------- |
| `over_email_send_rate_limit` (429)     | Rate limit do Supabase ainda baixo          | Auth → Rate Limits                 |
| E-mail não chega, sem erro no Supabase | Domínio não verificado / SPF-DKIM faltando  | Resend → Domains; Resend → Logs    |
| Cai em spam                            | Falta DMARC ou domínio recém-criado         | DNS `_dmarc`; reputação leva tempo |
| Link abre com `?erro=link`             | Redirect URL fora da allowlist / link velho | Auth → URL Configuration           |
