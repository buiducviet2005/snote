import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, Coffee, Sparkles } from 'lucide-react';

interface WorkspaceTimerProps {
  onSessionComplete?: (sessionCount: number) => void;
}

export const WorkspaceTimer: React.FC<WorkspaceTimerProps> = ({ onSessionComplete }) => {
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60); // 25 minutes default
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [mode, setMode] = useState<'FOCUS' | 'BREAK'>('FOCUS');
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Timer tick
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      // Completed a cycle
      setIsRunning(false);
      if (mode === 'FOCUS') {
        const nextCount = completedSessions + 1;
        setCompletedSessions(nextCount);
        if (onSessionComplete) onSessionComplete(nextCount);
        // Switch to 5 min break
        setMode('BREAK');
        setTimeLeft(5 * 60);
      } else {
        // Switch back to 25 min focus
        setMode('FOCUS');
        setTimeLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, completedSessions, onSessionComplete]);

  // Click outside to close popover
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsPopoverOpen(false);
      }
    };
    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isPopoverOpen]);

  const toggleRun = () => setIsRunning(!isRunning);

  const resetTimer = (newMode?: 'FOCUS' | 'BREAK') => {
    setIsRunning(false);
    const targetMode = newMode || mode;
    setMode(targetMode);
    setTimeLeft(targetMode === 'FOCUS' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="ws-timer-container" ref={popoverRef}>
      {/* Timer Trigger Pill */}
      <button
        type="button"
        className={`ws-timer-pill ${isRunning ? 'running' : ''} ${mode === 'BREAK' ? 'break' : ''}`}
        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
        title="Đồng hồ học tập tập trung (Pomodoro Study Timer)"
      >
        <span className={`ws-timer-dot ${isRunning ? 'pulse' : ''}`} />
        <span className="ws-timer-time">{formatTime(timeLeft)}</span>
        <span className="ws-timer-mode-tag">
          {mode === 'FOCUS' ? 'Tập trung' : 'Nghỉ'}
        </span>
      </button>

      {/* Popover Controls */}
      {isPopoverOpen && (
        <div className="ws-timer-popover">
          <div className="ws-timer-popover-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={15} style={{ color: 'var(--accent)' }} />
              <span style={{ fontWeight: 700, fontSize: '13px' }}>
                {mode === 'FOCUS' ? 'Phiên Tập Trung Học Tập' : 'Nghỉ Giải Lao'}
              </span>
            </div>
            <span className="ws-timer-counter-tag">
              Đã xong: {completedSessions} phiên
            </span>
          </div>

          {/* Big Time Display */}
          <div className="ws-timer-big-display">
            {formatTime(timeLeft)}
          </div>

          {/* Quick Mode Switches */}
          <div className="ws-timer-mode-toggles">
            <button
              type="button"
              className={`ws-timer-mode-btn ${mode === 'FOCUS' ? 'active' : ''}`}
              onClick={() => resetTimer('FOCUS')}
            >
              <Sparkles size={13} />
              <span>25m Học tập</span>
            </button>
            <button
              type="button"
              className={`ws-timer-mode-btn ${mode === 'BREAK' ? 'active' : ''}`}
              onClick={() => resetTimer('BREAK')}
            >
              <Coffee size={13} />
              <span>5m Nghỉ ngơi</span>
            </button>
          </div>

          {/* Main Action Buttons */}
          <div className="ws-timer-actions">
            <button
              type="button"
              className={`btn ws-timer-play-btn ${isRunning ? 'btn-secondary' : 'btn-primary'}`}
              onClick={toggleRun}
            >
              {isRunning ? <Pause size={14} /> : <Play size={14} />}
              <span>{isRunning ? 'Tạm dừng' : 'Bắt đầu ngay'}</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary icon-button"
              onClick={() => resetTimer()}
              title="Đặt lại đồng hồ"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

