import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../ToolLayout.css';

const PROMPT_MONITOR_API = 'http://localhost:5011/api';

function PromptSafetyMonitor() {
  const [input, setInput] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
    fetchPolicies();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${PROMPT_MONITOR_API}/history?limit=10`);
      setHistory(response.data.history);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const fetchPolicies = async () => {
    try {
      const response = await axios.get(`${PROMPT_MONITOR_API}/policies`);
      setPolicies(response.data.policies);
    } catch (err) {
      console.error('Failed to fetch policies:', err);
    }
  };

  const scorePrompt = async () => {
    if (!input.trim()) {
      setError('Please enter a prompt to score');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await axios.post(`${PROMPT_MONITOR_API}/score`, {
        input,
        context,
        model: 'gpt-4'
      });
      setResult(response.data.score);
      await fetchHistory();
    } catch (err) {
      setError(`Failed to score prompt: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#eab308';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>🛡️ Prompt Safety Monitor</h1>
        <p>Detect prompt injection, jailbreak attempts, and policy violations in LLM inputs</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="tool-card">
        <h3>Test Prompt</h3>
        <div className="input-group">
          <label>Prompt to Score:</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a prompt to check for injection/jailbreak attempts..."
            rows={4}
            style={{ width: '100%', padding: '0.5rem', fontFamily: 'monospace' }}
          />
        </div>
        <div className="input-group">
          <label>Context (optional):</label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Optional context or system prompt..."
            rows={2}
            style={{ width: '100%', padding: '0.5rem', fontFamily: 'monospace' }}
          />
        </div>
        <button onClick={scorePrompt} disabled={loading} className="btn btn-primary">
          {loading ? 'Scoring...' : '🔍 Score Prompt'}
        </button>
      </div>

      {result && (
        <div className="tool-card" style={{
          backgroundColor: result.flagged ? '#fee2e2' : '#d1fae5',
          border: `2px solid ${getRiskColor(result.riskLevel)}`
        }}>
          <h3>Risk Assessment</h3>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Risk Level:</strong>{' '}
              <span style={{
                color: getRiskColor(result.riskLevel),
                fontWeight: 'bold',
                fontSize: '1.5em'
              }}>
                {result.riskLevel.toUpperCase()}
              </span>
              {result.flagged && ' 🚨 FLAGGED'}
            </div>
            <div className="grid-2">
              <div>
                <strong>Injection Score:</strong> {(result.injection * 100).toFixed(1)}%
              </div>
              <div>
                <strong>Jailbreak Score:</strong> {(result.jailbreak * 100).toFixed(1)}%
              </div>
            </div>
            {result.violations && result.violations.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <strong>Policy Violations:</strong>
                <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                  {result.violations.map((v, idx) => (
                    <li key={idx}>
                      <strong>{v.policy}</strong> (Severity: {v.severity})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid-2" style={{ marginTop: '1.5rem' }}>
        {/* Active Policies */}
        <div className="tool-card">
          <h3>🔒 Active Policies</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '1rem' }}>
            {policies.filter(p => p.enabled).map((policy, idx) => (
              <div key={idx} style={{
                padding: '0.75rem',
                marginBottom: '0.5rem',
                backgroundColor: '#f9fafb',
                borderLeft: `4px solid ${policy.severity === 'high' ? '#ef4444' : '#f59e0b'}`,
                borderRadius: '0.25rem'
              }}>
                <div style={{ fontWeight: 'bold' }}>{policy.name}</div>
                <div style={{ fontSize: '0.85em', color: '#6b7280', marginTop: '0.25rem' }}>
                  {policy.description}
                </div>
                <div style={{ fontSize: '0.85em', marginTop: '0.25rem' }}>
                  Type: {policy.rule_type} | Severity: <span style={{ color: policy.severity === 'high' ? '#ef4444' : '#f59e0b' }}>{policy.severity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent History */}
        <div className="tool-card">
          <h3>📊 Recent Scores</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '1rem' }}>
            {history.slice(0, 10).map((item, idx) => (
              <div key={idx} style={{
                padding: '0.75rem',
                marginBottom: '0.5rem',
                backgroundColor: item.flagged ? '#fee2e2' : '#f9fafb',
                borderLeft: `4px solid ${getRiskColor(item.risk_level)}`,
                borderRadius: '0.25rem'
              }}>
                <div style={{ fontSize: '0.85em', fontFamily: 'monospace', marginBottom: '0.5rem' }}>
                  {item.input_text.substring(0, 80)}...
                </div>
                <div style={{ fontSize: '0.85em', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: getRiskColor(item.risk_level), fontWeight: 'bold' }}>
                    {item.risk_level.toUpperCase()}
                  </span>
                  <span style={{ color: '#6b7280' }}>
                    {new Date(item.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="tool-card" style={{ marginTop: '1.5rem', backgroundColor: '#eff6ff', border: '1px solid #93c5fd' }}>
        <p style={{ margin: 0, fontSize: '0.9em' }}>
          <strong>💡 How it works:</strong> This tool uses pattern matching and keyword detection to identify common prompt injection
          and jailbreak techniques including SQL injection patterns, system prompt leaks, DAN-style jailbreaks, and requests for
          harmful content. Scores are calculated based on severity and number of policy violations detected.
        </p>
      </div>
    </div>
  );
}

export default PromptSafetyMonitor;
