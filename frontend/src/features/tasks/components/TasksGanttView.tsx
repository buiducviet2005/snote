import React, { useState, useMemo } from 'react';
import './TasksGanttView.css';
import { TaskStatus, TaskPriority } from '@snote/shared';
import { useLanguage } from '../../../contexts/LanguageContext';
import {
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Users
} from 'lucide-react';

interface TasksGanttViewProps {
  tasks: any[];
  onSelectTask: (task: any) => void;
  onToggleStatus?: (id: string, currentStatus: TaskStatus) => void;
}

export const TasksGanttView: React.FC<TasksGanttViewProps> = ({
  tasks,
  onSelectTask,
  onToggleStatus
}) => {
  const { t, language } = useLanguage();
  const [ganttWeekOffset, setGanttWeekOffset] = useState<number>(0);

  // 1. Calculate 7 weeks (49 days) base window
  const { days, weeks, todayStr, totalDays } = useMemo(() => {
    let baseDate = new Date();
    const currentDay = baseDate.getDay(); // 0 is Sun, 1 is Mon
    const diffToMonday = (currentDay === 0 ? -6 : 1) - currentDay;
    baseDate.setDate(baseDate.getDate() + diffToMonday + (ganttWeekOffset * 7));
    baseDate.setHours(0, 0, 0, 0);

    const totalDaysCount = 49;
    const daysArr: Date[] = [];
    const weeksArr: { number: number; start: Date; label: string }[] = [];

    let tempDate = new Date(baseDate.getTime());
    for (let i = 0; i < totalDaysCount; i++) {
      const d = new Date(tempDate.getTime());
      daysArr.push(d);

      if (i % 7 === 0) {
        const weekNum = Math.floor(i / 7) + 1;
        weeksArr.push({
          number: weekNum,
          start: new Date(d.getTime()),
          label: `${t('gantt.week_prefix')} ${weekNum}`
        });
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const now = new Date();
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    return {
      days: daysArr,
      weeks: weeksArr,
      todayStr: today,
      totalDays: totalDaysCount
    };
  }, [ganttWeekOffset, t]);

  const dayNames = useMemo(() => {
    return language === 'vi'
      ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }, [language]);

  const formatDateShort = (d: Date | string) => {
    const date = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(date.getTime())) return '-';
    const day = date.getDate() < 10 ? `0${date.getDate()}` : `${date.getDate()}`;
    const month = date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : `${date.getMonth() + 1}`;
    return `${day}/${month}`;
  };

  const toLocalDateString = (d: Date) => {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const getPriorityLabel = (p: string) => {
    const up = (p || '').toUpperCase();
    if (up === 'URGENT') return t('tasks.priority_urgent');
    if (up === 'HIGH') return t('tasks.priority_high');
    if (up === 'LOW') return t('tasks.priority_low');
    return t('tasks.priority_medium');
  };

  const getPriorityClass = (p: string) => {
    const up = (p || '').toUpperCase();
    if (up === 'URGENT') return 'gantt-bar-urgent';
    if (up === 'HIGH') return 'gantt-bar-high';
    if (up === 'LOW') return 'gantt-bar-low';
    return 'gantt-bar-medium';
  };

  return (
    <div className="snote-card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Top Gantt Toolbar (Directly from Vertex42 / Image 1) */}
      <div
        style={{
          padding: '6px 10px',
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--type-small)', fontWeight: 700, color: 'var(--text-primary)' }}>
            <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
            <span>{t('gantt.title')}</span>
          </div>

          {/* Priority Legend */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: 'var(--type-caption)',
              color: 'var(--text-secondary)',
              borderLeft: '1px solid var(--border-color)',
              paddingLeft: '12px'
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '2px', backgroundColor: '#ef4444' }} /> {t('tasks.priority_urgent')}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '2px', backgroundColor: '#f59e0b' }} /> {t('tasks.priority_high')}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '2px', backgroundColor: '#3b82f6' }} /> {t('tasks.priority_medium')}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '2px', backgroundColor: '#94a3b8' }} /> {t('tasks.priority_low')}
            </span>
          </div>
        </div>

        {/* Timeline Navigation Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setGanttWeekOffset((prev) => prev - 1)}
            className="btn btn-sm btn-secondary"
            style={{ fontSize: 'var(--type-caption)', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            title={t('gantt.prev_week')}
          >
            <ChevronLeft size={14} />
            <span>{t('gantt.prev_week')}</span>
          </button>
          <button
            type="button"
            onClick={() => setGanttWeekOffset(0)}
            className="btn btn-sm btn-ghost"
            style={{ fontSize: 'var(--type-caption)', padding: '4px 12px', fontWeight: 700, color: 'var(--accent)' }}
            title={t('gantt.today')}
          >
            {t('gantt.today')}
          </button>
          <button
            type="button"
            onClick={() => setGanttWeekOffset((prev) => prev + 1)}
            className="btn btn-sm btn-secondary"
            style={{ fontSize: 'var(--type-caption)', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            title={t('gantt.next_week')}
          >
            <span>{t('gantt.next_week')}</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Schedule Table Container */}
      <div className="gantt-schedule-scroll">
        <table className="gantt-schedule-table">
          <thead>
            {/* Row 1: Left Columns + Week Headers */}
            <tr className="gantt-header-row-1" style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              <th rowSpan={4} className="gantt-col-sticky-wbs" style={{ width: '45px', minWidth: '45px', padding: '4px', textAlign: 'center', fontWeight: 700 }}>{t('gantt.wbs')}</th>
              <th rowSpan={4} className="gantt-col-sticky-name" style={{ width: '220px', minWidth: '220px', padding: '4px 10px', textAlign: 'left', fontWeight: 700 }}>{t('gantt.task_name')}</th>
              <th rowSpan={4} style={{ width: '90px', minWidth: '90px', padding: '4px', textAlign: 'center', fontWeight: 700 }}>{t('gantt.priority')}</th>
              <th rowSpan={4} style={{ width: '110px', minWidth: '110px', padding: '4px 8px', textAlign: 'left', fontWeight: 700 }}>{t('gantt.assignee')}</th>
              <th rowSpan={4} style={{ width: '80px', minWidth: '80px', padding: '4px', textAlign: 'center', fontWeight: 700 }}>{t('gantt.start')}</th>
              <th rowSpan={4} style={{ width: '80px', minWidth: '80px', padding: '4px', textAlign: 'center', fontWeight: 700 }}>{t('gantt.due')}</th>
              <th rowSpan={4} style={{ width: '45px', minWidth: '45px', padding: '4px', textAlign: 'center', fontWeight: 700 }}>{t('gantt.days')}</th>
              <th rowSpan={4} style={{ width: '55px', minWidth: '55px', padding: '4px', textAlign: 'center', fontWeight: 700 }}>{t('gantt.pct_done')}</th>
              {weeks.map((w) => (
                <th
                  key={w.number}
                  colSpan={7}
                  style={{
                    padding: '4px 8px',
                    textAlign: 'center',
                    fontWeight: 700,
                    borderLeft: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-tray)'
                  }}
                >
                  {w.label}
                </th>
              ))}
            </tr>

            {/* Row 2: Week Start Date */}
            <tr className="gantt-header-row-2" style={{ backgroundColor: 'var(--bg-surface)', fontSize: 'var(--type-caption)' }}>
              {weeks.map((w) => (
                <th
                  key={w.number}
                  colSpan={7}
                  style={{
                    textAlign: 'center',
                    padding: '2px 0',
                    borderLeft: '1px solid var(--border-color)',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)'
                  }}
                >
                  {formatDateShort(w.start)}
                </th>
              ))}
            </tr>

            {/* Row 3: Day Numbers */}
            <tr className="gantt-header-row-3" style={{ backgroundColor: 'var(--bg-surface)', fontSize: 'var(--type-caption)', fontWeight: 600 }}>
              {days.map((d, idx) => {
                const isToday = toLocalDateString(d) === todayStr;
                return (
                  <th
                    key={idx}
                    className={`gantt-cell-day ${isToday ? 'gantt-today-col' : ''}`}
                    style={{
                      padding: '2px 0',
                      color: isToday ? 'var(--accent)' : 'inherit',
                      fontWeight: isToday ? 800 : 600
                    }}
                  >
                    {d.getDate()}
                  </th>
                );
              })}
            </tr>

            {/* Row 4: Day Names (CN, T2..T7) */}
            <tr className="gantt-header-row-4" style={{ backgroundColor: 'var(--bg-secondary)', fontSize: 'var(--type-caption)', fontWeight: 500 }}>
              {days.map((d, idx) => {
                const dayIdx = d.getDay();
                const isWeekend = dayIdx === 0 || dayIdx === 6;
                return (
                  <th
                    key={idx}
                    className={`gantt-cell-day ${isWeekend ? 'gantt-weekend' : ''}`}
                    style={{
                      padding: '2px 0',
                      color: isWeekend ? 'var(--color-warning)' : 'var(--text-muted)'
                    }}
                  >
                    {dayNames[dayIdx]}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={8 + totalDays} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--type-small)' }}>
                  {t('tasks.no_tasks')}
                </td>
              </tr>
            ) : (
              tasks.map((task, idx) => {
                const wbs = (idx + 1).toString();
                const lead = task.project?.name || task.subject?.code || task.subject?.name || t('common.personal');
                const rawStart = task.startDate || task.startAt || task.createdAt;
                const rawDue = task.dueDate || task.dueAt;
                const startStr = rawStart ? formatDateShort(rawStart) : '-';
                const dueStr = rawDue ? formatDateShort(rawDue) : '-';

                // Duration in days
                let durationDays = '-';
                const effectiveStart = rawStart || rawDue;
                const effectiveDue = rawDue || rawStart;

                if (effectiveStart && effectiveDue) {
                  const dStart = new Date(effectiveStart);
                  const dDue = new Date(effectiveDue);
                  if (!isNaN(dStart.getTime()) && !isNaN(dDue.getTime())) {
                    const diffDays = Math.round((dDue.getTime() - dStart.getTime()) / 86400000);
                    if (diffDays >= 0) durationDays = `${diffDays + 1}`;
                  }
                }

                // % Done computation
                let pct = 0;
                if (task.status === TaskStatus.DONE) {
                  pct = 100;
                } else if (task.status === TaskStatus.IN_PROGRESS) {
                  pct = task.progressPercent || 50;
                } else if (task.progressPercent !== undefined) {
                  pct = task.progressPercent;
                }

                // Calculate Gantt bar position & span
                let barHtml = null;
                if (effectiveStart && effectiveDue) {
                  const dStart = new Date(effectiveStart);
                  const dDue = new Date(effectiveDue);
                  if (!isNaN(dStart.getTime()) && !isNaN(dDue.getTime())) {
                    const windowStart = days[0];
                    const windowEnd = days[days.length - 1];

                    if (dDue >= windowStart && dStart <= windowEnd) {
                      const startDiff = Math.max(0, Math.floor((dStart.getTime() - windowStart.getTime()) / 86400000));
                      const endDiff = Math.min(totalDays - 1, Math.floor((dDue.getTime() - windowStart.getTime()) / 86400000));
                      const spanDays = Math.max(1, (endDiff - startDiff) + 1);

                      const leftPx = startDiff * 26 + 2;
                      const widthPx = spanDays * 26 - 4;

                      const priorityClass = getPriorityClass(task.priority);

                      barHtml = (
                        <div
                          className={`gantt-dual-bar ${priorityClass}`}
                          style={{ left: `${leftPx}px`, width: `${widthPx}px` }}
                          onClick={() => onSelectTask(task)}
                          title={`${task.title}: ${pct}% (${startStr} -> ${dueStr})`}
                        >
                          <div className="gantt-bar-done" style={{ width: `${pct}%` }} />
                          <div className="gantt-bar-remaining" style={{ width: `${100 - pct}%` }} />
                        </div>
                      );
                    }
                  }
                }

                return (
                  <tr
                    key={task.id}
                    className="table-row-hover"
                    style={{ transition: 'background-color 0.12s ease' }}
                  >
                    <td
                      onClick={() => onSelectTask(task)}
                      className="gantt-col-sticky-wbs"
                      style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 'var(--type-caption)', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                    >
                      {wbs}
                    </td>

                    <td
                      onClick={() => onSelectTask(task)}
                      className="gantt-col-sticky-name"
                      style={{ padding: '6px 10px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      title={task.title}
                    >
                      {task.title}
                    </td>

                    <td style={{ textAlign: 'center', padding: '4px' }}>
                      <span
                        className="badge"
                        style={{
                          fontSize: 'var(--type-caption)',
                          padding: '2px 6px',
                          backgroundColor: task.priority === 'URGENT' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-secondary)',
                          color: task.priority === 'URGENT' ? '#ef4444' : 'var(--text-secondary)'
                        }}
                      >
                        {getPriorityLabel(task.priority)}
                      </span>
                    </td>

                    <td style={{ padding: '4px 8px', fontSize: 'var(--type-caption)', color: 'var(--text-secondary)', maxWidth: '110px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {lead}
                    </td>

                    <td className="gantt-date-cell">{startStr}</td>
                    <td className="gantt-date-cell">{dueStr}</td>
                    <td className="gantt-date-cell" style={{ fontWeight: 600 }}>{durationDays}</td>
                    <td className="gantt-pct-cell">{pct}%</td>

                    {/* Timeline 49 Days Grid */}
                    <td colSpan={totalDays} className="gantt-timeline-cell">
                      {/* Background grid lines for today & weekends */}
                      <div style={{ display: 'flex', height: '100%', width: '100%', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                        {days.map((d, dayIndex) => {
                          const isToday = toLocalDateString(d) === todayStr;
                          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                          return (
                            <div
                              key={dayIndex}
                              className={`gantt-cell-day ${isToday ? 'gantt-today-col' : isWeekend ? 'gantt-weekend' : ''}`}
                              style={{ height: '100%', borderRight: '1px solid var(--border-subtle, rgba(255,255,255,0.03))' }}
                            />
                          );
                        })}
                      </div>

                      {/* Interactive Dual Progress Bar */}
                      {barHtml}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
