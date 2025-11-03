import { useState } from 'react';
import axios from 'axios';
import '../ToolLayout.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const HTTPHeadersAnalyzer = () => {
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState(null);
  const [securityScore, setSecurityScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyzeHeaders = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError('');
    setHeaders(null);
    setSecurityScore(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/analyze-headers?url=${encodeURIComponent(url)}`);
      setHeaders(response.data.headers);
      setSecurityScore(response.data.security_analysis);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze headers');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#2ecc71';
    if (score >= 60) return '#f39c12';
    return '#e74c3c';
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>🔒 HTTP Headers Analyzer</h1>
        <p>Analyze security headers and identify vulnerabilities (OWASP, NIST)</p>
      </div>

      <div className="tool-card">
        <div className="info-message">
          <strong>⚠️ Ethical Testing:</strong> Only analyze websites you own or have permission to test.
        </div>

        <div className="input-group">
          <label>URL to Analyze</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            onKeyPress={(e) => e.key === 'Enter' && analyzeHeaders()}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={analyzeHeaders}
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Analyze Headers'}
        </button>

        {error && <div className="error-message">{error}</div>}

        {securityScore && (
          <div className="result-box" style={{ background: '#f8f9fa', marginTop: '20px' }}>
            <h3>Security Score</h3>
            <div style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: getScoreColor(securityScore.score),
              textAlign: 'center',
              margin: '20px 0'
            }}>
              {securityScore.score}/100
            </div>
            <div style={{ marginTop: '15px' }}>
              <strong>Status: </strong>
              <span style={{ color: getScoreColor(securityScore.score) }}>
                {securityScore.rating}
              </span>
            </div>
          </div>
        )}

        {securityScore && securityScore.issues.length > 0 && (
          <div className="result-box" style={{ marginTop: '20px' }}>
            <h3>⚠️ Security Issues Found</h3>
            {securityScore.issues.map((issue, idx) => (
              <div key={idx} style={{
                background: '#fff3cd',
                border: '1px solid #ffeeba',
                padding: '10px',
                borderRadius: '5px',
                marginBottom: '10px'
              }}>
                <strong>{issue.header}</strong>: {issue.issue}
                <div style={{ fontSize: '12px', marginTop: '5px', color: '#856404' }}>
                  Recommendation: {issue.recommendation}
                </div>
              </div>
            ))}
          </div>
        )}

        {headers && (
          <div className="result-box" style={{ marginTop: '20px' }}>
            <h3>HTTP Response Headers</h3>
            <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
              {Object.entries(headers).map(([key, value]) => (
                <div key={key} style={{
                  padding: '5px',
                  borderBottom: '1px solid #eee'
                }}>
                  <strong>{key}:</strong> {value}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HTTPHeadersAnalyzer;
