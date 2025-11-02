import { useState } from 'react';
import '../ToolLayout.css';

const URLShortener = () => {
  const [longUrl, setLongUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const shortenUrl = async () => {
    if (!longUrl) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Using TinyURL API (free, no key required)
      const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
      const data = await response.text();

      if (data.startsWith('Error')) {
        setError('Invalid URL');
        setShortUrl('');
      } else {
        setShortUrl(data);
        setError('');
      }
    } catch (err) {
      setError('Failed to shorten URL. Please try again.');
      setShortUrl('');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>URL Shortener</h1>
        <p>Shorten long URLs with TinyURL</p>
      </div>

      <div className="tool-card">
        <div className="input-group">
          <label>Long URL</label>
          <input
            type="text"
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
            placeholder="https://example.com/very/long/url"
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={shortenUrl}
          disabled={loading}
        >
          {loading ? 'Shortening...' : 'Shorten URL'}
        </button>

        {error && <div className="error-message">{error}</div>}

        {shortUrl && (
          <div className="result-box">
            <div style={{ marginBottom: '10px' }}>
              <strong>Shortened URL:</strong>
            </div>
            <div style={{ fontSize: '18px', marginBottom: '10px', wordBreak: 'break-all' }}>
              <a href={shortUrl} target="_blank" rel="noopener noreferrer">{shortUrl}</a>
            </div>
            <button className="btn btn-success" onClick={copyToClipboard}>
              Copy to Clipboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default URLShortener;
