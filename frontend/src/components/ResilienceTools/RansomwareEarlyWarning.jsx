import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../ToolLayout.css';

const RANSOMWARE_API = 'http://localhost:5008/api';

function RansomwareEarlyWarning() {
  const [signals, setSignals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchSignals = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${RANSOMWARE_API}/signals`);
      setSignals(response.data.signals);
      setError('');
    } catch (err) {
      setError(`Failed to fetch signals: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getThreatLevel = () => {
    if (!signals) return 'UNKNOWN';
    const alertCanaries = signals.canaries?.filter(c => c.alert).length || 0;
    const totalAlerts = alertCanaries + signals.backupTamper + signals.entropySpikes + signals.extensionBursts;

    if (totalAlerts >= 5) return 'CRITICAL';
    if (totalAlerts >= 3) return 'HIGH';
    if (totalAlerts >= 1) return 'MEDIUM';
    return 'LOW';
  };

  const getThreatColor = (level) => {
    switch (level) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f59e0b';
      case 'MEDIUM': return '#eab308';
      case 'LOW': return '#10b981';
      default: return '#6b7280';
    }
  };

  const threatLevel = getThreatLevel();

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>🚨 Ransomware Early Warning</h1>
        <p>Real-time detection of ransomware indicators and anomalous activity</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="tool-card">Loading signals...</div>
      ) : signals ? (
        <>
          <div className="tool-card" style={{
            backgroundColor: threatLevel === 'LOW' ? '#d1fae5' : threatLevel === 'MEDIUM' ? '#fef3c7' : '#fee2e2',
            border: `2px solid ${getThreatColor(threatLevel)}`
          }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Threat Level</span>
              <span style={{
                fontSize: '2em',
                color: getThreatColor(threatLevel),
                fontWeight: 'bold'
              }}>
                {threatLevel}
              </span>
            </h2>
          </div>

          <div className="grid-2" style={{ marginTop: '1.5rem' }}>
            {/* Canary Files */}
            <div className="tool-card">
              <h3>🐦 Canary File Status</h3>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Monitored Files:</strong> {signals.canaries?.length || 0}
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Alerts:</strong>{' '}
                  <span style={{
                    color: (signals.canaries?.filter(c => c.alert).length || 0) > 0 ? '#ef4444' : '#10b981',
                    fontWeight: 'bold'
                  }}>
                    {signals.canaries?.filter(c => c.alert).length || 0}
                  </span>
                </div>
                {signals.canaries && signals.canaries.length > 0 && (
                  <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '1rem' }}>
                    {signals.canaries.slice(0, 10).map((canary, idx) => (
                      <div key={idx} style={{
                        padding: '0.5rem',
                        marginBottom: '0.5rem',
                        backgroundColor: canary.alert ? '#fee2e2' : '#f9fafb',
                        borderLeft: `4px solid ${canary.alert ? '#ef4444' : '#10b981'}`,
                        fontSize: '0.85em'
                      }}>
                        <div><strong>{canary.host}</strong>: {canary.path}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.9em' }}>
                          Last seen: {new Date(canary.lastSeen).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Backup Tampering */}
            <div className="tool-card">
              <h3>🔒 Backup Integrity</h3>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Suspicious Failures (24h):</strong>{' '}
                  <span style={{
                    color: signals.backupTamper > 5 ? '#ef4444' : signals.backupTamper > 0 ? '#f59e0b' : '#10b981',
                    fontWeight: 'bold',
                    fontSize: '1.5em'
                  }}>
                    {signals.backupTamper}
                  </span>
                </div>
                <p style={{ fontSize: '0.9em', color: '#6b7280', marginTop: '1rem' }}>
                  {signals.backupTamper === 0
                    ? '✅ No suspicious backup failures detected'
                    : signals.backupTamper > 5
                    ? '🚨 CRITICAL: High number of backup failures - possible tampering'
                    : '⚠️ Monitor: Unusual backup failure pattern'}
                </p>
              </div>
            </div>

            {/* Entropy Spikes */}
            <div className="tool-card">
              <h3>📊 File Entropy Analysis</h3>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Entropy Spikes:</strong>{' '}
                  <span style={{
                    color: signals.entropySpikes > 2 ? '#ef4444' : signals.entropySpikes > 0 ? '#f59e0b' : '#10b981',
                    fontWeight: 'bold',
                    fontSize: '1.5em'
                  }}>
                    {signals.entropySpikes}
                  </span>
                </div>
                <p style={{ fontSize: '0.9em', color: '#6b7280' }}>
                  Monitors for unusual increases in file randomness (encryption indicator)
                </p>
              </div>
            </div>

            {/* Extension Bursts */}
            <div className="tool-card">
              <h3>📁 File Extension Monitoring</h3>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Extension Bursts:</strong>{' '}
                  <span style={{
                    color: signals.extensionBursts > 1 ? '#ef4444' : signals.extensionBursts > 0 ? '#f59e0b' : '#10b981',
                    fontWeight: 'bold',
                    fontSize: '1.5em'
                  }}>
                    {signals.extensionBursts}
                  </span>
                </div>
                <p style={{ fontSize: '0.9em', color: '#6b7280' }}>
                  Detects rapid file extension changes (.locked, .encrypted, etc.)
                </p>
              </div>
            </div>
          </div>

          <div className="tool-card" style={{ marginTop: '1.5rem', backgroundColor: '#fef3c7', border: '1px solid #fbbf24' }}>
            <h3>🛡️ Response Actions</h3>
            <ol style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
              <li>Isolate affected systems from network immediately</li>
              <li>Activate incident response team and DR procedures</li>
              <li>Verify backup integrity before initiating restore</li>
              <li>Preserve forensic evidence for investigation</li>
              <li>Notify stakeholders per incident response plan</li>
            </ol>
          </div>

          <div className="tool-card" style={{ marginTop: '1.5rem', backgroundColor: '#eff6ff', border: '1px solid #93c5fd' }}>
            <p style={{ margin: 0, fontSize: '0.9em' }}>
              <strong>💡 About:</strong> This system uses multiple detection methods including canary files (honeypot files that should never change),
              entropy analysis (encrypted files have high randomness), and behavioral monitoring to detect ransomware before encryption completes.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default RansomwareEarlyWarning;
