import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { api } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { ScheduleEventType } from '@snote/shared';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDate?: Date;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultDate
}) => {
  const { subjects, selectedSemesterId } = useAppFilter();
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [eventType, setEventType] = useState<ScheduleEventType>(ScheduleEventType.CLASS);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const base = defaultDate || new Date();
    const startStr = new Date(base.setHours(8, 0, 0, 0)).toISOString().slice(0, 16);
    const endStr = new Date(base.setHours(11, 30, 0, 0)).toISOString().slice(0, 16);
    setStartTime(startStr);
    setEndTime(endStr);
    setTitle('');
    setLocation('');
    setSubjectId(subjects[0]?.id || '');
    setEventType(ScheduleEventType.CLASS);
  }, [defaultDate, subjects, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/schedule', {
        semesterId: selectedSemesterId || undefined,
        subjectId: subjectId || undefined,
        title: title.trim(),
        eventType,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        location: location.trim() || undefined
      });

      showToast('Thêm sự kiện lịch thành công!', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu lịch trình', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm Lịch Học & Sự Kiện Mới">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Tên sự kiện / Tiêu đề buổi học *
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: Buổi học Lý thuyết Kiến trúc Phần mềm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Môn học (Nếu có)
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
            >
              <option value="">-- Không gắn môn --</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code ? `[${sub.code}] ` : ''}{sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Loại sự kiện
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as ScheduleEventType)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
            >
              <option value={ScheduleEventType.CLASS}>🏫 Lớp học cố định (CLASS)</option>
              <option value={ScheduleEventType.EXAM}>🎯 Lịch thi / Kiểm tra (EXAM)</option>
              <option value={ScheduleEventType.DEADLINE}>⏰ Hạn nộp bài tập (DEADLINE)</option>
              <option value={ScheduleEventType.GROUP_MEETING}>👥 Họp nhóm đồ án (GROUP)</option>
              <option value={ScheduleEventType.PERSONAL}>☕ Việc cá nhân (PERSONAL)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Bắt đầu *
            </label>
            <input
              type="datetime-local"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Kết thúc *
            </label>
            <input
              type="datetime-local"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Địa điểm / Phòng học / Link Meet
          </label>
          <input
            type="text"
            placeholder="Phòng B1-302 hoặc Google Meet"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--accent-primary)', color: '#fff', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Đang lưu...' : 'Thêm Sự Kiện'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
