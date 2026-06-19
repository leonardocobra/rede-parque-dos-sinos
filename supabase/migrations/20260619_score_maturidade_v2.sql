-- Sinais auto-declarados para o score de maturidade digital (v2).
-- tem_google e instagram_ativo já existem da migration anterior.
ALTER TABLE profissionais
  ADD COLUMN IF NOT EXISTS tem_fotos_google       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tem_outro_diretorio    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tem_fotos_trabalho     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS link_na_bio            BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS usa_whatsapp_business  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fez_meta_ads           BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fez_google_ads         BOOLEAN NOT NULL DEFAULT false;
