-- AI Safety & LLM Security Database Schema
-- NOTE: user_id references users.id from auth.db (enforced at application layer)

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Prompt safety scores and detections
CREATE TABLE IF NOT EXISTS prompt_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,          -- User who submitted this prompt (references auth.users.id)
    input_text TEXT NOT NULL,
    context_text TEXT,
    injection_score REAL DEFAULT 0,
    jailbreak_score REAL DEFAULT 0,
    policy_violations TEXT,
    risk_level TEXT,
    flagged INTEGER DEFAULT 0,
    model_used TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prompt_scores_user_id ON prompt_scores(user_id);

-- Policy rules for prompt monitoring
CREATE TABLE IF NOT EXISTS prompt_policies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,          -- Owner of this policy (references auth.users.id)
    name TEXT NOT NULL,
    description TEXT,
    rule_type TEXT NOT NULL,
    pattern TEXT,
    severity TEXT DEFAULT 'medium',
    enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)              -- Policy name unique per user
);

CREATE INDEX IF NOT EXISTS idx_prompt_policies_user_id ON prompt_policies(user_id);

-- Red team attack scenarios and results
CREATE TABLE IF NOT EXISTS redteam_attacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,          -- User who executed this attack (references auth.users.id)
    attack_name TEXT NOT NULL,
    recipe TEXT NOT NULL,
    target_endpoint TEXT,
    target_model TEXT,
    attack_payload TEXT,
    response_text TEXT,
    success INTEGER DEFAULT 0,
    severity TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_redteam_attacks_user_id ON redteam_attacks(user_id);

-- Red team attack templates
CREATE TABLE IF NOT EXISTS attack_recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,          -- Owner of this recipe (references auth.users.id)
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    template TEXT NOT NULL,
    success_criteria TEXT,
    severity TEXT DEFAULT 'medium',
    enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)              -- Recipe name unique per user
);

CREATE INDEX IF NOT EXISTS idx_attack_recipes_user_id ON attack_recipes(user_id);

-- Robustness test results (text perturbations)
CREATE TABLE IF NOT EXISTS robustness_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,          -- User who ran this test (references auth.users.id)
    test_type TEXT NOT NULL,
    original_input TEXT NOT NULL,
    perturbed_input TEXT NOT NULL,
    perturbation_method TEXT NOT NULL,
    original_output TEXT,
    perturbed_output TEXT,
    consistency_score REAL,
    model_tested TEXT,
    metadata_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_robustness_tests_user_id ON robustness_tests(user_id);

-- Agent tool access control
CREATE TABLE IF NOT EXISTS tool_gates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,          -- Owner of this tool gate (references auth.users.id)
    tool_name TEXT NOT NULL,
    description TEXT,
    risk_level TEXT DEFAULT 'medium',
    requires_approval INTEGER DEFAULT 0,
    enabled INTEGER DEFAULT 1,
    allowed_contexts TEXT,
    rate_limit INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, tool_name)         -- Tool name unique per user
);

CREATE INDEX IF NOT EXISTS idx_tool_gates_user_id ON tool_gates(user_id);

-- Tool access logs
CREATE TABLE IF NOT EXISTS tool_access_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,          -- User who accessed this tool (references auth.users.id)
    tool_name TEXT NOT NULL,
    agent_id TEXT,
    context TEXT,
    approved INTEGER DEFAULT 0,
    reason TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tool_access_logs_user_id ON tool_access_logs(user_id);

-- NOTE: Default inserts removed because user_id is now required
-- Users will need to create their own policies, recipes, and tool gates
-- Or we'll provide default data seeding after user registration
