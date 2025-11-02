import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <h1>Welcome to DevTools Dashboard</h1>
      <p className="subtitle">Your all-in-one toolkit for development and productivity</p>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">💻</div>
          <h3>Developer Tools</h3>
          <p>9 essential tools for developers including JSON formatter, regex tester, and more</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>Productivity</h3>
          <p>7 tools to boost your productivity including calculators, timers, and note-taking</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Data Tools</h3>
          <p>5 data manipulation tools for conversions, charts, and analysis</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🎨</div>
          <h3>Creative</h3>
          <p>3 creative tools for generating placeholders, ASCII art, and test data</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🌐</div>
          <h3>API-Powered</h3>
          <p>4 tools with live data: weather, currency rates, GitHub stats, and news</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h3>Client-Side First</h3>
          <p>Most tools work entirely in your browser with no data sent to servers</p>
        </div>
      </div>

      <div className="getting-started">
        <h2>Getting Started</h2>
        <p>Select any tool from the sidebar to begin. All tools are categorized for easy navigation.</p>
        <ul>
          <li>🔧 Developer tools for encoding, hashing, and testing</li>
          <li>📝 Productivity tools for everyday tasks</li>
          <li>📈 Data tools for analysis and conversion</li>
          <li>🎭 Creative tools for content generation</li>
          <li>🔌 API-powered tools for live information</li>
        </ul>
      </div>
    </div>
  );
};

export default Home;
