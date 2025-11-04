-- E-Portfolio Database Schema
-- NOTE: user_id references users.id from auth.db (enforced at application layer)

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Modules discovered from GitHub
CREATE TABLE IF NOT EXISTS modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,           -- Owner of this module (references auth.users.id)
    slug TEXT NOT NULL,                 -- Changed: slug is unique per user, not globally
    name TEXT NOT NULL,
    repo TEXT NOT NULL,
    path TEXT,
    summary_md TEXT,
    outcomes_json TEXT,
    rubric_json TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, slug)               -- Slug must be unique per user
);

CREATE INDEX IF NOT EXISTS idx_modules_user_id ON modules(user_id);
CREATE INDEX IF NOT EXISTS idx_modules_slug ON modules(user_id, slug);
CREATE INDEX IF NOT EXISTS idx_modules_repo ON modules(repo);

-- Artifacts (evidence) found in modules
CREATE TABLE IF NOT EXISTS artifacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,        -- Owner of this artifact (references auth.users.id)
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

CREATE INDEX IF NOT EXISTS idx_artifacts_user_id ON artifacts(user_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_module ON artifacts(module_slug);
CREATE INDEX IF NOT EXISTS idx_artifacts_kind ON artifacts(kind);

-- Student reflections
CREATE TABLE IF NOT EXISTS reflections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,        -- Author of this reflection (references auth.users.id)
    module_slug TEXT NOT NULL,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    body_md TEXT NOT NULL,
    tags_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_slug) REFERENCES modules(slug) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reflections_user_id ON reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_reflections_module ON reflections(module_slug);
CREATE INDEX IF NOT EXISTS idx_reflections_date ON reflections(date);

-- Feedback from supervisors/peers
CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,        -- Recipient of this feedback (module owner, references auth.users.id)
    author_id INTEGER NOT NULL,      -- Author of this feedback (supervisor/peer, references auth.users.id)
    module_slug TEXT NOT NULL,
    author TEXT NOT NULL,            -- Author display name (kept for compatibility)
    date TEXT NOT NULL,
    body_md TEXT NOT NULL,
    rubric_scores_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_slug) REFERENCES modules(slug) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_author_id ON feedback(author_id);
CREATE INDEX IF NOT EXISTS idx_feedback_module ON feedback(module_slug);
CREATE INDEX IF NOT EXISTS idx_feedback_author ON feedback(author);
