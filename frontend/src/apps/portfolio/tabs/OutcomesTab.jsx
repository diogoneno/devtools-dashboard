import { useState, useEffect, useCallback } from 'react';
import portfolioClient from '../../../lib/portfolioClient';

function OutcomesTab({ moduleSlug }) {
  const [outcomes, setOutcomes] = useState([]);
  const [artifacts, setArtifacts] = useState([]);

  const loadData = useCallback(async () => {
    const [outcomesData, artifactsData] = await Promise.all([
      portfolioClient.getOutcomes(moduleSlug),
      portfolioClient.getArtifacts(moduleSlug)
    ]);
    setOutcomes(outcomesData);
    setArtifacts(artifactsData);
  }, [moduleSlug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div>
      <h3>Learning Outcomes Matrix</h3>
      {outcomes.length === 0 ? (
        <div className="error-message">
          No learning outcomes defined. Add an outcomes.yaml or outcomes.json file to your module.
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Description</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Evidence Count</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {outcomes.map((outcome, idx) => {
              const evidenceCount = outcome.evidence?.length || 0;
              const status = evidenceCount > 0 ? '✅ Covered' : '⚠️ Gap';
              const statusColor = evidenceCount > 0 ? '#27ae60' : '#e74c3c';

              return (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}><strong>{outcome.id}</strong></td>
                  <td style={{ padding: '10px' }}>{outcome.description}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{evidenceCount}</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: statusColor }}>
                    {status}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
        Total artifacts available for mapping: {artifacts.length}
      </div>
    </div>
  );
}

export default OutcomesTab;
