import { useState } from 'react';
import '../ToolLayout.css';

const JSONSchemaGenerator = () => {
  const [fields, setFields] = useState([{ name: 'example', type: 'string', required: true, description: '' }]);
  const [schema, setSchema] = useState(null);

  const types = ['string', 'number', 'integer', 'boolean', 'array', 'object', 'null'];

  const addField = () => {
    setFields([...fields, { name: `field${fields.length + 1}`, type: 'string', required: false, description: '' }]);
  };

  const updateField = (index, key, value) => {
    const newFields = [...fields];
    newFields[index][key] = value;
    setFields(newFields);
  };

  const removeField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const generateSchema = () => {
    const properties = {};
    const required = [];

    fields.forEach(field => {
      properties[field.name] = {
        type: field.type
      };
      if (field.description) {
        properties[field.name].description = field.description;
      }
      if (field.required) {
        required.push(field.name);
      }
    });

    const generatedSchema = {
      type: 'object',
      properties,
      required
    };

    setSchema(generatedSchema);
  };

  const copySchema = () => {
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
  };

  const templates = {
    user: [
      { name: 'name', type: 'string', required: true, description: 'User full name' },
      { name: 'email', type: 'string', required: true, description: 'Email address' },
      { name: 'age', type: 'integer', required: false, description: 'User age' }
    ],
    product: [
      { name: 'id', type: 'string', required: true, description: 'Product ID' },
      { name: 'title', type: 'string', required: true, description: 'Product title' },
      { name: 'price', type: 'number', required: true, description: 'Price in USD' },
      { name: 'inStock', type: 'boolean', required: false, description: 'Availability' }
    ],
    article: [
      { name: 'title', type: 'string', required: true, description: 'Article title' },
      { name: 'content', type: 'string', required: true, description: 'Main content' },
      { name: 'author', type: 'string', required: true, description: 'Author name' },
      { name: 'tags', type: 'array', required: false, description: 'Tags array' },
      { name: 'publishedAt', type: 'string', required: false, description: 'ISO date string' }
    ]
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>📋 JSON Schema Generator</h1>
        <p>Generate JSON schemas for structured LLM outputs (OpenAI, Anthropic)</p>
      </div>

      <div className="tool-card">
        <div className="info-message">
          <strong>💡 Use Case:</strong> Define schemas for function calling, structured outputs, and API responses
        </div>

        <div className="input-group">
          <label>Quick Templates</label>
          <select onChange={(e) => e.target.value && setFields(templates[e.target.value])} defaultValue="">
            <option value="">Load template...</option>
            <option value="user">User Profile</option>
            <option value="product">Product</option>
            <option value="article">Article/Blog Post</option>
          </select>
        </div>

        <div className="result-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h4>Schema Fields</h4>
            <button className="btn btn-success" onClick={addField}>+ Add Field</button>
          </div>

          {fields.map((field, idx) => (
            <div key={idx} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.5fr 1fr auto',
              gap: '10px',
              marginBottom: '10px',
              padding: '10px',
              background: '#f8f9fa',
              borderRadius: '5px'
            }}>
              <input
                type="text"
                value={field.name}
                onChange={(e) => updateField(idx, 'name', e.target.value)}
                placeholder="Field name"
                style={{ padding: '8px' }}
              />
              <select
                value={field.type}
                onChange={(e) => updateField(idx, 'type', e.target.value)}
                style={{ padding: '8px' }}
              >
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => updateField(idx, 'required', e.target.checked)}
                  style={{ width: 'auto' }}
                />
                Required
              </label>
              <button className="btn btn-secondary" onClick={() => removeField(idx)}>✕</button>
              <input
                type="text"
                value={field.description}
                onChange={(e) => updateField(idx, 'description', e.target.value)}
                placeholder="Description (optional)"
                style={{ padding: '8px', gridColumn: '1 / -1' }}
              />
            </div>
          ))}
        </div>

        <button className="btn btn-primary" onClick={generateSchema}>Generate JSON Schema</button>

        {schema && (
          <div className="result-box" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4>Generated Schema</h4>
              <button className="btn btn-success" onClick={copySchema}>Copy Schema</button>
            </div>
            <pre style={{ background: '#2c3e50', color: '#ecf0f1', padding: '15px', borderRadius: '5px', overflow: 'auto' }}>
              {JSON.stringify(schema, null, 2)}
            </pre>
          </div>
        )}

        {schema && (
          <div className="result-box">
            <h4>Example Usage (OpenAI Function Calling)</h4>
            <pre style={{ background: '#f8f9fa', padding: '15px', borderRadius: '5px', overflow: 'auto', fontSize: '12px' }}>
{`{
  "name": "extract_data",
  "description": "Extract structured data",
  "parameters": ${JSON.stringify(schema, null, 2)}
}`}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default JSONSchemaGenerator;
