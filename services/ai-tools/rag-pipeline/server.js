/**
 * RAG Pipeline API Server
 *
 * WHY: Provides document chunking, embedding simulation, and retrieval for RAG debugging.
 * Helps developers visualize and debug their RAG pipelines before deploying to production.
 *
 * ENDPOINTS:
 * - POST /api/rag/process - Process document (chunk + embed)
 * - POST /api/rag/query - Query with retrieval
 * - GET /api/rag/documents - List all documents
 * - GET /api/rag/documents/:id - Get document with chunks
 * - GET /health - Health check
 *
 * @example
 * // Process a document
 * POST /api/rag/process
 * {
 *   "name": "company-handbook.txt",
 *   "content": "Long document text...",
 *   "chunkSize": 500,
 *   "overlap": 50
 * }
 *
 * @example
 * // Query with retrieval
 * POST /api/rag/query
 * {
 *   "query": "What is the vacation policy?",
 *   "topK": 5
 * }
 *
 * PERFORMANCE: Synchronous SQLite operations. For production, use async/connection pooling.
 * Chunking is O(n) where n is document length. Retrieval is O(m) where m is total chunks.
 */

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.RAG_PORT || 5015;
const DB_PATH = path.join(__dirname, '../../../data/ai-tools.db');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Database connection (connection-per-request pattern)
function getDb() {
  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');
  return db;
}

/**
 * Split text into overlapping chunks
 *
 * WHY: Breaking documents into chunks improves retrieval precision and fits within
 * embedding model context windows (typically 512-8192 tokens).
 *
 * @param {string} text - Document text
 * @param {number} chunkSize - Characters per chunk
 * @param {number} overlap - Overlap between chunks to preserve context
 * @returns {Array<object>} Array of chunk objects with text and metadata
 *
 * @example
 * const chunks = chunkText("Long document...", 500, 50);
 * // Returns: [{ text: "...", index: 0, start: 0, end: 500 }, ...]
 *
 * PERFORMANCE: O(n) where n is text length. Minimal memory overhead.
 */
function chunkText(text, chunkSize = 500, overlap = 50) {
  const chunks = [];
  let start = 0;
  let index = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunkText = text.substring(start, end);

    chunks.push({
      text: chunkText,
      index,
      start,
      end,
      size: chunkText.length,
    });

    // Move forward by chunkSize - overlap
    start += chunkSize - overlap;
    index++;
  }

  return chunks;
}

/**
 * Simulate text embedding (hash-based for demo)
 *
 * WHY: Real embeddings use models like OpenAI text-embedding-ada-002 or sentence-transformers.
 * This simulates embeddings using a simple hash for visualization purposes.
 *
 * @param {string} text - Text to embed
 * @param {string} model - Embedding model name
 * @returns {object} Simulated embedding metadata
 *
 * PERFORMANCE: O(n) string hashing. Real embeddings are O(1) API calls with ~100-500ms latency.
 *
 * API LIMITATIONS: This is a mock. Real embeddings require API keys and have rate limits:
 * - OpenAI: 3,000 RPM, 1M TPM
 * - Cohere: 10,000 RPM
 * - HuggingFace: varies by plan
 */
function simulateEmbedding(text, model = 'text-embedding-ada-002') {
  // Simple hash for demonstration
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }

  return {
    model,
    dimension: 1536, // Ada-002 embedding size
    hash: hash.toString(16),
  };
}

/**
 * Calculate similarity between query and chunk (simplified)
 *
 * WHY: Real similarity uses cosine similarity on embedding vectors.
 * This uses simple keyword matching for demo purposes.
 *
 * @param {string} query - Query text
 * @param {string} chunkText - Chunk text
 * @returns {number} Similarity score (0-1)
 *
 * PERFORMANCE: O(q * c) where q is query words, c is chunk words.
 * Real cosine similarity is O(d) where d is embedding dimension.
 */
function calculateSimilarity(query, chunkText) {
  const queryWords = query.toLowerCase().split(/\s+/);
  const chunkWords = chunkText.toLowerCase().split(/\s+/);

  let matches = 0;
  queryWords.forEach(qWord => {
    if (chunkWords.some(cWord => cWord.includes(qWord) || qWord.includes(cWord))) {
      matches++;
    }
  });

  return matches / queryWords.length;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'rag-pipeline', port: PORT });
});

/**
 * Process document: chunk and embed
 */
app.post('/api/rag/process', (req, res) => {
  try {
    const { name, content, chunkSize = 500, overlap = 50, embeddingModel = 'text-embedding-ada-002' } = req.body;

    if (!name || !content) {
      return res.status(400).json({ error: 'Name and content are required' });
    }

    const db = getDb();

    // Insert document
    const docResult = db.prepare(`
      INSERT INTO rag_documents (name, content, metadata)
      VALUES (?, ?, ?)
    `).run(
      name,
      content,
      JSON.stringify({ originalLength: content.length, chunkSize, overlap })
    );

    const documentId = docResult.lastInsertRowid;

    // Chunk the document
    const chunks = chunkText(content, chunkSize, overlap);

    // Insert chunks and embeddings
    const chunkInsert = db.prepare(`
      INSERT INTO rag_chunks (document_id, chunk_text, chunk_index, chunk_size, overlap, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const embeddingInsert = db.prepare(`
      INSERT INTO rag_embeddings (chunk_id, embedding_model, embedding_dimension, embedding_hash)
      VALUES (?, ?, ?, ?)
    `);

    const chunkIds = [];

    chunks.forEach(chunk => {
      const chunkResult = chunkInsert.run(
        documentId,
        chunk.text,
        chunk.index,
        chunk.size,
        overlap,
        JSON.stringify({ start: chunk.start, end: chunk.end })
      );

      const chunkId = chunkResult.lastInsertRowid;
      chunkIds.push(chunkId);

      // Simulate embedding
      const embedding = simulateEmbedding(chunk.text, embeddingModel);
      embeddingInsert.run(
        chunkId,
        embedding.model,
        embedding.dimension,
        embedding.hash
      );
    });

    db.close();

    res.json({
      success: true,
      document: {
        id: documentId,
        name,
        chunksCreated: chunks.length,
        totalChars: content.length,
        avgChunkSize: Math.round(content.length / chunks.length),
      },
    });

  } catch (error) {
    console.error('Error processing document:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Query with retrieval
 */
app.post('/api/rag/query', (req, res) => {
  try {
    const { query, topK = 5 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const db = getDb();

    // Get all chunks
    const chunks = db.prepare(`
      SELECT c.id, c.chunk_text, c.chunk_index, c.document_id, d.name as document_name,
             e.embedding_model, e.embedding_hash
      FROM rag_chunks c
      JOIN rag_documents d ON c.document_id = d.id
      JOIN rag_embeddings e ON c.id = e.chunk_id
      ORDER BY c.document_id, c.chunk_index
    `).all();

    // Calculate similarity for each chunk
    const results = chunks.map(chunk => ({
      ...chunk,
      similarity: calculateSimilarity(query, chunk.chunk_text),
    }));

    // Sort by similarity and take top K
    results.sort((a, b) => b.similarity - a.similarity);
    const topResults = results.slice(0, topK);

    // Log query
    db.prepare(`
      INSERT INTO rag_queries (query_text, top_k, results)
      VALUES (?, ?, ?)
    `).run(
      query,
      topK,
      JSON.stringify(topResults.map(r => ({ chunk_id: r.id, score: r.similarity })))
    );

    db.close();

    res.json({
      success: true,
      query,
      topK,
      results: topResults.map(r => ({
        chunkId: r.id,
        documentId: r.document_id,
        documentName: r.document_name,
        chunkIndex: r.chunk_index,
        chunkText: r.chunk_text,
        similarity: r.similarity,
        embeddingModel: r.embedding_model,
      })),
    });

  } catch (error) {
    console.error('Error querying:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all documents
 */
app.get('/api/rag/documents', (req, res) => {
  try {
    const db = getDb();

    const documents = db.prepare(`
      SELECT d.id, d.name, d.created_at, d.metadata,
             COUNT(c.id) as chunk_count
      FROM rag_documents d
      LEFT JOIN rag_chunks c ON d.id = c.document_id
      GROUP BY d.id
      ORDER BY d.created_at DESC
    `).all();

    db.close();

    res.json({
      success: true,
      documents: documents.map(d => ({
        ...d,
        metadata: JSON.parse(d.metadata || '{}'),
      })),
    });

  } catch (error) {
    console.error('Error getting documents:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get document with chunks
 */
app.get('/api/rag/documents/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const document = db.prepare(`
      SELECT * FROM rag_documents WHERE id = ?
    `).get(id);

    if (!document) {
      db.close();
      return res.status(404).json({ error: 'Document not found' });
    }

    const chunks = db.prepare(`
      SELECT c.*, e.embedding_model, e.embedding_dimension, e.embedding_hash
      FROM rag_chunks c
      JOIN rag_embeddings e ON c.id = e.chunk_id
      WHERE c.document_id = ?
      ORDER BY c.chunk_index
    `).all(id);

    db.close();

    res.json({
      success: true,
      document: {
        ...document,
        metadata: JSON.parse(document.metadata || '{}'),
      },
      chunks: chunks.map(c => ({
        ...c,
        metadata: JSON.parse(c.metadata || '{}'),
      })),
    });

  } catch (error) {
    console.error('Error getting document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server (unless in check mode)
if (process.argv.includes('--check')) {
  console.log('✅ RAG Pipeline server syntax OK');
  process.exit(0);
} else {
  app.listen(PORT, () => {
    console.log(`🚀 RAG Pipeline API running on port ${PORT}`);
    console.log(`📊 Database: ${DB_PATH}`);
    console.log(`🔍 Endpoints:`);
    console.log(`   POST http://localhost:${PORT}/api/rag/process`);
    console.log(`   POST http://localhost:${PORT}/api/rag/query`);
    console.log(`   GET  http://localhost:${PORT}/api/rag/documents`);
    console.log(`   GET  http://localhost:${PORT}/health`);
  });
}
