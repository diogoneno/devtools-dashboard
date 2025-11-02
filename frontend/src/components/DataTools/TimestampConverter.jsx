import { useState, useEffect } from 'react';
import '../ToolLayout.css';

const TimestampConverter = () => {
  const [timestamp, setTimestamp] = useState('');
  const [datetime, setDatetime] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const timestampToDate = () => {
    try {
      const ts = parseInt(timestamp);
      const date = new Date(ts);
      setDatetime(date.toISOString());
    } catch (err) {
      setDatetime('Invalid timestamp');
    }
  };

  const dateToTimestamp = () => {
    try {
      const date = new Date(datetime);
      setTimestamp(date.getTime().toString());
    } catch (err) {
      setTimestamp('Invalid date');
    }
  };

  const useCurrentTime = () => {
    setTimestamp(currentTime.toString());
    setDatetime(new Date(currentTime).toISOString());
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>Timestamp Converter</h1>
        <p>Convert between timestamp and datetime formats</p>
      </div>

      <div className="tool-card">
        <div className="info-message">
          Current Unix Timestamp: <strong>{currentTime}</strong>
          <br />
          Current Time: <strong>{new Date(currentTime).toLocaleString()}</strong>
        </div>

        <button className="btn btn-success" onClick={useCurrentTime}>
          Use Current Time
        </button>

        <div className="grid-2" style={{ marginTop: '20px' }}>
          <div className="input-group">
            <label>Unix Timestamp (milliseconds)</label>
            <input
              type="text"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              placeholder="1609459200000"
            />
            <button
              className="btn btn-primary"
              style={{ marginTop: '10px' }}
              onClick={timestampToDate}
            >
              Convert to Date
            </button>
          </div>

          <div className="input-group">
            <label>Datetime (ISO 8601)</label>
            <input
              type="text"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              placeholder="2021-01-01T00:00:00.000Z"
            />
            <button
              className="btn btn-primary"
              style={{ marginTop: '10px' }}
              onClick={dateToTimestamp}
            >
              Convert to Timestamp
            </button>
          </div>
        </div>

        {timestamp && datetime && (
          <div className="result-box">
            <h3>Conversions</h3>
            <p><strong>Timestamp:</strong> {timestamp}</p>
            <p><strong>ISO 8601:</strong> {datetime}</p>
            {!isNaN(parseInt(timestamp)) && (
              <>
                <p><strong>Local Time:</strong> {new Date(parseInt(timestamp)).toLocaleString()}</p>
                <p><strong>UTC:</strong> {new Date(parseInt(timestamp)).toUTCString()}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimestampConverter;
