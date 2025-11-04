import React, { useState, useEffect } from 'react';
import '../../styles/ToolLayout.css';
import './HTTPRequestBuilder.css';

/**
 * HTTP Request Builder/Tester - Enterprise-grade API testing tool
 *
 * Features:
 * - Full REST client with all HTTP methods
 * - Headers, query params, and body editors
 * - Authentication: Bearer, Basic, API Key
 * - Collections with folders
 * - Environment variables
 * - Request history
 * - Response viewer with syntax highlighting
 *
 * @returns {JSX.Element} HTTP Request Builder component
 */
const HTTPRequestBuilder = () => {
  // Request state
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts/1');
  const [headers, setHeaders] = useState([{ key: '', value: '', enabled: true }]);
  const [queryParams, setQueryParams] = useState([{ key: '', value: '', enabled: true }]);
  const [bodyType, setBodyType] = useState('json');
  const [bodyContent, setBodyContent] = useState('');
  const [authType, setAuthType] = useState('none');
  const [authToken, setAuthToken] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // Response state
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [responseTime, setResponseTime] = useState(0);

  // Collections & Environment
  const [collections, setCollections] = useState([]);
  const [currentCollection, setCurrentCollection] = useState(null);
  const [environments, setEnvironments] = useState([]);
  const [currentEnv, setCurrentEnv] = useState(null);
  const [history, setHistory] = useState([]);

  // UI state
  const [activeTab, setActiveTab] = useState('params');
  const [responseTab, setResponseTab] = useState('body');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [requestName, setRequestName] = useState('');

  // Load saved data from localStorage
  useEffect(() => {
    const savedCollections = localStorage.getItem('httpCollections');
    const savedEnvironments = localStorage.getItem('httpEnvironments');
    const savedHistory = localStorage.getItem('httpHistory');

    if (savedCollections) setCollections(JSON.parse(savedCollections));
    if (savedEnvironments) setEnvironments(JSON.parse(savedEnvironments));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  /**
   * Replace environment variables in a string
   * Format: {{VARIABLE_NAME}}
   */
  const replaceEnvVars = (str) => {
    if (!currentEnv || !str) return str;

    return str.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
      const envVar = currentEnv.variables.find(v => v.key === varName.trim());
      return envVar ? envVar.value : match;
    });
  };

  /**
   * Build full URL with query parameters
   */
  const buildFullUrl = () => {
    let fullUrl = replaceEnvVars(url);
    const enabledParams = queryParams.filter(p => p.enabled && p.key);

    if (enabledParams.length > 0) {
      const queryString = enabledParams
        .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(replaceEnvVars(p.value))}`)
        .join('&');
      fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString;
    }

    return fullUrl;
  };

  /**
   * Execute HTTP request
   */
  const sendRequest = async () => {
    setLoading(true);
    setResponse(null);
    const startTime = performance.now();

    try {
      const fullUrl = buildFullUrl();

      // Build headers
      const requestHeaders = {};
      headers
        .filter(h => h.enabled && h.key)
        .forEach(h => {
          requestHeaders[h.key] = replaceEnvVars(h.value);
        });

      // Add auth headers
      if (authType === 'bearer') {
        requestHeaders['Authorization'] = `Bearer ${replaceEnvVars(authToken)}`;
      } else if (authType === 'basic') {
        const credentials = btoa(`${authUsername}:${authPassword}`);
        requestHeaders['Authorization'] = `Basic ${credentials}`;
      } else if (authType === 'apikey') {
        requestHeaders['X-API-Key'] = replaceEnvVars(authToken);
      }

      // Build request options
      const options = {
        method,
        headers: requestHeaders,
      };

      // Add body for methods that support it
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && bodyContent) {
        if (bodyType === 'json') {
          options.headers['Content-Type'] = 'application/json';
          options.body = replaceEnvVars(bodyContent);
        } else if (bodyType === 'text') {
          options.headers['Content-Type'] = 'text/plain';
          options.body = replaceEnvVars(bodyContent);
        } else if (bodyType === 'xml') {
          options.headers['Content-Type'] = 'application/xml';
          options.body = replaceEnvVars(bodyContent);
        }
      }

      // Execute request
      const res = await fetch(fullUrl, options);
      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));

      // Parse response
      const contentType = res.headers.get('content-type') || '';
      let responseBody;

      if (contentType.includes('application/json')) {
        responseBody = await res.json();
      } else if (contentType.includes('text/')) {
        responseBody = await res.text();
      } else {
        responseBody = await res.text();
      }

      // Build response headers
      const responseHeaders = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const responseData = {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body: responseBody,
        time: Math.round(endTime - startTime),
        size: new Blob([JSON.stringify(responseBody)]).size,
      };

      setResponse(responseData);

      // Add to history
      const historyItem = {
        id: Date.now(),
        method,
        url: fullUrl,
        timestamp: new Date().toISOString(),
        status: res.status,
        time: responseData.time,
      };

      const newHistory = [historyItem, ...history.slice(0, 49)]; // Keep last 50
      setHistory(newHistory);
      localStorage.setItem('httpHistory', JSON.stringify(newHistory));

    } catch (error) {
      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));

      setResponse({
        error: true,
        message: error.message,
        time: Math.round(endTime - startTime),
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add new row to headers/params
   */
  const addRow = (type) => {
    if (type === 'header') {
      setHeaders([...headers, { key: '', value: '', enabled: true }]);
    } else if (type === 'param') {
      setQueryParams([...queryParams, { key: '', value: '', enabled: true }]);
    }
  };

  /**
   * Update row in headers/params
   */
  const updateRow = (type, index, field, value) => {
    if (type === 'header') {
      const newHeaders = [...headers];
      newHeaders[index][field] = value;
      setHeaders(newHeaders);
    } else if (type === 'param') {
      const newParams = [...queryParams];
      newParams[index][field] = value;
      setQueryParams(newParams);
    }
  };

  /**
   * Remove row from headers/params
   */
  const removeRow = (type, index) => {
    if (type === 'header') {
      setHeaders(headers.filter((_, i) => i !== index));
    } else if (type === 'param') {
      setQueryParams(queryParams.filter((_, i) => i !== index));
    }
  };

  /**
   * Save current request to collection
   */
  const saveRequest = () => {
    if (!requestName.trim()) {
      alert('Please enter a request name');
      return;
    }

    const request = {
      id: Date.now(),
      name: requestName,
      method,
      url,
      headers,
      queryParams,
      bodyType,
      bodyContent,
      authType,
      authToken,
      authUsername,
      authPassword,
    };

    let targetCollection;
    if (currentCollection) {
      targetCollection = collections.find(c => c.id === currentCollection);
      targetCollection.requests.push(request);
    } else {
      targetCollection = {
        id: Date.now(),
        name: 'Default Collection',
        requests: [request],
      };
      collections.push(targetCollection);
    }

    setCollections([...collections]);
    localStorage.setItem('httpCollections', JSON.stringify(collections));
    setShowSaveDialog(false);
    setRequestName('');
  };

  /**
   * Load request from collection or history
   */
  const loadRequest = (req) => {
    setMethod(req.method);
    setUrl(req.url);
    if (req.headers) setHeaders(req.headers);
    if (req.queryParams) setQueryParams(req.queryParams);
    if (req.bodyType) setBodyType(req.bodyType);
    if (req.bodyContent) setBodyContent(req.bodyContent);
    if (req.authType) setAuthType(req.authType);
    if (req.authToken) setAuthToken(req.authToken);
    if (req.authUsername) setAuthUsername(req.authUsername);
    if (req.authPassword) setAuthPassword(req.authPassword);
  };

  /**
   * Format JSON with syntax highlighting
   */
  const formatJSON = (obj) => {
    return JSON.stringify(obj, null, 2);
  };

  return (
    <div className="tool-layout">
      <div className="tool-header">
        <h1>🌐 HTTP Request Builder</h1>
        <p>Enterprise-grade REST client with collections, environments, and history</p>
      </div>

      <div className="http-builder-container">
        {/* Sidebar - Collections & History */}
        <div className="http-sidebar">
          <div className="sidebar-section">
            <h3>Collections</h3>
            <button
              className="btn-small"
              onClick={() => {
                const name = prompt('Collection name:');
                if (name) {
                  const newCollection = {
                    id: Date.now(),
                    name,
                    requests: [],
                  };
                  setCollections([...collections, newCollection]);
                  localStorage.setItem('httpCollections', JSON.stringify([...collections, newCollection]));
                }
              }}
            >
              + New Collection
            </button>

            <div className="collections-list">
              {collections.map(collection => (
                <div key={collection.id} className="collection-item">
                  <div
                    className="collection-name"
                    onClick={() => setCurrentCollection(currentCollection === collection.id ? null : collection.id)}
                  >
                    📁 {collection.name} ({collection.requests.length})
                  </div>

                  {currentCollection === collection.id && (
                    <div className="collection-requests">
                      {collection.requests.map(req => (
                        <div
                          key={req.id}
                          className="request-item"
                          onClick={() => loadRequest(req)}
                        >
                          <span className={`method-badge method-${req.method.toLowerCase()}`}>
                            {req.method}
                          </span>
                          <span className="request-name">{req.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>History</h3>
            <div className="history-list">
              {history.slice(0, 10).map(item => (
                <div
                  key={item.id}
                  className="history-item"
                  onClick={() => setUrl(item.url)}
                >
                  <span className={`method-badge method-${item.method.toLowerCase()}`}>
                    {item.method}
                  </span>
                  <div className="history-details">
                    <div className="history-url">{item.url.substring(0, 40)}...</div>
                    <div className="history-meta">
                      <span className={`status-${Math.floor(item.status / 100)}xx`}>
                        {item.status}
                      </span>
                      <span>{item.time}ms</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Environment</h3>
            <select
              value={currentEnv?.id || ''}
              onChange={(e) => {
                const env = environments.find(env => env.id === parseInt(e.target.value));
                setCurrentEnv(env || null);
              }}
            >
              <option value="">No Environment</option>
              {environments.map(env => (
                <option key={env.id} value={env.id}>{env.name}</option>
              ))}
            </select>

            <button
              className="btn-small"
              onClick={() => {
                const name = prompt('Environment name:');
                if (name) {
                  const newEnv = {
                    id: Date.now(),
                    name,
                    variables: [{ key: 'BASE_URL', value: 'https://api.example.com' }],
                  };
                  setEnvironments([...environments, newEnv]);
                  localStorage.setItem('httpEnvironments', JSON.stringify([...environments, newEnv]));
                }
              }}
            >
              + New Environment
            </button>
          </div>
        </div>

        {/* Main Content - Request Builder */}
        <div className="http-main">
          {/* Request Bar */}
          <div className="request-bar">
            <select
              className="method-select"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
              <option value="HEAD">HEAD</option>
              <option value="OPTIONS">OPTIONS</option>
            </select>

            <input
              type="text"
              className="url-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter request URL (use {{VAR}} for environment variables)"
              onKeyPress={(e) => e.key === 'Enter' && sendRequest()}
            />

            <button
              className="send-button"
              onClick={sendRequest}
              disabled={loading}
            >
              {loading ? '⏳ Sending...' : '▶️ Send'}
            </button>

            <button
              className="save-button"
              onClick={() => setShowSaveDialog(true)}
            >
              💾 Save
            </button>
          </div>

          {/* Request Tabs */}
          <div className="request-tabs">
            <div className="tabs-header">
              <button
                className={activeTab === 'params' ? 'active' : ''}
                onClick={() => setActiveTab('params')}
              >
                Query Params
              </button>
              <button
                className={activeTab === 'headers' ? 'active' : ''}
                onClick={() => setActiveTab('headers')}
              >
                Headers
              </button>
              <button
                className={activeTab === 'auth' ? 'active' : ''}
                onClick={() => setActiveTab('auth')}
              >
                Authorization
              </button>
              <button
                className={activeTab === 'body' ? 'active' : ''}
                onClick={() => setActiveTab('body')}
              >
                Body
              </button>
            </div>

            <div className="tabs-content">
              {/* Query Params Tab */}
              {activeTab === 'params' && (
                <div className="params-editor">
                  <table className="key-value-table">
                    <thead>
                      <tr>
                        <th style={{ width: '30px' }}></th>
                        <th>Key</th>
                        <th>Value</th>
                        <th style={{ width: '50px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {queryParams.map((param, index) => (
                        <tr key={index}>
                          <td>
                            <input
                              type="checkbox"
                              checked={param.enabled}
                              onChange={(e) => updateRow('param', index, 'enabled', e.target.checked)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={param.key}
                              onChange={(e) => updateRow('param', index, 'key', e.target.value)}
                              placeholder="Parameter name"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={param.value}
                              onChange={(e) => updateRow('param', index, 'value', e.target.value)}
                              placeholder="Parameter value"
                            />
                          </td>
                          <td>
                            <button
                              className="btn-remove"
                              onClick={() => removeRow('param', index)}
                            >
                              ❌
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button className="btn-add" onClick={() => addRow('param')}>
                    + Add Parameter
                  </button>
                </div>
              )}

              {/* Headers Tab */}
              {activeTab === 'headers' && (
                <div className="headers-editor">
                  <table className="key-value-table">
                    <thead>
                      <tr>
                        <th style={{ width: '30px' }}></th>
                        <th>Key</th>
                        <th>Value</th>
                        <th style={{ width: '50px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {headers.map((header, index) => (
                        <tr key={index}>
                          <td>
                            <input
                              type="checkbox"
                              checked={header.enabled}
                              onChange={(e) => updateRow('header', index, 'enabled', e.target.checked)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={header.key}
                              onChange={(e) => updateRow('header', index, 'key', e.target.value)}
                              placeholder="Header name"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={header.value}
                              onChange={(e) => updateRow('header', index, 'value', e.target.value)}
                              placeholder="Header value"
                            />
                          </td>
                          <td>
                            <button
                              className="btn-remove"
                              onClick={() => removeRow('header', index)}
                            >
                              ❌
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button className="btn-add" onClick={() => addRow('header')}>
                    + Add Header
                  </button>
                </div>
              )}

              {/* Authorization Tab */}
              {activeTab === 'auth' && (
                <div className="auth-editor">
                  <div className="auth-type-selector">
                    <label>Auth Type:</label>
                    <select value={authType} onChange={(e) => setAuthType(e.target.value)}>
                      <option value="none">No Auth</option>
                      <option value="bearer">Bearer Token</option>
                      <option value="basic">Basic Auth</option>
                      <option value="apikey">API Key</option>
                    </select>
                  </div>

                  {authType === 'bearer' && (
                    <div className="auth-fields">
                      <label>Token:</label>
                      <input
                        type="text"
                        value={authToken}
                        onChange={(e) => setAuthToken(e.target.value)}
                        placeholder="Enter bearer token (supports {{VAR}})"
                      />
                    </div>
                  )}

                  {authType === 'basic' && (
                    <div className="auth-fields">
                      <label>Username:</label>
                      <input
                        type="text"
                        value={authUsername}
                        onChange={(e) => setAuthUsername(e.target.value)}
                        placeholder="Username"
                      />
                      <label>Password:</label>
                      <input
                        type="password"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="Password"
                      />
                    </div>
                  )}

                  {authType === 'apikey' && (
                    <div className="auth-fields">
                      <label>API Key:</label>
                      <input
                        type="text"
                        value={authToken}
                        onChange={(e) => setAuthToken(e.target.value)}
                        placeholder="Enter API key (supports {{VAR}})"
                      />
                      <p className="auth-note">Will be sent as X-API-Key header</p>
                    </div>
                  )}
                </div>
              )}

              {/* Body Tab */}
              {activeTab === 'body' && (
                <div className="body-editor">
                  <div className="body-type-selector">
                    <label>Body Type:</label>
                    <select value={bodyType} onChange={(e) => setBodyType(e.target.value)}>
                      <option value="json">JSON</option>
                      <option value="text">Text</option>
                      <option value="xml">XML</option>
                    </select>
                  </div>

                  <textarea
                    className="body-textarea"
                    value={bodyContent}
                    onChange={(e) => setBodyContent(e.target.value)}
                    placeholder={
                      bodyType === 'json'
                        ? '{\n  "key": "value"\n}'
                        : bodyType === 'xml'
                        ? '<?xml version="1.0"?>\n<root></root>'
                        : 'Enter text content here...'
                    }
                    spellCheck={false}
                  />

                  {bodyType === 'json' && bodyContent && (
                    <button
                      className="btn-format"
                      onClick={() => {
                        try {
                          const formatted = JSON.stringify(JSON.parse(bodyContent), null, 2);
                          setBodyContent(formatted);
                        } catch (e) {
                          alert('Invalid JSON: ' + e.message);
                        }
                      }}
                    >
                      🎨 Format JSON
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Response Section */}
          {response && (
            <div className="response-section">
              <div className="response-header">
                <h3>Response</h3>
                {!response.error && (
                  <div className="response-meta">
                    <span className={`status-badge status-${Math.floor(response.status / 100)}xx`}>
                      {response.status} {response.statusText}
                    </span>
                    <span className="response-time">⏱️ {response.time}ms</span>
                    <span className="response-size">📦 {(response.size / 1024).toFixed(2)}KB</span>
                  </div>
                )}
              </div>

              <div className="response-tabs">
                <div className="tabs-header">
                  <button
                    className={responseTab === 'body' ? 'active' : ''}
                    onClick={() => setResponseTab('body')}
                  >
                    Body
                  </button>
                  <button
                    className={responseTab === 'headers' ? 'active' : ''}
                    onClick={() => setResponseTab('headers')}
                  >
                    Headers
                  </button>
                </div>

                <div className="tabs-content">
                  {responseTab === 'body' && (
                    <div className="response-body">
                      {response.error ? (
                        <div className="error-message">
                          <strong>Error:</strong> {response.message}
                        </div>
                      ) : (
                        <pre className="response-pre">
                          {typeof response.body === 'object'
                            ? formatJSON(response.body)
                            : response.body
                          }
                        </pre>
                      )}
                    </div>
                  )}

                  {responseTab === 'headers' && !response.error && (
                    <div className="response-headers">
                      <table className="headers-table">
                        <thead>
                          <tr>
                            <th>Header</th>
                            <th>Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(response.headers).map(([key, value]) => (
                            <tr key={key}>
                              <td><strong>{key}</strong></td>
                              <td>{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Request Dialog */}
      {showSaveDialog && (
        <div className="modal-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Save Request</h3>
            <input
              type="text"
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              placeholder="Request name (e.g., Get User Profile)"
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={saveRequest}>Save</button>
              <button onClick={() => setShowSaveDialog(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HTTPRequestBuilder;
