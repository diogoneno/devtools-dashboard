/**
 * LLM Proxy API Server
 *
 * WHY: Unified interface for multiple LLM providers (OpenAI, Anthropic, Google).
 * Enables cost comparison, latency benchmarking, and response quality analysis.
 *
 * ENDPOINTS:
 * - POST /api/llm/generate - Generate completion from any provider
 * - POST /api/llm/compare - Compare multiple providers side-by-side
 * - GET /api/llm/pricing - Get current pricing for all models
 * - GET /api/llm/history - Get generation history
 * - GET /health - Health check
 *
 * @example
 * // Generate completion
 * POST /api/llm/generate
 * {
 *   "provider": "openai",
 *   "model": "gpt-4",
 *   "prompt": "Explain quantum computing",
 *   "maxTokens": 500,
 *   "temperature": 0.7
 * }
 *
 * @example
 * // Compare providers
 * POST /api/llm/compare
 * {
 *   "prompt": "Write a haiku about AI",
 *   "providers": [
 *     { "provider": "openai", "model": "gpt-4" },
 *     { "provider": "anthropic", "model": "claude-3-sonnet" }
 *   ]
 * }
 *
 * PERFORMANCE: API calls are async and can take 1-10 seconds depending on provider/model.
 * Requests are logged synchronously to SQLite for analytics.
 *
 * API LIMITATIONS:
 * - OpenAI: 3,500 RPM (gpt-4), 10,000 RPM (gpt-3.5-turbo)
 * - Anthropic: 1,000 RPM (Claude 3)
 * - Google: 60 RPM (Gemini Pro)
 *
 * NOTE: This server simulates LLM responses for demo purposes.
 * In production, integrate with actual provider APIs using API keys.
 */

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.LLM_PORT || 5016;
const DB_PATH = path.join(__dirname, '../../../data/ai-tools.db');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Database connection
function getDb() {
  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');
  return db;
}

/**
 * Estimate token count (simplified)
 *
 * WHY: Token estimation helps predict API costs and enforce limits.
 * Real tokenization uses provider-specific tokenizers (tiktoken for OpenAI).
 *
 * @param {string} text - Text to tokenize
 * @returns {number} Estimated token count
 *
 * @example
 * estimateTokens("Hello world") // Returns ~2-3 tokens
 *
 * PERFORMANCE: O(n) where n is text length. Very fast (<1ms for typical prompts).
 *
 * NOTE: This is a rough estimate. Actual tokenization can vary ±20%.
 * Use provider tokenizers for accuracy: tiktoken (OpenAI), claude-tokenizer (Anthropic).
 */
function estimateTokens(text) {
  // Rough estimate: ~4 chars per token on average
  return Math.ceil(text.length / 4);
}

/**
 * Calculate cost based on token usage
 *
 * WHY: Real-time cost tracking prevents budget overruns.
 * Critical for production deployments at scale.
 *
 * @param {string} provider - Provider name
 * @param {string} model - Model name
 * @param {number} inputTokens - Input token count
 * @param {number} outputTokens - Output token count
 * @param {object} db - Database connection
 * @returns {number} Cost in USD
 *
 * PERFORMANCE: O(1) database lookup. Pricing cached in memory would be faster.
 */
function calculateCost(provider, model, inputTokens, outputTokens, db) {
  const pricing = db.prepare(`
    SELECT input_cost_per_1k, output_cost_per_1k
    FROM llm_pricing
    WHERE provider = ? AND model = ?
  `).get(provider, model);

  if (!pricing) {
    return 0;
  }

  const inputCost = (inputTokens / 1000) * pricing.input_cost_per_1k;
  const outputCost = (outputTokens / 1000) * pricing.output_cost_per_1k;

  return inputCost + outputCost;
}

/**
 * Simulate LLM response (mock for demo)
 *
 * WHY: Real LLM APIs require authentication and billing.
 * This simulates responses for testing without API keys.
 *
 * @param {string} provider - Provider name
 * @param {string} model - Model name
 * @param {string} prompt - User prompt
 * @param {object} options - Generation options (temperature, maxTokens, etc.)
 * @returns {Promise<object>} Simulated response
 *
 * @example
 * const response = await simulateLLMResponse('openai', 'gpt-4', 'Hello', {});
 * // Returns: { text: "Hello! How can I help you?", tokens: {...}, latency: 1234 }
 *
 * PERFORMANCE: Simulated delay of 500-2000ms to mimic real API latency.
 *
 * API LIMITATIONS: In production, replace with actual API calls:
 * - OpenAI: https://api.openai.com/v1/chat/completions
 * - Anthropic: https://api.anthropic.com/v1/messages
 * - Google: https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent
 */
async function simulateLLMResponse(provider, model, prompt, options = {}) {
  const { maxTokens = 500, temperature = 0.7 } = options;

  // Simulate API latency
  const startTime = Date.now();
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1500));
  const latency = Date.now() - startTime;

  // Estimate tokens
  const promptTokens = estimateTokens(prompt);

  // Simulate response based on provider
  let responseText;
  let completionTokens;

  if (provider === 'openai') {
    responseText = `[Simulated GPT-4 Response]\n\nThis is a simulated response from ${model}. In production, this would be an actual API call to OpenAI.\n\nYour prompt was: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`;
    completionTokens = Math.min(estimateTokens(responseText), maxTokens);
  } else if (provider === 'anthropic') {
    responseText = `[Simulated Claude Response]\n\nThis is a simulated response from ${model}. In production, this would call the Anthropic API.\n\nI understand you asked: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`;
    completionTokens = Math.min(estimateTokens(responseText), maxTokens);
  } else if (provider === 'google') {
    responseText = `[Simulated Gemini Response]\n\nThis is a simulated response from ${model}. In production, this would use the Google Generative AI API.\n\nYour query: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`;
    completionTokens = Math.min(estimateTokens(responseText), maxTokens);
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  return {
    text: responseText,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    latency,
    finishReason: 'stop',
  };
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'llm-proxy', port: PORT });
});

/**
 * Generate completion from single provider
 */
app.post('/api/llm/generate', async (req, res) => {
  try {
    const {
      provider,
      model,
      prompt,
      maxTokens = 500,
      temperature = 0.7,
    } = req.body;

    if (!provider || !model || !prompt) {
      return res.status(400).json({ error: 'Provider, model, and prompt are required' });
    }

    const db = getDb();

    // Log request
    const requestResult = db.prepare(`
      INSERT INTO llm_requests (provider, model, prompt, max_tokens, temperature)
      VALUES (?, ?, ?, ?, ?)
    `).run(provider, model, prompt, maxTokens, temperature);

    const requestId = requestResult.lastInsertRowid;

    // Generate response (simulated)
    const response = await simulateLLMResponse(provider, model, prompt, { maxTokens, temperature });

    // Calculate cost
    const cost = calculateCost(provider, model, response.promptTokens, response.completionTokens, db);

    // Log response
    db.prepare(`
      INSERT INTO llm_responses (request_id, response_text, finish_reason, prompt_tokens, completion_tokens, total_tokens, latency_ms, cost_usd)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      requestId,
      response.text,
      response.finishReason,
      response.promptTokens,
      response.completionTokens,
      response.totalTokens,
      response.latency,
      cost
    );

    db.close();

    res.json({
      success: true,
      provider,
      model,
      response: {
        text: response.text,
        tokens: {
          prompt: response.promptTokens,
          completion: response.completionTokens,
          total: response.totalTokens,
        },
        latency: response.latency,
        cost: parseFloat(cost.toFixed(6)),
      },
    });

  } catch (error) {
    console.error('Error generating completion:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Compare multiple providers side-by-side
 */
app.post('/api/llm/compare', async (req, res) => {
  try {
    const { prompt, providers } = req.body;

    if (!prompt || !providers || !Array.isArray(providers)) {
      return res.status(400).json({ error: 'Prompt and providers array are required' });
    }

    const db = getDb();
    const results = [];

    // Generate from each provider
    for (const config of providers) {
      const { provider, model, maxTokens = 500, temperature = 0.7 } = config;

      // Log request
      const requestResult = db.prepare(`
        INSERT INTO llm_requests (provider, model, prompt, max_tokens, temperature)
        VALUES (?, ?, ?, ?, ?)
      `).run(provider, model, prompt, maxTokens, temperature);

      const requestId = requestResult.lastInsertRowid;

      // Generate response
      const response = await simulateLLMResponse(provider, model, prompt, { maxTokens, temperature });

      // Calculate cost
      const cost = calculateCost(provider, model, response.promptTokens, response.completionTokens, db);

      // Log response
      db.prepare(`
        INSERT INTO llm_responses (request_id, response_text, finish_reason, prompt_tokens, completion_tokens, total_tokens, latency_ms, cost_usd)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        requestId,
        response.text,
        response.finishReason,
        response.promptTokens,
        response.completionTokens,
        response.totalTokens,
        response.latency,
        cost
      );

      results.push({
        provider,
        model,
        response: {
          text: response.text,
          tokens: {
            prompt: response.promptTokens,
            completion: response.completionTokens,
            total: response.totalTokens,
          },
          latency: response.latency,
          cost: parseFloat(cost.toFixed(6)),
        },
      });
    }

    db.close();

    res.json({
      success: true,
      prompt,
      results,
    });

  } catch (error) {
    console.error('Error comparing providers:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get current pricing
 */
app.get('/api/llm/pricing', (req, res) => {
  try {
    const db = getDb();

    const pricing = db.prepare(`
      SELECT * FROM llm_pricing
      ORDER BY provider, model
    `).all();

    db.close();

    res.json({
      success: true,
      pricing,
    });

  } catch (error) {
    console.error('Error getting pricing:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get generation history
 */
app.get('/api/llm/history', (req, res) => {
  try {
    const db = getDb();
    const limit = parseInt(req.query.limit) || 50;

    const history = db.prepare(`
      SELECT req.id, req.provider, req.model, req.prompt, req.created_at,
             res.response_text, res.prompt_tokens, res.completion_tokens,
             res.total_tokens, res.latency_ms, res.cost_usd
      FROM llm_requests req
      LEFT JOIN llm_responses res ON req.id = res.request_id
      ORDER BY req.created_at DESC
      LIMIT ?
    `).all(limit);

    db.close();

    res.json({
      success: true,
      history,
    });

  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server (unless in check mode)
if (process.argv.includes('--check')) {
  console.log('✅ LLM Proxy server syntax OK');
  process.exit(0);
} else {
  app.listen(PORT, () => {
    console.log(`🚀 LLM Proxy API running on port ${PORT}`);
    console.log(`📊 Database: ${DB_PATH}`);
    console.log(`🔍 Endpoints:`);
    console.log(`   POST http://localhost:${PORT}/api/llm/generate`);
    console.log(`   POST http://localhost:${PORT}/api/llm/compare`);
    console.log(`   GET  http://localhost:${PORT}/api/llm/pricing`);
    console.log(`   GET  http://localhost:${PORT}/api/llm/history`);
    console.log(`   GET  http://localhost:${PORT}/health`);
  });
}
