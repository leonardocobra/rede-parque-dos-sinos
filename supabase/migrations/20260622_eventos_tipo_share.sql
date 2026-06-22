-- ============================================================
-- MIGRATION: amplia o CHECK de `eventos.tipo` para os tipos `share_*`
--
-- A migração 20260618_camada_eventos.sql criou a tabela `eventos` com um
-- domínio FECHADO de tipos:
--   tipo IN ('page_view', 'profile_view', 'contact_click', 'funnel_step')
--
-- Depois disso, o código de indicação passou a registrar eventos de share
-- (lib/eventos.js → registrarEvento) com tipos fora desse conjunto:
--   • share_perfil         — indicação do perfil (botões de compartilhar / canais)
--   • share_pos_avaliacao  — indicação feita logo após avaliar
--   • share_pedir_avaliacao— link de pedido de avaliação copiado pelo profissional
--
-- Como `registrarEvento` é best-effort (engole o erro do insert), esses
-- eventos vinham sendo REJEITADOS silenciosamente pela CHECK constraint
-- (Postgres 23514 check_violation) — o que explica o "shares=0" no /admin,
-- antes atribuído só à falta de adoção do botão. (Confirmado no remoto:
-- 0 linhas com tipo LIKE 'share_%' e constraint ainda com os 4 tipos.)
--
-- Esta migração recria o CHECK incluindo os 3 tipos de share, mantendo os
-- 4 originais. Idempotente: faz DROP ... IF EXISTS antes de recriar, então
-- pode rodar mais de uma vez sem erro.
--
-- ⚠️ NÃO apaga nem altera dados — só amplia o domínio aceito.
-- Ver lib/admin.js, lib/painelAnalytics.js (agregação de shares) e
-- docs/observabilidade-spec.md.
-- ============================================================

ALTER TABLE eventos DROP CONSTRAINT IF EXISTS eventos_tipo_check;

ALTER TABLE eventos ADD CONSTRAINT eventos_tipo_check CHECK (
  tipo IN (
    -- tipos originais (20260618_camada_eventos.sql)
    'page_view',
    'profile_view',
    'contact_click',
    'funnel_step',
    -- eventos de indicação (share) — fonte: lib/eventos.js
    'share_perfil',
    'share_pos_avaliacao',
    'share_pedir_avaliacao'
  )
);
