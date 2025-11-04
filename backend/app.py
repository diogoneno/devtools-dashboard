from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'message': 'Dashboard API is running'})

@app.route('/health', methods=['GET'])
def health_root():
    return jsonify({'status': 'healthy', 'message': 'Dashboard API is running'})

# Weather API endpoint
@app.route('/api/weather', methods=['GET'])
def get_weather():
    city = request.args.get('city', 'London')
    # Using OpenWeatherMap API (you'll need to add your API key)
    api_key = os.getenv('OPENWEATHER_API_KEY', '')

    if not api_key:
        return jsonify({'error': 'API key not configured'}), 500

    try:
        url = f'http://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric'
        response = requests.get(url)
        data = response.json()

        if response.status_code == 200:
            return jsonify({
                'city': data['name'],
                'temperature': data['main']['temp'],
                'description': data['weather'][0]['description'],
                'humidity': data['main']['humidity'],
                'wind_speed': data['wind']['speed']
            })
        else:
            return jsonify({'error': 'City not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Currency Converter API endpoint
@app.route('/api/currency', methods=['GET'])
def convert_currency():
    from_currency = request.args.get('from', 'USD')
    to_currency = request.args.get('to', 'EUR')
    amount = float(request.args.get('amount', 1))

    try:
        # Using exchangerate-api.com (free tier)
        url = f'https://api.exchangerate-api.com/v4/latest/{from_currency}'
        response = requests.get(url)
        data = response.json()

        if response.status_code == 200:
            rate = data['rates'].get(to_currency)
            if rate:
                converted_amount = amount * rate
                return jsonify({
                    'from': from_currency,
                    'to': to_currency,
                    'amount': amount,
                    'converted': round(converted_amount, 2),
                    'rate': rate
                })
            else:
                return jsonify({'error': 'Invalid currency code'}), 400
        else:
            return jsonify({'error': 'Unable to fetch exchange rates'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# GitHub Stats API endpoint
@app.route('/api/github/<username>', methods=['GET'])
def get_github_stats(username):
    try:
        url = f'https://api.github.com/users/{username}'
        response = requests.get(url)
        data = response.json()

        if response.status_code == 200:
            return jsonify({
                'username': data['login'],
                'name': data['name'],
                'bio': data['bio'],
                'public_repos': data['public_repos'],
                'followers': data['followers'],
                'following': data['following'],
                'avatar_url': data['avatar_url'],
                'profile_url': data['html_url']
            })
        else:
            return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# IP Lookup API endpoint
@app.route('/api/ip-lookup', methods=['GET'])
def ip_lookup():
    ip = request.args.get('ip', '')

    try:
        # Using ipapi.co (free tier)
        url = f'https://ipapi.co/{ip}/json/' if ip else 'https://ipapi.co/json/'
        response = requests.get(url)
        data = response.json()

        if response.status_code == 200:
            return jsonify({
                'ip': data.get('ip'),
                'city': data.get('city'),
                'region': data.get('region'),
                'country': data.get('country_name'),
                'timezone': data.get('timezone'),
                'org': data.get('org')
            })
        else:
            return jsonify({'error': 'Unable to lookup IP'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# News Feed API endpoint
@app.route('/api/news', methods=['GET'])
def get_news():
    # Using dev.to API (no key required)
    try:
        url = 'https://dev.to/api/articles?tag=webdev&top=7'
        response = requests.get(url)
        data = response.json()

        if response.status_code == 200:
            articles = []
            for article in data[:10]:
                articles.append({
                    'title': article['title'],
                    'description': article['description'],
                    'url': article['url'],
                    'published_at': article['published_at'],
                    'tags': article['tag_list']
                })
            return jsonify({'articles': articles})
        else:
            return jsonify({'error': 'Unable to fetch news'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
