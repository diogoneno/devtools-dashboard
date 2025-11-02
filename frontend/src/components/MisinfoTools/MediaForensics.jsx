import { useState } from 'react';
import axios from 'axios';
import '../ToolLayout.css';

const FORENSICS_API = 'http://localhost:5004/api/forensics';

function MediaForensics() {
  const [imageUrl, setImageUrl] = useState('');
  const [exif, setExif] = useState(null);
  const [ocr, setOcr] = useState(null);
  const [reverseSearch, setReverseSearch] = useState(null);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const extractEXIF = async () => {
    setLoading(true);
    setError('');
    setExif(null);

    try {
      const response = await axios.post(`${FORENSICS_API}/exif`, { imageUrl });
      setExif(response.data.exif);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const extractOCR = async () => {
    setLoading(true);
    setError('');
    setOcr(null);

    try {
      const response = await axios.post(`${FORENSICS_API}/ocr`, { imageUrl });
      setOcr(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const getReverseSearchUrls = async () => {
    setError('');
    setReverseSearch(null);

    try {
      const response = await axios.post(`${FORENSICS_API}/reverse-image`, { imageUrl });
      setReverseSearch(response.data.searchUrls);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const loadTools = async () => {
    try {
      const response = await axios.get(`${FORENSICS_API}/tools`);
      setTools(response.data.tools);
    } catch (err) {
      console.error('Failed to load tools:', err);
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>Media Forensics Workbench</h1>
        <p>Analyze images and videos for authenticity and metadata</p>
      </div>

      <div className="tool-card">
        <h3>Image URL</h3>
        <div className="input-group">
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
        </div>
        <div>
          <button className="btn btn-primary" onClick={extractEXIF} disabled={loading || !imageUrl}>
            Extract EXIF
          </button>
          <button className="btn" onClick={extractOCR} disabled={loading || !imageUrl} style={{ marginLeft: '10px' }}>
            Extract Text (OCR)
          </button>
          <button className="btn" onClick={getReverseSearchUrls} disabled={!imageUrl} style={{ marginLeft: '10px' }}>
            Reverse Image Search
          </button>
        </div>
        {error && <div className="error-message" style={{ marginTop: '15px' }}>{error}</div>}
      </div>

      {imageUrl && (
        <div className="tool-card">
          <h3>Image Preview</h3>
          <img src={imageUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '400px', border: '1px solid #ddd' }} />
        </div>
      )}

      {exif && (
        <div className="tool-card">
          <h3>EXIF Metadata</h3>
          {exif.available === false ? (
            <div className="error-message">
              <p>{exif.message}</p>
              <code>{exif.installCmd}</code>
            </div>
          ) : (
            <div className="result-box">
              <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                {JSON.stringify(exif, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {ocr && (
        <div className="tool-card">
          <h3>OCR Text Extraction</h3>
          {ocr.available === false ? (
            <div className="error-message">
              <p>{ocr.message}</p>
              <code>{ocr.installCmd}</code>
            </div>
          ) : (
            <div className="result-box">
              <p><strong>Extracted Text:</strong></p>
              <div style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
                {ocr.text || '(No text found)'}
              </div>
            </div>
          )}
        </div>
      )}

      {reverseSearch && (
        <div className="tool-card">
          <h3>Reverse Image Search</h3>
          <p>Search for this image across multiple platforms:</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
            {Object.entries(reverseSearch).map(([engine, url]) => (
              <a
                key={engine}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                style={{ textAlign: 'center' }}
              >
                Search on {engine.charAt(0).toUpperCase() + engine.slice(1)}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="tool-card">
        <h3>Verification Tools</h3>
        <button className="btn" onClick={loadTools}>Load Tools</button>
        {tools.length > 0 && (
          <div style={{ marginTop: '15px' }}>
            {tools.map((tool, idx) => (
              <div key={idx} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #eee', borderRadius: '4px' }}>
                <strong>{tool.name}</strong>
                <p style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>{tool.description}</p>
                <a href={tool.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm">
                  Open Tool
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MediaForensics;
