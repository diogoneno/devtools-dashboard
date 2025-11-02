import { useState } from 'react';
import axios from 'axios';
import '../ToolLayout.css';

const CurrencyConverter = () => {
  const [amount, setAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'MXN', 'BRL', 'ZAR', 'RUB', 'KRW'];

  const convert = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.get(
        `http://localhost:5000/api/currency?from=${fromCurrency}&to=${toCurrency}&amount=${amount}`
      );
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to convert currency. Make sure the Flask backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const swap = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    setResult(null);
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>Currency Converter</h1>
        <p>Real-time exchange rates</p>
      </div>

      <div className="tool-card">
        <div className="info-message">
          <strong>Note:</strong> This tool requires the Flask backend to be running.
        </div>

        <div className="input-group">
          <label>Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100"
          />
        </div>

        <div className="grid-2">
          <div className="input-group">
            <label>From</label>
            <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)}>
              {currencies.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>To</label>
            <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)}>
              {currencies.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="button-group">
          <button
            className="btn btn-primary"
            onClick={convert}
            disabled={loading}
          >
            {loading ? 'Converting...' : 'Convert'}
          </button>
          <button className="btn btn-secondary" onClick={swap}>
            Swap Currencies
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {result && (
          <div className="success-message">
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>
              {result.amount} {result.from} = {result.converted} {result.to}
            </div>
            <div style={{ fontSize: '14px' }}>
              Exchange Rate: 1 {result.from} = {result.rate.toFixed(4)} {result.to}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrencyConverter;
