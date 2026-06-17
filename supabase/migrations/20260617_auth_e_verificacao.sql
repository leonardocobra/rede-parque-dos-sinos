-- ============================================================
-- MIGRATION: vínculo de conta + selo verificado + RLS de escrita
-- Prepara a tabela profissionais para o login leve do profissional
-- (Frente 2) e protege o selo "Verificado".
--
-- ⚠️ Idempotente. Pode rodar mais de uma vez. Ver docs/painel-profissional-spec.md
--    (P0.1, P0.5, P0.6) e docs/autenticacao-e-selo.md.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Colunas (já aplicadas em produção; mantidas aqui como fonte de verdade)
-- ------------------------------------------------------------

-- Vínculo opcional com a conta dona do cadastro (auth.users do Supabase).
-- NULL = cadastro legado/anônimo, ainda sem dono.
ALTER TABLE profissionais
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Selo de verificação MANUAL (distinto de "Recomendado", que é calculado por
-- avaliações no app). verificado_em registra quando foi concedido.
ALTER TABLE profissionais
  ADD COLUMN IF NOT EXISTS verificado BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profissionais
  ADD COLUMN IF NOT EXISTS verificado_em TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_prof_user ON profissionais(user_id);

-- ------------------------------------------------------------
-- 2) RLS de escrita: dono edita o próprio cadastro + reivindicação (claim)
--    (INSERT/SELECT públicos já existem e NÃO são alterados aqui.)
-- ------------------------------------------------------------

-- Dono autenticado edita o próprio cadastro.
DROP POLICY IF EXISTS "Dono edita seu cadastro" ON profissionais;
CREATE POLICY "Dono edita seu cadastro" ON profissionais
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- "Claim": dono autenticado reivindica um cadastro sem dono, fixando-se como
-- dono. USING seleciona linhas órfãs; WITH CHECK garante que ele só pode se
-- pôr como dono (não atribuir a outra pessoa).
DROP POLICY IF EXISTS "Reivindicar cadastro sem dono" ON profissionais;
CREATE POLICY "Reivindicar cadastro sem dono" ON profissionais
  FOR UPDATE TO authenticated
  USING (user_id IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 3) Blindagem do selo (defesa em profundidade nos GRANTS de coluna)
--    RLS por si só é row-level: sem isto, o dono poderia escrever `verificado`
--    na PRÓPRIA linha. Aqui tiramos esse direito dos papéis públicos.
--    O selo só é concedido por você (admin) via service_role / SQL Editor,
--    que ignora RLS e grants. REVOKE é idempotente.
-- ------------------------------------------------------------

-- ATENÇÃO (gotcha do Postgres): `REVOKE UPDATE (coluna)` NÃO subtrai de um grant
-- de nível de tabela. Como anon/authenticated têm GRANT na tabela inteira, é
-- preciso REVOGAR o grant de tabela e REGRANTEAR só as colunas permitidas.

-- UPDATE: anon não atualiza nada; authenticated atualiza só campos editáveis
-- (exclui verificado/verificado_em; inclui user_id para o claim).
REVOKE UPDATE ON profissionais FROM anon;
REVOKE UPDATE ON profissionais FROM authenticated;
GRANT UPDATE (
  nome, telefone, servico, categoria, bairro, regioes,
  instagram, experiencia, descricao, foto_url, user_id
) ON profissionais TO authenticated;

-- INSERT: sem o selo para ninguém público. anon (cadastro do formulário) não
-- pode nem setar user_id (evita forjar dono); authenticated pode setar o próprio.
REVOKE INSERT ON profissionais FROM anon, authenticated;
GRANT INSERT (
  nome, telefone, servico, categoria, bairro, regioes,
  instagram, experiencia, descricao, foto_url
) ON profissionais TO anon;
GRANT INSERT (
  nome, telefone, servico, categoria, bairro, regioes,
  instagram, experiencia, descricao, foto_url, user_id
) ON profissionais TO authenticated;

-- Observações:
-- • SELECT em `verificado` permanece (o card/perfil mostra o selo publicamente).
-- • `verificado`/`verificado_em` só são graváveis por service_role (admin) — que
--   ignora RLS e grants. É assim que o selo é concedido (ver runbook).
-- • Risco conhecido aceito nesta fase: um usuário pode reivindicar um cadastro
--   órfão de outra pessoa. Mitigação prevista é a fase 3 (OTP de WhatsApp).
