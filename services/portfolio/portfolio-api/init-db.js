import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '../../../data/portfolio.db');
const SCHEMA_PATH = join(__dirname, 'schema.sql');

export function initDatabase() {
  const db = new Database(DB_PATH);

  const schema = readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schema);

  console.log('✅ Portfolio database initialized at:', DB_PATH);

  return db;
}

export function getDatabase() {
  return new Database(DB_PATH);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase();
}
