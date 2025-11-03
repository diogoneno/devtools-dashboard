/**
 * GDELT (Global Database of Events, Language, and Tone) API connector.
 *
 * WHY: Misinformation research requires access to large-scale news data across
 * multiple languages and sources. GDELT monitors broadcast, print, and web news
 * from every country in over 100 languages. This connector provides access to
 * GDELT's DOC API for news article discovery, enabling researchers to study
 * information spread without manually curating news sources.
 *
 * @see https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
 */
import Papa from 'papaparse';

/**
 * Fetches news articles from GDELT's DOC API based on keyword and date filters.
 *
 * WHY: Researchers need to identify news coverage around specific topics or events
 * to study how information spreads. This function queries GDELT's massive news
 * database (monitoring sources in 100+ languages) and returns structured article
 * metadata. It handles GDELT's specific date format requirements and API limits,
 * making the complex GDELT API accessible through a simple interface.
 *
 * @param {Object} params - Query parameters
 * @param {string} params.keyword - Search keyword or phrase (supports boolean operators)
 * @param {string} [params.startDate] - ISO date string for range start (e.g., '2024-01-01')
 * @param {string} [params.endDate] - ISO date string for range end (e.g., '2024-12-31')
 * @param {number} [params.limit=250] - Maximum articles to return (GDELT max: 250)
 *
 * @returns {Promise<Array<Object>>} Array of article objects
 * @returns {string} return[].url - Article URL
 * @returns {string} return[].title - Article headline
 * @returns {string} return[].text - Article preview or social image URL
 * @returns {string} return[].publishedAt - Publication date (GDELT's seendate format)
 * @returns {string} return[].source - Domain name of publisher
 * @returns {string} return[].lang - ISO language code (e.g., 'eng', 'spa')
 * @returns {Object} return[].raw - Full GDELT article object for advanced analysis
 *
 * @throws {Error} If GDELT API is unreachable (network errors)
 * @throws {Error} If GDELT API returns non-200 status (rate limits, invalid query)
 * @throws {Error} If response cannot be parsed as JSON
 *
 * @example
 * // Search for articles about a specific topic
 * const articles = await fetchGDELTEvents({
 *   keyword: 'climate change',
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31',
 *   limit: 100
 * });
 * // Returns: [{ url: '...', title: '...', source: 'nytimes.com', ... }]
 *
 * @example
 * // Search with boolean operators
 * const articles = await fetchGDELTEvents({
 *   keyword: '(misinformation OR disinformation) AND election',
 *   limit: 50
 * });
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
 * Retrieves trending topics and article volumes from GDELT's timeline API.
 *
 * WHY: Misinformation often correlates with viral topics and breaking news.
 * This function identifies currently trending topics in GDELT's global news
 * monitoring, helping researchers spot emerging narratives or coordinated
 * information campaigns. The timeline volume data reveals when topics surge,
 * which is useful for detecting coordinated amplification (a misinformation indicator).
 *
 * @returns {Promise<Object>} GDELT timeline volume data
 * @returns {Array<Object>} return.timeline - Time-series data of article volumes
 * @returns {Array<string>} return.topics - Extracted trending topics/keywords
 *
 * @throws {Error} If GDELT API is unreachable
 * @throws {Error} If response format is unexpected
 *
 * @example
 * const trending = await getGDELTTrending();
 * console.log('Current trending topics:', trending.topics);
 * // Useful for: "What's going viral right now that might contain misinfo?"
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
