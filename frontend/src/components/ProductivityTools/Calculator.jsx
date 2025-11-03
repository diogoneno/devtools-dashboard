import { useState } from 'react';
import '../ToolLayout.css';

const Calculator = () => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  const handleNumber = (num) => {
    if (display === '0') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const calculate = () => {
    try {
      // Safe calculation without eval
      const expression = equation + display;
      const sanitized = expression.replace(/[^0-9+\-*/().]/g, '');
      const result = Function('"use strict"; return (' + sanitized + ')')();
      setDisplay(String(result));
      setEquation('');
    } catch {
      setDisplay('Error');
      setEquation('');
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
  };

  const handleDecimal = () => {
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>Calculator</h1>
        <p>Basic calculator for everyday calculations</p>
      </div>

      <div className="tool-card">
        <div className="result-box" style={{ marginBottom: '20px' }}>
          <div style={{ color: '#7f8c8d', fontSize: '14px', minHeight: '20px' }}>
            {equation}
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            {display}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={clear}>C</button>
          <button className="btn btn-secondary" onClick={() => handleOperator('/')}>÷</button>
          <button className="btn btn-secondary" onClick={() => handleOperator('*')}>×</button>
          <button className="btn btn-secondary" onClick={() => handleOperator('-')}>-</button>

          <button className="btn btn-primary" onClick={() => handleNumber('7')}>7</button>
          <button className="btn btn-primary" onClick={() => handleNumber('8')}>8</button>
          <button className="btn btn-primary" onClick={() => handleNumber('9')}>9</button>
          <button className="btn btn-secondary" onClick={() => handleOperator('+')}>+</button>

          <button className="btn btn-primary" onClick={() => handleNumber('4')}>4</button>
          <button className="btn btn-primary" onClick={() => handleNumber('5')}>5</button>
          <button className="btn btn-primary" onClick={() => handleNumber('6')}>6</button>
          <button className="btn btn-success" onClick={calculate}>=</button>

          <button className="btn btn-primary" onClick={() => handleNumber('1')}>1</button>
          <button className="btn btn-primary" onClick={() => handleNumber('2')}>2</button>
          <button className="btn btn-primary" onClick={() => handleNumber('3')}>3</button>
          <button className="btn btn-primary" onClick={() => handleNumber('0')}>0</button>

          <button className="btn btn-primary" onClick={handleDecimal}>.</button>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
