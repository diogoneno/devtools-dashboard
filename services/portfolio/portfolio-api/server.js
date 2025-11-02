import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getDatabase } from './init-db.js';
import { writeFileSync } from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORTFOLIO_API_PORT || 5006;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'portfolio-api' });
});

// Get all modules
app.get('/api/modules', (req, res) => {
  try {
    const db = getDatabase();
    const modules = db.prepare(`
      SELECT m.*,
        (SELECT COUNT(*) FROM artifacts WHERE module_slug = m.slug) as artifact_count,
        (SELECT COUNT(*) FROM reflections WHERE module_slug = m.slug) as reflection_count
      FROM modules m
      ORDER BY m.name
    `).all();

    res.json({ success: true, modules });
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single module
app.get('/api/modules/:slug', (req, res) => {
  try {
    const db = getDatabase();
    const module = db.prepare('SELECT * FROM modules WHERE slug = ?').get(req.params.slug);

    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Parse JSON fields
    module.outcomes = JSON.parse(module.outcomes_json || '[]');
    module.rubric = JSON.parse(module.rubric_json || '[]');

    res.json({ success: true, module });
  } catch (error) {
    console.error('Error fetching module:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get module artifacts
app.get('/api/modules/:slug/artifacts', (req, res) => {
  try {
    const db = getDatabase();
    const artifacts = db.prepare(`
      SELECT * FROM artifacts
      WHERE module_slug = ?
      ORDER BY kind, title
    `).all(req.params.slug);

    // Parse tags
    artifacts.forEach(a => {
      a.tags = JSON.parse(a.tags_json || '[]');
    });

    res.json({ success: true, artifacts });
  } catch (error) {
    console.error('Error fetching artifacts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get module outcomes
app.get('/api/modules/:slug/outcomes', (req, res) => {
  try {
    const db = getDatabase();
    const module = db.prepare('SELECT outcomes_json FROM modules WHERE slug = ?').get(req.params.slug);

    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const outcomes = JSON.parse(module.outcomes_json || '[]');
    res.json({ success: true, outcomes });
  } catch (error) {
    console.error('Error fetching outcomes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get module rubric
app.get('/api/modules/:slug/rubric', (req, res) => {
  try {
    const db = getDatabase();
    const module = db.prepare('SELECT rubric_json FROM modules WHERE slug = ?').get(req.params.slug);

    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const rubric = JSON.parse(module.rubric_json || '[]');
    res.json({ success: true, rubric });
  } catch (error) {
    console.error('Error fetching rubric:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get module reflections
app.get('/api/modules/:slug/reflections', (req, res) => {
  try {
    const db = getDatabase();
    const reflections = db.prepare(`
      SELECT * FROM reflections
      WHERE module_slug = ?
      ORDER BY date DESC
    `).all(req.params.slug);

    reflections.forEach(r => {
      r.tags = JSON.parse(r.tags_json || '[]');
    });

    res.json({ success: true, reflections });
  } catch (error) {
    console.error('Error fetching reflections:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add reflection
app.post('/api/modules/:slug/reflections', (req, res) => {
  try {
    const { title, body_md, tags, date } = req.body;

    if (!title || !body_md) {
      return res.status(400).json({ error: 'title and body_md are required' });
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO reflections (module_slug, date, title, body_md, tags_json)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      req.params.slug,
      date || new Date().toISOString().split('T')[0],
      title,
      body_md,
      JSON.stringify(tags || [])
    );

    res.json({
      success: true,
      id: result.lastInsertRowid,
      message: 'Reflection added'
    });
  } catch (error) {
    console.error('Error adding reflection:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get module feedback
app.get('/api/modules/:slug/feedback', (req, res) => {
  try {
    const db = getDatabase();
    const feedback = db.prepare(`
      SELECT * FROM feedback
      WHERE module_slug = ?
      ORDER BY date DESC
    `).all(req.params.slug);

    feedback.forEach(f => {
      f.rubric_scores = JSON.parse(f.rubric_scores_json || '{}');
    });

    res.json({ success: true, feedback });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add feedback
app.post('/api/modules/:slug/feedback', (req, res) => {
  try {
    const { author, body_md, rubric_scores, date } = req.body;

    if (!author || !body_md) {
      return res.status(400).json({ error: 'author and body_md are required' });
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO feedback (module_slug, author, date, body_md, rubric_scores_json)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      req.params.slug,
      author,
      date || new Date().toISOString().split('T')[0],
      body_md,
      JSON.stringify(rubric_scores || {})
    );

    res.json({
      success: true,
      id: result.lastInsertRowid,
      message: 'Feedback added'
    });
  } catch (error) {
    console.error('Error adding feedback:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export all data as JSON
app.post('/api/export/json', (req, res) => {
  try {
    const db = getDatabase();

    const modules = db.prepare('SELECT * FROM modules').all();
    const artifacts = db.prepare('SELECT * FROM artifacts').all();
    const reflections = db.prepare('SELECT * FROM reflections').all();
    const feedback = db.prepare('SELECT * FROM feedback').all();

    const exportData = {
      exported_at: new Date().toISOString(),
      modules: modules.map(m => ({
        ...m,
        outcomes: JSON.parse(m.outcomes_json || '[]'),
        rubric: JSON.parse(m.rubric_json || '[]')
      })),
      artifacts: artifacts.map(a => ({
        ...a,
        tags: JSON.parse(a.tags_json || '[]')
      })),
      reflections: reflections.map(r => ({
        ...r,
        tags: JSON.parse(r.tags_json || '[]')
      })),
      feedback: feedback.map(f => ({
        ...f,
        rubric_scores: JSON.parse(f.rubric_scores_json || '{}')
      }))
    };

    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Portfolio API running on http://localhost:${PORT}`);
});
