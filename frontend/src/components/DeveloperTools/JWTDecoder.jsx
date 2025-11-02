import { useState } from 'react';
import '../ToolLayout.css';

const JWTDecoder = () => {
  const [token, setToken] = useState('');
  const [decoded, setDecoded] = useState(null);
  const [error, setError] = useState('');

  const decodeJWT = () => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));

      setDecoded({ header, payload, signature: parts[2] });
      setError('');
    } catch (err) {
      setError('Invalid JWT: ' + err.message);
      setDecoded(null);
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>JWT Decoder</h1>
        <p>Decode and inspect JWT tokens</p>
      </div>

      <div className="tool-card">
        <div className="input-group">
          <label>JWT Token</label>
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          />
        </div>

        <button className="btn btn-primary" onClick={decodeJWT}>Decode JWT</button>

        {error && <div className="error-message">{error}</div>}

        {decoded && (
          <>
            <div className="result-box">
              <h3>Header</h3>
              <pre>{JSON.stringify(decoded.header, null, 2)}</pre>
            </div>

            <div className="result-box">
              <h3>Payload</h3>
              <pre>{JSON.stringify(decoded.payload, null, 2)}</pre>
            </div>

            <div className="result-box">
              <h3>Signature</h3>
              <pre>{decoded.signature}</pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default JWTDecoder;
