import { useState } from 'react';
import '../ToolLayout.css';

const PromptTemplateBuilder = () => {
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant.');
  const [variables, setVariables] = useState([{ name: 'task', value: 'example task' }]);
  const [template, setTemplate] = useState('Please help me with: {task}');
  const [finalPrompt, setFinalPrompt] = useState('');

  const addVariable = () => {
    setVariables([...variables, { name: `var${variables.length + 1}`, value: '' }]);
  };

  const updateVariable = (index, field, value) => {
    const newVars = [...variables];
    newVars[index][field] = value;
    setVariables(newVars);
  };

  const removeVariable = (index) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const generatePrompt = () => {
    let result = template;
    variables.forEach(v => {
      result = result.replace(new RegExp(`\\{${v.name}\\}`, 'g'), v.value);
    });
    setFinalPrompt(result);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const templates = {
    analysis: 'Analyze the following {input_type}: {input}\n\nFocus on: {focus_areas}\n\nProvide insights on: {insights}',
    coding: 'Write {language} code that {task}.\n\nRequirements:\n{requirements}\n\nReturn only the code without explanation.',
    summary: 'Summarize the following {content_type} in {length} sentences:\n\n{content}',
    creative: 'Create a {output_type} about {topic} in the style of {style}. Include: {elements}',
    data: 'Given this data: {data}\n\nPerform the following analysis: {analysis_type}\n\nFormat output as: {output_format}'
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>📝 Prompt Template Builder</h1>
        <p>Create reusable prompt templates with variables</p>
      </div>

      <div className="tool-card">
        <div className="info-message">
          <strong>💡 Tip:</strong> Use {'{'} and {'}'} to define variables in your template (e.g., {'{'}variable{'}'})
        </div>

        <div className="input-group">
          <label>Quick Templates</label>
          <select onChange={(e) => e.target.value && setTemplate(templates[e.target.value])} defaultValue="">
            <option value="">Select a template...</option>
            <option value="analysis">Analysis Template</option>
            <option value="coding">Coding Template</option>
            <option value="summary">Summary Template</option>
            <option value="creative">Creative Writing</option>
            <option value="data">Data Analysis</option>
          </select>
        </div>

        <div className="input-group">
          <label>System Prompt</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Define the AI's role and behavior..."
            style={{ minHeight: '80px' }}
          />
        </div>

        <div className="input-group">
          <label>Prompt Template</label>
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            placeholder="Your prompt with {variables} in curly braces..."
            style={{ minHeight: '120px' }}
          />
        </div>

        <div className="result-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h4>Variables</h4>
            <button className="btn btn-success" onClick={addVariable}>+ Add Variable</button>
          </div>
          {variables.map((v, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '10px', marginBottom: '10px' }}>
              <input
                type="text"
                value={v.name}
                onChange={(e) => updateVariable(idx, 'name', e.target.value)}
                placeholder="Variable name"
                style={{ padding: '8px' }}
              />
              <input
                type="text"
                value={v.value}
                onChange={(e) => updateVariable(idx, 'value', e.target.value)}
                placeholder="Value"
                style={{ padding: '8px' }}
              />
              <button className="btn btn-secondary" onClick={() => removeVariable(idx)}>✕</button>
            </div>
          ))}
        </div>

        <button className="btn btn-primary" onClick={generatePrompt}>Generate Prompt</button>

        {finalPrompt && (
          <>
            <div className="result-box" style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4>Final Prompt</h4>
                <button className="btn btn-success" onClick={() => copyToClipboard(finalPrompt)}>Copy</button>
              </div>
              <div style={{ background: 'white', padding: '15px', borderRadius: '5px', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '14px' }}>
                <strong>System:</strong> {systemPrompt}
                <br /><br />
                <strong>User:</strong> {finalPrompt}
              </div>
            </div>

            <div className="result-box">
              <h4>Token Estimate</h4>
              <div>~{Math.ceil((systemPrompt.length + finalPrompt.length) / 4)} tokens</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PromptTemplateBuilder;
