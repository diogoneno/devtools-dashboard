import { useState } from 'react';
import '../ToolLayout.css';

const RegexTester = () => {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [testString, setTestString] = useState('');
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState('');

  const testRegex = () => {
    try {
      const regex = new RegExp(pattern, flags);
      const foundMatches = [...testString.matchAll(regex)];
      setMatches(foundMatches);
      setError('');
    } catch (err) {
      setError('Invalid regex: ' + err.message);
      setMatches([]);
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>Regex Tester</h1>
        <p>Test regular expressions with live matching</p>
      </div>

      <div className="tool-card">
        <div className="input-group">
          <label>Regular Expression Pattern</label>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="[a-z]+"
          />
        </div>

        <div className="input-group">
          <label>Flags</label>
          <input
            type="text"
            value={flags}
            onChange={(e) => setFlags(e.target.value)}
            placeholder="g, i, m, etc."
          />
        </div>

        <div className="input-group">
          <label>Test String</label>
          <textarea
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder="Enter text to test against the regex"
          />
        </div>

        <button className="btn btn-primary" onClick={testRegex}>Test Regex</button>

        {error && <div className="error-message">{error}</div>}

        {matches.length > 0 && (
          <div className="success-message">
            Found {matches.length} match{matches.length !== 1 ? 'es' : ''}:
            <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
              {matches.map((match, idx) => (
                <li key={idx}>{match[0]}</li>
              ))}
            </ul>
          </div>
        )}

        {matches.length === 0 && !error && pattern && testString && (
          <div className="info-message">No matches found</div>
        )}
      </div>
    </div>
  );
};

export default RegexTester;
