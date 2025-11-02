import { useState } from 'react';
import '../ToolLayout.css';

const ModelParameterCalculator = () => {
  const [architecture, setArchitecture] = useState('transformer');
  const [layers, setLayers] = useState(12);
  const [hiddenSize, setHiddenSize] = useState(768);
  const [heads, setHeads] = useState(12);
  const [vocabSize, setVocabSize] = useState(50000);
  const [seqLength, setSeqLength] = useState(512);

  const calculateParams = () => {
    const embedding = vocabSize * hiddenSize;
    const positional = seqLength * hiddenSize;

    // Attention parameters per layer
    const qkv = 3 * hiddenSize * hiddenSize;
    const output = hiddenSize * hiddenSize;
    const attention = qkv + output;

    // FFN parameters per layer
    const ffnHidden = hiddenSize * 4;
    const ffn1 = hiddenSize * ffnHidden;
    const ffn2 = ffnHidden * hiddenSize;
    const ffn = ffn1 + ffn2;

    // Layer norm parameters
    const layerNorm = 2 * hiddenSize;

    const perLayer = attention + ffn + layerNorm * 2;
    const total = embedding + positional + (perLayer * layers);

    return {
      embedding,
      positional,
      perLayer,
      allLayers: perLayer * layers,
      total
    };
  };

  const calculateMemory = (params) => {
    // FP32: 4 bytes per parameter
    // FP16: 2 bytes per parameter
    // INT8: 1 byte per parameter
    return {
      fp32: (params * 4) / (1024 ** 3), // GB
      fp16: (params * 2) / (1024 ** 3),
      int8: params / (1024 ** 3)
    };
  };

  const params = calculateParams();
  const memory = calculateMemory(params.total);

  const trainingMemory = memory.fp32 * 4; // Approximate: model + gradients + optimizer states + activations

  const formatNumber = (num) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(0);
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>⚙️ Model Parameter Calculator</h1>
        <p>Calculate transformer model parameters and memory requirements</p>
      </div>

      <div className="tool-card">
        <div className="info-message">
          <strong>📊 Calculate:</strong> Total parameters, memory usage, and training requirements
        </div>

        <div className="input-group">
          <label>Architecture Type</label>
          <select value={architecture} onChange={(e) => setArchitecture(e.target.value)}>
            <option value="transformer">Transformer (Encoder-Decoder)</option>
            <option value="decoder">Decoder-Only (GPT-style)</option>
            <option value="encoder">Encoder-Only (BERT-style)</option>
          </select>
        </div>

        <div className="grid-2">
          <div className="input-group">
            <label>Number of Layers: {layers}</label>
            <input
              type="range"
              min="1"
              max="96"
              value={layers}
              onChange={(e) => setLayers(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div className="input-group">
            <label>Hidden Size (d_model): {hiddenSize}</label>
            <input
              type="range"
              min="128"
              max="8192"
              step="128"
              value={hiddenSize}
              onChange={(e) => setHiddenSize(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div className="grid-2">
          <div className="input-group">
            <label>Attention Heads: {heads}</label>
            <input
              type="range"
              min="1"
              max="64"
              value={heads}
              onChange={(e) => setHeads(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div className="input-group">
            <label>Vocabulary Size: {vocabSize.toLocaleString()}</label>
            <input
              type="range"
              min="10000"
              max="100000"
              step="1000"
              value={vocabSize}
              onChange={(e) => setVocabSize(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div className="input-group">
          <label>Max Sequence Length: {seqLength}</label>
          <input
            type="range"
            min="128"
            max="8192"
            step="128"
            value={seqLength}
            onChange={(e) => setSeqLength(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div className="result-box" style={{ background: '#f8f9fa', marginTop: '20px' }}>
          <h3>Total Parameters</h3>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#2c3e50', textAlign: 'center', margin: '20px 0' }}>
            {formatNumber(params.total)}
          </div>
          <div style={{ textAlign: 'center', color: '#7f8c8d' }}>
            {params.total.toLocaleString()} parameters
          </div>
        </div>

        <div className="result-box">
          <h4>Parameter Breakdown</h4>
          <div style={{ fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #eee' }}>
              <span>Embedding Layer:</span>
              <strong>{formatNumber(params.embedding)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #eee' }}>
              <span>Positional Encoding:</span>
              <strong>{formatNumber(params.positional)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #eee' }}>
              <span>Per Transformer Layer:</span>
              <strong>{formatNumber(params.perLayer)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #eee' }}>
              <span>All {layers} Layers:</span>
              <strong>{formatNumber(params.allLayers)}</strong>
            </div>
          </div>
        </div>

        <div className="result-box">
          <h4>💾 Memory Requirements (Inference)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '10px' }}>
            <div style={{ textAlign: 'center', padding: '15px', background: '#fff', borderRadius: '5px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>
                {memory.fp32.toFixed(2)} GB
              </div>
              <div style={{ fontSize: '12px', color: '#7f8c8d' }}>FP32</div>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', background: '#fff', borderRadius: '5px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f39c12' }}>
                {memory.fp16.toFixed(2)} GB
              </div>
              <div style={{ fontSize: '12px', color: '#7f8c8d' }}>FP16</div>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', background: '#fff', borderRadius: '5px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2ecc71' }}>
                {memory.int8.toFixed(2)} GB
              </div>
              <div style={{ fontSize: '12px', color: '#7f8c8d' }}>INT8</div>
            </div>
          </div>
        </div>

        <div className="result-box">
          <h4>🎓 Training Memory Estimate</h4>
          <div style={{ fontSize: '14px' }}>
            <p>Approximate training memory (FP32): <strong>{trainingMemory.toFixed(2)} GB</strong></p>
            <p style={{ fontSize: '12px', color: '#7f8c8d' }}>
              Includes: Model weights + Gradients + Optimizer states + Activations
            </p>
          </div>
        </div>

        <div className="result-box">
          <h4>📈 Model Comparison</h4>
          <div style={{ fontSize: '14px' }}>
            <div>• GPT-2: ~1.5B parameters</div>
            <div>• GPT-3: ~175B parameters</div>
            <div>• BERT-Base: ~110M parameters</div>
            <div>• BERT-Large: ~340M parameters</div>
            <div style={{ marginTop: '10px', fontWeight: 'bold' }}>
              Your model: ~{formatNumber(params.total)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelParameterCalculator;
