import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { StudyDateTimePicker } from '../../../components/common/StudyDateTimePicker';
import { api, ApiResponse } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { ScheduleEventType } from '@snote/shared';
import {
  Calendar,
  Clock,
  MapPin,
  Save,
  BookOpen,
  GraduationCap,
  Users,
  User,
  Trash2,
  Sparkles,
  Repeat,
  Link,
  FileText,
  Flame,
  CheckCircle2
} from 'lucide-react';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDate?: Date;
  eventToEdit?: any | null;
}

const toLocalDateTime = (value: Date) => {
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
};

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultDate,
  eventToEdit
}) => {
  const { subjects, selectedSemesterId } = useAppFilter();
  const [projects, setProjects] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [eventType, setEventType] = useState<ScheduleEventType>(ScheduleEventType.CLASS);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [examFormat, setExamFormat] = useState<string>('MULTIPLE_CHOICE');
  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatWeeks, setRepeatWeeks] = useState(15);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    // Fetch user projects for Group Meeting mode
    api.get<ApiResponse<any[]>>('/projects')
      .then((res) => setProjects(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title || '');
      setSubjectId(eventToEdit.subjectId || '');
      setEventType(eventToEdit.eventType || ScheduleEventType.CLASS);
      setStartTime(eventToEdit.startTime ? toLocalDateTime(new Date(eventToEdit.startTime)) : '');
      setEndTime(eventToEdit.endTime ? toLocalDateTime(new Date(eventToEdit.endTime)) : '');
      setLocation(eventToEdit.location || '');
      setIsRecurring(Boolean(eventToEdit.isRecurring));
    } else {
      const base = defaultDate ? new Date(defaultDate) : new Date();
      // Default to 07:00 - 09:25 (Ca 1)
      const startD = new Date(base);
      startD.setHours(7, 0, 0, 0);
      const endD = new Date(base);
      endD.setHours(9, 25, 0, 0);

      setStartTime(toLocalDateTime(startD));
      setEndTime(toLocalDateTime(endD));
      setTitle('');
      setLocation('');
      setSubjectId(subjects[0]?.id || '');
      setProjectId('');
      setEventType(ScheduleEventType.CLASS);
      setIsRecurring(false);
      setRepeatWeeks(15);
    }
  }, [defaultDate, subjects, isOpen, eventToEdit]);

  // Handle Academic Shift Presets
  const applyShiftPreset = (startH: number, startM: number, endH: number, endM: number) => {
    const base = startTime ? new Date(startTime) : defaultDate ? new Date(defaultDate) : new Date();
    const s = new Date(base);
    s.setHours(startH, startM, 0, 0);
    const e = new Date(base);
    e.setHours(endH, endM, 0, 0);

    setStartTime(toLocalDateTime(s));
    setEndTime(toLocalDateTime(e));
  };

  const handleSubjectChange = (subId: string) => {
    setSubjectId(subId);
    if (!title || title.startsWith('Tiết học')) {
      const found = subjects.find((s) => s.id === subId);
      if (found) {
        setTitle(`Tiết học ${found.name}`);
      }
    }
  };

  const handleDelete = async () => {
    if (!eventToEdit?.id) return;
    if (!window.confirm(`Bạn có chắc muốn xóa sự kiện "${eventToEdit.title}" không?`)) return;

    setLoading(true);
    try {
      await api.delete(`/schedule/${eventToEdit.id}`);
      showToast('Đã xóa sự kiện lịch trình', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa sự kiện', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Vui lòng nhập tên sự kiện', 'warning');
      return;
    }

    setLoading(true);
    try {
      let finalLocation = location.trim();
      if (eventType === ScheduleEventType.EXAM && examFormat) {
        const formatMap: Record<string, string> = {
          MULTIPLE_CHOICE: 'Trắc nghiệm',
          ESSAY: 'Tự luận',
          ORAL: 'Vấn đáp',
          PROJECT_DEFENSE: 'Báo cáo đồ án'
        };
        const formatLabel = formatMap[examFormat] || examFormat;
        if (finalLocation) {
          finalLocation = `${finalLocation} (${formatLabel})`;
        } else {
          finalLocation = `Hình thức: ${formatLabel}`;
        }
      }

      if (eventToEdit) {
        await api.put(`/schedule/${eventToEdit.id}`, {
          semesterId: selectedSemesterId || undefined,
          subjectId: subjectId || undefined,
          title: title.trim(),
          eventType,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          location: finalLocation || undefined,
          isRecurring
        });
        showToast('Cập nhật sự kiện lịch trình thành công!', 'success');
      } else {
        await api.post('/schedule', {
          semesterId: selectedSemesterId || undefined,
          subjectId: subjectId || undefined,
          title: title.trim(),
          eventType,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          location: finalLocation || undefined,
          isRecurring,
          repeatWeeks: isRecurring ? repeatWeeks : undefined
        });

        if (isRecurring && repeatWeeks > 1) {
          showToast(`🎉 Đã tạo lịch lặp lại cho ${repeatWeeks} tuần học kỳ thành công!`, 'success');
        } else {
          showToast('Thêm sự kiện lịch trình thành công!', 'success');
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu lịch trình', 'error');
    } finally {
      setLoading(false);
    }
  };

  const eventTypeTabs = [
    { type: ScheduleEventType.CLASS, label: '📖 Tiết Học', icon: BookOpen, color: '#38bdf8' },
    { type: ScheduleEventType.EXAM, label: '🎯 Lịch Thi', icon: GraduationCap, color: '#ef4444' },
    { type: ScheduleEventType.GROUP_MEETING, label: '👥 Họp Nhóm', icon: Users, color: '#a855f7' },
    { type: ScheduleEventType.PERSONAL, label: '👤 Việc Cá Nhân', icon: User, color: '#10b981' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={eventToEdit ? 'Chỉnh Sửa Sự Kiện Lịch Trình' : 'Đặt Lịch Học Tập Thông Minh'}
      maxWidth="720px"
      icon={<Calendar size={22} />}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 1. Mode Tabs Switcher */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '6px',
            backgroundColor: 'var(--bg-secondary)',
            padding: '4px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)'
          }}
        >
          {eventTypeTabs.map((tab) => {
            const isSelected = eventType === tab.type;
            return (
              <button
                key={tab.type}
                type="button"
                onClick={() => setEventType(tab.type)}
                className="btn btn-sm"
                style={{
                  fontSize: '12.5px',
                  fontWeight: isSelected ? 700 : 500,
                  backgroundColor: isSelected ? 'var(--accent-primary)' : 'transparent',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '7px 4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 2. Academic Shift Preset Slots (1-Click Fast Fill) */}
        <div
          style={{
            backgroundColor: 'rgba(56, 189, 248, 0.05)',
            border: '1px dashed rgba(56, 189, 248, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--accent-primary)' }}>
              <Clock size={13} />
              <span>Chọn nhanh Ca / Tiết học đại học:</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => applyShiftPreset(7, 0, 9, 25)}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '11.5px', padding: '3px 9px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}
              title="Tiết 1-3 (Sáng sớm)"
            >
              🌅 Ca 1 (07:00 - 09:25)
            </button>
            <button
              type="button"
              onClick={() => applyShiftPreset(9, 35, 12, 0)}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '11.5px', padding: '3px 9px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}
              title="Tiết 4-6 (Giữa sáng)"
            >
              ☀️ Ca 2 (09:35 - 12:00)
            </button>
            <button
              type="button"
              onClick={() => applyShiftPreset(12, 30, 14, 55)}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '11.5px', padding: '3px 9px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}
              title="Tiết 7-9 (Đầu chiều)"
            >
              🌤️ Ca 3 (12:30 - 14:55)
            </button>
            <button
              type="button"
              onClick={() => applyShiftPreset(15, 5, 17, 30)}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '11.5px', padding: '3px 9px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}
              title="Tiết 10-12 (Cuối chiều)"
            >
              🌆 Ca 4 (15:05 - 17:30)
            </button>
            <button
              type="button"
              onClick={() => applyShiftPreset(18, 0, 20, 30)}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '11.5px', padding: '3px 9px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}
              title="Tiết 13-15 (Tối)"
            >
              🌙 Ca 5 (18:00 - 20:30)
            </button>
          </div>
        </div>

        {/* 3. Event Title */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Tên sự kiện / Tiết học *
          </label>
          <input
            type="text"
            required
            placeholder={
              eventType === ScheduleEventType.CLASS
                ? 'Ví dụ: Tiết học Lập trình Web nâng cao'
                : eventType === ScheduleEventType.EXAM
                ? 'Ví dụ: Thi cuối kỳ Mạng máy tính'
                : eventType === ScheduleEventType.GROUP_MEETING
                ? 'Ví dụ: Họp Sprint Review đồ án SNOTE'
                : 'Ví dụ: Học nhóm tại Thư viện trung tâm'
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="snote-input"
            style={{ fontSize: '14px', padding: '10px 14px' }}
          />
        </div>

        {/* 4. Contextual Selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: eventType === ScheduleEventType.GROUP_MEETING ? '1fr 1fr' : '1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Môn học liên quan
            </label>
            <select
              value={subjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="snote-select"
              style={{ fontSize: '13.5px', padding: '9px 12px' }}
            >
              <option value="">-- Không thuộc môn cụ thể --</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code ? `[${sub.code}] ` : ''}{sub.name}
                </option>
              ))}
            </select>
          </div>

          {eventType === ScheduleEventType.GROUP_MEETING && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Đồ án nhóm liên quan
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="snote-select"
                style={{ fontSize: '13.5px', padding: '9px 12px' }}
              >
                <option value="">-- Chọn đồ án (Tùy chọn) --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    📁 {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 5. Exam Specific Fields */}
        {eventType === ScheduleEventType.EXAM && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 'var(--radius-lg)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Flame size={15} />
              <span>Thông tin phòng thi & Hình thức đánh giá</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Hình thức thi:
                </label>
                <select
                  value={examFormat}
                  onChange={(e) => setExamFormat(e.target.value)}
                  className="snote-select"
                  style={{ fontSize: '12.5px', padding: '7px 10px' }}
                >
                  <option value="MULTIPLE_CHOICE">📝 Trắc nghiệm trên máy</option>
                  <option value="ESSAY">✍️ Tự luận trên giấy</option>
                  <option value="ORAL">🗣️ Vấn đáp trực tiếp</option>
                  <option value="PROJECT_DEFENSE">💻 Báo cáo bảo vệ đồ án</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Phòng thi / Số báo danh:
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: P.501-A2 | SBD: 45"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="snote-input"
                  style={{ fontSize: '12.5px', padding: '7px 10px' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 6. Start Time & End Time */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <StudyDateTimePicker
            value={startTime}
            onChange={setStartTime}
            label="Thời gian bắt đầu"
            placeholder="Chọn giờ bắt đầu..."
            required
            align="left"
          />

          <StudyDateTimePicker
            value={endTime}
            onChange={setEndTime}
            label="Thời gian kết thúc"
            placeholder="Chọn giờ kết thúc..."
            required
            align="right"
          />
        </div>

        {/* 7. Location (if not already rendered in Exam mode) */}
        {eventType !== ScheduleEventType.EXAM && (
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              {eventType === ScheduleEventType.GROUP_MEETING ? 'Link họp online / Phòng học' : 'Địa điểm / Phòng học'}
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <MapPin size={16} />
              </span>
              <input
                type="text"
                placeholder={
                  eventType === ScheduleEventType.GROUP_MEETING
                    ? 'Ví dụ: meet.google.com/abc-xyz hoặc P.Tự học Thư viện'
                    : 'Ví dụ: Phòng 302-G2 hoặc Giảng đường 1'
                }
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="snote-input"
                style={{ paddingLeft: '38px', fontSize: '13.5px', padding: '9px 12px 9px 38px' }}
              />
            </div>
          </div>
        )}

        {/* 8. Semester Recurring Generator (Only on Create mode) */}
        {!eventToEdit && (
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  margin: 0
                }}
              >
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Repeat size={14} style={{ color: 'var(--accent-primary)' }} />
                  <span>Lặp lại hàng tuần cho cả Học kỳ</span>
                </span>
              </label>

              {isRecurring && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Trong</span>
                  <select
                    value={repeatWeeks}
                    onChange={(e) => setRepeatWeeks(Number(e.target.value))}
                    className="snote-select"
                    style={{ fontSize: '12px', padding: '3px 8px', height: '28px', width: '90px' }}
                  >
                    <option value={5}>5 tuần</option>
                    <option value={10}>10 tuần</option>
                    <option value={15}>15 tuần</option>
                    <option value={18}>18 tuần</option>
                  </select>
                </div>
              )}
            </div>

            {isRecurring && (
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                💡 SNOTE sẽ tự động sinh lịch học đều đặn vào ngày này hàng tuần trong {repeatWeeks} tuần tới. Bạn không cần phải tạo lại từng tuần!
              </div>
            )}
          </div>
        )}

        {/* 9. Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
          {eventToEdit ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--color-danger)', gap: '4px', padding: '8px 12px' }}
            >
              <Trash2 size={15} />
              <span>Xóa Sự Kiện</span>
            </button>
          ) : <div />}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '9px 18px' }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ fontWeight: 700, padding: '9px 22px', gap: '6px' }}
            >
              <Save size={16} />
              <span>{loading ? 'Đang lưu...' : eventToEdit ? 'Lưu Thay Đổi' : 'Tạo Lịch Học'}</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
