import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import '../ToolLayout.css';

const QRCodeGen = () => {
  const [text, setText] = useState('https://example.com');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (text) {
      generateQRCode();
    }
  }, [text]);

  const generateQRCode = async () => {
    try {
      const url = await QRCode.toDataURL(text, {
        width: 300,
        margin: 2
      });
      setQrCodeUrl(url);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = qrCodeUrl;
    link.click();
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>QR Code Generator</h1>
        <p>Create QR codes from text or URLs</p>
      </div>

      <div className="tool-card">
        <div className="input-group">
          <label>Text or URL</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text or URL to generate QR code"
          />
        </div>

        {qrCodeUrl && (
          <>
            <div className="result-box" style={{ textAlign: 'center' }}>
              <img src={qrCodeUrl} alt="QR Code" />
            </div>

            <button className="btn btn-success" onClick={downloadQRCode}>
              Download QR Code
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default QRCodeGen;
