-- ============================================================
-- MIGRATION: foto do profissional
-- Adiciona a coluna foto_url e cria o bucket público de fotos.
--
-- ⚠️ NÃO aplicado automaticamente. Rode no Supabase (SQL Editor) quando
--    decidir lançar a feature. Idempotente — pode rodar mais de uma vez.
-- ============================================================

-- 1) Coluna que guarda a URL pública da foto do profissional.
ALTER TABLE profissionais
  ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- 2) Bucket público para as fotos.
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos-profissionais', 'fotos-profissionais', true)
ON CONFLICT (id) DO NOTHING;

-- 3) Políticas de Storage:
--    - leitura pública (as fotos aparecem no catálogo para qualquer visitante)
--    - upload público (o cadastro é anônimo hoje; reavaliar quando houver auth)
DROP POLICY IF EXISTS "Leitura publica fotos" ON storage.objects;
CREATE POLICY "Leitura publica fotos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'fotos-profissionais');

DROP POLICY IF EXISTS "Upload publico fotos" ON storage.objects;
CREATE POLICY "Upload publico fotos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'fotos-profissionais');

-- Nota: quando o login do profissional (Frente 2) entrar, troque o upload
-- público por uma política restrita ao dono autenticado. Ver
-- docs/autenticacao-e-selo.md.
