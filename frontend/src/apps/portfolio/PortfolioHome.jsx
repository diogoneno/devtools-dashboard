import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import portfolioClient from '../../lib/portfolioClient';
import '../../components/ToolLayout.css';

function PortfolioHome() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    setLoading(true);
    try {
      const data = await portfolioClient.getModules();
      setModules(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError('');
    try {
      await portfolioClient.syncFromGitHub();
      await loadModules();
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await portfolioClient.exportJSON();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio-export-${Date.now()}.json`;
      a.click();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>🎓 E-Portfolio</h1>
        <p>Academic modules, outcomes, evidence, and reflections</p>
      </div>

      <div className="tool-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Modules ({modules.length})</h3>
          <div>
            <button className="btn btn-primary" onClick={handleSync} disabled={syncing}>
              {syncing ? 'Syncing...' : 'Sync from GitHub'}
            </button>
            <button className="btn" onClick={handleExport} disabled={modules.length === 0} style={{ marginLeft: '10px' }}>
              Export JSON
            </button>
          </div>
        </div>

        {error && <div className="error-message" style={{ marginTop: '15px' }}>{error}</div>}

        {loading ? (
          <p>Loading modules...</p>
        ) : modules.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p>No modules found</p>
            <p style={{ fontSize: '14px' }}>Click "Sync from GitHub" to discover your academic modules</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
            {modules.map(module => (
              <Link
                key={module.slug}
                to={`/portfolio/${module.slug}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="result-box" style={{ height: '100%', cursor: 'pointer', transition: 'transform 0.2s' }}>
                  <h4>{module.name}</h4>
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>{module.repo}</p>
                  <div style={{ display: 'flex', gap: '15px', fontSize: '12px', marginTop: '10px' }}>
                    <span>📄 {module.artifact_count || 0} artifacts</span>
                    <span>📝 {module.reflection_count || 0} reflections</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#999', marginTop: '10px' }}>
                    Updated: {new Date(module.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="tool-card">
        <h3>About E-Portfolio</h3>
        <ul style={{ lineHeight: '1.8' }}>
          <li>Automatically discovers modules from your GitHub repositories</li>
          <li>Tracks learning outcomes, evidence, and reflections</li>
          <li>Works offline after initial sync</li>
          <li>Export portfolio data as JSON for archiving or transfer</li>
        </ul>
      </div>
    </div>
  );
}

export default PortfolioHome;
