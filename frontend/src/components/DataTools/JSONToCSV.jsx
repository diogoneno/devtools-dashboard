import { useState } from 'react';
import '../ToolLayout.css';

const JSONToCSV = () => {
  const [json, setJson] = useState('');
  const [csv, setCsv] = useState('');
  const [error, setError] = useState('');

  const convertToCSV = () => {
    try {
      const data = JSON.parse(json);

      if (!Array.isArray(data)) {
        setError('JSON must be an array of objects');
        setCsv('');
        return;
      }

      if (data.length === 0) {
        setError('Array is empty');
        setCsv('');
        return;
      }

      // Get headers from first object
      const headers = Object.keys(data[0]);
      const csvRows = [];

      // Add headers
      csvRows.push(headers.join(','));

      // Add data rows
      for (const row of data) {
        const values = headers.map(header => {
          const value = row[header];
          const escaped = ('' + value).replace(/"/g, '\\"');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
      }

      setCsv(csvRows.join('\n'));
      setError('');
    } catch (err) {
      setError('Invalid JSON: ' + err.message);
      setCsv('');
    }
  };

  const downloadCSV = () => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'data.csv';
    link.click();
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>JSON to CSV Converter</h1>
        <p>Transform JSON data to CSV format</p>
      </div>

      <div className="tool-card">
        <div className="input-group">
          <label>JSON Input (Array of Objects)</label>
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            placeholder='[{"name": "John", "age": 30}, {"name": "Jane", "age": 25}]'
            style={{ minHeight: '200px' }}
          />
        </div>

        <button className="btn btn-primary" onClick={convertToCSV}>
          Convert to CSV
        </button>

        {error && <div className="error-message">{error}</div>}

        {csv && (
          <>
            <div className="input-group">
              <label>CSV Output</label>
              <textarea value={csv} readOnly style={{ minHeight: '200px' }} />
            </div>
            <button className="btn btn-success" onClick={downloadCSV}>
              Download CSV
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default JSONToCSV;
