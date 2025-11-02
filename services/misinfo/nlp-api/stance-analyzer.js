/**
 * Simple stance detection (RumourEval-style)
 * Classifies: support, deny, query, comment
 * In production, use fine-tuned BERT/RoBERTa models
 */

export async function analyzeStance(text, claim) {
  const textLower = text.toLowerCase();
  const claimLower = claim.toLowerCase();

  // Calculate keyword overlap
  const textWords = new Set(textLower.split(/\s+/));
  const claimWords = claimLower.split(/\s+/);
  const overlap = claimWords.filter(w => textWords.has(w)).length / claimWords.length;

  let stance = 'comment'; // Default
  let confidence = 0.5;

  // Query detection
  if (/\?|is this true|can anyone|does anyone know|source\?/i.test(text)) {
    stance = 'query';
    confidence = 0.8;
  }
  // Support detection
  else if (overlap > 0.6 && /\b(true|correct|right|yes|confirmed|verified|exactly|absolutely)\b/i.test(text)) {
    stance = 'support';
    confidence = 0.7 + (overlap * 0.2);
  }
  // Deny detection
  else if (/\b(false|wrong|fake|debunked|not true|misinformation|lie|hoax)\b/i.test(text)) {
    stance = 'deny';
    confidence = 0.75;
  }
  // Support with hedging
  else if (overlap > 0.5 && /\b(seems|appears|likely|probably|might be)\b/i.test(text)) {
    stance = 'support';
    confidence = 0.6;
  }

  return {
    stance,
    confidence,
    overlap,
    method: 'keyword'
  };
}

/**
 * Batch stance analysis
 */
export async function analyzeStanceBatch(texts, claim) {
  return Promise.all(texts.map(text => analyzeStance(text, claim)));
}

/**
 * Build stance distribution for a claim
 */
export function stanceDistribution(stances) {
  const dist = {
    support: 0,
    deny: 0,
    query: 0,
    comment: 0,
    total: stances.length
  };

  for (const s of stances) {
    dist[s.stance] = (dist[s.stance] || 0) + 1;
  }

  return dist;
}
