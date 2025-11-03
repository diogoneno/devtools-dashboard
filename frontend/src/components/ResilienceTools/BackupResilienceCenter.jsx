import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../ToolLayout.css';

const BACKUP_API = import.meta.env.VITE_BACKUP_API || 'http://localhost:5007/api';

function BackupResilienceCenter() {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentBackups, setRecentBackups] = useState([]);

  useEffect(() => {
    fetchKPIs();
    fetchRecentBackups();
  }, []);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKUP_API}/kpis`);
      setKpis(response.data.kpis);
      setError('');
    } catch (err) {
      setError(`Failed to fetch KPIs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentBackups = async () => {
    try {
      const response = await axios.get(`${BACKUP_API}/backups?limit=10`);
      setRecentBackups(response.data.backups);
    } catch (err) {
      console.error('Failed to fetch recent backups:', err);
    }
  };

  const getStatusColor = (successRate) => {
    if (successRate >= 95) return '#10b981';
    if (successRate >= 85) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>Backup Resilience Center</h1>
        <p>Executive dashboard for backup operations and data protection KPIs</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="tool-card">Loading KPIs...</div>
      ) : kpis ? (
        <>
          <div className="grid-2">
            {/* Backup KPIs */}
            <div className="tool-card">
              <h3>📊 Backup Operations</h3>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Total Backups:</strong> {kpis.backups.total}
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Success Rate:</strong>{' '}
                  <span style={{
                    color: getStatusColor(parseFloat(kpis.backups.successRate)),
                    fontWeight: 'bold',
                    fontSize: '1.2em'
                  }}>
                    {kpis.backups.successRate}%
                  </span>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Succeeded:</strong> {kpis.backups.succeeded} | <strong>Failed:</strong> {kpis.backups.failed}
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Avg Duration:</strong> {kpis.backups.avgDurationMin} min
                </div>
                <div>
                  <strong>Total Data Protected:</strong> {kpis.backups.totalSizeGB} GB
                </div>
              </div>
            </div>

            {/* Immutability Coverage */}
            <div className="tool-card">
              <h3>🔒 Immutability Coverage</h3>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Immutable Backups:</strong> {kpis.backups.immutableCount}
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Coverage:</strong>{' '}
                  <span style={{
                    color: parseFloat(kpis.backups.immutableCoverage) >= 80 ? '#10b981' : '#f59e0b',
                    fontWeight: 'bold',
                    fontSize: '1.2em'
                  }}>
                    {kpis.backups.immutableCoverage}%
                  </span>
                </div>
                <p style={{ fontSize: '0.9em', color: '#6b7280', marginTop: '1rem' }}>
                  {parseFloat(kpis.backups.immutableCoverage) >= 80
                    ? '✅ Meeting ransomware protection standards'
                    : '⚠️ Consider increasing immutable backup coverage'}
                </p>
              </div>
            </div>

            {/* Restore Readiness */}
            <div className="tool-card">
              <h3>🔄 Restore Readiness</h3>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Total Restores:</strong> {kpis.restores.total}
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <strong>DR Drills Conducted:</strong> {kpis.restores.drills}
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Avg RTO:</strong> {kpis.restores.avgRTOMin} min
                </div>
                <p style={{ fontSize: '0.9em', color: '#6b7280', marginTop: '1rem' }}>
                  {kpis.restores.drills > 0
                    ? '✅ Regular DR testing in progress'
                    : '⚠️ No DR drills recorded - schedule testing'}
                </p>
              </div>
            </div>

            {/* Security Alerts */}
            <div className="tool-card">
              <h3>🚨 Security Posture</h3>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Canary Alerts:</strong>{' '}
                  <span style={{
                    color: kpis.security.canaryAlerts > 0 ? '#ef4444' : '#10b981',
                    fontWeight: 'bold',
                    fontSize: '1.2em'
                  }}>
                    {kpis.security.canaryAlerts}
                  </span>
                </div>
                <p style={{ fontSize: '0.9em', color: '#6b7280', marginTop: '1rem' }}>
                  {kpis.security.canaryAlerts === 0
                    ? '✅ No ransomware indicators detected'
                    : '🚨 ALERT: Investigate canary file modifications'}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Backup Jobs */}
          <div className="tool-card" style={{ marginTop: '1.5rem' }}>
            <h3>📋 Recent Backup Jobs</h3>
            {recentBackups.length > 0 ? (
              <table style={{ width: '100%', marginTop: '1rem', fontSize: '0.9em' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Client</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Policy</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Size (GB)</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center' }}>Immutable</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Started</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBackups.map((backup, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.5rem' }}>{backup.client}</td>
                      <td style={{ padding: '0.5rem' }}>{backup.policy}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>{backup.size_gb || 'N/A'}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          backgroundColor: backup.status === 'success' ? '#d1fae5' : '#fee2e2',
                          color: backup.status === 'success' ? '#065f46' : '#991b1b',
                          fontSize: '0.85em'
                        }}>
                          {backup.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        {backup.immutable ? '🔒' : '—'}
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        {new Date(backup.start_ts).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ marginTop: '1rem' }}>No recent backup jobs found</p>
            )}
          </div>

          <div className="tool-card" style={{ marginTop: '1.5rem', backgroundColor: '#eff6ff', border: '1px solid #93c5fd' }}>
            <p style={{ margin: 0, fontSize: '0.9em' }}>
              <strong>💡 Resilience Best Practices:</strong> Maintain 95%+ success rate, enable immutability on 80%+ backups,
              conduct monthly DR drills, monitor canary files for ransomware indicators.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default BackupResilienceCenter;
