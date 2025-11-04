import express from 'express';
import { applySecurityMiddleware, writeRateLimiter } from '../../shared/security-middleware.js';
import { getDatabase } from '../backup-api/init-db.js';

const app = express();
const PORT = process.env.COMPLIANCE_API_PORT || 5010;

// Apply security middleware (headers, CORS, rate limiting, body size limits)
applySecurityMiddleware(app);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'compliance-api' });
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
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Compliance API running on http://localhost:${PORT}`);
});
