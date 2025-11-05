import express from 'express';
import { applySecurityMiddleware, writeRateLimiter } from '../../shared/security-middleware.js';
import { createLogger, requestLogger, errorLogger } from '../../shared/logger.js';
import dotenv from 'dotenv';
import { getDatabase } from '../init-db.js';
import { extractClaims } from './claim-extractor.js';
import { analyzeStance } from './stance-analyzer.js';
import { analyzeToxicity } from './toxicity-analyzer.js';

dotenv.config();

const app = express();
const PORT = process.env.NLP_PORT || 5003;

// Create logger
const logger = createLogger({
  serviceName: 'nlp-api',
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
    res.json({ status: 'ok', service: 'nlp-api', database: 'connected' });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({ status: 'error', service: 'nlp-api', database: 'disconnected', error: error.message });
  }
});

// Extract claims from text
app.post('/api/nlp/extract-claims', writeLimiter, async (req, res) => {
  const db = getDatabase();

  try {
    const { text, itemId } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const claims = await extractClaims(text);

    // Store in database if itemId provided
    if (itemId && claims.length > 0) {
      // Use explicit transaction to prevent race conditions
      const transaction = db.transaction(() => {
        const stmt = db.prepare(`
          INSERT INTO claims (item_id, text, confidence, spans)
          VALUES (?, ?, ?, ?)
        `);

        for (const claim of claims) {
          stmt.run(itemId, claim.text, claim.confidence, JSON.stringify(claim.spans));
        }
      });

      transaction();
      logger.info('Claims extracted and stored', { itemId, count: claims.length });
    }

    res.json({
      success: true,
      claims,
      count: claims.length
    });
  } catch (error) {
    logger.error('Claim extraction error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Analyze stance (agree/disagree/neutral/discuss)
app.post('/api/nlp/stance', async (req, res) => {
  try {
    const { text, claim } = req.body;

    if (!text || !claim) {
      return res.status(400).json({ error: 'text and claim are required' });
    }

    const stance = await analyzeStance(text, claim);

    res.json({
      success: true,
      stance
    });
  } catch (error) {
    logger.error('Stance analysis error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Analyze toxicity
app.post('/api/nlp/toxicity', writeLimiter, async (req, res) => {
  const db = getDatabase();

  try {
    const { text, itemId } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const toxicity = await analyzeToxicity(text);

    // Store score if itemId provided
    if (itemId && toxicity.score !== null) {
      // Use explicit transaction
      const transaction = db.transaction(() => {
        db.prepare(`
          INSERT INTO scores (item_id, kind, value, model, params)
          VALUES (?, 'toxicity', ?, ?, ?)
        `).run(itemId, toxicity.score, toxicity.model, JSON.stringify(toxicity.attributes));
      });

      transaction();
      logger.info('Toxicity score stored', { itemId, score: toxicity.score });
    }

    res.json({
      success: true,
      toxicity
    });
  } catch (error) {
    logger.error('Toxicity analysis error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Build propagation graph from items
app.post('/api/nlp/build-graph', writeLimiter, async (req, res) => {
  const db = getDatabase();

  try {
    const { windowHours = 24 } = req.body;

    // Get recent items
    const items = db.prepare(`
      SELECT id, url, text, published_at
      FROM items
      WHERE published_at > datetime('now', '-' || ? || ' hours')
      ORDER BY published_at DESC
    `).all(windowHours);

    // Build co-mention graph (simplified)
    const edges = [];
    const urlMentions = new Map();

    // Extract URLs mentioned in text
    for (const item of items) {
      const urls = extractURLs(item.text || '');
      urlMentions.set(item.url, urls);
    }

    // Create edges for co-mentions
    for (const [srcUrl, dstUrls] of urlMentions) {
      for (const dstUrl of dstUrls) {
        if (srcUrl !== dstUrl) {
          edges.push({ src: srcUrl, dst: dstUrl, weight: 1 });
        }
      }
    }

    // Store edges in transaction
    const transaction = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO edges (src_url, dst_url, weight, window_start, window_end)
        VALUES (?, ?, ?, datetime('now', '-' || ? || ' hours'), datetime('now'))
      `);

      for (const edge of edges) {
        stmt.run(edge.src, edge.dst, edge.weight, windowHours);
      }
    });

    transaction();

    logger.info('Propagation graph built', { nodes: items.length, edges: edges.length, windowHours });
    res.json({
      success: true,
      nodes: items.length,
      edges: edges.length,
      message: `Built graph with ${items.length} nodes and ${edges.length} edges`
    });
  } catch (error) {
    logger.error('Graph build error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Get graph data
app.get('/api/nlp/graph', (req, res) => {
  try {
    const db = getDatabase();
    const { limit = 500 } = req.query;

    const edges = db.prepare(`
      SELECT src_url, dst_url, weight, window_start, window_end
      FROM edges
      ORDER BY window_end DESC
      LIMIT ?
    `).all(parseInt(limit));

    res.json({
      success: true,
      edges,
      count: edges.length
    });
  } catch (error) {
    logger.error('Get graph error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Helper to extract URLs from text
function extractURLs(text) {
  const urlRegex = /https?:\/\/[^\s]+/g;
  return [...text.matchAll(urlRegex)].map(match => match[0]);
}

// Error logger middleware (must be last)
app.use(errorLogger(logger));

app.listen(PORT, () => {
  logger.info('NLP API started', { port: PORT, env: process.env.NODE_ENV || 'development' });
  console.log(`✅ NLP API running on http://localhost:${PORT}`);
});
