-- E-Portfolio Database Schema

-- Modules discovered from GitHub
CREATE TABLE IF NOT EXISTS modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    repo TEXT NOT NULL,
    path TEXT,
    summary_md TEXT,
    outcomes_json TEXT,
    rubric_json TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_modules_slug ON modules(slug);
CREATE INDEX IF NOT EXISTS idx_modules_repo ON modules(repo);

-- Artifacts (evidence) found in modules
CREATE TABLE IF NOT EXISTS artifacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module_slug TEXT NOT NULL,
    kind TEXT NOT NULL,              -- 'pdf', 'image', 'notebook', 'code', 'markdown', 'presentation'
    title TEXT NOT NULL,
    rel_path TEXT NOT NULL,
    url TEXT,
    commit_sha TEXT,
    tags_json TEXT,
    size_bytes INTEGER,
    added_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_slug) REFERENCES modules(slug) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_artifacts_module ON artifacts(module_slug);
CREATE INDEX IF NOT EXISTS idx_artifacts_kind ON artifacts(kind);

-- Student reflections
CREATE TABLE IF NOT EXISTS reflections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module_slug TEXT NOT NULL,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    body_md TEXT NOT NULL,
    tags_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_slug) REFERENCES modules(slug) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reflections_module ON reflections(module_slug);
CREATE INDEX IF NOT EXISTS idx_reflections_date ON reflections(date);

-- Feedback from supervisors/peers
CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module_slug TEXT NOT NULL,
    author TEXT NOT NULL,
    date TEXT NOT NULL,
    body_md TEXT NOT NULL,
    rubric_scores_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_slug) REFERENCES modules(slug) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_feedback_module ON feedback(module_slug);
CREATE INDEX IF NOT EXISTS idx_feedback_author ON feedback(author);
