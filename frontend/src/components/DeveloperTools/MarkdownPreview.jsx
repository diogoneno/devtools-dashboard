import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import '../ToolLayout.css';

const MarkdownPreview = () => {
  const [markdown, setMarkdown] = useState('# Hello World\n\nThis is **bold** and this is *italic*.\n\n- List item 1\n- List item 2\n\n```javascript\nconsole.log("Hello!");\n```');

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>Markdown Preview</h1>
        <p>Live markdown editor with preview</p>
      </div>

      <div className="tool-card">
        <div className="grid-2">
          <div className="input-group">
            <label>Markdown Input</label>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              style={{ minHeight: '400px' }}
            />
          </div>

          <div className="input-group">
            <label>Preview</label>
            <div
              className="result-box"
              style={{
                minHeight: '400px',
                background: 'white',
                padding: '20px'
              }}
            >
              <ReactMarkdown>{markdown}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkdownPreview;
