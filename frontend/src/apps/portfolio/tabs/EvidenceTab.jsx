import { useState, useEffect, useCallback } from 'react';
import portfolioClient from '../../../lib/portfolioClient';

function EvidenceTab({ moduleSlug }) {
  const [artifacts, setArtifacts] = useState([]);

  const loadArtifacts = useCallback(async () => {
    const data = await portfolioClient.getArtifacts(moduleSlug);
    setArtifacts(data);
  }, [moduleSlug]);

  useEffect(() => {
    loadArtifacts();
  }, [loadArtifacts]);

  const getKindIcon = (kind) => {
    const icons = {
      pdf: '📕',
      image: '🖼️',
      notebook: '📓',
      code: '💻',
      markdown: '📝',
      presentation: '📊',
      other: '📄'
    };
    return icons[kind] || icons.other;
  };

  return (
    <div>
      <h3>Evidence Browser</h3>
      {artifacts.length === 0 ? (
        <p style={{ color: '#666' }}>No artifacts found in this module</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '10px' }}>Type</th>
              <th style={{ padding: '10px' }}>Title</th>
              <th style={{ padding: '10px' }}>Tags</th>
              <th style={{ padding: '10px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {artifacts.map(artifact => (
              <tr key={artifact.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px', fontSize: '24px' }}>{getKindIcon(artifact.kind)}</td>
                <td style={{ padding: '10px' }}>{artifact.title}</td>
                <td style={{ padding: '10px' }}>
                  {artifact.tags.map((tag, i) => (
                    <span key={i} style={{
                      backgroundColor: '#e3f2fd',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      marginRight: '5px',
                      fontSize: '11px'
                    }}>
                      {tag}
                    </span>
                  ))}
                </td>
                <td style={{ padding: '10px' }}>
                  {artifact.url && (
                    <a href={artifact.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm">
                      View
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default EvidenceTab;
