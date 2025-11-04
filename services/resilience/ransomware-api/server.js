import express from 'express';
import { applySecurityMiddleware, writeRateLimiter } from '../../shared/security-middleware.js';
import { getDatabase } from '../backup-api/init-db.js';

const app = express();
const PORT = process.env.RANSOMWARE_API_PORT || 5008;

// Apply security middleware (headers, CORS, rate limiting, body size limits)
applySecurityMiddleware(app);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ransomware-api' });
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
    res.status(500).json({ error: error.message });
  }
});

// Ingest canary updates
app.post('/api/canaries', (req, res) => {
  try {
    const { canaries } = req.body;
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO canaries (host, path, last_seen_ts, file_hash, status)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const canary of canaries) {
      stmt.run(canary.host, canary.path, canary.last_seen_ts, canary.file_hash, canary.status);
    }

    res.json({ success: true, inserted: canaries.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Ransomware API running on http://localhost:${PORT}`);
});
