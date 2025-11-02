import { useState } from 'react';
import '../ToolLayout.css';

const PasswordGenerator = () => {
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [password, setPassword] = useState('');

  const generatePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let chars = '';
    if (includeUppercase) chars += uppercase;
    if (includeLowercase) chars += lowercase;
    if (includeNumbers) chars += numbers;
    if (includeSymbols) chars += symbols;

    if (chars === '') {
      setPassword('Please select at least one character type');
      return;
    }

    let generated = '';
    for (let i = 0; i < length; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    setPassword(generated);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>Password Generator</h1>
        <p>Generate secure random passwords</p>
      </div>

      <div className="tool-card">
        <div className="input-group">
          <label>Length: {length}</label>
          <input
            type="range"
            min="8"
            max="64"
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div className="input-group">
          <label>
            <input
              type="checkbox"
              checked={includeUppercase}
              onChange={(e) => setIncludeUppercase(e.target.checked)}
              style={{ width: 'auto', marginRight: '10px' }}
            />
            Include Uppercase (A-Z)
          </label>
        </div>

        <div className="input-group">
          <label>
            <input
              type="checkbox"
              checked={includeLowercase}
              onChange={(e) => setIncludeLowercase(e.target.checked)}
              style={{ width: 'auto', marginRight: '10px' }}
            />
            Include Lowercase (a-z)
          </label>
        </div>

        <div className="input-group">
          <label>
            <input
              type="checkbox"
              checked={includeNumbers}
              onChange={(e) => setIncludeNumbers(e.target.checked)}
              style={{ width: 'auto', marginRight: '10px' }}
            />
            Include Numbers (0-9)
          </label>
        </div>

        <div className="input-group">
          <label>
            <input
              type="checkbox"
              checked={includeSymbols}
              onChange={(e) => setIncludeSymbols(e.target.checked)}
              style={{ width: 'auto', marginRight: '10px' }}
            />
            Include Symbols (!@#$...)
          </label>
        </div>

        <button className="btn btn-primary" onClick={generatePassword}>
          Generate Password
        </button>

        {password && (
          <div className="result-box">
            <div style={{ fontSize: '24px', wordBreak: 'break-all', marginBottom: '10px' }}>
              {password}
            </div>
            <button className="btn btn-success" onClick={copyToClipboard}>
              Copy to Clipboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordGenerator;
