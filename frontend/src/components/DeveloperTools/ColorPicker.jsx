import { useState } from 'react';
import '../ToolLayout.css';

const ColorPicker = () => {
  const [color, setColor] = useState('#3498db');

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null;
  };

  const hexToHsl = (hex) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return null;

    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  const rgb = hexToRgb(color);
  const hsl = hexToHsl(color);

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>Color Picker & Converter</h1>
        <p>Convert between HEX, RGB, and HSL color formats</p>
      </div>

      <div className="tool-card">
        <div className="input-group">
          <label>Pick a Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{ width: '100%', height: '100px', cursor: 'pointer' }}
          />
        </div>

        <div className="input-group">
          <label>HEX</label>
          <input
            type="text"
            value={color.toUpperCase()}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>

        {rgb && (
          <>
            <div className="input-group">
              <label>RGB</label>
              <input
                type="text"
                value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`}
                readOnly
              />
            </div>

            <div className="input-group">
              <label>RGBA (with alpha)</label>
              <input
                type="text"
                value={`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`}
                readOnly
              />
            </div>
          </>
        )}

        {hsl && (
          <div className="input-group">
            <label>HSL</label>
            <input
              type="text"
              value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`}
              readOnly
            />
          </div>
        )}

        <div className="result-box">
          <strong>Preview:</strong>
          <div
            style={{
              background: color,
              height: '80px',
              borderRadius: '5px',
              marginTop: '10px',
              border: '2px solid #ddd'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
