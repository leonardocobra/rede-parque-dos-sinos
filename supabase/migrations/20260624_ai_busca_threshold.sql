-- ============================================================
-- MIGRATION: busca semântica — threshold de similaridade
--
-- Problema: ai_buscar_servicos fazia ORDER BY ... LIMIT sem piso de
-- similaridade. Resultado: sempre devolvia os N mais próximos, mesmo
-- quando o mais próximo era irrelevante (ex.: buscar "eletricista" numa
-- base sem eletricista retornava manicure/motorista a ~0.34). Um "nada
-- encontrado" aparecia como "resultado errado".
--
-- Correção: novo parâmetro p_min_similaridade (DEFAULT 0.4). Serviços
-- abaixo do piso não entram no resultado — a ausência de match passa a
-- ser representável (retorna vazio).
--
-- Mantém SECURITY DEFINER + search_path fixo. SET LOCAL ROLE é proibido
-- em SECURITY DEFINER (ERROR 42501).
-- ============================================================

CREATE OR REPLACE FUNCTION ai_buscar_servicos(
  query_embedding   vector(512),
  p_limite          int     DEFAULT 10,
  p_categoria       text    DEFAULT NULL,
  p_min_similaridade float8 DEFAULT 0.4
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
      AND (1 - (ps.embedding <=> query_embedding)) >= p_min_similaridade
    ORDER BY ps.embedding <=> query_embedding
    LIMIT LEAST(p_limite, 20);
END;
$$;

GRANT EXECUTE ON FUNCTION ai_buscar_servicos(vector, int, text, float8) TO service_role;
