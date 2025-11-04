-- AI Tools Database Schema
-- Supports RAG Pipeline and LLM Proxy services

-- RAG Pipeline Tables

-- Documents processed through RAG pipeline
CREATE TABLE IF NOT EXISTS rag_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Chunks generated from documents
CREATE TABLE IF NOT EXISTS rag_chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  chunk_size INTEGER NOT NULL,
  overlap INTEGER DEFAULT 0,
  metadata TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES rag_documents(id) ON DELETE CASCADE
);

-- Embeddings for chunks (mock - real embeddings would be vectors)
CREATE TABLE IF NOT EXISTS rag_embeddings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chunk_id INTEGER NOT NULL,
  embedding_model TEXT NOT NULL,
  embedding_dimension INTEGER NOT NULL,
  embedding_hash TEXT, -- Simulated embedding representation
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chunk_id) REFERENCES rag_chunks(id) ON DELETE CASCADE
);

-- Retrieval queries and results
CREATE TABLE IF NOT EXISTS rag_queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query_text TEXT NOT NULL,
  top_k INTEGER DEFAULT 5,
  results TEXT, -- JSON array of chunk IDs with scores
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- LLM Proxy Tables

-- LLM API requests
CREATE TABLE IF NOT EXISTS llm_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL, -- 'openai', 'anthropic', 'google'
  model TEXT NOT NULL,
  prompt TEXT NOT NULL,
  max_tokens INTEGER,
  temperature REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- LLM API responses
CREATE TABLE IF NOT EXISTS llm_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id INTEGER NOT NULL,
  response_text TEXT,
  finish_reason TEXT,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  latency_ms INTEGER,
  cost_usd REAL,
  error TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES llm_requests(id) ON DELETE CASCADE
);

-- Model pricing (simplified - real pricing changes frequently)
CREATE TABLE IF NOT EXISTS llm_pricing (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_cost_per_1k REAL NOT NULL, -- USD per 1K input tokens
  output_cost_per_1k REAL NOT NULL, -- USD per 1K output tokens
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, model)
);

-- Insert sample pricing data
INSERT OR REPLACE INTO llm_pricing (provider, model, input_cost_per_1k, output_cost_per_1k) VALUES
  ('openai', 'gpt-4', 0.03, 0.06),
  ('openai', 'gpt-4-turbo', 0.01, 0.03),
  ('openai', 'gpt-3.5-turbo', 0.0015, 0.002),
  ('anthropic', 'claude-3-opus', 0.015, 0.075),
  ('anthropic', 'claude-3-sonnet', 0.003, 0.015),
  ('anthropic', 'claude-3-haiku', 0.00025, 0.00125),
  ('google', 'gemini-pro', 0.00025, 0.0005),
  ('google', 'gemini-ultra', 0.0004, 0.0008);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chunks_document ON rag_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_chunk ON rag_embeddings(chunk_id);
CREATE INDEX IF NOT EXISTS idx_queries_created ON rag_queries(created_at);
CREATE INDEX IF NOT EXISTS idx_requests_provider ON llm_requests(provider);
CREATE INDEX IF NOT EXISTS idx_requests_model ON llm_requests(model);
CREATE INDEX IF NOT EXISTS idx_responses_request ON llm_responses(request_id);
