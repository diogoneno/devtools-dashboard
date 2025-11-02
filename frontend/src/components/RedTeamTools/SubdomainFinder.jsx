import { useState } from 'react';
import '../ToolLayout.css';

const SubdomainFinder = () => {
  const [domain, setDomain] = useState('');
  const [subdomains, setSubdomains] = useState([]);
  const [loading, setLoading] = useState(false);

  const commonSubdomains = [
    'www', 'mail', 'ftp', 'localhost', 'webmail', 'smtp', 'pop', 'ns1', 'webdisk',
    'ns2', 'cpanel', 'whm', 'autodiscover', 'autoconfig', 'm', 'imap', 'test',
    'ns', 'blog', 'pop3', 'dev', 'www2', 'admin', 'forum', 'news', 'vpn',
    'ns3', 'mail2', 'new', 'mysql', 'old', 'lists', 'support', 'mobile', 'mx',
    'static', 'docs', 'beta', 'shop', 'sql', 'secure', 'demo', 'cp', 'calendar',
    'wiki', 'web', 'media', 'email', 'images', 'img', 'www1', 'intranet',
    'portal', 'video', 'sip', 'dns2', 'api', 'cdn', 'stats', 'dns1', 'ns4',
    'www3', 'dns', 'search', 'staging', 'server', 'mx1', 'chat', 'wap', 'my',
    'svn', 'mail1', 'sites', 'proxy', 'ads', 'host', 'crm', 'cms', 'backup',
    'mx2', 'lyncdiscover', 'info', 'apps', 'download', 'remote', 'db', 'forums',
    'store', 'relay', 'files', 'newsletter', 'app', 'live', 'owa', 'en', 'start',
    'sms', 'office', 'exchange', 'ipv4'
  ];

  const findSubdomains = async () => {
    if (!domain.trim()) return;

    setLoading(true);
    setSubdomains([]);

    const found = [];
    let checked = 0;

    for (const sub of commonSubdomains) {
      const subdomain = `${sub}.${domain}`;

      try {
        // Simple DNS check
        const response = await fetch(`https://dns.google/resolve?name=${subdomain}&type=A`);
        const data = await response.json();

        if (data.Answer && data.Answer.length > 0) {
          found.push({
            subdomain,
            ip: data.Answer[0].data,
            status: 'Active'
          });
          setSubdomains([...found]);
        }
      } catch (err) {
        // Subdomain doesn't exist or error
      }

      checked++;
      if (checked % 10 === 0) {
        // Update progress
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    setLoading(false);
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>🌐 Subdomain Finder</h1>
        <p>Discover subdomains using common subdomain enumeration</p>
      </div>

      <div className="tool-card">
        <div className="info-message">
          <strong>⚠️ Authorized Testing Only:</strong> Only enumerate subdomains for domains you own or have permission to test.
        </div>

        <div className="input-group">
          <label>Domain Name</label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            onKeyPress={(e) => e.key === 'Enter' && findSubdomains()}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={findSubdomains}
          disabled={loading}
        >
          {loading ? `Scanning... (${subdomains.length} found)` : 'Find Subdomains'}
        </button>

        {subdomains.length > 0 && (
          <div className="result-box" style={{ marginTop: '20px' }}>
            <h3>Found Subdomains ({subdomains.length})</h3>
            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
              {subdomains.map((item, idx) => (
                <div key={idx} style={{
                  padding: '10px',
                  background: idx % 2 === 0 ? '#f8f9fa' : 'white',
                  borderRadius: '3px',
                  marginBottom: '5px'
                }}>
                  <div style={{ fontWeight: 'bold', color: '#2ecc71' }}>
                    ✓ {item.subdomain}
                  </div>
                  <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                    IP: {item.ip} | Status: {item.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && subdomains.length === 0 && domain && (
          <div className="info-message" style={{ marginTop: '20px' }}>
            No subdomains found or scan not completed yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default SubdomainFinder;
