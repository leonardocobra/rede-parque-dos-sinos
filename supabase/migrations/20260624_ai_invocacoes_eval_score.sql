-- ============================================================
-- MIGRATION: adiciona eval_score em ai_invocacoes (Fase 5)
-- Coluna nullable — preenchida quando a invocação tem um
-- julgamento de qualidade associado (LLM-as-judge, Fase 4).
-- ============================================================

ALTER TABLE ai_invocacoes
  ADD COLUMN IF NOT EXISTS eval_score SMALLINT
    CHECK (eval_score BETWEEN 1 AND 5);
