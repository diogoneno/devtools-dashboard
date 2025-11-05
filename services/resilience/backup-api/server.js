import express from 'express';
import { getDatabase } from './init-db.js';
import { applySecurityMiddleware, writeRateLimiter } from '../../shared/security-middleware.js';
import { createLogger, requestLogger, errorLogger } from '../../shared/logger.js';

const app = express();
const PORT = process.env.BACKUP_API_PORT || 5007;

// Create logger
const logger = createLogger({
  serviceName: 'backup-api',
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
    res.json({ status: 'ok', service: 'backup-api', database: 'connected' });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({ status: 'error', service: 'backup-api', database: 'disconnected', error: error.message });
  }
});

// Get KPIs
app.get('/api/kpis', (req, res) => {
  try {
    const db = getDatabase();

    const total = db.prepare('SELECT COUNT(*) as count FROM backups').get();
    const succeeded = db.prepare('SELECT COUNT(*) as count FROM backups WHERE status = ?').get('success');
    const failed = db.prepare('SELECT COUNT(*) as count FROM backups WHERE status = ?').get('failed');
    const immutable = db.prepare('SELECT COUNT(*) as count FROM backups WHERE immutable = 1').get();
    const avgDuration = db.prepare('SELECT AVG(duration_s) as avg FROM backups WHERE status = ?').get('success');
    const totalSize = db.prepare('SELECT SUM(size_gb) as sum FROM backups WHERE status = ?').get('success');

    const restores = db.prepare('SELECT COUNT(*) as count FROM restores').get();
    const drills = db.prepare('SELECT COUNT(*) as count FROM restores WHERE is_drill = 1').get();
    const avgRTO = db.prepare('SELECT AVG(rto_s) as avg FROM restores WHERE status = ?').get('success');

    const canaryAlerts = db.prepare('SELECT COUNT(*) as count FROM canaries WHERE status = ?').get('alert');

    res.json({
      success: true,
      totalBackups: total.count, // Added for integration test compatibility
      kpis: {
        backups: {
          total: total.count,
          succeeded: succeeded.count,
          failed: failed.count,
          successRate: total.count > 0 ? (succeeded.count / total.count * 100).toFixed(1) : 0,
          immutableCount: immutable.count,
          immutableCoverage: total.count > 0 ? (immutable.count / total.count * 100).toFixed(1) : 0,
          avgDurationMin: avgDuration.avg ? (avgDuration.avg / 60).toFixed(1) : 0,
          totalSizeGB: totalSize.sum || 0
        },
        restores: {
          total: restores.count,
          drills: drills.count,
          avgRTOMin: avgRTO.avg ? (avgRTO.avg / 60).toFixed(1) : 0
        },
        security: {
          canaryAlerts: canaryAlerts.count
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching KPIs', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Ingest backup jobs
app.post('/api/ingest/jobs', writeLimiter, (req, res) => {
  const db = getDatabase();

  try {
    const { jobs } = req.body;

    // Use explicit transaction to prevent race conditions
    const transaction = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO backups (job_id, policy, client, size_gb, duration_s, status, start_ts, end_ts, immutable, storage_tier)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let inserted = 0;
      for (const job of jobs) {
        stmt.run(
          job.job_id, job.policy, job.client, job.size_gb, job.duration_s,
          job.status, job.start_ts, job.end_ts, job.immutable ? 1 : 0, job.storage_tier
        );
        inserted++;
      }
      return inserted;
    });

    const inserted = transaction();

    logger.info('Backup jobs ingested', { count: inserted });
    res.json({ success: true, inserted });
  } catch (error) {
    logger.error('Error ingesting backup jobs', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Get backup jobs
app.get('/api/backups', (req, res) => {
  try {
    const db = getDatabase();
    const { limit = 100, status } = req.query;

    let query = 'SELECT * FROM backups';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY start_ts DESC LIMIT ?';
    params.push(parseInt(limit));

    const backups = db.prepare(query).all(...params);
    res.json({ success: true, backups });
  } catch (error) {
    logger.error('Error fetching backups', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// DR simulation
app.post('/api/dr/run', writeLimiter, (req, res) => {
  const db = getDatabase();

  try {
    const { scenario, targets, data_profile, desired_rto } = req.body;

    // Simple simulation
    const timeline = targets.map((target, i) => ({
      wave: i + 1,
      target,
      start: i * 30 * 60, // 30 min per wave
      duration: 20 * 60, // 20 min each
      end: (i * 30 + 20) * 60
    }));

    const totalTime = Math.max(...timeline.map(t => t.end));

    // Use explicit transaction
    const transaction = db.transaction(() => {
      return db.prepare(`
        INSERT INTO dr_scenarios (name, targets_json, data_profile_json, desired_rto_s, estimated_timeline_json)
        VALUES (?, ?, ?, ?, ?)
      `).run(scenario, JSON.stringify(targets), JSON.stringify(data_profile), desired_rto, JSON.stringify(timeline));
    });

    const result = transaction();

    logger.info('DR scenario created', { scenario, id: result.lastInsertRowid });
    res.json({
      success: true,
      timeline,
      totalTimeS: totalTime,
      meetsRTO: desired_rto ? totalTime <= desired_rto : null
    });
  } catch (error) {
    logger.error('Error running DR simulation', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Error logger middleware (must be last)
app.use(errorLogger(logger));

app.listen(PORT, () => {
  logger.info('Backup API started', { port: PORT, env: process.env.NODE_ENV || 'development' });
  console.log(`✅ Backup API running on http://localhost:${PORT}`);
});
