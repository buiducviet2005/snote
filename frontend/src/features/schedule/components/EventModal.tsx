import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { api, ApiResponse } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { ScheduleEventType } from '@snote/shared';
import {
  Calendar,
  Clock,
  MapPin,
  Save,
  Presentation,
  GraduationCap,
  Users,
  User,
  Trash2,
  Repeat,
  BookOpen,
  FolderKanban
} from 'lucide-react';
import './EventModal.css';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDate?: Date;
  eventToEdit?: any | null;
  defaultProjectId?: string;
  defaultSubjectId?: string;
  defaultWorkspaceId?: string;
}

const pad = (part: number) => String(part).padStart(2, '0');

const toDateInputString = (d: Date) => {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const toTimeInputString = (d: Date) => {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// University Academic Shifts (Ca học)
const ACADEMIC_SHIFTS = [
  { id: 1, label: 'Ca 1', start: '07:00', end: '09:25' },
  { id: 2, label: 'Ca 2', start: '09:35', end: '12:00' },
  { id: 3, label: 'Ca 3', start: '12:30', end: '14:55' },
  { id: 4, label: 'Ca 4', start: '15:05', end: '17:30' },
  { id: 5, label: 'Ca 5', start: '18:00', end: '20:30' }
];

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultDate,
  eventToEdit,
  defaultProjectId,
  defaultSubjectId,
  defaultWorkspaceId
}) => {
  const { subjects, selectedSemesterId } = useAppFilter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { t, formatDateTime } = useLanguage();

  const [projects, setProjects] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<ScheduleEventType>(ScheduleEventType.CLASS);
  const [eventDate, setEventDate] = useState(() => toDateInputString(new Date()));
  const [startTimeStr, setStartTimeStr] = useState('07:00');
  const [endTimeStr, setEndTimeStr] = useState('09:25');
  const [isAllDay, setIsAllDay] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatWeeks, setRepeatWeeks] = useState(15);
  const [location, setLocation] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch projects for meeting association
    api.get<ApiResponse<any[]>>('/projects')
      .then((res) => setProjects(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title || '');
      setSubjectId(eventToEdit.subjectId || '');
      setProjectId(eventToEdit.projectId || '');
      setEventType(eventToEdit.eventType || ScheduleEventType.CLASS);
      setLocation(eventToEdit.location || '');
      setIsRecurring(Boolean(eventToEdit.isRecurring));

      const s = new Date(eventToEdit.startTime);
      const e = new Date(eventToEdit.endTime);

      if (!isNaN(s.getTime())) {
        setEventDate(toDateInputString(s));
        setStartTimeStr(toTimeInputString(s));
      }
      if (!isNaN(e.getTime())) {
        setEndTimeStr(toTimeInputString(e));
      }

      const allDayCheck = s.getHours() === 0 && s.getMinutes() === 0 && e.getHours() === 23 && e.getMinutes() >= 50;
      setIsAllDay(allDayCheck);
    } else {
      const base = defaultDate ? new Date(defaultDate) : new Date();
      setEventDate(toDateInputString(base));

      const hasSpecificTime = Boolean(defaultDate && (defaultDate.getHours() !== 0 || defaultDate.getMinutes() !== 0));
      if (hasSpecificTime) {
        setStartTimeStr(toTimeInputString(base));
        const endD = new Date(base);
        endD.setHours(base.getHours() + 1);
        setEndTimeStr(toTimeInputString(endD));
      } else {
        // Default to Ca 1 (07:00 - 09:25)
        setStartTimeStr('07:00');
        setEndTimeStr('09:25');
      }

      setTitle('');
      setLocation('');
      setSubjectId(defaultProjectId ? '' : (defaultSubjectId || ''));
      setProjectId(defaultProjectId || '');
      setEventType(defaultWorkspaceId ? ScheduleEventType.GROUP_MEETING : ScheduleEventType.CLASS);
      setIsAllDay(false);
      setIsRecurring(false);
      setRepeatWeeks(15);
    }
  }, [defaultDate, defaultProjectId, defaultSubjectId, isOpen, eventToEdit, defaultWorkspaceId]);

  // Handle Academic Shift Click
  const handleSelectShift = (shift: typeof ACADEMIC_SHIFTS[0]) => {
    setStartTimeStr(shift.start);
    setEndTimeStr(shift.end);
    setIsAllDay(false);
  };

  // Find if current times match any Ca
  const activeShiftId = !isAllDay
    ? ACADEMIC_SHIFTS.find((s) => s.start === startTimeStr && s.end === endTimeStr)?.id
    : undefined;

  const handleSubjectChange = (subId: string) => {
    setSubjectId(subId);
    if (!title || title.startsWith(t('schedule.class_prefix')) || title.startsWith('Tiết học')) {
      const found = subjects.find((s) => s.id === subId);
      if (found) {
        setTitle(t('schedule.class_title_auto', { name: found.name }));
      }
    }
  };

  const handleDelete = async () => {
    if (!eventToEdit?.id) return;
    if (!window.confirm(t('schedule.delete_confirm_named', { title: eventToEdit.title }))) return;

    setLoading(true);
    try {
      await api.delete(`/schedule/${eventToEdit.id}`);
      showToast(t('schedule.delete_success'), 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || t('schedule.delete_error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast(t('schedule.enter_title_warning'), 'warning');
      return;
    }

    setLoading(true);
    try {
      let finalStartTime: string;
      let finalEndTime: string;

      if (isAllDay) {
        finalStartTime = new Date(`${eventDate}T00:00:00`).toISOString();
        finalEndTime = new Date(`${eventDate}T23:59:59.999`).toISOString();
      } else {
        const s = new Date(`${eventDate}T${startTimeStr}:00`);
        let e = new Date(`${eventDate}T${endTimeStr}:00`);
        if (e <= s) {
          // If end time is before or equal to start, adjust to +1 hour
          e = new Date(s.getTime() + 60 * 60 * 1000);
        }
        finalStartTime = s.toISOString();
        finalEndTime = e.toISOString();
      }

      if (eventToEdit) {
        await api.put(`/schedule/${eventToEdit.id}`, {
          semesterId: defaultWorkspaceId ? undefined : selectedSemesterId || undefined,
          subjectId: subjectId || undefined,
          projectId: projectId || undefined,
          title: title.trim(),
          eventType,
          startTime: finalStartTime,
          endTime: finalEndTime,
          location: location.trim() || undefined,
          isRecurring
        });
        showToast(t('schedule.update_success'), 'success');
      } else {
        await api.post('/schedule', {
          semesterId: defaultWorkspaceId ? undefined : selectedSemesterId || undefined,
          subjectId: subjectId || undefined,
          projectId: projectId || undefined,
          workspaceId: defaultWorkspaceId || undefined,
          title: title.trim(),
          eventType,
          startTime: finalStartTime,
          endTime: finalEndTime,
          location: location.trim() || undefined,
          isRecurring,
          repeatWeeks: isRecurring ? repeatWeeks : undefined
        });

        if (isRecurring && repeatWeeks > 1) {
          showToast(t('schedule.repeat_created_success', { count: repeatWeeks }), 'success');
        } else {
          showToast(t('schedule.create_success'), 'success');
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || t('schedule.save_error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const eventTypeTabs = [
    { type: ScheduleEventType.CLASS, label: t('schedule.type_class'), icon: Presentation },
    { type: ScheduleEventType.EXAM, label: t('schedule.type_exam'), icon: GraduationCap },
    { type: ScheduleEventType.GROUP_MEETING, label: t('schedule.type_meeting'), icon: Users },
    { type: ScheduleEventType.PERSONAL, label: t('schedule.type_personal'), icon: User }
  ];

  if (eventToEdit?.userId && eventToEdit.userId !== user?.id) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('schedule.group_event_title')} maxWidth="500px" icon={<Calendar size={20} />}>
        <div style={{ display: 'grid', gap: '12px', padding: '8px 0', color: 'var(--text-primary)' }}>
          <strong>{eventToEdit.title}</strong>
          <span>{formatDateTime(eventToEdit.startTime)} – {formatDateTime(eventToEdit.endTime)}</span>
          {eventToEdit.location && <span>{eventToEdit.location}</span>}
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>{t('schedule.group_event_readonly')}</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={eventToEdit ? t('schedule.modal_title_edit') : t('schedule.modal_title_add')}
      maxWidth="520px"
      icon={<Calendar size={20} />}
      allowExpand={false}
    >
      <form onSubmit={handleSubmit} className="gcal-event-modal-form">
        {/* 1. Google Calendar Minimalist Title Input */}
        <div className="gcal-modal-title-wrapper">
          <input
            type="text"
            required
            autoFocus
            placeholder={t('schedule.title_placeholder')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="gcal-modal-title-input"
          />
        </div>

        {/* 2. Compact Event Type Pills */}
        <div className="gcal-modal-type-group">
          {eventTypeTabs.map((tab) => {
            const isSelected = eventType === tab.type;
            const Icon = tab.icon;
            return (
              <button
                key={tab.type}
                type="button"
                onClick={() => setEventType(tab.type)}
                className={`gcal-modal-type-pill ${isSelected ? 'active' : ''}`}
              >
                <Icon size={13} strokeWidth={2} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 3. ROW: Custom Date & Time Selection (Google Calendar style) */}
        <div className="gcal-form-row">
          <div className="gcal-row-icon" title={t('schedule.daily_hourly')}>
            <Clock size={18} />
          </div>
          <div className="gcal-row-content">
            <div className="gcal-time-controls-box">
              <div className="gcal-datetime-inputs-line">
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="gcal-input-date"
                  required
                />

                {!isAllDay && (
                  <div className="gcal-time-range-group">
                    <input
                      type="time"
                      value={startTimeStr}
                      onChange={(e) => setStartTimeStr(e.target.value)}
                      className="gcal-input-time"
                      required
                    />
                    <span className="gcal-time-separator">–</span>
                    <input
                      type="time"
                      value={endTimeStr}
                      onChange={(e) => setEndTimeStr(e.target.value)}
                      className="gcal-input-time"
                      required
                    />
                  </div>
                )}

                <label className="gcal-allday-label">
                  <input
                    type="checkbox"
                    checked={isAllDay}
                    onChange={(e) => setIsAllDay(e.target.checked)}
                    className="gcal-allday-checkbox"
                  />
                  <span>{t('schedule.all_day_toggle')}</span>
                </label>
              </div>

              {/* Compact Academic Shifts (Ca học) Chips */}
              {!isAllDay && (
                <div className="gcal-quick-shifts-row">
                  {ACADEMIC_SHIFTS.map((shift) => (
                    <button
                      key={shift.id}
                      type="button"
                      onClick={() => handleSelectShift(shift)}
                      className={`gcal-shift-pill ${activeShiftId === shift.id ? 'active' : ''}`}
                      title={`${shift.label}: ${shift.start} - ${shift.end}`}
                    >
                      {shift.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. ROW: Repeat / Recurrence (Google Calendar style) */}
        {!eventToEdit && (
          <div className="gcal-form-row">
            <div className="gcal-row-icon" title={t('schedule.repeat_weekly_label')}>
              <Repeat size={18} />
            </div>
            <div className="gcal-row-content">
              <select
                value={isRecurring ? repeatWeeks : 0}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val === 0) {
                    setIsRecurring(false);
                  } else {
                    setIsRecurring(true);
                    setRepeatWeeks(val);
                  }
                }}
                className="gcal-form-select"
              >
                <option value={0}>{t('schedule.repeat_none')}</option>
                <option value={15}>{t('schedule.repeat_semester')}</option>
                <option value={10}>{t('schedule.repeat_10_weeks')}</option>
                <option value={5}>{t('schedule.repeat_5_weeks')}</option>
                <option value={18}>{t('schedule.repeat_18_weeks')}</option>
              </select>
            </div>
          </div>
        )}

        {/* 5. ROW: Location / Room */}
        <div className="gcal-form-row">
          <div className="gcal-row-icon" title={t('schedule.location_label')}>
            <MapPin size={18} />
          </div>
          <div className="gcal-row-content">
            <input
              type="text"
              placeholder={t('schedule.location_hint')}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="gcal-form-input"
            />
          </div>
        </div>

        {/* 6. ROW: Related Subject (Contextual) */}
        {!defaultWorkspaceId && (
          <div className="gcal-form-row">
            <div className="gcal-row-icon" title={t('schedule.related_subject')}>
              <BookOpen size={18} />
            </div>
            <div className="gcal-row-content">
              <select
                value={subjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="gcal-form-select"
              >
                <option value="">{t('schedule.no_subject_option')}</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code ? `[${sub.code}] ` : ''}{sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* 7. ROW: Related Project (Group Meeting Mode) */}
        {eventType === ScheduleEventType.GROUP_MEETING && (
          <div className="gcal-form-row">
            <div className="gcal-row-icon" title={t('schedule.related_project')}>
              <FolderKanban size={18} />
            </div>
            <div className="gcal-row-content">
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={Boolean(defaultProjectId)}
                className="gcal-form-select"
              >
                <option value="">{t('schedule.select_project_option')}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* 8. Footer Actions */}
        <div className="gcal-modal-footer">
          {eventToEdit ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="gcal-modal-btn-delete"
            >
              <Trash2 size={15} />
              <span>{t('schedule.delete_event_btn')}</span>
            </button>
          ) : <div />}

          <div className="gcal-modal-footer-right">
            <button
              type="button"
              onClick={onClose}
              className="gcal-modal-btn-cancel"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="gcal-modal-btn-save"
            >
              <Save size={15} />
              <span>{loading ? t('common.loading') : t('schedule.save_btn')}</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
