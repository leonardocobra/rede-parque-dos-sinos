-- ============================================================
-- MIGRATION: camada de eventos (fundação de analytics)
-- Tabela única de eventos anônimos que alimenta a Frente 3
-- (Observabilidade & Analytics). Registra page_view, profile_view,
-- contact_click e funnel_step com origem/UTM e um id de sessão efêmero.
--
-- É a fundação compartilhada: a fase 1 (admin/piloto) e a fase 2
-- (analytics por profissional) leem a MESMA tabela, só mudando o escopo.
--
-- Princípios:
--   • Anônima por design — NUNCA gravar PII. sessao_id é um id efêmero
--     gerado no cliente, sem ligação com pessoa/conta.
--   • Escrita pública só por INSERT, em colunas restritas (grants de coluna).
--   • Leitura NÃO é pública — só service_role (admin) lê, até existir o
--     painel /admin com allowlist. Visitante/profissional não leem eventos.
--
-- ⚠️ Idempotente. Pode rodar mais de uma vez. Ver docs/observabilidade-spec.md
--    (P0.1) e docs/roadmap.md (camada de eventos = Now).
-- ============================================================

-- ------------------------------------------------------------
-- 1) Tabela
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS eventos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- tipo do evento (ver CHECK abaixo)
  tipo            TEXT NOT NULL,

  -- alvo opcional: a qual profissional o evento se refere
  -- (profile_view, contact_click). NULL para page_view/funnel_step gerais.
  profissional_id UUID REFERENCES profissionais(id) ON DELETE SET NULL,

  -- contexto da navegação
  rota            TEXT,          -- ex.: "/catalogo", "/profissional/<id>"
  etapa           TEXT,          -- funnel_step: home | catalogo | perfil | contato
  canal           TEXT,          -- contact_click: whatsapp | instagram

  -- origem / atribuição (cauda da Frente 3 fase 2)
  origem          TEXT,          -- canal derivado: instagram | google | busca | direto | compartilhado
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,

  -- sessão efêmera, anônima (sem PII). Agrupa eventos de uma mesma visita.
  sessao_id       TEXT,

  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Domínio fechado de tipos: evita lixo e mantém as agregações simples.
  CONSTRAINT eventos_tipo_check CHECK (
    tipo IN ('page_view', 'profile_view', 'contact_click', 'funnel_step')
  )
);

-- ------------------------------------------------------------
-- 2) Índices para as consultas do painel admin
--    (séries temporais por tipo, drill-down por profissional, por canal)
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_eventos_tipo_data ON eventos (tipo, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_prof      ON eventos (profissional_id) WHERE profissional_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_eventos_data      ON eventos (criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_origem    ON eventos (origem) WHERE origem IS NOT NULL;

-- ------------------------------------------------------------
-- 3) RLS: escrita pública (INSERT) restrita; leitura fechada
-- ------------------------------------------------------------

ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;

-- INSERT público: o app (anon e authenticated) registra eventos.
-- A restrição do QUE pode ser gravado é feita por GRANT de coluna (passo 4);
-- a policy só autoriza a operação de inserir.
DROP POLICY IF EXISTS "App registra eventos" ON eventos;
CREATE POLICY "App registra eventos" ON eventos
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- SELECT/UPDATE/DELETE: nenhuma policy criada de propósito → negados para
-- anon/authenticated. Só o service_role (admin), que ignora RLS, lê os
-- eventos. O /admin (fase 1) consome via service_role no servidor.

-- ------------------------------------------------------------
-- 4) Grants de coluna: o cliente só preenche o que faz sentido
--    (id/criado_em ficam com os defaults; nada de gravar timestamps forjados)
-- ------------------------------------------------------------

REVOKE ALL ON eventos FROM anon, authenticated;

GRANT INSERT (
  tipo, profissional_id, rota, etapa, canal,
  origem, utm_source, utm_medium, utm_campaign, sessao_id
) ON eventos TO anon, authenticated;

-- Observações:
-- • Sem GRANT de SELECT para os papéis públicos → a leitura agregada é só do
--   admin (service_role) ou, no futuro, de uma policy de allowlist no /admin.
-- • A fase 2 (analytics por profissional) NÃO abre SELECT público: o profissional
--   verá apenas agregados dos PRÓPRIOS eventos, servidos pelo backend com escopo
--   por profissional_id (ver docs/observabilidade-spec.md, F2.1/F2.3).
-- • Risco aceito nesta fase: como o INSERT é público e anônimo, um agente pode
--   inflar eventos. Mitigações futuras (rate-limit na rota /api/evento, validação
--   de origem) ficam para o PR de captura; aqui criamos só o destino dos dados.
