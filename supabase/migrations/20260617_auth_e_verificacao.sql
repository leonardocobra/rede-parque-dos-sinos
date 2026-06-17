-- ============================================================
-- MIGRATION: vínculo de conta + selo verificado
-- Prepara a tabela profissionais para o login leve do profissional
-- (Frente 2) e para o selo "Verificado".
--
-- ⚠️ NÃO aplicado automaticamente. Rode no Supabase quando lançar a feature.
--    Ver docs/autenticacao-e-selo.md. Idempotente.
-- ============================================================

-- 1) Vínculo opcional com a conta dona do cadastro (auth.users do Supabase).
--    NULL = cadastro legado/anônimo, ainda sem dono.
ALTER TABLE profissionais
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2) Selo de verificação MANUAL (distinto de "Recomendado", que é calculado
--    por avaliações no app). verificado_em registra quando foi concedido.
ALTER TABLE profissionais
  ADD COLUMN IF NOT EXISTS verificado BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profissionais
  ADD COLUMN IF NOT EXISTS verificado_em TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_prof_user ON profissionais(user_id);

-- 3) RLS — evolução do modelo de escrita.
--    Hoje: "Cadastro público" (INSERT liberado). Mantemos para não quebrar o
--    fluxo anônimo atual. Abaixo, as políticas que entram QUANDO o login do
--    profissional for ativado. Deixe comentadas até lá.

-- -- Dono autenticado pode editar o próprio cadastro:
-- CREATE POLICY "Dono edita seu cadastro" ON profissionais
--   FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
--
-- -- Dono autenticado pode reivindicar um cadastro sem dono (claim):
-- CREATE POLICY "Reivindicar cadastro sem dono" ON profissionais
--   FOR UPDATE USING (user_id IS NULL) WITH CHECK (auth.uid() = user_id);
--
-- IMPORTANTE: o campo `verificado` NUNCA deve ser editável pelo próprio
-- profissional. A concessão do selo é feita por você (admin), via service_role
-- ou painel do Supabase — nunca por política pública de UPDATE.
