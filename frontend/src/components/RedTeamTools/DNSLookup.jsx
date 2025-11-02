import { useState } from 'react';
import axios from 'axios';
import '../ToolLayout.css';

const DNSLookup = () => {
  const [domain, setDomain] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lookupDNS = async () => {
    if (!domain.trim()) {
      setError('Please enter a domain name');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await axios.get(`http://192.168.0.8:5000/api/dns-lookup?domain=${domain}`);
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to perform DNS lookup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>🔍 DNS Lookup</h1>
        <p>Perform DNS reconnaissance and enumerate DNS records</p>
      </div>

      <div className="tool-card">
        <div className="info-message">
          <strong>⚠️ Ethical Use Only:</strong> Only perform DNS lookups on domains you own or have explicit permission to test.
        </div>

        <div className="input-group">
          <label>Domain Name</label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            onKeyPress={(e) => e.key === 'Enter' && lookupDNS()}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={lookupDNS}
          disabled={loading}
        >
          {loading ? 'Looking up...' : 'Lookup DNS'}
        </button>

        {error && <div className="error-message">{error}</div>}

        {results && (
          <div className="result-box">
            <h3>DNS Records for {results.domain}</h3>

            {results.a_records && results.a_records.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <strong>A Records (IPv4):</strong>
                <ul>
                  {results.a_records.map((record, idx) => (
                    <li key={idx}><code>{record}</code></li>
                  ))}
                </ul>
              </div>
            )}

            {results.aaaa_records && results.aaaa_records.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <strong>AAAA Records (IPv6):</strong>
                <ul>
                  {results.aaaa_records.map((record, idx) => (
                    <li key={idx}><code>{record}</code></li>
                  ))}
                </ul>
              </div>
            )}

            {results.mx_records && results.mx_records.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <strong>MX Records (Mail):</strong>
                <ul>
                  {results.mx_records.map((record, idx) => (
                    <li key={idx}><code>{record}</code></li>
                  ))}
                </ul>
              </div>
            )}

            {results.ns_records && results.ns_records.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <strong>NS Records (Nameservers):</strong>
                <ul>
                  {results.ns_records.map((record, idx) => (
                    <li key={idx}><code>{record}</code></li>
                  ))}
                </ul>
              </div>
            )}

            {results.txt_records && results.txt_records.length > 0 && (
              <div style={{ marginTop: '15px' }}>
                <strong>TXT Records:</strong>
                <ul>
                  {results.txt_records.map((record, idx) => (
                    <li key={idx}><code>{record}</code></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DNSLookup;
