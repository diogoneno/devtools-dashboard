import { useState } from 'react';
import axios from 'axios';
import '../ToolLayout.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const GitHubStats = () => {
  const [username, setUsername] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    if (!username.trim()) {
      setError('Please enter a GitHub username');
      return;
    }

    setLoading(true);
    setError('');
    setStats(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/github/${username}`);
      setStats(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch GitHub stats. Make sure the Flask backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>GitHub Stats</h1>
        <p>Show repository and user statistics</p>
      </div>

      <div className="tool-card">
        <div className="info-message">
          <strong>Note:</strong> This tool requires the Flask backend to be running.
        </div>

        <div className="input-group">
          <label>GitHub Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="octocat"
            onKeyPress={(e) => e.key === 'Enter' && fetchStats()}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={fetchStats}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Get Stats'}
        </button>

        {error && <div className="error-message">{error}</div>}

        {stats && (
          <div className="result-box">
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
              <img
                src={stats.avatar_url}
                alt={stats.username}
                style={{ width: '100px', height: '100px', borderRadius: '50%' }}
              />
              <div>
                <h2 style={{ margin: 0 }}>{stats.name || stats.username}</h2>
                <p style={{ color: '#7f8c8d', margin: '5px 0' }}>@{stats.username}</p>
                <a
                  href={stats.profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#3498db' }}
                >
                  View Profile
                </a>
              </div>
            </div>

            {stats.bio && (
              <p style={{ marginBottom: '20px' }}>{stats.bio}</p>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '15px',
              textAlign: 'center'
            }}>
              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3498db' }}>
                  {stats.public_repos}
                </div>
                <div>Repositories</div>
              </div>
              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2ecc71' }}>
                  {stats.followers}
                </div>
                <div>Followers</div>
              </div>
              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#e74c3c' }}>
                  {stats.following}
                </div>
                <div>Following</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GitHubStats;
