import { useState, useEffect } from 'react';
import axios from 'axios';
import '../ToolLayout.css';

const INGEST_API = 'http://localhost:5001/api';

const COMMON_FEEDS = {
  'TechCrunch': 'https://techcrunch.com/feed/',
  'Hacker News': 'https://news.ycombinator.com/rss',
  'BBC World': 'http://feeds.bbci.co.uk/news/world/rss.xml',
  'Dev.to': 'https://dev.to/feed',
  'Nature News': 'https://www.nature.com/nature.rss',
  'Science Daily': 'https://www.sciencedaily.com/rss/all.xml'
};

function OpenNewsIngest() {
  const [source, setSource] = useState('gdelt');
  const [keyword, setKeyword] = useState('climate change');
  const [feedUrl, setFeedUrl] = useState('');
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get(`${INGEST_API}/items`, {
        params: { limit: 100 }
      });
      setItems(response.data.items || []);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    }
  };

  const handleIngestGDELT = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post(`${INGEST_API}/ingest/gdelt`, {
        keyword,
        limit
      });

      setResult(response.data);
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleIngestRSS = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post(`${INGEST_API}/ingest/rss`, {
        feedUrl,
        limit
      });

      setResult(response.data);
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearItems = async () => {
    if (!window.confirm('Delete all ingested items?')) return;

    try {
      await axios.delete(`${INGEST_API}/items`);
      setItems([]);
      setResult({ message: 'All items deleted' });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Source', 'Title', 'URL', 'Published At'];
    const rows = items.map(item => [
      item.id,
      item.source,
      item.title || '',
      item.url || '',
      item.published_at || ''
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `misinfo-items-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>Open News Ingest</h1>
        <p>Ingest public news data from GDELT, RSS feeds, and other open sources</p>
      </div>

      <div className="tool-card">
        <h3>Data Source</h3>
        <div className="input-group">
          <label>
            <input
              type="radio"
              value="gdelt"
              checked={source === 'gdelt'}
              onChange={(e) => setSource(e.target.value)}
            />
            GDELT v2 (Global News Database)
          </label>
          <label>
            <input
              type="radio"
              value="rss"
              checked={source === 'rss'}
              onChange={(e) => setSource(e.target.value)}
            />
            RSS/Atom Feed
          </label>
        </div>

        {source === 'gdelt' && (
          <div className="input-group">
            <label>Search Keyword</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter keyword to search..."
            />
            <small>Examples: "climate change", "artificial intelligence", "election"</small>
          </div>
        )}

        {source === 'rss' && (
          <div className="input-group">
            <label>RSS Feed URL</label>
            <input
              type="text"
              value={feedUrl}
              onChange={(e) => setFeedUrl(e.target.value)}
              placeholder="https://example.com/feed.xml"
            />
            <div style={{ marginTop: '10px' }}>
              <small>Quick select: </small>
              {Object.entries(COMMON_FEEDS).map(([name, url]) => (
                <button
                  key={name}
                  className="btn btn-sm"
                  onClick={() => setFeedUrl(url)}
                  style={{ margin: '2px', padding: '4px 8px', fontSize: '12px' }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="input-group">
          <label>Limit</label>
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            min="1"
            max="250"
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={source === 'gdelt' ? handleIngestGDELT : handleIngestRSS}
          disabled={loading || (source === 'gdelt' && !keyword) || (source === 'rss' && !feedUrl)}
        >
          {loading ? 'Ingesting...' : 'Ingest Data'}
        </button>

        {result && (
          <div className="success-message" style={{ marginTop: '15px' }}>
            {result.message}
            <br />
            Fetched: {result.fetched}, Inserted: {result.inserted}
          </div>
        )}

        {error && (
          <div className="error-message" style={{ marginTop: '15px' }}>
            <strong>Error:</strong> {error}
            <br />
            <small>Make sure the ingest-api service is running on port 5001</small>
          </div>
        )}
      </div>

      <div className="tool-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Ingested Items ({items.length})</h3>
          <div>
            <button className="btn" onClick={fetchItems} style={{ marginRight: '10px' }}>
              Refresh
            </button>
            <button className="btn" onClick={exportToCSV} disabled={items.length === 0} style={{ marginRight: '10px' }}>
              Export CSV
            </button>
            <button className="btn btn-danger" onClick={handleClearItems}>
              Clear All
            </button>
          </div>
        </div>

        <div style={{ maxHeight: '500px', overflowY: 'auto', marginTop: '15px' }}>
          {items.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666' }}>No items ingested yet</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>ID</th>
                  <th style={{ padding: '10px' }}>Source</th>
                  <th style={{ padding: '10px' }}>Title</th>
                  <th style={{ padding: '10px' }}>Published</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{item.id}</td>
                    <td style={{ padding: '10px' }}>{item.source}</td>
                    <td style={{ padding: '10px' }}>
                      {item.url ? (
                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                          {item.title || item.url}
                        </a>
                      ) : (
                        item.title
                      )}
                    </td>
                    <td style={{ padding: '10px', fontSize: '12px', color: '#666' }}>
                      {item.published_at ? new Date(item.published_at).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="tool-card">
        <h3>Data Ethics & Rate Limits</h3>
        <ul style={{ lineHeight: '1.8' }}>
          <li>GDELT: Public database, respects 250 results/query limit</li>
          <li>RSS: Respects feed publisher robots.txt and terms of service</li>
          <li>All data stored locally in SQLite (data/misinfo.db)</li>
          <li>No personal data collected, only public news content</li>
          <li>For research and educational purposes</li>
        </ul>
      </div>
    </div>
  );
}

export default OpenNewsIngest;
