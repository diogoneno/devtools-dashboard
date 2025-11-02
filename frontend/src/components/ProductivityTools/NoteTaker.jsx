import { useState, useEffect } from 'react';
import '../ToolLayout.css';

const NoteTaker = () => {
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, []);

  const saveNote = () => {
    if (!currentNote.trim()) return;

    let updatedNotes;
    if (editingId !== null) {
      updatedNotes = notes.map(note =>
        note.id === editingId ? { ...note, content: currentNote, updated: new Date().toISOString() } : note
      );
      setEditingId(null);
    } else {
      const newNote = {
        id: Date.now(),
        content: currentNote,
        created: new Date().toISOString()
      };
      updatedNotes = [newNote, ...notes];
    }

    setNotes(updatedNotes);
    localStorage.setItem('notes', JSON.stringify(updatedNotes));
    setCurrentNote('');
  };

  const deleteNote = (id) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    setNotes(updatedNotes);
    localStorage.setItem('notes', JSON.stringify(updatedNotes));
  };

  const editNote = (note) => {
    setCurrentNote(note.content);
    setEditingId(note.id);
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>Note Taker</h1>
        <p>Quick notes with local storage</p>
      </div>

      <div className="tool-card">
        <div className="input-group">
          <label>{editingId ? 'Edit Note' : 'New Note'}</label>
          <textarea
            value={currentNote}
            onChange={(e) => setCurrentNote(e.target.value)}
            placeholder="Write your note here..."
            style={{ minHeight: '150px' }}
          />
        </div>

        <div className="button-group">
          <button className="btn btn-primary" onClick={saveNote}>
            {editingId ? 'Update Note' : 'Save Note'}
          </button>
          {editingId && (
            <button className="btn btn-secondary" onClick={() => {
              setEditingId(null);
              setCurrentNote('');
            }}>
              Cancel
            </button>
          )}
        </div>

        <div style={{ marginTop: '30px' }}>
          <h3>Saved Notes ({notes.length})</h3>
          {notes.map(note => (
            <div key={note.id} className="result-box" style={{ marginTop: '10px' }}>
              <div style={{ whiteSpace: 'pre-wrap', marginBottom: '10px' }}>
                {note.content}
              </div>
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '10px' }}>
                {new Date(note.created).toLocaleString()}
              </div>
              <div className="button-group">
                <button className="btn btn-primary" onClick={() => editNote(note)}>Edit</button>
                <button className="btn btn-secondary" onClick={() => deleteNote(note.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NoteTaker;
