import React, { useState, useEffect, useCallback } from 'react';
import { api, ApiResponse } from '../../../services/api';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useToast } from '../../../contexts/ToastContext';
import { EventModal } from '../components/EventModal';
import { ScheduleEventType, TaskStatus } from '@snote/shared';
import confetti from 'canvas-confetti';
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
  Users,
  CheckCircle2,
  Circle,
  FolderKanban,
  CheckSquare,
  Flame
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

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: nextStatus });
      if (nextStatus === 'DONE') {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
        showToast('🎉 Tuyệt vời! Đã hoàn thành nhiệm vụ!', 'success');
      } else {
        showToast('Đã mở lại nhiệm vụ', 'info');
      }
      fetchEvents();
    } catch (err: any) {
      showToast(err.message || 'Lỗi cập nhật nhiệm vụ', 'error');
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
              Thời Khóa Biểu & Lịch Trình Hợp Nhất
            </h1>
            <span className="badge badge-blue">{events.length} mốc lịch tuần này</span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Đồng bộ toàn diện: Tiết học trên lớp, Hạn nộp bài tập (Tasks), và Deadline Đồ án nhóm
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '14px', alignItems: 'start' }}>
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
                  minHeight: '420px',
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

                {/* Day Events & Tasks List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  {dayEvents.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11.5px', marginTop: '40px' }}>
                      Trống
                    </div>
                  ) : (
                    dayEvents.map((item) => {
                      // 1. Task Item
                      if (item.itemType === 'TASK') {
                        const isDone = item.status === 'DONE';
                        return (
                          <div
                            key={item.id}
                            className="snote-card animate-fade-in"
                            style={{
                              backgroundColor: 'var(--bg-primary)',
                              borderLeft: '3px solid var(--color-warning)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '10px',
                              boxShadow: 'none',
                              opacity: isDone ? 0.7 : 1
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span className="badge badge-amber" style={{ fontSize: '9.5px', padding: '1px 5px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <CheckSquare size={10} />
                                <span>Hạn Task</span>
                              </span>

                              {item.priority && (
                                <span className={`badge ${item.priority === 'URGENT' ? 'badge-rose' : 'badge-neutral'}`} style={{ fontSize: '9px', padding: '1px 4px' }}>
                                  {item.priority}
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                              <button
                                onClick={() => handleToggleTaskStatus(item.id, item.status)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: isDone ? 'var(--color-success)' : 'var(--text-muted)',
                                  display: 'flex',
                                  padding: 0,
                                  marginTop: '2px'
                                }}
                                title={isDone ? 'Mở lại' : 'Hoàn thành'}
                              >
                                {isDone ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                              </button>

                              <div
                                style={{
                                  fontWeight: 600,
                                  fontSize: '12px',
                                  color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                                  textDecoration: isDone ? 'line-through' : 'none',
                                  lineHeight: 1.35
                                }}
                              >
                                {item.title}
                              </div>
                            </div>

                            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                              <Clock size={10} />
                              <span>{new Date(item.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                              {item.project && <span style={{ color: 'var(--color-purple)' }}>• {item.project.name}</span>}
                            </div>
                          </div>
                        );
                      }

                      // 2. Project Deadline Item
                      if (item.itemType === 'PROJECT') {
                        return (
                          <div
                            key={item.id}
                            className="snote-card animate-fade-in"
                            style={{
                              backgroundColor: 'var(--bg-primary)',
                              borderLeft: '3px solid var(--color-purple)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '10px',
                              boxShadow: 'none'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span className="badge badge-purple" style={{ fontSize: '9.5px', padding: '1px 5px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <FolderKanban size={10} />
                                <span>Hạn Đồ Án</span>
                              </span>
                            </div>

                            <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.35 }}>
                              {item.title}
                            </div>

                            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                              <Clock size={10} />
                              <span>{new Date(item.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        );
                      }

                      // 3. Regular Schedule Event
                      const badge = getEventBadge(item.eventType);
                      const timeStr = `${new Date(item.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(item.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

                      return (
                        <div
                          key={item.id}
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
                              onClick={() => handleDelete(item.id, item.title)}
                              className="btn btn-ghost btn-icon"
                              style={{ padding: '2px', color: 'var(--text-muted)' }}
                              title="Xóa sự kiện"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>

                          <div style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.35 }}>
                            {item.title}
                          </div>

                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                            <Clock size={11} />
                            <span>{timeStr}</span>
                          </div>

                          {item.location && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={11} />
                              <span>{item.location}</span>
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
