import { useState, useEffect } from 'react';
import '../ToolLayout.css';

const TokenCounter = () => {
  const [text, setText] = useState('');
  const [stats, setStats] = useState(null);

  // Approximate GPT tokenization (simple estimation)
  const estimateTokens = (text) => {
    // GPT models use ~4 chars per token on average
    const words = text.trim().split(/\s+/).length;
    const chars = text.length;
    const gpt4Tokens = Math.ceil(chars / 4);
    const gpt3Tokens = Math.ceil(chars / 4);
    const claudeTokens = Math.ceil(chars / 3.8); // Claude is slightly more efficient

    return {
      gpt4Tokens,
      gpt3Tokens,
      claudeTokens,
      words,
      chars
    };
  };

  const calculateCosts = (tokens) => {
    return {
      gpt4: {
        input: (tokens.gpt4Tokens / 1000000) * 5.00, // $5 per 1M input tokens
        output: (tokens.gpt4Tokens / 1000000) * 15.00 // $15 per 1M output tokens
      },
      gpt3_5: {
        input: (tokens.gpt3Tokens / 1000000) * 0.50,
        output: (tokens.gpt3Tokens / 1000000) * 1.50
      },
      claude: {
        input: (tokens.claudeTokens / 1000000) * 3.00,
        output: (tokens.claudeTokens / 1000000) * 15.00
      }
    };
  };

  useEffect(() => {
    if (text) {
      const tokenStats = estimateTokens(text);
      const costs = calculateCosts(tokenStats);
      setStats({ ...tokenStats, costs });
    } else {
      setStats(null);
    }
  }, [text]);

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>🔢 Token Counter</h1>
        <p>Count tokens for GPT, Claude, and estimate API costs</p>
      </div>

      <div className="tool-card">
        <div className="info-message">
          <strong>💡 Note:</strong> Token counts are estimates. Actual counts may vary slightly based on tokenizer.
        </div>

        <div className="input-group">
          <label>Input Text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your prompt, document, or text here..."
            style={{ minHeight: '200px' }}
          />
        </div>

        {stats && (
          <>
            <div className="result-box" style={{ background: '#f8f9fa' }}>
              <h3>Token Estimates</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginTop: '15px' }}>
                <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '5px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10a37f' }}>{stats.gpt4Tokens}</div>
                  <div>GPT-4 Tokens</div>
                </div>
                <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '5px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#74aa9c' }}>{stats.gpt3Tokens}</div>
                  <div>GPT-3.5 Tokens</div>
                </div>
                <div style={{ textAlign: 'center', padding: '15px', background: 'white', borderRadius: '5px' }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#cc785c' }}>{stats.claudeTokens}</div>
                  <div>Claude Tokens</div>
                </div>
              </div>
            </div>

            <div className="result-box">
              <h3>Text Statistics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div><strong>Characters:</strong> {stats.chars.toLocaleString()}</div>
                <div><strong>Words:</strong> {stats.words.toLocaleString()}</div>
                <div><strong>Sentences:</strong> {text.split(/[.!?]+/).filter(s => s.trim()).length}</div>
                <div><strong>Paragraphs:</strong> {text.split(/\n\n+/).filter(p => p.trim()).length}</div>
              </div>
            </div>

            <div className="result-box">
              <h3>💰 Estimated API Costs (per request)</h3>
              <div style={{ fontSize: '14px' }}>
                <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '5px', marginBottom: '10px' }}>
                  <strong>GPT-4</strong>
                  <div>Input: ${stats.costs.gpt4.input.toFixed(6)} | Output: ${stats.costs.gpt4.output.toFixed(6)}</div>
                </div>
                <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '5px', marginBottom: '10px' }}>
                  <strong>GPT-3.5 Turbo</strong>
                  <div>Input: ${stats.costs.gpt3_5.input.toFixed(6)} | Output: ${stats.costs.gpt3_5.output.toFixed(6)}</div>
                </div>
                <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '5px' }}>
                  <strong>Claude 3</strong>
                  <div>Input: ${stats.costs.claude.input.toFixed(6)} | Output: ${stats.costs.claude.output.toFixed(6)}</div>
                </div>
              </div>
            </div>

            <div className="result-box">
              <h3>Context Window Usage</h3>
              <div style={{ fontSize: '14px' }}>
                <div><strong>GPT-4 (128K):</strong> {((stats.gpt4Tokens / 128000) * 100).toFixed(2)}%</div>
                <div style={{ background: '#e0e0e0', height: '10px', borderRadius: '5px', marginTop: '5px', marginBottom: '15px' }}>
                  <div style={{ width: `${Math.min((stats.gpt4Tokens / 128000) * 100, 100)}%`, height: '100%', background: '#10a37f', borderRadius: '5px' }}></div>
                </div>

                <div><strong>GPT-3.5 (16K):</strong> {((stats.gpt3Tokens / 16000) * 100).toFixed(2)}%</div>
                <div style={{ background: '#e0e0e0', height: '10px', borderRadius: '5px', marginTop: '5px', marginBottom: '15px' }}>
                  <div style={{ width: `${Math.min((stats.gpt3Tokens / 16000) * 100, 100)}%`, height: '100%', background: '#74aa9c', borderRadius: '5px' }}></div>
                </div>

                <div><strong>Claude (200K):</strong> {((stats.claudeTokens / 200000) * 100).toFixed(2)}%</div>
                <div style={{ background: '#e0e0e0', height: '10px', borderRadius: '5px', marginTop: '5px' }}>
                  <div style={{ width: `${Math.min((stats.claudeTokens / 200000) * 100, 100)}%`, height: '100%', background: '#cc785c', borderRadius: '5px' }}></div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TokenCounter;
