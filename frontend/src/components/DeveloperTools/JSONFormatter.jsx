import { useState } from 'react';
import '../ToolLayout.css';

const JSONFormatter = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError('');
    } catch (err) {
      setError('Invalid JSON: ' + err.message);
      setOutput('');
    }
  };

  const minifyJSON = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError('');
    } catch (err) {
      setError('Invalid JSON: ' + err.message);
      setOutput('');
    }
  };

  const validateJSON = () => {
    try {
      JSON.parse(input);
      setError('');
      setOutput('✅ Valid JSON');
    } catch (err) {
      setError('Invalid JSON: ' + err.message);
      setOutput('');
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>JSON Formatter & Validator</h1>
        <p>Format, minify, and validate JSON data</p>
      </div>

      <div className="tool-card">
        <div className="input-group">
          <label>Input JSON</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"name": "John", "age": 30}'
          />
        </div>

        <div className="button-group">
          <button className="btn btn-primary" onClick={formatJSON}>Format</button>
          <button className="btn btn-secondary" onClick={minifyJSON}>Minify</button>
          <button className="btn btn-success" onClick={validateJSON}>Validate</button>
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

export default JSONFormatter;
