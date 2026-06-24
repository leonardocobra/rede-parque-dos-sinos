-- ============================================================
-- MIGRATION: Fase 2 AI Native Lab — role read-only + tools
--
-- Cria:
--   1) Role ai_readonly com SELECT apenas nas tabelas relevantes.
--   2) Três funções parametrizadas (SECURITY DEFINER) que o agente
--      chama via supabase.rpc(). Cada função faz SET LOCAL ROLE
--      ai_readonly antes da query — sem SQL livre ao LLM.
--
-- Convenção de nome: prefixo "ai_" para separar das funções de produto.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Role read-only dedicado
-- ------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ai_readonly') THEN
    CREATE ROLE ai_readonly;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO ai_readonly;
GRANT SELECT ON profissionais           TO ai_readonly;
GRANT SELECT ON profissional_servicos   TO ai_readonly;

-- ------------------------------------------------------------
-- 2) Tool: contar_por_categoria
--    Retorna contagem de profissionais por categoria.
--    Opcional: filtrar por uma categoria específica.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION ai_contar_por_categoria(p_categoria text DEFAULT NULL)
RETURNS TABLE(categoria text, total bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET LOCAL ROLE ai_readonly;
  RETURN QUERY
    SELECT ps.categoria::text,
           COUNT(DISTINCT ps.profissional_id)::bigint
    FROM profissional_servicos ps
    WHERE (p_categoria IS NULL OR ps.categoria = p_categoria)
    GROUP BY ps.categoria
    ORDER BY COUNT(DISTINCT ps.profissional_id) DESC;
END;
$$;

-- ------------------------------------------------------------
-- 3) Tool: bairros_com_menos_oferta
--    Lista os N bairros com menos profissionais cadastrados.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION ai_bairros_com_menos_oferta(p_limite int DEFAULT 10)
RETURNS TABLE(bairro text, total bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET LOCAL ROLE ai_readonly;
  RETURN QUERY
    SELECT p.bairro::text,
           COUNT(*)::bigint
    FROM profissionais p
    WHERE p.bairro IS NOT NULL AND p.bairro <> ''
    GROUP BY p.bairro
    ORDER BY COUNT(*) ASC
    LIMIT LEAST(p_limite, 50);  -- cap em 50 para não enviar tokens demais ao LLM
END;
$$;

-- ------------------------------------------------------------
-- 4) Tool: perfis_completos
--    Retorna profissionais com foto + descrição preenchidas.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION ai_perfis_completos(p_limite int DEFAULT 20)
RETURNS TABLE(
  id        uuid,
  nome      text,
  bairro    text,
  servicos  text[],
  tem_descricao boolean,
  tem_foto      boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SET LOCAL ROLE ai_readonly;
  RETURN QUERY
    SELECT
      p.id,
      p.nome::text,
      p.bairro::text,
      ARRAY_AGG(ps.servico ORDER BY ps.ordem)::text[],
      (p.descricao IS NOT NULL AND p.descricao <> '')::boolean,
      (p.foto_url  IS NOT NULL)::boolean
    FROM profissionais p
    JOIN profissional_servicos ps ON ps.profissional_id = p.id
    WHERE p.descricao IS NOT NULL AND p.descricao <> ''
      AND p.foto_url  IS NOT NULL
    GROUP BY p.id, p.nome, p.bairro, p.descricao, p.foto_url
    ORDER BY p.criado_em DESC
    LIMIT LEAST(p_limite, 50);
END;
$$;

-- ------------------------------------------------------------
-- 5) GRANT EXECUTE para service_role (servidor do agente)
-- ------------------------------------------------------------

GRANT EXECUTE ON FUNCTION ai_contar_por_categoria(text)    TO service_role;
GRANT EXECUTE ON FUNCTION ai_bairros_com_menos_oferta(int) TO service_role;
GRANT EXECUTE ON FUNCTION ai_perfis_completos(int)         TO service_role;
