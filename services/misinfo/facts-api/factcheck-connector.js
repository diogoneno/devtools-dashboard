import fetch from 'node-fetch';

/**
 * Search Google Fact Check Tools API
 * API Docs: https://developers.google.com/fact-check/tools/api/reference/rest/v1alpha1/claims/search
 */
export async function searchFactChecks(query, language = 'en', maxResults = 10) {
  const apiKey = process.env.FACTCHECK_API_KEY;

  if (!apiKey) {
    console.warn('⚠️  FACTCHECK_API_KEY not set - using mock data');
    return getMockFactChecks(query);
  }

  try {
    const baseUrl = 'https://factchecktools.googleapis.com/v1alpha1/claims:search';
    const params = new URLSearchParams({
      key: apiKey,
      query: query,
      languageCode: language,
      pageSize: Math.min(maxResults, 100)
    });

    const url = `${baseUrl}?${params}`;
    console.log('Searching fact-checks for:', query);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Fact Check API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.claims || data.claims.length === 0) {
      return [];
    }

    return data.claims.flatMap(claim => {
      return claim.claimReview.map(review => ({
        claimText: claim.text,
        claimant: claim.claimant,
        claimDate: claim.claimDate,
        publisher: review.publisher.name,
        publisherSite: review.publisher.site,
        url: review.url,
        title: review.title,
        rating: review.textualRating,
        reviewDate: review.reviewDate,
        language: review.languageCode,
        raw: { claim, review }
      }));
    });
  } catch (error) {
    console.error('Fact-check search error:', error);
    throw new Error(`Failed to search fact-checks: ${error.message}`);
  }
}

/**
 * Parse ClaimReview structured data from a fact-check article URL
 * This would typically scrape the page and look for JSON-LD ClaimReview schema
 */
export async function parseClaimReview(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();

    // Look for JSON-LD script tags with ClaimReview
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
    const matches = [...html.matchAll(jsonLdRegex)];

    for (const match of matches) {
      try {
        const data = JSON.parse(match[1]);

        // Check if it's a ClaimReview or contains ClaimReview
        if (data['@type'] === 'ClaimReview') {
          return normalizeClaimReview(data);
        }

        if (Array.isArray(data)) {
          const claimReview = data.find(item => item['@type'] === 'ClaimReview');
          if (claimReview) {
            return normalizeClaimReview(claimReview);
          }
        }
      } catch (e) {
        // Invalid JSON, continue
      }
    }

    return null;
  } catch (error) {
    console.error('ClaimReview parse error:', error);
    throw new Error(`Failed to parse ClaimReview: ${error.message}`);
  }
}

/**
 * Normalize ClaimReview schema data
 */
function normalizeClaimReview(data) {
  return {
    claimText: data.claimReviewed,
    claimant: data.itemReviewed?.author?.name,
    claimDate: data.itemReviewed?.datePublished,
    rating: data.reviewRating?.ratingValue || data.reviewRating?.alternateName,
    bestRating: data.reviewRating?.bestRating,
    worstRating: data.reviewRating?.worstRating,
    author: data.author?.name,
    publisher: data.publisher?.name,
    url: data.url,
    datePublished: data.datePublished,
    raw: data
  };
}

/**
 * Mock fact-checks for when API key is not available
 */
function getMockFactChecks(query) {
  const mockData = [
    {
      claimText: `Sample claim about "${query}" (mock data - add FACTCHECK_API_KEY for real results)`,
      claimant: 'Unknown',
      publisher: 'Example Fact Checker',
      publisherSite: 'example.com',
      url: 'https://example.com/factcheck',
      title: 'Fact Check: Mock Example',
      rating: 'Needs Context',
      reviewDate: new Date().toISOString().split('T')[0],
      language: 'en',
      raw: {}
    },
    {
      claimText: `Another mock claim related to "${query}"`,
      claimant: 'Social Media Post',
      publisher: 'Sample Verifier',
      publisherSite: 'verifier.org',
      url: 'https://verifier.org/check',
      title: 'Verification: Mock Example',
      rating: 'False',
      reviewDate: new Date().toISOString().split('T')[0],
      language: 'en',
      raw: {}
    }
  ];

  return mockData;
}
