import React, { useState, useMemo } from 'react';
import { TaskStatus, TaskPriority } from '@snote/shared';
import { useLanguage } from '../../../contexts/LanguageContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Plus,
  Sparkles,
  Layers
} from 'lucide-react';

interface TasksHourlyViewProps {
  tasks: any[];
  onSelectTask: (task: any) => void;
  onToggleStatus?: (id: string, currentStatus: TaskStatus) => void;
  onOpenCreate?: () => void;
}

export const TasksHourlyView: React.FC<TasksHourlyViewProps> = ({
  tasks,
  onSelectTask,
  onToggleStatus,
  onOpenCreate
}) => {
  const { t, language } = useLanguage();
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  // Navigation handlers
  const handlePrevDay = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev.getTime());
      next.setDate(next.getDate() - 1);
      return next;
    });
  };

  const handleNextDay = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev.getTime());
      next.setDate(next.getDate() + 1);
      return next;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const parts = e.target.value.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      if (!isNaN(d.getTime())) {
        setCurrentDate(d);
      }
    }
  };

  // Helper date comparison
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // Formatted date string for header
  const headerDateStr = useMemo(() => {
    if (language === 'vi') {
      const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayName = days[currentDate.getDay()];
      return `${dayName}, ngày ${currentDate.getDate()} tháng ${currentDate.getMonth() + 1}, ${currentDate.getFullYear()}`;
    } else {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }
  }, [currentDate, language]);

  const dateInputValue = useMemo(() => {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}-${pad(currentDate.getDate())}`;
  }, [currentDate]);

  // Partition tasks for this day into:
  // 1. All-day / Untimed tasks
  // 2. Timed tasks with hours falling into 06:00 - 23:00
  const { allDayTasks, timedTasks } = useMemo(() => {
    const allDay: any[] = [];
    const timed: any[] = [];

    const dayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0, 0).getTime();
    const dayEnd = dayStart + 86400000;

    tasks.forEach((task) => {
      const rawStart = task.startDate || task.startAt;
      const rawDue = task.dueDate || task.dueAt;
      const targetDate = rawDue ? new Date(rawDue) : rawStart ? new Date(rawStart) : null;

      if (!targetDate || isNaN(targetDate.getTime())) return;

      // Check if task falls on current day
      const targetTime = targetDate.getTime();
      const inRange = targetTime >= dayStart && targetTime < dayEnd;
      
      // Also check multi-day span
      let spanMatches = false;
      if (rawStart && rawDue) {
        const sTime = new Date(rawStart).getTime();
        const dTime = new Date(rawDue).getTime();
        if (sTime <= dayEnd && dTime >= dayStart) {
          spanMatches = true;
        }
      }

      if (!inRange && !spanMatches) return;

      // Check if it has specific hour (not midnight 00:00:00)
      const hours = targetDate.getHours();
      const minutes = targetDate.getMinutes();
      const hasSpecificTime = !(hours === 0 && minutes === 0 && targetDate.getSeconds() === 0);

      if (hasSpecificTime && hours >= 6 && hours <= 23) {
        timed.push({
          ...task,
          startHour: hours,
          startMinute: minutes,
          durationMinutes: task.durationMinutes || 60
        });
      } else {
        allDay.push(task);
      }
    });

    return { allDayTasks: allDay, timedTasks: timed };
  }, [tasks, currentDate]);

  // 18 Hourly slots: 06:00 -> 23:00
  const hourlySlots = useMemo(() => {
    const slots: string[] = [];
    for (let h = 6; h <= 23; h++) {
      slots.push(`${h < 10 ? `0${h}` : h}:00`);
    }
    return slots;
  }, []);

  const getPriorityBadge = (priority?: string) => {
    const p = (priority || '').toUpperCase();
    if (p === 'URGENT') return { label: t('tasks.priority_urgent'), color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' };
    if (p === 'HIGH') return { label: t('tasks.priority_high'), color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' };
    if (p === 'MEDIUM') return { label: t('tasks.priority_medium'), color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' };
    return { label: t('tasks.priority_low'), color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)' };
  };

  const getStatusLabel = (status?: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'DONE') return t('tasks.status_done');
    if (s === 'IN_PROGRESS') return t('tasks.status_in_progress');
    if (s === 'PENDING_REVIEW' || s === 'PENDING') return t('tasks.status_pending');
    return t('tasks.status_todo');
  };

  // Check if viewing today for current time line
  const isToday = isSameDay(currentDate, new Date());
  const now = new Date();
  const currentMinutesFromSix = (now.getHours() - 6) * 60 + now.getMinutes();
  const currentTimeTopPx = currentMinutesFromSix * (52 / 60); // 52px per hour

  return (
    <div className="snote-card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* 1. Header Toolbar (Image 2 style) */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <CalendarIcon size={18} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {headerDateStr}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              {t('schedule.title')}
            </div>
          </div>
        </div>

        {/* Date Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={handlePrevDay}
            className="btn btn-sm btn-secondary"
            style={{ fontSize: '11.5px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            title={t('schedule.prev_day')}
          >
            <ChevronLeft size={14} />
            <span>{t('schedule.prev_day')}</span>
          </button>

          <button
            type="button"
            onClick={handleToday}
            className="btn btn-sm btn-ghost"
            style={{ fontSize: '11.5px', padding: '4px 12px', fontWeight: 700, color: 'var(--accent)' }}
          >
            {t('schedule.today')}
          </button>

          <button
            type="button"
            onClick={handleNextDay}
            className="btn btn-sm btn-secondary"
            style={{ fontSize: '11.5px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            title={t('schedule.next_day')}
          >
            <span>{t('schedule.next_day')}</span>
            <ChevronRight size={14} />
          </button>

          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: '6px' }}>
            <input
              type="date"
              value={dateInputValue}
              onChange={handleDateChange}
              className="snote-input"
              style={{
                height: '28px',
                fontSize: '11.5px',
                padding: '2px 8px',
                borderRadius: '6px',
                fontFamily: 'var(--font-mono)'
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. Top Tray: CẢ NGÀY / KHÔNG CỐ ĐỊNH GIỜ (Image 2) */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-surface)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            marginBottom: '10px'
          }}
        >
          <Layers size={13} style={{ color: 'var(--accent)' }} />
          <span>{t('schedule.all_day_tray')} ({allDayTasks.length})</span>
        </div>

        {allDayTasks.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
            {language === 'vi' ? 'Không có công việc nào không cố định giờ trong ngày này.' : 'No untimed tasks scheduled for this day.'}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '10px'
            }}
          >
            {allDayTasks.map((task) => {
              const priority = getPriorityBadge(task.priority);
              const assigneeName = task.assignees?.[0]?.name || task.assignee?.fullName || task.user?.fullName || 'naver';
              const pct = task.status === TaskStatus.DONE ? 100 : task.progressPercent || 0;

              return (
                <div
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="snote-card"
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '12.5px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        lineHeight: 1.35,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}
                      title={task.title}
                    >
                      {task.title}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)',
                        flexShrink: 0,
                        fontWeight: 500
                      }}
                    >
                      {getStatusLabel(task.status)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <User size={11} />
                      <span>{assigneeName}</span>
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Real-time Hourly Grid (06:00 -> 23:00) */}
      <div
        style={{
          position: 'relative',
          padding: '8px 0',
          maxHeight: '560px',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-primary)'
        }}
      >
        {/* Current Time Indicator Line (If today & within 06:00-23:00) */}
        {isToday && now.getHours() >= 6 && now.getHours() <= 23 && (
          <div
            style={{
              position: 'absolute',
              top: `${currentTimeTopPx + 8}px`,
              left: '58px',
              right: 0,
              height: '2px',
              backgroundColor: '#ef4444',
              zIndex: 20,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                position: 'absolute',
                left: '-4px'
              }}
            />
          </div>
        )}

        {/* Hourly Rows */}
        {hourlySlots.map((slotHour, index) => (
          <div
            key={slotHour}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              minHeight: '52px',
              borderBottom: '1px dashed var(--border-subtle, rgba(148, 163, 184, 0.15))',
              position: 'relative'
            }}
          >
            {/* Time Gutter Column */}
            <div
              style={{
                width: '60px',
                minWidth: '60px',
                paddingLeft: '14px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                lineHeight: '1',
                paddingTop: '2px',
                userSelect: 'none'
              }}
            >
              {slotHour}
            </div>

            {/* Time Slot Canvas */}
            <div
              style={{
                flex: 1,
                position: 'relative',
                minHeight: '52px',
                paddingRight: '16px'
              }}
            >
              {/* Render Timed Tasks Starting in this hour */}
              {timedTasks
                .filter((t) => `${t.startHour < 10 ? `0${t.startHour}` : t.startHour}:00` === slotHour)
                .map((task) => {
                  const priority = getPriorityBadge(task.priority);
                  const topOffsetMinutes = task.startMinute || 0;
                  const topPx = (topOffsetMinutes / 60) * 52;
                  const durationMins = task.durationMinutes || 60;
                  const heightPx = Math.max(34, (durationMins / 60) * 52 - 4);

                  return (
                    <div
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className="snote-card"
                      style={{
                        position: 'absolute',
                        top: `${topPx}px`,
                        left: '4px',
                        right: '16px',
                        height: `${heightPx}px`,
                        backgroundColor: priority.bg,
                        border: `1px solid ${priority.color}40`,
                        borderLeft: `3px solid ${priority.color}`,
                        borderRadius: '6px',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}
                      title={`${task.title} (${task.startHour}:${task.startMinute < 10 ? `0${task.startMinute}` : task.startMinute})`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <Clock size={12} style={{ color: priority.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {task.title}
                        </span>
                      </div>
                      <span style={{ fontSize: '10.5px', color: priority.color, fontWeight: 700, flexShrink: 0 }}>
                        {priority.label}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
