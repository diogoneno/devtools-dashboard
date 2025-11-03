import { useState } from 'react';
import '../ToolLayout.css';

const SQLInjectionTester = () => {
  const [testString, setTestString] = useState('');
  const [results, setResults] = useState(null);

  const sqlPayloads = [
    { payload: "' OR '1'='1", type: 'Classic', risk: 'High', description: 'Boolean-based blind' },
    { payload: "' OR 1=1--", type: 'Classic', risk: 'High', description: 'Authentication bypass' },
    { payload: "admin' --", type: 'Authentication', risk: 'Critical', description: 'Admin bypass' },
    { payload: "' UNION SELECT NULL--", type: 'Union-based', risk: 'High', description: 'Data extraction' },
    { payload: "'; DROP TABLE users--", type: 'Destructive', risk: 'Critical', description: 'Data destruction' },
    { payload: "' AND 1=1--", type: 'Boolean', risk: 'Medium', description: 'True condition test' },
    { payload: "' AND 1=2--", type: 'Boolean', risk: 'Medium', description: 'False condition test' },
    { payload: "1' ORDER BY 1--", type: 'Order-based', risk: 'Medium', description: 'Column enumeration' },
    { payload: "' WAITFOR DELAY '00:00:05'--", type: 'Time-based', risk: 'High', description: 'Blind SQL injection' },
    { payload: "' OR 'x'='x", type: 'String', risk: 'High', description: 'String-based injection' }
  ];

  const testForSQLInjection = () => {
    const dangerous = [];

    sqlPayloads.forEach(({ payload, type, risk, description }) => {
      if (testString.includes(payload.replace('--', '').trim())) {
        dangerous.push({ payload, type, risk, description, detected: true });
      }
    });

    setResults({
      tested: testString,
      vulnerable: dangerous.length > 0,
      detectedPayloads: dangerous,
      totalTests: sqlPayloads.length,
      detectedCount: dangerous.length
    });
  };

  const generateReport = () => {
    if (!results) return;

    let report = '=== SQL Injection Test Report ===\n\n';
    report += `Tested Input: ${results.tested}\n`;
    report += `Status: ${results.vulnerable ? 'VULNERABLE' : 'SAFE'}\n`;
    report += `Tests Run: ${results.totalTests}\n`;
    report += `Threats Detected: ${results.detectedCount}\n\n`;

    if (results.vulnerable) {
      report += '=== Detected Payloads ===\n';
      results.detectedPayloads.forEach((item, idx) => {
        report += `\n${idx + 1}. ${item.payload}\n`;
        report += `   Type: ${item.type}\n`;
        report += `   Risk: ${item.risk}\n`;
        report += `   Description: ${item.description}\n`;
      });
    }

    report += '\n\n=== Recommendations ===\n';
    report += '1. Use parameterized queries/prepared statements\n';
    report += '2. Implement input validation and sanitization\n';
    report += '3. Use ORM frameworks when possible\n';
    report += '4. Apply principle of least privilege for database accounts\n';
    report += '5. Implement WAF (Web Application Firewall)\n';
    report += '\nReference: OWASP Top 10 2021 - A03:Injection\n';

    navigator.clipboard.writeText(report);
    alert('Report copied to clipboard!');
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>💉 SQL Injection Tester</h1>
        <p>Test input for SQL injection vulnerabilities (OWASP Top 10)</p>
      </div>

      <div className="tool-card">
        <div className="error-message">
          <strong>⚠️ WARNING:</strong> Only test applications you own or have written permission to test. Unauthorized testing is illegal.
        </div>

        <div className="info-message">
          <strong>📚 Educational Tool:</strong> This tool helps developers understand SQL injection patterns. Reference: OWASP Top 10 - A03:Injection
        </div>

        <div className="input-group">
          <label>Test Input String</label>
          <textarea
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder="Enter input to test for SQL injection patterns..."
            style={{ minHeight: '100px' }}
          />
        </div>

        <button className="btn btn-primary" onClick={testForSQLInjection}>
          Test for SQL Injection
        </button>

        {results && (
          <>
            <div className={`${results.vulnerable ? 'error-message' : 'success-message'}`} style={{ marginTop: '20px' }}>
              <h3>
                {results.vulnerable ? '⚠️ VULNERABLE' : '✅ NO THREATS DETECTED'}
              </h3>
              <p>
                Detected {results.detectedCount} out of {results.totalTests} known SQL injection patterns
              </p>
            </div>

            {results.vulnerable && (
              <div className="result-box" style={{ marginTop: '20px' }}>
                <h3>🚨 Detected SQL Injection Patterns</h3>
                {results.detectedPayloads.map((item, idx) => (
                  <div key={idx} style={{
                    padding: '15px',
                    background: '#f8d7da',
                    border: '1px solid #f5c6cb',
                    borderRadius: '5px',
                    marginBottom: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ fontFamily: 'monospace' }}>{item.payload}</strong>
                      <span style={{
                        padding: '3px 8px',
                        background: item.risk === 'Critical' ? '#dc3545' : item.risk === 'High' ? '#fd7e14' : '#ffc107',
                        color: 'white',
                        borderRadius: '3px',
                        fontSize: '12px'
                      }}>
                        {item.risk} Risk
                      </span>
                    </div>
                    <div><strong>Type:</strong> {item.type}</div>
                    <div><strong>Attack Vector:</strong> {item.description}</div>
                  </div>
                ))}

                <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '5px' }}>
                  <h4>🛡️ Mitigation Strategies (OWASP Guidelines)</h4>
                  <ul>
                    <li>Use parameterized queries (prepared statements)</li>
                    <li>Implement input validation with whitelisting</li>
                    <li>Use stored procedures with proper parameterization</li>
                    <li>Escape all user input</li>
                    <li>Apply principle of least privilege</li>
                    <li>Implement WAF rules</li>
                  </ul>
                </div>

                <button className="btn btn-success" style={{ marginTop: '15px' }} onClick={generateReport}>
                  Generate Security Report
                </button>
              </div>
            )}
          </>
        )}

        <div className="result-box" style={{ marginTop: '20px' }}>
          <h4>📖 Common SQL Injection Patterns</h4>
          <div style={{ fontSize: '14px', maxHeight: '300px', overflow: 'auto' }}>
            {sqlPayloads.map((item, idx) => (
              <div key={idx} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                <code>{item.payload}</code> - {item.description} ({item.risk} risk)
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SQLInjectionTester;
