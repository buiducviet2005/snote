import React, { useState } from 'react';
import { api } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { TaskPriority } from '@snote/shared';
import { Plus, Calendar, BookOpen, Flame, Zap, Check } from 'lucide-react';

interface QuickTaskBarProps {
  subjects: any[];
  defaultSubjectId?: string;
  onTaskCreated: () => void;
}

export const QuickTaskBar: React.FC<QuickTaskBarProps> = ({
  subjects,
  defaultSubjectId,
  onTaskCreated
}) => {
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(defaultSubjectId || '');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await api.post('/tasks', {
        title: title.trim(),
        subjectId: subjectId || undefined,
        priority,
        dueDate: dueDate ? new Date(`${dueDate}T23:59:59.000Z`).toISOString() : undefined,
        status: 'TODO'
      });

      setTitle('');
      setDueDate('');
      showToast('✨ Đã tạo công việc mới thành công!', 'success');
      onTaskCreated();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tạo công việc nhanh', 'error');
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
      className="snote-card"
      style={{
        padding: '12px 16px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            color: 'var(--accent-primary)',
            flexShrink: 0
          }}
        >
          <Zap size={16} />
        </span>

        <input
          type="text"
          placeholder="Thêm nhanh công việc mới... (Nhập tiêu đề và nhấn Enter)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
          className="snote-input"
          style={{
            flex: 1,
            backgroundColor: 'var(--bg-primary)',
            fontSize: '13.5px',
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
            gap: '5px',
            padding: '7px 16px',
            borderRadius: 'var(--radius-md)',
            flexShrink: 0
          }}
        >
          <Plus size={15} />
          <span>Thêm</span>
        </button>
      </div>

      {/* Quick Attributes Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Subject selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <BookOpen size={13} style={{ color: 'var(--text-muted)' }} />
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="snote-select"
              style={{
                fontSize: '11.5px',
                padding: '3px 8px',
                height: '28px',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <option value="">Chung (Không chọn môn)</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.code || 'MÔN'}] {s.name}
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
                fontSize: '11.5px',
                padding: '3px 8px',
                height: '28px',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <option value={TaskPriority.URGENT}>🔴 Khẩn cấp</option>
              <option value={TaskPriority.HIGH}>🟠 Cao</option>
              <option value={TaskPriority.MEDIUM}>🟡 Trung bình</option>
              <option value={TaskPriority.LOW}>🟢 Thấp</option>
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
                fontSize: '11.5px',
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
          <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginRight: '2px' }}>Nhanh:</span>
          <button
            type="button"
            onClick={() => setQuickDueDate('TODAY')}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '11px', padding: '2px 7px', height: '24px', borderRadius: '4px' }}
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => setQuickDueDate('TOMORROW')}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '11px', padding: '2px 7px', height: '24px', borderRadius: '4px' }}
          >
            Ngày mai
          </button>
          <button
            type="button"
            onClick={() => setQuickDueDate('NEXT_WEEK')}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '11px', padding: '2px 7px', height: '24px', borderRadius: '4px' }}
          >
            Tuần sau
          </button>
        </div>
      </div>
    </form>
  );
};
