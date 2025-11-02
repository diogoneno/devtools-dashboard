/**
 * Simple pattern-based claim extraction
 * In production, use transformer-based models like RoBERTa
 */

const CLAIM_PATTERNS = [
  // Assertion patterns
  /(?:^|[.!?]\s+)([A-Z][^.!?]*(?:is|are|was|were|has|have|will|would|could|should)[^.!?]{10,}[.!?])/g,

  // Statistical claims
  /(?:^|[.!?]\s+)([A-Z][^.!?]*(?:\d+%|\d+\s+percent|majority|minority|most|few|many)[^.!?]{10,}[.!?])/g,

  // Causal claims
  /(?:^|[.!?]\s+)([A-Z][^.!?]*(?:cause|caused|because|due to|lead to|result in)[^.!?]{10,}[.!?])/g,

  // Comparative claims
  /(?:^|[.!?]\s+)([A-Z][^.!?]*(?:better|worse|more|less|higher|lower|than)[^.!?]{10,}[.!?])/g,
];

export async function extractClaims(text) {
  const claims = [];
  const seenTexts = new Set();

  for (const pattern of CLAIM_PATTERNS) {
    const matches = [...text.matchAll(pattern)];

    for (const match of matches) {
      const claimText = match[1].trim();

      // Avoid duplicates
      if (seenTexts.has(claimText)) continue;
      seenTexts.add(claimText);

      // Basic quality filters
      if (claimText.length < 20 || claimText.length > 500) continue;
      if (!/[a-z]/.test(claimText)) continue; // Must have lowercase letters

      claims.push({
        text: claimText,
        confidence: calculateConfidence(claimText),
        spans: [{
          start: match.index,
          end: match.index + match[0].length,
          type: 'claim'
        }],
        method: 'pattern'
      });
    }
  }

  // Sort by confidence
  claims.sort((a, b) => b.confidence - a.confidence);

  return claims.slice(0, 10); // Top 10 claims
}

/**
 * Calculate confidence score based on heuristics
 */
function calculateConfidence(text) {
  let score = 0.5; // Base score

  // Boost for specific indicators
  if (/\d+%|\d+\s+percent/.test(text)) score += 0.15; // Numbers
  if (/according to|study|research|report|data shows/.test(text)) score += 0.15; // Sources
  if (/always|never|all|every|none/.test(text)) score += 0.1; // Absolute claims
  if (/is|are|was|were/.test(text)) score += 0.05; // Definitive statements

  // Penalize uncertainty
  if (/may|might|could|possibly|perhaps/.test(text)) score -= 0.2;
  if (/\?/.test(text)) score -= 0.3; // Questions

  return Math.max(0, Math.min(1, score));
}

/**
 * Extract named entities (simplified)
 */
export function extractEntities(text) {
  const entities = {
    organizations: [],
    locations: [],
    dates: []
  };

  // Very basic entity extraction
  const orgPatterns = /\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*(?:\s+(?:Inc|Corp|LLC|Ltd|Organization|Association|Foundation)))\b/g;
  entities.organizations = [...text.matchAll(orgPatterns)].map(m => m[1]);

  const datePatterns = /\b(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/g;
  entities.dates = [...text.matchAll(datePatterns)].map(m => m[1]);

  return entities;
}
