import { useState } from 'react';
import '../ToolLayout.css';

const HashGenerator = () => {
  const [input, setInput] = useState('');
  const [hashes, setHashes] = useState({});

  const generateHashes = async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);

    const results = {};

    // SHA-256
    const sha256Buffer = await crypto.subtle.digest('SHA-256', data);
    results.sha256 = Array.from(new Uint8Array(sha256Buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // SHA-384
    const sha384Buffer = await crypto.subtle.digest('SHA-384', data);
    results.sha384 = Array.from(new Uint8Array(sha384Buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // SHA-512
    const sha512Buffer = await crypto.subtle.digest('SHA-512', data);
    results.sha512 = Array.from(new Uint8Array(sha512Buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    setHashes(results);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>Hash Generator</h1>
        <p>Generate SHA-256, SHA-384, and SHA-512 hashes</p>
      </div>

      <div className="tool-card">
        <div className="input-group">
          <label>Input Text</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text to hash"
          />
        </div>

        <button className="btn btn-primary" onClick={generateHashes}>Generate Hashes</button>

        {hashes.sha256 && (
          <>
            <div className="result-box">
              <strong>SHA-256:</strong>
              <div style={{ wordBreak: 'break-all', marginTop: '10px' }}>
                {hashes.sha256}
              </div>
              <button
                className="btn btn-secondary"
                style={{ marginTop: '10px' }}
                onClick={() => copyToClipboard(hashes.sha256)}
              >
                Copy
              </button>
            </div>

            <div className="result-box">
              <strong>SHA-384:</strong>
              <div style={{ wordBreak: 'break-all', marginTop: '10px' }}>
                {hashes.sha384}
              </div>
              <button
                className="btn btn-secondary"
                style={{ marginTop: '10px' }}
                onClick={() => copyToClipboard(hashes.sha384)}
              >
                Copy
              </button>
            </div>

            <div className="result-box">
              <strong>SHA-512:</strong>
              <div style={{ wordBreak: 'break-all', marginTop: '10px' }}>
                {hashes.sha512}
              </div>
              <button
                className="btn btn-secondary"
                style={{ marginTop: '10px' }}
                onClick={() => copyToClipboard(hashes.sha512)}
              >
                Copy
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HashGenerator;
