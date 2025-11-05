import express from 'express';
import { applySecurityMiddleware, writeRateLimiter } from '../../shared/security-middleware.js';
import { getDatabase } from '../backup-api/init-db.js';
import { createLogger, requestLogger, errorLogger } from '../../shared/logger.js';

const app = express();
const PORT = process.env.COMPLIANCE_API_PORT || 5010;

// Create logger
const logger = createLogger({
  serviceName: 'compliance-api',
  level: process.env.LOG_LEVEL || 'info',
  enableFile: process.env.NODE_ENV === 'production'
});

// Apply security middleware (headers, CORS, rate limiting, body size limits)
applySecurityMiddleware(app);

// Add request logging
app.use(requestLogger(logger));

// Health check - now verifies DB connection
app.get('/health', (req, res) => {
  try {
    const db = getDatabase();
    // Verify DB connection with a simple query
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok', service: 'compliance-api', database: 'connected' });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({ status: 'error', service: 'compliance-api', database: 'disconnected', error: error.message });
  }
});

// Get list of available compliance frameworks
app.get('/api/frameworks', (req, res) => {
  const frameworks = [
    {
      id: 'iso27001',
      name: 'ISO 27001',
      description: 'International standard for information security management systems',
      endpoint: '/api/iso27001'
    },
    {
      id: 'nist800-53',
      name: 'NIST 800-53',
      description: 'Security and privacy controls for information systems',
      endpoint: '/api/nist800-53'
    }
  ];
  res.json(frameworks);
});

// ISO 27001 mappings
app.get('/api/iso27001', (req, res) => {
  const controls = [
    { id: 'A.12.3.1', name: 'Information backup', status: 'compliant' },
    { id: 'A.17.1.2', name: 'Implementing information security continuity', status: 'partial' },
    { id: 'A.17.1.3', name: 'Verify, review and evaluate', status: 'compliant' }
  ];
  res.json({ success: true, controls });
});

// NIST 800-53 mappings
app.get('/api/nist800-53', (req, res) => {
  const controls = [
    { id: 'CP-9', name: 'System Backup', status: 'compliant' },
    { id: 'CP-10', name: 'System Recovery and Reconstitution', status: 'partial' },
    { id: 'SC-28', name: 'Protection of Information at Rest', status: 'compliant' }
  ];
  res.json({ success: true, controls });
});

// Generate evidence pack
app.post('/api/pack', (req, res) => {
  try {
    const db = getDatabase();
    const kpis = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN immutable = 1 THEN 1 ELSE 0 END) as immutable_count,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count
      FROM backups
    `).get();

    const drills = db.prepare('SELECT COUNT(*) as count FROM restores WHERE is_drill = 1').get();

    const pack = {
      generated_at: new Date().toISOString(),
      controls: {
        iso27001: ['A.12.3.1', 'A.17.1.2', 'A.17.1.3'],
        nist: ['CP-9', 'CP-10', 'SC-28']
      },
      evidence: {
        backupJobs: kpis.total,
        successRate: kpis.total > 0 ? (kpis.success_count / kpis.total * 100).toFixed(1) : 0,
        immutableBackups: kpis.immutable_count,
        drDrillsConducted: drills.count
      },
      attestation: 'Evidence pack generated from operational data'
    };

    res.json({ success: true, pack });
  } catch (error) {
    logger.error('Error generating compliance pack', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Error logger middleware (must be last)
app.use(errorLogger(logger));

app.listen(PORT, () => {
  logger.info('Compliance API started', { port: PORT, env: process.env.NODE_ENV || 'development' });
  console.log(`✅ Compliance API running on http://localhost:${PORT}`);
});
