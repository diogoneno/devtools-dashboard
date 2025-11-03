/**
 * Database initialization for AI Safety & LLM Security services.
 *
 * WHY: AI safety tools (prompt monitoring, red team testing, robustness analysis)
 * need persistent storage for attack patterns, test results, and policy rules.
 * This module provides centralized database initialization to ensure all four
 * AI safety services (prompt-monitor, redteam, robustness, tool-gate) share
 * the same schema and can cross-reference results for comprehensive analysis.
 */
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '../../../data/ai-safety.db');
const SCHEMA_PATH = join(__dirname, 'schema.sql');

/**
 * Initializes the AI Safety database with tables for security testing and monitoring.
 *
 * WHY: AI safety services need to store and correlate data across multiple tools:
 * - Prompt monitor tracks injection attempts and jailbreak patterns
 * - Red team stores attack recipes and success rates
 * - Robustness testing records perturbation results
 * - Tool gate logs access control decisions
 *
 * This function creates the shared schema that enables these services to work
 * together (e.g., red team results inform prompt monitor policies). Called
 * during deployment or via npm run init-db.
 *
 * Schema includes:
 * - prompt_scores: Real-time prompt risk assessments
 * - attack_history: Red team attack logs
 * - robustness_tests: Model perturbation results
 * - tool_policies: Access control rules
 * - shared indexes for cross-service queries
 *
 * @returns {Database} Connected better-sqlite3 Database instance
 *
 * @throws {Error} If schema.sql cannot be read (file missing or permissions)
 * @throws {Error} If SQL execution fails (syntax error, disk full)
 * @throws {Error} If database path is not writable
 *
 * @example
 * // During service startup
 * import { initDatabase } from '../shared/init-db.js';
 * const db = initDatabase();
 * // Database now has prompt_scores, attack_history, etc.
 */
export function initDatabase() {
  const db = new Database(DB_PATH);
  const schema = readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schema);
  console.log('✅ AI Safety database initialized at:', DB_PATH);
  return db;
}

/**
 * Returns a new connection to the AI Safety database.
 *
 * WHY: AI safety APIs need isolated database connections per request to:
 * 1. Prevent connection state leakage (prepared statements, transactions)
 * 2. Enable concurrent request handling without blocking
 * 3. Avoid connection exhaustion (SQLite has limits on concurrent writers)
 *
 * Each service (prompt-monitor on 5011, redteam on 5012, etc.) calls this
 * independently, allowing them to scale horizontally without shared state.
 *
 * @returns {Database} New better-sqlite3 Database instance connected to ai-safety.db
 *
 * @throws {Error} If database doesn't exist (call initDatabase() first during setup)
 * @throws {Error} If database is corrupted (run integrity check: PRAGMA integrity_check)
 * @throws {Error} If too many connections open (SQLite limit ~1000)
 *
 * @example
 * // In prompt monitor API endpoint
 * import { getDatabase } from '../shared/init-db.js';
 *
 * app.post('/api/score', (req, res) => {
 *   const db = getDatabase();
 *   const score = calculatePromptScore(req.body.prompt);
 *   db.prepare('INSERT INTO prompt_scores VALUES (?, ?)').run(score.id, score.value);
 *   res.json(score);
 * });
 */
export function getDatabase() {
  return new Database(DB_PATH);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase();
}
