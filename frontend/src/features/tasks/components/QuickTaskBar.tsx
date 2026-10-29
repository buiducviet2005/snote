import React, { useState } from 'react';
import { api, ApiResponse } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { TaskPriority } from '@snote/shared';
import { Plus, Calendar, Flame } from 'lucide-react';

interface QuickTaskBarProps {
  subjects: any[];
  defaultSubjectId?: string;
  defaultProjectId?: string;
  defaultWorkspaceId?: string;
  onTaskCreated?: () => void;
  onTaskAdded?: (task: any) => void;
}

export const QuickTaskBar: React.FC<QuickTaskBarProps> = ({
  subjects,
  defaultSubjectId,
  defaultProjectId,
  defaultWorkspaceId,
  onTaskCreated,
  onTaskAdded
}) => {
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(defaultSubjectId || '');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const { t, language } = useLanguage();

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || loading) return;

    setLoading(true);
    try {
      const res = await api.post<ApiResponse<any>>('/tasks', {
        title: title.trim(),
        subjectId: subjectId || undefined,
        projectId: defaultProjectId || undefined,
        workspaceId: defaultWorkspaceId || undefined,
        priority,
        dueDate: dueDate ? new Date(`${dueDate}T23:59:59`).toISOString() : undefined,
        status: 'TODO'
      });

      setTitle('');
      setDueDate('');
      if (onTaskAdded && res?.data) {
        onTaskAdded(res.data);
      } else if (onTaskCreated) {
        onTaskCreated();
      }
    } catch (err: any) {
      showToast(err.message || (language === 'vi' ? 'Lỗi khi tạo công việc nhanh' : 'Error creating quick task'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const setQuickDueDate = (type: 'TODAY' | 'TOMORROW' | 'NEXT_WEEK') => {
    const d = new Date();
    if (type === 'TOMORROW') {
      d.setDate(d.getDate() + 1);
    } else if (type === 'NEXT_WEEK') {
      d.setDate(d.getDate() + 7);
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setDueDate(`${yyyy}-${mm}-${dd}`);
  };

  return (
    <form
      onSubmit={handleQuickSubmit}
      style={{
        padding: '10px 14px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="text"
          placeholder={t('tasks.quick_task_placeholder')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
          className="snote-input"
          style={{
            flex: 1,
            backgroundColor: 'var(--bg-primary)',
            fontSize: 'var(--type-small)',
            fontWeight: 500,
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)'
          }}
        />

        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="btn btn-primary btn-sm"
          style={{
            fontWeight: 700,
            gap: '4px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-md)',
            flexShrink: 0
          }}
        >
          <Plus size={14} />
          <span>{t('tasks.add_btn')}</span>
        </button>
      </div>

      {/* Quick Attributes Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: 'var(--type-small)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Subject selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="snote-select"
              style={{
                fontSize: 'var(--type-caption)',
                padding: '3px 8px',
                height: '28px',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <option value="">{language === 'vi' ? 'Chung (Không chọn môn)' : 'General (No subject)'}</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.code || (language === 'vi' ? 'MÔN' : 'SUBJ')}] {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Flame size={13} style={{ color: 'var(--text-muted)' }} />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="snote-select"
              style={{
                fontSize: 'var(--type-caption)',
                padding: '3px 8px',
                height: '28px',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <option value={TaskPriority.URGENT}>{t('tasks.priority_urgent')}</option>
              <option value={TaskPriority.HIGH}>{t('tasks.priority_high')}</option>
              <option value={TaskPriority.MEDIUM}>{t('tasks.priority_medium')}</option>
              <option value={TaskPriority.LOW}>{t('tasks.priority_low')}</option>
            </select>
          </div>

          {/* Due date picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="snote-input"
              style={{
                fontSize: 'var(--type-caption)',
                padding: '2px 8px',
                height: '28px',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)'
              }}
            />
          </div>
        </div>

        {/* Quick Date Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--type-caption)', marginRight: '2px' }}>{language === 'vi' ? 'Nhanh:' : 'Quick:'}</span>
          <button
            type="button"
            onClick={() => setQuickDueDate('TODAY')}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 'var(--type-caption)', padding: '2px 7px', height: '24px', borderRadius: '4px' }}
          >
            {language === 'vi' ? 'Hôm nay' : 'Today'}
          </button>
          <button
            type="button"
            onClick={() => setQuickDueDate('TOMORROW')}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 'var(--type-caption)', padding: '2px 7px', height: '24px', borderRadius: '4px' }}
          >
            {language === 'vi' ? 'Ngày mai' : 'Tomorrow'}
          </button>
          <button
            type="button"
            onClick={() => setQuickDueDate('NEXT_WEEK')}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 'var(--type-caption)', padding: '2px 7px', height: '24px', borderRadius: '4px' }}
          >
            {language === 'vi' ? 'Tuần sau' : 'Next week'}
          </button>
        </div>
      </div>
    </form>
  );
};
