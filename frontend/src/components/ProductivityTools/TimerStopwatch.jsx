import { useState, useEffect, useRef } from 'react';
import '../ToolLayout.css';

const TimerStopwatch = () => {
  const [mode, setMode] = useState('stopwatch');
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(25);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prev => {
          if (mode === 'timer' && prev <= 0) {
            setIsRunning(false);
            alert('Timer finished!');
            return 0;
          }
          return mode === 'stopwatch' ? prev + 1 : prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, mode]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const start = () => setIsRunning(true);
  const pause = () => setIsRunning(false);
  const reset = () => {
    setIsRunning(false);
    setTime(mode === 'timer' ? timerMinutes * 60 : 0);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setIsRunning(false);
    setTime(newMode === 'timer' ? timerMinutes * 60 : 0);
  };

  return (
    <div className="tool-container">
      <div className="tool-header">
        <h1>Timer / Stopwatch</h1>
        <p>Pomodoro timer and stopwatch</p>
      </div>

      <div className="tool-card">
        <div className="button-group" style={{ marginBottom: '20px' }}>
          <button
            className={`btn ${mode === 'stopwatch' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => switchMode('stopwatch')}
          >
            Stopwatch
          </button>
          <button
            className={`btn ${mode === 'timer' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => switchMode('timer')}
          >
            Timer
          </button>
        </div>

        {mode === 'timer' && !isRunning && time === timerMinutes * 60 && (
          <div className="input-group">
            <label>Timer Duration (minutes)</label>
            <input
              type="number"
              value={timerMinutes}
              onChange={(e) => {
                setTimerMinutes(parseInt(e.target.value) || 25);
                setTime(parseInt(e.target.value) * 60 || 25 * 60);
              }}
            />
          </div>
        )}

        <div className="result-box" style={{ textAlign: 'center', fontSize: '48px', fontWeight: 'bold', marginBottom: '20px' }}>
          {formatTime(time)}
        </div>

        <div className="button-group">
          {!isRunning ? (
            <button className="btn btn-success" onClick={start}>Start</button>
          ) : (
            <button className="btn btn-secondary" onClick={pause}>Pause</button>
          )}
          <button className="btn btn-primary" onClick={reset}>Reset</button>
        </div>
      </div>
    </div>
  );
};

export default TimerStopwatch;
