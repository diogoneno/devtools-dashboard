import { useState } from 'react';
import '../ToolLayout.css';

const ImagePlaceholder = () => {
  const [width, setWidth] = useState(400);
  const [height, setHeight] = useState(300);
  const [bgColor, setBgColor] = useState('#3498db');
  const [textColor, setTextColor] = useState('#ffffff');
  const [text, setText] = useState('');

  const generatePlaceholderURL = () => {
    const displayText = text || `${width}x${height}`;
    const bg = bgColor.replace('#', '');
    const fg = textColor.replace('#', '');
    return `https://via.placeholder.com/${width}x${height}/${bg}/${fg}?text=${encodeURIComponent(displayText)}`;
  };

  const copyURL = () => {
    navigator.clipboard.writeText(generatePlaceholderURL());
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>Image Placeholder Generator</h1>
        <p>Generate placeholder images for your designs</p>
      </div>

      <div className="tool-card">
        <div className="grid-2">
          <div className="input-group">
            <label>Width: {width}px</label>
            <input
              type="range"
              min="100"
              max="1200"
              value={width}
              onChange={(e) => setWidth(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div className="input-group">
            <label>Height: {height}px</label>
            <input
              type="range"
              min="100"
              max="800"
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div className="grid-2">
          <div className="input-group">
            <label>Background Color</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                style={{ width: '60px', height: '40px' }}
              />
              <input
                type="text"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          </div>

          <div className="input-group">
            <label>Text Color</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                style={{ width: '60px', height: '40px' }}
              />
              <input
                type="text"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          </div>
        </div>

        <div className="input-group">
          <label>Custom Text (optional)</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Leave empty for dimension text"
          />
        </div>

        <div className="result-box" style={{ textAlign: 'center' }}>
          <h3>Preview</h3>
          <img src={generatePlaceholderURL()} alt="Placeholder" style={{ maxWidth: '100%' }} />
        </div>

        <div className="result-box">
          <strong>URL:</strong>
          <div style={{ wordBreak: 'break-all', marginTop: '10px', fontSize: '14px' }}>
            {generatePlaceholderURL()}
          </div>
        </div>

        <button className="btn btn-success" onClick={copyURL}>
          Copy URL
        </button>
      </div>
    </div>
  );
};

export default ImagePlaceholder;
