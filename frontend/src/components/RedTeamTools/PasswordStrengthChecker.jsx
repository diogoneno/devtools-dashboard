import { useState } from 'react';
import '../ToolLayout.css';

const PasswordStrengthChecker = () => {
  const [password, setPassword] = useState('');
  const [analysis, setAnalysis] = useState(null);

  const analyzePassword = () => {
    let score = 0;
    const feedback = [];
    const requirements = [];

    // Length check (NIST recommends min 8 chars)
    if (password.length >= 8) { score += 20; requirements.push({ met: true, text: 'Minimum 8 characters' }); }
    else { requirements.push({ met: false, text: 'Minimum 8 characters' }); feedback.push('Use at least 8 characters'); }

    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // Complexity checks
    if (/[a-z]/.test(password)) { score += 15; requirements.push({ met: true, text: 'Lowercase letters' }); }
    else { requirements.push({ met: false, text: 'Lowercase letters' }); feedback.push('Add lowercase letters'); }

    if (/[A-Z]/.test(password)) { score += 15; requirements.push({ met: true, text: 'Uppercase letters' }); }
    else { requirements.push({ met: false, text: 'Uppercase letters' }); feedback.push('Add uppercase letters'); }

    if (/[0-9]/.test(password)) { score += 15; requirements.push({ met: true, text: 'Numbers' }); }
    else { requirements.push({ met: false, text: 'Numbers' }); feedback.push('Add numbers'); }

    if (/[^A-Za-z0-9]/.test(password)) { score += 15; requirements.push({ met: true, text: 'Special characters' }); }
    else { requirements.push({ met: false, text: 'Special characters' }); feedback.push('Add special characters'); }

    // Common patterns check
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein', 'welcome'];
    const hasCommonPattern = commonPasswords.some(p => password.toLowerCase().includes(p));
    if (hasCommonPattern) {
      score -= 30;
      feedback.push('⚠️ Contains common password pattern');
    }

    // Entropy check
    const uniqueChars = new Set(password).size;
    if (uniqueChars < password.length * 0.6) {
      feedback.push('More variety in characters recommended');
    }

    score = Math.max(0, Math.min(100, score));

    let strength = 'Weak';
    let color = '#e74c3c';
    if (score >= 80) { strength = 'Strong'; color = '#2ecc71'; }
    else if (score >= 60) { strength = 'Good'; color = '#f39c12'; }
    else if (score >= 40) { strength = 'Fair'; color = '#e67e22'; }

    setAnalysis({ score, strength, color, feedback, requirements });
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>🔐 Password Strength Checker</h1>
        <p>Analyze password strength (NIST SP 800-63B compliance)</p>
      </div>

      <div className="tool-card">
        <div className="info-message">
          <strong>📋 Standards:</strong> Based on NIST SP 800-63B and OWASP guidelines
        </div>

        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); analyzePassword(); }}
            placeholder="Enter password to test"
          />
        </div>

        {analysis && (
          <>
            <div className="result-box" style={{ background: '#f8f9fa', marginTop: '20px' }}>
              <h3>Password Strength</h3>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: analysis.color, textAlign: 'center', margin: '20px 0' }}>
                {analysis.score}/100
              </div>
              <div style={{ textAlign: 'center', fontSize: '24px', color: analysis.color }}>
                {analysis.strength}
              </div>
              <div style={{ background: '#e0e0e0', height: '20px', borderRadius: '10px', marginTop: '20px', overflow: 'hidden' }}>
                <div style={{ width: `${analysis.score}%`, height: '100%', background: analysis.color, transition: 'width 0.3s' }}></div>
              </div>
            </div>

            <div className="result-box" style={{ marginTop: '20px' }}>
              <h4>Requirements Checklist</h4>
              {analysis.requirements.map((req, idx) => (
                <div key={idx} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  {req.met ? '✅' : '❌'} {req.text}
                </div>
              ))}
            </div>

            {analysis.feedback.length > 0 && (
              <div className="result-box" style={{ marginTop: '20px', background: '#fff3cd' }}>
                <h4>💡 Recommendations</h4>
                {analysis.feedback.map((fb, idx) => (
                  <div key={idx}>• {fb}</div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PasswordStrengthChecker;
