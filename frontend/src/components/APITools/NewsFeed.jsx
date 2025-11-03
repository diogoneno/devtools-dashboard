import { useState } from 'react';
import axios from 'axios';
import '../ToolLayout.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const NewsFeed = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchNews = async () => {
    setLoading(true);
    setError('');
    setArticles([]);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/news`);
      setArticles(response.data.articles);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch news. Make sure the Flask backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>News Feed</h1>
        <p>Latest tech and web development news</p>
      </div>

      <div className="tool-card">
        <div className="info-message">
          <strong>Note:</strong> This tool requires the Flask backend to be running. Articles are fetched from dev.to.
        </div>

        <button
          className="btn btn-primary"
          onClick={fetchNews}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Fetch Latest News'}
        </button>

        {error && <div className="error-message">{error}</div>}

        {articles.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            {articles.map((article, idx) => (
              <div
                key={idx}
                className="result-box"
                style={{ marginBottom: '15px', cursor: 'pointer' }}
                onClick={() => window.open(article.url, '_blank')}
              >
                <h3 style={{ marginTop: 0, color: '#3498db' }}>
                  {article.title}
                </h3>
                {article.description && (
                  <p style={{ color: '#7f8c8d', marginBottom: '10px' }}>
                    {article.description}
                  </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                  <div>
                    {article.tags && article.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {article.tags.slice(0, 3).map((tag, tagIdx) => (
                          <span
                            key={tagIdx}
                            style={{
                              background: '#ecf0f1',
                              padding: '3px 8px',
                              borderRadius: '3px',
                              fontSize: '12px'
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ color: '#95a5a6' }}>
                    {formatDate(article.published_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsFeed;
