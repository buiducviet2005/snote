import React, { useMemo } from 'react';
import { TaskStatus, TaskPriority } from '@snote/shared';
import {
  Flame,
  Calendar,
  Zap,
  Coffee,
  CheckCircle2,
  Circle,
  Plus,
  FolderKanban,
  Edit3,
  Trash2,
  ListTodo
} from 'lucide-react';
import { extractNoteFeatures } from '../../notes/utils/smartNoteParser';
import { useLanguage } from '../../../contexts/LanguageContext';

interface TasksEisenhowerViewProps {
  tasks: any[];
  onEdit: (task: any) => void;
  onDelete: (id: string, title: string) => void;
  onToggleStatus: (id: string, currentStatus: TaskStatus) => void;
  onMoveStatus?: (id: string, newStatus: TaskStatus) => void;
  onOpenCreate?: () => void;
}

export const TasksEisenhowerView: React.FC<TasksEisenhowerViewProps> = ({
  tasks,
  onEdit,
  onDelete,
  onToggleStatus,
  onMoveStatus,
  onOpenCreate
}) => {
  const { t, language, formatDate } = useLanguage();
  // Categorize active tasks into 4 Quadrants
  const quadrants = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const threeDaysLater = today + 3 * 24 * 60 * 60 * 1000;

    const q1: any[] = []; // Urgent & Important (Do First)
    const q2: any[] = []; // Not Urgent & Important (Schedule)
    const q3: any[] = []; // Urgent & Not Important (Delegate / Quick)
    const q4: any[] = []; // Not Urgent & Not Important (Eliminate / Later)

    tasks.forEach((t) => {
      if (t.status === TaskStatus.DONE) return;

      const isUrgentPriority = t.priority === TaskPriority.URGENT;
      const isHighPriority = t.priority === TaskPriority.HIGH;
      const isMediumPriority = t.priority === TaskPriority.MEDIUM;
      const isLowPriority = t.priority === TaskPriority.LOW;

      const due = t.dueDate ? new Date(t.dueDate).getTime() : null;
      const isDueSoon = due != null && due <= threeDaysLater;

      if (isUrgentPriority || (isHighPriority && isDueSoon)) {
        q1.push(t);
      } else if (isHighPriority || (isMediumPriority && !isDueSoon)) {
        q2.push(t);
      } else if (isDueSoon || isMediumPriority) {
        q3.push(t);
      } else {
        q4.push(t);
      }
    });

    return { q1, q2, q3, q4 };
  }, [tasks]);

  const renderTaskMiniCard = (task: any) => {
    const isDone = task.status === TaskStatus.DONE;
    const features = task.description ? extractNoteFeatures(task.description) : null;
    const hasChecklist = features && features.checklist.total > 0;

    return (
      <div
        key={task.id}
        className="snote-card"
        style={{
          padding: '10px 12px',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <button
            onClick={() => onToggleStatus(task.id, task.status)}
            className="btn btn-ghost btn-icon"
            style={{
              minWidth: '28px',
              minHeight: '28px',
              padding: '4px',
              color: isDone ? 'var(--color-success)' : 'var(--text-muted)',
              cursor: 'pointer',
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={isDone ? t('tasks.mark_undone') : t('tasks.mark_done')}
            aria-label={isDone ? t('tasks.mark_undone') : t('tasks.mark_done')}
          >
            {isDone ? <CheckCircle2 size={16} /> : <Circle size={16} />}
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <span
              role="button"
              tabIndex={0}
              onClick={() => onEdit(task)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onEdit(task);
                }
              }}
              style={{
                fontSize: 'var(--type-small)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                lineHeight: 1.3,
                wordBreak: 'break-word',
                display: 'block'
              }}
              title={task.title}
              aria-label={`${t('common.edit')}: ${task.title}`}
            >
              {task.title}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <button
              onClick={() => onEdit(task)}
              className="btn btn-ghost btn-icon btn-sm"
              style={{
                minWidth: '28px',
                minHeight: '28px',
                padding: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={t('common.edit')}
              aria-label={t('common.edit')}
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={() => onDelete(task.id, task.title)}
              className="btn btn-ghost btn-icon btn-sm"
              style={{
                minWidth: '28px',
                minHeight: '28px',
                padding: '4px',
                color: 'var(--color-danger)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={t('common.delete')}
              aria-label={t('common.delete')}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Footer Meta */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', fontSize: 'var(--type-caption)', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
            {task.subject && (
              <span
                style={{
                  color: task.subject.color || 'var(--color-info)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {task.subject.name}
              </span>
            )}
            {hasChecklist && (
              <span style={{ color: 'var(--accent-primary)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                <ListTodo size={10} />
                {features?.checklist.done}/{features?.checklist.total}
              </span>
            )}
          </div>

          {task.dueDate && (
            <span style={{ flexShrink: 0, fontWeight: 500 }}>
              {formatDate(task.dueDate, { day: '2-digit', month: '2-digit' })}
            </span>
          )}
        </div>
      </div>
    );
  };

  const matrixConfigs = [
    {
      id: 'q1',
      title: t('tasks.matrix_q1_title'),
      subtitle: t('tasks.matrix_q1_desc'),
      icon: Flame,
      items: quadrants.q1
    },
    {
      id: 'q2',
      title: t('tasks.matrix_q2_title'),
      subtitle: t('tasks.matrix_q2_desc'),
      icon: Calendar,
      items: quadrants.q2
    },
    {
      id: 'q3',
      title: t('tasks.matrix_q3_title'),
      subtitle: t('tasks.matrix_q3_desc'),
      icon: Zap,
      items: quadrants.q3
    },
    {
      id: 'q4',
      title: t('tasks.matrix_q4_title'),
      subtitle: t('tasks.matrix_q4_desc'),
      icon: Coffee,
      items: quadrants.q4
    }
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '12px',
        alignItems: 'stretch'
      }}
    >
      {matrixConfigs.map((q) => {
        const Icon = q.icon;
        return (
          <div
            key={q.id}
            className="snote-card"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              minHeight: '320px'
            }}
          >
            {/* Quadrant Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'flex' }}>
                  <Icon size={16} />
                </span>
                <div>
                  <h4 style={{ margin: 0, fontSize: 'var(--type-small)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {q.title}
                  </h4>
                  <div style={{ fontSize: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                    {q.subtitle}
                  </div>
                </div>
              </div>

              <span
                style={{
                  fontSize: 'var(--type-caption)',
                  fontWeight: 700,
                  padding: '1px 7px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                {q.items.length}
              </span>
            </div>

            {/* Tasks in Quadrant */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              {q.items.length === 0 ? (
                <div
                  style={{
                    padding: '30px 12px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: 'var(--type-small)',
                    border: '1px dashed var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    marginTop: 'auto',
                    marginBottom: 'auto'
                  }}
                >
                  {t('tasks.matrix_empty')}
                </div>
              ) : (
                q.items.map((t) => renderTaskMiniCard(t))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
