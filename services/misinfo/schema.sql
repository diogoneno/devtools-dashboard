-- Misinformation Lab Database Schema
-- SQLite database for storing ingested items, claims, fact-checks, and analysis

-- Items from various sources (news, social, etc.)
CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,              -- 'gdelt', 'rss', 'mastodon', 'youtube', etc.
    url TEXT,
    title TEXT,
    text TEXT,
    author TEXT,
    published_at TEXT,
    lang TEXT,
    media_type TEXT DEFAULT 'text',    -- 'text', 'video', 'image', 'audio'
    raw TEXT,                          -- JSON of original data
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source, url)
);

CREATE INDEX IF NOT EXISTS idx_items_source ON items(source);
CREATE INDEX IF NOT EXISTS idx_items_published ON items(published_at);
CREATE INDEX IF NOT EXISTS idx_items_created ON items(created_at);

-- Extracted claims from items
CREATE TABLE IF NOT EXISTS claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER,
    text TEXT NOT NULL,
    spans TEXT,                        -- JSON: [{start, end, label}]
    confidence REAL,
    extracted_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_claims_item ON claims(item_id);

-- Fact-checks from various sources
CREATE TABLE IF NOT EXISTS fact_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    claim_text TEXT NOT NULL,
    publisher TEXT,
    url TEXT,
    rating TEXT,                       -- 'true', 'false', 'mixture', etc.
    reviewed_at TEXT,
    schema_raw TEXT,                   -- JSON of ClaimReview schema
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(url)
);

CREATE INDEX IF NOT EXISTS idx_factchecks_rating ON fact_checks(rating);
CREATE INDEX IF NOT EXISTS idx_factchecks_publisher ON fact_checks(publisher);

-- Analysis scores (toxicity, stance, sentiment, etc.)
CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER,
    kind TEXT NOT NULL,                -- 'toxicity', 'stance', 'sentiment', 'credibility'
    value REAL NOT NULL,
    model TEXT,                        -- Model/API used
    params TEXT,                       -- JSON of parameters
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scores_item ON scores(item_id);
CREATE INDEX IF NOT EXISTS idx_scores_kind ON scores(kind);

-- Propagation graph edges (URL co-shares, co-mentions)
CREATE TABLE IF NOT EXISTS edges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    src_url TEXT NOT NULL,
    dst_url TEXT NOT NULL,
    weight INTEGER DEFAULT 1,
    window_start TEXT,
    window_end TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(src_url, dst_url, window_start)
);

CREATE INDEX IF NOT EXISTS idx_edges_src ON edges(src_url);
CREATE INDEX IF NOT EXISTS idx_edges_dst ON edges(dst_url);

-- User-defined policies for filtering and control
CREATE TABLE IF NOT EXISTS policies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    json TEXT NOT NULL,                -- JSON policy definition
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Curated datasets for reproducibility
CREATE TABLE IF NOT EXISTS datasets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    path TEXT,                         -- Path to parquet/CSV files
    rows INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
