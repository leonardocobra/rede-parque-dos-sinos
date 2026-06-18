-- ============================================================
-- MIGRATION: múltiplos serviços por profissional
-- Move servico/categoria de profissionais → tabela profissional_servicos,
-- permitindo até 3 serviços por profissional com avaliações por serviço.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Nova tabela de serviços
-- ------------------------------------------------------------
CREATE TABLE profissional_servicos (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profissional_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  servico         TEXT NOT NULL,
  categoria       TEXT NOT NULL,
  ordem           SMALLINT DEFAULT 0,
  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON profissional_servicos(profissional_id);
CREATE INDEX ON profissional_servicos(categoria);

-- ------------------------------------------------------------
-- 2) RLS da nova tabela
-- ------------------------------------------------------------
ALTER TABLE profissional_servicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leitura publica" ON profissional_servicos
  FOR SELECT USING (true);

CREATE POLICY "insert publico" ON profissional_servicos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "update do dono" ON profissional_servicos
  FOR UPDATE TO authenticated
  USING (
    profissional_id IN (
      SELECT id FROM profissionais WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "delete do dono" ON profissional_servicos
  FOR DELETE TO authenticated
  USING (
    profissional_id IN (
      SELECT id FROM profissionais WHERE user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 3) GRANTs
-- ------------------------------------------------------------
GRANT SELECT ON profissional_servicos TO anon, authenticated;
GRANT INSERT ON profissional_servicos TO anon, authenticated;
GRANT UPDATE, DELETE ON profissional_servicos TO authenticated;

-- ------------------------------------------------------------
-- 4) Trigger: limite de 3 serviços por profissional
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_max_servicos()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM profissional_servicos
    WHERE profissional_id = NEW.profissional_id
  ) >= 3 THEN
    RAISE EXCEPTION 'Máximo de 3 serviços por profissional';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER max_servicos_trigger
  BEFORE INSERT ON profissional_servicos
  FOR EACH ROW EXECUTE FUNCTION check_max_servicos();

-- ------------------------------------------------------------
-- 5) Migrar dados existentes (exceto os dois registros do Elíverson,
--    que recebem serviços explícitos na etapa seguinte)
-- ------------------------------------------------------------
INSERT INTO profissional_servicos (profissional_id, servico, categoria, ordem)
SELECT id, servico, categoria, 0
FROM profissionais
WHERE servico IS NOT NULL
  AND id NOT IN (
    '602c2d62-9e40-41ce-8ced-0bc2b8759d25',  -- Elíverson (principal)
    'f6ae0f78-b6cc-4fc3-9486-b89e95d39b73'   -- Elíverson (duplicado, será deletado)
  );

-- Elíverson unificado: dois serviços na mesma conta
INSERT INTO profissional_servicos (profissional_id, servico, categoria, ordem) VALUES
  ('602c2d62-9e40-41ce-8ced-0bc2b8759d25', 'Azulejista e Pintor', 'Construção e Reforma', 0),
  ('602c2d62-9e40-41ce-8ced-0bc2b8759d25', 'Barbeiro', 'Beleza e Moda', 1);

DELETE FROM profissionais WHERE id = 'f6ae0f78-b6cc-4fc3-9486-b89e95d39b73';

-- ------------------------------------------------------------
-- 6) Adicionar servico_id em avaliacoes (nullable — retrocompatível)
--    ON DELETE SET NULL: ao remover um serviço, avaliações viram "Geral"
-- ------------------------------------------------------------
ALTER TABLE avaliacoes
  ADD COLUMN servico_id UUID REFERENCES profissional_servicos(id) ON DELETE SET NULL;

-- ------------------------------------------------------------
-- 7) Remover colunas antigas de profissionais
-- ------------------------------------------------------------
ALTER TABLE profissionais DROP COLUMN servico;
ALTER TABLE profissionais DROP COLUMN categoria;

-- ------------------------------------------------------------
-- 8) Atualizar GRANTs de profissionais (remover servico/categoria)
-- ------------------------------------------------------------
REVOKE UPDATE ON profissionais FROM authenticated;
GRANT UPDATE (
  nome, telefone, bairro, regioes,
  instagram, experiencia, descricao, foto_url, user_id
) ON profissionais TO authenticated;

REVOKE INSERT ON profissionais FROM anon, authenticated;
GRANT INSERT (
  nome, telefone, bairro, regioes, instagram, experiencia, descricao, foto_url
) ON profissionais TO anon;
GRANT INSERT (
  nome, telefone, bairro, regioes, instagram, experiencia, descricao, foto_url, user_id
) ON profissionais TO authenticated;
