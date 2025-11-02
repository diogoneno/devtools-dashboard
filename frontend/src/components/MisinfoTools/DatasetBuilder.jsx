import { useState } from 'react';
import '../ToolLayout.css';

function DatasetBuilder() {
  const [datasetName, setDatasetName] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState('parquet');
  const [splits, setSplits] = useState({ train: 70, val: 15, test: 15 });
  const [result, setResult] = useState(null);

  const handleExport = () => {
    // Simulated export
    const manifest = {
      name: datasetName,
      description,
      format,
      splits,
      created: new Date().toISOString(),
      rows: 0, // Would be populated from actual data
      license: 'Research and educational use only',
      provenance: 'Ingested from public sources via Misinformation Lab'
    };

    const json = JSON.stringify(manifest, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${datasetName}-manifest.json`;
    a.click();

    setResult({ message: 'Dataset manifest exported', manifest });
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>Repro & Dataset Builder</h1>
        <p>Export curated datasets with provenance and reproducibility manifests</p>
      </div>

      <div className="tool-card">
        <h3>Dataset Configuration</h3>
        <div className="input-group">
          <label>Dataset Name</label>
          <input
            type="text"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
            placeholder="my-dataset"
          />
        </div>
        <div className="input-group">
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            placeholder="Describe the dataset purpose and contents..."
          />
        </div>
        <div className="input-group">
          <label>Export Format</label>
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="parquet">Parquet</option>
            <option value="csv">CSV</option>
            <option value="json">JSON Lines</option>
          </select>
        </div>
      </div>

      <div className="tool-card">
        <h3>Dataset Splits</h3>
        <div className="input-group">
          <label>Train: {splits.train}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={splits.train}
            onChange={(e) => setSplits({ ...splits, train: parseInt(e.target.value) })}
          />
        </div>
        <div className="input-group">
          <label>Validation: {splits.val}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={splits.val}
            onChange={(e) => setSplits({ ...splits, val: parseInt(e.target.value) })}
          />
        </div>
        <div className="input-group">
          <label>Test: {splits.test}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={splits.test}
            onChange={(e) => setSplits({ ...splits, test: parseInt(e.target.value) })}
          />
        </div>
        <p style={{ fontSize: '12px', color: splits.train + splits.val + splits.test !== 100 ? '#e74c3c' : '#27ae60' }}>
          Total: {splits.train + splits.val + splits.test}% {splits.train + splits.val + splits.test !== 100 && '(Must equal 100%)'}
        </p>
      </div>

      <div className="tool-card">
        <h3>Export</h3>
        <button
          className="btn btn-primary"
          onClick={handleExport}
          disabled={!datasetName || splits.train + splits.val + splits.test !== 100}
        >
          Export Dataset Manifest
        </button>

        {result && (
          <div className="success-message" style={{ marginTop: '20px' }}>
            <p><strong>{result.message}</strong></p>
            <pre style={{ fontSize: '11px', overflow: 'auto', marginTop: '10px' }}>
              {JSON.stringify(result.manifest, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="tool-card">
        <h3>Benchmark Datasets</h3>
        <p>Common misinformation research datasets:</p>
        <ul style={{ lineHeight: '1.8' }}>
          <li><strong>LIAR:</strong> Short political claims with truth ratings</li>
          <li><strong>RumourEval:</strong> Stance and veracity for social media rumors</li>
          <li><strong>CoAID:</strong> COVID-19 misinformation claims</li>
          <li><strong>FakeNewsNet:</strong> News articles (note redistribution limits)</li>
        </ul>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          Always respect dataset licenses and cite appropriately in research.
        </p>
      </div>
    </div>
  );
}

export default DatasetBuilder;
