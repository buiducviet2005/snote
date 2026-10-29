import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import type { WorkspaceSummary } from '../../../workspaces/layouts/types';
import { api, ApiResponse } from '../../../services/api';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { TaskCard } from '../components/TaskCard';
import { TaskModal } from '../components/TaskModal';
import { QuickTaskBar } from '../components/QuickTaskBar';
import { TasksListView } from '../components/TasksListView';
import { TasksEisenhowerView } from '../components/TasksEisenhowerView';
import { TasksGanttView } from '../components/TasksGanttView';
import { TasksHourlyView } from '../components/TasksHourlyView';
import './TasksListPage.css';
import { TaskStatus, TaskPriority } from '@snote/shared';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Flame,
  ListTodo,
  Zap,
  CheckCircle2,
  X,
  Sparkles,
  FolderKanban,
  Columns3,
  ListFilter,
  LayoutGrid,
  AlertTriangle,
  Clock,
  TrendingUp,
  UserCheck,
  Archive,
  ChevronDown
} from 'lucide-react';

type ViewMode = 'GANTT' | 'HOURLY' | 'LIST' | 'KANBAN' | 'EISENHOWER';
type MetricTab = 'ALL' | 'TODAY' | 'IN_PROGRESS' | 'PENDING' | 'DONE' | 'ARCHIVED' | 'UNASSIGNED';

export const TasksListPage: React.FC = () => {
  const { currentWorkspace } = useOutletContext<{ currentWorkspace: WorkspaceSummary }>();
  const { selectedSubjectId, selectedSemesterId, subjects } = useAppFilter();
  const { t, language } = useLanguage();
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('snote_tasks_view_mode') as ViewMode) || 'GANTT';
  });

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Universal Filters
  const [metricTab, setMetricTab] = useState<MetricTab>('ALL');
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterAssignee, setFilterAssignee] = useState<string>('ALL');
  const [filterDatePreset, setFilterDatePreset] = useState<string>('ALL');
  const [sortMode, setSortMode] = useState<'today_first' | 'priority_first' | 'due_asc' | 'created_desc'>('today_first');
  const { user: currentUser } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<any | null>(null);
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const deepTaskId = searchParams.get('taskId');
  const actionParam = searchParams.get('action');

  // Handle ?action=new from topbar
  useEffect(() => {
    if (actionParam === 'new') {
      handleOpenCreate();
      const next = new URLSearchParams(searchParams);
      next.delete('action');
      setSearchParams(next, { replace: true });
    }
  }, [actionParam]);

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  useEffect(() => {
    if (!deepTaskId) return;
    api.get<ApiResponse<any>>(`/tasks/${deepTaskId}`)
      .then((res) => {
        if (res.data) {
          setTaskToEdit(res.data);
          setIsModalOpen(true);
        }
      })
      .catch(() => {
        showToast(t('tasks.deep_link_error'), 'error');
      });
  }, [deepTaskId, showToast, t]);

  const handleSelectViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('snote_tasks_view_mode', mode);
  };

  const fetchTasks = useCallback(async (silent = false) => {
    if (!silent && tasks.length === 0) {
      setLoading(true);
    }
    try {
      const params = new URLSearchParams();
      if (currentWorkspace.id) params.append('workspaceId', currentWorkspace.id);
      if (!currentWorkspace.id && selectedSubjectId) params.append('subjectId', selectedSubjectId);

      const res = await api.get<ApiResponse<any[]>>(`/tasks?${params.toString()}`);
      setTasks(res.data || []);
    } catch {
      showToast(t('tasks.fetch_error'), 'error');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [currentWorkspace.id, selectedSubjectId, showToast, t, tasks.length]);

  useEffect(() => {
    fetchTasks();
  }, [currentWorkspace.id, selectedSubjectId, selectedSemesterId]);

  const handleTaskAdded = (newTask: any) => {
    if (newTask) {
      setTasks((prev) => [newTask, ...prev]);
    } else {
      fetchTasks(true);
    }
    setIsQuickAddOpen(false);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(t('tasks.delete_named_confirm', { title }))) return;
    const prevTasks = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await api.delete(`/tasks/${id}`);
    } catch (err: any) {
      setTasks(prevTasks);
      showToast(err.message || 'Error deleting task', 'error');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: TaskStatus) => {
    const nextStatus = currentStatus === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t)));
    try {
      await api.patch(`/tasks/${id}/status`, { status: nextStatus });
    } catch (err: any) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: currentStatus } : t)));
      showToast(err.message || 'Error updating task status', 'error');
    }
  };

  const handleMoveStatus = async (id: string, newStatus: TaskStatus) => {
    const prevStatus = tasks.find((t) => t.id === id)?.status;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
    try {
      await api.patch(`/tasks/${id}/status`, { status: newStatus });
    } catch (err: any) {
      if (prevStatus) {
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: prevStatus } : t)));
      }
      showToast(err.message || 'Error moving task', 'error');
    }
  };

  const handleOpenCreate = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: any) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  // 1. Single-pass $O(N)$ Metrics Aggregation
  const metrics = useMemo(() => {
    let total = 0;
    let today = 0;
    let inProgress = 0;
    let pending = 0;
    let done = 0;
    let archived = 0;
    let unassigned = 0;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    const todayEnd = todayStart + 86400000;

    tasks.forEach((t) => {
      if (t.isArchived) {
        archived++;
        return;
      }
      total++;
      if (t.status === TaskStatus.DONE) done++;
      else if (t.status === TaskStatus.IN_PROGRESS) inProgress++;
      else if (t.status === 'PENDING_REVIEW' || t.status === 'PENDING') pending++;

      const assignees = t.assignees || (t.assignee ? [t.assignee] : []);
      if (assignees.length === 0) unassigned++;

      if (t.dueDate) {
        const dueTime = new Date(t.dueDate).getTime();
        if (t.status !== TaskStatus.DONE && dueTime < todayEnd) {
          today++;
        } else if (dueTime >= todayStart && dueTime < todayEnd) {
          today++;
        }
      }
    });

    const donePercent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, today, inProgress, pending, done, donePercent, archived, unassigned };
  }, [tasks]);

  // Extract distinct assignees for dropdown filter
  const distinctAssignees = useMemo(() => {
    const map = new Map<string, string>();
    tasks.forEach((t) => {
      const arr = t.assignees || (t.assignee ? [t.assignee] : []);
      arr.forEach((a: any) => {
        const id = a.id || a.userId || a.name;
        const name = a.name || a.fullName || a.email || id;
        if (id && name) map.set(id, name);
      });
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [tasks]);

  // 2. Multi-dimensional Reactive Task Filtering & Sorting
  const filteredTasks = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    const todayEnd = todayStart + 86400000;
    const weekEnd = todayStart + 7 * 86400000;

    const filtered = tasks.filter((t) => {
      // 1. Metric Tab Filter
      if (metricTab === 'TODAY') {
        if (!t.dueDate) return false;
        const dueTime = new Date(t.dueDate).getTime();
        if (t.status !== TaskStatus.DONE) {
          if (dueTime >= todayEnd) return false;
        } else {
          if (dueTime < todayStart || dueTime >= todayEnd) return false;
        }
      } else if (metricTab === 'IN_PROGRESS') {
        if (t.status !== TaskStatus.IN_PROGRESS) return false;
      } else if (metricTab === 'PENDING') {
        if (t.status !== 'PENDING_REVIEW' && t.status !== 'PENDING') return false;
      } else if (metricTab === 'DONE') {
        if (t.status !== TaskStatus.DONE) return false;
      } else if (metricTab === 'ARCHIVED') {
        if (!t.isArchived) return false;
      } else if (metricTab === 'UNASSIGNED') {
        const arr = t.assignees || (t.assignee ? [t.assignee] : []);
        if (arr.length > 0) return false;
      } else {
        // 'ALL' ignores archived
        if (t.isArchived) return false;
      }

      // 2. Priority Filter
      if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false;

      // 3. Assignee Filter
      if (filterAssignee !== 'ALL') {
        if (filterAssignee === 'me') {
          const arr = t.assignees || (t.assignee ? [t.assignee] : []);
          const isAssignee = arr.some((a: any) => (a.id || a.userId) === currentUser?.id);
          const isCreator = t.userId === currentUser?.id;
          if (!isAssignee && !isCreator) return false;
        } else if (filterAssignee === 'UNASSIGNED' || filterAssignee === 'unassigned') {
          const arr = t.assignees || (t.assignee ? [t.assignee] : []);
          if (arr.length > 0) return false;
        } else {
          const arr = t.assignees || (t.assignee ? [t.assignee] : []);
          const has = arr.some((a: any) => (a.id || a.userId || a.name) === filterAssignee);
          if (!has) return false;
        }
      }

      // 4. Date Preset Filter
      if (filterDatePreset === 'TODAY_OVERDUE') {
        if (!t.dueDate) return false;
        const dueTime = new Date(t.dueDate).getTime();
        if (dueTime >= todayEnd && t.status !== TaskStatus.DONE) return false;
      } else if (filterDatePreset === 'TODAY') {
        if (!t.dueDate) return false;
        const dueTime = new Date(t.dueDate).getTime();
        if (dueTime < todayStart || dueTime >= todayEnd) return false;
      } else if (filterDatePreset === 'WEEK') {
        if (!t.dueDate) return false;
        const dueTime = new Date(t.dueDate).getTime();
        if (dueTime < todayStart || dueTime > weekEnd) return false;
      } else if (filterDatePreset === 'OVERDUE') {
        if (!t.dueDate || t.status === TaskStatus.DONE) return false;
        const dueTime = new Date(t.dueDate).getTime();
        if (dueTime >= todayStart) return false;
      }

      // 5. Search Text Query (Title, Description, Assignee)
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchAssignee = (t.assignees || []).some((a: any) => (a.name || a.fullName || '').toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchAssignee) return false;
      }

      return true;
    });

    const sorted = [...filtered];
    if (sortMode === 'today_first') {
      sorted.sort((a, b) => {
        const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return aDue - bDue;
      });
    } else if (sortMode === 'priority_first') {
      const pWeight: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      sorted.sort((a, b) => (pWeight[b.priority] || 0) - (pWeight[a.priority] || 0));
    } else if (sortMode === 'due_asc') {
      sorted.sort((a, b) => {
        const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return aDue - bDue;
      });
    } else if (sortMode === 'created_desc') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return sorted;
  }, [tasks, metricTab, filterPriority, filterAssignee, filterDatePreset, search, sortMode, currentUser?.id]);

  const todoTasks = filteredTasks.filter((t) => t.status === TaskStatus.TODO);
  const inProgressTasks = filteredTasks.filter((t) => t.status === TaskStatus.IN_PROGRESS);
  const doneTasks = filteredTasks.filter((t) => t.status === TaskStatus.DONE);

  const columns = [
    {
      id: 'todo',
      title: t('tasks.status_todo'),
      count: todoTasks.length,
      items: todoTasks,
      icon: ListTodo,
      accentColor: 'var(--color-info)',
      badgeClass: 'badge-blue'
    },
    {
      id: 'in_progress',
      title: t('tasks.status_in_progress'),
      count: inProgressTasks.length,
      items: inProgressTasks,
      icon: Zap,
      accentColor: 'var(--color-warning)',
      badgeClass: 'badge-amber'
    },
    {
      id: 'done',
      title: t('tasks.status_done'),
      count: doneTasks.length,
      items: doneTasks,
      icon: CheckCircle2,
      accentColor: 'var(--color-success)',
      badgeClass: 'badge-green'
    }
  ];

  return (
    <div className="tasks-page">
      {/* 1. UNIFIED INTEGRATED TASKS TOOLBAR */}
      <div
        style={{
          padding: '8px 12px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        {/* Tier 1: View Mode Switcher + Count on Left; Quick Add + New Task on Right */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '2px',
                gap: '2px'
              }}
            >
              {/* GANTT */}
              <button
                onClick={() => handleSelectViewMode('GANTT')}
                className={`btn btn-sm ${viewMode === 'GANTT' ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: 'var(--type-caption)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: viewMode === 'GANTT' ? 'var(--text-primary)' : 'transparent',
                  color: viewMode === 'GANTT' ? 'var(--bg-primary)' : 'var(--text-secondary)'
                }}
                title={t('tasks.view_gantt')}
              >
                <TrendingUp size={14} />
                <span>Gantt (7W)</span>
              </button>

              {/* LIST */}
              <button
                onClick={() => handleSelectViewMode('LIST')}
                className={`btn btn-sm ${viewMode === 'LIST' ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: 'var(--type-caption)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: viewMode === 'LIST' ? 'var(--text-primary)' : 'transparent',
                  color: viewMode === 'LIST' ? 'var(--bg-primary)' : 'var(--text-secondary)'
                }}
                title={t('tasks.view_list')}
              >
                <ListFilter size={14} />
                <span>{t('tasks.view_list_tab')}</span>
              </button>

              {/* KANBAN */}
              <button
                onClick={() => handleSelectViewMode('KANBAN')}
                className={`btn btn-sm ${viewMode === 'KANBAN' ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: 'var(--type-caption)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: viewMode === 'KANBAN' ? 'var(--text-primary)' : 'transparent',
                  color: viewMode === 'KANBAN' ? 'var(--bg-primary)' : 'var(--text-secondary)'
                }}
                title={t('tasks.view_kanban')}
              >
                <Columns3 size={14} />
                <span>Kanban</span>
              </button>

              {/* EISENHOWER */}
              <button
                onClick={() => handleSelectViewMode('EISENHOWER')}
                className={`btn btn-sm ${viewMode === 'EISENHOWER' ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: 'var(--type-caption)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: viewMode === 'EISENHOWER' ? 'var(--text-primary)' : 'transparent',
                  color: viewMode === 'EISENHOWER' ? 'var(--bg-primary)' : 'var(--text-secondary)'
                }}
                title={t('tasks.view_eisenhower')}
              >
                <LayoutGrid size={14} />
                <span>Eisenhower</span>
              </button>
            </div>

            <span style={{ fontSize: 'var(--type-caption)', color: 'var(--text-secondary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span>{t('tasks.tasks_count_badge', { count: filteredTasks.length })}</span>
              <span>•</span>
              <span>{t('tasks.tasks_done_badge', { count: doneTasks.length })}</span>
            </span>
          </div>

          {/* Right: Quick Add Toggle + New Task Primary Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
              className="btn btn-sm btn-ghost"
              style={{
                height: '32px',
                fontSize: 'var(--type-caption)',
                padding: '0 10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-secondary)'
              }}
            >
              <Zap size={13} />
              <span>{t('tasks.quick_add_btn')}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="btn btn-sm btn-primary"
              style={{
                height: '32px',
                fontSize: 'var(--type-small)',
                padding: '0 14px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '8px'
              }}
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>{t('tasks.new_task_btn')}</span>
            </button>
          </div>
        </div>

        {/* Tier 2: 1-Click Status Filter Pills & Search/Dropdown Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            paddingTop: '8px',
            borderTop: '1px solid var(--border-subtle)'
          }}
        >
          {/* Status Filter Pills */}
          <div
            className="tasks-status-filters"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              overflowX: 'auto',
              paddingBottom: '2px',
              flex: '1 1 380px',
              minWidth: 0
            }}
          >
            <button
              type="button"
              onClick={() => setMetricTab('ALL')}
              title={t('tasks.view_all_tooltip')}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                fontWeight: metricTab === 'ALL' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
                border: 'none',
                backgroundColor: metricTab === 'ALL' ? 'var(--text-primary)' : 'transparent',
                color: metricTab === 'ALL' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                transition: 'all 0.12s ease'
              }}
            >
              <span>{t('tasks.all_count')}</span>
              <span
                style={{
                  padding: '1px 5px',
                  borderRadius: '999px',
                  fontSize: 'var(--type-caption)',
                  fontFamily: 'var(--font-mono, monospace)',
                  backgroundColor: metricTab === 'ALL' ? 'rgba(128,128,128,0.25)' : 'var(--bg-secondary)',
                  color: 'inherit',
                  fontWeight: 700
                }}
              >
                {metrics.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMetricTab('TODAY')}
              title={t('tasks.view_today_tooltip')}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                fontWeight: metricTab === 'TODAY' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
                border: 'none',
                backgroundColor: metricTab === 'TODAY' ? 'var(--text-primary)' : 'transparent',
                color: metricTab === 'TODAY' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                transition: 'all 0.12s ease'
              }}
            >
              <Clock size={13} />
              <span>{t('tasks.today_count')}</span>
              <span
                style={{
                  padding: '1px 5px',
                  borderRadius: '999px',
                  fontSize: 'var(--type-caption)',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 700,
                  backgroundColor: metricTab === 'TODAY' ? 'rgba(128,128,128,0.25)' : 'var(--bg-secondary)',
                  color: 'inherit'
                }}
              >
                {metrics.today}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMetricTab('IN_PROGRESS')}
              title={t('tasks.view_inprogress_tooltip')}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                fontWeight: metricTab === 'IN_PROGRESS' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
                border: 'none',
                backgroundColor: metricTab === 'IN_PROGRESS' ? 'var(--text-primary)' : 'transparent',
                color: metricTab === 'IN_PROGRESS' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                transition: 'all 0.12s ease'
              }}
            >
              <span>{t('tasks.in_progress_count')}</span>
              <span
                style={{
                  padding: '1px 5px',
                  borderRadius: '999px',
                  fontSize: 'var(--type-caption)',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 700,
                  backgroundColor: metricTab === 'IN_PROGRESS' ? 'rgba(128,128,128,0.25)' : 'var(--bg-secondary)',
                  color: 'inherit'
                }}
              >
                {metrics.inProgress}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMetricTab('PENDING')}
              title={t('tasks.view_pending_tooltip')}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                fontWeight: metricTab === 'PENDING' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
                border: 'none',
                backgroundColor: metricTab === 'PENDING' ? 'var(--text-primary)' : 'transparent',
                color: metricTab === 'PENDING' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                transition: 'all 0.12s ease'
              }}
            >
              <span>{t('tasks.pending_count')}</span>
              <span
                style={{
                  padding: '1px 5px',
                  borderRadius: '999px',
                  fontSize: 'var(--type-caption)',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 700,
                  backgroundColor: metricTab === 'PENDING' ? 'rgba(128,128,128,0.25)' : 'var(--bg-secondary)',
                  color: 'inherit'
                }}
              >
                {metrics.pending}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMetricTab('DONE')}
              title={t('tasks.view_done_tooltip')}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                fontWeight: metricTab === 'DONE' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
                border: 'none',
                backgroundColor: metricTab === 'DONE' ? 'var(--text-primary)' : 'transparent',
                color: metricTab === 'DONE' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                transition: 'all 0.12s ease'
              }}
            >
              <span>{t('tasks.done_count')}</span>
              <span
                style={{
                  padding: '1px 5px',
                  borderRadius: '999px',
                  fontSize: 'var(--type-caption)',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 700,
                  backgroundColor: metricTab === 'DONE' ? 'rgba(128,128,128,0.25)' : 'var(--bg-secondary)',
                  color: 'inherit'
                }}
              >
                {metrics.donePercent}%
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMetricTab('ARCHIVED')}
              title={t('tasks.view_archived_tooltip')}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                fontWeight: metricTab === 'ARCHIVED' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
                border: 'none',
                backgroundColor: metricTab === 'ARCHIVED' ? 'var(--text-primary)' : 'transparent',
                color: metricTab === 'ARCHIVED' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                transition: 'all 0.12s ease'
              }}
            >
              <Archive size={13} />
              <span>{t('tasks.archived_count')}</span>
              <span
                style={{
                  padding: '1px 5px',
                  borderRadius: '999px',
                  fontSize: 'var(--type-caption)',
                  fontFamily: 'var(--font-mono, monospace)',
                  backgroundColor: metricTab === 'ARCHIVED' ? 'rgba(128,128,128,0.25)' : 'var(--bg-secondary)',
                  color: 'inherit',
                  fontWeight: 700
                }}
              >
                {metrics.archived}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMetricTab('UNASSIGNED')}
              title={t('tasks.view_unassigned_tooltip')}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                fontWeight: metricTab === 'UNASSIGNED' ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
                border: 'none',
                backgroundColor: metricTab === 'UNASSIGNED' ? 'var(--text-primary)' : 'transparent',
                color: metricTab === 'UNASSIGNED' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                transition: 'all 0.12s ease'
              }}
            >
              <UserCheck size={13} />
              <span>{t('tasks.metric_unassigned_btn', { count: metrics.unassigned })}</span>
            </button>
          </div>

          {/* Search & Filter Controls */}
          <div className="tasks-filter-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 180px', minWidth: '150px', maxWidth: '240px' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: 'var(--text-muted)',
                  display: 'flex'
                }}
              >
                <Search size={14} />
              </span>
              <input
                type="text"
                id="global-search-input"
                placeholder={`${t('tasks.search_placeholder')} [/]`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="snote-input"
                style={{
                  paddingLeft: '30px',
                  paddingRight: '26px',
                  height: '30px',
                  fontSize: 'var(--type-caption)',
                  borderRadius: '6px'
                }}
              />
              {search && (
                <button
                  type="button"
                  id="btn-clear-search"
                  onClick={() => setSearch('')}
                  title={t('tasks.clear_search_tooltip')}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    padding: 0
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Lọc theo Người phụ trách */}
            <select
              id="filter-assignee-select"
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="snote-select"
              style={{
                height: '30px',
                fontSize: 'var(--type-caption)',
                padding: '3px 8px',
                borderRadius: '6px',
                maxWidth: '130px'
              }}
              title={t('tasks.filter_assignee_title')}
            >
              <option value="ALL">{t('tasks.filter_assignee_all')}</option>
              <option value="me">{t('tasks.filter_assignee_me')}</option>
              <option value="UNASSIGNED">{t('tasks.filter_assignee_unassigned', { count: metrics.unassigned })}</option>
              {distinctAssignees.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            {/* Tùy chọn Sắp xếp (Sort Mode) */}
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as any)}
              className="snote-select"
              style={{
                height: '30px',
                fontSize: 'var(--type-caption)',
                padding: '3px 8px',
                borderRadius: '6px',
                maxWidth: '140px'
              }}
              title={t('tasks.sort_title')}
            >
              <option value="today_first">{t('tasks.sort_today_first')}</option>
              <option value="priority_first">{t('tasks.sort_priority_first')}</option>
              <option value="due_asc">{t('tasks.sort_due_asc')}</option>
              <option value="created_desc">{t('tasks.sort_created_desc')}</option>
            </select>

            {/* Lọc theo Mức độ ưu tiên */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="snote-select"
              style={{
                height: '30px',
                fontSize: 'var(--type-caption)',
                padding: '3px 8px',
                borderRadius: '6px',
                maxWidth: '110px'
              }}
              title={t('tasks.filter_priority_title')}
            >
              <option value="ALL">{t('tasks.filter_priority_all')}</option>
              <option value={TaskPriority.URGENT}>{t('tasks.priority_urgent')}</option>
              <option value={TaskPriority.HIGH}>{t('tasks.priority_high')}</option>
              <option value={TaskPriority.MEDIUM}>{t('tasks.priority_medium')}</option>
              <option value={TaskPriority.LOW}>{t('tasks.priority_low')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. COLLAPSIBLE QUICK ADD BOX */}
      {isQuickAddOpen && (
        <div style={{ animation: 'wsFadeIn 0.14s ease-out' }}>
          <QuickTaskBar
            subjects={currentWorkspace.type === 'SUBJECT' ? subjects : []}
            defaultSubjectId={currentWorkspace.type === 'SUBJECT' ? currentWorkspace.subjectId : undefined}
            defaultProjectId={currentWorkspace.type === 'PROJECT' ? currentWorkspace.projectId : undefined}
            defaultWorkspaceId={currentWorkspace.type === 'GROUP' ? currentWorkspace.id : undefined}
            onTaskAdded={handleTaskAdded}
            onTaskCreated={() => {
              fetchTasks(true);
              setIsQuickAddOpen(false);
            }}
          />
        </div>
      )}

      {/* 3. MAIN VIEW CANVAS */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)', fontWeight: 600 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: 'var(--type-body)' }}>
            <Sparkles size={16} style={{ color: 'var(--text-muted)' }} />
            <span>{t('common.loading')}</span>
          </div>
        </div>
      ) : viewMode === 'GANTT' ? (
        <TasksGanttView
          tasks={filteredTasks}
          onSelectTask={handleOpenEdit}
          onToggleStatus={handleToggleStatus}
        />
      ) : viewMode === 'HOURLY' ? (
        <TasksHourlyView
          tasks={filteredTasks}
          onSelectTask={handleOpenEdit}
          onToggleStatus={handleToggleStatus}
          onOpenCreate={handleOpenCreate}
        />
      ) : viewMode === 'LIST' ? (
        <TasksListView
          tasks={filteredTasks}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
          onMoveStatus={handleMoveStatus}
        />
      ) : viewMode === 'EISENHOWER' ? (
        <TasksEisenhowerView
          tasks={filteredTasks}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
          onMoveStatus={handleMoveStatus}
          onOpenCreate={handleOpenCreate}
        />
      ) : (
        /* KANBAN BOARD VIEW */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '10px', alignItems: 'start' }}>
          {columns.map((col) => {
            const Icon = col.icon;
            return (
              <div
                key={col.id}
                className="snote-card"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 'calc(100dvh - 185px)'
                }}
              >
                <div
                  style={{
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon size={15} style={{ color: 'var(--text-secondary)' }} />
                    <span style={{ fontSize: 'var(--type-small)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {col.title}
                    </span>
                  </div>
                  <span
                    className="badge"
                    style={{
                      fontSize: 'var(--type-caption)',
                      padding: '1px 7px',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    {col.count}
                  </span>
                </div>

                <div
                  style={{
                    padding: '10px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    flex: 1
                  }}
                >
                  {col.items.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-secondary)', fontWeight: 700, fontSize: 'var(--type-small)' }}>
                      {t('tasks.empty_lane')}
                    </div>
                  ) : (
                    col.items.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={handleOpenEdit}
                        onDelete={handleDelete}
                        onToggleStatus={handleToggleStatus}
                        onMoveStatus={handleMoveStatus}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Creation / Editing Modal */}
      {isModalOpen && (
        <TaskModal
          isOpen={isModalOpen}
          taskToEdit={taskToEdit}
          defaultProjectId={currentWorkspace.type === 'PROJECT' ? currentWorkspace.projectId : undefined}
          defaultWorkspaceId={currentWorkspace.type === 'GROUP' ? currentWorkspace.id : undefined}
          defaultWorkspaceName={currentWorkspace.type === 'GROUP' ? currentWorkspace.name : undefined}
          defaultSubjectId={currentWorkspace.type === 'SUBJECT' ? currentWorkspace.subjectId : undefined}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchTasks(true);
          }}
        />
      )}
    </div>
  );
};
