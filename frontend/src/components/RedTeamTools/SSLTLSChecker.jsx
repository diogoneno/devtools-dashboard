import { useState } from 'react';
import axios from 'axios';
import '../ToolLayout.css';

const SSLTLSChecker = () => {
  const [domain, setDomain] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkSSL = async () => {
    if (!domain.trim()) {
      setError('Please enter a domain');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await axios.get(`http://192.168.0.8:5000/api/ssl-check?domain=${domain}`);
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to check SSL/TLS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>🔒 SSL/TLS Security Checker</h1>
        <p>Analyze SSL/TLS configuration (NIST, PCI DSS compliance)</p>
      </div>

      <div className="tool-card">
        <div className="info-message">
          <strong>📋 Checks:</strong> Certificate validity, TLS versions, cipher suites, HSTS
        </div>

        <div className="input-group">
          <label>Domain</label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            onKeyPress={(e) => e.key === 'Enter' && checkSSL()}
          />
        </div>

        <button className="btn btn-primary" onClick={checkSSL} disabled={loading}>
          {loading ? 'Checking...' : 'Check SSL/TLS'}
        </button>

        {error && <div className="error-message">{error}</div>}

        {results && (
          <>
            <div className={`${results.secure ? 'success-message' : 'error-message'}`} style={{ marginTop: '20px' }}>
              <h3>{results.secure ? '✅ Secure Configuration' : '⚠️ Issues Found'}</h3>
              <p>Grade: {results.grade}</p>
            </div>

            <div className="result-box" style={{ marginTop: '20px' }}>
              <h4>Certificate Information</h4>
              <div><strong>Valid From:</strong> {results.cert_valid_from}</div>
              <div><strong>Valid Until:</strong> {results.cert_valid_until}</div>
              <div><strong>Issuer:</strong> {results.cert_issuer}</div>
              <div><strong>TLS Version:</strong> {results.tls_version}</div>
            </div>

            {results.issues && results.issues.length > 0 && (
              <div className="result-box" style={{ marginTop: '20px' }}>
                <h4>🔍 Issues Detected</h4>
                {results.issues.map((issue, idx) => (
                  <div key={idx} style={{ padding: '10px', background: '#fff3cd', borderRadius: '5px', marginBottom: '10px' }}>
                    {issue}
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

export default SSLTLSChecker;
