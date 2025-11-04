import express from 'express';
import { applySecurityMiddleware, writeRateLimiter } from '../../shared/security-middleware.js';
import { getDatabase } from '../shared/init-db.js';

const app = express();
const PORT = process.env.PORT || 5013;

// Apply security middleware (headers, CORS, rate limiting, body size limits)
applySecurityMiddleware(app);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'robustness-api' });
});

// Text perturbation methods
const textPerturbations = {
  typo: (text) => {
    // Introduce random typos
    const chars = text.split('');
    const numTypos = Math.max(1, Math.floor(text.length * 0.02));
    for (let i = 0; i < numTypos; i++) {
      const pos = Math.floor(Math.random() * chars.length);
      if (chars[pos] !== ' ') {
        chars[pos] = String.fromCharCode(97 + Math.floor(Math.random() * 26));
      }
    }
    return chars.join('');
  },

  case_swap: (text) => {
    // Randomly swap case
    return text.split('').map(c =>
      Math.random() > 0.7 ? (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()) : c
    ).join('');
  },

  word_swap: (text) => {
    // Swap adjacent words
    const words = text.split(' ');
    if (words.length < 2) return text;
    const i = Math.floor(Math.random() * (words.length - 1));
    [words[i], words[i + 1]] = [words[i + 1], words[i]];
    return words.join(' ');
  },

  synonym: (text) => {
    // Simple synonym replacement (toy implementation)
    const synonyms = {
      'good': 'great', 'bad': 'poor', 'big': 'large', 'small': 'tiny',
      'happy': 'joyful', 'sad': 'unhappy', 'fast': 'quick', 'slow': 'sluggish'
    };
    let result = text;
    for (const [word, syn] of Object.entries(synonyms)) {
      result = result.replace(new RegExp(`\\b${word}\\b`, 'gi'), syn);
    }
    return result;
  },

  whitespace: (text) => {
    // Add/remove whitespace
    return text.split(' ').map(w =>
      Math.random() > 0.8 ? w + '  ' : w
    ).join(' ');
  },

  punctuation: (text) => {
    // Add/remove punctuation
    const puncts = ['.', ',', '!', '?'];
    const words = text.split(' ');
    return words.map(w =>
      Math.random() > 0.9 ? w + puncts[Math.floor(Math.random() * puncts.length)] : w
    ).join(' ');
  },

  backtranslation: (text) => {
    // Simulate backtranslation (toy - just rephrase)
    return text.replace(/\b(is|are|was|were)\b/g, 'became').replace(/\b(the|a|an)\b/g, '');
  },

  paraphrase: (text) => {
    // Very simple paraphrasing
    return text
      .replace(/\bhow to\b/gi, 'the way to')
      .replace(/\bwhat is\b/gi, 'the definition of')
      .replace(/\bwhy\b/gi, 'the reason')
      .replace(/\bcan you\b/gi, 'is it possible to');
  }
};

// Perturb text
app.post('/api/text/perturb', (req, res) => {
  try {
    const { text, method, count } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const methods = method ? [method] : Object.keys(textPerturbations);
    const numVariants = count || 1;
    const results = [];

    for (const m of methods) {
      if (!textPerturbations[m]) continue;

      for (let i = 0; i < numVariants; i++) {
        const perturbed = textPerturbations[m](text);
        results.push({
          method: m,
          original: text,
          perturbed,
          variant: i + 1
        });
      }
    }

    res.json({ success: true, perturbations: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test model robustness
app.post('/api/test/consistency', (req, res) => {
  try {
    const { text, method, model_endpoint, model_name } = req.body;
    const db = getDatabase();

    if (!textPerturbations[method]) {
      return res.status(400).json({ error: 'Invalid perturbation method' });
    }

    const perturbed = textPerturbations[method](text);

    // In a real implementation, you'd call the model endpoint here
    // For now, we'll simulate responses
    const originalOutput = `Response to: "${text}"`;
    const perturbedOutput = `Response to: "${perturbed}"`;

    // Calculate simple consistency score (in reality, use semantic similarity)
    const consistencyScore = originalOutput === perturbedOutput ? 1.0 : 0.5;

    // Store test result
    db.prepare(`
      INSERT INTO robustness_tests (test_type, original_input, perturbed_input,
                                    perturbation_method, original_output, perturbed_output,
                                    consistency_score, model_tested, metadata_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'text_perturbation',
      text,
      perturbed,
      method,
      originalOutput,
      perturbedOutput,
      consistencyScore,
      model_name || 'test-model',
      JSON.stringify({ endpoint: model_endpoint })
    );

    res.json({
      success: true,
      test: {
        original: text,
        perturbed,
        method,
        originalOutput,
        perturbedOutput,
        consistencyScore,
        passed: consistencyScore > 0.8
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available perturbation methods
app.get('/api/methods', (req, res) => {
  try {
    const methods = Object.keys(textPerturbations).map(name => ({
      name,
      type: 'text',
      description: `Applies ${name.replace('_', ' ')} perturbation`
    }));

    res.json({ success: true, methods });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get test history
app.get('/api/history', (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const db = getDatabase();

    const history = db.prepare(`
      SELECT * FROM robustness_tests
      ORDER BY created_at DESC LIMIT ?
    `).all(parseInt(limit));

    history.forEach(h => {
      try {
        h.metadata_json = JSON.parse(h.metadata_json || '{}');
      } catch (e) {
        h.metadata_json = {};
      }
    });

    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get statistics
app.get('/api/stats', (req, res) => {
  try {
    const db = getDatabase();

    const total = db.prepare('SELECT COUNT(*) as count FROM robustness_tests').get();
    const avgConsistency = db.prepare('SELECT AVG(consistency_score) as avg FROM robustness_tests').get();
    const byMethod = db.prepare(`
      SELECT perturbation_method, COUNT(*) as count, AVG(consistency_score) as avg_score
      FROM robustness_tests
      GROUP BY perturbation_method
    `).all();

    res.json({
      success: true,
      stats: {
        totalTests: total.count,
        avgConsistency: avgConsistency.avg ? avgConsistency.avg.toFixed(3) : 0,
        byMethod
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Image perturbation endpoint (placeholder for future implementation)
app.post('/api/image/perturb', (req, res) => {
  res.json({
    success: false,
    message: 'Image perturbation not yet implemented. Consider using noise injection, rotation, brightness adjustments.'
  });
});

app.listen(PORT, () => {
  console.log(`✅ Robustness API running on http://localhost:${PORT}`);
});
