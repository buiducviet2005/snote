import React, { useState, useMemo, useRef, useEffect } from 'react';
import { TaskStatus, TaskPriority } from '@snote/shared';
import { useLanguage } from '../../../contexts/LanguageContext';
import { extractNoteFeatures } from '../../notes/utils/smartNoteParser';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Calendar,
  BookOpen,
  FolderKanban,
  Edit3,
  Trash2,
  ListTodo,
  User,
  CheckSquare,
  Square,
  Check
} from 'lucide-react';

interface TasksListViewProps {
  tasks: any[];
  onEdit: (task: any) => void;
  onDelete: (id: string, title: string) => void;
  onToggleStatus: (id: string, currentStatus: TaskStatus) => void;
  onMoveStatus?: (id: string, newStatus: TaskStatus) => void;
}

export const TasksListView: React.FC<TasksListViewProps> = ({
  tasks,
  onEdit,
  onDelete,
  onToggleStatus,
  onMoveStatus
}) => {
  const { t, language } = useLanguage();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const masterCheckboxRef = useRef<HTMLInputElement>(null);

  // Parse checklist progress from markdown description
  const getSubtasks = (desc?: string | null) => {
    if (!desc) return null;
    const features = extractNoteFeatures(desc);
    if (features.checklist.total > 0) {
      return {
        done: features.checklist.done,
        total: features.checklist.total,
        label: `${features.checklist.done}/${features.checklist.total}`,
        percent: Math.round((features.checklist.done / features.checklist.total) * 100),
        isAllDone: features.checklist.done === features.checklist.total
      };
    }
    return null;
  };

  const getPriorityStyle = (priority: string) => {
    const p = (priority || '').toUpperCase();
    if (p === 'URGENT') {
      return { label: t('tasks.priority_urgent'), color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)', border: '#ef4444' };
    }
    if (p === 'HIGH') {
      return { label: t('tasks.priority_high'), color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)', border: '#f59e0b' };
    }
    if (p === 'MEDIUM') {
      return { label: t('tasks.priority_medium'), color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)', border: '#3b82f6' };
    }
    return { label: t('tasks.priority_low'), color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.08)', border: '#94a3b8' };
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'DONE') {
      return { label: t('tasks.status_done'), color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' };
    }
    if (s === 'IN_PROGRESS') {
      return { label: t('tasks.status_in_progress'), color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.12)' };
    }
    if (s === 'PENDING_REVIEW' || s === 'PENDING') {
      return { label: t('tasks.status_pending'), color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' };
    }
    return { label: t('tasks.status_todo'), color: 'var(--text-secondary)', bg: 'var(--bg-secondary)' };
  };

  // Master selection helpers
  const isAllSelected = tasks.length > 0 && selectedIds.size === tasks.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < tasks.length;

  useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tasks.map((t) => t.id)));
    }
  };

  const handleToggleSingle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBatchMarkDone = async () => {
    for (const id of Array.from(selectedIds)) {
      const t = tasks.find((item) => item.id === id);
      if (t && t.status !== TaskStatus.DONE) {
        await onToggleStatus(id, t.status);
      }
    }
    setSelectedIds(new Set());
  };

  const handleBatchDelete = async () => {
    if (!window.confirm(language === 'vi' ? `Bạn có chắc muốn xóa ${selectedIds.size} công việc đã chọn?` : `Delete ${selectedIds.size} selected tasks?`)) return;
    for (const id of Array.from(selectedIds)) {
      const t = tasks.find((item) => item.id === id);
      if (t) {
        await onDelete(id, t.title);
      }
    }
    setSelectedIds(new Set());
  };

  // Check if overdue
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* 1. Master Checkbox Bar (Image 3) */}
      <div
        className="snote-card"
        style={{
          padding: '8px 14px',
          borderRadius: '8px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}
      >
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            fontSize: '12.5px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            userSelect: 'none'
          }}
        >
          <input
            type="checkbox"
            ref={masterCheckboxRef}
            checked={isAllSelected}
            onChange={handleToggleSelectAll}
            style={{
              width: '16px',
              height: '16px',
              cursor: 'pointer',
              accentColor: 'var(--accent)'
            }}
          />
          <span>
            {t('tasks.select_all_with_count', { count: tasks.length })}
          </span>
        </label>

        {/* Floating Batch Actions */}
        {selectedIds.size > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'wsFadeIn 0.15s ease' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {language === 'vi' ? `Đã chọn: ${selectedIds.size}` : `Selected: ${selectedIds.size}`}
            </span>
            <button
              type="button"
              onClick={handleBatchMarkDone}
              className="btn btn-sm btn-primary"
              style={{ fontSize: '11px', padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Check size={13} />
              <span>{t('tasks.batch_done', { count: selectedIds.size })}</span>
            </button>
            <button
              type="button"
              onClick={handleBatchDelete}
              className="btn btn-sm btn-danger"
              style={{ fontSize: '11px', padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Trash2 size={13} />
              <span>{t('tasks.batch_delete', { count: selectedIds.size })}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="btn btn-sm btn-ghost"
              style={{ fontSize: '11px', padding: '3px 8px' }}
            >
              {t('common.cancel')}
            </button>
          </div>
        )}
      </div>

      {/* 2. Tasks List Rows (Image 3) */}
      {tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
          {t('tasks.no_tasks')}
        </div>
      ) : (
        tasks.map((task) => {
          const isSelected = selectedIds.has(task.id);
          const isDone = task.status === TaskStatus.DONE;
          const priorityStyle = getPriorityStyle(task.priority);
          const statusBadge = getStatusBadge(task.status);
          const subtasks = getSubtasks(task.description);
          const assigneeName = task.assignees?.[0]?.name || task.assignee?.fullName || task.user?.fullName || 'naver';
          const projectName = task.project?.name || (task.subject ? `${task.subject.code ? `[${task.subject.code}] ` : ''}${task.subject.name}` : t('common.team_project'));

          // Overdue calculation
          let isOverdue = false;
          let dueStr = '';
          if (task.dueDate) {
            const due = new Date(task.dueDate);
            const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
            if (dueDay < todayMidnight && !isDone) {
              isOverdue = true;
            }
            const hours = due.getHours() < 10 ? `0${due.getHours()}` : due.getHours();
            const mins = due.getMinutes() < 10 ? `0${due.getMinutes()}` : due.getMinutes();
            const day = due.getDate() < 10 ? `0${due.getDate()}` : due.getDate();
            const month = due.getMonth() + 1 < 10 ? `0${due.getMonth() + 1}` : due.getMonth() + 1;
            
            dueStr = isOverdue
              ? `${t('tasks.overdue')}: ${hours}:${mins} ${day}/${month}`
              : `${t('tasks.due_at')}: ${hours}:${mins} ${day}/${month}`;
          }

          // Percent
          const pct = isDone ? 100 : task.progressPercent !== undefined ? task.progressPercent : (subtasks?.percent || 0);

          return (
            <div
              key={task.id}
              onClick={() => onEdit(task)}
              className="snote-card"
              style={{
                position: 'relative',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: isSelected
                  ? 'rgba(59, 130, 246, 0.05)'
                  : isDone
                  ? 'var(--bg-secondary)'
                  : 'var(--bg-primary)',
                border: isSelected
                  ? '1px solid var(--accent)'
                  : '1px solid var(--border-color)',
                borderLeft: `3.5px solid ${priorityStyle.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
                opacity: isDone ? 0.75 : 1
              }}
            >
              {/* Left Segment: Checkbox + Title + Badges + Meta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                {/* Selection Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => handleToggleSingle(task.id, e as any)}
                  style={{
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer',
                    accentColor: 'var(--accent)',
                    flexShrink: 0
                  }}
                />

                {/* Details Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
                  {/* Row 1: Title + Pills */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: isDone ? 'line-through' : 'none'
                      }}
                    >
                      {task.title}
                    </span>

                    {/* Overdue Badge */}
                    {isOverdue && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(239, 68, 68, 0.14)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          flexShrink: 0
                        }}
                      >
                        {t('tasks.overdue')}
                      </span>
                    )}

                    {/* Assigned Badge */}
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(59, 130, 246, 0.12)',
                        color: '#3b82f6',
                        flexShrink: 0
                      }}
                    >
                      {t('tasks.assigned')}
                    </span>

                    {/* Checklist Fraction Badge (e.g. 3/9) */}
                    {subtasks && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: subtasks.isAllDone ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-secondary)',
                          color: subtasks.isAllDone ? '#10b981' : 'var(--text-secondary)',
                          border: '1px solid var(--border-color)',
                          flexShrink: 0
                        }}
                        title={`Checklist: ${subtasks.done}/${subtasks.total} (${subtasks.percent}%)`}
                      >
                        {subtasks.label}
                      </span>
                    )}
                  </div>

                  {/* Row 2: Subline Meta (Project, %, Due Date, Assignee) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                      fontSize: '11px',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <span>{projectName}</span>
                    <span>•</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{pct}%</span>
                    {dueStr && (
                      <>
                        <span>•</span>
                        <span style={{ color: isOverdue ? '#ef4444' : 'inherit', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={11} />
                          <span>{dueStr}</span>
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span>{language === 'vi' ? `Làm: ${assigneeName}` : `By: ${assigneeName}`}</span>
                  </div>
                </div>
              </div>

              {/* Right Segment: Priority & Status Tags */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {/* Priority Label Tag */}
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: priorityStyle.bg,
                    color: priorityStyle.color
                  }}
                >
                  {priorityStyle.label}
                </span>

                {/* Status Label Tag */}
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: statusBadge.bg,
                    color: statusBadge.color,
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {statusBadge.label}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
