# Operação — Conceder o selo "Verificado"

> Runbook do admin (Leonardo). Acompanha o PR A (`melhoria/auth-rls-painel`).
> Critério desta fase (decidido em 2026-06-17): **identidade confirmada por conversa no WhatsApp
> da Rede**. Não há concessão automática nem self-service — só você concede.

## Por que é manual e seguro

O selo `verificado` **não pode** ser escrito por `anon` nem por `authenticated`: a migration
`20260617_auth_e_verificacao.sql` revoga o `INSERT`/`UPDATE` dessas colunas desses papéis. Ou seja,
nem pela API pública, nem pelo painel do profissional, ninguém marca a si mesmo. A concessão só
funciona pelo **SQL Editor do Supabase** (papel `service_role`/`postgres`, que ignora RLS e grants).

## Como conceder

1. Confirme a identidade do profissional pelo WhatsApp da Rede.
2. Supabase Studio → **SQL Editor** → rode (trocando o id):

```sql
update profissionais
set verificado = true, verificado_em = now()
where id = '<uuid-do-profissional>';
```

Para achar o id pelo nome/telefone:

```sql
select id, nome, telefone, verificado
from profissionais
where nome ilike '%parte-do-nome%';
```

3. Pronto: o card do catálogo e o perfil público já leem `verificado` e mostram o selo
   (revalidação do perfil em até ~60s por ISR).

## Como revogar

```sql
update profissionais
set verificado = false, verificado_em = null
where id = '<uuid>';
```

## Verificar a segurança da RLS (após aplicar a migration)

Simular um profissional autenticado e confirmar o que ele pode e não pode fazer. Rode no SQL Editor:

```sql
-- pega um id real e um user fictício para o teste
do $$
declare
  alvo uuid;
begin
  select id into alvo from profissionais limit 1;
  raise notice 'testando com profissional %', alvo;
end $$;

-- simula o papel authenticated com um sub (auth.uid()) qualquer
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

-- 1) NÃO pode marcar-se como verificado (espera-se erro de permissão na coluna):
--    ERROR: permission denied for column verificado
update profissionais set verificado = true where id = (select id from profissionais limit 1);

-- volte ao papel admin para os próximos testes
reset role;
```

Esperado:

- O `update ... verificado` acima **falha** (permission denied) → blindagem ok.
- Um `update` do dono em colunas comuns (ex.: `telefone`) **só** passa quando `user_id` = `auth.uid()`.
- Um `update` fixando `user_id = auth.uid()` em linha com `user_id is null` **passa** (claim).

> Nota: a verificação completa de dono/claim é mais fácil de exercitar pelo painel (PR C) ou por um
> teste de integração com JWT real; o bloco acima cobre o ponto crítico (blindagem do selo).
