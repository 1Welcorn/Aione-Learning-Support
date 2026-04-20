-- 1. Tabela de Unidades (Units)
CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  sub TEXT,
  color TEXT,
  sort_order INTEGER,
  brief TEXT,
  plan_c TEXT,
  plan_h TEXT,
  plan_e TEXT,
  plan_a TEXT,
  wa TEXT,
  questions JSONB DEFAULT '[]'::jsonb,
  external_links JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Sessões (Sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id TEXT REFERENCES units(id) ON DELETE CASCADE,
  session_date TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Respostas (Answers)
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id TEXT REFERENCES units(id) ON DELETE CASCADE,
  question_index INTEGER,
  answer_value TEXT,
  is_done BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(unit_id, question_index)
);

-- 4. Tabela de Configurações (Settings)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Realtime para estas tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE units, sessions, answers, settings;

-- Inserir Configurações Iniciais
INSERT INTO settings (key, value) VALUES 
('admin_pin', '1234'),
('med_pin', '5678'),
('med_name', 'Mediadora'),
('student_email', 'ione.ribeiro@escola.pr.gov.br')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
