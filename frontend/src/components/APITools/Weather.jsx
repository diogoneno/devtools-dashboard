import { useState } from 'react';
import axios from 'axios';
import '../ToolLayout.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Weather = () => {
  const [city, setCity] = useState('London');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchWeather = async () => {
    if (!city.trim()) {
      setError('Please enter a city name');
      return;
    }

    setLoading(true);
    setError('');
    setWeather(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/weather?city=${city}`);
      setWeather(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch weather data. Make sure the Flask backend is running and API key is configured.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>Weather Widget</h1>
        <p>Current weather for any location</p>
      </div>

      <div className="tool-card">
        <div className="info-message">
          <strong>Note:</strong> This tool requires the Flask backend to be running with an OpenWeatherMap API key configured.
        </div>

        <div className="input-group">
          <label>City Name</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city name"
            onKeyPress={(e) => e.key === 'Enter' && fetchWeather()}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={fetchWeather}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Get Weather'}
        </button>

        {error && <div className="error-message">{error}</div>}

        {weather && (
          <div className="result-box">
            <h2 style={{ marginTop: 0 }}>{weather.city}</h2>
            <div style={{ fontSize: '48px', fontWeight: 'bold', margin: '20px 0' }}>
              {Math.round(weather.temperature)}°C
            </div>
            <div style={{ fontSize: '24px', textTransform: 'capitalize', marginBottom: '20px' }}>
              {weather.description}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <strong>Humidity:</strong> {weather.humidity}%
              </div>
              <div>
                <strong>Wind Speed:</strong> {weather.wind_speed} m/s
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Weather;
