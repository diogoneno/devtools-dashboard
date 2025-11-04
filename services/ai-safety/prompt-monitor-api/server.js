import express from 'express';
import { applySecurityMiddleware, writeRateLimiter } from '../../shared/security-middleware.js';
import { getDatabase } from '../shared/init-db.js';

const app = express();
const PORT = process.env.PORT || 5011;

// Apply security middleware (headers, CORS, rate limiting, body size limits)
applySecurityMiddleware(app);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'prompt-monitor-api' });
});

// Score a prompt for injection/jailbreak risks
app.post('/api/score', (req, res) => {
  try {
    const { input, context, model } = req.body;
    const db = getDatabase();

    // Load active policies
    const policies = db.prepare('SELECT * FROM prompt_policies WHERE enabled = 1').all();

    let injectionScore = 0;
    let jailbreakScore = 0;
    const violations = [];

    // Pattern-based detection
    for (const policy of policies) {
      if (policy.rule_type === 'regex') {
        const regex = new RegExp(policy.pattern, 'i');
        if (regex.test(input)) {
          violations.push({ policy: policy.name, severity: policy.severity });
          if (policy.severity === 'high') injectionScore += 0.4;
          else if (policy.severity === 'medium') injectionScore += 0.2;
        }
      } else if (policy.rule_type === 'keyword') {
        const keywords = policy.pattern.toLowerCase().split(',');
        for (const keyword of keywords) {
          if (input.toLowerCase().includes(keyword.trim())) {
            violations.push({ policy: policy.name, severity: policy.severity });
            if (policy.severity === 'high') jailbreakScore += 0.3;
            else if (policy.severity === 'medium') jailbreakScore += 0.15;
          }
        }
      }
    }

    // Cap scores at 1.0
    injectionScore = Math.min(injectionScore, 1.0);
    jailbreakScore = Math.min(jailbreakScore, 1.0);

    const maxScore = Math.max(injectionScore, jailbreakScore);
    let riskLevel = 'low';
    if (maxScore > 0.7) riskLevel = 'critical';
    else if (maxScore > 0.4) riskLevel = 'high';
    else if (maxScore > 0.2) riskLevel = 'medium';

    const flagged = maxScore > 0.4;

    // Store in database
    db.prepare(`
      INSERT INTO prompt_scores (input_text, context_text, injection_score, jailbreak_score,
                                 policy_violations, risk_level, flagged, model_used)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      input,
      context || null,
      injectionScore,
      jailbreakScore,
      JSON.stringify(violations),
      riskLevel,
      flagged ? 1 : 0,
      model || 'unknown'
    );

    res.json({
      success: true,
      score: {
        injection: injectionScore,
        jailbreak: jailbreakScore,
        overall: maxScore,
        riskLevel,
        flagged,
        violations
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get prompt history
app.get('/api/history', (req, res) => {
  try {
    const { limit = 50, flagged_only } = req.query;
    const db = getDatabase();

    let query = 'SELECT * FROM prompt_scores';
    const params = [];

    if (flagged_only === 'true') {
      query += ' WHERE flagged = 1';
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const history = db.prepare(query).all(...params);

    // Parse JSON fields
    history.forEach(h => {
      h.policy_violations = JSON.parse(h.policy_violations || '[]');
    });

    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manage policies
app.get('/api/policies', (req, res) => {
  try {
    const db = getDatabase();
    const policies = db.prepare('SELECT * FROM prompt_policies ORDER BY severity DESC').all();
    res.json({ success: true, policies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/policies', (req, res) => {
  try {
    const { name, description, rule_type, pattern, severity } = req.body;
    const db = getDatabase();

    db.prepare(`
      INSERT INTO prompt_policies (name, description, rule_type, pattern, severity)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, description, rule_type, pattern, severity);

    res.json({ success: true, message: 'Policy created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/policies/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;
    const db = getDatabase();

    db.prepare('UPDATE prompt_policies SET enabled = ? WHERE id = ?')
      .run(enabled ? 1 : 0, id);

    res.json({ success: true, message: 'Policy updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Prompt Monitor API running on http://localhost:${PORT}`);
});
