import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../ToolLayout.css';

const REDTEAM_API = 'http://localhost:5012/api';

function LLMRedTeamHarness() {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState('');
  const [target, setTarget] = useState('');
  const [variables, setVariables] = useState({});
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dryRun, setDryRun] = useState(true);

  useEffect(() => {
    fetchRecipes();
    fetchHistory();
    fetchStats();
  }, []);

  const fetchRecipes = async () => {
    try {
      const response = await axios.get(`${REDTEAM_API}/recipes`);
      setRecipes(response.data.recipes);
    } catch (err) {
      setError(`Failed to fetch recipes: ${err.message}`);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${REDTEAM_API}/history?limit=10`);
      setHistory(response.data.history);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${REDTEAM_API}/stats`);
      setStats(response.data.stats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const runAttack = async () => {
    if (!selectedRecipe) {
      setError('Please select an attack recipe');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await axios.post(`${REDTEAM_API}/attack`, {
        recipe: selectedRecipe,
        target: target || null,
        variables,
        dry_run: dryRun
      });
      setResult(response.data.attack);
      if (!dryRun) {
        await fetchHistory();
        await fetchStats();
      }
    } catch (err) {
      setError(`Failed to run attack: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#eab308';
      default: return '#6b7280';
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>⚔️ LLM Red Team Harness</h1>
        <p>Safe adversarial testing against LLM endpoints - Test defenses without harming production</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="tool-card" style={{ backgroundColor: '#fef3c7', border: '1px solid #fbbf24' }}>
        <p style={{ margin: 0, fontSize: '0.9em' }}>
          <strong>⚠️ Important:</strong> Only test YOUR OWN endpoints with proper authorization. This tool is for defensive security
          research, penetration testing with permission, and CTF challenges. Never use against third-party services without explicit consent.
        </p>
      </div>

      <div className="tool-card">
        <h3>Configure Attack</h3>
        <div className="input-group">
          <label>Attack Recipe:</label>
          <select
            value={selectedRecipe}
            onChange={(e) => setSelectedRecipe(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          >
            <option value="">Select an attack recipe...</option>
            {recipes.map((recipe, idx) => (
              <option key={idx} value={recipe.name}>
                [{recipe.category}] {recipe.name} - {recipe.description}
              </option>
            ))}
          </select>
        </div>

        {selectedRecipe && (
          <>
            <div className="input-group">
              <label>Target Endpoint (optional):</label>
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="http://localhost:8000/api/chat (leave empty for dry run)"
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>

            <div className="input-group">
              <label>
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  style={{ marginRight: '0.5rem' }}
                />
                Dry Run (preview payload without executing)
              </label>
            </div>

            <button onClick={runAttack} disabled={loading} className="btn btn-primary">
              {loading ? 'Running...' : dryRun ? '👁️ Preview Attack' : '⚔️ Execute Attack'}
            </button>
          </>
        )}
      </div>

      {result && (
        <div className="tool-card">
          <h3>Attack Result</h3>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Recipe:</strong> {result.recipe} ({result.category})
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Severity:</strong>{' '}
              <span style={{ color: getSeverityColor(result.severity), fontWeight: 'bold' }}>
                {result.severity.toUpperCase()}
              </span>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Payload:</strong>
              <div style={{
                marginTop: '0.5rem',
                padding: '1rem',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '0.25rem',
                fontFamily: 'monospace',
                fontSize: '0.9em',
                whiteSpace: 'pre-wrap'
              }}>
                {result.payload}
              </div>
            </div>
            {!dryRun && result.response && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Success:</strong> {result.success ? '✅ Yes' : '❌ No'}
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Response:</strong>
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '1rem',
                    backgroundColor: result.success ? '#fee2e2' : '#d1fae5',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.25rem',
                    fontFamily: 'monospace',
                    fontSize: '0.9em',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {JSON.stringify(result.response, null, 2)}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="grid-2" style={{ marginTop: '1.5rem' }}>
        {/* Stats */}
        {stats && (
          <div className="tool-card">
            <h3>📊 Attack Statistics</h3>
            <div style={{ marginTop: '1rem' }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong>Total Attacks:</strong> {stats.totalAttacks}
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong>Successful:</strong> {stats.successfulAttacks}
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong>Success Rate:</strong> {stats.successRate}%
              </div>
            </div>
          </div>
        )}

        {/* History */}
        <div className="tool-card">
          <h3>📜 Recent Attacks</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '1rem' }}>
            {history.map((item, idx) => (
              <div key={idx} style={{
                padding: '0.75rem',
                marginBottom: '0.5rem',
                backgroundColor: item.success ? '#fee2e2' : '#f9fafb',
                borderLeft: `4px solid ${getSeverityColor(item.severity)}`,
                borderRadius: '0.25rem'
              }}>
                <div style={{ fontWeight: 'bold' }}>{item.attack_name}</div>
                <div style={{ fontSize: '0.85em', color: '#6b7280', marginTop: '0.25rem' }}>
                  {item.success ? '✅ Succeeded' : '❌ Failed'} | {new Date(item.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="tool-card" style={{ marginTop: '1.5rem', backgroundColor: '#eff6ff', border: '1px solid #93c5fd' }}>
        <h3>🎯 Attack Categories</h3>
        <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
          <li><strong>Injection:</strong> Attempts to override instructions with malicious commands</li>
          <li><strong>Jailbreak:</strong> Tries to bypass safety guardrails via roleplay or persona switching</li>
          <li><strong>Overflow:</strong> Tests behavior with extremely long inputs</li>
          <li><strong>Evasion:</strong> Uses encoding, unicode, or multilingual tricks to bypass filters</li>
        </ul>
      </div>
    </div>
  );
}

export default LLMRedTeamHarness;
