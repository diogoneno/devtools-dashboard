/**
 * AI Tools Database Initialization Script
 *
 * WHY: Initializes SQLite databases for RAG Pipeline and LLM Proxy services.
 * Creates tables for documents, chunks, embeddings, queries, and LLM request/response logging.
 *
 * @example
 * // Initialize database
 * npm run init-db
 *
 * @throws {Error} If database file cannot be created or schema execution fails
 *
 * PERFORMANCE: Uses synchronous SQLite operations for simplicity in initialization.
 * Database is small (< 100MB expected) so sync operations are acceptable.
 *
 * API LIMITATIONS: None - local SQLite database with no external dependencies.
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DB_DIR, 'ai-tools.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

console.log('🔧 Initializing AI Tools Database...');

// Create data directory if it doesn't exist
if (!fs.existsSync(DB_DIR)) {
  console.log(`📁 Creating data directory: ${DB_DIR}`);
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Remove existing database for fresh initialization
if (fs.existsSync(DB_PATH)) {
  console.log(`🗑️  Removing existing database: ${DB_PATH}`);
  fs.unlinkSync(DB_PATH);
}

// Read schema file
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');

// Create and initialize database
console.log(`📊 Creating database: ${DB_PATH}`);
const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Execute schema
console.log('📝 Executing schema...');
db.exec(schema);

// Verify tables were created
const tables = db.prepare(`
  SELECT name FROM sqlite_master
  WHERE type='table'
  ORDER BY name
`).all();

console.log(`✅ Created ${tables.length} tables:`);
tables.forEach(table => {
  const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
  console.log(`   - ${table.name} (${count.count} rows)`);
});

db.close();

console.log('✨ AI Tools database initialized successfully!');
console.log(`📍 Database location: ${DB_PATH}`);
console.log('');
console.log('You can now start the services:');
console.log('  npm run dev        # Start both services');
console.log('  npm run dev:rag    # Start RAG Pipeline only');
console.log('  npm run dev:llm    # Start LLM Proxy only');
