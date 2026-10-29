import React, { useState, useEffect, useCallback } from 'react';
import { api, ApiResponse } from '../../../services/api';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useToast } from '../../../contexts/ToastContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { EventModal } from '../components/EventModal';
import { TaskModal } from '../../tasks/components/TaskModal';
import { GanttTimelineView, GanttItem } from '../components/GanttTimelineView';
import { TasksHourlyView } from '../../tasks/components/TasksHourlyView';
import { Plus, Sparkles, BookOpen, Clock, Calendar, TrendingUp } from 'lucide-react';

export const ScheduleWeekPage: React.FC = () => {
  const { selectedSubjectId, selectedSemesterId, subjects } = useAppFilter();
  const { t, language } = useLanguage();
  const [scheduleViewMode, setScheduleViewMode] = useState<'HOURLY' | 'MONTHLY'>('HOURLY');
  const [currentGanttDate, setCurrentGanttDate] = useState<Date>(() => new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<any | null>(null);
  const [selectedDateForNewEvent, setSelectedDateForNewEvent] = useState<Date | undefined>(undefined);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const { showToast } = useToast();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const year = currentGanttDate.getFullYear();
      const month = currentGanttDate.getMonth();
      const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const endDate = new Date(year, month + 2, 28, 23, 59, 59, 999);

      const params = new URLSearchParams();
      params.append('startDate', startDate.toISOString());
      params.append('endDate', endDate.toISOString());
      if (selectedSubjectId) params.append('subjectId', selectedSubjectId);
      if (selectedSemesterId) params.append('semesterId', selectedSemesterId);

      const res = await api.get<ApiResponse<any[]>>(`/schedule?${params.toString()}`);
      setEvents(res.data || []);
    } catch {
      showToast(language === 'vi' ? 'Không thể tải dữ liệu lịch trình học tập' : 'Failed to fetch schedule data', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentGanttDate, selectedSubjectId, selectedSemesterId, showToast, language]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleOpenTaskDetail = async (taskId: string, fallbackItem: any) => {
    try {
      const res = await api.get<ApiResponse<any>>(`/tasks/${taskId}`);
      setSelectedTask(res.data || fallbackItem);
    } catch {
      setSelectedTask(fallbackItem);
    }
    setIsTaskModalOpen(true);
  };

  const handleGanttItemClick = (item: GanttItem) => {
    if (item.itemType === 'TASK') {
      handleOpenTaskDetail(item.id, item);
    } else if (item.itemType === 'PROJECT') {
      setSelectedTask(item);
      setIsTaskModalOpen(true);
    } else {
      setEventToEdit(item);
      setSelectedDateForNewEvent(undefined);
      setIsModalOpen(true);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDateForNewEvent(date);
    setEventToEdit(null);
    setIsModalOpen(true);
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top Header: View Switcher & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '2px',
              gap: '2px'
            }}
          >
            <button
              onClick={() => setScheduleViewMode('HOURLY')}
              className={`btn btn-sm ${scheduleViewMode === 'HOURLY' ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '11.5px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: scheduleViewMode === 'HOURLY' ? 'var(--accent)' : 'transparent',
                color: scheduleViewMode === 'HOURLY' ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              <Clock size={14} />
              <span>{language === 'vi' ? 'Khung giờ hàng ngày' : 'Daily Hourly'}</span>
            </button>

            <button
              onClick={() => setScheduleViewMode('MONTHLY')}
              className={`btn btn-sm ${scheduleViewMode === 'MONTHLY' ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '11.5px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: scheduleViewMode === 'MONTHLY' ? 'var(--accent)' : 'transparent',
                color: scheduleViewMode === 'MONTHLY' ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              <Calendar size={14} />
              <span>{language === 'vi' ? 'Sơ đồ tháng (Gantt)' : 'Monthly Gantt'}</span>
            </button>
          </div>

          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
            {events.length} {language === 'vi' ? 'mốc sự kiện & lịch trình' : 'schedule milestones'}
          </span>
        </div>

        <button
          onClick={() => {
            setEventToEdit(null);
            setSelectedDateForNewEvent(undefined);
            setIsModalOpen(true);
          }}
          className="btn btn-primary btn-sm"
          style={{ fontWeight: 700, gap: '6px', padding: '6px 14px', borderRadius: 'var(--radius-md)' }}
        >
          <Plus size={15} />
          <span>{t('schedule.add_event')}</span>
        </button>
      </div>

      {/* Main Schedule View Canvas */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <Sparkles className="animate-spin" size={24} style={{ margin: '0 auto 12px auto', color: 'var(--accent-primary)' }} />
          <div>{t('common.loading')}</div>
        </div>
      ) : scheduleViewMode === 'HOURLY' ? (
        <TasksHourlyView
          tasks={events}
          onSelectTask={handleGanttItemClick}
          onOpenCreate={() => {
            setEventToEdit(null);
            setSelectedDateForNewEvent(undefined);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <GanttTimelineView
          items={events}
          currentDate={currentGanttDate}
          onDateChange={(d) => setCurrentGanttDate(d)}
          onItemClick={handleGanttItemClick}
          onDateClick={handleDateClick}
        />
      )}

      {/* Event Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEventToEdit(null);
          setSelectedDateForNewEvent(undefined);
        }}
        onSuccess={fetchEvents}
        defaultDate={selectedDateForNewEvent}
        eventToEdit={eventToEdit}
      />

      {/* Task Detail Modal from Schedule */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        onSuccess={fetchEvents}
        taskToEdit={selectedTask}
        initialMode="VIEW"
      />
    </div>
  );
};
