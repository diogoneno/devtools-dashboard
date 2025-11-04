import express from 'express';
import { applySecurityMiddleware, writeRateLimiter } from '../../shared/security-middleware.js';
import dotenv from 'dotenv';
import { getDatabase } from '../init-db.js';
import { searchFactChecks, parseClaimReview } from './factcheck-connector.js';

dotenv.config();

const app = express();
const PORT = process.env.FACTS_PORT || 5002;

// Apply security middleware (headers, CORS, rate limiting, body size limits)
applySecurityMiddleware(app);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'facts-api' });
});

// Search for fact-checks related to a claim
app.post('/api/facts/search', async (req, res) => {
  try {
    const { query, language = 'en', maxResults = 10 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    const factChecks = await searchFactChecks(query, language, maxResults);

    // Store in database
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO fact_checks (claim_text, publisher, url, rating, reviewed_at, schema_raw)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    let inserted = 0;
    for (const fc of factChecks) {
      const result = stmt.run(
        fc.claimText,
        fc.publisher,
        fc.url,
        fc.rating,
        fc.reviewedAt,
        JSON.stringify(fc.raw)
      );
      if (result.changes > 0) inserted++;
    }

    res.json({
      success: true,
      factChecks,
      count: factChecks.length,
      inserted,
      message: `Found ${factChecks.length} fact-checks, ${inserted} new`
    });
  } catch (error) {
    console.error('Fact-check search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Parse ClaimReview schema from a URL
app.post('/api/facts/parse-claimreview', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'url is required' });
    }

    const claimReview = await parseClaimReview(url);

    res.json({
      success: true,
      claimReview
    });
  } catch (error) {
    console.error('ClaimReview parse error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all stored fact-checks
app.get('/api/facts/stored', (req, res) => {
  try {
    const db = getDatabase();
    const { limit = 100, offset = 0, rating } = req.query;

    let query = 'SELECT * FROM fact_checks';
    const params = [];

    if (rating) {
      query += ' WHERE rating = ?';
      params.push(rating);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const factChecks = db.prepare(query).all(...params);

    res.json({
      success: true,
      factChecks,
      count: factChecks.length
    });
  } catch (error) {
    console.error('Get fact-checks error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Alias for /api/facts/stored - for backward compatibility with integration tests
app.get('/api/factchecks', (req, res) => {
  try {
    const db = getDatabase();
    const { limit = 100, offset = 0, rating } = req.query;

    let query = 'SELECT * FROM fact_checks';
    const params = [];

    if (rating) {
      query += ' WHERE rating = ?';
      params.push(rating);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const factChecks = db.prepare(query).all(...params);

    res.json({
      success: true,
      factChecks,
      count: factChecks.length
    });
  } catch (error) {
    console.error('Get fact-checks error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get IFCN signatories (credibility markers)
app.get('/api/facts/ifcn-signatories', (req, res) => {
  // List of IFCN signatory domains (partial list for demo)
  const ifcnSignatories = [
    'snopes.com',
    'factcheck.org',
    'politifact.com',
    'fullfact.org',
    'africacheck.org',
    'chequeado.com',
    'checkyourfact.com',
    'factchecker.in',
    'factuel.afp.com',
    'lemonde.fr',
    'newtral.es',
    'pagella.it',
    'teyit.org',
    'verificat.cat'
  ];

  res.json({
    success: true,
    signatories: ifcnSignatories,
    count: ifcnSignatories.length,
    source: 'IFCN Code of Principles'
  });
});

app.listen(PORT, () => {
  console.log(`✅ Facts API running on http://localhost:${PORT}`);
});
