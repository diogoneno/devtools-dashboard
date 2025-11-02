import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['content:encoded', 'contentEncoded'],
      ['dc:creator', 'creator']
    ]
  }
});

/**
 * Fetch and parse RSS feed
 */
export async function fetchRSSFeed(feedUrl, limit = 50) {
  try {
    console.log('Fetching RSS feed:', feedUrl);

    const feed = await parser.parseURL(feedUrl);

    const items = feed.items.slice(0, limit).map(item => ({
      url: item.link,
      title: item.title,
      text: item.contentSnippet || item.content || item.contentEncoded || '',
      author: item.creator || item.author || feed.title,
      publishedAt: item.pubDate || item.isoDate,
      source: feed.title,
      categories: item.categories || [],
      raw: item
    }));

    return items;
  } catch (error) {
    console.error('RSS fetch error:', error);
    throw new Error(`Failed to fetch RSS feed: ${error.message}`);
  }
}

/**
 * Common news RSS feeds for testing
 */
export const COMMON_FEEDS = {
  techcrunch: 'https://techcrunch.com/feed/',
  hackernews: 'https://news.ycombinator.com/rss',
  bbc_world: 'http://feeds.bbci.co.uk/news/world/rss.xml',
  reuters_world: 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best',
  dev_to: 'https://dev.to/feed',
  medium_tech: 'https://medium.com/feed/tag/technology',
  nature_news: 'https://www.nature.com/nature.rss',
  sciencedaily: 'https://www.sciencedaily.com/rss/all.xml'
};
