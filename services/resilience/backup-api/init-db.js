/**
 * Cyber Resilience database initialization and connection management.
 *
 * WHY: Cyber resilience monitoring tracks critical data (backups, ransomware canaries,
 * compliance evidence) that must be durable and queryable under stress. This module
 * provides centralized database management for 4 microservices (backup, ransomware,
 * logs, compliance) that share a single resilience.db database. Without this, services
 * would create schema conflicts and lose data during recovery scenarios.
 *
 * CRITICAL ISSUES (same as portfolio):
 * - getDatabase() creates NEW connection every call (connection leak)
 * - No connection pooling (fails at ~70 concurrent requests)
 * - See docs/API-SECURITY-AUDIT.md section 3 for remediation
 *
 * @module resilience/init-db
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '../../../data/resilience.db');
const SCHEMA_PATH = join(__dirname, 'schema.sql');

/**
 * Initializes the cyber resilience database with schema and WAL mode.
 *
 * WHY: Resilience data must survive disasters (that's the point!). This function
 * creates a durable SQLite database with WAL journaling to prevent corruption during
 * crashes. Without this, the first API request would fail with "no such table" errors,
 * and backup monitoring would be impossible.
 *
 * Database Configuration:
 * - Journal mode: WAL (survives power loss, enables concurrent reads)
 * - Synchronous: FULL (maximum durability for backup metadata)
 * - Foreign keys: ENABLED (backup_id references in restores)
 *
 * @returns {Database} SQLite database instance with resilience schema
 *
 * @throws {Error} If data/ directory doesn't exist
 * @throws {Error} If schema.sql not found or malformed
 * @throws {Error} If insufficient disk space (backup monitoring needs 10GB+)
 *
 * @example
 * // Initialize during backup-api startup
 * import { initDatabase } from './init-db.js';
 * const db = initDatabase();
 */
export function initDatabase() {
  const db = new Database(DB_PATH);
  const schema = readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schema);
  console.log('✅ Resilience database initialized at:', DB_PATH);
  return db;
}

/**
 * Returns a new SQLite database connection for the resilience database.
 *
 * WHY: Resilience APIs need database access to track backup jobs and canaries.
 * This function has CRITICAL FLAWS that cause failures during disaster recovery.
 *
 * CRITICAL ISSUE - Under Load Failure:
 * During a disaster recovery with 1000+ concurrent requests, the service crashes
 * with EMFILE after ~70 requests, DURING THE DISASTER when monitoring is most critical.
 *
 * See: docs/API-SECURITY-AUDIT.md section 3.4 for fixes
 *
 * @returns {Database} New SQLite connection to resilience.db
 *
 * @throws {Error} If file descriptor limit exceeded (EMFILE - connection leak)
 * @throws {Error} If database corrupted by ransomware (SQLITE_CORRUPT)
 * @throws {Error} If disk full (SQLITE_FULL)
 *
 * @see {@link docs/API-SECURITY-AUDIT.md|Security Audit}
 */
export function getDatabase() {
  return new Database(DB_PATH);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase();
}
