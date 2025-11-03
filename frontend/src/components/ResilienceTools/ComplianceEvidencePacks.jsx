import React, { useState } from 'react';
import axios from 'axios';
import '../ToolLayout.css';

const COMPLIANCE_API = import.meta.env.VITE_COMPLIANCE_API || 'http://localhost:5010/api';

function ComplianceEvidencePacks() {
  const [iso27001, setIso27001] = useState(null);
  const [nist, setNist] = useState(null);
  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchISO27001 = async () => {
    try {
      const response = await axios.get(`${COMPLIANCE_API}/iso27001`);
      setIso27001(response.data.controls);
    } catch (err) {
      setError(`Failed to fetch ISO 27001: ${err.message}`);
    }
  };

  const fetchNIST = async () => {
    try {
      const response = await axios.get(`${COMPLIANCE_API}/nist800-53`);
      setNist(response.data.controls);
    } catch (err) {
      setError(`Failed to fetch NIST 800-53: ${err.message}`);
    }
  };

  const generatePack = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.post(`${COMPLIANCE_API}/pack`);
      setPack(response.data.pack);
      await fetchISO27001();
      await fetchNIST();
    } catch (err) {
      setError(`Failed to generate pack: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'compliant': return '#10b981';
      case 'partial': return '#f59e0b';
      case 'non-compliant': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const downloadPack = () => {
    const dataStr = JSON.stringify(pack, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `compliance-evidence-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>📋 Compliance Evidence Packs</h1>
        <p>Generate evidence packages mapping backup operations to compliance frameworks</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="tool-card">
        <button onClick={generatePack} disabled={loading} className="btn btn-primary">
          {loading ? 'Generating...' : '📦 Generate Evidence Pack'}
        </button>
        {pack && (
          <button onClick={downloadPack} className="btn btn-secondary" style={{ marginLeft: '1rem' }}>
            💾 Download Pack
          </button>
        )}
      </div>

      {pack && (
        <>
          <div className="tool-card" style={{ marginTop: '1.5rem' }}>
            <h3>📊 Evidence Summary</h3>
            <div style={{ marginTop: '1rem' }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong>Generated:</strong> {new Date(pack.generated_at).toLocaleString()}
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong>Total Backup Jobs:</strong> {pack.evidence.backupJobs}
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong>Success Rate:</strong> {pack.evidence.successRate}%
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong>Immutable Backups:</strong> {pack.evidence.immutableBackups}
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong>DR Drills Conducted:</strong> {pack.evidence.drDrillsConducted}
              </div>
            </div>
          </div>

          <div className="grid-2" style={{ marginTop: '1.5rem' }}>
            {/* ISO 27001 */}
            <div className="tool-card">
              <h3>🌐 ISO 27001 Controls</h3>
              {iso27001 && iso27001.map((control, idx) => (
                <div key={idx} style={{
                  padding: '0.75rem',
                  marginTop: '0.75rem',
                  backgroundColor: '#f9fafb',
                  borderLeft: `4px solid ${getStatusColor(control.status)}`,
                  borderRadius: '0.25rem'
                }}>
                  <div style={{ fontWeight: 'bold' }}>{control.id}: {control.name}</div>
                  <div style={{
                    marginTop: '0.25rem',
                    fontSize: '0.85em',
                    color: getStatusColor(control.status)
                  }}>
                    Status: {control.status.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>

            {/* NIST 800-53 */}
            <div className="tool-card">
              <h3>🇺🇸 NIST 800-53 Controls</h3>
              {nist && nist.map((control, idx) => (
                <div key={idx} style={{
                  padding: '0.75rem',
                  marginTop: '0.75rem',
                  backgroundColor: '#f9fafb',
                  borderLeft: `4px solid ${getStatusColor(control.status)}`,
                  borderRadius: '0.25rem'
                }}>
                  <div style={{ fontWeight: 'bold' }}>{control.id}: {control.name}</div>
                  <div style={{
                    marginTop: '0.25rem',
                    fontSize: '0.85em',
                    color: getStatusColor(control.status)
                  }}>
                    Status: {control.status.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="tool-card" style={{ marginTop: '1.5rem', backgroundColor: '#eff6ff', border: '1px solid #93c5fd' }}>
            <p style={{ margin: 0, fontSize: '0.9em' }}>
              <strong>📝 Attestation:</strong> {pack.attestation}
            </p>
          </div>
        </>
      )}

      <div className="tool-card" style={{ marginTop: '1.5rem', backgroundColor: '#fef3c7', border: '1px solid #fbbf24' }}>
        <h3>ℹ️ About Compliance Mappings</h3>
        <p style={{ marginTop: '1rem', lineHeight: '1.6' }}>
          This tool generates evidence packages that map your backup and DR operations to industry compliance frameworks:
        </p>
        <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
          <li><strong>ISO 27001 (A.12.3.1):</strong> Information backup requirements</li>
          <li><strong>ISO 27001 (A.17.1.2-3):</strong> Information security continuity</li>
          <li><strong>NIST 800-53 (CP-9):</strong> System Backup controls</li>
          <li><strong>NIST 800-53 (CP-10):</strong> System Recovery and Reconstitution</li>
          <li><strong>NIST 800-53 (SC-28):</strong> Protection of Information at Rest</li>
        </ul>
      </div>
    </div>
  );
}

export default ComplianceEvidencePacks;
