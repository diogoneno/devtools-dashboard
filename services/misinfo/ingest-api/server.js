import express from 'express';
import cors from 'cors';
import { getDatabase } from '../init-db.js';
import { fetchGDELTEvents } from './gdelt-connector.js';
import { fetchRSSFeed } from './rss-connector.js';

const app = express();
const PORT = process.env.INGEST_PORT || 5001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ingest-api' });
});

// GDELT v2 events ingest
app.post('/api/ingest/gdelt', async (req, res) => {
  try {
    const { keyword, startDate, endDate, limit = 250 } = req.body;

    if (!keyword) {
      return res.status(400).json({ error: 'keyword is required' });
    }

    const events = await fetchGDELTEvents({ keyword, startDate, endDate, limit });

    // Insert into database
    const db = getDatabase();
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

    res.json({
      success: true,
      fetched: events.length,
      inserted,
      message: `Ingested ${inserted} new items from GDELT`
    });
  } catch (error) {
    console.error('GDELT ingest error:', error);
    res.status(500).json({ error: error.message });
  }
});

// RSS feed ingest
app.post('/api/ingest/rss', async (req, res) => {
  try {
    const { feedUrl, limit = 50 } = req.body;

    if (!feedUrl) {
      return res.status(400).json({ error: 'feedUrl is required' });
    }

    const items = await fetchRSSFeed(feedUrl, limit);

    // Insert into database
    const db = getDatabase();
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

    res.json({
      success: true,
      fetched: items.length,
      inserted,
      message: `Ingested ${inserted} new items from RSS feed`
    });
  } catch (error) {
    console.error('RSS ingest error:', error);
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
    console.error('Get items error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete all items (for testing)
app.delete('/api/items', (req, res) => {
  try {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM items').run();
    res.json({
      success: true,
      deleted: result.changes,
      message: `Deleted ${result.changes} items`
    });
  } catch (error) {
    console.error('Delete items error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Ingest API running on http://localhost:${PORT}`);
});
