import React, { useState, useEffect, useCallback } from 'react';
import { api, ApiResponse } from '../../../services/api';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useToast } from '../../../contexts/ToastContext';
import { EventModal } from '../components/EventModal';
import { ScheduleEventType } from '@snote/shared';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  GraduationCap,
  Sparkles,
  BookOpen,
  AlertCircle,
  Users
} from 'lucide-react';

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
      showToast('Không thể tải lịch trình học tập', 'error');
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
        return { label: 'Tiết học', color: 'var(--color-info)', badgeClass: 'badge-blue' };
      case ScheduleEventType.EXAM:
        return { label: 'Lịch thi', color: 'var(--color-danger)', badgeClass: 'badge-rose' };
      case ScheduleEventType.DEADLINE:
        return { label: 'Hạn chót', color: 'var(--color-warning)', badgeClass: 'badge-amber' };
      case ScheduleEventType.GROUP_MEETING:
        return { label: 'Họp nhóm', color: 'var(--color-purple)', badgeClass: 'badge-purple' };
      default:
        return { label: 'Cá nhân', color: 'var(--color-success)', badgeClass: 'badge-green' };
    }
  };

  return (
    <div style={{ maxWidth: '1380px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Thời Khóa Biểu & Lịch Tuần
            </h1>
            <span className="badge badge-blue">{events.length} sự kiện tuần này</span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Theo dõi các buổi học cố định, ca thi và các mốc deadline quan trọng
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
          style={{ padding: '9px 18px', fontWeight: 700 }}
        >
          <Plus size={16} />
          <span>Thêm Sự Kiện Lịch</span>
        </button>
      </div>

      {/* Week Navigator Bar */}
      <div
        className="snote-card"
        style={{
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handlePrevWeek}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px 12px' }}
          >
            <ChevronLeft size={14} />
            <span>Tuần trước</span>
          </button>
          <button
            onClick={handleCurrentWeek}
            className="btn btn-primary btn-sm"
            style={{ padding: '6px 14px', fontWeight: 700 }}
          >
            Tuần này
          </button>
          <button
            onClick={handleNextWeek}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px 12px' }}
          >
            <span>Tuần sau</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
          <Calendar size={16} style={{ color: 'var(--accent-primary)' }} />
          <span>
            {weekDays[0].toLocaleDateString('vi-VN')} &nbsp;–&nbsp; {weekDays[6].toLocaleDateString('vi-VN')}
          </span>
        </div>
      </div>

      {/* 7 Days Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <Sparkles size={18} className="pulse-urgent" style={{ color: 'var(--accent-primary)' }} />
            <span>Đang tải lịch trình tuần...</span>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px', alignItems: 'start' }}>
          {weekDays.map((day, idx) => {
            const isToday = new Date().toDateString() === day.toDateString();
            const dayEvents = events.filter((e) => new Date(e.startTime).toDateString() === day.toDateString());

            return (
              <div
                key={day.toISOString()}
                className="snote-card"
                style={{
                  backgroundColor: isToday ? 'var(--bg-card)' : 'var(--bg-secondary)',
                  border: isToday ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '14px 10px',
                  minHeight: '400px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: isToday ? 'var(--shadow-accent)' : 'var(--shadow-sm)'
                }}
              >
                {/* Day Column Header */}
                <div style={{ textAlign: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)', marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: isToday ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                    {daysOfWeek[idx]}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: isToday ? 'var(--accent-primary)' : 'var(--text-primary)', marginTop: '2px' }}>
                    {day.getDate()}
                  </div>
                  {isToday && (
                    <span className="badge badge-blue" style={{ fontSize: '9.5px', padding: '1px 6px', marginTop: '4px' }}>
                      Hôm nay
                    </span>
                  )}
                </div>

                {/* Day Events List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  {dayEvents.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11.5px', marginTop: '40px' }}>
                      Trống
                    </div>
                  ) : (
                    dayEvents.map((evt) => {
                      const badge = getEventBadge(evt.eventType);
                      const timeStr = `${new Date(evt.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(evt.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

                      return (
                        <div
                          key={evt.id}
                          className="snote-card animate-fade-in"
                          style={{
                            backgroundColor: 'var(--bg-primary)',
                            borderLeft: `3px solid ${badge.color}`,
                            borderRadius: 'var(--radius-sm)',
                            padding: '10px',
                            boxShadow: 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span className={`badge ${badge.badgeClass}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                              {badge.label}
                            </span>
                            <button
                              onClick={() => handleDelete(evt.id, evt.title)}
                              className="btn btn-ghost btn-icon"
                              style={{ padding: '2px', color: 'var(--text-muted)' }}
                              title="Xóa sự kiện"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>

                          <div style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.35 }}>
                            {evt.title}
                          </div>

                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                            <Clock size={11} />
                            <span>{timeStr}</span>
                          </div>

                          {evt.location && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={11} />
                              <span>{evt.location}</span>
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
