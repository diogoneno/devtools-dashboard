import { useState } from 'react';
import '../ToolLayout.css';

const XSSTester = () => {
  const [input, setInput] = useState('');
  const [results, setResults] = useState(null);

  const xssPayloads = [
    { payload: '<script>alert("XSS")</script>', type: 'Reflected', risk: 'High' },
    { payload: '<img src=x onerror=alert("XSS")>', type: 'Image-based', risk: 'High' },
    { payload: '<svg/onload=alert("XSS")>', type: 'SVG-based', risk: 'High' },
    { payload: 'javascript:alert("XSS")', type: 'JavaScript Protocol', risk: 'Medium' },
    { payload: '<iframe src="javascript:alert(`XSS`)"></iframe>', type: 'IFrame', risk: 'High' },
    { payload: '<body onload=alert("XSS")>', type: 'Event Handler', risk: 'High' },
    { payload: '<input onfocus=alert("XSS") autofocus>', type: 'Input-based', risk: 'Medium' },
    { payload: '<select onfocus=alert("XSS") autofocus>', type: 'Select-based', risk: 'Medium' },
    { payload: '<textarea onfocus=alert("XSS") autofocus>', type: 'Textarea-based', risk: 'Medium' },
    { payload: '"><script>alert(String.fromCharCode(88,83,83))</script>', type: 'Encoded', risk: 'High' }
  ];

  const testXSS = () => {
    const detected = xssPayloads.filter(p =>
      input.toLowerCase().includes(p.payload.toLowerCase())
    );

    setResults({
      tested: input,
      vulnerable: detected.length > 0,
      detectedPayloads: detected,
      totalTests: xssPayloads.length,
      detectedCount: detected.length
    });
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>🎯 XSS Vulnerability Tester</h1>
        <p>Test for Cross-Site Scripting vulnerabilities (OWASP A07:2021)</p>
      </div>

      <div className="tool-card">
        <div className="error-message">
          <strong>⚠️ AUTHORIZED TESTING ONLY:</strong> Only test applications you own or have permission to test.
        </div>

        <div className="input-group">
          <label>Test Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter input to test for XSS patterns..."
            style={{ minHeight: '100px' }}
          />
        </div>

        <button className="btn btn-primary" onClick={testXSS}>Test for XSS</button>

        {results && (
          <div className={`${results.vulnerable ? 'error-message' : 'success-message'}`} style={{ marginTop: '20px' }}>
            <h3>{results.vulnerable ? '⚠️ XSS PATTERNS DETECTED' : '✅ NO XSS DETECTED'}</h3>
            <p>Found {results.detectedCount} XSS patterns</p>
            {results.vulnerable && (
              <div style={{ marginTop: '15px' }}>
                {results.detectedPayloads.map((p, idx) => (
                  <div key={idx} style={{ padding: '10px', background: '#fff', borderRadius: '5px', marginBottom: '10px' }}>
                    <code>{p.payload}</code> - {p.type} ({p.risk} Risk)
                  </div>
                ))}
                <div style={{ marginTop: '15px', padding: '10px', background: '#fff3cd', borderRadius: '5px' }}>
                  <strong>🛡️ Mitigation (OWASP):</strong>
                  <ul>
                    <li>Encode output data</li>
                    <li>Validate input (whitelist)</li>
                    <li>Use Content Security Policy (CSP)</li>
                    <li>Set HTTPOnly cookies</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default XSSTester;
