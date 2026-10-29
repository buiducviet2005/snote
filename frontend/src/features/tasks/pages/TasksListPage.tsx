import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, ApiResponse } from '../../../services/api';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useToast } from '../../../contexts/ToastContext';
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
        if (dueTime >= todayStart && dueTime < todayEnd) today++;
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

  // 2. Multi-dimensional Reactive Task Filtering
  const filteredTasks = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    const todayEnd = todayStart + 86400000;
    const weekEnd = todayStart + 7 * 86400000;

    return tasks.filter((t) => {
      // 1. Metric Tab Filter
      if (metricTab === 'TODAY') {
        if (!t.dueDate) return false;
        const dueTime = new Date(t.dueDate).getTime();
        if (dueTime < todayStart || dueTime >= todayEnd) return false;
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
        const arr = t.assignees || (t.assignee ? [t.assignee] : []);
        const has = arr.some((a: any) => (a.id || a.userId || a.name) === filterAssignee);
        if (!has) return false;
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
  }, [tasks, metricTab, filterPriority, filterAssignee, filterDatePreset, search]);

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
      {/* 1. UNIVERSAL METRIC PILLS & MULTI-DIMENSIONAL FILTER BAR (Images 1, 2, 3 Header) */}
      <div
        className="snote-card"
        style={{
          padding: '8px 12px',
          borderRadius: '10px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        {/* Left: Metric Pills Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '2px',
            scrollbarWidth: 'none'
          }}
        >
          {/* Tất cả */}
          <button
            type="button"
            onClick={() => setMetricTab('ALL')}
            className={`btn btn-sm ${metricTab === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '11.5px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{t('tasks.all_count')}</span>
            <span style={{ fontSize: '10px', opacity: 0.85, fontFamily: 'var(--font-mono)' }}>{metrics.total}</span>
          </button>

          {/* Hôm nay */}
          <button
            type="button"
            onClick={() => setMetricTab('TODAY')}
            className={`btn btn-sm ${metricTab === 'TODAY' ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '11.5px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Clock size={12} />
            <span>{t('tasks.today_count')}</span>
            <span style={{ fontSize: '10px', opacity: 0.85, fontFamily: 'var(--font-mono)' }}>{metrics.today}</span>
          </button>

          {/* Đang làm */}
          <button
            type="button"
            onClick={() => setMetricTab('IN_PROGRESS')}
            className={`btn btn-sm ${metricTab === 'IN_PROGRESS' ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '11.5px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{t('tasks.in_progress_count')}</span>
            <span style={{ fontSize: '10px', opacity: 0.85, fontFamily: 'var(--font-mono)' }}>{metrics.inProgress}</span>
          </button>

          {/* Chờ duyệt */}
          <button
            type="button"
            onClick={() => setMetricTab('PENDING')}
            className={`btn btn-sm ${metricTab === 'PENDING' ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '11.5px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{t('tasks.pending_count')}</span>
            <span style={{ fontSize: '10px', opacity: 0.85, fontFamily: 'var(--font-mono)' }}>{metrics.pending}</span>
          </button>

          {/* Đã xong */}
          <button
            type="button"
            onClick={() => setMetricTab('DONE')}
            className={`btn btn-sm ${metricTab === 'DONE' ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '11.5px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{t('tasks.done_count')}</span>
            <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{metrics.donePercent}%</span>
          </button>

          {/* Đã lưu trữ */}
          <button
            type="button"
            onClick={() => setMetricTab('ARCHIVED')}
            className={`btn btn-sm ${metricTab === 'ARCHIVED' ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '11.5px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Archive size={12} />
            <span>{t('tasks.archived_count')}</span>
            <span style={{ fontSize: '10px', opacity: 0.85, fontFamily: 'var(--font-mono)' }}>{metrics.archived}</span>
          </button>

          {/* + Chưa giao */}
          <button
            type="button"
            onClick={() => setMetricTab('UNASSIGNED')}
            className={`btn btn-sm ${metricTab === 'UNASSIGNED' ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '11.5px',
              fontWeight: 600,
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: metricTab === 'UNASSIGNED' ? '#fff' : '#f59e0b',
              backgroundColor: metricTab === 'UNASSIGNED' ? '#f59e0b' : 'rgba(245, 158, 11, 0.08)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span>+ {t('tasks.unassigned_count')} ({metrics.unassigned})</span>
          </button>
        </div>

        {/* Right: Multi-dimensional Filter Dropdowns & Quick Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Quick Search */}
          <div style={{ position: 'relative', width: '210px' }}>
            <span style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
              <Search size={13} />
            </span>
            <input
              type="text"
              placeholder={t('tasks.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="snote-input"
              style={{
                paddingLeft: '28px',
                paddingRight: search ? '26px' : '8px',
                height: '30px',
                fontSize: '11.5px',
                borderRadius: '6px'
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)'
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Assignee Filter Dropdown */}
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="snote-select"
            style={{ height: '30px', fontSize: '11.5px', padding: '0 8px', borderRadius: '6px', maxWidth: '140px' }}
          >
            <option value="ALL">{t('tasks.filter_assignee_all')}</option>
            {distinctAssignees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          {/* Date Preset Filter Dropdown */}
          <select
            value={filterDatePreset}
            onChange={(e) => setFilterDatePreset(e.target.value)}
            className="snote-select"
            style={{ height: '30px', fontSize: '11.5px', padding: '0 8px', borderRadius: '6px', maxWidth: '150px' }}
          >
            <option value="ALL">{t('tasks.filter_date_all')}</option>
            <option value="TODAY_OVERDUE">{t('tasks.filter_date_today_overdue')}</option>
            <option value="TODAY">{t('tasks.filter_date_today')}</option>
            <option value="WEEK">{t('tasks.filter_date_week')}</option>
            <option value="OVERDUE">{t('tasks.filter_date_overdue')}</option>
          </select>

          {/* Priority Filter Dropdown */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="snote-select"
            style={{ height: '30px', fontSize: '11.5px', padding: '0 8px', borderRadius: '6px', maxWidth: '130px' }}
          >
            <option value="ALL">{t('tasks.filter_priority_all')}</option>
            <option value={TaskPriority.URGENT}>{t('tasks.priority_urgent')}</option>
            <option value={TaskPriority.HIGH}>{t('tasks.priority_high')}</option>
            <option value={TaskPriority.MEDIUM}>{t('tasks.priority_medium')}</option>
            <option value={TaskPriority.LOW}>{t('tasks.priority_low')}</option>
          </select>
        </div>
      </div>

      {/* 2. SECONDARY CONTROLS BAR: VIEW MODE SWITCHER & QUICK ACTIONS */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        {/* Left: View Mode Segmented Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            {/* GANTT (Image 1) */}
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

            {/* HOURLY (Image 2) */}
            <button
              onClick={() => handleSelectViewMode('HOURLY')}
              className={`btn btn-sm ${viewMode === 'HOURLY' ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: viewMode === 'HOURLY' ? 'var(--accent)' : 'transparent',
                color: viewMode === 'HOURLY' ? '#ffffff' : 'var(--text-secondary)'
              }}
              title={t('tasks.view_hourly')}
            >
              <Clock size={14} />
              <span>{language === 'vi' ? 'Khung giờ' : 'Hourly'}</span>
            </button>

            {/* LIST (Image 3) */}
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

        {/* Right: Quick Add Toggle + New Task Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
            className="btn btn-sm btn-ghost"
            style={{
              height: '30px',
              fontSize: '11.5px',
              padding: '0 10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
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
              height: '30px',
              fontSize: '11.5px',
              padding: '0 12px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              borderRadius: '6px'
            }}
          >
            <Plus size={14} />
            <span>{t('tasks.create_task')}</span>
          </button>
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
