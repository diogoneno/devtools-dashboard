import { useState } from 'react';
import '../ToolLayout.css';

const Base64Tool = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const encode = () => {
    try {
      const encoded = btoa(input);
      setOutput(encoded);
      setError('');
    } catch (err) {
      setError('Error encoding: ' + err.message);
      setOutput('');
    }
  };

  const decode = () => {
    try {
      const decoded = atob(input);
      setOutput(decoded);
      setError('');
    } catch (err) {
      setError('Error decoding: Invalid Base64 string');
      setOutput('');
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>Base64 Encoder/Decoder</h1>
        <p>Encode and decode text to/from Base64</p>
      </div>

      <div className="tool-card">
        <div className="input-group">
          <label>Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text to encode or Base64 string to decode"
          />
        </div>

        <div className="button-group">
          <button className="btn btn-primary" onClick={encode}>Encode to Base64</button>
          <button className="btn btn-secondary" onClick={decode}>Decode from Base64</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {output && (
          <div className="input-group">
            <label>Output</label>
            <textarea value={output} readOnly />
          </div>
        )}
      </div>
    </div>
  );
};

export default Base64Tool;
