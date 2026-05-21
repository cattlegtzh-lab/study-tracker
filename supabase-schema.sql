-- 运行于 Supabase SQL Editor
-- 1. 每日记录
CREATE TABLE daily_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  raw_input TEXT NOT NULL,
  domain TEXT,
  project_name TEXT,
  content TEXT,
  output TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 想法日记
CREATE TABLE thoughts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  text TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  promoted_to_todo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 项目
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  domain TEXT,
  status TEXT DEFAULT 'active',
  progress TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 待办
CREATE TABLE todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  source TEXT,
  thought_id UUID REFERENCES thoughts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_daily_records_user_date ON daily_records(user_id, date DESC);
CREATE INDEX idx_thoughts_user_date ON thoughts(user_id, date DESC);
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_todos_user ON todos(user_id, status);

-- 关闭 RLS（单用户工具）
ALTER TABLE daily_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE thoughts DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE todos DISABLE ROW LEVEL SECURITY;
