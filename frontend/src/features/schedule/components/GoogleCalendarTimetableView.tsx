import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  MapPin,
  Sparkles,
  Layers,
  BookOpen,
  GraduationCap,
  Users,
  Target
} from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { GanttItem } from './GanttTimelineView';
import './GoogleCalendarTimetableView.css';

export interface GoogleCalendarTimetableViewProps {
  items: GanttItem[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onItemClick: (item: GanttItem) => void;
  onSlotClick?: (date: Date, hour: number) => void;
  onOpenCreate?: () => void;
}

type TimetableFilter = 'ALL' | 'CLASS' | 'EXAM' | 'DEADLINE' | 'MEETING';

const START_HOUR = 6;  // 06:00
const END_HOUR = 22;   // 22:00
const TOTAL_HOURS = END_HOUR - START_HOUR + 1; // 17 hours
const HOUR_HEIGHT = 60; // 60px per hour => 1px = 1 minute

// Vietnamese University Academic Shift definitions
const ACADEMIC_SHIFTS: Record<number, { label: string; time: string }> = {
  7: { label: 'Ca 1', time: '07:00 - 09:25' },
  9: { label: 'Ca 2', time: '09:35 - 12:00' },
  12: { label: 'Ca 3', time: '12:30 - 14:55' },
  15: { label: 'Ca 4', time: '15:05 - 17:30' },
  18: { label: 'Ca 5', time: '18:00 - 20:25' }
};

interface PositionedEvent {
  item: GanttItem;
  top: number;
  height: number;
  leftPct: number;
  widthPct: number;
}

export const GoogleCalendarTimetableView: React.FC<GoogleCalendarTimetableViewProps> = ({
  items,
  currentDate,
  onDateChange,
  onItemClick,
  onSlotClick,
  onOpenCreate
}) => {
  const { t, language } = useLanguage();
  const [filter, setFilter] = useState<TimetableFilter>('ALL');
  const [now, setNow] = useState<Date>(() => new Date());
  const gridScrollRef = useRef<HTMLDivElement>(null);
  const hasAutoScrolled = useRef(false);

  // Update current time indicator every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Compute Monday-to-Sunday days for the active week
  const daysOfWeek = useMemo(() => {
    const date = new Date(currentDate);
    const day = date.getDay(); // 0 is Sunday, 1 is Monday...
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.getFullYear(), date.getMonth(), diff, 0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [currentDate]);

  // Check if a date matches Today
  const isDateToday = useCallback((d: Date) => {
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }, [now]);

  // Is today within the active week?
  const isTodayInWeek = useMemo(() => {
    return daysOfWeek.some((d) => isDateToday(d));
  }, [daysOfWeek, isDateToday]);

  // Auto-scroll to current hour on initial load
  useEffect(() => {
    if (!hasAutoScrolled.current && gridScrollRef.current) {
      const currentHour = now.getHours();
      if (currentHour >= START_HOUR && currentHour <= END_HOUR) {
        const scrollTarget = (currentHour - START_HOUR) * HOUR_HEIGHT - 60;
        gridScrollRef.current.scrollTop = Math.max(0, scrollTarget);
      } else {
        // Default scroll to Ca 1 (07:00)
        gridScrollRef.current.scrollTop = (7 - START_HOUR) * HOUR_HEIGHT;
      }
      hasAutoScrolled.current = true;
    }
  }, [now]);

  // Navigation handlers
  const handlePrevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 7);
    onDateChange(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    onDateChange(next);
  };

  const handleJumpToday = () => {
    onDateChange(new Date());
  };

  // Header Title Formatter (Google Calendar Style)
  const headerTitle = useMemo(() => {
    if (daysOfWeek.length === 0) return '';
    const first = daysOfWeek[0];
    const last = daysOfWeek[6];

    if (first.getMonth() === last.getMonth()) {
      if (language === 'vi') {
        return `Tháng ${first.getMonth() + 1}, ${first.getFullYear()}`;
      }
      return first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (first.getFullYear() === last.getFullYear()) {
      if (language === 'vi') {
        return `Tháng ${first.getMonth() + 1} - Tháng ${last.getMonth() + 1}, ${first.getFullYear()}`;
      }
      const m1 = first.toLocaleDateString('en-US', { month: 'short' });
      const m2 = last.toLocaleDateString('en-US', { month: 'short' });
      return `${m1} - ${m2} ${first.getFullYear()}`;
    } else {
      if (language === 'vi') {
        return `Tháng ${first.getMonth() + 1}, ${first.getFullYear()} - Tháng ${last.getMonth() + 1}, ${last.getFullYear()}`;
      }
      return `${first.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${last.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    }
  }, [daysOfWeek, language]);

  // Day label (T2 - CN or MON - SUN)
  const getDayShortLabel = (d: Date) => {
    const day = d.getDay();
    if (language === 'vi') {
      const vi = ['CN', 'TH 2', 'TH 3', 'TH 4', 'TH 5', 'TH 6', 'TH 7'];
      return vi[day];
    }
    const en = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return en[day];
  };

  // Filter items based on active pill
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filter === 'ALL') return true;
      const type = (item.eventType || '').toUpperCase();
      if (filter === 'CLASS') return type === 'CLASS' || type === 'LECTURE';
      if (filter === 'EXAM') return type === 'EXAM' || type === 'TEST' || type === 'MIDTERM';
      if (filter === 'DEADLINE') return item.itemType === 'TASK' || type === 'DEADLINE';
      if (filter === 'MEETING') return type === 'GROUP_MEETING' || type === 'MEETING';
      return true;
    });
  }, [items, filter]);

  // Classify items for a specific day: all-day / untimed vs. timed
  const getDayItems = useCallback((day: Date) => {
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
    const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);

    const allDay: GanttItem[] = [];
    const timed: GanttItem[] = [];

    filteredItems.forEach((item) => {
      const start = item.startTime ? new Date(item.startTime) : null;
      const end = item.endTime ? new Date(item.endTime) : (start ? new Date(start) : null);
      const due = item.dueDate ? new Date(item.dueDate) : null;

      const eventTime = start || due;
      if (!eventTime) return;

      // Check if event falls on this day
      if (eventTime >= dayStart && eventTime <= dayEnd) {
        // If it's a task without hours or spanning full day
        if (item.itemType === 'TASK' && (!item.startTime || (start && start.getHours() === 0 && start.getMinutes() === 0))) {
          allDay.push(item);
        } else if (start && end) {
          // If duration >= 20h, place in all-day tray
          const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          if (durationHours >= 20) {
            allDay.push(item);
          } else {
            timed.push(item);
          }
        } else {
          allDay.push(item);
        }
      }
    });

    return { allDay, timed };
  }, [filteredItems]);

  // Google Calendar column layout algorithm for overlapping events
  const layoutDayEvents = useCallback((dayEvents: GanttItem[]): PositionedEvent[] => {
    if (dayEvents.length === 0) return [];

    const parsed = dayEvents.map((item) => {
      const s = new Date(item.startTime || item.dueDate || '');
      const e = item.endTime ? new Date(item.endTime) : new Date(s.getTime() + 45 * 60 * 1000);

      let startMin = s.getHours() * 60 + s.getMinutes();
      let endMin = e.getHours() * 60 + e.getMinutes();
      if (endMin <= startMin) endMin = startMin + 45;

      return { item, startMin, endMin };
    });

    parsed.sort((a, b) => a.startMin - b.startMin || (b.endMin - b.startMin) - (a.endMin - a.startMin));

    // Overlap clustering
    const clusters: Array<typeof parsed> = [];
    let currentCluster: typeof parsed = [];
    let currentClusterEnd = -1;

    for (const ev of parsed) {
      if (currentCluster.length === 0) {
        currentCluster.push(ev);
        currentClusterEnd = ev.endMin;
      } else if (ev.startMin < currentClusterEnd) {
        currentCluster.push(ev);
        currentClusterEnd = Math.max(currentClusterEnd, ev.endMin);
      } else {
        clusters.push(currentCluster);
        currentCluster = [ev];
        currentClusterEnd = ev.endMin;
      }
    }
    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }

    const results: PositionedEvent[] = [];

    // Greedy column allocation per cluster
    for (const cluster of clusters) {
      const columns: Array<Array<typeof parsed[0]>> = [];

      for (const ev of cluster) {
        let placed = false;
        for (let colIdx = 0; colIdx < columns.length; colIdx++) {
          const lastInCol = columns[colIdx][columns[colIdx].length - 1];
          if (lastInCol.endMin <= ev.startMin) {
            columns[colIdx].push(ev);
            placed = true;
            break;
          }
        }
        if (!placed) {
          columns.push([ev]);
        }
      }

      const totalCols = columns.length;
      columns.forEach((colEvents, colIdx) => {
        const colWidth = 100 / totalCols;
        const left = colIdx * colWidth;

        for (const ev of colEvents) {
          const top = Math.max(0, ev.startMin - START_HOUR * 60);
          const height = Math.max(26, ev.endMin - ev.startMin);

          results.push({
            item: ev.item,
            top,
            height,
            leftPct: left,
            widthPct: colWidth
          });
        }
      });
    }

    return results;
  }, []);

  // Event Card CSS Type Mapper
  const getEventTypeClass = (item: GanttItem): string => {
    if (item.itemType === 'TASK') return 'type-deadline';
    const type = (item.eventType || '').toUpperCase();
    if (type === 'CLASS' || type === 'LECTURE') return 'type-class';
    if (type === 'EXAM' || type === 'TEST' || type === 'MIDTERM') return 'type-exam';
    if (type === 'DEADLINE' || type === 'ASSIGNMENT') return 'type-deadline';
    if (type === 'GROUP_MEETING' || type === 'MEETING') return 'type-meeting';
    return 'type-personal';
  };

  // Format Time Display (e.g., 07:00 - 09:25)
  const formatTimeRange = (start: string | Date, end: string | Date) => {
    const s = new Date(start);
    const e = new Date(end);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(s.getHours())}:${pad(s.getMinutes())} - ${pad(e.getHours())}:${pad(e.getMinutes())}`;
  };

  // Real-time Current Red Line Position
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const currentIndicatorTop = nowMinutes - START_HOUR * 60;
  const isIndicatorVisible = now.getHours() >= START_HOUR && now.getHours() <= END_HOUR;

  // Check if any day has all-day items
  const allDayRowHasItems = useMemo(() => {
    return daysOfWeek.some((d) => getDayItems(d).allDay.length > 0);
  }, [daysOfWeek, getDayItems]);

  return (
    <div className="gcal-timetable-container">
      {/* 1. TOPBAR CONTROLS */}
      <div className="gcal-toolbar">
        <div className="gcal-toolbar-left">
          <button
            onClick={handleJumpToday}
            className="gcal-today-btn"
            title={t('schedule.today')}
          >
            {t('schedule.today')}
          </button>

          <div className="gcal-nav-arrows">
            <button
              onClick={handlePrevWeek}
              className="gcal-arrow-btn"
              title={t('schedule.prev_day')}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNextWeek}
              className="gcal-arrow-btn"
              title={t('schedule.next_day')}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <h2 className="gcal-title-date">{headerTitle}</h2>
        </div>

        <div className="gcal-toolbar-right">
          {/* Quick Filters */}
          <div className="gcal-filter-pill-group">
            <button
              className={`gcal-filter-pill ${filter === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilter('ALL')}
            >
              {t('schedule.filter_all')}
            </button>
            <button
              className={`gcal-filter-pill ${filter === 'CLASS' ? 'active' : ''}`}
              onClick={() => setFilter('CLASS')}
            >
              <span className="gcal-legend-dot dot-class" />
              {t('schedule.filter_class')}
            </button>
            <button
              className={`gcal-filter-pill ${filter === 'EXAM' ? 'active' : ''}`}
              onClick={() => setFilter('EXAM')}
            >
              <span className="gcal-legend-dot dot-exam" />
              {t('schedule.filter_exam')}
            </button>
            <button
              className={`gcal-filter-pill ${filter === 'DEADLINE' ? 'active' : ''}`}
              onClick={() => setFilter('DEADLINE')}
            >
              <span className="gcal-legend-dot dot-deadline" />
              {t('schedule.filter_deadline')}
            </button>
            <button
              className={`gcal-filter-pill ${filter === 'MEETING' ? 'active' : ''}`}
              onClick={() => setFilter('MEETING')}
            >
              <span className="gcal-legend-dot dot-meeting" />
              {t('schedule.filter_meeting')}
            </button>
          </div>

          {onOpenCreate && (
            <button
              onClick={onOpenCreate}
              className="btn btn-primary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600,
                borderRadius: '6px'
              }}
            >
              <Plus size={15} />
              <span>{t('schedule.add_timetable_event')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. STICKY DAY HEADER (Google Calendar Blue Circle for Today) */}
      <div className="gcal-header-row">
        <div className="gcal-header-tz">GMT+7</div>
        {daysOfWeek.map((day, idx) => {
          const isToday = isDateToday(day);
          return (
            <div
              key={idx}
              className={`gcal-header-col ${isToday ? 'is-today' : ''}`}
              onClick={() => onSlotClick?.(day, 7)}
            >
              <div className="gcal-day-label">{getDayShortLabel(day)}</div>
              <div className="gcal-day-number">{day.getDate()}</div>
            </div>
          );
        })}
      </div>

      {/* 3. ALL-DAY TRAY / DEADLINES SECTION */}
      {allDayRowHasItems && (
        <div className="gcal-allday-row">
          <div className="gcal-allday-label">{t('schedule.all_day_tray')}</div>
          {daysOfWeek.map((day, idx) => {
            const { allDay } = getDayItems(day);
            return (
              <div key={idx} className="gcal-allday-cell">
                {allDay.map((item) => (
                  <div
                    key={item.id}
                    className="gcal-allday-chip"
                    onClick={(e) => {
                      e.stopPropagation();
                      onItemClick(item);
                    }}
                    title={item.title}
                  >
                    {item.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. SCROLLABLE TIMETABLE GRID */}
      <div className="gcal-grid-scroll" ref={gridScrollRef}>
        <div className="gcal-grid-body">
          {/* Time Gutter Column */}
          <div className="gcal-time-gutter">
            {Array.from({ length: TOTAL_HOURS }, (_, i) => {
              const hour = START_HOUR + i;
              const shift = ACADEMIC_SHIFTS[hour];
              const hourStr = `${String(hour).padStart(2, '0')}:00`;

              return (
                <div key={hour} className="gcal-time-slot-label">
                  <span>{hourStr}</span>
                  {shift && (
                    <span className="gcal-shift-badge" title={shift.time}>
                      {shift.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* 7 Day Column Lanes */}
          {daysOfWeek.map((day, dayIdx) => {
            const isToday = isDateToday(day);
            const { timed } = getDayItems(day);
            const positionedEvents = layoutDayEvents(timed);

            return (
              <div
                key={dayIdx}
                className={`gcal-day-lane ${isToday ? 'is-today-lane' : ''}`}
              >
                {/* 1-Hour Clickable Cells */}
                {Array.from({ length: TOTAL_HOURS }, (_, i) => {
                  const hour = START_HOUR + i;
                  return (
                    <div
                      key={hour}
                      className="gcal-hour-cell"
                      onClick={() => {
                        const slotDate = new Date(day);
                        slotDate.setHours(hour, 0, 0, 0);
                        onSlotClick?.(slotDate, hour);
                      }}
                      title={`${getDayShortLabel(day)} ${day.getDate()}/${day.getMonth() + 1} - ${String(hour).padStart(2, '0')}:00`}
                    />
                  );
                })}

                {/* Real-time Indicator Line (Only on Today's Column) */}
                {isToday && isIndicatorVisible && (
                  <div
                    className="gcal-current-time-line"
                    style={{ top: `${currentIndicatorTop}px` }}
                  >
                    <div className="gcal-current-time-circle" />
                  </div>
                )}

                {/* Event Cards */}
                {positionedEvents.map((pos) => {
                  const item = pos.item;
                  return (
                    <div
                      key={item.id}
                      className={`gcal-event-card ${getEventTypeClass(item)}`}
                      style={{
                        top: `${pos.top}px`,
                        height: `${pos.height}px`,
                        left: `calc(${pos.leftPct}% + 3px)`,
                        width: `calc(${pos.widthPct}% - 6px)`
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemClick(item);
                      }}
                      title={`${item.title} (${item.startTime ? formatTimeRange(item.startTime, item.endTime || item.startTime) : ''})`}
                    >
                      <div className="gcal-event-title">{item.title}</div>
                      {item.startTime && (
                        <div className="gcal-event-time">
                          <Clock size={10} />
                          <span>{formatTimeRange(item.startTime, item.endTime || item.startTime)}</span>
                        </div>
                      )}
                      {item.location && (
                        <div className="gcal-event-location">
                          <MapPin size={10} />
                          <span>{item.location}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
