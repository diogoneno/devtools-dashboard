import { useState } from 'react';
import '../ToolLayout.css';

const FewShotManager = () => {
  const [examples, setExamples] = useState([{ input: '', output: '' }]);
  const [taskDescription, setTaskDescription] = useState('');
  const [fullPrompt, setFullPrompt] = useState('');

  const addExample = () => {
    setExamples([...examples, { input: '', output: '' }]);
  };

  const updateExample = (index, field, value) => {
    const newExamples = [...examples];
    newExamples[index][field] = value;
    setExamples(newExamples);
  };

  const removeExample = (index) => {
    if (examples.length > 1) {
      setExamples(examples.filter((_, i) => i !== index));
    }
  };

  const generatePrompt = () => {
    let prompt = taskDescription ? `${taskDescription}\n\n` : '';
    prompt += 'Examples:\n\n';

    examples.forEach((ex, idx) => {
      if (ex.input || ex.output) {
        prompt += `Example ${idx + 1}:\n`;
        prompt += `Input: ${ex.input}\n`;
        prompt += `Output: ${ex.output}\n\n`;
      }
    });

    prompt += 'Now, please process the following:\nInput: {your_input_here}';
    setFullPrompt(prompt);
  };

  const loadTemplate = (type) => {
    const templates = {
      classification: {
        task: 'Classify the sentiment of the text as positive, negative, or neutral.',
        examples: [
          { input: 'This product is amazing!', output: 'positive' },
          { input: 'Terrible experience, would not recommend.', output: 'negative' },
          { input: 'The item arrived on time.', output: 'neutral' }
        ]
      },
      extraction: {
        task: 'Extract the key information from the text in JSON format.',
        examples: [
          { input: 'John Doe, age 30, lives in New York', output: '{"name": "John Doe", "age": 30, "location": "New York"}' },
          { input: 'Sarah Smith, 25 years old, from London', output: '{"name": "Sarah Smith", "age": 25, "location": "London"}' }
        ]
      },
      translation: {
        task: 'Translate the following text to Spanish.',
        examples: [
          { input: 'Hello, how are you?', output: 'Hola, ¿cómo estás?' },
          { input: 'Good morning', output: 'Buenos días' }
        ]
      }
    };

    if (templates[type]) {
      setTaskDescription(templates[type].task);
      setExamples(templates[type].examples);
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>📚 Few-Shot Example Manager</h1>
        <p>Build few-shot prompts with examples for better LLM performance</p>
      </div>

      <div className="tool-card">
        <div className="info-message">
          <strong>💡 Tip:</strong> 3-5 diverse examples typically work best for few-shot learning
        </div>

        <div className="input-group">
          <label>Quick Templates</label>
          <select onChange={(e) => e.target.value && loadTemplate(e.target.value)} defaultValue="">
            <option value="">Custom...</option>
            <option value="classification">Sentiment Classification</option>
            <option value="extraction">Information Extraction</option>
            <option value="translation">Translation</option>
          </select>
        </div>

        <div className="input-group">
          <label>Task Description</label>
          <textarea
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="Describe what you want the model to do..."
            style={{ minHeight: '80px' }}
          />
        </div>

        <div className="result-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <h4>Few-Shot Examples</h4>
            <button className="btn btn-success" onClick={addExample}>+ Add Example</button>
          </div>

          {examples.map((ex, idx) => (
            <div key={idx} style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <strong>Example {idx + 1}</strong>
                {examples.length > 1 && (
                  <button className="btn btn-secondary" onClick={() => removeExample(idx)}>✕</button>
                )}
              </div>
              <div className="input-group">
                <label>Input</label>
                <textarea
                  value={ex.input}
                  onChange={(e) => updateExample(idx, 'input', e.target.value)}
                  placeholder="Example input..."
                  style={{ minHeight: '60px' }}
                />
              </div>
              <div className="input-group">
                <label>Output</label>
                <textarea
                  value={ex.output}
                  onChange={(e) => updateExample(idx, 'output', e.target.value)}
                  placeholder="Expected output..."
                  style={{ minHeight: '60px' }}
                />
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-primary" onClick={generatePrompt}>Generate Few-Shot Prompt</button>

        {fullPrompt && (
          <>
            <div className="result-box" style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h4>Generated Prompt</h4>
                <button className="btn btn-success" onClick={() => navigator.clipboard.writeText(fullPrompt)}>Copy</button>
              </div>
              <pre style={{ background: 'white', padding: '15px', borderRadius: '5px', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '14px' }}>
                {fullPrompt}
              </pre>
            </div>

            <div className="result-box">
              <h4>Statistics</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div><strong>Examples:</strong> {examples.length}</div>
                <div><strong>Token Estimate:</strong> ~{Math.ceil(fullPrompt.length / 4)}</div>
                <div><strong>Characters:</strong> {fullPrompt.length}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FewShotManager;
