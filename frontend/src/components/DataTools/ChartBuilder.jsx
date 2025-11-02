import { useState } from 'react';
import '../ToolLayout.css';

const ChartBuilder = () => {
  const [chartType, setChartType] = useState('bar');
  const [data, setData] = useState('10,25,15,30,20');
  const [labels, setLabels] = useState('A,B,C,D,E');

  const parseData = () => {
    return data.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
  };

  const parseLabels = () => {
    return labels.split(',').map(l => l.trim());
  };

  const renderBarChart = () => {
    const values = parseData();
    const labelArray = parseLabels();
    const max = Math.max(...values);

    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', height: '300px', gap: '10px' }}>
        {values.map((value, idx) => (
          <div key={idx} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{
              background: '#3498db',
              height: `${(value / max) * 100}%`,
              minHeight: '20px',
              position: 'relative'
            }}>
              <span style={{
                position: 'absolute',
                top: '-25px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontWeight: 'bold'
              }}>
                {value}
              </span>
            </div>
            <div style={{ marginTop: '10px', fontWeight: 'bold' }}>
              {labelArray[idx] || `Item ${idx + 1}`}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderLineChart = () => {
    const values = parseData();
    const labelArray = parseLabels();
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min;

    return (
      <div>
        <svg width="100%" height="300" style={{ background: '#f8f9fa', borderRadius: '5px' }}>
          {values.map((value, idx) => {
            if (idx === values.length - 1) return null;
            const x1 = (idx / (values.length - 1)) * 100;
            const y1 = 100 - ((value - min) / range) * 80;
            const x2 = ((idx + 1) / (values.length - 1)) * 100;
            const y2 = 100 - ((values[idx + 1] - min) / range) * 80;

            return (
              <line
                key={idx}
                x1={`${x1}%`}
                y1={`${y1}%`}
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke="#3498db"
                strokeWidth="3"
              />
            );
          })}
          {values.map((value, idx) => {
            const x = (idx / (values.length - 1)) * 100;
            const y = 100 - ((value - min) / range) * 80;

            return (
              <g key={idx}>
                <circle cx={`${x}%`} cy={`${y}%`} r="5" fill="#e74c3c" />
                <text x={`${x}%`} y={`${y - 5}%`} textAnchor="middle" fontSize="12" fill="#2c3e50">
                  {value}
                </text>
              </g>
            );
          })}
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '10px' }}>
          {labelArray.map((label, idx) => (
            <div key={idx} style={{ fontWeight: 'bold' }}>
              {label || `Point ${idx + 1}`}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPieChart = () => {
    const values = parseData();
    const labelArray = parseLabels();
    const total = values.reduce((sum, v) => sum + v, 0);
    const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];

    let currentAngle = 0;

    return (
      <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
        <svg width="300" height="300">
          {values.map((value, idx) => {
            const percentage = value / total;
            const angle = percentage * 360;
            const startAngle = currentAngle;
            currentAngle += angle;

            const x1 = 150 + 100 * Math.cos((startAngle - 90) * Math.PI / 180);
            const y1 = 150 + 100 * Math.sin((startAngle - 90) * Math.PI / 180);
            const x2 = 150 + 100 * Math.cos((startAngle + angle - 90) * Math.PI / 180);
            const y2 = 150 + 100 * Math.sin((startAngle + angle - 90) * Math.PI / 180);

            const largeArc = angle > 180 ? 1 : 0;

            return (
              <path
                key={idx}
                d={`M 150 150 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={colors[idx % colors.length]}
              />
            );
          })}
        </svg>
        <div>
          {values.map((value, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{
                width: '20px',
                height: '20px',
                background: colors[idx % colors.length],
                marginRight: '10px',
                borderRadius: '3px'
              }} />
              <span>{labelArray[idx] || `Slice ${idx + 1}`}: {value} ({((value / total) * 100).toFixed(1)}%)</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>Chart Builder</h1>
        <p>Create quick charts from data</p>
      </div>

      <div className="tool-card">
        <div className="input-group">
          <label>Chart Type</label>
          <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="pie">Pie Chart</option>
          </select>
        </div>

        <div className="input-group">
          <label>Data (comma-separated numbers)</label>
          <input
            type="text"
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder="10,25,15,30,20"
          />
        </div>

        <div className="input-group">
          <label>Labels (comma-separated)</label>
          <input
            type="text"
            value={labels}
            onChange={(e) => setLabels(e.target.value)}
            placeholder="A,B,C,D,E"
          />
        </div>

        <div className="result-box" style={{ padding: '30px' }}>
          {chartType === 'bar' && renderBarChart()}
          {chartType === 'line' && renderLineChart()}
          {chartType === 'pie' && renderPieChart()}
        </div>
      </div>
    </div>
  );
};

export default ChartBuilder;
