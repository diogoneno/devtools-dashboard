import { useState } from 'react';
import axios from 'axios';
import '../ToolLayout.css';

const NLP_API = 'http://localhost:5003/api/nlp';

function StanceToxicity() {
  const [claim, setClaim] = useState('');
  const [text, setText] = useState('');
  const [toxicityText, setToxicityText] = useState('');
  const [stance, setStance] = useState(null);
  const [toxicity, setToxicity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyzeStance = async () => {
    setLoading(true);
    setError('');
    setStance(null);

    try {
      const response = await axios.post(`${NLP_API}/stance`, { claim, text });
      setStance(response.data.stance);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const analyzeToxicity = async () => {
    setLoading(true);
    setError('');
    setToxicity(null);

    try {
      const response = await axios.post(`${NLP_API}/toxicity`, { text: toxicityText });
      setToxicity(response.data.toxicity);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStanceColor = (s) => {
    switch (s) {
      case 'support': return '#27ae60';
      case 'deny': return '#e74c3c';
      case 'query': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const getToxicityLevel = (score) => {
    if (score < 0.3) return { label: 'Low', color: '#27ae60' };
    if (score < 0.7) return { label: 'Medium', color: '#f39c12' };
    return { label: 'High', color: '#e74c3c' };
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>Stance & Toxicity Lab</h1>
        <p>Analyze stance (support/deny/query/comment) and toxicity in text</p>
      </div>

      <div className="grid-2">
        <div className="tool-card">
          <h3>Stance Analysis</h3>
          <div className="input-group">
            <label>Claim</label>
            <input
              type="text"
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              placeholder="Enter a claim..."
            />
          </div>
          <div className="input-group">
            <label>Response Text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows="4"
              placeholder="Enter text to analyze stance..."
            />
          </div>
          <button className="btn btn-primary" onClick={analyzeStance} disabled={loading || !claim || !text}>
            Analyze Stance
          </button>

          {stance && (
            <div className="result-box" style={{ marginTop: '20px' }}>
              <h4>Stance Result</h4>
              <div style={{ marginTop: '10px' }}>
                <span
                  style={{
                    backgroundColor: getStanceColor(stance.stance),
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}
                >
                  {stance.stance}
                </span>
              </div>
              <div style={{ marginTop: '10px', fontSize: '14px' }}>
                Confidence: {(stance.confidence * 100).toFixed(0)}%
                <br />
                Overlap: {(stance.overlap * 100).toFixed(0)}%
                <br />
                Method: {stance.method}
              </div>
            </div>
          )}
        </div>

        <div className="tool-card">
          <h3>Toxicity Analysis</h3>
          <div className="input-group">
            <label>Text to Analyze</label>
            <textarea
              value={toxicityText}
              onChange={(e) => setToxicityText(e.target.value)}
              rows="6"
              placeholder="Enter text to check for toxicity..."
            />
          </div>
          <button className="btn btn-primary" onClick={analyzeToxicity} disabled={loading || !toxicityText}>
            Analyze Toxicity
          </button>

          {toxicity && (
            <div className="result-box" style={{ marginTop: '20px' }}>
              <h4>Toxicity Result</h4>
              <div style={{ marginTop: '10px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Score:</strong> {(toxicity.score * 100).toFixed(1)}%
                  <br />
                  <span
                    style={{
                      backgroundColor: getToxicityLevel(toxicity.score).color,
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '3px',
                      marginLeft: '10px'
                    }}
                  >
                    {getToxicityLevel(toxicity.score).label}
                  </span>
                </div>
                <div style={{ fontSize: '12px' }}>
                  Model: {toxicity.model}
                </div>
                {toxicity.warning && (
                  <div className="error-message" style={{ marginTop: '10px', fontSize: '12px' }}>
                    ⚠️ {toxicity.warning}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="tool-card">
        <h3>About</h3>
        <ul style={{ lineHeight: '1.8' }}>
          <li><strong>Stance:</strong> Classifies if text supports, denies, questions, or comments on a claim</li>
          <li><strong>Toxicity:</strong> Measures harmful language (requires PERSPECTIVE_API_KEY for best results)</li>
          <li><strong>Bias Warning:</strong> AI toxicity models have known biases - use thoughtfully and calibrate</li>
        </ul>
      </div>
    </div>
  );
}

export default StanceToxicity;
