import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const tools = [
    {
      category: 'Developer Tools',
      items: [
        { name: 'JSON Formatter', path: '/json-formatter' },
        { name: 'Base64 Encoder/Decoder', path: '/base64' },
        { name: 'Regex Tester', path: '/regex-tester' },
        { name: 'Color Picker', path: '/color-picker' },
        { name: 'JWT Decoder', path: '/jwt-decoder' },
        { name: 'Markdown Preview', path: '/markdown-preview' },
        { name: 'Code Diff Viewer', path: '/code-diff' },
        { name: 'Hash Generator', path: '/hash-generator' },
        { name: 'QR Code Generator', path: '/qr-code' },
      ]
    },
    {
      category: 'Productivity',
      items: [
        { name: 'Unit Converter', path: '/unit-converter' },
        { name: 'Calculator', path: '/calculator' },
        { name: 'Timer/Stopwatch', path: '/timer' },
        { name: 'Note Taker', path: '/notes' },
        { name: 'Password Generator', path: '/password-generator' },
        { name: 'URL Shortener', path: '/url-shortener' },
        { name: 'Lorem Ipsum', path: '/lorem-ipsum' },
      ]
    },
    {
      category: 'Data Tools',
      items: [
        { name: 'JSON to CSV', path: '/json-to-csv' },
        { name: 'Chart Builder', path: '/chart-builder' },
        { name: 'IP Lookup', path: '/ip-lookup' },
        { name: 'UUID Generator', path: '/uuid-generator' },
        { name: 'Timestamp Converter', path: '/timestamp-converter' },
      ]
    },
    {
      category: 'Creative',
      items: [
        { name: 'Image Placeholder', path: '/image-placeholder' },
        { name: 'ASCII Art', path: '/ascii-art' },
        { name: 'Random User', path: '/random-user' },
      ]
    },
    {
      category: 'API-Powered',
      items: [
        { name: 'Weather', path: '/weather' },
        { name: 'Currency Converter', path: '/currency-converter' },
        { name: 'GitHub Stats', path: '/github-stats' },
        { name: 'News Feed', path: '/news' },
      ]
    },
    {
      category: '🔴 Red Team / Security',
      items: [
        { name: 'DNS Lookup', path: '/dns-lookup' },
        { name: 'HTTP Headers Analyzer', path: '/http-headers-analyzer' },
        { name: 'Subdomain Finder', path: '/subdomain-finder' },
        { name: 'WHOIS Lookup', path: '/whois-lookup' },
        { name: 'Security Headers Checker', path: '/security-headers-checker' },
        { name: 'SQL Injection Tester', path: '/sql-injection-tester' },
        { name: 'XSS Tester', path: '/xss-tester' },
        { name: 'Password Strength Checker', path: '/password-strength-checker' },
        { name: 'SSL/TLS Checker', path: '/ssl-tls-checker' },
      ]
    },
    {
      category: '🤖 AI Engineering',
      items: [
        { name: 'Token Counter', path: '/token-counter' },
        { name: 'Prompt Template Builder', path: '/prompt-template-builder' },
        { name: 'Model Cost Calculator', path: '/model-cost-calculator' },
        { name: 'JSON Schema Generator', path: '/json-schema-generator' },
        { name: 'System Prompt Builder', path: '/system-prompt-builder' },
        { name: 'Few-Shot Manager', path: '/few-shot-manager' },
        { name: 'Model Parameter Calculator', path: '/model-parameter-calculator' },
      ]
    },
    {
      category: '🛡️ Misinformation Lab',
      items: [
        { name: 'Open News Ingest', path: '/misinfo/open-news-ingest' },
        { name: 'Claim & Fact-Check Explorer', path: '/misinfo/claim-fact-explorer' },
        { name: 'Propagation & Community Graphs', path: '/misinfo/propagation-graphs' },
        { name: 'Stance & Toxicity Lab', path: '/misinfo/stance-toxicity' },
        { name: 'Media Forensics Workbench', path: '/misinfo/media-forensics' },
        { name: 'Source Controls & Policies', path: '/misinfo/source-policies' },
        { name: 'Repro & Dataset Builder', path: '/misinfo/dataset-builder' },
      ]
    },
    {
      category: '🎓 E-Portfolio',
      items: [
        { name: 'My Modules', path: '/portfolio' },
      ]
    },
    {
      category: '🛡️ Cyber Resilience',
      items: [
        { name: 'Backup Resilience Center', path: '/resilience/backup-center' },
        { name: 'Ransomware Early Warning', path: '/resilience/ransomware-warning' },
        { name: 'Compliance Evidence Packs', path: '/resilience/compliance-packs' },
      ]
    },
    {
      category: '🔒 AI Safety & LLM Security',
      items: [
        { name: 'Prompt Safety Monitor', path: '/ai-safety/prompt-monitor' },
        { name: 'LLM Red Team Harness', path: '/ai-safety/redteam-harness' },
        { name: 'Model Robustness Lab', path: '/ai-safety/robustness-lab' },
        { name: 'Agent Tool Access Gate', path: '/ai-safety/tool-access-gate' },
      ]
    }
  ];

  return (
    <div className="layout">
      <button
        className="sidebar-toggle"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? '◀' : '▶'}
      </button>

      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h1><Link to="/">🛠️ DevTools Dashboard</Link></h1>
        </div>

        <nav className="sidebar-nav">
          {tools.map((category, idx) => (
            <div key={idx} className="nav-category">
              <h3>{category.category}</h3>
              <ul>
                {category.items.map((item, itemIdx) => (
                  <li key={itemIdx}>
                    <Link
                      to={item.path}
                      className={location.pathname === item.path ? 'active' : ''}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <main className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
