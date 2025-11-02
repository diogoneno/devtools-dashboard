import { useState } from 'react';
import '../ToolLayout.css';

const UUIDGenerator = () => {
  const [uuids, setUuids] = useState([]);
  const [count, setCount] = useState(1);

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const generate = () => {
    const newUuids = [];
    for (let i = 0; i < count; i++) {
      newUuids.push(generateUUID());
    }
    setUuids(newUuids);
  };

  const copyToClipboard = (uuid) => {
    navigator.clipboard.writeText(uuid);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(uuids.join('\n'));
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>UUID Generator</h1>
        <p>Generate UUIDs v4</p>
      </div>

      <div className="tool-card">
        <div className="input-group">
          <label>Number of UUIDs: {count}</label>
          <input
            type="range"
            min="1"
            max="20"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <button className="btn btn-primary" onClick={generate}>
          Generate UUID{count > 1 ? 's' : ''}
        </button>

        {uuids.length > 0 && (
          <>
            <div className="result-box">
              {uuids.map((uuid, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px',
                  background: idx % 2 === 0 ? '#f8f9fa' : 'white',
                  marginBottom: '5px',
                  borderRadius: '3px'
                }}>
                  <code>{uuid}</code>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '5px 10px' }}
                    onClick={() => copyToClipboard(uuid)}
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>

            {uuids.length > 1 && (
              <button className="btn btn-success" onClick={copyAll}>
                Copy All
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UUIDGenerator;
