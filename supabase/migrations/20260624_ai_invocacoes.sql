-- ============================================================
-- MIGRATION: tabela ai_invocacoes (AI Native Lab — PR 0)
-- Registra cada chamada à API da Anthropic: modelo, tokens,
-- custo estimado, latência, sucesso/erro. Sem PII.
--
-- Princípios (igual à tabela `eventos`):
--   • Sem PII — nenhuma coluna de usuário ou sessão.
--   • Escrita exclusiva pelo servidor (service_role), sem INSERT público.
--   • Leitura fechada — só service_role lê (admins via /admin).
--
-- ⚠️ Idempotente. Pode rodar mais de uma vez.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Tabela
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_invocacoes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- identificação da chamada
  modelo      TEXT        NOT NULL,
  rota        TEXT,                          -- Route Handler de origem, ex.: "/api/ai/ping"

  -- consumo de tokens
  tokens_in   INTEGER     NOT NULL DEFAULT 0,
  tokens_out  INTEGER     NOT NULL DEFAULT 0,

  -- custo estimado em USD (8 casas decimais para valores sub-centavo)
  custo       NUMERIC(12, 8) NOT NULL DEFAULT 0,

  -- desempenho
  latencia_ms INTEGER     NOT NULL DEFAULT 0,

  -- resultado
  sucesso     BOOLEAN     NOT NULL DEFAULT true,
  erro        TEXT,                          -- mensagem de erro quando sucesso = false

  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 2) Índices para séries temporais e drill-down por rota/modelo
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_ai_invocacoes_data   ON ai_invocacoes (criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_ai_invocacoes_rota   ON ai_invocacoes (rota)   WHERE rota IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_invocacoes_modelo ON ai_invocacoes (modelo);

-- ------------------------------------------------------------
-- 3) RLS: leitura e escrita restritas ao service_role
-- ------------------------------------------------------------

ALTER TABLE ai_invocacoes ENABLE ROW LEVEL SECURITY;

-- Nenhuma policy pública criada:
--   • INSERT: só o servidor (service_role) grava — o cliente nunca acessa diretamente.
--   • SELECT: idem — service_role ignora RLS e lê diretamente.
--   • Anon/authenticated tentando qualquer operação recebem negação automática.

-- Sem GRANT para anon/authenticated: o serviço só é acessado via Route Handler
-- que usa o cliente service_role no Node runtime do Vercel.
