import { useState, useEffect, useCallback } from 'react';
import portfolioClient from '../../../lib/portfolioClient';
import ReactMarkdown from 'react-markdown';

function ReflectionsTab({ moduleSlug }) {
  const [reflections, setReflections] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const loadReflections = useCallback(async () => {
    const data = await portfolioClient.getReflections(moduleSlug);
    setReflections(data);
  }, [moduleSlug]);

  useEffect(() => {
    loadReflections();
  }, [loadReflections]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !body) return;

    try {
      await portfolioClient.addReflection(moduleSlug, {
        title,
        body_md: body,
        date: new Date().toISOString().split('T')[0]
      });
      setTitle('');
      setBody('');
      setShowForm(false);
      loadReflections();
    } catch (error) {
      alert('Failed to add reflection: ' + error.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Reflection Journal</h3>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Reflection'}
        </button>
      </div>

      {showForm && (
        <div className="tool-card" style={{ marginTop: '15px', backgroundColor: '#f9f9f9' }}>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What did you learn?"
                required
              />
            </div>
            <div className="input-group">
              <label>Reflection (Markdown supported)</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows="8"
                placeholder="Describe your learning experience, challenges, insights..."
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Save Reflection</button>
          </form>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        {reflections.length === 0 ? (
          <p style={{ color: '#666' }}>No reflections yet. Click "New Reflection" to add one.</p>
        ) : (
          reflections.map(reflection => (
            <div key={reflection.id} className="result-box" style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h4>{reflection.title}</h4>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {new Date(reflection.date).toLocaleDateString()}
                </span>
              </div>
              <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                <ReactMarkdown>{reflection.body_md}</ReactMarkdown>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ReflectionsTab;
