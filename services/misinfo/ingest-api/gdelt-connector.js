import Papa from 'papaparse';

/**
 * Fetch GDELT v2 events using DOC API
 * GDELT provides multiple APIs - we'll use the simpler DOC API for news articles
 * Documentation: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
 */
export async function fetchGDELTEvents({ keyword, startDate, endDate, limit = 250 }) {
  try {
    // GDELT DOC API endpoint
    const baseUrl = 'https://api.gdeltproject.org/api/v2/doc/doc';

    // Build query parameters
    const params = new URLSearchParams({
      query: keyword,
      mode: 'artlist',
      maxrecords: Math.min(limit, 250), // GDELT max is 250
      format: 'json',
      sort: 'datedesc'
    });

    // Add date range if provided (format: YYYYMMDDHHMMSS)
    if (startDate) {
      params.append('startdatetime', formatGDELTDate(startDate));
    }
    if (endDate) {
      params.append('enddatetime', formatGDELTDate(endDate));
    }

    const url = `${baseUrl}?${params}`;
    console.log('Fetching GDELT:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`GDELT API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // GDELT returns articles array
    const articles = data.articles || [];

    return articles.map(article => ({
      url: article.url,
      title: article.title,
      text: article.socialimage || '', // GDELT doesn't always include full text
      publishedAt: article.seendate,
      source: article.domain,
      lang: article.language,
      raw: article
    }));
  } catch (error) {
    console.error('GDELT fetch error:', error);
    throw new Error(`Failed to fetch GDELT data: ${error.message}`);
  }
}

/**
 * Format date for GDELT API (YYYYMMDDHHMMSS)
 */
function formatGDELTDate(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Get recent trending topics from GDELT
 */
export async function getGDELTTrending() {
  const baseUrl = 'https://api.gdeltproject.org/api/v2/doc/doc';
  const params = new URLSearchParams({
    mode: 'timelinevol',
    format: 'json',
    maxrecords: '20'
  });

  const response = await fetch(`${baseUrl}?${params}`);
  const data = await response.json();

  return data;
}
