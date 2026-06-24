-- ============================================================
-- MIGRATION: correção das tools do agente (Fase 2 AI Native Lab)
--
-- PROBLEMA: a migration original (20260624_ai_agente_tools.sql) usava
-- `SET LOCAL ROLE ai_readonly` dentro de funções SECURITY DEFINER.
-- O Postgres proíbe isso e levanta:
--     ERROR: 42501: cannot set parameter "role" within security-definer function
-- Resultado: toda chamada das tools falhava (capturada no loop do agente
-- como tool_result is_error), deixando o agente sem dados.
--
-- CORREÇÃO: remover `SET LOCAL ROLE` das três funções. As funções
-- permanecem SECURITY DEFINER com search_path fixo.
--
-- Nota sobre o modelo de segurança: a garantia central é estrutural —
-- o LLM NUNCA recebe SQL livre; só pode invocar estas três funções
-- parametrizadas, cujos corpos são SELECTs fixos (os parâmetros só
-- alimentam WHERE/LIMIT, sem SQL dinâmico). O role `ai_readonly`
-- (SELECT-only) continua existindo como documentação/defesa. Transferir
-- a posse das funções para `ai_readonly` exigiria conceder CREATE no
-- schema public a esse role — o que ampliaria seus privilégios, indo
-- contra o objetivo de least-privilege — por isso optou-se por manter
-- a posse em `postgres`.
--
-- ⚠️ Idempotente (CREATE OR REPLACE).
-- ============================================================

CREATE OR REPLACE FUNCTION ai_contar_por_categoria(p_categoria text DEFAULT NULL)
RETURNS TABLE(categoria text, total bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT ps.categoria::text,
           COUNT(DISTINCT ps.profissional_id)::bigint
    FROM profissional_servicos ps
    WHERE (p_categoria IS NULL OR ps.categoria = p_categoria)
    GROUP BY ps.categoria
    ORDER BY COUNT(DISTINCT ps.profissional_id) DESC;
END;
$$;

CREATE OR REPLACE FUNCTION ai_bairros_com_menos_oferta(p_limite int DEFAULT 10)
RETURNS TABLE(bairro text, total bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT p.bairro::text,
           COUNT(*)::bigint
    FROM profissionais p
    WHERE p.bairro IS NOT NULL AND p.bairro <> ''
    GROUP BY p.bairro
    ORDER BY COUNT(*) ASC
    LIMIT LEAST(p_limite, 50);
END;
$$;

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

GRANT EXECUTE ON FUNCTION ai_contar_por_categoria(text)    TO service_role;
GRANT EXECUTE ON FUNCTION ai_bairros_com_menos_oferta(int) TO service_role;
GRANT EXECUTE ON FUNCTION ai_perfis_completos(int)         TO service_role;
