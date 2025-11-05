import express from 'express';
import { applySecurityMiddleware, writeRateLimiter } from '../../shared/security-middleware.js';
import { getDatabase } from '../backup-api/init-db.js';
import { createLogger, requestLogger, errorLogger } from '../../shared/logger.js';

const app = express();
const PORT = process.env.LOGS_API_PORT || 5009;

// Create logger
const logger = createLogger({
  serviceName: 'logs-api',
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
    res.json({ status: 'ok', service: 'logs-api', database: 'connected' });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({ status: 'error', service: 'logs-api', database: 'disconnected', error: error.message });
  }
});

// Ingest logs
app.post('/api/ingest/logs', writeLimiter, (req, res) => {
  const db = getDatabase();

  try {
    const { logs } = req.body;

    // Use explicit transaction to prevent race conditions
    const transaction = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO log_events (timestamp, source, severity, message, metadata_json)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const log of logs) {
        stmt.run(log.timestamp, log.source, log.severity, log.message, JSON.stringify(log.metadata || {}));
      }
      return logs.length;
    });

    const inserted = transaction();

    logger.info('Logs ingested', { count: inserted });
    res.json({ success: true, inserted });
  } catch (error) {
    logger.error('Error ingesting logs', { error: error.message, stack: error.stack });
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
    logger.error('Error searching logs', { error: error.message, stack: error.stack });
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
    logger.error('Error summarizing logs', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Error logger middleware (must be last)
app.use(errorLogger(logger));

app.listen(PORT, () => {
  logger.info('Logs API started', { port: PORT, env: process.env.NODE_ENV || 'development' });
  console.log(`✅ Logs API running on http://localhost:${PORT}`);
});
