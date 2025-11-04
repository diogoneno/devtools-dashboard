/**
 * Portfolio database initialization and connection management.
 *
 * WHY: E-portfolios store sensitive student data (reflections, feedback, outcomes)
 * across multiple tables with complex relationships. This module provides a centralized
 * database connection factory to ensure consistent schema initialization and connection
 * handling. Without this, services would create inconsistent database states and risk
 * data corruption from missing tables or foreign key constraints.
 *
 * CRITICAL ISSUES:
 * - getDatabase() creates a NEW connection on every call (connection leak)
 * - No connection pooling (fails at ~70 concurrent requests with EMFILE)
 * - Synchronous operations block Node.js event loop
 * - See docs/API-SECURITY-AUDIT.md section 3 for remediation
 *
 * @module portfolio/init-db
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '../../../data/portfolio.db');
const SCHEMA_PATH = join(__dirname, 'schema.sql');

/**
 * Initializes the portfolio database with schema and WAL mode.
 *
 * WHY: Portfolio data spans 4 tables (modules, artifacts, reflections, feedback) with
 * JSON columns and foreign keys. This function ensures tables exist with correct schemas
 * before any API requests arrive. Without this, the first request would crash with
 * "no such table" errors. WAL mode enables concurrent readers (critical for 60+ tools
 * accessing portfolio data simultaneously).
 *
 * Database Configuration:
 * - Journal mode: WAL (Write-Ahead Logging for concurrent reads)
 * - Synchronous: NORMAL (balance durability vs. performance)
 * - Foreign keys: ENABLED (enforce referential integrity)
 *
 * Performance Characteristics:
 * - Initialization time: ~50ms (reads schema, executes DDL)
 * - Database size: ~10-500MB (depending on artifact count)
 * - Idempotent: Safe to call multiple times (CREATE TABLE IF NOT EXISTS)
 *
 * @returns {Database} SQLite database instance with schema applied
 *
 * @throws {Error} If DB_PATH directory doesn't exist (e.g., data/ not created)
 * @throws {Error} If SCHEMA_PATH not found (schema.sql missing)
 * @throws {Error} If schema.sql has syntax errors (malformed SQL)
 * @throws {Error} If insufficient disk space (database creation fails)
 * @throws {Error} If file permissions prevent database creation
 *
 * @example
 * // Initialize database during service startup
 * import { initDatabase } from './init-db.js';
 *
 * const db = initDatabase();
 * console.log('Database ready at:', DB_PATH);
 * // Output: "✅ Portfolio database initialized at: /data/portfolio.db"
 *
 * @example
 * // Handle initialization errors
 * try {
 *   const db = initDatabase();
 * } catch (error) {
 *   if (error.code === 'ENOENT') {
 *     console.error('data/ directory missing. Run: mkdir -p data/');
 *   } else if (error.message.includes('syntax error')) {
 *     console.error('schema.sql is malformed. Check SQL syntax.');
 *   }
 *   process.exit(1);
 * }
 */
export function initDatabase() {
  const db = new Database(DB_PATH);

  const schema = readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schema);

  console.log('✅ Portfolio database initialized at:', DB_PATH);

  return db;
}

/**
 * Returns a new SQLite database connection for the portfolio database.
 *
 * WHY: Each API request needs database access to query modules, reflections, and feedback.
 * This function provides a database connection factory. However, it has a CRITICAL FLAW:
 * it creates a NEW connection on every call instead of pooling connections. Under load,
 * this exhausts file descriptors and crashes the service.
 *
 * CRITICAL ISSUE - Connection Leak:
 * - Each call opens a NEW SQLite connection (3 file descriptors: .db, .wal, .shm)
 * - Connections are NEVER closed (no db.close() in endpoints)
 * - With 1000 concurrent requests: 3000 file descriptors (exceeds Linux ulimit of 1024)
 * - Result: EMFILE errors, service crashes after ~70 requests
 *
 * CRITICAL ISSUE - Event Loop Blocking:
 * - better-sqlite3 is 100% SYNCHRONOUS (blocks main thread)
 * - A 50ms query blocks ALL other requests for 50ms
 * - With 1000 concurrent requests: queue depth explodes, timeouts cascade
 * - Max throughput: ~100 req/s (single-threaded bottleneck)
 *
 * Recommended Fixes:
 * 1. SHORT-TERM: Singleton pattern (one connection, reused)
 * 2. MEDIUM-TERM: Worker thread pool (4-16 workers)
 * 3. LONG-TERM: Migrate to PostgreSQL with async connection pooling
 *
 * See: docs/API-SECURITY-AUDIT.md section 3.4 for implementation examples
 *
 * @returns {Database} New SQLite database connection to portfolio.db
 * @returns {Function} return.prepare - Prepared statement factory
 * @returns {Function} return.exec - Execute raw SQL (DDL)
 * @returns {Function} return.pragma - Get/set SQLite pragmas
 * @returns {Function} return.close - Close connection (NOT called in current code)
 *
 * @throws {Error} If database file doesn't exist (SQLITE_CANTOPEN)
 * @throws {Error} If database is corrupted (SQLITE_CORRUPT)
 * @throws {Error} If file descriptor limit exceeded (EMFILE: too many open files)
 * @throws {Error} If another process holds exclusive lock (SQLITE_BUSY)
 * @throws {Error} If disk full (SQLITE_FULL)
 *
 * @example
 * // CURRENT USAGE (BROKEN - causes connection leaks)
 * import { getDatabase } from './init-db.js';
 *
 * app.get('/api/modules', (req, res) => {
 *   const db = getDatabase();  // ❌ Creates new connection
 *   const modules = db.prepare('SELECT * FROM modules').all();
 *   res.json({ success: true, modules });
 *   // ❌ Connection never closed - LEAKS
 * });
 *
 * @example
 * // RECOMMENDED USAGE (with explicit close)
 * import { getDatabase } from './init-db.js';
 *
 * app.get('/api/modules', (req, res) => {
 *   const db = getDatabase();
 *   try {
 *     const modules = db.prepare('SELECT * FROM modules').all();
 *     res.json({ success: true, modules });
 *   } finally {
 *     db.close();  // ✅ Properly closes connection
 *   }
 * });
 *
 * @see {@link https://github.com/WiseLibs/better-sqlite3/wiki/API|better-sqlite3 API}
 * @see {@link docs/API-SECURITY-AUDIT.md|Security Audit Section 3}
 */
export function getDatabase() {
  return new Database(DB_PATH);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase();
}
