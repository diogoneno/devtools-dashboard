import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getDatabase } from '../init-db.js';
import { extractClaims } from './claim-extractor.js';
import { analyzeStance } from './stance-analyzer.js';
import { analyzeToxicity } from './toxicity-analyzer.js';

dotenv.config();

const app = express();
const PORT = process.env.NLP_PORT || 5003;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'nlp-api' });
});

// Extract claims from text
app.post('/api/nlp/extract-claims', async (req, res) => {
  try {
    const { text, itemId } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const claims = await extractClaims(text);

    // Store in database if itemId provided
    if (itemId && claims.length > 0) {
      const db = getDatabase();
      const stmt = db.prepare(`
        INSERT INTO claims (item_id, text, confidence, spans)
        VALUES (?, ?, ?, ?)
      `);

      for (const claim of claims) {
        stmt.run(itemId, claim.text, claim.confidence, JSON.stringify(claim.spans));
      }
    }

    res.json({
      success: true,
      claims,
      count: claims.length
    });
  } catch (error) {
    console.error('Claim extraction error:', error);
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
    console.error('Stance analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analyze toxicity
app.post('/api/nlp/toxicity', async (req, res) => {
  try {
    const { text, itemId } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const toxicity = await analyzeToxicity(text);

    // Store score if itemId provided
    if (itemId && toxicity.score !== null) {
      const db = getDatabase();
      db.prepare(`
        INSERT INTO scores (item_id, kind, value, model, params)
        VALUES (?, 'toxicity', ?, ?, ?)
      `).run(itemId, toxicity.score, toxicity.model, JSON.stringify(toxicity.attributes));
    }

    res.json({
      success: true,
      toxicity
    });
  } catch (error) {
    console.error('Toxicity analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Build propagation graph from items
app.post('/api/nlp/build-graph', async (req, res) => {
  try {
    const { windowHours = 24 } = req.body;
    const db = getDatabase();

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

    // Store edges
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO edges (src_url, dst_url, weight, window_start, window_end)
      VALUES (?, ?, ?, datetime('now', '-' || ? || ' hours'), datetime('now'))
    `);

    for (const edge of edges) {
      stmt.run(edge.src, edge.dst, edge.weight, windowHours);
    }

    res.json({
      success: true,
      nodes: items.length,
      edges: edges.length,
      message: `Built graph with ${items.length} nodes and ${edges.length} edges`
    });
  } catch (error) {
    console.error('Graph build error:', error);
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
    console.error('Get graph error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper to extract URLs from text
function extractURLs(text) {
  const urlRegex = /https?:\/\/[^\s]+/g;
  return [...text.matchAll(urlRegex)].map(match => match[0]);
}

app.listen(PORT, () => {
  console.log(`✅ NLP API running on http://localhost:${PORT}`);
});
