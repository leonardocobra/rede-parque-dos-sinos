-- ============================================================
-- MIGRATION: itens/subserviços no perfil (Frente 1a)
-- Tabela profissional_itens, filha de profissional_servicos (1:N).
-- O profissional cadastra itens dentro de cada serviço (foto, descrição,
-- preço opcional, disponibilidade). Visível no perfil público; editável
-- só pelo dono via /painel. Spec: docs/perfil-itens-spec.md
-- ============================================================

-- ------------------------------------------------------------
-- 1) Nova tabela de itens
-- ------------------------------------------------------------
CREATE TABLE profissional_itens (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  servico_id      UUID NOT NULL REFERENCES profissional_servicos(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  titulo          TEXT NOT NULL,
  descricao       TEXT,
  foto_url        TEXT,
  preco           NUMERIC,
  preco_tipo      TEXT CHECK (preco_tipo IN ('fixo', 'a_partir', 'sob_orcamento')),
  disponibilidade TEXT,
  ativo           BOOLEAN NOT NULL DEFAULT TRUE,
  ordem           SMALLINT DEFAULT 0,
  criado_em       TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON profissional_itens(servico_id);
CREATE INDEX ON profissional_itens(profissional_id);

-- ------------------------------------------------------------
-- 2) RLS — leitura pública; escrita só do dono
--    (sem inserção anônima: itens só nascem pelo /painel autenticado)
-- ------------------------------------------------------------
ALTER TABLE profissional_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leitura publica" ON profissional_itens
  FOR SELECT USING (true);

CREATE POLICY "insert do dono" ON profissional_itens
  FOR INSERT TO authenticated
  WITH CHECK (
    profissional_id IN (
      SELECT id FROM profissionais WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "update do dono" ON profissional_itens
  FOR UPDATE TO authenticated
  USING (
    profissional_id IN (
      SELECT id FROM profissionais WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "delete do dono" ON profissional_itens
  FOR DELETE TO authenticated
  USING (
    profissional_id IN (
      SELECT id FROM profissionais WHERE user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 3) GRANTs
-- ------------------------------------------------------------
GRANT SELECT ON profissional_itens TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON profissional_itens TO authenticated;

-- ------------------------------------------------------------
-- 4) Trigger: limite de 20 itens por serviço (contém abuso/custo de imagem)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_max_itens()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM profissional_itens
    WHERE servico_id = NEW.servico_id
  ) >= 20 THEN
    RAISE EXCEPTION 'Máximo de 20 itens por serviço';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER max_itens_trigger
  BEFORE INSERT ON profissional_itens
  FOR EACH ROW EXECUTE FUNCTION check_max_itens();

-- ------------------------------------------------------------
-- 5) Trigger: atualizar atualizado_em em cada UPDATE
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION touch_itens_atualizado_em()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER touch_itens_trigger
  BEFORE UPDATE ON profissional_itens
  FOR EACH ROW EXECUTE FUNCTION touch_itens_atualizado_em();
