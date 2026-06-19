-- Sinais auto-declarados para o score de maturidade digital.
-- O profissional marca no /painel; não infla credibilidade pública (não aparecem no perfil público).
ALTER TABLE profissionais
  ADD COLUMN IF NOT EXISTS tem_google BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS instagram_ativo BOOLEAN NOT NULL DEFAULT false;
