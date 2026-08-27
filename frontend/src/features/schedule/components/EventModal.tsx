import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { api } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { ScheduleEventType } from '@snote/shared';
import { Calendar, Clock, MapPin, Layers, Save, Tag } from 'lucide-react';

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

      showToast('Thêm sự kiện lịch trình thành công!', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu lịch trình', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm Lịch Học & Sự Kiện Mới"
      maxWidth="600px"
      icon={<Calendar size={20} />}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Title */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Tên sự kiện / Tiêu đề buổi học *
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: Buổi học Lý thuyết Kiến trúc Phần mềm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="snote-input"
            style={{ fontSize: '14.5px', fontWeight: 600 }}
          />
        </div>

        {/* Subject & Event Type */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Môn học (Nếu có)
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="snote-select"
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
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Loại sự kiện
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as ScheduleEventType)}
              className="snote-select"
            >
              <option value={ScheduleEventType.CLASS}>🏫 Tiết học cố định (CLASS)</option>
              <option value={ScheduleEventType.EXAM}>🎯 Lịch thi / Kiểm tra (EXAM)</option>
              <option value={ScheduleEventType.DEADLINE}>⏰ Hạn nộp bài (DEADLINE)</option>
              <option value={ScheduleEventType.GROUP_MEETING}>👥 Họp nhóm đồ án (GROUP)</option>
              <option value={ScheduleEventType.PERSONAL}>☕ Việc cá nhân (PERSONAL)</option>
            </select>
          </div>
        </div>

        {/* Start and End Times */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Bắt đầu *
            </label>
            <input
              type="datetime-local"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="snote-input"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Kết thúc *
            </label>
            <input
              type="datetime-local"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="snote-input"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Địa điểm / Phòng học / Link Online
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
              <MapPin size={15} />
            </span>
            <input
              type="text"
              placeholder="Ví dụ: Phòng B1-302 hoặc Google Meet"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="snote-input"
              style={{ paddingLeft: '36px' }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            <Save size={15} />
            <span>{loading ? 'Đang lưu...' : 'Thêm Vào Lịch'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
