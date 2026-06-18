-- ============================================================
-- MIGRATION: contador de visualizações do perfil
-- Adiciona um contador acumulado por cadastro, incrementado a cada
-- abertura do perfil público (/profissional/[id]), para exibir no
-- /painel do profissional (métrica "visualizações do perfil", P1.2).
--
-- ⚠️ Idempotente. Pode rodar mais de uma vez. Ver docs/painel-profissional-spec.md (P1.2).
-- ============================================================

-- ------------------------------------------------------------
-- 1) Coluna do contador
-- ------------------------------------------------------------

ALTER TABLE profissionais
  ADD COLUMN IF NOT EXISTS visualizacoes INTEGER NOT NULL DEFAULT 0;

-- ------------------------------------------------------------
-- 2) Incremento atômico via função SECURITY DEFINER
--    Os papéis públicos NÃO têm GRANT de UPDATE em `visualizacoes`
--    (a migration de auth revogou o UPDATE de tabela e regranteou só os
--    campos editáveis). Logo, o contador não pode ser escrito direto pelo
--    cliente — só por esta função controlada, que apenas soma 1 numa linha
--    existente e não devolve dado nenhum.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION incrementar_visualizacao(p_id UUID)
  RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
AS $$
  UPDATE profissionais SET visualizacoes = visualizacoes + 1 WHERE id = p_id;
$$;

-- Só os papéis públicos do app podem chamar a função (não o PUBLIC genérico).
REVOKE ALL ON FUNCTION incrementar_visualizacao(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION incrementar_visualizacao(UUID) TO anon, authenticated;

-- Observações:
-- • SELECT em `visualizacoes` é público (a leitura do catálogo/perfil já lê *),
--   mas só o dono vê o número no /painel — não é exibido publicamente.
-- • O evento `perfil_view` do Vercel Analytics permanece (dashboard de produto);
--   este contador é a fonte simples de leitura para o painel.
