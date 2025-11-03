import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../ToolLayout.css';

const TOOLGATE_API = import.meta.env.VITE_TOOLGATE_API || 'http://localhost:5014/api';

function AgentToolAccessGate() {
  const [gates, setGates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedTool, setSelectedTool] = useState('');
  const [agentId, setAgentId] = useState('');
  const [context, setContext] = useState('');
  const [requestResult, setRequestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGates();
    fetchLogs();
    fetchStats();
  }, []);

  const fetchGates = async () => {
    try {
      const response = await axios.get(`${TOOLGATE_API}/gates`);
      setGates(response.data.gates);
    } catch (err) {
      setError(`Failed to fetch gates: ${err.message}`);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${TOOLGATE_API}/logs?limit=20`);
      setLogs(response.data.logs);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${TOOLGATE_API}/stats`);
      setStats(response.data.stats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const requestAccess = async () => {
    if (!selectedTool) {
      setError('Please select a tool');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await axios.post(`${TOOLGATE_API}/request`, {
        tool_name: selectedTool,
        agent_id: agentId || 'test-agent',
        context: context || null,
        auto_approve: false
      });
      setRequestResult(response.data);
      await fetchLogs();
      await fetchStats();
    } catch (err) {
      setError(`Failed to request access: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleGate = async (toolName, enabled) => {
    try {
      await axios.patch(`${TOOLGATE_API}/gates/${toolName}`, { enabled: !enabled });
      await fetchGates();
    } catch (err) {
      setError(`Failed to update gate: ${err.message}`);
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
        <h1>🚪 Agent Tool Access Gate</h1>
        <p>Control and audit AI agent access to sensitive tools and capabilities</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="tool-card">
        <h3>Request Tool Access</h3>
        <div className="input-group">
          <label>Tool:</label>
          <select
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          >
            <option value="">Select a tool...</option>
            {gates.map((gate, idx) => (
              <option key={idx} value={gate.tool_name}>
                {gate.tool_name} - {gate.description} [{gate.risk_level}]
              </option>
            ))}
          </select>
        </div>
        <div className="grid-2">
          <div className="input-group">
            <label>Agent ID:</label>
            <input
              type="text"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="agent-123"
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <div className="input-group">
            <label>Context:</label>
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="research, production, testing, etc."
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
        </div>
        <button onClick={requestAccess} disabled={loading} className="btn btn-primary">
          {loading ? 'Requesting...' : '🔑 Request Access'}
        </button>
      </div>

      {requestResult && (
        <div className="tool-card" style={{
          backgroundColor: requestResult.approved ? '#d1fae5' : '#fee2e2',
          border: `2px solid ${requestResult.approved ? '#10b981' : '#ef4444'}`
        }}>
          <h3>Access Request Result</h3>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <strong>Status:</strong>{' '}
              <span style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                {requestResult.approved ? '✅ APPROVED' : '❌ DENIED'}
              </span>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <strong>Risk Level:</strong>{' '}
              <span style={{ color: getRiskColor(requestResult.risk_level) }}>
                {requestResult.risk_level.toUpperCase()}
              </span>
            </div>
            {requestResult.requires_approval && (
              <div style={{ marginBottom: '0.75rem' }}>
                <strong>⚠️</strong> This tool requires manual approval
              </div>
            )}
            <div style={{ marginBottom: '0.75rem' }}>
              <strong>Reason:</strong> {requestResult.reason}
            </div>
          </div>
        </div>
      )}

      {/* Tool Gates Configuration */}
      <div className="tool-card" style={{ marginTop: '1.5rem' }}>
        <h3>🛠️ Tool Gates Configuration</h3>
        <div style={{ marginTop: '1rem' }}>
          {gates.map((gate, idx) => (
            <div key={idx} style={{
              padding: '1rem',
              marginBottom: '0.75rem',
              backgroundColor: gate.enabled ? '#f9fafb' : '#fee2e2',
              border: '1px solid #e5e7eb',
              borderLeft: `4px solid ${getRiskColor(gate.risk_level)}`,
              borderRadius: '0.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    {gate.tool_name}
                  </div>
                  <div style={{ fontSize: '0.85em', color: '#6b7280', marginBottom: '0.5rem' }}>
                    {gate.description}
                  </div>
                  <div style={{ fontSize: '0.85em' }}>
                    <span style={{ color: getRiskColor(gate.risk_level) }}>
                      Risk: {gate.risk_level.toUpperCase()}
                    </span>
                    {' | '}
                    {gate.requires_approval ? '🔒 Requires Approval' : '✓ Auto-approve'}
                    {gate.allowed_contexts && ` | Contexts: ${gate.allowed_contexts}`}
                  </div>
                </div>
                <button
                  onClick={() => toggleGate(gate.tool_name, gate.enabled)}
                  className={gate.enabled ? 'btn btn-secondary' : 'btn btn-primary'}
                  style={{ marginLeft: '1rem' }}
                >
                  {gate.enabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: '1.5rem' }}>
        {/* Stats */}
        {stats && (
          <div className="tool-card">
            <h3>📊 Access Statistics</h3>
            <div style={{ marginTop: '1rem' }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong>Total Requests:</strong> {stats.totalRequests}
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong>Approved:</strong> {stats.approvedRequests}
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong>Approval Rate:</strong> {stats.approvalRate}%
              </div>
              {stats.byTool && stats.byTool.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <strong>By Tool:</strong>
                  {stats.byTool.slice(0, 5).map((t, idx) => (
                    <div key={idx} style={{ fontSize: '0.85em', marginTop: '0.5rem' }}>
                      {t.tool_name}: {t.approved}/{t.total} approved
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Access Logs */}
        <div className="tool-card">
          <h3>📜 Access Log</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '1rem' }}>
            {logs.map((log, idx) => (
              <div key={idx} style={{
                padding: '0.75rem',
                marginBottom: '0.5rem',
                backgroundColor: log.approved ? '#d1fae5' : '#fee2e2',
                borderLeft: `4px solid ${log.approved ? '#10b981' : '#ef4444'}`,
                borderRadius: '0.25rem'
              }}>
                <div style={{ fontSize: '0.85em', fontWeight: 'bold' }}>
                  {log.tool_name}
                </div>
                <div style={{ fontSize: '0.85em', marginTop: '0.25rem' }}>
                  Agent: {log.agent_id} | Context: {log.context || 'none'}
                </div>
                <div style={{ fontSize: '0.85em', color: '#6b7280', marginTop: '0.25rem' }}>
                  {log.approved ? '✅ Approved' : '❌ Denied'} - {log.reason}
                </div>
                <div style={{ fontSize: '0.75em', color: '#6b7280', marginTop: '0.25rem' }}>
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="tool-card" style={{ marginTop: '1.5rem', backgroundColor: '#eff6ff', border: '1px solid #93c5fd' }}>
        <h3>🎯 Tool Risk Levels</h3>
        <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
          <li><strong style={{ color: '#ef4444' }}>Critical:</strong> File writes, shell execution, code execution - Always requires approval</li>
          <li><strong style={{ color: '#f59e0b' }}>High:</strong> Database queries, browser control - Requires approval by default</li>
          <li><strong style={{ color: '#eab308' }}>Medium:</strong> Network requests - May auto-approve with context</li>
          <li><strong style={{ color: '#10b981' }}>Low:</strong> Read-only operations - Usually auto-approved</li>
        </ul>
      </div>
    </div>
  );
}

export default AgentToolAccessGate;
