import express from 'express';
import { applySecurityMiddleware, writeRateLimiter } from '../../shared/security-middleware.js';
import { createLogger, requestLogger, errorLogger } from '../../shared/logger.js';
import axios from 'axios';
import { getDatabase } from '../shared/init-db.js';

const app = express();
const PORT = process.env.PORT || 5012;

// Create logger
const logger = createLogger({
  serviceName: 'redteam-api',
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
    res.json({ status: 'ok', service: 'redteam-api', database: 'connected' });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({ status: 'error', service: 'redteam-api', database: 'disconnected', error: error.message });
  }
});

// Get available attack recipes
app.get('/api/recipes', (req, res) => {
  try {
    const db = getDatabase();
    const { category } = req.query;

    let query = 'SELECT * FROM attack_recipes WHERE enabled = 1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY severity DESC';

    const recipes = db.prepare(query).all(...params);
    res.json({ success: true, recipes });
  } catch (error) {
    logger.error('Error fetching recipes', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Run an attack scenario
app.post('/api/attack', writeLimiter, async (req, res) => {
  const db = getDatabase();

  try {
    const { recipe, target, variables, dry_run } = req.body;

    // Get recipe template
    const recipeData = db.prepare('SELECT * FROM attack_recipes WHERE name = ?').get(recipe);

    if (!recipeData) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    // Substitute variables in template
    let payload = recipeData.template;
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        payload = payload.replace(`{${key}}`, value);
      }
    }

    if (dry_run) {
      // Just return the payload without executing
      return res.json({
        success: true,
        dry_run: true,
        attack: {
          recipe: recipeData.name,
          category: recipeData.category,
          payload,
          target: target || 'not specified'
        }
      });
    }

    // Execute attack against target (if provided)
    let response = null;
    let success = false;

    if (target) {
      try {
        // This is a simulated attack - in production, you'd call actual LLM endpoints
        // Only use this for testing YOUR OWN endpoints with proper authorization
        const apiResponse = await axios.post(target, {
          prompt: payload,
          model: req.body.model || 'test-model'
        }, {
          timeout: 10000,
          validateStatus: () => true // Don't throw on non-200
        });

        response = apiResponse.data;

        // Simple success detection (you'd want more sophisticated checking)
        success = apiResponse.status === 200;
      } catch (error) {
        response = { error: error.message };
      }
    }

    // Store attack result in transaction
    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO redteam_attacks (attack_name, recipe, target_endpoint, target_model,
                                     attack_payload, response_text, success, severity, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        recipeData.name,
        recipe,
        target || null,
        req.body.model || null,
        payload,
        JSON.stringify(response),
        success ? 1 : 0,
        recipeData.severity,
        req.body.notes || null
      );
    });

    transaction();

    logger.info('Attack executed', { recipe, target, success, severity: recipeData.severity });
    res.json({
      success: true,
      attack: {
        recipe: recipeData.name,
        category: recipeData.category,
        payload,
        target,
        response,
        success,
        severity: recipeData.severity
      }
    });
  } catch (error) {
    logger.error('Error executing attack', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Get attack history
app.get('/api/history', (req, res) => {
  try {
    const { limit = 50, success_only } = req.query;
    const db = getDatabase();

    let query = 'SELECT * FROM redteam_attacks';
    const params = [];

    if (success_only === 'true') {
      query += ' WHERE success = 1';
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const history = db.prepare(query).all(...params);

    // Parse JSON response fields
    history.forEach(h => {
      try {
        h.response_text = JSON.parse(h.response_text);
      } catch (e) {
        // Keep as string if not JSON
      }
    });

    res.json({ success: true, history });
  } catch (error) {
    logger.error('Error fetching history', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Get statistics
app.get('/api/stats', (req, res) => {
  try {
    const db = getDatabase();

    const total = db.prepare('SELECT COUNT(*) as count FROM redteam_attacks').get();
    const successful = db.prepare('SELECT COUNT(*) as count FROM redteam_attacks WHERE success = 1').get();
    const byCategory = db.prepare(`
      SELECT recipe as category, COUNT(*) as count, SUM(success) as successful
      FROM redteam_attacks
      GROUP BY recipe
    `).all();

    res.json({
      success: true,
      stats: {
        totalAttacks: total.count,
        successfulAttacks: successful.count,
        successRate: total.count > 0 ? (successful.count / total.count * 100).toFixed(1) : 0,
        byCategory
      }
    });
  } catch (error) {
    logger.error('Error fetching stats', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Create custom attack recipe
app.post('/api/recipes', writeLimiter, (req, res) => {
  const db = getDatabase();

  try {
    const { name, category, description, template, success_criteria, severity } = req.body;

    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO attack_recipes (name, category, description, template, success_criteria, severity)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(name, category, description, template, success_criteria, severity);
    });

    transaction();

    logger.info('Attack recipe created', { name, category, severity });
    res.json({ success: true, message: 'Recipe created' });
  } catch (error) {
    logger.error('Error creating recipe', { error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message });
  }
});

// Error logger middleware (must be last)
app.use(errorLogger(logger));

app.listen(PORT, () => {
  logger.info('Red Team API started', { port: PORT, env: process.env.NODE_ENV || 'development' });
  console.log(`✅ Red Team API running on http://localhost:${PORT}`);
});
