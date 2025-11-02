import { useState } from 'react';
import '../ToolLayout.css';

const ASCIIArt = () => {
  const [text, setText] = useState('HELLO');
  const [ascii, setAscii] = useState('');

  const fonts = {
    standard: {
      'A': ['  A  ', ' A A ', 'AAAAA', 'A   A', 'A   A'],
      'B': ['BBBB ', 'B   B', 'BBBB ', 'B   B', 'BBBB '],
      'C': [' CCC ', 'C   C', 'C    ', 'C   C', ' CCC '],
      'D': ['DDD  ', 'D  D ', 'D   D', 'D  D ', 'DDD  '],
      'E': ['EEEEE', 'E    ', 'EEEE ', 'E    ', 'EEEEE'],
      'F': ['FFFFF', 'F    ', 'FFFF ', 'F    ', 'F    '],
      'G': [' GGG ', 'G    ', 'G  GG', 'G   G', ' GGG '],
      'H': ['H   H', 'H   H', 'HHHHH', 'H   H', 'H   H'],
      'I': ['IIIII', '  I  ', '  I  ', '  I  ', 'IIIII'],
      'J': ['JJJJJ', '    J', '    J', 'J   J', ' JJJ '],
      'K': ['K   K', 'K  K ', 'KKK  ', 'K  K ', 'K   K'],
      'L': ['L    ', 'L    ', 'L    ', 'L    ', 'LLLLL'],
      'M': ['M   M', 'MM MM', 'M M M', 'M   M', 'M   M'],
      'N': ['N   N', 'NN  N', 'N N N', 'N  NN', 'N   N'],
      'O': [' OOO ', 'O   O', 'O   O', 'O   O', ' OOO '],
      'P': ['PPPP ', 'P   P', 'PPPP ', 'P    ', 'P    '],
      'Q': [' QQQ ', 'Q   Q', 'Q   Q', 'Q  Q ', ' QQ Q'],
      'R': ['RRRR ', 'R   R', 'RRRR ', 'R  R ', 'R   R'],
      'S': [' SSS ', 'S    ', ' SSS ', '    S', 'SSSS '],
      'T': ['TTTTT', '  T  ', '  T  ', '  T  ', '  T  '],
      'U': ['U   U', 'U   U', 'U   U', 'U   U', ' UUU '],
      'V': ['V   V', 'V   V', 'V   V', ' V V ', '  V  '],
      'W': ['W   W', 'W   W', 'W W W', 'WW WW', 'W   W'],
      'X': ['X   X', ' X X ', '  X  ', ' X X ', 'X   X'],
      'Y': ['Y   Y', ' Y Y ', '  Y  ', '  Y  ', '  Y  '],
      'Z': ['ZZZZZ', '   Z ', '  Z  ', ' Z   ', 'ZZZZZ'],
      ' ': ['     ', '     ', '     ', '     ', '     '],
      '!': ['  !  ', '  !  ', '  !  ', '     ', '  !  '],
    }
  };

  const generateASCII = () => {
    const upperText = text.toUpperCase();
    const lines = ['', '', '', '', ''];

    for (let char of upperText) {
      const charArt = fonts.standard[char] || fonts.standard[' '];
      for (let i = 0; i < 5; i++) {
        lines[i] += charArt[i] + '  ';
      }
    }

    setAscii(lines.join('\n'));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(ascii);
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>ASCII Art Generator</h1>
        <p>Convert text to ASCII art</p>
      </div>

      <div className="tool-card">
        <div className="input-group">
          <label>Text</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value.toUpperCase())}
            placeholder="Enter text"
            maxLength={15}
          />
          <small>Max 15 characters (A-Z, space, !)</small>
        </div>

        <button className="btn btn-primary" onClick={generateASCII}>
          Generate ASCII Art
        </button>

        {ascii && (
          <>
            <div className="result-box">
              <pre style={{ fontSize: '12px', lineHeight: '1.2' }}>{ascii}</pre>
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

export default ASCIIArt;
