import { useState } from 'react';
import '../ToolLayout.css';

function SourcePolicies() {
  const [policy, setPolicy] = useState({
    name: 'Default Policy',
    allowList: [],
    denyList: [],
    boostIFCN: true,
    minCredibilityScore: 0,
    timeWindow: { enabled: false, start: '', end: '' }
  });
  const [domain, setDomain] = useState('');
  const [dryRunResult, setDryRunResult] = useState(null);

  const addToAllowList = () => {
    if (domain && !policy.allowList.includes(domain)) {
      setPolicy({ ...policy, allowList: [...policy.allowList, domain] });
      setDomain('');
    }
  };

  const addToDenyList = () => {
    if (domain && !policy.denyList.includes(domain)) {
      setPolicy({ ...policy, denyList: [...policy.denyList, domain] });
      setDomain('');
    }
  };

  const removeFromList = (list, item) => {
    setPolicy({ ...policy, [list]: policy[list].filter(d => d !== item) });
  };

  const runDryRun = () => {
    setDryRunResult({
      message: 'Dry run completed',
      affected: policy.denyList.length,
      boosted: policy.boostIFCN ? 'IFCN signatories' : 'None'
    });
  };

  const exportPolicy = () => {
    const json = JSON.stringify(policy, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `policy-${policy.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>Source Controls & Policies</h1>
        <p>Create filtering policies for domains, topics, and credibility thresholds</p>
      </div>

      <div className="tool-card">
        <h3>Policy Name</h3>
        <div className="input-group">
          <input
            type="text"
            value={policy.name}
            onChange={(e) => setPolicy({ ...policy, name: e.target.value })}
            placeholder="My Policy"
          />
        </div>
      </div>

      <div className="grid-2">
        <div className="tool-card">
          <h3>Allow List</h3>
          <p style={{ fontSize: '12px', color: '#666' }}>Only show items from these domains</p>
          <div className="input-group">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              onKeyPress={(e) => e.key === 'Enter' && addToAllowList()}
            />
            <button className="btn btn-sm" onClick={addToAllowList}>Add</button>
          </div>
          <div style={{ marginTop: '10px' }}>
            {policy.allowList.map((d, idx) => (
              <div key={idx} className="result-box" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', marginBottom: '5px' }}>
                <span>{d}</span>
                <button className="btn btn-sm" onClick={() => removeFromList('allowList', d)}>Remove</button>
              </div>
            ))}
            {policy.allowList.length === 0 && <p style={{ color: '#999', fontSize: '12px' }}>No domains added</p>}
          </div>
        </div>

        <div className="tool-card">
          <h3>Deny List</h3>
          <p style={{ fontSize: '12px', color: '#666' }}>Block items from these domains</p>
          <div className="input-group">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="spam.com"
              onKeyPress={(e) => e.key === 'Enter' && addToDenyList()}
            />
            <button className="btn btn-sm" onClick={addToDenyList}>Add</button>
          </div>
          <div style={{ marginTop: '10px' }}>
            {policy.denyList.map((d, idx) => (
              <div key={idx} className="result-box" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', marginBottom: '5px', backgroundColor: '#ffe6e6' }}>
                <span>{d}</span>
                <button className="btn btn-sm" onClick={() => removeFromList('denyList', d)}>Remove</button>
              </div>
            ))}
            {policy.denyList.length === 0 && <p style={{ color: '#999', fontSize: '12px' }}>No domains added</p>}
          </div>
        </div>
      </div>

      <div className="tool-card">
        <h3>Credibility Settings</h3>
        <div className="input-group">
          <label>
            <input
              type="checkbox"
              checked={policy.boostIFCN}
              onChange={(e) => setPolicy({ ...policy, boostIFCN: e.target.checked })}
            />
            Boost IFCN Signatories (credible fact-checkers)
          </label>
        </div>
        <div className="input-group">
          <label>Minimum Credibility Score (0-100)</label>
          <input
            type="range"
            min="0"
            max="100"
            value={policy.minCredibilityScore}
            onChange={(e) => setPolicy({ ...policy, minCredibilityScore: parseInt(e.target.value) })}
          />
          <span>{policy.minCredibilityScore}</span>
        </div>
      </div>

      <div className="tool-card">
        <h3>Actions</h3>
        <button className="btn btn-primary" onClick={runDryRun}>
          Dry Run
        </button>
        <button className="btn" onClick={exportPolicy} style={{ marginLeft: '10px' }}>
          Export Policy JSON
        </button>

        {dryRunResult && (
          <div className="success-message" style={{ marginTop: '15px' }}>
            <p><strong>{dryRunResult.message}</strong></p>
            <p>Blocked domains: {dryRunResult.affected}</p>
            <p>Boosted: {dryRunResult.boosted}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SourcePolicies;
