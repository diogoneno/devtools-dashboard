import fetch from 'node-fetch';

/**
 * Analyze toxicity using Perspective API (if available)
 * Falls back to keyword-based scoring if API key not set
 */

export async function analyzeToxicity(text) {
  const apiKey = process.env.PERSPECTIVE_API_KEY;

  if (apiKey) {
    return analyzeToxicityPerspective(text, apiKey);
  } else {
    console.warn('⚠️  PERSPECTIVE_API_KEY not set - using keyword-based fallback');
    return analyzeToxicityKeywords(text);
  }
}

/**
 * Use Perspective API for toxicity detection
 * https://perspectiveapi.com/
 */
async function analyzeToxicityPerspective(text, apiKey) {
  try {
    const url = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        comment: { text },
        requestedAttributes: {
          TOXICITY: {},
          SEVERE_TOXICITY: {},
          IDENTITY_ATTACK: {},
          INSULT: {},
          PROFANITY: {},
          THREAT: {}
        },
        languages: ['en']
      })
    });

    if (!response.ok) {
      throw new Error(`Perspective API error: ${response.status}`);
    }

    const data = await response.json();
    const attributes = {};

    for (const [attr, value] of Object.entries(data.attributeScores)) {
      attributes[attr.toLowerCase()] = value.summaryScore.value;
    }

    return {
      score: attributes.toxicity,
      attributes,
      model: 'perspective-api',
      warning: 'Perspective API has known biases. Use thoughtfully and consider calibration.'
    };
  } catch (error) {
    console.error('Perspective API error:', error);
    // Fall back to keywords
    return analyzeToxicityKeywords(text);
  }
}

/**
 * Keyword-based toxicity scoring (fallback)
 * This is VERY simplistic and for demo purposes only
 */
function analyzeToxicityKeywords(text) {
  const textLower = text.toLowerCase();

  // Basic toxic keyword lists
  const profanity = ['damn', 'hell', 'crap', 'stupid', 'idiot'];
  const insults = ['moron', 'fool', 'jerk', 'loser', 'dummy'];
  const threats = ['kill', 'destroy', 'hurt', 'attack', 'harm'];
  const identity = ['hate', 'racist', 'sexist', 'bigot'];

  let score = 0;
  const found = {
    profanity: 0,
    insults: 0,
    threats: 0,
    identity_attack: 0
  };

  // Count matches
  for (const word of profanity) {
    if (textLower.includes(word)) {
      found.profanity++;
      score += 0.1;
    }
  }
  for (const word of insults) {
    if (textLower.includes(word)) {
      found.insults++;
      score += 0.15;
    }
  }
  for (const word of threats) {
    if (textLower.includes(word)) {
      found.threats++;
      score += 0.25;
    }
  }
  for (const word of identity) {
    if (textLower.includes(word)) {
      found.identity_attack++;
      score += 0.3;
    }
  }

  // Check for ALL CAPS (shouting)
  if (text === text.toUpperCase() && text.length > 10) {
    score += 0.1;
  }

  // Check for excessive punctuation
  if (/!{2,}/.test(text)) {
    score += 0.05;
  }

  return {
    score: Math.min(score, 1.0),
    attributes: found,
    model: 'keyword-fallback',
    warning: 'This is a simple keyword-based fallback. Add PERSPECTIVE_API_KEY for better results.'
  };
}
