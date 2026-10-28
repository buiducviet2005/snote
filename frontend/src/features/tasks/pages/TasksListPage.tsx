import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, ApiResponse } from '../../../services/api';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useToast } from '../../../contexts/ToastContext';
import { TaskCard } from '../components/TaskCard';
import { TaskModal } from '../components/TaskModal';
import { QuickTaskBar } from '../components/QuickTaskBar';
import { TasksListView } from '../components/TasksListView';
import { TasksEisenhowerView } from '../components/TasksEisenhowerView';
import { TasksGanttView } from '../components/TasksGanttView';
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
  TrendingUp
} from 'lucide-react';

export const TasksListPage: React.FC = () => {
  const { selectedSubjectId, selectedSemesterId, subjects } = useAppFilter();
  const [viewMode, setViewMode] = useState<'GANTT' | 'KANBAN' | 'LIST' | 'EISENHOWER'>(() => {
    return (localStorage.getItem('snote_tasks_view_mode') as any) || 'GANTT';
  });
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterProjectId, setFilterProjectId] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<any | null>(null);
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const deepTaskId = searchParams.get('taskId');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isFilterOpen]);


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
        showToast('Không tìm thấy công việc hoặc bạn không có quyền truy cập', 'error');
      });
  }, [deepTaskId, showToast]);

  const handleSelectViewMode = (mode: 'GANTT' | 'KANBAN' | 'LIST' | 'EISENHOWER') => {
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
      if (filterPriority !== 'ALL') params.append('priority', filterPriority);
      if (filterProjectId !== 'ALL') params.append('projectId', filterProjectId);
      if (search.trim()) params.append('search', search.trim());

      const res = await api.get<ApiResponse<any[]>>(`/tasks?${params.toString()}`);
      setTasks(res.data || []);
    } catch {
      showToast('Không thể tải danh sách công việc', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedSubjectId, filterPriority, filterProjectId, search, showToast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, selectedSemesterId]);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa công việc "${title}" không?`)) return;

    try {
      await api.delete(`/tasks/${id}`);
      showToast(`Đã xóa công việc "${title}"`, 'success');
      fetchTasks();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa công việc', 'error');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: TaskStatus) => {
    const nextStatus = currentStatus === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;
    try {
      await api.patch(`/tasks/${id}/status`, { status: nextStatus });
      if (nextStatus === TaskStatus.DONE) {
        showToast('🎉 Tuyệt vời! Bạn đã hoàn thành công việc!', 'success');
      } else {
        showToast('Đã chuyển công việc về danh sách Cần làm', 'info');
      }
      fetchTasks();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi cập nhật trạng thái', 'error');
    }
  };

  const handleMoveStatus = async (id: string, newStatus: TaskStatus) => {
    try {
      await api.patch(`/tasks/${id}/status`, { status: newStatus });
      if (newStatus === TaskStatus.DONE) {
        showToast('🎉 Tuyệt vời! Đã hoàn tất bài tập!', 'success');
      } else if (newStatus === TaskStatus.IN_PROGRESS) {
        showToast('⚡ Đang thực hiện công việc...', 'info');
      } else {
        showToast('Đã cập nhật trạng thái công việc', 'info');
      }
      fetchTasks();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi chuyển trạng thái', 'error');
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

  const todoTasks = tasks.filter((t) => t.status === TaskStatus.TODO);
  const inProgressTasks = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS);
  const doneTasks = tasks.filter((t) => t.status === TaskStatus.DONE);

  // Count overdue tasks
  const overdueCount = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return tasks.filter((t) => {
      if (t.status === TaskStatus.DONE || !t.dueDate) return false;
      const dueDay = new Date(new Date(t.dueDate).getFullYear(), new Date(t.dueDate).getMonth(), new Date(t.dueDate).getDate()).getTime();
      return dueDay < today;
    }).length;
  }, [tasks]);

  const totalTasks = tasks.length;
  const completedPercent = totalTasks > 0 ? Math.round((doneTasks.length / totalTasks) * 100) : 0;
  const currentSubjectObj = subjects.find((s) => s.id === selectedSubjectId);

  const columns = [
    {
      id: 'todo',
      title: 'Cần Làm',
      count: todoTasks.length,
      items: todoTasks,
      icon: ListTodo,
      accentColor: 'var(--color-info)',
      badgeClass: 'badge-blue'
    },
    {
      id: 'in_progress',
      title: 'Đang Thực Hiện',
      count: inProgressTasks.length,
      items: inProgressTasks,
      icon: Zap,
      accentColor: 'var(--color-warning)',
      badgeClass: 'badge-amber'
    },
    {
      id: 'done',
      title: 'Đã Hoàn Thành',
      count: doneTasks.length,
      items: doneTasks,
      icon: CheckCircle2,
      accentColor: 'var(--color-success)',
      badgeClass: 'badge-green'
    }
  ];

  return (
    <div style={{ maxWidth: '1380px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Unified Minimal Toolbar (Height: 38px, High Density, Zero Waste) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '2px 0'
        }}
      >
        {/* Left: View Mode Segmented Controls & Task Counts */}
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
            <button
              onClick={() => handleSelectViewMode('GANTT')}
              className={`btn btn-sm ${viewMode === 'GANTT' ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                backgroundColor: viewMode === 'GANTT' ? 'var(--accent)' : 'transparent',
                color: viewMode === 'GANTT' ? '#ffffff' : 'var(--text-secondary)'
              }}
              title="Sơ đồ Gantt tiến độ (7 Tuần)"
            >
              <TrendingUp size={15} />
            </button>

            <button
              onClick={() => handleSelectViewMode('KANBAN')}
              className={`btn btn-sm ${viewMode === 'KANBAN' ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                backgroundColor: viewMode === 'KANBAN' ? 'var(--accent)' : 'transparent',
                color: viewMode === 'KANBAN' ? '#ffffff' : 'var(--text-secondary)'
              }}
              title="Bảng Kanban"
            >
              <Columns3 size={15} />
            </button>

            <button
              onClick={() => handleSelectViewMode('LIST')}
              className={`btn btn-sm ${viewMode === 'LIST' ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                backgroundColor: viewMode === 'LIST' ? 'var(--accent)' : 'transparent',
                color: viewMode === 'LIST' ? '#ffffff' : 'var(--text-secondary)'
              }}
              title="Danh sách nhiệm vụ & Hạn chót"
            >
              <ListFilter size={15} />
            </button>

            <button
              onClick={() => handleSelectViewMode('EISENHOWER')}
              className={`btn btn-sm ${viewMode === 'EISENHOWER' ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                backgroundColor: viewMode === 'EISENHOWER' ? 'var(--accent)' : 'transparent',
                color: viewMode === 'EISENHOWER' ? '#ffffff' : 'var(--text-secondary)'
              }}
              title="Ma trận Eisenhower (2x2)"
            >
              <LayoutGrid size={15} />
            </button>
          </div>

          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {totalTasks} công việc
          </span>

          {overdueCount > 0 && (
            <span
              className="badge"
              style={{
                fontSize: '11px',
                padding: '2px 7px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontWeight: 700
              }}
            >
              {overdueCount} quá hạn
            </span>
          )}

          <span className="badge badge-green" style={{ fontSize: '11px', padding: '2px 7px', fontWeight: 600 }}>
            {doneTasks.length}/{totalTasks} xong
          </span>
        </div>

        {/* Right: Quick Search, Filter Popover, Add Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Quick Search */}
          <div style={{ position: 'relative', width: '200px' }}>
            <span style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
              <Search size={13} />
            </span>
            <input
              type="text"
              placeholder="Tìm việc..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="snote-input"
              style={{ paddingLeft: '28px', paddingRight: search ? '26px' : '8px', height: '32px', fontSize: '12px', borderRadius: '6px' }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filter Popover Button */}
          <div ref={filterRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`btn btn-sm ${isFilterOpen || filterPriority !== 'ALL' || filterProjectId !== 'ALL' ? 'btn-secondary' : 'btn-ghost'}`}
              style={{
                height: '32px',
                fontSize: '12px',
                padding: '0 10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                border: '1px solid var(--border-color)',
                borderRadius: '6px'
              }}
              title="Bộ lọc dự án & mức ưu tiên"
            >
              <Filter size={13} />
              <span>Lọc</span>
              {(filterPriority !== 'ALL' || filterProjectId !== 'ALL') && (
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent)' }} />
              )}
            </button>

            {isFilterOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 6px)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '12px',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 50,
                  minWidth: '240px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Dự án / Môn học
                  </label>
                  <select
                    value={filterProjectId}
                    onChange={(e) => setFilterProjectId(e.target.value)}
                    className="snote-select"
                    style={{ fontSize: '12px', width: '100%' }}
                  >
                    <option value="ALL">Tất cả dự án</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        📁 {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Mức độ ưu tiên
                  </label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="snote-select"
                    style={{ fontSize: '12px', width: '100%' }}
                  >
                    <option value="ALL">Tất cả mức độ</option>
                    <option value={TaskPriority.URGENT}>🔴 Khẩn cấp (Urgent)</option>
                    <option value={TaskPriority.HIGH}>🟠 Cao (High)</option>
                    <option value={TaskPriority.MEDIUM}>🟡 Trung bình (Medium)</option>
                    <option value={TaskPriority.LOW}>🟢 Thấp (Low)</option>
                  </select>
                </div>

                {(filterPriority !== 'ALL' || filterProjectId !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterPriority('ALL');
                      setFilterProjectId('ALL');
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '11px', padding: '4px', color: 'var(--color-danger)' }}
                  >
                    Đặt lại bộ lọc
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick Capture Inline Toggle */}
          <button
            type="button"
            onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
            className="btn btn-sm btn-ghost"
            style={{
              height: '32px',
              fontSize: '12px',
              padding: '0 10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: isQuickAddOpen ? 'var(--accent)' : 'var(--text-secondary)'
            }}
            title="Thêm nhanh công việc"
          >
            <Zap size={13} />
            <span>Thêm nhanh</span>
          </button>

          {/* New Task Button */}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="btn btn-sm btn-primary"
            style={{
              height: '32px',
              fontSize: '12px',
              padding: '0 12px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              borderRadius: '6px'
            }}
          >
            <Plus size={14} />
            <span>Tạo mới</span>
          </button>
        </div>
      </div>

      {/* Collapsible Quick Add Box (Takes 0 space when collapsed) */}
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

      {/* 4. Main Tasks Area: Conditional Rendering based on ViewMode */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <Sparkles size={18} className="pulse-urgent" style={{ color: 'var(--accent-primary)' }} />
            <span>Đang đồng bộ danh sách công việc...</span>
          </div>
        </div>
      ) : viewMode === 'GANTT' ? (
        <TasksGanttView
          tasks={tasks}
          onSelectTask={handleOpenEdit}
          onToggleStatus={handleToggleStatus}
        />
      ) : viewMode === 'LIST' ? (
        <TasksListView
          tasks={tasks}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
          onMoveStatus={handleMoveStatus}
        />
      ) : viewMode === 'EISENHOWER' ? (
        <TasksEisenhowerView
          tasks={tasks}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
          onMoveStatus={handleMoveStatus}
          onOpenCreate={handleOpenCreate}
        />
      ) : (
        /* Kanban Board Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', alignItems: 'start' }}>
          {columns.map((col) => {
            const Icon = col.icon;
            return (
              <div
                key={col.id}
                className="snote-card"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '16px',
                  borderRadius: 'var(--radius-xl)',
                  minHeight: '440px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Column Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: col.accentColor, display: 'flex' }}>
                      <Icon size={18} />
                    </span>
                    <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {col.title}
                    </h3>
                  </div>
                  <span className={`badge ${col.badgeClass}`} style={{ fontSize: '12px', fontWeight: 700 }}>
                    {col.count}
                  </span>
                </div>

                {/* Column Task Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  {col.items.length === 0 ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '40px 16px',
                        color: 'var(--text-muted)',
                        fontSize: '13px',
                        border: '1px dashed var(--border-subtle)',
                        borderRadius: 'var(--radius-lg)',
                        marginTop: '10px'
                      }}
                    >
                      Không có công việc nào trong mục này
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

      {/* Modal Form */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTaskToEdit(null);
          if (searchParams.has('taskId')) {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('taskId');
            setSearchParams(nextParams, { replace: true });
          }
        }}
        onSuccess={fetchTasks}
        taskToEdit={taskToEdit}
      />
    </div>
  );
};

