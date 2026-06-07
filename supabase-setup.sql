-- ============================================================
-- SETUP DO BANCO DE DADOS – Rede de Profissionais
-- Execute este SQL no Supabase: SQL Editor → New Query → Cole e Run
-- ============================================================

-- Tabela de profissionais
CREATE TABLE profissionais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  servico TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'Outros Serviços',
  bairro TEXT,
  regioes TEXT,
  instagram TEXT,
  experiencia TEXT,
  descricao TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Tabela de avaliações
CREATE TABLE avaliacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profissional_id UUID REFERENCES profissionais(id) ON DELETE CASCADE,
  pontual BOOLEAN NOT NULL,
  novamente BOOLEAN NOT NULL,
  conforme BOOLEAN NOT NULL,
  nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
  comentario TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;

-- Políticas: qualquer pessoa pode ler e cadastrar
CREATE POLICY "Leitura pública" ON profissionais FOR SELECT USING (true);
CREATE POLICY "Cadastro público" ON profissionais FOR INSERT WITH CHECK (true);

CREATE POLICY "Leitura pública" ON avaliacoes FOR SELECT USING (true);
CREATE POLICY "Avaliação pública" ON avaliacoes FOR INSERT WITH CHECK (true);

-- Índices para performance
CREATE INDEX idx_prof_categoria ON profissionais(categoria);
CREATE INDEX idx_aval_profissional ON avaliacoes(profissional_id);

-- Tabela de feedback (bugs e melhorias)
CREATE TABLE feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('bug', 'melhoria', 'outro')),
  mensagem TEXT NOT NULL,
  pagina TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Envio público" ON feedback FOR INSERT WITH CHECK (true);
