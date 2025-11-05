import express from 'express';
import { applySecurityMiddleware, writeRateLimiter } from '../../shared/security-middleware.js';
import { createLogger, requestLogger, errorLogger } from '../../shared/logger.js';
import { getDatabase } from '../shared/init-db.js';

const app = express();
const PORT = process.env.PORT || 5014;

// Create logger
const logger = createLogger({
  serviceName: 'tool-gate-api',
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
    res.json({ status: 'ok', service: 'tool-gate-api', database: 'connected' });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({ status: 'error', service: 'tool-gate-api', database: 'disconnected', error: error.message });
  }
});

// Get all tool gates configuration
app.get('/api/gates', (req, res) => {
  try {
    const db = getDatabase();
    const gates = db.prepare('SELECT * FROM tool_gates ORDER BY risk_level DESC').all();
    res.json({ success: true, gates });
  } catch (error) {
    logger.error('Error fetching gates', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Request access to a tool
app.post('/api/request', writeLimiter, (req, res) => {
  const db = getDatabase();

  try {
    const { tool_name, agent_id, context, auto_approve } = req.body;

    // Get tool gate configuration
    const gate = db.prepare('SELECT * FROM tool_gates WHERE tool_name = ?').get(tool_name);

    if (!gate) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    if (!gate.enabled) {
      return res.json({
        success: false,
        approved: false,
        reason: 'Tool is currently disabled'
      });
    }

    // Check if approval is required
    let approved = !gate.requires_approval;

    // Auto-approve if flag is set and tool doesn't require approval
    if (auto_approve && !gate.requires_approval) {
      approved = true;
    }

    // Check allowed contexts
    if (gate.allowed_contexts) {
      const allowedContexts = gate.allowed_contexts.split(',').map(c => c.trim());
      if (context && !allowedContexts.includes(context)) {
        approved = false;
      }
    }

    // Log the access request in transaction
    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO tool_access_logs (tool_name, agent_id, context, approved, reason)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        tool_name,
        agent_id || 'anonymous',
        context || null,
        approved ? 1 : 0,
        approved ? 'Auto-approved' : gate.requires_approval ? 'Pending manual approval' : 'Denied - context mismatch'
      );
    });

    transaction();

    logger.info('Tool access requested', { tool_name, agent_id, approved });
    res.json({
      success: true,
      approved,
      requires_approval: gate.requires_approval,
      risk_level: gate.risk_level,
      reason: approved ? 'Access granted' : 'Approval required or context not allowed'
    });
  } catch (error) {
    logger.error('Error processing access request', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Approve pending access request
app.post('/api/approve/:log_id', writeLimiter, (req, res) => {
  const db = getDatabase();

  try {
    const { log_id } = req.params;
    const { approved, reason } = req.body;

    const transaction = db.transaction(() => {
      db.prepare('UPDATE tool_access_logs SET approved = ?, reason = ? WHERE id = ?')
        .run(approved ? 1 : 0, reason || 'Manual review', log_id);
    });

    transaction();

    logger.info('Access request updated', { log_id, approved });
    res.json({ success: true, message: 'Access request updated' });
  } catch (error) {
    logger.error('Error approving access', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Get access logs
app.get('/api/logs', (req, res) => {
  try {
    const { limit = 100, pending_only } = req.query;
    const db = getDatabase();

    let query = 'SELECT * FROM tool_access_logs';
    const params = [];

    if (pending_only === 'true') {
      query += ' WHERE approved = 0';
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const logs = db.prepare(query).all(...params);
    res.json({ success: true, logs });
  } catch (error) {
    logger.error('Error fetching logs', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Update tool gate configuration
app.patch('/api/gates/:tool_name', writeLimiter, (req, res) => {
  const db = getDatabase();

  try {
    const { tool_name } = req.params;
    const { enabled, requires_approval, risk_level, allowed_contexts, rate_limit } = req.body;

    const updates = [];
    const params = [];

    if (typeof enabled !== 'undefined') {
      updates.push('enabled = ?');
      params.push(enabled ? 1 : 0);
    }
    if (typeof requires_approval !== 'undefined') {
      updates.push('requires_approval = ?');
      params.push(requires_approval ? 1 : 0);
    }
    if (risk_level) {
      updates.push('risk_level = ?');
      params.push(risk_level);
    }
    if (typeof allowed_contexts !== 'undefined') {
      updates.push('allowed_contexts = ?');
      params.push(allowed_contexts);
    }
    if (typeof rate_limit !== 'undefined') {
      updates.push('rate_limit = ?');
      params.push(rate_limit);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    params.push(tool_name);

    const transaction = db.transaction(() => {
      db.prepare(`UPDATE tool_gates SET ${updates.join(', ')} WHERE tool_name = ?`)
        .run(...params);
    });

    transaction();

    logger.info('Tool gate updated', { tool_name });
    res.json({ success: true, message: 'Tool gate updated' });
  } catch (error) {
    logger.error('Error updating gate', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Get statistics
app.get('/api/stats', (req, res) => {
  try {
    const db = getDatabase();

    const total = db.prepare('SELECT COUNT(*) as count FROM tool_access_logs').get();
    const approved = db.prepare('SELECT COUNT(*) as count FROM tool_access_logs WHERE approved = 1').get();
    const byTool = db.prepare(`
      SELECT tool_name, COUNT(*) as total, SUM(approved) as approved
      FROM tool_access_logs
      GROUP BY tool_name
      ORDER BY total DESC
    `).all();

    res.json({
      success: true,
      stats: {
        totalRequests: total.count,
        approvedRequests: approved.count,
        approvalRate: total.count > 0 ? (approved.count / total.count * 100).toFixed(1) : 0,
        byTool
      }
    });
  } catch (error) {
    logger.error('Error fetching stats', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Create new tool gate
app.post('/api/gates', writeLimiter, (req, res) => {
  const db = getDatabase();

  try {
    const { tool_name, description, risk_level, requires_approval, allowed_contexts } = req.body;

    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO tool_gates (tool_name, description, risk_level, requires_approval, allowed_contexts)
        VALUES (?, ?, ?, ?, ?)
      `).run(tool_name, description, risk_level, requires_approval ? 1 : 0, allowed_contexts || null);
    });

    transaction();

    logger.info('Tool gate created', { tool_name });
    res.json({ success: true, message: 'Tool gate created' });
  } catch (error) {
    logger.error('Error creating gate', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Error logger middleware (must be last)
app.use(errorLogger(logger));

app.listen(PORT, () => {
  logger.info('Tool Gate API started', { port: PORT, env: process.env.NODE_ENV || 'development' });
  console.log(`✅ Tool Gate API running on http://localhost:${PORT}`);
});
