import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import portfolioClient from '../../lib/portfolioClient';
import OverviewTab from './tabs/OverviewTab';
import OutcomesTab from './tabs/OutcomesTab';
import EvidenceTab from './tabs/EvidenceTab';
import ReflectionsTab from './tabs/ReflectionsTab';
import FeedbackTab from './tabs/FeedbackTab';
import '../../components/ToolLayout.css';

function ModulePage() {
  const { moduleSlug } = useParams();
  const [module, setModule] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadModule();
  }, [moduleSlug]);

  const loadModule = async () => {
    setLoading(true);
    try {
      const data = await portfolioClient.getModule(moduleSlug);
      setModule(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="tool-container"><p>Loading module...</p></div>;
  if (error) return <div className="tool-container"><div className="error-message">{error}</div></div>;
  if (!module) return <div className="tool-container"><p>Module not found</p></div>;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'outcomes', label: 'Outcomes', icon: '🎯' },
    { id: 'evidence', label: 'Evidence', icon: '📄' },
    { id: 'reflections', label: 'Reflections', icon: '📝' },
    { id: 'feedback', label: 'Feedback', icon: '💬' }
  ];

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>{module.name}</h1>
        <p>{module.repo}</p>
      </div>

      <div className="tool-card">
        <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`btn ${activeTab === tab.id ? 'btn-primary' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ padding: '8px 16px' }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: '20px' }}>
          {activeTab === 'overview' && <OverviewTab module={module} />}
          {activeTab === 'outcomes' && <OutcomesTab moduleSlug={moduleSlug} />}
          {activeTab === 'evidence' && <EvidenceTab moduleSlug={moduleSlug} />}
          {activeTab === 'reflections' && <ReflectionsTab moduleSlug={moduleSlug} />}
          {activeTab === 'feedback' && <FeedbackTab moduleSlug={moduleSlug} />}
        </div>
      </div>
    </div>
  );
}

export default ModulePage;
