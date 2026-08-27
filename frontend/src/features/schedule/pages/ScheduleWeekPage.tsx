import React, { useState, useEffect, useCallback } from 'react';
import { api, ApiResponse } from '../../../services/api';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useToast } from '../../../contexts/ToastContext';
import { EventModal } from '../components/EventModal';
import { ScheduleEventType } from '@snote/shared';

export const ScheduleWeekPage: React.FC = () => {
  const { selectedSubjectId, selectedSemesterId } = useAppFilter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Thứ Hai
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  const { showToast } = useToast();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const params = new URLSearchParams();
      params.append('startDate', currentWeekStart.toISOString());
      params.append('endDate', weekEnd.toISOString());
      if (selectedSubjectId) params.append('subjectId', selectedSubjectId);
      if (selectedSemesterId) params.append('semesterId', selectedSemesterId);

      const res = await api.get<ApiResponse<any[]>>(`/schedule?${params.toString()}`);
      setEvents(res.data || []);
    } catch {
      showToast('Không thể tải lịch trình', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart, selectedSubjectId, selectedSemesterId, showToast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sự kiện "${title}" không?`)) return;

    try {
      await api.delete(`/schedule/${id}`);
      showToast(`Đã xóa sự kiện "${title}"`, 'success');
      fetchEvents();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa sự kiện', 'error');
    }
  };

  const handlePrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const handleCurrentWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  const daysOfWeek = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const getEventBadge = (type: ScheduleEventType) => {
    switch (type) {
      case ScheduleEventType.CLASS:
        return { label: 'Lớp học', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' };
      case ScheduleEventType.EXAM:
        return { label: 'Lịch thi', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
      case ScheduleEventType.DEADLINE:
        return { label: 'Hạn nộp', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
      case ScheduleEventType.GROUP_MEETING:
        return { label: 'Họp nhóm', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' };
      default:
        return { label: 'Cá nhân', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
            📅 Thời Khóa Biểu & Lịch Trình Tuần
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
            Theo dõi các buổi học cố định, lịch thi và các mốc deadline quan trọng
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            padding: '11px 20px',
            borderRadius: '8px',
            border: 'none',
            background: 'var(--accent-primary)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(59,130,246,0.3)'
          }}
        >
          + Thêm Sự Kiện Lịch
        </button>
      </div>

      {/* Week Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', backgroundColor: 'var(--bg-secondary)', padding: '12px 18px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handlePrevWeek}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            ← Tuần trước
          </button>
          <button
            onClick={handleCurrentWeek}
            style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--accent-primary)', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer' }}
          >
            Tuần này
          </button>
          <button
            onClick={handleNextWeek}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            Tuần sau →
          </button>
        </div>

        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
          {weekDays[0].toLocaleDateString('vi-VN')} &nbsp;–&nbsp; {weekDays[6].toLocaleDateString('vi-VN')}
        </div>
      </div>

      {/* 7 Days Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          Đang tải lịch trình...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px', alignItems: 'start' }}>
          {weekDays.map((day, idx) => {
            const isToday = new Date().toDateString() === day.toDateString();
            const dayEvents = events.filter((e) => new Date(e.startTime).toDateString() === day.toDateString());

            return (
              <div
                key={day.toISOString()}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: isToday ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '12px 10px',
                  minHeight: '360px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Day Header */}
                <div style={{ textAlign: 'center', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: isToday ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                    {daysOfWeek[idx]}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: isToday ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                    {day.getDate()}
                  </div>
                </div>

                {/* Events list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  {dayEvents.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '11px', marginTop: '30px' }}>
                      Trống
                    </div>
                  ) : (
                    dayEvents.map((evt) => {
                      const badge = getEventBadge(evt.eventType);
                      const timeStr = `${new Date(evt.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(evt.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

                      return (
                        <div
                          key={evt.id}
                          style={{
                            backgroundColor: 'var(--bg-primary)',
                            borderLeft: `3px solid ${badge.color}`,
                            borderRadius: '6px',
                            padding: '8px',
                            fontSize: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: badge.color }}>
                              {badge.label}
                            </span>
                            <button
                              onClick={() => handleDelete(evt.id, evt.title)}
                              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '10px', padding: 0 }}
                            >
                              ✕
                            </button>
                          </div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px', lineHeight: 1.3 }}>
                            {evt.title}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                            ⏰ {timeStr}
                          </div>
                          {evt.location && (
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                              📍 {evt.location}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchEvents}
      />
    </div>
  );
};
