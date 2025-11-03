import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Network } from 'vis-network';
import '../ToolLayout.css';

const NLP_API = import.meta.env.VITE_MISINFO_NLP_API ? `${import.meta.env.VITE_MISINFO_NLP_API}/nlp` : 'http://localhost:5003/api/nlp';

function PropagationGraphs() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [graphData, setGraphData] = useState(null);
  const [windowHours, setWindowHours] = useState(24);
  const networkRef = useRef(null);
  const containerRef = useRef(null);

  const renderGraph = useCallback((edges) => {
    if (!containerRef.current || edges.length === 0) return;

    const nodes = new Set();
    edges.forEach(edge => {
      nodes.add(edge.src_url);
      nodes.add(edge.dst_url);
    });

    const visNodes = Array.from(nodes).map((url) => ({
      id: url,
      label: new URL(url).hostname || url.substring(0, 30),
      title: url
    }));

    const visEdges = edges.map(edge => ({
      from: edge.src_url,
      to: edge.dst_url,
      value: edge.weight
    }));

    const data = { nodes: visNodes, edges: visEdges };
    const options = {
      nodes: {
        shape: 'dot',
        size: 16,
        font: { size: 12 }
      },
      edges: {
        arrows: 'to',
        smooth: { type: 'continuous' }
      },
      physics: {
        stabilization: { iterations: 200 },
        barnesHut: { gravitationalConstant: -2000, springLength: 100 }
      }
    };

    if (networkRef.current) networkRef.current.destroy();
    networkRef.current = new Network(containerRef.current, data, options);
  }, []);

  const loadGraphData = useCallback(async () => {
    try {
      const response = await axios.get(`${NLP_API}/graph`, { params: { limit: 500 } });
      renderGraph(response.data.edges);
    } catch (err) {
      setError(err.message);
    }
  }, [renderGraph]);

  const buildGraph = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${NLP_API}/build-graph`, { windowHours });
      setGraphData(response.data);
      loadGraphData();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraphData();
  }, [loadGraphData]);

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>Propagation & Community Graphs</h1>
        <p>Visualize URL co-shares, co-mentions, and topic clusters</p>
      </div>

      <div className="tool-card">
        <h3>Build Graph</h3>
        <div className="input-group">
          <label>Time Window (hours)</label>
          <input
            type="number"
            value={windowHours}
            onChange={(e) => setWindowHours(parseInt(e.target.value))}
            min="1"
            max="168"
          />
        </div>
        <button className="btn btn-primary" onClick={buildGraph} disabled={loading}>
          {loading ? 'Building...' : 'Build Graph from Ingested Items'}
        </button>
        <button className="btn" onClick={loadGraphData} style={{ marginLeft: '10px' }}>
          Load Existing Graph
        </button>

        {graphData && (
          <div className="success-message" style={{ marginTop: '15px' }}>
            {graphData.message}
          </div>
        )}

        {error && <div className="error-message" style={{ marginTop: '15px' }}>{error}</div>}
      </div>

      <div className="tool-card">
        <h3>Graph Visualization</h3>
        <div
          ref={containerRef}
          style={{
            width: '100%',
            height: '600px',
            border: '1px solid #ddd',
            backgroundColor: '#fafafa'
          }}
        />
        <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          Nodes: URLs/Outlets | Edges: Co-mentions | Click and drag to explore
        </p>
      </div>

      <div className="tool-card">
        <h3>About</h3>
        <p>Analyzes how URLs and domains are connected through co-mentions in ingested content.</p>
      </div>
    </div>
  );
}

export default PropagationGraphs;
