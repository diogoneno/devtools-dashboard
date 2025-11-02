import { useState } from 'react';
import '../ToolLayout.css';

const ModelCostCalculator = () => {
  const [requests, setRequests] = useState(1000);
  const [inputTokens, setInputTokens] = useState(500);
  const [outputTokens, setOutputTokens] = useState(500);
  const [period, setPeriod] = useState('month');

  const models = {
    'gpt-4': { input: 30.00, output: 60.00, context: '8K' },
    'gpt-4-32k': { input: 60.00, output: 120.00, context: '32K' },
    'gpt-4-turbo': { input: 10.00, output: 30.00, context: '128K' },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50, context: '16K' },
    'gpt-3.5-turbo-16k': { input: 3.00, output: 4.00, context: '16K' },
    'claude-3-opus': { input: 15.00, output: 75.00, context: '200K' },
    'claude-3-sonnet': { input: 3.00, output: 15.00, context: '200K' },
    'claude-3-haiku': { input: 0.25, output: 1.25, context: '200K' },
    'claude-2.1': { input: 8.00, output: 24.00, context: '200K' },
    'gemini-pro': { input: 0.50, output: 1.50, context: '32K' },
    'gemini-ultra': { input: 0.50, output: 1.50, context: '32K' },
    'llama-2-70b': { input: 0.70, output: 0.90, context: '4K' },
    'mixtral-8x7b': { input: 0.60, output: 0.60, context: '32K' }
  };

  const calculateCost = (model) => {
    const pricing = models[model];
    const inputCost = (inputTokens * requests * pricing.input) / 1000000;
    const outputCost = (outputTokens * requests * pricing.output) / 1000000;
    const total = inputCost + outputCost;

    const multiplier = period === 'year' ? 12 : period === 'day' ? 0.033 : 1;
    return {
      inputCost: inputCost * multiplier,
      outputCost: outputCost * multiplier,
      total: total * multiplier,
      context: pricing.context
    };
  };

  const periodMultiplier = period === 'year' ? 12 : period === 'day' ? 0.033 : 1;
  const totalRequests = requests * periodMultiplier;

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>💰 Model Cost Calculator</h1>
        <p>Calculate and compare LLM API costs across providers</p>
      </div>

      <div className="tool-card">
        <div className="input-group">
          <label>Requests per Month: {requests.toLocaleString()}</label>
          <input
            type="range"
            min="100"
            max="1000000"
            step="100"
            value={requests}
            onChange={(e) => setRequests(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div className="grid-2">
          <div className="input-group">
            <label>Avg Input Tokens: {inputTokens}</label>
            <input
              type="range"
              min="10"
              max="10000"
              step="10"
              value={inputTokens}
              onChange={(e) => setInputTokens(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div className="input-group">
            <label>Avg Output Tokens: {outputTokens}</label>
            <input
              type="range"
              min="10"
              max="10000"
              step="10"
              value={outputTokens}
              onChange={(e) => setOutputTokens(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div className="input-group">
          <label>Time Period</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="day">Per Day</option>
            <option value="month">Per Month</option>
            <option value="year">Per Year</option>
          </select>
        </div>

        <div className="info-message">
          <strong>Total Requests:</strong> {totalRequests.toLocaleString()} per {period}
        </div>

        <div className="result-box">
          <h3>Cost Comparison</h3>
          <div style={{ maxHeight: '500px', overflow: 'auto' }}>
            {Object.entries(models)
              .map(([name, _]) => ({ name, ...calculateCost(name) }))
              .sort((a, b) => a.total - b.total)
              .map((model, idx) => (
                <div key={model.name} style={{
                  padding: '15px',
                  background: idx % 2 === 0 ? '#f8f9fa' : 'white',
                  borderRadius: '5px',
                  marginBottom: '10px',
                  border: idx === 0 ? '2px solid #2ecc71' : '1px solid #dee2e6'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <strong>{model.name}</strong>
                      {idx === 0 && <span style={{ marginLeft: '10px', padding: '3px 8px', background: '#2ecc71', color: 'white', borderRadius: '3px', fontSize: '12px' }}>CHEAPEST</span>}
                      <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Context: {model.context}</div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>
                      ${model.total.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
                    Input: ${model.inputCost.toFixed(4)} | Output: ${model.outputCost.toFixed(4)}
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="result-box">
          <h4>Cost Breakdown (per {period})</h4>
          <div style={{ fontSize: '14px' }}>
            <div>Input: {(inputTokens * totalRequests).toLocaleString()} tokens</div>
            <div>Output: {(outputTokens * totalRequests).toLocaleString()} tokens</div>
            <div style={{ marginTop: '10px', fontWeight: 'bold' }}>
              Total Tokens: {((inputTokens + outputTokens) * totalRequests).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelCostCalculator;
