CREATE TABLE fields (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  current_landscape TEXT,
  primary_evidence TEXT,
  overall_status TEXT,
  position INTEGER NOT NULL
);

CREATE TABLE sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  url TEXT,
  publication_date TEXT,
  accessed_date TEXT
);

CREATE TABLE evidence (
  id TEXT PRIMARY KEY,
  field_id TEXT NOT NULL REFERENCES fields(id),
  source_id INTEGER REFERENCES sources(id),
  claim TEXT NOT NULL,
  finding TEXT NOT NULL,
  supports TEXT,
  does_not_prove TEXT,
  source TEXT,
  evidence_type TEXT,
  geography TEXT,
  status TEXT,
  year TEXT,
  url TEXT,
  strength TEXT
);

CREATE TABLE industry_changes (
  id TEXT PRIMARY KEY,
  field_id TEXT NOT NULL REFERENCES fields(id),
  position INTEGER NOT NULL,
  change TEXT NOT NULL,
  what_is_happening TEXT,
  why_it_matters TEXT,
  status TEXT,
  source TEXT
);

CREATE TABLE industry_change_evidence (
  industry_change_id TEXT NOT NULL REFERENCES industry_changes(id),
  evidence_id TEXT NOT NULL REFERENCES evidence(id),
  PRIMARY KEY (industry_change_id, evidence_id)
);

CREATE TABLE work_changes (
  id TEXT PRIMARY KEY,
  field_id TEXT NOT NULL REFERENCES fields(id),
  position INTEGER NOT NULL,
  task TEXT NOT NULL,
  shift TEXT,
  mode TEXT,
  human_role TEXT
);

CREATE TABLE human_capabilities (
  id TEXT PRIMARY KEY,
  field_id TEXT NOT NULL REFERENCES fields(id),
  position INTEGER NOT NULL,
  capability TEXT NOT NULL,
  why_it_matters TEXT,
  work_mode TEXT,
  why_human TEXT
);

CREATE TABLE roles (
  id TEXT PRIMARY KEY,
  field_id TEXT NOT NULL REFERENCES fields(id),
  position INTEGER NOT NULL,
  role TEXT NOT NULL,
  status TEXT,
  what_is_changing TEXT,
  key_shift TEXT,
  evidence TEXT
);

CREATE TABLE capabilities (
  id TEXT PRIMARY KEY,
  field_id TEXT NOT NULL REFERENCES fields(id),
  position INTEGER NOT NULL,
  capability TEXT NOT NULL,
  category TEXT,
  meaning TEXT,
  examples TEXT,
  priority TEXT,
  evidence TEXT
);

CREATE TABLE learning_paths (
  id TEXT PRIMARY KEY,
  field_id TEXT NOT NULL REFERENCES fields(id),
  capability_id TEXT NOT NULL REFERENCES capabilities(id),
  position INTEGER NOT NULL,
  level TEXT,
  exercise TEXT,
  skills_built TEXT,
  next_step TEXT,
  industry_connection TEXT,
  evidence TEXT
);

CREATE TABLE company_cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  field_id TEXT REFERENCES fields(id),
  company TEXT NOT NULL,
  area TEXT,
  date TEXT,
  what_happened TEXT,
  what_students_should_notice TEXT,
  evidence_strength TEXT,
  source TEXT,
  url TEXT
);

CREATE INDEX idx_evidence_field ON evidence(field_id);
CREATE INDEX idx_ic_field ON industry_changes(field_id);
CREATE INDEX idx_wc_field ON work_changes(field_id);
CREATE INDEX idx_hc_field ON human_capabilities(field_id);
CREATE INDEX idx_roles_field ON roles(field_id);
CREATE INDEX idx_cap_field ON capabilities(field_id);
CREATE INDEX idx_lp_field ON learning_paths(field_id);
CREATE INDEX idx_lp_cap ON learning_paths(capability_id);
CREATE INDEX idx_cc_field ON company_cases(field_id);