import express from 'express';
import { applySecurityMiddleware, writeRateLimiter } from '../../shared/security-middleware.js';
import { getDatabase } from '../backup-api/init-db.js';

const app = express();
const PORT = process.env.LOGS_API_PORT || 5009;

// Apply security middleware (headers, CORS, rate limiting, body size limits)
applySecurityMiddleware(app);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'logs-api' });
});

// Ingest logs
app.post('/api/ingest/logs', (req, res) => {
  try {
    const { logs } = req.body;
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO log_events (timestamp, source, severity, message, metadata_json)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const log of logs) {
      stmt.run(log.timestamp, log.source, log.severity, log.message, JSON.stringify(log.metadata || {}));
    }

    res.json({ success: true, inserted: logs.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search logs
app.get('/api/search', (req, res) => {
  try {
    const { q, limit = 100 } = req.query;
    const db = getDatabase();

    const logs = db.prepare(`
      SELECT * FROM log_events
      WHERE message LIKE ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(`%${q}%`, parseInt(limit));

    res.json({ success: true, logs, count: logs.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Summarize with risk rating
app.post('/api/summarize', (req, res) => {
  try {
    const { window, rules } = req.body;
    const db = getDatabase();

    const logs = db.prepare(`
      SELECT * FROM log_events
      WHERE datetime(timestamp) > datetime('now', ?)
      ORDER BY timestamp DESC
    `).all(window || '-1 hour');

    // Simple summarization
    const severityCounts = {};
    logs.forEach(log => {
      severityCounts[log.severity] = (severityCounts[log.severity] || 0) + 1;
    });

    const riskScore = (severityCounts.critical || 0) * 10 +
                     (severityCounts.error || 0) * 5 +
                     (severityCounts.warning || 0) * 2;

    const summary = {
      period: window || '1 hour',
      totalEvents: logs.length,
      severityCounts,
      riskScore,
      riskLevel: riskScore > 50 ? 'high' : riskScore > 20 ? 'medium' : 'low',
      topSources: [...new Set(logs.map(l => l.source))].slice(0, 5)
    };

    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Logs API running on http://localhost:${PORT}`);
});
