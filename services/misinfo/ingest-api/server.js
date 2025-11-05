import express from 'express';
import { applySecurityMiddleware, writeRateLimiter } from '../../shared/security-middleware.js';
import { createLogger, requestLogger, errorLogger } from '../../shared/logger.js';
import { getDatabase } from '../init-db.js';
import { fetchGDELTEvents } from './gdelt-connector.js';
import { fetchRSSFeed } from './rss-connector.js';

const app = express();
const PORT = process.env.INGEST_PORT || 5001;

// Create logger
const logger = createLogger({
  serviceName: 'ingest-api',
  level: process.env.LOG_LEVEL || 'info',
  enableFile: process.env.NODE_ENV === 'production'
});

// Apply security middleware (headers, CORS, rate limiting, body size limits)
applySecurityMiddleware(app);

// Add request logging
app.use(requestLogger(logger));

// Alias for write rate limiter
const writeLimiter = writeRateLimiter();

// Health check - now verifies DB connection
app.get('/health', (req, res) => {
  try {
    const db = getDatabase();
    // Verify DB connection with a simple query
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok', service: 'ingest-api', database: 'connected' });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({ status: 'error', service: 'ingest-api', database: 'disconnected', error: error.message });
  }
});

// GDELT v2 events ingest
app.post('/api/ingest/gdelt', writeLimiter, async (req, res) => {
  const db = getDatabase();

  try {
    const { keyword, startDate, endDate, limit = 250 } = req.body;

    if (!keyword) {
      return res.status(400).json({ error: 'keyword is required' });
    }

    const events = await fetchGDELTEvents({ keyword, startDate, endDate, limit });

    // Insert into database with transaction
    const transaction = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO items (source, url, title, text, published_at, raw)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      let inserted = 0;
      for (const event of events) {
        const result = stmt.run(
          'gdelt',
          event.url,
          event.title,
          event.text,
          event.publishedAt,
          JSON.stringify(event)
        );
        if (result.changes > 0) inserted++;
      }
      return inserted;
    });

    const inserted = transaction();

    logger.info('GDELT events ingested', { keyword, fetched: events.length, inserted });
    res.json({
      success: true,
      fetched: events.length,
      inserted,
      message: `Ingested ${inserted} new items from GDELT`
    });
  } catch (error) {
    logger.error('GDELT ingest error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// RSS feed ingest
app.post('/api/ingest/rss', writeLimiter, async (req, res) => {
  const db = getDatabase();

  try {
    const { feedUrl, limit = 50 } = req.body;

    if (!feedUrl) {
      return res.status(400).json({ error: 'feedUrl is required' });
    }

    const items = await fetchRSSFeed(feedUrl, limit);

    // Insert into database with transaction
    const transaction = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO items (source, url, title, text, author, published_at, raw)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      let inserted = 0;
      for (const item of items) {
        const result = stmt.run(
          'rss',
          item.url,
          item.title,
          item.text,
          item.author,
          item.publishedAt,
          JSON.stringify(item)
        );
        if (result.changes > 0) inserted++;
      }
      return inserted;
    });

    const inserted = transaction();

    logger.info('RSS items ingested', { feedUrl, fetched: items.length, inserted });
    res.json({
      success: true,
      fetched: items.length,
      inserted,
      message: `Ingested ${inserted} new items from RSS feed`
    });
  } catch (error) {
    logger.error('RSS ingest error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Get all ingested items
app.get('/api/items', (req, res) => {
  try {
    const db = getDatabase();
    const { source, limit = 100, offset = 0 } = req.query;

    let query = 'SELECT * FROM items';
    const params = [];

    if (source) {
      query += ' WHERE source = ?';
      params.push(source);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const items = db.prepare(query).all(...params);

    res.json({
      success: true,
      items,
      count: items.length
    });
  } catch (error) {
    logger.error('Get items error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Delete all items (for testing)
app.delete('/api/items', writeLimiter, (req, res) => {
  const db = getDatabase();

  try {
    // Use explicit transaction
    const transaction = db.transaction(() => {
      return db.prepare('DELETE FROM items').run();
    });

    const result = transaction();

    logger.info('Items deleted', { count: result.changes });
    res.json({
      success: true,
      deleted: result.changes,
      message: `Deleted ${result.changes} items`
    });
  } catch (error) {
    logger.error('Delete items error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Error logger middleware (must be last)
app.use(errorLogger(logger));

app.listen(PORT, () => {
  logger.info('Ingest API started', { port: PORT, env: process.env.NODE_ENV || 'development' });
  console.log(`✅ Ingest API running on http://localhost:${PORT}`);
});
