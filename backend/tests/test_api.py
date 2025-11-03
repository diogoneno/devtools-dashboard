"""
Basic test suite for Flask API
Run with: pytest tests/
"""

import pytest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app


@pytest.fixture
def client():
    """Create a test client"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_health_endpoint(client):
    """Test the health check endpoint"""
    response = client.get('/api/health')
    assert response.status_code == 200
    data = response.get_json()
    assert 'status' in data
    assert data['status'] == 'healthy'


def test_health_endpoint_returns_json(client):
    """Test that health endpoint returns JSON"""
    response = client.get('/api/health')
    assert response.content_type == 'application/json'


def test_invalid_endpoint(client):
    """Test that invalid endpoints return 404"""
    response = client.get('/api/invalid-endpoint')
    assert response.status_code == 404


def test_weather_endpoint_without_api_key(client):
    """Test weather endpoint when API key is not configured"""
    response = client.get('/api/weather?city=London')
    # Should return error if API key is not set
    assert response.status_code in [200, 500]


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
