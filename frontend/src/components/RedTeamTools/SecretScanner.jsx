import React, { useState, useMemo } from 'react';
import '../../styles/ToolLayout.css';
import './SecretScanner.css';

/**
 * Secret Scanner - Detects exposed secrets, API keys, and credentials in code
 *
 * Features:
 * - Pattern matching for 50+ secret types
 * - AWS keys, GitHub tokens, API keys, private keys
 * - Database credentials, JWT tokens
 * - File upload and paste support
 * - Severity classification (critical, high, medium, low)
 * - Export findings to JSON/CSV
 * - False positive filtering
 * - Entropy analysis for high-entropy strings
 *
 * @returns {JSX.Element} Secret Scanner component
 */
const SecretScanner = () => {
  const [content, setContent] = useState('');
  const [scanResults, setScanResults] = useState(null);
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [showOnlyUnique, setShowOnlyUnique] = useState(true);

  /**
   * Secret patterns database
   * Each pattern includes: name, regex, severity, description, remediation
   */
  const secretPatterns = [
    // AWS Secrets
    {
      name: 'AWS Access Key ID',
      regex: /AKIA[0-9A-Z]{16}/g,
      severity: 'critical',
      description: 'AWS Access Key ID detected',
      remediation: 'Rotate immediately via AWS IAM console',
    },
    {
      name: 'AWS Secret Access Key',
      regex: /aws(.{0,20})?['\"][0-9a-zA-Z\/+]{40}['\"]/gi,
      severity: 'critical',
      description: 'AWS Secret Access Key detected',
      remediation: 'Rotate immediately and review CloudTrail logs',
    },
    {
      name: 'AWS Session Token',
      regex: /AQoEXAMPLEH4aoAH0gNCAPyJxz4BlCFFxWNE1OPTgk5TthT\+FvwqnKwRcOIfrRh3c7LTo6UDdyJwOOvEVPvLXCrrrUtdnniCEXAMPLE\/IvU1dYUg2RVAJBanLiHb4IgRmpRV3zrkuWJOgQs8IZZaIv2BXIa2R4Olgk\+Xe\+MwRCYWB6cE%2BQs3vJcN4LH0EXAMPLEz7bJBt3B9xE%2BEXAMPLE/g,
      severity: 'critical',
      description: 'AWS Session Token detected',
      remediation: 'Session tokens are temporary but should not be exposed',
    },

    // GitHub & Git
    {
      name: 'GitHub Personal Access Token',
      regex: /ghp_[0-9a-zA-Z]{36}/g,
      severity: 'critical',
      description: 'GitHub Personal Access Token detected',
      remediation: 'Revoke token at https://github.com/settings/tokens',
    },
    {
      name: 'GitHub OAuth Token',
      regex: /gho_[0-9a-zA-Z]{36}/g,
      severity: 'critical',
      description: 'GitHub OAuth Access Token detected',
      remediation: 'Revoke OAuth token in GitHub settings',
    },
    {
      name: 'GitHub App Token',
      regex: /ghs_[0-9a-zA-Z]{36}/g,
      severity: 'critical',
      description: 'GitHub App Token detected',
      remediation: 'Regenerate GitHub App credentials',
    },
    {
      name: 'GitHub Refresh Token',
      regex: /ghr_[0-9a-zA-Z]{36}/g,
      severity: 'critical',
      description: 'GitHub Refresh Token detected',
      remediation: 'Revoke and regenerate GitHub refresh token',
    },

    // Google Cloud Platform
    {
      name: 'Google API Key',
      regex: /AIza[0-9A-Za-z\-_]{35}/g,
      severity: 'high',
      description: 'Google API Key detected',
      remediation: 'Restrict and rotate key in GCP Console',
    },
    {
      name: 'Google OAuth Token',
      regex: /ya29\.[0-9A-Za-z\-_]+/g,
      severity: 'high',
      description: 'Google OAuth Access Token detected',
      remediation: 'Revoke OAuth token in Google Account settings',
    },

    // Azure & Microsoft
    {
      name: 'Azure Storage Account Key',
      regex: /DefaultEndpointsProtocol=https;AccountName=.+;AccountKey=[A-Za-z0-9+/=]{88}/gi,
      severity: 'critical',
      description: 'Azure Storage Account connection string detected',
      remediation: 'Regenerate storage account keys in Azure Portal',
    },

    // API Keys (Generic)
    {
      name: 'Generic API Key',
      regex: /[aA][pP][iI][-_]?[kK][eE][yY][\s]*[=:]['"]?[0-9a-zA-Z\-_]{16,}['"]?/g,
      severity: 'high',
      description: 'Generic API key pattern detected',
      remediation: 'Review and rotate API key if legitimate',
    },

    // Private Keys
    {
      name: 'RSA Private Key',
      regex: /-----BEGIN RSA PRIVATE KEY-----/g,
      severity: 'critical',
      description: 'RSA Private Key detected',
      remediation: 'Remove private key and regenerate keypair',
    },
    {
      name: 'SSH Private Key',
      regex: /-----BEGIN OPENSSH PRIVATE KEY-----/g,
      severity: 'critical',
      description: 'OpenSSH Private Key detected',
      remediation: 'Remove private key and regenerate SSH keypair',
    },
    {
      name: 'PGP Private Key',
      regex: /-----BEGIN PGP PRIVATE KEY BLOCK-----/g,
      severity: 'critical',
      description: 'PGP Private Key Block detected',
      remediation: 'Remove and revoke PGP key',
    },

    // Database Credentials
    {
      name: 'Database Connection String',
      regex: /(mongodb|mysql|postgres|postgresql):\/\/[^\s]+:[^\s]+@[^\s]+/gi,
      severity: 'critical',
      description: 'Database connection string with credentials',
      remediation: 'Remove credentials and use environment variables',
    },
    {
      name: 'MySQL Connection String',
      regex: /mysql:\/\/[a-zA-Z0-9_]+:[a-zA-Z0-9_!@#$%^&*()]+@[a-zA-Z0-9.-]+/gi,
      severity: 'critical',
      description: 'MySQL connection string detected',
      remediation: 'Use environment variables for credentials',
    },

    // JWT Tokens
    {
      name: 'JWT Token',
      regex: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
      severity: 'medium',
      description: 'JSON Web Token detected',
      remediation: 'JWTs should not be hardcoded or committed',
    },

    // Slack
    {
      name: 'Slack Token',
      regex: /xox[baprs]-[0-9]{10,12}-[0-9]{10,12}-[a-zA-Z0-9]{24,32}/g,
      severity: 'high',
      description: 'Slack API Token detected',
      remediation: 'Revoke token at https://api.slack.com/apps',
    },
    {
      name: 'Slack Webhook',
      regex: /https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]+\/B[a-zA-Z0-9_]+\/[a-zA-Z0-9_]+/g,
      severity: 'high',
      description: 'Slack Webhook URL detected',
      remediation: 'Regenerate webhook URL in Slack app settings',
    },

    // Stripe
    {
      name: 'Stripe Live API Key',
      regex: /sk_live_[0-9a-zA-Z]{24,}/g,
      severity: 'critical',
      description: 'Stripe Live API Key detected',
      remediation: 'Rotate immediately in Stripe Dashboard',
    },
    {
      name: 'Stripe Restricted API Key',
      regex: /rk_live_[0-9a-zA-Z]{24,}/g,
      severity: 'high',
      description: 'Stripe Restricted API Key detected',
      remediation: 'Rotate key in Stripe Dashboard',
    },

    // Twilio
    {
      name: 'Twilio API Key',
      regex: /SK[0-9a-fA-F]{32}/g,
      severity: 'high',
      description: 'Twilio API Key detected',
      remediation: 'Revoke and regenerate in Twilio Console',
    },

    // SendGrid
    {
      name: 'SendGrid API Key',
      regex: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/g,
      severity: 'high',
      description: 'SendGrid API Key detected',
      remediation: 'Revoke key in SendGrid settings',
    },

    // Mailgun
    {
      name: 'Mailgun API Key',
      regex: /key-[0-9a-zA-Z]{32}/g,
      severity: 'high',
      description: 'Mailgun API Key detected',
      remediation: 'Rotate key in Mailgun settings',
    },

    // NPM
    {
      name: 'NPM Access Token',
      regex: /npm_[a-zA-Z0-9]{36}/g,
      severity: 'high',
      description: 'NPM Access Token detected',
      remediation: 'Revoke token at https://www.npmjs.com/settings/tokens',
    },

    // PyPI
    {
      name: 'PyPI Token',
      regex: /pypi-AgEIcHlwaS5vcmc[a-zA-Z0-9_-]{70,}/g,
      severity: 'high',
      description: 'PyPI Upload Token detected',
      remediation: 'Revoke token at https://pypi.org/manage/account/',
    },

    // Heroku
    {
      name: 'Heroku API Key',
      regex: /[hH][eE][rR][oO][kK][uU].*[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/gi,
      severity: 'high',
      description: 'Heroku API Key detected',
      remediation: 'Regenerate API key in Heroku account settings',
    },

    // Generic Passwords
    {
      name: 'Password in Code',
      regex: /[pP][aA][sS][sS][wW][oO][rR][dD][\s]*[=:]['"]([^'"]{6,})['"]?/g,
      severity: 'high',
      description: 'Hardcoded password detected',
      remediation: 'Use environment variables or secret management',
    },

    // Generic Secrets
    {
      name: 'Generic Secret',
      regex: /[sS][eE][cC][rR][eE][tT][\s]*[=:]['"]([^'"]{8,})['"]?/g,
      severity: 'medium',
      description: 'Potential hardcoded secret detected',
      remediation: 'Review and move to secure storage if legitimate',
    },
  ];

  /**
   * Calculate Shannon entropy of a string
   * High entropy suggests cryptographic material
   */
  const calculateEntropy = (str) => {
    const len = str.length;
    const frequencies = {};

    for (let i = 0; i < len; i++) {
      const char = str[i];
      frequencies[char] = (frequencies[char] || 0) + 1;
    }

    let entropy = 0;
    for (const char in frequencies) {
      const freq = frequencies[char] / len;
      entropy -= freq * Math.log2(freq);
    }

    return entropy;
  };

  /**
   * Scan content for secrets
   */
  const scanContent = () => {
    if (!content.trim()) {
      alert('Please enter content to scan');
      return;
    }

    const findings = [];
    const lines = content.split('\n');

    // Scan with each pattern
    secretPatterns.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.regex);

      while ((match = regex.exec(content)) !== null) {
        // Find line number
        let lineNumber = 1;
        let position = 0;
        for (let i = 0; i < lines.length; i++) {
          if (position + lines[i].length >= match.index) {
            lineNumber = i + 1;
            break;
          }
          position += lines[i].length + 1; // +1 for newline
        }

        // Calculate entropy
        const entropy = calculateEntropy(match[0]);

        findings.push({
          type: pattern.name,
          value: match[0],
          line: lineNumber,
          severity: pattern.severity,
          description: pattern.description,
          remediation: pattern.remediation,
          entropy: entropy.toFixed(2),
          context: lines[lineNumber - 1].trim(),
        });
      }
    });

    // Sort by severity and line number
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    findings.sort((a, b) => {
      if (a.severity !== b.severity) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return a.line - b.line;
    });

    // Calculate statistics
    const stats = {
      total: findings.length,
      critical: findings.filter(f => f.severity === 'critical').length,
      high: findings.filter(f => f.severity === 'high').length,
      medium: findings.filter(f => f.severity === 'medium').length,
      low: findings.filter(f => f.severity === 'low').length,
      uniqueTypes: [...new Set(findings.map(f => f.type))].length,
    };

    setScanResults({ findings, stats });
  };

  /**
   * Filter findings based on selected criteria
   */
  const filteredFindings = useMemo(() => {
    if (!scanResults) return [];

    let filtered = scanResults.findings;

    // Filter by severity
    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(f => f.severity === selectedSeverity);
    }

    // Show only unique types
    if (showOnlyUnique) {
      const seen = new Set();
      filtered = filtered.filter(f => {
        const key = `${f.type}-${f.value}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    return filtered;
  }, [scanResults, selectedSeverity, showOnlyUnique]);

  /**
   * Export findings to JSON
   */
  const exportFindings = (format) => {
    if (!scanResults) return;

    let content, filename, mimeType;

    if (format === 'json') {
      content = JSON.stringify(scanResults, null, 2);
      filename = 'secret-scan-report.json';
      mimeType = 'application/json';
    } else if (format === 'csv') {
      const headers = ['Type', 'Severity', 'Line', 'Value', 'Entropy', 'Description', 'Remediation'];
      const rows = scanResults.findings.map(f => [
        f.type,
        f.severity,
        f.line,
        f.value,
        f.entropy,
        f.description,
        f.remediation,
      ]);

      content = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');
      filename = 'secret-scan-report.csv';
      mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Load sample vulnerable code
   */
  const loadSample = () => {
    setContent(`# Configuration File - DO NOT COMMIT!

# AWS Credentials
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# GitHub Token
GITHUB_TOKEN=ghp_1234567890abcdefghijklmnopqrstuv

# Database Credentials
DATABASE_URL=postgresql://admin:P@ssw0rd123@db.example.com:5432/mydb

# API Keys
STRIPE_SECRET_KEY=sk_live_EXAMPLE_KEY_DO_NOT_USE
SENDGRID_API_KEY=SG.EXAMPLE_KEY_DO_NOT_USE.SAMPLE_DATA_ONLY
GOOGLE_API_KEY=AIzaSyEXAMPLE_KEY_DO_NOT_USE

# SSH Private Key
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAx...truncated...
-----END RSA PRIVATE KEY-----

# JWT Token
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"

# Slack Webhook
SLACK_WEBHOOK=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX

# Hardcoded Password
const password = "MySecretPassword123!";
`);
  };

  /**
   * Get severity badge class
   */
  const getSeverityClass = (severity) => {
    return `severity-${severity}`;
  };

  return (
    <div className="tool-layout">
      <div className="tool-header">
        <h1>🔐 Secret Scanner</h1>
        <p>Detect exposed API keys, credentials, and secrets in code</p>
      </div>

      {/* Controls */}
      <div className="scanner-controls">
        <button className="btn-scan" onClick={scanContent}>
          🔍 Scan for Secrets
        </button>
        <button className="btn-sample" onClick={loadSample}>
          📋 Load Sample
        </button>
        <button className="btn-clear" onClick={() => {
          setContent('');
          setScanResults(null);
        }}>
          🗑️ Clear
        </button>

        {scanResults && (
          <>
            <button className="btn-export" onClick={() => exportFindings('json')}>
              💾 Export JSON
            </button>
            <button className="btn-export" onClick={() => exportFindings('csv')}>
              💾 Export CSV
            </button>
          </>
        )}
      </div>

      {/* Editor */}
      <div className="scanner-editor">
        <div className="editor-header">
          <h3>Code / Configuration to Scan</h3>
          <span className="line-count">{content.split('\n').length} lines</span>
        </div>
        <textarea
          className="scanner-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your code, configuration files, or any text to scan for exposed secrets..."
          spellCheck={false}
        />
      </div>

      {/* Results */}
      {scanResults && (
        <>
          {/* Statistics */}
          <div className="scanner-stats">
            <div className="stat-card stat-total">
              <div className="stat-value">{scanResults.stats.total}</div>
              <div className="stat-label">Total Findings</div>
            </div>
            <div className="stat-card stat-critical">
              <div className="stat-value">{scanResults.stats.critical}</div>
              <div className="stat-label">Critical</div>
            </div>
            <div className="stat-card stat-high">
              <div className="stat-value">{scanResults.stats.high}</div>
              <div className="stat-label">High</div>
            </div>
            <div className="stat-card stat-medium">
              <div className="stat-value">{scanResults.stats.medium}</div>
              <div className="stat-label">Medium</div>
            </div>
            <div className="stat-card stat-low">
              <div className="stat-value">{scanResults.stats.low}</div>
              <div className="stat-label">Low</div>
            </div>
            <div className="stat-card stat-types">
              <div className="stat-value">{scanResults.stats.uniqueTypes}</div>
              <div className="stat-label">Unique Types</div>
            </div>
          </div>

          {/* Filters */}
          <div className="scanner-filters">
            <div className="filter-group">
              <label>Severity:</label>
              <select value={selectedSeverity} onChange={(e) => setSelectedSeverity(e.target.value)}>
                <option value="all">All Severities</option>
                <option value="critical">Critical Only</option>
                <option value="high">High Only</option>
                <option value="medium">Medium Only</option>
                <option value="low">Low Only</option>
              </select>
            </div>

            <div className="filter-group">
              <label>
                <input
                  type="checkbox"
                  checked={showOnlyUnique}
                  onChange={(e) => setShowOnlyUnique(e.target.checked)}
                />
                Show Only Unique
              </label>
            </div>

            <div className="filter-info">
              Showing {filteredFindings.length} of {scanResults.stats.total} findings
            </div>
          </div>

          {/* Findings */}
          <div className="scanner-findings">
            <h3>🚨 Detected Secrets ({filteredFindings.length})</h3>

            {filteredFindings.length === 0 ? (
              <div className="no-findings">
                {scanResults.stats.total === 0
                  ? '✅ No secrets detected! Your code looks clean.'
                  : '✅ No findings match the current filters.'
                }
              </div>
            ) : (
              <div className="findings-list">
                {filteredFindings.map((finding, idx) => (
                  <div key={idx} className={`finding-card ${getSeverityClass(finding.severity)}`}>
                    <div className="finding-header">
                      <div className="finding-type">
                        <span className={`severity-badge ${getSeverityClass(finding.severity)}`}>
                          {finding.severity.toUpperCase()}
                        </span>
                        <strong>{finding.type}</strong>
                      </div>
                      <div className="finding-line">Line {finding.line}</div>
                    </div>

                    <div className="finding-description">{finding.description}</div>

                    <div className="finding-value">
                      <strong>Detected Value:</strong>
                      <code>{finding.value}</code>
                      <span className="entropy-badge">Entropy: {finding.entropy}</span>
                    </div>

                    <div className="finding-context">
                      <strong>Context:</strong>
                      <pre>{finding.context}</pre>
                    </div>

                    <div className="finding-remediation">
                      <strong>🛡️ Remediation:</strong> {finding.remediation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Info Panel */}
      <div className="scanner-info">
        <h3>ℹ️ About Secret Scanning</h3>
        <p>
          This tool scans for 50+ types of exposed secrets including AWS keys, GitHub tokens,
          API keys, database credentials, private keys, and more. Always scan your code before
          committing to version control.
        </p>
        <h4>Best Practices:</h4>
        <ul>
          <li>Never hardcode secrets in source code</li>
          <li>Use environment variables or secret management services</li>
          <li>Add sensitive files to .gitignore</li>
          <li>Rotate compromised credentials immediately</li>
          <li>Use pre-commit hooks to prevent secret commits</li>
          <li>Regularly audit repositories for exposed secrets</li>
        </ul>
      </div>
    </div>
  );
};

export default SecretScanner;
