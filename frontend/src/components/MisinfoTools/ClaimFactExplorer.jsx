import { useState } from 'react';
import axios from 'axios';
import '../ToolLayout.css';

const FACTS_API = import.meta.env.VITE_MISINFO_FACTS_API ? `${import.meta.env.VITE_MISINFO_FACTS_API}/facts` : 'http://localhost:5002/api/facts';
const NLP_API = import.meta.env.VITE_MISINFO_NLP_API ? `${import.meta.env.VITE_MISINFO_NLP_API}/nlp` : 'http://localhost:5003/api/nlp';

function ClaimFactExplorer() {
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [claims, setClaims] = useState([]);
  const [factChecks, setFactChecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ifcnSignatories, setIfcnSignatories] = useState([]);

  const handleExtractClaims = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${NLP_API}/extract-claims`, { text });
      setClaims(response.data.claims || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchFactChecks = async (searchQuery) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${FACTS_API}/search`, { query: q });
      setFactChecks(response.data.factChecks || []);
      setQuery(q);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadIFCNSignatories = async () => {
    try {
      const response = await axios.get(`${FACTS_API}/ifcn-signatories`);
      setIfcnSignatories(response.data.signatories || []);
    } catch (err) {
      console.error('Failed to load IFCN signatories:', err);
    }
  };

  const isIFCNSignatory = (publisherSite) => {
    return ifcnSignatories.some(s => publisherSite?.includes(s));
  };

  const getRatingColor = (rating) => {
    if (!rating) return '#666';
    const r = rating.toLowerCase();
    if (r.includes('true') || r.includes('correct')) return '#27ae60';
    if (r.includes('false') || r.includes('fake')) return '#e74c3c';
    if (r.includes('mixture') || r.includes('misleading')) return '#f39c12';
    return '#3498db';
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>Claim & Fact-Check Explorer</h1>
        <p>Extract claims from text and search for fact-checks from multiple sources</p>
      </div>

      <div className="grid-2">
        <div className="tool-card">
          <h3>Extract Claims from Text</h3>
          <div className="input-group">
            <label>Paste Text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows="8"
              placeholder="Paste an article, social media post, or any text to extract claims..."
            />
          </div>
          <button className="btn btn-primary" onClick={handleExtractClaims} disabled={loading || !text.trim()}>
            {loading ? 'Extracting...' : 'Extract Claims'}
          </button>

          {claims.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4>Extracted Claims ({claims.length})</h4>
              {claims.map((claim, idx) => (
                <div key={idx} className="result-box" style={{ marginBottom: '10px' }}>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>{claim.text}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Confidence: {(claim.confidence * 100).toFixed(0)}% | Method: {claim.method}
                    <button
                      className="btn btn-sm"
                      onClick={() => handleSearchFactChecks(claim.text)}
                      style={{ marginLeft: '10px', padding: '2px 8px' }}
                    >
                      Search Fact-Checks
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="tool-card">
          <h3>Search Fact-Checks</h3>
          <div className="input-group">
            <label>Search Query</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter a claim to fact-check..."
              onKeyPress={(e) => e.key === 'Enter' && handleSearchFactChecks()}
            />
          </div>
          <button className="btn btn-primary" onClick={() => handleSearchFactChecks()} disabled={loading || !query.trim()}>
            {loading ? 'Searching...' : 'Search Fact-Checks'}
          </button>

          <button
            className="btn"
            onClick={loadIFCNSignatories}
            style={{ marginLeft: '10px' }}
          >
            Load IFCN Signatories
          </button>

          {error && (
            <div className="error-message" style={{ marginTop: '15px' }}>
              {error}
              <br />
              <small>Make sure facts-api (port 5002) and nlp-api (port 5003) are running</small>
            </div>
          )}

          {ifcnSignatories.length > 0 && (
            <div className="success-message" style={{ marginTop: '10px', fontSize: '12px' }}>
              Loaded {ifcnSignatories.length} IFCN signatories for credibility marking
            </div>
          )}
        </div>
      </div>

      {factChecks.length > 0 && (
        <div className="tool-card">
          <h3>Fact-Check Results ({factChecks.length})</h3>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {factChecks.map((fc, idx) => (
              <div key={idx} className="result-box" style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Claim:</strong> {fc.claimText}
                    </div>
                    {fc.claimant && (
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                        Claimant: {fc.claimant}
                      </div>
                    )}
                    <div style={{ marginTop: '10px' }}>
                      <span
                        style={{
                          backgroundColor: getRatingColor(fc.rating),
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}
                      >
                        {fc.rating}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: '20px' }}>
                    <div style={{ marginBottom: '5px' }}>
                      <strong>{fc.publisher}</strong>
                      {isIFCNSignatory(fc.publisherSite) && (
                        <span
                          style={{
                            marginLeft: '8px',
                            backgroundColor: '#27ae60',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '11px'
                          }}
                        >
                          IFCN
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                      {fc.publisherSite}
                    </div>
                    {fc.url && (
                      <a href={fc.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm">
                        View Fact-Check
                      </a>
                    )}
                  </div>
                </div>
                {fc.reviewDate && (
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>
                    Reviewed: {new Date(fc.reviewDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="tool-card">
        <h3>About</h3>
        <ul style={{ lineHeight: '1.8' }}>
          <li>
            <strong>Claim Extraction:</strong> Uses pattern-based NLP to identify factual claims in text
          </li>
          <li>
            <strong>Fact-Check Search:</strong> Queries Google Fact Check Tools API (mock data if no API key)
          </li>
          <li>
            <strong>IFCN Badge:</strong> Highlights fact-checkers certified by the International Fact-Checking Network
          </li>
          <li>
            <strong>Ratings:</strong> Color-coded by verdict (green=true, red=false, orange=mixed, blue=other)
          </li>
        </ul>
      </div>
    </div>
  );
}

export default ClaimFactExplorer;
