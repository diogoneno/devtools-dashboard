import { useState } from 'react';
import '../ToolLayout.css';

const CodeDiff = () => {
  const [original, setOriginal] = useState('');
  const [modified, setModified] = useState('');
  const [diff, setDiff] = useState([]);

  const computeDiff = () => {
    const origLines = original.split('\n');
    const modLines = modified.split('\n');
    const result = [];

    const maxLength = Math.max(origLines.length, modLines.length);

    for (let i = 0; i < maxLength; i++) {
      const origLine = origLines[i] || '';
      const modLine = modLines[i] || '';

      if (origLine === modLine) {
        result.push({ type: 'unchanged', content: origLine });
      } else if (origLine && !modLine) {
        result.push({ type: 'removed', content: origLine });
      } else if (!origLine && modLine) {
        result.push({ type: 'added', content: modLine });
      } else {
        result.push({ type: 'removed', content: origLine });
        result.push({ type: 'added', content: modLine });
      }
    }

    setDiff(result);
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>Code Diff Viewer</h1>
        <p>Compare two code snippets side-by-side</p>
      </div>

      <div className="tool-card">
        <div className="grid-2">
          <div className="input-group">
            <label>Original Code</label>
            <textarea
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              style={{ minHeight: '300px' }}
              placeholder="Original code..."
            />
          </div>

          <div className="input-group">
            <label>Modified Code</label>
            <textarea
              value={modified}
              onChange={(e) => setModified(e.target.value)}
              style={{ minHeight: '300px' }}
              placeholder="Modified code..."
            />
          </div>
        </div>

        <button className="btn btn-primary" onClick={computeDiff}>Compare</button>

        {diff.length > 0 && (
          <div className="result-box" style={{ marginTop: '20px' }}>
            <h3>Diff Result</h3>
            <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
              {diff.map((line, idx) => (
                <div
                  key={idx}
                  style={{
                    background:
                      line.type === 'added'
                        ? '#d4edda'
                        : line.type === 'removed'
                        ? '#f8d7da'
                        : 'transparent',
                    padding: '2px 5px',
                    borderLeft:
                      line.type === 'added'
                        ? '3px solid #28a745'
                        : line.type === 'removed'
                        ? '3px solid #dc3545'
                        : '3px solid transparent'
                  }}
                >
                  <span style={{ color: '#6c757d', marginRight: '10px' }}>
                    {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                  </span>
                  {line.content}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeDiff;
