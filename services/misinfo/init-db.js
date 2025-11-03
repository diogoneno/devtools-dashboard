/**
 * Database initialization script for Misinformation Lab services.
 *
 * WHY: The Misinformation Lab uses SQLite for offline-first storage of news items,
 * fact-checks, and analysis results. This module provides initialization and access
 * to ensure the database schema is created before services start, preventing runtime
 * errors from missing tables or columns.
 */
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database path
const DB_PATH = join(__dirname, '../../data/misinfo.db');
const SCHEMA_PATH = join(__dirname, 'schema.sql');

/**
 * Initializes the Misinformation Lab database by executing the schema SQL.
 *
 * WHY: This function exists to provide idempotent database initialization during
 * deployment or first-time setup. It ensures all required tables (news_items,
 * fact_checks, nlp_analysis, forensics_results) exist before any API operations
 * are attempted. Called during service startup or via npm run init-db.
 *
 * @returns {Database} A connected better-sqlite3 Database instance
 *
 * @throws {Error} If schema.sql file cannot be read
 * @throws {Error} If SQL execution fails (e.g., syntax errors in schema)
 *
 * @example
 * // During service startup
 * import { initDatabase } from './init-db.js';
 * const db = initDatabase();
 *
 * @example
 * // Via npm script
 * // npm run init-db
 */
export function initDatabase() {
  const db = new Database(DB_PATH);

  // Read and execute schema
  const schema = readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schema);

  console.log('✅ Database initialized at:', DB_PATH);

  return db;
}

/**
 * Returns a new connection to the Misinformation Lab database.
 *
 * WHY: This function provides lazy database connections for API endpoints.
 * Unlike initDatabase(), it doesn't execute schema - it assumes the database
 * already exists. Each API request gets a fresh connection to avoid
 * connection state issues and enable proper connection pooling by the OS.
 *
 * @returns {Database} A new better-sqlite3 Database instance connected to misinfo.db
 *
 * @throws {Error} If database file doesn't exist (call initDatabase() first)
 * @throws {Error} If database file is corrupted or inaccessible
 *
 * @example
 * // In an API endpoint
 * import { getDatabase } from '../init-db.js';
 *
 * app.get('/api/news', (req, res) => {
 *   const db = getDatabase();
 *   const items = db.prepare('SELECT * FROM news_items').all();
 *   res.json(items);
 * });
 */
export function getDatabase() {
  return new Database(DB_PATH);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase();
}
