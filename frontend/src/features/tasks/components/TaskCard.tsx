import React from 'react';
import { TaskStatus, TaskPriority } from '@snote/shared';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Calendar,
  Tag,
  Edit3,
  Trash2,
  ArrowRight,
  ArrowLeft,
  User,
  Users,
  Lock
} from 'lucide-react';

interface TaskCardProps {
  task: any;
  onEdit: (task: any) => void;
  onDelete: (id: string, title: string) => void;
  onToggleStatus: (id: string, currentStatus: TaskStatus) => void;
  onMoveStatus?: (id: string, newStatus: TaskStatus) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onToggleStatus,
  onMoveStatus
}) => {
  const { user: currentUser } = useAuth();
  const { t, formatDate } = useLanguage();

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT:
        return { label: t('tasks.priority_urgent'), badgeClass: 'badge-rose', isUrgent: true };
      case TaskPriority.HIGH:
        return { label: t('tasks.priority_high'), badgeClass: 'badge-amber', isUrgent: false };
      case TaskPriority.MEDIUM:
        return { label: t('tasks.priority_medium'), badgeClass: 'badge-blue', isUrgent: false };
      default:
        return { label: t('tasks.priority_low'), badgeClass: 'badge-neutral', isUrgent: false };
    }
  };

  const priorityBadge = getPriorityBadge(task.priority);
  const isDone = task.status === TaskStatus.DONE;

  // Extract all assignees
  const assigneesList: any[] = (task.assignees && task.assignees.length > 0)
    ? task.assignees
    : (task.assignee ? [task.assignee] : (task.user ? [task.user] : []));

  // Check authorization
  const isAssignee = assigneesList.some((u: any) => u.id === currentUser?.id);
  const isCreator = task.userId === currentUser?.id;
  const isProjectOwner =
    task.project?.userId === currentUser?.id ||
    (task.project?.members || []).some((m: any) => m.userId === currentUser?.id && m.role === 'OWNER');

  const canComplete = task.canComplete !== undefined ? task.canComplete : (isAssignee || isCreator || isProjectOwner || !task.projectId);
  const canEdit = task.canEdit !== undefined ? task.canEdit : (isAssignee || isCreator || isProjectOwner || !task.projectId);

  // Due date status
  let dueStatus: 'OVERDUE' | 'TODAY' | 'UPCOMING' | null = null;
  if (task.dueDate && !isDone) {
    const due = new Date(task.dueDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

    if (dueDay < today) {
      dueStatus = 'OVERDUE';
    } else if (dueDay.getTime() === today.getTime()) {
      dueStatus = 'TODAY';
    } else {
      dueStatus = 'UPCOMING';
    }
  }

  const priorityStripeClass = `priority-stripe-${(task.priority || 'LOW').toLowerCase()}`;

  return (
    <div
      className="snote-card"
      style={{
        padding: '14px 16px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        backgroundColor: isDone ? 'var(--bg-tertiary)' : 'var(--bg-card)',
        opacity: isDone ? 0.75 : 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        transition: 'border-color var(--transition-fast)'
      }}
    >
      {/* Header & Checkbox */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
          <button
            onClick={() => {
              if (canComplete) {
                onToggleStatus(task.id, task.status);
              }
            }}
            disabled={!canComplete}
            className="btn btn-ghost btn-icon"
            style={{
              minWidth: '28px',
              minHeight: '28px',
              padding: '4px',
              color: isDone ? 'var(--color-success)' : canComplete ? 'var(--text-muted)' : 'var(--border-color)',
              cursor: canComplete ? 'pointer' : 'not-allowed',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
            title={
              !canComplete
                ? t('tasks.locked_complete_tooltip')
                : isDone
                ? t('tasks.mark_undone')
                : t('tasks.mark_done')
            }
            aria-label={
              !canComplete
                ? t('tasks.locked_complete_tooltip')
                : isDone
                ? t('tasks.mark_undone')
                : t('tasks.mark_done')
            }
          >
            {isDone ? (
              <CheckCircle2 size={18} />
            ) : !canComplete ? (
              <Lock size={16} style={{ color: 'var(--text-muted)' }} />
            ) : (
              <Circle size={18} />
            )}
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h4
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
                margin: '0 0 4px 0',
                fontSize: 'var(--type-body)',
                fontWeight: 700,
                color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                textDecoration: isDone ? 'line-through' : 'none',
                cursor: 'pointer',
                lineHeight: 1.35,
                wordBreak: 'break-word',
                overflowWrap: 'anywhere'
              }}
              title={t('tasks.click_view_details')}
              aria-label={`${t('tasks.click_view_details')}: ${task.title}`}
            >
              {task.title}
            </h4>
            {task.description && (
              <p
                onClick={() => onEdit(task)}
                style={{
                  margin: 0,
                  fontSize: 'var(--type-small)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.45,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                  cursor: 'pointer'
                }}
                title={t('tasks.click_view_details')}
              >
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Action icons */}
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          {canEdit && (
            <button
              onClick={() => onEdit(task)}
              className="btn btn-ghost btn-icon"
              style={{
                minWidth: '28px',
                minHeight: '28px',
                padding: '4px',
                color: 'var(--text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={t('common.edit')}
              aria-label={t('common.edit')}
            >
              <Edit3 size={14} />
            </button>
          )}
          {(isCreator || isProjectOwner) && (
            <button
              onClick={() => onDelete(task.id, task.title)}
              className="btn btn-ghost btn-icon"
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
          )}
        </div>
      </div>

      {/* Meta tags & Subject Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {/* Priority */}
          <span className={`badge ${priorityBadge.badgeClass}`} style={{ fontSize: 'var(--type-caption)', padding: '2px 7px' }}>
            <span>{priorityBadge.label}</span>
          </span>

          {/* Subject badge */}
          {task.subject && (
            <span
              className="badge"
              style={{
                fontSize: 'var(--type-caption)',
                padding: '2px 7px',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {task.subject.code || task.subject.name}
            </span>
          )}

          {/* Project badge */}
          {task.project && (
            <span
              className="badge"
              style={{
                fontSize: 'var(--type-caption)',
                padding: '2px 7px',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)'
              }}
              title={t('tasks.project_label_tooltip', { name: task.project.name })}
            >
              {task.project.name}
            </span>
          )}

          {/* Multi-Assignees Stack / Badge */}
          {assigneesList.length > 0 && (
            <div
              className="badge"
              style={{
                fontSize: 'var(--type-caption)',
                padding: '2px 7px',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title={t('tasks.members_tooltip', { names: assigneesList.map((a: any) => a.fullName || a.email).join(', ') })}
            >
              <Users size={11} />
              <span>
                {assigneesList.length === 1
                  ? (assigneesList[0].id === currentUser?.id ? t('tasks.assignee_you') : assigneesList[0].fullName?.split(' ').slice(-1)[0] || t('tasks.assigned'))
                  : (isAssignee ? t('tasks.assignee_you_plus', { count: assigneesList.length - 1 }) : t('tasks.assignee_count', { count: assigneesList.length }))}
              </span>
            </div>
          )}
        </div>

        {/* Due date */}
        {task.dueDate && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: 'var(--type-caption)',
              color: dueStatus === 'OVERDUE' ? 'var(--color-danger)' : 'var(--text-muted)',
              fontWeight: dueStatus === 'OVERDUE' ? 700 : 500
            }}
          >
            <Calendar size={11} />
            <span>{formatDate(task.dueDate)}</span>
          </div>
        )}
      </div>

      {/* Quick Move Columns Bar */}
      {onMoveStatus && canComplete && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '6px',
            paddingTop: '8px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: 'var(--type-caption)'
          }}
        >
          {task.status === TaskStatus.TODO && (
            <button
              onClick={() => onMoveStatus(task.id, TaskStatus.IN_PROGRESS)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: 'var(--type-caption)', padding: '3px 8px' }}
            >
              <span>{t('tasks.start_doing')}</span>
              <ArrowRight size={11} />
            </button>
          )}

          {task.status === TaskStatus.IN_PROGRESS && (
            <>
              <button
                onClick={() => onMoveStatus(task.id, TaskStatus.TODO)}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 'var(--type-caption)', padding: '3px 8px', color: 'var(--text-muted)' }}
              >
                <ArrowLeft size={11} />
                <span>{t('tasks.move_to_todo')}</span>
              </button>
              <button
                onClick={() => onMoveStatus(task.id, TaskStatus.DONE)}
                className="btn btn-primary btn-sm"
                style={{ fontSize: 'var(--type-caption)', padding: '3px 8px' }}
              >
                <span>{t('tasks.move_to_done')}</span>
                <CheckCircle2 size={11} />
              </button>
            </>
          )}

          {task.status === TaskStatus.DONE && (
            <button
              onClick={() => onMoveStatus(task.id, TaskStatus.IN_PROGRESS)}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 'var(--type-caption)', padding: '3px 8px', color: 'var(--text-muted)' }}
            >
              <ArrowLeft size={11} />
              <span>{t('tasks.redo')}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
