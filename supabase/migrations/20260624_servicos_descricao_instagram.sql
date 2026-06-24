-- ============================================================
-- MIGRATION: adiciona descricao e instagram a profissional_servicos
-- Colunas usadas pelo /cadastro e pelo onboarding conversacional.
-- ADD COLUMN IF NOT EXISTS: idempotente, pode rodar mais de uma vez.
-- ============================================================

ALTER TABLE profissional_servicos
  ADD COLUMN IF NOT EXISTS descricao TEXT,
  ADD COLUMN IF NOT EXISTS instagram TEXT;

-- Grants: a tabela já tem INSERT público (table-level) desde a migration
-- 20260618_multiplos_servicos.sql. Novas colunas herdam o mesmo acesso.
-- service_role (onboarding) bypassa grants e pode sempre inserir.
