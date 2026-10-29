import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User as UserIcon,
  CheckCircle2,
  ListTodo,
  Sparkles,
  AlertCircle,
  ExternalLink,
  Target
} from 'lucide-react';
import { extractNoteFeatures } from '../../notes/utils/smartNoteParser';
import { useLanguage } from '../../../contexts/LanguageContext';

export interface GanttItem {
  id: string;
  itemType: 'EVENT' | 'TASK' | 'PROJECT';
  title: string;
  description?: string | null;
  location?: string | null;
  eventType?: string;
  startTime: string | Date;
  endTime: string | Date;
  dueDate?: string | Date | null;
  createdAt?: string | Date;
  status?: string | null;
  priority?: string | null;
  subjectId?: string | null;
  projectId?: string | null;
  assignees?: Array<{ id: string; name: string; avatarUrl?: string | null }>;
  subject?: {
    id: string;
    name: string;
    code?: string | null;
    color?: string | null;
  } | null;
  project?: {
    id: string;
    name: string;
  } | null;
}

interface GanttTimelineViewProps {
  items: GanttItem[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onItemClick: (item: GanttItem) => void;
  onDateClick?: (date: Date) => void;
}

type StatusFilter = 'ALL' | 'TODO' | 'IN_PROGRESS' | 'PENDING' | 'DONE';

const CELL_WIDTH = 40; // width of each day column in px
const ROW_HEIGHT = 48; // height of each row in px

export const GanttTimelineView: React.FC<GanttTimelineViewProps> = ({
  items,
  currentDate,
  onDateChange,
  onItemClick,
  onDateClick
}) => {
  const { t, formatDate } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [mobileView, setMobileView] = useState<'BOTH' | 'LIST' | 'TIMELINE'>('BOTH');
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<{ item: GanttItem; x: number; y: number } | null>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  // Month navigation & days generation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Days in current month + first few days of next month (total 35-42 columns for wide canvas)
  const daysInMonth = useMemo(() => {
    const totalDays = new Date(year, month + 1, 0).getDate();
    const result: Date[] = [];
    for (let d = 1; d <= totalDays; d++) {
      result.push(new Date(year, month, d, 0, 0, 0, 0));
    }
    // Add 4 buffer days of next month for smooth overflow display
    for (let d = 1; d <= 4; d++) {
      result.push(new Date(year, month + 1, d, 0, 0, 0, 0));
    }
    return result;
  }, [year, month]);

  const monthStart = daysInMonth[0];
  const monthEnd = daysInMonth[daysInMonth.length - 1];

  // Auto-scroll to today column on mount or date change
  useEffect(() => {
    const today = new Date();
    if (today.getMonth() === month && today.getFullYear() === year) {
      const todayDay = today.getDate();
      const scrollPos = Math.max(0, (todayDay - 3) * CELL_WIDTH);
      if (timelineScrollRef.current) {
        timelineScrollRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
      }
    }
  }, [month, year]);

  const handleJumpToToday = () => {
    const today = new Date();
    onDateChange(today);
    const todayDay = today.getDate();
    const scrollPos = Math.max(0, (todayDay - 3) * CELL_WIDTH);
    if (timelineScrollRef.current) {
      timelineScrollRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
    }
  };

  const handlePrevMonth = () => {
    const prev = new Date(year, month - 1, 1);
    onDateChange(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(year, month + 1, 1);
    onDateChange(next);
  };

  // Counts for status tabs
  const counts = useMemo(() => {
    let todo = 0;
    let inProgress = 0;
    let pending = 0;
    let done = 0;

    items.forEach((item) => {
      const s = (item.status || '').toUpperCase();
      if (s === 'DONE' || s === 'COMPLETED') done++;
      else if (s === 'IN_PROGRESS') inProgress++;
      else if (s === 'PENDING' || s === 'REVIEW' || s === 'IN_REVIEW') pending++;
      else todo++;
    });

    return { all: items.length, todo, inProgress, pending, done };
  }, [items]);

  // Filter items according to status
  const filteredItems = useMemo(() => {
    if (statusFilter === 'ALL') return items;
    return items.filter((item) => {
      const s = (item.status || '').toUpperCase();
      if (statusFilter === 'DONE') return s === 'DONE' || s === 'COMPLETED';
      if (statusFilter === 'IN_PROGRESS') return s === 'IN_PROGRESS';
      if (statusFilter === 'PENDING') return s === 'PENDING' || s === 'REVIEW' || s === 'IN_REVIEW';
      if (statusFilter === 'TODO') return s === 'TODO' || !s || s === 'CANCELLED';
      return true;
    });
  }, [items, statusFilter]);

  const dayOfWeekNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  const isToday = (d: Date) => {
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  // Calculate Gantt bar position and width
  const getGanttBarStyle = (item: GanttItem) => {
    const start = new Date(item.startTime || item.createdAt || monthStart);
    const end = new Date(item.endTime || item.dueDate || item.startTime || monthEnd);

    // Normalize start/end
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const msPerDay = 24 * 60 * 60 * 1000;
    const offsetDays = Math.floor((start.getTime() - monthStart.getTime()) / msPerDay);
    const durationDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / msPerDay));

    const left = Math.max(0, offsetDays * CELL_WIDTH);
    const width = Math.max(CELL_WIDTH - 6, durationDays * CELL_WIDTH - 8);

    // Status colors
    const s = (item.status || '').toUpperCase();
    let bgGradient = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    let borderColor = '#b45309';
    let textColor = '#ffffff';

    if (s === 'DONE' || s === 'COMPLETED') {
      bgGradient = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      borderColor = '#047857';
    } else if (s === 'IN_PROGRESS') {
      bgGradient = 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)';
      borderColor = '#0369a1';
    } else if (s === 'PENDING' || s === 'REVIEW' || s === 'IN_REVIEW') {
      bgGradient = 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)';
      borderColor = '#6b21a8';
    } else if (item.itemType === 'EVENT') {
      bgGradient = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
      borderColor = '#1e40af';
    }

    return { left, width, bgGradient, borderColor, textColor };
  };

  const getStatusBadge = (item: GanttItem) => {
    const s = (item.status || '').toUpperCase();
    if (s === 'DONE' || s === 'COMPLETED') {
      return { text: t('tasks.status_done'), bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
    }
    if (s === 'IN_PROGRESS') {
      return { text: t('tasks.status_in_progress'), bg: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9', border: 'rgba(14, 165, 233, 0.3)' };
    }
    if (s === 'PENDING' || s === 'REVIEW' || s === 'IN_REVIEW') {
      return { text: t('tasks.status_pending'), bg: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', border: 'rgba(168, 85, 247, 0.3)' };
    }
    if (item.itemType === 'EVENT') {
      return { text: t('schedule.type_class'), bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
    }
    return { text: t('tasks.status_todo'), bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
  };

  const getItemSubtasksInfo = (item: GanttItem) => {
    if (!item.description) return null;
    const features = extractNoteFeatures(item.description);
    if (features.checklist.total > 0) {
      return {
        done: features.checklist.done,
        total: features.checklist.total,
        percent: Math.round((features.checklist.done / features.checklist.total) * 100)
      };
    }
    return null;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.25)'
      }}
    >
      {/* 1. Header Toolbar & Status Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '14px 18px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-primary)'
        }}
      >
        {/* Left: Title & Status Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
                color: 'var(--accent-primary)',
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}
            >
              <Target size={18} />
            </span>
            <span style={{ fontSize: 'var(--type-body)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              {t('gantt.title')}
            </span>
          </div>

          {/* Status Filter Tabs (like image_128.png) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '3px',
              gap: '2px'
            }}
          >
            {[
              { id: 'ALL', label: t('gantt.filter_all', { count: counts.all }) },
              { id: 'TODO', label: t('gantt.filter_todo', { count: counts.todo }) },
              { id: 'IN_PROGRESS', label: t('gantt.filter_in_progress', { count: counts.inProgress }) },
              { id: 'PENDING', label: t('gantt.filter_pending', { count: counts.pending }) },
              { id: 'DONE', label: t('gantt.filter_done', { count: counts.done }) }
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as StatusFilter)}
                  className={`btn btn-sm ${active ? 'btn-primary' : 'btn-ghost'}`}
                  style={{
                    fontSize: 'var(--type-small)',
                    fontWeight: active ? 700 : 500,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: active ? 'var(--accent-primary)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--text-secondary)'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Time Controls (Today, Prev, Next, Month Picker) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleJumpToToday}
            className="btn btn-outline btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: 'var(--type-small)',
              fontWeight: 700,
              color: 'var(--accent-primary)',
              borderColor: 'rgba(56, 189, 248, 0.4)',
              padding: '5px 12px'
            }}
            title={t('gantt.jump_today_tooltip')}
          >
            <Clock size={14} />
            <span>{t('gantt.today')}</span>
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '2px'
            }}
          >
            <button
              onClick={handlePrevMonth}
              className="btn btn-ghost btn-icon btn-sm"
              title={t('gantt.prev_month_tooltip')}
              style={{ padding: '5px' }}
            >
              <ChevronLeft size={16} />
            </button>

            <span style={{ fontSize: 'var(--type-small)', fontWeight: 700, padding: '0 10px', color: 'var(--text-primary)' }}>
              {formatDate(new Date(year, month, 1), { month: 'long', year: 'numeric' })}
            </span>

            <button
              onClick={handleNextMonth}
              className="btn btn-ghost btn-icon btn-sm"
              title={t('gantt.next_month_tooltip')}
              style={{ padding: '5px' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Mobile View Mode Switcher (Split / List / Timeline) */}
          <div
            className="gantt-mobile-view-toggle"
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '2px',
              gap: '2px'
            }}
          >
            <button
              type="button"
              onClick={() => setMobileView('BOTH')}
              className={`btn btn-sm ${mobileView === 'BOTH' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: 'var(--type-caption)', padding: '2px 8px', borderRadius: '4px' }}
            >
              Split
            </button>
            <button
              type="button"
              onClick={() => setMobileView('LIST')}
              className={`btn btn-sm ${mobileView === 'LIST' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: 'var(--type-caption)', padding: '2px 8px', borderRadius: '4px' }}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setMobileView('TIMELINE')}
              className={`btn btn-sm ${mobileView === 'TIMELINE' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: 'var(--type-caption)', padding: '2px 8px', borderRadius: '4px' }}
            >
              Timeline
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Gantt Body: Left Sticky Table + Right Scrollable Timeline Canvas */}
      <div style={{ display: 'flex', width: '100%', overflowX: 'auto', position: 'relative' }}>
        {/* Left Side: Tasks Info Table */}
        {(mobileView === 'BOTH' || mobileView === 'LIST') && (
          <div
            style={{
              width: mobileView === 'LIST' ? '100%' : 'clamp(260px, 28vw, 360px)',
              minWidth: mobileView === 'LIST' ? '100%' : '240px',
              flexShrink: 0,
              borderRight: mobileView === 'LIST' ? 'none' : '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              zIndex: 10
            }}
          >
          {/* Table Header */}
          <div
            style={{
              height: '56px',
              display: 'grid',
              gridTemplateColumns: '1.6fr 1fr 1fr',
              alignItems: 'center',
              padding: '0 14px',
              borderBottom: '1px solid var(--border-color)',
              fontSize: 'var(--type-small)',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              backgroundColor: 'var(--bg-secondary)'
            }}
          >
            <div>{t('gantt.task_name')}</div>
            <div>{t('gantt.assignee')}</div>
            <div style={{ textAlign: 'right' }}>{t('gantt.duration')}</div>
          </div>

          {/* Table Rows */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredItems.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--type-small)' }}>
                {t('gantt.empty_filtered')}
              </div>
            ) : (
              filteredItems.map((item) => {
                const isHovered = hoveredItemId === item.id;
                const badge = getStatusBadge(item);
                const subtasks = getItemSubtasksInfo(item);
                const assigneeName = item.assignees?.[0]?.name || t('tasks.assignee_you');
                const assigneeInitial = assigneeName.slice(0, 2).toUpperCase();

                const startDate = new Date(item.startTime || item.createdAt || monthStart);
                const endDate = new Date(item.endTime || item.dueDate || item.startTime || monthEnd);
                const dateStr = `${startDate.getDate()}/${startDate.getMonth() + 1} - ${endDate.getDate()}/${endDate.getMonth() + 1}`;

                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredItemId(item.id)}
                    onMouseLeave={() => setHoveredItemId(null)}
                    onClick={() => onItemClick(item)}
                    style={{
                      height: `${ROW_HEIGHT}px`,
                      display: 'grid',
                      gridTemplateColumns: '1.6fr 1fr 1fr',
                      alignItems: 'center',
                      padding: '0 14px',
                      borderBottom: '1px solid var(--border-subtle)',
                      backgroundColor: isHovered ? 'var(--bg-hover)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color var(--transition-fast)'
                    }}
                  >
                    {/* Column 1: Badge + Title + Subtask count */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <span
                        style={{
                          fontSize: 'var(--type-caption)',
                          fontWeight: 700,
                          padding: '1.5px 6px',
                          borderRadius: '4px',
                          backgroundColor: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          flexShrink: 0
                        }}
                      >
                        {badge.text}
                      </span>
                      <span
                        style={{
                          fontSize: 'var(--type-small)',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={item.title}
                      >
                        {item.title}
                      </span>
                      {subtasks && (
                        <span
                          style={{
                            fontSize: 'var(--type-caption)',
                            fontWeight: 700,
                            color: 'var(--accent-primary)',
                            backgroundColor: 'rgba(56, 189, 248, 0.12)',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                            flexShrink: 0
                          }}
                          title={t('gantt.progress_tooltip', { done: subtasks.done, total: subtasks.total, percent: subtasks.percent })}
                        >
                          <ListTodo size={10} />
                          {subtasks.done}/{subtasks.total}
                        </span>
                      )}
                    </div>

                    {/* Column 2: Assignee */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                      <span
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--accent-primary)',
                          color: '#ffffff',
                          fontSize: 'var(--type-caption)',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {assigneeInitial}
                      </span>
                      <span
                        style={{
                          fontSize: 'var(--type-caption)',
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {assigneeName}
                      </span>
                    </div>

                    {/* Column 3: Duration string */}
                    <div style={{ textAlign: 'right', fontSize: 'var(--type-caption)', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {dateStr}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        )}

        {/* Right Side: Horizontal Scrollable Timeline Canvas */}
        {(mobileView === 'BOTH' || mobileView === 'TIMELINE') && (
        <div
          ref={timelineScrollRef}
          style={{
            flex: 1,
            overflowX: 'auto',
            overflowY: 'hidden',
            backgroundColor: 'var(--bg-secondary)',
            position: 'relative'
          }}
        >
          {/* Day Headers (Row 1: Day numbers, Row 2: Day of week) */}
          <div
            style={{
              height: '56px',
              display: 'flex',
              borderBottom: '1px solid var(--border-color)',
              position: 'sticky',
              top: 0,
              backgroundColor: 'var(--bg-secondary)',
              zIndex: 5,
              width: `${daysInMonth.length * CELL_WIDTH}px`
            }}
          >
            {daysInMonth.map((d, idx) => {
              const today = isToday(d);
              const dayNum = d.getDate();
              const dayOfWeek = dayOfWeekNames[d.getDay()];
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;

              return (
                <div
                  key={idx}
                  onClick={() => onDateClick?.(d)}
                  style={{
                    width: `${CELL_WIDTH}px`,
                    minWidth: `${CELL_WIDTH}px`,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRight: '1px solid var(--border-subtle)',
                    backgroundColor: today
                      ? 'rgba(56, 189, 248, 0.15)'
                      : isWeekend
                      ? 'rgba(0, 0, 0, 0.12)'
                      : 'transparent',
                    borderTop: today ? '2px solid var(--accent-primary)' : 'none',
                    cursor: 'pointer'
                  }}
                  title={t('gantt.click_add_event_tooltip', { day: dayNum, month: d.getMonth() + 1 })}
                >
                  <span
                    style={{
                      fontSize: 'var(--type-small)',
                      fontWeight: today ? 800 : 700,
                      color: today ? 'var(--accent-primary)' : 'var(--text-primary)'
                    }}
                  >
                    {dayNum}
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--type-caption)',
                      fontWeight: today ? 700 : 500,
                      color: today ? 'var(--accent-primary)' : isWeekend ? 'var(--text-muted)' : 'var(--text-secondary)'
                    }}
                  >
                    {dayOfWeek}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Timeline Grid & Gantt Bars Area */}
          <div
            style={{
              position: 'relative',
              width: `${daysInMonth.length * CELL_WIDTH}px`,
              minHeight: `${Math.max(filteredItems.length * ROW_HEIGHT, 240)}px`
            }}
          >
            {/* Background Vertical Grid Columns & Today Highlight Column */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                pointerEvents: 'none'
              }}
            >
              {daysInMonth.map((d, idx) => {
                const today = isToday(d);
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <div
                    key={idx}
                    style={{
                      width: `${CELL_WIDTH}px`,
                      minWidth: `${CELL_WIDTH}px`,
                      height: '100%',
                      borderRight: '1px solid var(--border-subtle)',
                      backgroundColor: today
                        ? 'rgba(56, 189, 248, 0.08)'
                        : isWeekend
                        ? 'rgba(0, 0, 0, 0.06)'
                        : 'transparent',
                      borderLeft: today ? '1px dashed var(--accent-primary)' : 'none',
                      borderRightStyle: today ? 'dashed' : 'solid',
                      borderRightColor: today ? 'var(--accent-primary)' : undefined
                    }}
                  />
                );
              })}
            </div>

            {/* Render Horizontal Gantt Bars */}
            {filteredItems.map((item, rowIdx) => {
              const bar = getGanttBarStyle(item);
              const isHovered = hoveredItemId === item.id;
              const subtasks = getItemSubtasksInfo(item);

              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setHoveredItemId(item.id)}
                  onMouseLeave={() => setHoveredItemId(null)}
                  style={{
                    height: `${ROW_HEIGHT}px`,
                    width: '100%',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--border-subtle)',
                    backgroundColor: isHovered ? 'rgba(255, 255, 255, 0.03)' : 'transparent'
                  }}
                >
                  {/* The Gantt Bar */}
                  <div
                    onClick={() => onItemClick(item)}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltipData({ item, x: rect.left + rect.width / 2, y: rect.top - 8 });
                    }}
                    onMouseLeave={() => setTooltipData(null)}
                    style={{
                      position: 'absolute',
                      left: `${bar.left + 4}px`,
                      width: `${bar.width}px`,
                      height: '28px',
                      borderRadius: '6px',
                      background: bar.bgGradient,
                      boxShadow: isHovered
                        ? '0 2px 10px rgba(0, 0, 0, 0.35)'
                        : '0 2px 6px rgba(0, 0, 0, 0.25)',
                      border: `1px solid ${bar.borderColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 10px',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      zIndex: isHovered ? 4 : 2,
                      transform: 'none',
                      transition: 'all 150ms ease-out'
                    }}
                  >
                    {/* Status Dot */}
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        marginRight: '6px',
                        flexShrink: 0
                      }}
                    />

                    {/* Task Title */}
                    <span
                      style={{
                        fontSize: 'var(--type-small)',
                        fontWeight: 700,
                        color: bar.textColor,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                      }}
                    >
                      {item.title}
                    </span>

                    {/* Subtasks Progress inside Bar */}
                    {subtasks && (
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: 'var(--type-caption)',
                          fontWeight: 700,
                          color: 'rgba(255, 255, 255, 0.9)',
                          backgroundColor: 'rgba(0, 0, 0, 0.2)',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          flexShrink: 0
                        }}
                      >
                        ({subtasks.done}/{subtasks.total})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}
      </div>

      {/* Floating Tooltip Component (Matching image_128.png Tooltip Card) */}
      {tooltipData && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltipData.x}px`,
            top: `${tooltipData.y}px`,
            transform: 'translate(-50%, -100%)',
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            zIndex: 9999,
            pointerEvents: 'none',
            fontSize: 'var(--type-small)',
            lineHeight: 1.5,
            minWidth: '180px',
            maxWidth: '280px'
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 'var(--type-small)', color: '#ffffff', marginBottom: '4px' }}>
            {tooltipData.item.title}
          </div>
          <div style={{ color: '#94a3b8', display: 'flex', gap: '4px' }}>
            <span>{t('gantt.tooltip_assignee')}</span>
            <span style={{ color: '#f8fafc', fontWeight: 600 }}>
              {tooltipData.item.assignees?.[0]?.name || t('tasks.assignee_you')}
            </span>
          </div>
          <div style={{ color: '#94a3b8', display: 'flex', gap: '4px' }}>
            <span>{t('gantt.tooltip_time')}</span>
            <span style={{ color: '#f8fafc', fontWeight: 600 }}>
              {formatDate(tooltipData.item.startTime)} -{' '}
              {formatDate(tooltipData.item.endTime || tooltipData.item.dueDate || tooltipData.item.startTime)}
            </span>
          </div>
          <div style={{ color: '#94a3b8', display: 'flex', gap: '4px' }}>
            <span>{t('gantt.tooltip_status')}</span>
            <span style={{ color: getStatusBadge(tooltipData.item).color, fontWeight: 700 }}>
              {getStatusBadge(tooltipData.item).text}
            </span>
          </div>
          {getItemSubtasksInfo(tooltipData.item) && (
            <div style={{ color: '#94a3b8', display: 'flex', gap: '4px', marginTop: '2px' }}>
              <span>{t('gantt.tooltip_progress')}</span>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                {getItemSubtasksInfo(tooltipData.item)?.percent}% ({getItemSubtasksInfo(tooltipData.item)?.done}/{getItemSubtasksInfo(tooltipData.item)?.total})
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
