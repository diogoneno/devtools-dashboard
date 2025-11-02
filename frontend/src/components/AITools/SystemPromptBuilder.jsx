import { useState } from 'react';
import '../ToolLayout.css';

const SystemPromptBuilder = () => {
  const [role, setRole] = useState('');
  const [expertise, setExpertise] = useState('');
  const [tone, setTone] = useState([]);
  const [constraints, setConstraints] = useState([]);
  const [outputFormat, setOutputFormat] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');

  const toneOptions = ['professional', 'casual', 'technical', 'friendly', 'concise', 'detailed', 'creative', 'analytical'];
  const constraintOptions = ['no_assumptions', 'cite_sources', 'ask_clarifying_questions', 'step_by_step', 'json_only', 'code_only'];

  const toggleArray = (arr, setArr, value) => {
    if (arr.includes(value)) {
      setArr(arr.filter(v => v !== value));
    } else {
      setArr([...arr, value]);
    }
  };

  const buildPrompt = () => {
    let prompt = '';

    if (role) {
      prompt += `You are a ${role}.`;
    }

    if (expertise) {
      prompt += ` You are an expert in ${expertise}.`;
    }

    if (tone.length > 0) {
      prompt += ` Your responses should be ${tone.join(', ')}.`;
    }

    if (constraints.length > 0) {
      prompt += `\n\nIMPORTANT CONSTRAINTS:\n`;
      constraints.forEach(c => {
        const constraintText = {
          no_assumptions: '- Do not make assumptions. If information is unclear, state that explicitly.',
          cite_sources: '- Cite sources and references when providing information.',
          ask_clarifying_questions: '- Ask clarifying questions before providing solutions.',
          step_by_step: '- Provide step-by-step explanations.',
          json_only: '- Return responses in valid JSON format only.',
          code_only: '- Return only code without explanations unless asked.'
        };
        prompt += `${constraintText[c] || `- ${c}`}\n`;
      });
    }

    if (outputFormat) {
      prompt += `\n\nOUTPUT FORMAT:\n${outputFormat}`;
    }

    if (additionalInstructions) {
      prompt += `\n\nADDITIONAL INSTRUCTIONS:\n${additionalInstructions}`;
    }

    setSystemPrompt(prompt.trim());
  };

  const presets = {
    coder: {
      role: 'Senior Software Engineer',
      expertise: 'full-stack development, clean code, and best practices',
      tone: ['technical', 'concise'],
      constraints: ['step_by_step', 'code_only'],
      outputFormat: 'Provide working code with inline comments',
      additionalInstructions: 'Follow SOLID principles and write production-ready code.'
    },
    analyst: {
      role: 'Data Analyst',
      expertise: 'data analysis, statistics, and visualization',
      tone: ['analytical', 'detailed'],
      constraints: ['cite_sources', 'no_assumptions'],
      outputFormat: 'Structure analysis with: Summary, Findings, Recommendations',
      additionalInstructions: 'Support conclusions with data and statistical evidence.'
    },
    tutor: {
      role: 'Patient Tutor',
      expertise: 'breaking down complex concepts',
      tone: ['friendly', 'detailed'],
      constraints: ['step_by_step', 'ask_clarifying_questions'],
      outputFormat: 'Use examples and analogies',
      additionalInstructions: 'Adapt explanations based on user understanding level.'
    }
  };

  const loadPreset = (preset) => {
    const p = presets[preset];
    setRole(p.role);
    setExpertise(p.expertise);
    setTone(p.tone);
    setConstraints(p.constraints);
    setOutputFormat(p.outputFormat);
    setAdditionalInstructions(p.additionalInstructions);
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>🎯 System Prompt Builder</h1>
        <p>Craft effective system prompts for LLMs</p>
      </div>

      <div className="tool-card">
        <div className="input-group">
          <label>Load Preset</label>
          <select onChange={(e) => e.target.value && loadPreset(e.target.value)} defaultValue="">
            <option value="">Custom...</option>
            <option value="coder">Senior Coder</option>
            <option value="analyst">Data Analyst</option>
            <option value="tutor">Patient Tutor</option>
          </select>
        </div>

        <div className="input-group">
          <label>Role</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g., Expert Python Developer, Technical Writer"
          />
        </div>

        <div className="input-group">
          <label>Expertise</label>
          <input
            type="text"
            value={expertise}
            onChange={(e) => setExpertise(e.target.value)}
            placeholder="e.g., machine learning, web development, data science"
          />
        </div>

        <div className="input-group">
          <label>Tone (select multiple)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
            {toneOptions.map(t => (
              <button
                key={t}
                className={`btn ${tone.includes(t) ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => toggleArray(tone, setTone, t)}
                style={{ padding: '8px 15px' }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="input-group">
          <label>Constraints (select multiple)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
            {constraintOptions.map(c => (
              <button
                key={c}
                className={`btn ${constraints.includes(c) ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => toggleArray(constraints, setConstraints, c)}
                style={{ padding: '8px 15px', fontSize: '12px' }}
              >
                {c.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="input-group">
          <label>Output Format</label>
          <textarea
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value)}
            placeholder="Describe the desired output format..."
            style={{ minHeight: '80px' }}
          />
        </div>

        <div className="input-group">
          <label>Additional Instructions</label>
          <textarea
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
            placeholder="Any other specific instructions..."
            style={{ minHeight: '80px' }}
          />
        </div>

        <button className="btn btn-primary" onClick={buildPrompt}>Build System Prompt</button>

        {systemPrompt && (
          <div className="result-box" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h4>Generated System Prompt</h4>
              <button className="btn btn-success" onClick={() => navigator.clipboard.writeText(systemPrompt)}>Copy</button>
            </div>
            <pre style={{ background: 'white', padding: '15px', borderRadius: '5px', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '14px' }}>
              {systemPrompt}
            </pre>
            <div style={{ marginTop: '10px', fontSize: '14px', color: '#7f8c8d' }}>
              Token estimate: ~{Math.ceil(systemPrompt.length / 4)} tokens
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemPromptBuilder;
