-- ============================================================
-- MIGRATION: Fase 3 AI Native Lab — pgvector + busca semântica
--
-- Cria:
--   1) Extensão vector (pgvector).
--   2) Coluna embedding vector(512) em profissional_servicos.
--   3) Índice HNSW para cosine similarity (busca eficiente).
--   4) Função ai_buscar_servicos — roda sob role ai_readonly,
--      recebe o embedding da query e retorna os N mais similares.
--
-- Provider: Voyage AI voyage-3-lite (512 dims, $0.02/1M tokens).
-- ============================================================

-- ------------------------------------------------------------
-- 1) Extensão pgvector
-- ------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS vector;

-- ------------------------------------------------------------
-- 2) Coluna de embedding
-- ------------------------------------------------------------

ALTER TABLE profissional_servicos
  ADD COLUMN IF NOT EXISTS embedding vector(512);

-- ------------------------------------------------------------
-- 3) Índice HNSW (cosine) — eficiente para 512 dims
--    m=16 e ef_construction=64 são os defaults recomendados.
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_servicos_embedding_hnsw
  ON profissional_servicos
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ------------------------------------------------------------
-- 4) Função de busca semântica
--    Retorna os p_limite serviços mais próximos do embedding
--    da query, ordenados por similaridade decrescente.
--    SECURITY DEFINER + search_path fixado garante isolamento;
--    SET LOCAL ROLE é proibido em SECURITY DEFINER (ERROR 42501).
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION ai_buscar_servicos(
  query_embedding vector(512),
  p_limite        int     DEFAULT 10,
  p_categoria     text    DEFAULT NULL
)
RETURNS TABLE(
  servico_id      uuid,
  profissional_id uuid,
  nome            text,
  bairro          text,
  servico         text,
  categoria       text,
  descricao       text,
  similaridade    float8
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT
      ps.id,
      ps.profissional_id,
      p.nome::text,
      p.bairro::text,
      ps.servico::text,
      ps.categoria::text,
      ps.descricao::text,
      (1 - (ps.embedding <=> query_embedding))::float8 AS similaridade
    FROM profissional_servicos ps
    JOIN profissionais p ON p.id = ps.profissional_id
    WHERE ps.embedding IS NOT NULL
      AND (p_categoria IS NULL OR ps.categoria = p_categoria)
    ORDER BY ps.embedding <=> query_embedding
    LIMIT LEAST(p_limite, 20);
END;
$$;

GRANT EXECUTE ON FUNCTION ai_buscar_servicos(vector, int, text) TO service_role;
