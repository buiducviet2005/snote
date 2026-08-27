import React from 'react';
import { TaskStatus, TaskPriority } from '@snote/shared';

interface TaskCardProps {
  task: any;
  onEdit: (task: any) => void;
  onDelete: (id: string, title: string) => void;
  onToggleStatus: (id: string, currentStatus: TaskStatus) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onToggleStatus
}) => {
  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT:
        return { label: 'Khẩn cấp', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
      case TaskPriority.HIGH:
        return { label: 'Ưu tiên cao', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' };
      case TaskPriority.MEDIUM:
        return { label: 'Trung bình', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' };
      default:
        return { label: 'Thấp', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
    }
  };

  const priorityBadge = getPriorityBadge(task.priority);
  const isDone = task.status === TaskStatus.DONE;

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        opacity: isDone ? 0.65 : 1,
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
          <input
            type="checkbox"
            checked={isDone}
            onChange={() => onToggleStatus(task.id, task.status)}
            style={{ width: '16px', height: '16px', marginTop: '3px', cursor: 'pointer' }}
          />
          <div>
            <h4
              style={{
                margin: '0 0 4px 0',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                textDecoration: isDone ? 'line-through' : 'none'
              }}
            >
              {task.title}
            </h4>
            {task.description && (
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {task.description}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => onEdit(task)}
            title="Sửa"
            style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '12px' }}
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(task.id, task.title)}
            title="Xóa"
            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Meta info & tags */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', fontSize: '11px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: priorityBadge.bg,
              color: priorityBadge.color,
              fontWeight: 700
            }}
          >
            {priorityBadge.label}
          </span>
          {task.dueDate && (
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
              ⏰ {new Date(task.dueDate).toLocaleDateString('vi-VN')}
            </span>
          )}
        </div>

        {task.tags && task.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '4px' }}>
            {task.tags.map((t: any) => (
              <span key={t.id || t.name} style={{ color: 'var(--text-secondary)', backgroundColor: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: '4px' }}>
                #{t.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
