import express from 'express';
import { applySecurityMiddleware, writeRateLimiter } from '../../shared/security-middleware.js';
import { getDatabase } from '../backup-api/init-db.js';
import { createLogger, requestLogger, errorLogger } from '../../shared/logger.js';

const app = express();
const PORT = process.env.RANSOMWARE_API_PORT || 5008;

// Create logger
const logger = createLogger({
  serviceName: 'ransomware-api',
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
    res.json({ status: 'ok', service: 'ransomware-api', database: 'connected' });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({ status: 'error', service: 'ransomware-api', database: 'disconnected', error: error.message });
  }
});

// Get early warning signals
app.get('/api/signals', (req, res) => {
  try {
    const db = getDatabase();

    // Canary status
    const canaries = db.prepare('SELECT * FROM canaries ORDER BY last_seen_ts DESC LIMIT 20').all();

    // Recent backup failures (potential tamper)
    const suspiciousFailures = db.prepare(`
      SELECT * FROM backups
      WHERE status = 'failed' AND datetime(start_ts) > datetime('now', '-24 hours')
      ORDER BY start_ts DESC LIMIT 10
    `).all();

    // Simulated entropy/extension signals (would come from agents in production)
    const signals = {
      canaries: canaries.map(c => ({
        host: c.host,
        path: c.path,
        status: c.status,
        lastSeen: c.last_seen_ts,
        alert: c.status === 'alert'
      })),
      backupTamper: suspiciousFailures.length,
      entropySpikes: Math.floor(Math.random() * 3), // Simulated
      extensionBursts: Math.floor(Math.random() * 2), // Simulated
      processAnomalies: Math.floor(Math.random() * 5) // Simulated
    };

    res.json({ success: true, signals });
  } catch (error) {
    logger.error('Error fetching signals', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Ingest canary updates
app.post('/api/canaries', writeLimiter, (req, res) => {
  const db = getDatabase();

  try {
    const { canaries } = req.body;

    // Use explicit transaction to prevent race conditions
    const transaction = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO canaries (host, path, last_seen_ts, file_hash, status)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const canary of canaries) {
        stmt.run(canary.host, canary.path, canary.last_seen_ts, canary.file_hash, canary.status);
      }
      return canaries.length;
    });

    const inserted = transaction();

    logger.info('Canary updates ingested', { count: inserted });
    res.json({ success: true, inserted });
  } catch (error) {
    logger.error('Error ingesting canaries', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Error logger middleware (must be last)
app.use(errorLogger(logger));

app.listen(PORT, () => {
  logger.info('Ransomware API started', { port: PORT, env: process.env.NODE_ENV || 'development' });
  console.log(`✅ Ransomware API running on http://localhost:${PORT}`);
});
