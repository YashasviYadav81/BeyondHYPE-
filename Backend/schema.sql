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

-- ===== Phase 4 additions =====

CREATE TABLE role_evidence (
  role_id TEXT NOT NULL REFERENCES roles(id),
  evidence_id TEXT NOT NULL REFERENCES evidence(id),
  PRIMARY KEY (role_id, evidence_id)
);

CREATE TABLE capability_evidence (
  capability_id TEXT NOT NULL REFERENCES capabilities(id),
  evidence_id TEXT NOT NULL REFERENCES evidence(id),
  PRIMARY KEY (capability_id, evidence_id)
);

CREATE TABLE tools (
  id TEXT PRIMARY KEY,
  field_id TEXT NOT NULL REFERENCES fields(id),
  capability_id TEXT REFERENCES capabilities(id),
  technology TEXT NOT NULL,
  category TEXT,
  level TEXT,
  why_it_matters TEXT,
  learn_first TEXT,
  suggested_project TEXT,
  docs_url TEXT,
  evidence TEXT
);

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  field_id TEXT NOT NULL REFERENCES fields(id),
  capability_id TEXT REFERENCES capabilities(id),
  title TEXT NOT NULL,
  difficulty TEXT,
  skills_practiced TEXT,
  tools TEXT,
  expected_outcome TEXT,
  what_to_demonstrate TEXT,
  next_level_extension TEXT
);

CREATE TABLE roadmap_steps (
  id TEXT PRIMARY KEY,
  field_id TEXT NOT NULL REFERENCES fields(id),
  step_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  level TEXT,
  category TEXT,
  prerequisite_id TEXT REFERENCES roadmap_steps(id) DEFERRABLE INITIALLY DEFERRED,
  capability_id TEXT REFERENCES capabilities(id),
  tools TEXT,
  exercise TEXT,
  project_id TEXT REFERENCES projects(id),
  next_step TEXT,
  estimated_effort TEXT,
  evidence TEXT,
  docs_links TEXT
);

CREATE TABLE hype_claims (
  id TEXT PRIMARY KEY,
  claim TEXT NOT NULL,
  keywords TEXT,
  verdict TEXT NOT NULL,
  interpretation TEXT,
  limitation TEXT,
  student_action TEXT
);

CREATE TABLE hype_claim_evidence (
  hype_claim_id TEXT NOT NULL REFERENCES hype_claims(id),
  evidence_id TEXT NOT NULL REFERENCES evidence(id),
  PRIMARY KEY (hype_claim_id, evidence_id)
);

CREATE INDEX idx_tools_field ON tools(field_id);
CREATE INDEX idx_projects_field ON projects(field_id);
CREATE INDEX idx_roadmap_field ON roadmap_steps(field_id);