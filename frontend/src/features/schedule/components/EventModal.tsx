import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { StudyDateTimePicker } from '../../../components/common/StudyDateTimePicker';
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
  defaultProjectId?: string;
  defaultSubjectId?: string;
  defaultWorkspaceId?: string;
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
  eventToEdit,
  defaultProjectId,
  defaultSubjectId,
  defaultWorkspaceId
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
  const { user } = useAuth();
  const { t, formatDateTime } = useLanguage();

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
      setProjectId(eventToEdit.projectId || '');
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
      setSubjectId(defaultProjectId ? '' : (defaultSubjectId || ''));
      setProjectId(defaultProjectId || '');
      setEventType(defaultWorkspaceId ? ScheduleEventType.GROUP_MEETING : ScheduleEventType.CLASS);
      setIsRecurring(false);
      setRepeatWeeks(15);
    }
  }, [defaultDate, defaultProjectId, defaultSubjectId, isOpen, eventToEdit]);

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
      let finalLocation = location.trim();
      if (eventType === ScheduleEventType.EXAM && examFormat) {
        const formatMap: Record<string, string> = {
          MULTIPLE_CHOICE: t('schedule.exam_format_mc'),
          ESSAY: t('schedule.exam_format_essay'),
          ORAL: t('schedule.exam_format_oral'),
          PROJECT_DEFENSE: t('schedule.exam_format_defense')
        };
        const formatLabel = formatMap[examFormat] || examFormat;
        if (finalLocation) {
          finalLocation = `${finalLocation} (${formatLabel})`;
        } else {
          finalLocation = t('schedule.format_label', { format: formatLabel });
        }
      }

      if (eventToEdit) {
        await api.put(`/schedule/${eventToEdit.id}`, {
          semesterId: defaultWorkspaceId ? undefined : selectedSemesterId || undefined,
          subjectId: subjectId || undefined,
          projectId: projectId || undefined,
          title: title.trim(),
          eventType,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          location: finalLocation || undefined,
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
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          location: finalLocation || undefined,
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
    { type: ScheduleEventType.CLASS, label: t('schedule.type_class'), icon: Presentation, color: '#38bdf8' },
    { type: ScheduleEventType.EXAM, label: t('schedule.type_exam'), icon: GraduationCap, color: '#ef4444' },
    { type: ScheduleEventType.GROUP_MEETING, label: t('schedule.type_meeting'), icon: Users, color: '#a855f7' },
    { type: ScheduleEventType.PERSONAL, label: t('schedule.type_personal'), icon: User, color: '#10b981' }
  ];

  if (eventToEdit?.userId && eventToEdit.userId !== user?.id) {
    return <Modal isOpen={isOpen} onClose={onClose} title={t('schedule.group_event_title')} maxWidth="560px" icon={<Calendar size={22} />}>
      <div style={{ display: 'grid', gap: '12px', padding: '8px 0', color: 'var(--text-primary)' }}>
        <strong>{eventToEdit.title}</strong>
        <span>{formatDateTime(eventToEdit.startTime)} – {formatDateTime(eventToEdit.endTime)}</span>
        {eventToEdit.location && <span>{eventToEdit.location}</span>}
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>{t('schedule.group_event_readonly')}</p>
      </div>
    </Modal>;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={eventToEdit ? t('schedule.edit_event_title') : t('schedule.smart_schedule_title')}
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
                  fontSize: 'var(--type-small)',
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--type-caption)', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--accent-primary)' }}>
              <Clock size={13} />
              <span>{t('schedule.quick_slots_label')}</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => applyShiftPreset(7, 0, 9, 25)}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 'var(--type-caption)', padding: '3px 9px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}
              title={t('schedule.slot_1_3')}
            >
              🌅 Ca 1 (07:00 - 09:25)
            </button>
            <button
              type="button"
              onClick={() => applyShiftPreset(9, 35, 12, 0)}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 'var(--type-caption)', padding: '3px 9px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}
              title={t('schedule.slot_4_6')}
            >
              ☀️ Ca 2 (09:35 - 12:00)
            </button>
            <button
              type="button"
              onClick={() => applyShiftPreset(12, 30, 14, 55)}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 'var(--type-caption)', padding: '3px 9px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}
              title={t('schedule.slot_7_9')}
            >
              🌤️ Ca 3 (12:30 - 14:55)
            </button>
            <button
              type="button"
              onClick={() => applyShiftPreset(15, 5, 17, 30)}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 'var(--type-caption)', padding: '3px 9px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}
              title={t('schedule.slot_10_12')}
            >
              🌆 Ca 4 (15:05 - 17:30)
            </button>
            <button
              type="button"
              onClick={() => applyShiftPreset(18, 0, 20, 30)}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 'var(--type-caption)', padding: '3px 9px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}
              title={t('schedule.slot_13_15')}
            >
              🌙 Ca 5 (18:00 - 20:30)
            </button>
          </div>
        </div>

        {/* 3. Event Title */}
        <div>
          <label style={{ display: 'block', fontSize: 'var(--type-small)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            {t('schedule.event_title_input')}
          </label>
          <input
            type="text"
            required
            placeholder={
              eventType === ScheduleEventType.CLASS
                ? t('schedule.placeholder_class')
                : eventType === ScheduleEventType.EXAM
                ? t('schedule.placeholder_exam')
                : eventType === ScheduleEventType.GROUP_MEETING
                ? t('schedule.placeholder_meeting')
                : t('schedule.placeholder_personal')
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="snote-input"
            style={{ fontSize: 'var(--type-body)', padding: '10px 14px' }}
          />
        </div>

        {/* 4. Contextual Selectors */}
        {!defaultWorkspaceId && <div style={{ display: 'grid', gridTemplateColumns: eventType === ScheduleEventType.GROUP_MEETING ? '1fr 1fr' : '1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              {t('schedule.related_subject')}
            </label>
            <select
              value={subjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="snote-select"
              style={{ fontSize: 'var(--type-small)', padding: '9px 12px' }}
            >
              <option value="">{t('schedule.no_subject_option')}</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code ? `[${sub.code}] ` : ''}{sub.name}
                </option>
              ))}
            </select>
          </div>

          {eventType === ScheduleEventType.GROUP_MEETING && (
            <div>
              <label style={{ display: 'block', fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {t('schedule.related_project')}
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={Boolean(defaultProjectId)}
                className="snote-select"
                style={{ fontSize: 'var(--type-small)', padding: '9px 12px' }}
              >
                <option value="">{t('schedule.select_project_option')}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    📁 {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>}

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
            <div style={{ fontSize: 'var(--type-small)', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Flame size={15} />
              <span>{t('schedule.exam_info_header')}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--type-small)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {t('schedule.exam_format_label')}
                </label>
                <select
                  value={examFormat}
                  onChange={(e) => setExamFormat(e.target.value)}
                  className="snote-select"
                  style={{ fontSize: 'var(--type-small)', padding: '7px 10px' }}
                >
                  <option value="MULTIPLE_CHOICE">{t('schedule.exam_mc_opt')}</option>
                  <option value="ESSAY">{t('schedule.exam_essay_opt')}</option>
                  <option value="ORAL">{t('schedule.exam_oral_opt')}</option>
                  <option value="PROJECT_DEFENSE">{t('schedule.exam_defense_opt')}</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--type-small)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {t('schedule.exam_room_label')}
                </label>
                <input
                  type="text"
                  placeholder={t('schedule.exam_room_placeholder')}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="snote-input"
                  style={{ fontSize: 'var(--type-small)', padding: '7px 10px' }}
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
            label={t('schedule.start_time_label')}
            placeholder={t('schedule.start_time_placeholder')}
            required
            align="left"
          />

          <StudyDateTimePicker
            value={endTime}
            onChange={setEndTime}
            label={t('schedule.end_time_label')}
            placeholder={t('schedule.end_time_placeholder')}
            required
            align="right"
          />
        </div>

        {/* 7. Location (if not already rendered in Exam mode) */}
        {eventType !== ScheduleEventType.EXAM && (
          <div>
            <label style={{ display: 'block', fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              {eventType === ScheduleEventType.GROUP_MEETING ? t('schedule.meet_link_or_room') : t('schedule.location_or_room')}
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <MapPin size={16} />
              </span>
              <input
                type="text"
                placeholder={
                  eventType === ScheduleEventType.GROUP_MEETING
                    ? t('schedule.meet_link_placeholder')
                    : t('schedule.location_placeholder')
                }
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="snote-input"
                style={{ paddingLeft: '38px', fontSize: 'var(--type-small)', padding: '9px 12px 9px 38px' }}
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
                  fontSize: 'var(--type-small)',
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
                  <span>{t('schedule.repeat_weekly_label')}</span>
                </span>
              </label>

              {isRecurring && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--type-small)' }}>
                  <select
                    value={repeatWeeks}
                    onChange={(e) => setRepeatWeeks(Number(e.target.value))}
                    className="snote-select"
                    style={{ fontSize: 'var(--type-small)', padding: '3px 8px', height: '28px', width: '90px' }}
                  >
                    <option value={5}>{t('schedule.repeat_weeks_option', { count: 5 })}</option>
                    <option value={10}>{t('schedule.repeat_weeks_option', { count: 10 })}</option>
                    <option value={15}>{t('schedule.repeat_weeks_option', { count: 15 })}</option>
                    <option value={18}>{t('schedule.repeat_weeks_option', { count: 18 })}</option>
                  </select>
                </div>
              )}
            </div>

            {isRecurring && (
              <div style={{ fontSize: 'var(--type-caption)', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {t('schedule.repeat_tip', { count: repeatWeeks })}
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
              <span>{t('schedule.delete_event_btn')}</span>
            </button>
          ) : <div />}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '9px 18px' }}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ fontWeight: 700, padding: '9px 22px', gap: '6px' }}
            >
              <Save size={16} />
              <span>{loading ? t('common.loading') : eventToEdit ? t('schedule.save_changes') : t('schedule.create_class_btn')}</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
