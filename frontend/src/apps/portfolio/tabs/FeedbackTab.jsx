import { useState, useEffect, useCallback } from 'react';
import portfolioClient from '../../../lib/portfolioClient';
import ReactMarkdown from 'react-markdown';

function FeedbackTab({ moduleSlug }) {
  const [feedback, setFeedback] = useState([]);

  const loadFeedback = useCallback(async () => {
    const data = await portfolioClient.getFeedback(moduleSlug);
    setFeedback(data);
  }, [moduleSlug]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  return (
    <div>
      <h3>Feedback & Assessment</h3>
      {feedback.length === 0 ? (
        <p style={{ color: '#666' }}>No feedback received yet</p>
      ) : (
        feedback.map(fb => (
          <div key={fb.id} className="result-box" style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <strong>{fb.author}</strong>
              <span style={{ fontSize: '12px', color: '#666' }}>
                {new Date(fb.date).toLocaleDateString()}
              </span>
            </div>
            <div style={{ fontSize: '14px', lineHeight: '1.6', marginTop: '10px' }}>
              <ReactMarkdown>{fb.body_md}</ReactMarkdown>
            </div>
            {fb.rubric_scores && Object.keys(fb.rubric_scores).length > 0 && (
              <div style={{ marginTop: '15px', fontSize: '12px' }}>
                <strong>Scores:</strong>
                {Object.entries(fb.rubric_scores).map(([criterion, score]) => (
                  <div key={criterion} style={{ marginLeft: '10px' }}>
                    {criterion}: {score}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default FeedbackTab;
