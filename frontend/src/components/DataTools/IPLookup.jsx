import { useState } from 'react';
import axios from 'axios';
import '../ToolLayout.css';

const IPLookup = () => {
  const [ip, setIp] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lookup = async () => {
    setLoading(true);
    setError('');
    setData(null);

    try {
      const response = await axios.get(`http://localhost:5000/api/ip-lookup?ip=${ip}`);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to lookup IP address');
    } finally {
      setLoading(false);
    }
  };

  const lookupMyIP = async () => {
    setIp('');
    setLoading(true);
    setError('');
    setData(null);

    try {
      const response = await axios.get('http://localhost:5000/api/ip-lookup');
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to lookup IP address');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>IP Lookup</h1>
        <p>Get geolocation info from IP addresses</p>
      </div>

      <div className="tool-card">
        <div className="input-group">
          <label>IP Address (leave empty for your IP)</label>
          <input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="8.8.8.8"
          />
        </div>

        <div className="button-group">
          <button
            className="btn btn-primary"
            onClick={lookup}
            disabled={loading}
          >
            {loading ? 'Looking up...' : 'Lookup IP'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={lookupMyIP}
            disabled={loading}
          >
            My IP
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {data && (
          <div className="result-box">
            <h3>IP Information</h3>
            <div style={{ marginTop: '15px' }}>
              <p><strong>IP:</strong> {data.ip}</p>
              <p><strong>City:</strong> {data.city}</p>
              <p><strong>Region:</strong> {data.region}</p>
              <p><strong>Country:</strong> {data.country}</p>
              <p><strong>Timezone:</strong> {data.timezone}</p>
              <p><strong>Organization:</strong> {data.org}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IPLookup;
