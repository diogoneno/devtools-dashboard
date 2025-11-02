import ReactMarkdown from 'react-markdown';

function OverviewTab({ module }) {
  return (
    <div>
      <h3>Module Overview</h3>
      {module.summary_md ? (
        <div className="result-box">
          <ReactMarkdown>{module.summary_md}</ReactMarkdown>
        </div>
      ) : (
        <p style={{ color: '#666' }}>No README found in module directory</p>
      )}
      <div style={{ marginTop: '20px' }}>
        <h4>Module Information</h4>
        <table style={{ width: '100%', marginTop: '10px' }}>
          <tbody>
            <tr><td><strong>Repository:</strong></td><td>{module.repo}</td></tr>
            <tr><td><strong>Path:</strong></td><td>{module.path}</td></tr>
            <tr><td><strong>Last Updated:</strong></td><td>{new Date(module.updated_at).toLocaleString()}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default OverviewTab;
