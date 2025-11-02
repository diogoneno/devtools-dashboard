import { useState } from 'react';
import '../ToolLayout.css';

const LoremIpsum = () => {
  const [paragraphs, setParagraphs] = useState(3);
  const [text, setText] = useState('');

  const loremText = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
    "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.",
    "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga.",
    "Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus."
  ];

  const generateText = () => {
    let result = [];
    for (let i = 0; i < paragraphs; i++) {
      result.push(loremText[i % loremText.length]);
    }
    setText(result.join('\n\n'));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>Lorem Ipsum Generator</h1>
        <p>Generate placeholder text for your designs</p>
      </div>

      <div className="tool-card">
        <div className="input-group">
          <label>Number of Paragraphs: {paragraphs}</label>
          <input
            type="range"
            min="1"
            max="10"
            value={paragraphs}
            onChange={(e) => setParagraphs(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <button className="btn btn-primary" onClick={generateText}>
          Generate Text
        </button>

        {text && (
          <>
            <div className="result-box" style={{ whiteSpace: 'pre-wrap' }}>
              {text}
            </div>
            <button className="btn btn-success" onClick={copyToClipboard}>
              Copy to Clipboard
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default LoremIpsum;
