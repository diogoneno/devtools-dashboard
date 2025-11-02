import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../ToolLayout.css';

const ROBUSTNESS_API = 'http://localhost:5013/api';

function ModelRobustnessLab() {
  const [text, setText] = useState('');
  const [method, setMethod] = useState('');
  const [methods, setMethods] = useState([]);
  const [count, setCount] = useState(3);
  const [perturbations, setPerturbations] = useState([]);
  const [testResult, setTestResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMethods();
    fetchHistory();
    fetchStats();
  }, []);

  const fetchMethods = async () => {
    try {
      const response = await axios.get(`${ROBUSTNESS_API}/methods`);
      setMethods(response.data.methods);
    } catch (err) {
      setError(`Failed to fetch methods: ${err.message}`);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${ROBUSTNESS_API}/history?limit=10`);
      setHistory(response.data.history);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${ROBUSTNESS_API}/stats`);
      setStats(response.data.stats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const generatePerturbations = async () => {
    if (!text.trim()) {
      setError('Please enter text to perturb');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await axios.post(`${ROBUSTNESS_API}/text/perturb`, {
        text,
        method: method || undefined,
        count: parseInt(count)
      });
      setPerturbations(response.data.perturbations);
      setTestResult(null);
    } catch (err) {
      setError(`Failed to generate perturbations: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testConsistency = async (perturbedText, perturbMethod) => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.post(`${ROBUSTNESS_API}/test/consistency`, {
        text,
        method: perturbMethod,
        model_name: 'test-model'
      });
      setTestResult(response.data.test);
      await fetchHistory();
      await fetchStats();
    } catch (err) {
      setError(`Failed to test consistency: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>🧪 Model Robustness Lab</h1>
        <p>Test model consistency with text perturbations and adversarial inputs</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="tool-card">
        <h3>Generate Perturbations</h3>
        <div className="input-group">
          <label>Original Text:</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to generate perturbations..."
            rows={4}
            style={{ width: '100%', padding: '0.5rem', fontFamily: 'monospace' }}
          />
        </div>
        <div className="grid-2">
          <div className="input-group">
            <label>Perturbation Method:</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
            >
              <option value="">All Methods</option>
              {methods.map((m, idx) => (
                <option key={idx} value={m.name}>
                  {m.name.replace('_', ' ')} - {m.description}
                </option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>Variants per Method:</label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              min="1"
              max="10"
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
        </div>
        <button onClick={generatePerturbations} disabled={loading} className="btn btn-primary">
          {loading ? 'Generating...' : '🔀 Generate Perturbations'}
        </button>
      </div>

      {perturbations.length > 0 && (
        <div className="tool-card">
          <h3>Generated Perturbations</h3>
          <div style={{ marginTop: '1rem' }}>
            {perturbations.map((p, idx) => (
              <div key={idx} style={{
                padding: '1rem',
                marginBottom: '1rem',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '0.25rem'
              }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Method:</strong> {p.method.replace('_', ' ')} (Variant {p.variant})
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Original:</strong>
                  <div style={{
                    marginTop: '0.25rem',
                    padding: '0.5rem',
                    backgroundColor: '#fff',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.25rem',
                    fontFamily: 'monospace',
                    fontSize: '0.9em'
                  }}>
                    {p.original}
                  </div>
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Perturbed:</strong>
                  <div style={{
                    marginTop: '0.25rem',
                    padding: '0.5rem',
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fbbf24',
                    borderRadius: '0.25rem',
                    fontFamily: 'monospace',
                    fontSize: '0.9em'
                  }}>
                    {p.perturbed}
                  </div>
                </div>
                <button
                  onClick={() => testConsistency(p.perturbed, p.method)}
                  className="btn btn-secondary"
                  style={{ marginTop: '0.5rem' }}
                >
                  🧪 Test Consistency
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {testResult && (
        <div className="tool-card" style={{
          backgroundColor: testResult.passed ? '#d1fae5' : '#fee2e2',
          border: `2px solid ${testResult.passed ? '#10b981' : '#f59e0b'}`
        }}>
          <h3>Consistency Test Result</h3>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <strong>Consistency Score:</strong>{' '}
              <span style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                {(testResult.consistencyScore * 100).toFixed(1)}%
              </span>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <strong>Test Status:</strong> {testResult.passed ? '✅ PASSED' : '⚠️ INCONSISTENT'}
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <strong>Method:</strong> {testResult.method.replace('_', ' ')}
            </div>
          </div>
        </div>
      )}

      <div className="grid-2" style={{ marginTop: '1.5rem' }}>
        {/* Stats */}
        {stats && (
          <div className="tool-card">
            <h3>📊 Test Statistics</h3>
            <div style={{ marginTop: '1rem' }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong>Total Tests:</strong> {stats.totalTests}
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong>Avg Consistency:</strong> {(parseFloat(stats.avgConsistency) * 100).toFixed(1)}%
              </div>
              {stats.byMethod && stats.byMethod.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <strong>By Method:</strong>
                  {stats.byMethod.map((m, idx) => (
                    <div key={idx} style={{ fontSize: '0.85em', marginTop: '0.5rem' }}>
                      {m.perturbation_method}: {(m.avg_score * 100).toFixed(1)}% ({m.count} tests)
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* History */}
        <div className="tool-card">
          <h3>📜 Recent Tests</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '1rem' }}>
            {history.map((item, idx) => (
              <div key={idx} style={{
                padding: '0.75rem',
                marginBottom: '0.5rem',
                backgroundColor: '#f9fafb',
                borderLeft: `4px solid ${item.consistency_score > 0.8 ? '#10b981' : '#f59e0b'}`,
                borderRadius: '0.25rem'
              }}>
                <div style={{ fontSize: '0.85em', fontFamily: 'monospace', marginBottom: '0.25rem' }}>
                  {item.original_input.substring(0, 50)}...
                </div>
                <div style={{ fontSize: '0.85em', display: 'flex', justifyContent: 'space-between' }}>
                  <span>
                    {item.perturbation_method}: {(item.consistency_score * 100).toFixed(1)}%
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
        <h3>🔬 Perturbation Methods</h3>
        <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
          <li><strong>Typo:</strong> Introduces random character substitutions</li>
          <li><strong>Case Swap:</strong> Randomly changes letter casing</li>
          <li><strong>Word Swap:</strong> Swaps adjacent words</li>
          <li><strong>Synonym:</strong> Replaces words with synonyms</li>
          <li><strong>Whitespace:</strong> Adds/removes whitespace</li>
          <li><strong>Punctuation:</strong> Adds/removes punctuation marks</li>
          <li><strong>Paraphrase:</strong> Simple rephrasing patterns</li>
        </ul>
      </div>
    </div>
  );
}

export default ModelRobustnessLab;
