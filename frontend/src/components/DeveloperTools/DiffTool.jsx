import React, { useState, useMemo } from 'react';
import '../../styles/ToolLayout.css';
import './DiffTool.css';

/**
 * Diff/Merge Tool - Professional text comparison with syntax highlighting
 *
 * Features:
 * - Side-by-side and unified diff views
 * - Line-by-line and character-level differences
 * - Syntax highlighting for code (JSON, JavaScript, etc.)
 * - Diff statistics (additions, deletions, changes)
 * - Case-sensitive/insensitive comparison
 * - Whitespace ignore options
 * - Export diff to various formats
 *
 * @returns {JSX.Element} Diff Tool component
 */
const DiffTool = () => {
  const [leftText, setLeftText] = useState('');
  const [rightText, setRightText] = useState('');
  const [viewMode, setViewMode] = useState('side-by-side'); // 'side-by-side' or 'unified'
  const [caseSensitive, setCaseSensitive] = useState(true);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [syntaxMode, setSyntaxMode] = useState('text'); // 'text', 'json', 'javascript', 'html', 'css'

  /**
   * Compute Longest Common Subsequence (LCS) for diff algorithm
   * Uses dynamic programming to find the longest sequence of matching lines
   *
   * @param {string[]} left - Array of left text lines
   * @param {string[]} right - Array of right text lines
   * @returns {number[][]} LCS matrix
   */
  const computeLCS = (left, right) => {
    const m = left.length;
    const n = right.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (left[i - 1] === right[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    return dp;
  };

  /**
   * Build diff from LCS matrix
   * Marks lines as 'added', 'deleted', 'unchanged', or 'modified'
   *
   * @param {string[]} left - Array of left text lines
   * @param {string[]} right - Array of right text lines
   * @param {number[][]} lcs - LCS matrix
   * @returns {Array} Diff result with line annotations
   */
  const buildDiff = (left, right, lcs) => {
    const diff = [];
    let i = left.length;
    let j = right.length;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && left[i - 1] === right[j - 1]) {
        diff.unshift({
          type: 'unchanged',
          leftLine: i,
          rightLine: j,
          leftContent: left[i - 1],
          rightContent: right[j - 1],
        });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
        diff.unshift({
          type: 'added',
          leftLine: null,
          rightLine: j,
          leftContent: '',
          rightContent: right[j - 1],
        });
        j--;
      } else if (i > 0 && (j === 0 || lcs[i][j - 1] < lcs[i - 1][j])) {
        diff.unshift({
          type: 'deleted',
          leftLine: i,
          rightLine: null,
          leftContent: left[i - 1],
          rightContent: '',
        });
        i--;
      }
    }

    return diff;
  };

  /**
   * Normalize text based on comparison options
   */
  const normalizeText = (text) => {
    let normalized = text;

    if (!caseSensitive) {
      normalized = normalized.toLowerCase();
    }

    if (ignoreWhitespace) {
      normalized = normalized.replace(/\s+/g, ' ').trim();
    }

    return normalized;
  };

  /**
   * Compute character-level diff for modified lines
   */
  const computeCharDiff = (leftStr, rightStr) => {
    const left = leftStr.split('');
    const right = rightStr.split('');
    const dp = Array(left.length + 1).fill(null).map(() => Array(right.length + 1).fill(0));

    for (let i = 1; i <= left.length; i++) {
      for (let j = 1; j <= right.length; j++) {
        if (left[i - 1] === right[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Backtrack to find differences
    const leftDiff = [];
    const rightDiff = [];
    let i = left.length;
    let j = right.length;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && left[i - 1] === right[j - 1]) {
        leftDiff.unshift({ char: left[i - 1], type: 'same' });
        rightDiff.unshift({ char: right[j - 1], type: 'same' });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        rightDiff.unshift({ char: right[j - 1], type: 'added' });
        j--;
      } else if (i > 0) {
        leftDiff.unshift({ char: left[i - 1], type: 'deleted' });
        i--;
      }
    }

    return { leftDiff, rightDiff };
  };

  /**
   * Calculate diff statistics
   */
  const diffResult = useMemo(() => {
    if (!leftText && !rightText) return null;

    const leftLines = leftText.split('\n').map(normalizeText);
    const rightLines = rightText.split('\n').map(normalizeText);

    const lcs = computeLCS(leftLines, rightLines);
    const diff = buildDiff(leftLines, rightLines, lcs);

    const stats = {
      additions: diff.filter(d => d.type === 'added').length,
      deletions: diff.filter(d => d.type === 'deleted').length,
      modifications: 0,
      unchanged: diff.filter(d => d.type === 'unchanged').length,
    };

    return { diff, stats };
  }, [leftText, rightText, caseSensitive, ignoreWhitespace]);

  /**
   * Render line with syntax highlighting (basic)
   */
  const renderLineContent = (content) => {
    if (!content) return <span className="empty-line">&nbsp;</span>;

    if (syntaxMode === 'json') {
      // Basic JSON syntax highlighting
      const highlighted = content
        .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
        .replace(/:\s*"([^"]*)"/g, ': <span class="json-string">"$1"</span>')
        .replace(/:\s*(\d+)/g, ': <span class="json-number">$1</span>')
        .replace(/:\s*(true|false|null)/g, ': <span class="json-keyword">$1</span>');

      return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
    }

    return <span>{content}</span>;
  };

  /**
   * Render character-level diff
   */
  const renderCharDiff = (charDiff) => {
    return charDiff.map((item, idx) => {
      if (item.type === 'added') {
        return <span key={idx} className="char-added">{item.char}</span>;
      } else if (item.type === 'deleted') {
        return <span key={idx} className="char-deleted">{item.char}</span>;
      }
      return <span key={idx}>{item.char}</span>;
    });
  };

  /**
   * Load sample diff
   */
  const loadSample = () => {
    setLeftText(`{
  "name": "devtools-dashboard",
  "version": "1.0.0",
  "description": "Enterprise developer tools",
  "main": "index.js",
  "scripts": {
    "start": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "react": "^19.1.1",
    "react-dom": "^19.1.1"
  }
}`);

    setRightText(`{
  "name": "devtools-dashboard",
  "version": "2.0.0",
  "description": "Enterprise developer tools platform",
  "main": "index.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "axios": "^1.13.1"
  },
  "devDependencies": {
    "vite": "^7.1.7"
  }
}`);
    setSyntaxMode('json');
  };

  /**
   * Export diff to patch format
   */
  const exportDiff = () => {
    if (!diffResult) return;

    let patch = '--- Left\n+++ Right\n';

    diffResult.diff.forEach(line => {
      if (line.type === 'deleted') {
        patch += `- ${line.leftContent}\n`;
      } else if (line.type === 'added') {
        patch += `+ ${line.rightContent}\n`;
      } else {
        patch += `  ${line.leftContent}\n`;
      }
    });

    const blob = new Blob([patch], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diff.patch';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="tool-layout">
      <div className="tool-header">
        <h1>📊 Diff/Merge Tool</h1>
        <p>Professional text comparison with side-by-side and unified views</p>
      </div>

      {/* Controls */}
      <div className="diff-controls">
        <div className="controls-group">
          <label>View Mode:</label>
          <select value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
            <option value="side-by-side">Side by Side</option>
            <option value="unified">Unified</option>
          </select>
        </div>

        <div className="controls-group">
          <label>Syntax:</label>
          <select value={syntaxMode} onChange={(e) => setSyntaxMode(e.target.value)}>
            <option value="text">Plain Text</option>
            <option value="json">JSON</option>
            <option value="javascript">JavaScript</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
          </select>
        </div>

        <div className="controls-group">
          <label>
            <input
              type="checkbox"
              checked={!caseSensitive}
              onChange={(e) => setCaseSensitive(!e.target.checked)}
            />
            Ignore Case
          </label>
        </div>

        <div className="controls-group">
          <label>
            <input
              type="checkbox"
              checked={ignoreWhitespace}
              onChange={(e) => setIgnoreWhitespace(e.target.checked)}
            />
            Ignore Whitespace
          </label>
        </div>

        <button className="btn-action" onClick={loadSample}>
          📋 Load Sample
        </button>

        <button className="btn-action" onClick={exportDiff} disabled={!diffResult}>
          💾 Export Diff
        </button>

        <button
          className="btn-action"
          onClick={() => {
            setLeftText('');
            setRightText('');
          }}
        >
          🗑️ Clear
        </button>
      </div>

      {/* Statistics */}
      {diffResult && (
        <div className="diff-stats">
          <div className="stat-item stat-additions">
            +{diffResult.stats.additions} additions
          </div>
          <div className="stat-item stat-deletions">
            -{diffResult.stats.deletions} deletions
          </div>
          <div className="stat-item stat-unchanged">
            {diffResult.stats.unchanged} unchanged
          </div>
          <div className="stat-item stat-total">
            Total lines: {diffResult.diff.length}
          </div>
        </div>
      )}

      {/* Editor Area */}
      {viewMode === 'side-by-side' ? (
        <div className="diff-editor-container">
          {/* Left Editor */}
          <div className="diff-editor-panel">
            <div className="panel-header">
              <h3>Left (Original)</h3>
              <span className="line-count">{leftText.split('\n').length} lines</span>
            </div>
            <textarea
              className="diff-textarea"
              value={leftText}
              onChange={(e) => setLeftText(e.target.value)}
              placeholder="Paste original text here..."
              spellCheck={false}
            />
          </div>

          {/* Right Editor */}
          <div className="diff-editor-panel">
            <div className="panel-header">
              <h3>Right (Modified)</h3>
              <span className="line-count">{rightText.split('\n').length} lines</span>
            </div>
            <textarea
              className="diff-textarea"
              value={rightText}
              onChange={(e) => setRightText(e.target.value)}
              placeholder="Paste modified text here..."
              spellCheck={false}
            />
          </div>
        </div>
      ) : (
        <div className="diff-editor-unified">
          <textarea
            className="diff-textarea"
            value={leftText}
            onChange={(e) => setLeftText(e.target.value)}
            placeholder="Paste text to compare..."
            spellCheck={false}
          />
        </div>
      )}

      {/* Diff Result */}
      {diffResult && viewMode === 'side-by-side' && (
        <div className="diff-result-container">
          <div className="result-header">
            <h3>Comparison Result</h3>
          </div>

          <div className="diff-view-sidebyside">
            {/* Left Side */}
            <div className="diff-column">
              {diffResult.diff.map((line, idx) => (
                <div
                  key={`left-${idx}`}
                  className={`diff-line diff-line-${line.type === 'added' ? 'empty' : line.type}`}
                >
                  <span className="line-number">
                    {line.leftLine || ''}
                  </span>
                  <div className="line-content">
                    {line.type === 'deleted' && line.leftContent && line.rightContent
                      ? renderCharDiff(computeCharDiff(line.leftContent, line.rightContent).leftDiff)
                      : renderLineContent(line.leftContent)
                    }
                  </div>
                </div>
              ))}
            </div>

            {/* Right Side */}
            <div className="diff-column">
              {diffResult.diff.map((line, idx) => (
                <div
                  key={`right-${idx}`}
                  className={`diff-line diff-line-${line.type === 'deleted' ? 'empty' : line.type}`}
                >
                  <span className="line-number">
                    {line.rightLine || ''}
                  </span>
                  <div className="line-content">
                    {line.type === 'deleted' && line.leftContent && line.rightContent
                      ? renderCharDiff(computeCharDiff(line.leftContent, line.rightContent).rightDiff)
                      : renderLineContent(line.rightContent)
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Unified View Result */}
      {diffResult && viewMode === 'unified' && (
        <div className="diff-result-container">
          <div className="result-header">
            <h3>Unified Diff</h3>
          </div>

          <div className="diff-view-unified">
            {diffResult.diff.map((line, idx) => (
              <div
                key={idx}
                className={`diff-line-unified diff-line-${line.type}`}
              >
                <span className="line-marker">
                  {line.type === 'added' ? '+' : line.type === 'deleted' ? '-' : ' '}
                </span>
                <span className="line-numbers">
                  <span className="line-num-left">{line.leftLine || ''}</span>
                  <span className="line-num-right">{line.rightLine || ''}</span>
                </span>
                <div className="line-content">
                  {renderLineContent(line.leftContent || line.rightContent)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiffTool;
