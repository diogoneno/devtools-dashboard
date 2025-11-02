-- Cyber Resilience Database Schema

-- Backup jobs
CREATE TABLE IF NOT EXISTS backups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id TEXT UNIQUE NOT NULL,
    policy TEXT NOT NULL,
    client TEXT NOT NULL,
    size_gb REAL,
    duration_s INTEGER,
    status TEXT NOT NULL,
    start_ts TEXT NOT NULL,
    end_ts TEXT,
    immutable INTEGER DEFAULT 0,
    storage_tier TEXT,
    error_msg TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status);
CREATE INDEX IF NOT EXISTS idx_backups_client ON backups(client);
CREATE INDEX IF NOT EXISTS idx_backups_policy ON backups(policy);
CREATE INDEX IF NOT EXISTS idx_backups_start ON backups(start_ts);

-- Restore operations
CREATE TABLE IF NOT EXISTS restores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id TEXT UNIQUE NOT NULL,
    client TEXT NOT NULL,
    rto_s INTEGER,
    rpo_s INTEGER,
    is_drill INTEGER DEFAULT 0,
    start_ts TEXT NOT NULL,
    end_ts TEXT,
    status TEXT NOT NULL,
    size_gb REAL,
    error_msg TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_restores_client ON restores(client);
CREATE INDEX IF NOT EXISTS idx_restores_drill ON restores(is_drill);

-- Ransomware canaries
CREATE TABLE IF NOT EXISTS canaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    host TEXT NOT NULL,
    path TEXT NOT NULL,
    last_seen_ts TEXT NOT NULL,
    file_hash TEXT,
    detection_ts TEXT,
    note TEXT,
    status TEXT DEFAULT 'healthy',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_canaries_host ON canaries(host);
CREATE INDEX IF NOT EXISTS idx_canaries_status ON canaries(status);

-- Log events
CREATE TABLE IF NOT EXISTS log_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    source TEXT NOT NULL,
    severity TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON log_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_severity ON log_events(severity);

-- DR scenarios
CREATE TABLE IF NOT EXISTS dr_scenarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    targets_json TEXT NOT NULL,
    data_profile_json TEXT,
    desired_rto_s INTEGER,
    estimated_timeline_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
