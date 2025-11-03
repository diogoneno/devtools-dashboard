import { useState } from 'react';
import axios from 'axios';
import '../ToolLayout.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const SecurityHeadersChecker = () => {
  const [url, setUrl] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const securityHeaders = {
    'Strict-Transport-Security': {
      description: 'Forces HTTPS connections (HSTS)',
      importance: 'Critical',
      reference: 'OWASP, NIST'
    },
    'Content-Security-Policy': {
      description: 'Prevents XSS attacks',
      importance: 'Critical',
      reference: 'OWASP Top 10'
    },
    'X-Frame-Options': {
      description: 'Prevents clickjacking',
      importance: 'High',
      reference: 'OWASP'
    },
    'X-Content-Type-Options': {
      description: 'Prevents MIME sniffing',
      importance: 'Medium',
      reference: 'OWASP'
    },
    'Referrer-Policy': {
      description: 'Controls referrer information',
      importance: 'Medium',
      reference: 'Privacy Best Practice'
    },
    'Permissions-Policy': {
      description: 'Controls browser features',
      importance: 'Medium',
      reference: 'Modern Security'
    },
    'X-XSS-Protection': {
      description: 'Legacy XSS protection',
      importance: 'Low',
      reference: 'Deprecated but useful'
    }
  };

  const checkHeaders = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/security-headers?url=${encodeURIComponent(url)}`);
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to check security headers');
    } finally {
      setLoading(false);
    }
  };

  const getHeaderStatus = (header) => {
    if (!results) return null;
    return results.headers[header] ? 'present' : 'missing';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#2ecc71';
    if (score >= 60) return '#f39c12';
    return '#e74c3c';
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>🛡️ Security Headers Checker</h1>
        <p>Verify security headers compliance (OWASP, NIST, Microsoft SDL)</p>
      </div>

      <div className="tool-card">
        <div className="info-message">
          <strong>📊 Standards Checked:</strong> OWASP Top 10, NIST Cybersecurity Framework, Microsoft SDL
        </div>

        <div className="input-group">
          <label>Website URL</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            onKeyPress={(e) => e.key === 'Enter' && checkHeaders()}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={checkHeaders}
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Check Security Headers'}
        </button>

        {error && <div className="error-message">{error}</div>}

        {results && (
          <>
            <div className="result-box" style={{ background: '#f8f9fa', marginTop: '20px' }}>
              <h3>Overall Security Score</h3>
              <div style={{
                fontSize: '56px',
                fontWeight: 'bold',
                color: getScoreColor(results.score),
                textAlign: 'center',
                margin: '20px 0'
              }}>
                {results.score}/100
              </div>
              <div style={{ textAlign: 'center', fontSize: '18px', color: '#7f8c8d' }}>
                {results.score >= 80 ? '✅ Good Security' : results.score >= 60 ? '⚠️ Needs Improvement' : '❌ Poor Security'}
              </div>
            </div>

            <div className="result-box" style={{ marginTop: '20px' }}>
              <h3>Security Headers Analysis</h3>
              {Object.entries(securityHeaders).map(([header, info]) => {
                const status = getHeaderStatus(header);
                return (
                  <div key={header} style={{
                    padding: '15px',
                    background: status === 'present' ? '#d4edda' : '#f8d7da',
                    border: `1px solid ${status === 'present' ? '#c3e6cb' : '#f5c6cb'}`,
                    borderRadius: '5px',
                    marginBottom: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{header}</strong>
                        <span style={{
                          marginLeft: '10px',
                          padding: '3px 8px',
                          background: status === 'present' ? '#28a745' : '#dc3545',
                          color: 'white',
                          borderRadius: '3px',
                          fontSize: '12px'
                        }}>
                          {status === 'present' ? '✓ Present' : '✗ Missing'}
                        </span>
                      </div>
                      <span style={{
                        padding: '3px 8px',
                        background: info.importance === 'Critical' ? '#e74c3c' : info.importance === 'High' ? '#f39c12' : '#95a5a6',
                        color: 'white',
                        borderRadius: '3px',
                        fontSize: '12px'
                      }}>
                        {info.importance}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', marginTop: '8px', color: '#6c757d' }}>
                      {info.description}
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '5px', color: '#6c757d' }}>
                      <strong>Reference:</strong> {info.reference}
                    </div>
                    {status === 'present' && results.headers[header] && (
                      <div style={{ fontSize: '12px', marginTop: '8px', fontFamily: 'monospace', background: 'white', padding: '5px', borderRadius: '3px' }}>
                        {results.headers[header]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {results.recommendations && results.recommendations.length > 0 && (
              <div className="result-box" style={{ marginTop: '20px' }}>
                <h3>🎯 Recommendations</h3>
                {results.recommendations.map((rec, idx) => (
                  <div key={idx} style={{
                    padding: '10px',
                    background: '#fff3cd',
                    border: '1px solid #ffeeba',
                    borderRadius: '5px',
                    marginBottom: '10px'
                  }}>
                    {rec}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SecurityHeadersChecker;
