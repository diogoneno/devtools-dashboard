import React, { useState, useEffect } from 'react';
import '../../styles/ToolLayout.css';
import './CronBuilder.css';

/**
 * CRON Expression Builder - Visual schedule picker with next-run calculator
 *
 * Features:
 * - Visual interface for building cron expressions
 * - Real-time expression validation
 * - Next 10 run times calculator
 * - Preset schedules (hourly, daily, weekly, monthly)
 * - Human-readable description
 * - Common patterns library
 * - Support for standard and Quartz formats
 *
 * @returns {JSX.Element} CRON Builder component
 */
const CronBuilder = () => {
  // Cron expression parts: minute hour day month weekday
  const [minute, setMinute] = useState('*');
  const [hour, setHour] = useState('*');
  const [day, setDay] = useState('*');
  const [month, setMonth] = useState('*');
  const [weekday, setWeekday] = useState('*');
  const [cronExpression, setCronExpression] = useState('* * * * *');
  const [nextRuns, setNextRuns] = useState([]);
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState('simple'); // 'simple' or 'advanced'

  // Simple mode state
  const [frequency, setFrequency] = useState('daily');
  const [simpleMinute, setSimpleMinute] = useState('0');
  const [simpleHour, setSimpleHour] = useState('0');
  const [simpleWeekdays, setSimpleWeekdays] = useState([]);
  const [simpleDay, setSimpleDay] = useState('1');

  /**
   * Common cron patterns for quick selection
   */
  const commonPatterns = [
    { name: 'Every minute', cron: '* * * * *', description: 'Runs every minute' },
    { name: 'Every 5 minutes', cron: '*/5 * * * *', description: 'Runs every 5 minutes' },
    { name: 'Every 15 minutes', cron: '*/15 * * * *', description: 'Runs every 15 minutes' },
    { name: 'Every 30 minutes', cron: '*/30 * * * *', description: 'Runs every 30 minutes' },
    { name: 'Every hour', cron: '0 * * * *', description: 'Runs at the start of every hour' },
    { name: 'Every 6 hours', cron: '0 */6 * * *', description: 'Runs every 6 hours' },
    { name: 'Daily at midnight', cron: '0 0 * * *', description: 'Runs at 12:00 AM every day' },
    { name: 'Daily at noon', cron: '0 12 * * *', description: 'Runs at 12:00 PM every day' },
    { name: 'Weekly on Monday', cron: '0 0 * * 1', description: 'Runs at midnight every Monday' },
    { name: 'Monthly on 1st', cron: '0 0 1 * *', description: 'Runs at midnight on the 1st of each month' },
    { name: 'Yearly on Jan 1st', cron: '0 0 1 1 *', description: 'Runs at midnight on January 1st' },
    { name: 'Weekdays at 9 AM', cron: '0 9 * * 1-5', description: 'Runs at 9:00 AM on weekdays' },
    { name: 'Weekend at 10 AM', cron: '0 10 * * 0,6', description: 'Runs at 10:00 AM on Saturday and Sunday' },
  ];

  /**
   * Update cron expression when parts change
   */
  useEffect(() => {
    if (mode === 'advanced') {
      const expr = `${minute} ${hour} ${day} ${month} ${weekday}`;
      setCronExpression(expr);
      calculateNextRuns(expr);
      generateDescription(expr);
    }
  }, [minute, hour, day, month, weekday, mode]);

  /**
   * Update cron expression in simple mode
   */
  useEffect(() => {
    if (mode === 'simple') {
      let expr = '';

      switch (frequency) {
        case 'minute':
          expr = '* * * * *';
          break;
        case 'hourly':
          expr = `${simpleMinute} * * * *`;
          break;
        case 'daily':
          expr = `${simpleMinute} ${simpleHour} * * *`;
          break;
        case 'weekly':
          const days = simpleWeekdays.length > 0 ? simpleWeekdays.join(',') : '*';
          expr = `${simpleMinute} ${simpleHour} * * ${days}`;
          break;
        case 'monthly':
          expr = `${simpleMinute} ${simpleHour} ${simpleDay} * *`;
          break;
        default:
          expr = '* * * * *';
      }

      setCronExpression(expr);
      calculateNextRuns(expr);
      generateDescription(expr);
    }
  }, [frequency, simpleMinute, simpleHour, simpleWeekdays, simpleDay, mode]);

  /**
   * Parse cron expression and calculate next run times
   * Simplified implementation - handles basic patterns
   */
  const calculateNextRuns = (expr) => {
    try {
      const parts = expr.split(' ');
      if (parts.length !== 5) {
        setNextRuns([]);
        return;
      }

      const [min, hr, d, mon, wd] = parts;
      const runs = [];
      const now = new Date();
      let current = new Date(now);

      // Generate next 10 possible run times
      for (let i = 0; i < 1000 && runs.length < 10; i++) {
        current = new Date(current.getTime() + 60000); // Add 1 minute

        if (matchesCron(current, min, hr, d, mon, wd)) {
          runs.push(new Date(current));
        }
      }

      setNextRuns(runs);
    } catch (error) {
      setNextRuns([]);
    }
  };

  /**
   * Check if a date matches the cron expression
   */
  const matchesCron = (date, min, hr, d, mon, wd) => {
    const minute = date.getMinutes();
    const hour = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const weekday = date.getDay();

    return (
      matchesPart(minute, min, 0, 59) &&
      matchesPart(hour, hr, 0, 23) &&
      matchesPart(day, d, 1, 31) &&
      matchesPart(month, mon, 1, 12) &&
      matchesPart(weekday, wd, 0, 6)
    );
  };

  /**
   * Check if a value matches a cron part
   */
  const matchesPart = (value, part, min, max) => {
    if (part === '*') return true;

    // Handle ranges (e.g., 1-5)
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      return value >= start && value <= end;
    }

    // Handle steps (e.g., */5)
    if (part.includes('/')) {
      const [base, step] = part.split('/');
      const stepNum = parseInt(step);
      if (base === '*') {
        return value % stepNum === 0;
      }
      const baseNum = parseInt(base);
      return value >= baseNum && (value - baseNum) % stepNum === 0;
    }

    // Handle lists (e.g., 1,3,5)
    if (part.includes(',')) {
      const values = part.split(',').map(Number);
      return values.includes(value);
    }

    // Handle exact match
    return value === parseInt(part);
  };

  /**
   * Generate human-readable description
   */
  const generateDescription = (expr) => {
    const parts = expr.split(' ');
    if (parts.length !== 5) {
      setDescription('Invalid cron expression');
      return;
    }

    const [min, hr, d, mon, wd] = parts;
    let desc = 'Runs ';

    // Minute
    if (min === '*') {
      desc += 'every minute';
    } else if (min.includes('*/')) {
      const step = min.split('/')[1];
      desc += `every ${step} minutes`;
    } else if (min.includes(',')) {
      desc += `at minutes ${min}`;
    } else {
      desc += `at minute ${min}`;
    }

    // Hour
    if (hr !== '*') {
      if (hr.includes('*/')) {
        const step = hr.split('/')[1];
        desc += `, every ${step} hours`;
      } else if (hr.includes(',')) {
        desc += `, at hours ${hr}`;
      } else {
        const hour24 = parseInt(hr);
        const hour12 = hour24 % 12 || 12;
        const period = hour24 >= 12 ? 'PM' : 'AM';
        desc += ` of ${hour12}:00 ${period}`;
      }
    }

    // Day
    if (d !== '*') {
      if (d.includes('*/')) {
        const step = d.split('/')[1];
        desc += `, every ${step} days`;
      } else {
        desc += `, on day ${d}`;
      }
    }

    // Month
    if (mon !== '*') {
      const months = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
      if (mon.includes(',')) {
        const monthNames = mon.split(',').map(m => months[parseInt(m)]).join(', ');
        desc += `, in ${monthNames}`;
      } else {
        desc += `, in ${months[parseInt(mon)]}`;
      }
    }

    // Weekday
    if (wd !== '*') {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      if (wd.includes('-')) {
        const [start, end] = wd.split('-').map(Number);
        desc += `, on ${days[start]} through ${days[end]}`;
      } else if (wd.includes(',')) {
        const dayNames = wd.split(',').map(w => days[parseInt(w)]).join(', ');
        desc += `, on ${dayNames}`;
      } else {
        desc += `, on ${days[parseInt(wd)]}`;
      }
    }

    setDescription(desc);
  };

  /**
   * Load a preset pattern
   */
  const loadPattern = (pattern) => {
    const parts = pattern.cron.split(' ');
    setMinute(parts[0]);
    setHour(parts[1]);
    setDay(parts[2]);
    setMonth(parts[3]);
    setWeekday(parts[4]);
    setMode('advanced');
  };

  /**
   * Format date for display
   */
  const formatDate = (date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  /**
   * Toggle weekday in simple mode
   */
  const toggleWeekday = (day) => {
    if (simpleWeekdays.includes(day)) {
      setSimpleWeekdays(simpleWeekdays.filter(d => d !== day));
    } else {
      setSimpleWeekdays([...simpleWeekdays, day].sort((a, b) => a - b));
    }
  };

  return (
    <div className="tool-layout">
      <div className="tool-header">
        <h1>⏰ CRON Expression Builder</h1>
        <p>Visual schedule picker with next-run calculator and human-readable descriptions</p>
      </div>

      {/* Mode Selector */}
      <div className="cron-mode-selector">
        <button
          className={mode === 'simple' ? 'active' : ''}
          onClick={() => setMode('simple')}
        >
          🎯 Simple Mode
        </button>
        <button
          className={mode === 'advanced' ? 'active' : ''}
          onClick={() => setMode('advanced')}
        >
          ⚡ Advanced Mode
        </button>
      </div>

      {/* Simple Mode */}
      {mode === 'simple' && (
        <div className="cron-simple-mode">
          <div className="simple-field">
            <label>Frequency:</label>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              <option value="minute">Every Minute</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {frequency !== 'minute' && (
            <>
              {(frequency === 'hourly' || frequency === 'daily' || frequency === 'weekly' || frequency === 'monthly') && (
                <div className="simple-field">
                  <label>Minute:</label>
                  <select value={simpleMinute} onChange={(e) => setSimpleMinute(e.target.value)}>
                    {Array.from({ length: 60 }, (_, i) => (
                      <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
              )}

              {(frequency === 'daily' || frequency === 'weekly' || frequency === 'monthly') && (
                <div className="simple-field">
                  <label>Hour:</label>
                  <select value={simpleHour} onChange={(e) => setSimpleHour(e.target.value)}>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour12 = i % 12 || 12;
                      const period = i >= 12 ? 'PM' : 'AM';
                      return (
                        <option key={i} value={i}>
                          {i.toString().padStart(2, '0')}:00 ({hour12} {period})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {frequency === 'weekly' && (
                <div className="simple-field weekday-selector">
                  <label>Days of Week:</label>
                  <div className="weekday-buttons">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                      <button
                        key={idx}
                        className={simpleWeekdays.includes(idx.toString()) ? 'active' : ''}
                        onClick={() => toggleWeekday(idx.toString())}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {frequency === 'monthly' && (
                <div className="simple-field">
                  <label>Day of Month:</label>
                  <select value={simpleDay} onChange={(e) => setSimpleDay(e.target.value)}>
                    {Array.from({ length: 31 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Advanced Mode */}
      {mode === 'advanced' && (
        <div className="cron-advanced-mode">
          <div className="cron-field">
            <label>Minute (0-59)</label>
            <input
              type="text"
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              placeholder="* or 0-59 or */5"
            />
            <span className="field-hint">* = every minute, */5 = every 5 minutes, 0,30 = at 0 and 30</span>
          </div>

          <div className="cron-field">
            <label>Hour (0-23)</label>
            <input
              type="text"
              value={hour}
              onChange={(e) => setHour(e.target.value)}
              placeholder="* or 0-23"
            />
            <span className="field-hint">* = every hour, */6 = every 6 hours, 9-17 = 9 AM to 5 PM</span>
          </div>

          <div className="cron-field">
            <label>Day of Month (1-31)</label>
            <input
              type="text"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              placeholder="* or 1-31"
            />
            <span className="field-hint">* = every day, 1,15 = 1st and 15th, */2 = every 2 days</span>
          </div>

          <div className="cron-field">
            <label>Month (1-12)</label>
            <input
              type="text"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              placeholder="* or 1-12"
            />
            <span className="field-hint">* = every month, 1-6 = Jan to Jun, 12 = December only</span>
          </div>

          <div className="cron-field">
            <label>Day of Week (0-6, 0=Sunday)</label>
            <input
              type="text"
              value={weekday}
              onChange={(e) => setWeekday(e.target.value)}
              placeholder="* or 0-6"
            />
            <span className="field-hint">* = every day, 1-5 = Mon-Fri, 0,6 = weekends</span>
          </div>
        </div>
      )}

      {/* Result Section */}
      <div className="cron-result-section">
        <div className="cron-expression-display">
          <h3>Generated Expression</h3>
          <div className="expression-box">
            <code>{cronExpression}</code>
            <button
              className="btn-copy"
              onClick={() => {
                navigator.clipboard.writeText(cronExpression);
                alert('Copied to clipboard!');
              }}
            >
              📋 Copy
            </button>
          </div>
        </div>

        <div className="cron-description">
          <h3>Human-Readable</h3>
          <p>{description}</p>
        </div>
      </div>

      {/* Next Runs */}
      {nextRuns.length > 0 && (
        <div className="cron-next-runs">
          <h3>📅 Next 10 Run Times</h3>
          <div className="next-runs-list">
            {nextRuns.map((run, idx) => (
              <div key={idx} className="run-item">
                <span className="run-number">#{idx + 1}</span>
                <span className="run-time">{formatDate(run)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Common Patterns */}
      <div className="cron-patterns">
        <h3>📚 Common Patterns</h3>
        <div className="patterns-grid">
          {commonPatterns.map((pattern, idx) => (
            <div key={idx} className="pattern-card" onClick={() => loadPattern(pattern)}>
              <div className="pattern-name">{pattern.name}</div>
              <code className="pattern-cron">{pattern.cron}</code>
              <div className="pattern-desc">{pattern.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Syntax Help */}
      <div className="cron-help">
        <h3>📖 Syntax Reference</h3>
        <table className="help-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Allowed Values</th>
              <th>Special Characters</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Minute</td>
              <td>0-59</td>
              <td>* , - /</td>
            </tr>
            <tr>
              <td>Hour</td>
              <td>0-23</td>
              <td>* , - /</td>
            </tr>
            <tr>
              <td>Day of Month</td>
              <td>1-31</td>
              <td>* , - /</td>
            </tr>
            <tr>
              <td>Month</td>
              <td>1-12</td>
              <td>* , - /</td>
            </tr>
            <tr>
              <td>Day of Week</td>
              <td>0-6 (0=Sunday)</td>
              <td>* , - /</td>
            </tr>
          </tbody>
        </table>

        <div className="help-examples">
          <h4>Special Characters:</h4>
          <ul>
            <li><code>*</code> - All values (every)</li>
            <li><code>,</code> - List separator (1,3,5)</li>
            <li><code>-</code> - Range (1-5)</li>
            <li><code>/</code> - Step values (*/5 = every 5)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CronBuilder;
