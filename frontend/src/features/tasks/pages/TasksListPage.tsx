import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  const { selectedSubjectId, selectedSemesterId, subjects } = useAppFilter();
  const { t, language } = useLanguage();
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('snote_tasks_view_mode') as ViewMode) || 'GANTT';
  });

  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Universal Filters
  const [metricTab, setMetricTab] = useState<MetricTab>('ALL');
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterAssignee, setFilterAssignee] = useState<string>('ALL');
  const [filterDatePreset, setFilterDatePreset] = useState<string>('ALL');
  const [filterProjectId, setFilterProjectId] = useState<string>('ALL');
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
        showToast(language === 'vi' ? 'Không tìm thấy công việc hoặc bạn không có quyền truy cập' : 'Task not found or access denied', 'error');
      });
  }, [deepTaskId, showToast, language]);

  const handleSelectViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('snote_tasks_view_mode', mode);
  };

  useEffect(() => {
    api.get<ApiResponse<any[]>>('/projects')
      .then((res) => setProjects(res.data || []))
      .catch(() => {});
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSubjectId) params.append('subjectId', selectedSubjectId);
      if (filterProjectId !== 'ALL') params.append('projectId', filterProjectId);

      const res = await api.get<ApiResponse<any[]>>(`/tasks?${params.toString()}`);
      setTasks(res.data || []);
    } catch {
      showToast(language === 'vi' ? 'Không thể tải danh sách công việc' : 'Failed to fetch tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedSubjectId, filterProjectId, showToast, language]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, selectedSemesterId]);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(language === 'vi' ? `Bạn có chắc chắn muốn xóa công việc "${title}" không?` : `Delete task "${title}"?`)) return;

    try {
      await api.delete(`/tasks/${id}`);
      showToast(language === 'vi' ? `Đã xóa công việc "${title}"` : `Deleted task "${title}"`, 'success');
      fetchTasks();
    } catch (err: any) {
      showToast(err.message || 'Error deleting task', 'error');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: TaskStatus) => {
    const nextStatus = currentStatus === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;
    try {
      await api.patch(`/tasks/${id}/status`, { status: nextStatus });
      showToast(
        nextStatus === TaskStatus.DONE
          ? (language === 'vi' ? 'Đã hoàn thành công việc!' : 'Task marked as completed!')
          : (language === 'vi' ? 'Đã chuyển công việc về danh sách Cần làm' : 'Task moved back to To Do'),
        'success'
      );
      fetchTasks();
    } catch (err: any) {
      showToast(err.message || 'Error updating task status', 'error');
    }
  };

  const handleMoveStatus = async (id: string, newStatus: TaskStatus) => {
    try {
      await api.patch(`/tasks/${id}/status`, { status: newStatus });
      fetchTasks();
    } catch (err: any) {
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
    <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 1. TOP VIEW MODE SWITCHER & PRIMARY ACTION BAR */}
      <div
        className="snote-card"
        style={{
          padding: '8px 14px',
          borderRadius: '12px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        {/* Left: View Mode Controls (Hourly removed as requested) */}
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
                fontSize: '11.5px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: viewMode === 'GANTT' ? 'var(--accent)' : 'transparent',
                color: viewMode === 'GANTT' ? '#ffffff' : 'var(--text-secondary)'
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
                fontSize: '11.5px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: viewMode === 'LIST' ? 'var(--accent)' : 'transparent',
                color: viewMode === 'LIST' ? '#ffffff' : 'var(--text-secondary)'
              }}
              title={t('tasks.view_list')}
            >
              <ListFilter size={14} />
              <span>{language === 'vi' ? 'Danh sách' : 'List'}</span>
            </button>

            {/* KANBAN */}
            <button
              onClick={() => handleSelectViewMode('KANBAN')}
              className={`btn btn-sm ${viewMode === 'KANBAN' ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: viewMode === 'KANBAN' ? 'var(--accent)' : 'transparent',
                color: viewMode === 'KANBAN' ? '#ffffff' : 'var(--text-secondary)'
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
                fontSize: '11.5px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: viewMode === 'EISENHOWER' ? 'var(--accent)' : 'transparent',
                color: viewMode === 'EISENHOWER' ? '#ffffff' : 'var(--text-secondary)'
              }}
              title={t('tasks.view_eisenhower')}
            >
              <LayoutGrid size={14} />
              <span>Eisenhower</span>
            </button>
          </div>

          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span>{filteredTasks.length} {language === 'vi' ? 'việc' : 'tasks'}</span>
            <span>•</span>
            <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{doneTasks.length} {language === 'vi' ? 'xong' : 'done'}</span>
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
              fontSize: '11.5px',
              padding: '0 10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: isQuickAddOpen ? 'var(--accent)' : 'var(--text-secondary)'
            }}
          >
            <Zap size={13} />
            <span>{language === 'vi' ? 'Tạo nhanh' : 'Quick Add'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="btn btn-sm btn-primary"
            style={{
              height: '32px',
              fontSize: '12px',
              padding: '0 14px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
            }}
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>{language === 'vi' ? '+ Tạo công việc mới' : '+ New Task'}</span>
          </button>
        </div>
      </div>

      {/* 2. 1-CLICK STATUS FILTER PILLS & MULTI-DIMENSIONAL CONTROLS (Exact requested style) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-3 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-2xs">
        {/* 1-Click Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0 custom-scrollbar">
          <button
            type="button"
            onClick={() => setMetricTab('ALL')}
            title="Xem tất cả công việc"
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              metricTab === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Tất cả</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                metricTab === 'ALL'
                  ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {metrics.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMetricTab('TODAY')}
            title="Chỉ xem công việc cần làm hôm nay hoặc quá hạn"
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              metricTab === 'TODAY'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock size={14} />
            <span>Hôm nay</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold">
              {metrics.today}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMetricTab('IN_PROGRESS')}
            title="Lọc công việc đang làm"
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              metricTab === 'IN_PROGRESS'
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Đang làm</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              {metrics.inProgress}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMetricTab('PENDING')}
            title="Lọc công việc chờ duyệt"
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              metricTab === 'PENDING'
                ? 'bg-purple-600 text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Chờ duyệt</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
              {metrics.pending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMetricTab('DONE')}
            title="Lọc công việc đã xong"
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              metricTab === 'DONE'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Đã xong</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
              {metrics.donePercent}%
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMetricTab('ARCHIVED')}
            title="Xem danh sách công việc đã lưu trữ (Archived Vault)"
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              metricTab === 'ARCHIVED'
                ? 'bg-slate-700 text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Archive size={14} />
            <span>Đã lưu trữ</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {metrics.archived}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMetricTab('UNASSIGNED')}
            title="Xem việc chưa có người nhận"
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              metricTab === 'UNASSIGNED'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-amber-500/10 dark:bg-amber-950/40 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 dark:border-amber-700/50'
            }`}
          >
            <UserCheck size={14} className="text-amber-600 dark:text-amber-400" />
            <span>Chưa giao ({metrics.unassigned})</span>
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:w-52">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              id="global-search-input"
              placeholder="Tìm việc, người làm, checklist... [/]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {search && (
              <button
                type="button"
                id="btn-clear-search"
                onClick={() => setSearch('')}
                title="Xóa tìm kiếm (Esc)"
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Lọc theo Người phụ trách */}
          <select
            id="filter-assignee-select"
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="text-xs py-1 pl-2 pr-5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer shrink-0 max-w-[115px] sm:max-w-[135px] truncate"
            title="Lọc công việc theo người phụ trách"
          >
            <option value="ALL">Tất cả người làm</option>
            <option value="me">Việc của tôi</option>
            <option value="UNASSIGNED">Chưa phân công ({metrics.unassigned})</option>
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
            className="text-xs py-1 pl-2 pr-5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer shrink-0 max-w-[125px] sm:max-w-[145px] truncate font-medium"
            title="Thứ tự sắp xếp công việc"
          >
            <option value="today_first">Hôm nay & Hạn chót</option>
            <option value="priority_first">Độ quan trọng</option>
            <option value="due_asc">Hạn chót gần nhất</option>
            <option value="created_desc">Mới tạo gần nhất</option>
          </select>

          {/* Lọc theo Mức độ ưu tiên */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="text-xs py-1 pl-2 pr-5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer shrink-0 max-w-[95px] truncate"
            title="Lọc theo mức độ ưu tiên"
          >
            <option value="ALL">Mọi ưu tiên</option>
            <option value={TaskPriority.URGENT}>Khẩn cấp</option>
            <option value={TaskPriority.HIGH}>Cao</option>
            <option value={TaskPriority.MEDIUM}>Trung bình</option>
            <option value={TaskPriority.LOW}>Thấp</option>
          </select>
        </div>
      </div>

      {/* 3. COLLAPSIBLE QUICK ADD BOX */}
      {isQuickAddOpen && (
        <div style={{ animation: 'wsFadeIn 0.14s ease-out' }}>
          <QuickTaskBar
            subjects={subjects}
            defaultSubjectId={selectedSubjectId || undefined}
            onTaskCreated={() => {
              fetchTasks();
              setIsQuickAddOpen(false);
            }}
          />
        </div>
      )}

      {/* 4. MAIN VIEW CANVAS */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <Sparkles size={18} className="pulse-urgent" style={{ color: 'var(--accent-primary)' }} />
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '14px', alignItems: 'start' }}>
          {columns.map((col) => {
            const Icon = col.icon;
            return (
              <div
                key={col.id}
                className="snote-card"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 'calc(100vh - 240px)'
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
                    <Icon size={16} style={{ color: col.accentColor }} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {col.title}
                    </span>
                  </div>
                  <span
                    className="badge"
                    style={{
                      fontSize: '11px',
                      padding: '1px 7px',
                      backgroundColor: 'var(--bg-secondary)',
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
                    <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                      {language === 'vi' ? 'Không có công việc' : 'No tasks in this lane'}
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
          defaultSubjectId={selectedSubjectId || undefined}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchTasks();
          }}
        />
      )}
    </div>
  );
};
