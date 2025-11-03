import { useState } from 'react';
import axios from 'axios';
import '../ToolLayout.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const WhoisLookup = () => {
  const [domain, setDomain] = useState('');
  const [whoisData, setWhoisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lookupWhois = async () => {
    if (!domain.trim()) {
      setError('Please enter a domain name');
      return;
    }

    setLoading(true);
    setError('');
    setWhoisData(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/whois?domain=${domain}`);
      setWhoisData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to perform WHOIS lookup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>📋 WHOIS Lookup</h1>
        <p>Get domain registration and ownership information</p>
      </div>

      <div className="tool-card">
        <div className="info-message">
          <strong>ℹ️ OSINT Tool:</strong> WHOIS data is publicly available information used for legitimate reconnaissance.
        </div>

        <div className="input-group">
          <label>Domain Name</label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            onKeyPress={(e) => e.key === 'Enter' && lookupWhois()}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={lookupWhois}
          disabled={loading}
        >
          {loading ? 'Looking up...' : 'Lookup WHOIS'}
        </button>

        {error && <div className="error-message">{error}</div>}

        {whoisData && (
          <div className="result-box">
            <h3>WHOIS Information for {whoisData.domain}</h3>

            {whoisData.registrar && (
              <div style={{ marginTop: '15px' }}>
                <strong>Registrar:</strong> {whoisData.registrar}
              </div>
            )}

            {whoisData.creation_date && (
              <div style={{ marginTop: '10px' }}>
                <strong>Created:</strong> {whoisData.creation_date}
              </div>
            )}

            {whoisData.expiration_date && (
              <div style={{ marginTop: '10px' }}>
                <strong>Expires:</strong> {whoisData.expiration_date}
              </div>
            )}

            {whoisData.updated_date && (
              <div style={{ marginTop: '10px' }}>
                <strong>Updated:</strong> {whoisData.updated_date}
              </div>
            )}

            {whoisData.name_servers && whoisData.name_servers.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <strong>Name Servers:</strong>
                <ul>
                  {whoisData.name_servers.map((ns, idx) => (
                    <li key={idx}><code>{ns}</code></li>
                  ))}
                </ul>
              </div>
            )}

            {whoisData.status && whoisData.status.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <strong>Status:</strong>
                <ul>
                  {whoisData.status.map((status, idx) => (
                    <li key={idx}>{status}</li>
                  ))}
                </ul>
              </div>
            )}

            {whoisData.raw_data && (
              <div style={{ marginTop: '20px' }}>
                <strong>Raw WHOIS Data:</strong>
                <pre style={{
                  background: '#2c3e50',
                  color: '#ecf0f1',
                  padding: '15px',
                  borderRadius: '5px',
                  fontSize: '12px',
                  overflow: 'auto',
                  maxHeight: '300px'
                }}>
                  {whoisData.raw_data}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WhoisLookup;
