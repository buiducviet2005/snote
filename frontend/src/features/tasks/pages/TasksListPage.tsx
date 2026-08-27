import React, { useState, useEffect, useCallback } from 'react';
import { api, ApiResponse } from '../../../services/api';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useToast } from '../../../contexts/ToastContext';
import { TaskCard } from '../components/TaskCard';
import { TaskModal } from '../components/TaskModal';
import { TaskStatus, TaskPriority } from '@snote/shared';

export const TasksListPage: React.FC = () => {
  const { selectedSubjectId, selectedSemesterId } = useAppFilter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<any | null>(null);
  const { showToast } = useToast();

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSubjectId) params.append('subjectId', selectedSubjectId);
      if (filterPriority !== 'ALL') params.append('priority', filterPriority);
      if (search.trim()) params.append('search', search.trim());

      const res = await api.get<ApiResponse<any[]>>(`/tasks?${params.toString()}`);
      setTasks(res.data || []);
    } catch {
      showToast('Không thể tải danh sách công việc', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedSubjectId, filterPriority, search, showToast]);

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
      showToast(nextStatus === TaskStatus.DONE ? '🎉 Đã hoàn thành công việc!' : 'Đã chuyển về Cần làm', 'success');
      fetchTasks();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi cập nhật trạng thái', 'error');
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

  const columns = [
    { id: 'todo', title: '📋 Cần Làm (TODO)', count: todoTasks.length, items: todoTasks, bg: 'rgba(59, 130, 246, 0.08)' },
    { id: 'in_progress', title: '⚡ Đang Làm (IN PROGRESS)', count: inProgressTasks.length, items: inProgressTasks, bg: 'rgba(234, 179, 8, 0.08)' },
    { id: 'done', title: '✅ Đã Xong (DONE)', count: doneTasks.length, items: doneTasks, bg: 'rgba(16, 185, 129, 0.08)' }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
            ✅ Bảng Công Việc & Bài Tập (Kanban)
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
            Theo dõi tiến độ nộp bài, phân loại mức độ ưu tiên theo môn học
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          style={{
            padding: '11px 20px',
            borderRadius: '8px',
            border: 'none',
            background: 'var(--accent-primary)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(59,130,246,0.3)'
          }}
        >
          + Thêm Công Việc Mới
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            placeholder="🔍 Tìm kiếm bài tập hoặc công việc..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="ALL">Tất cả mức ưu tiên</option>
          <option value={TaskPriority.URGENT}>🔴 Khẩn cấp (Urgent)</option>
          <option value={TaskPriority.HIGH}>🟠 Cao (High)</option>
          <option value={TaskPriority.MEDIUM}>🟡 Trung bình (Medium)</option>
          <option value={TaskPriority.LOW}>🟢 Thấp (Low)</option>
        </select>
      </div>

      {/* Kanban Board Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          Đang tải danh sách công việc...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', alignItems: 'start' }}>
          {columns.map((col) => (
            <div
              key={col.id}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '16px',
                minHeight: '400px'
              }}
            >
              {/* Column Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid var(--border-color)'
                }}
              >
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {col.title}
                </h3>
                <span
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: 'var(--text-secondary)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 700
                  }}
                >
                  {col.count}
                </span>
              </div>

              {/* Column Tasks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {col.items.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    Không có việc nào
                  </div>
                ) : (
                  col.items.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={handleOpenEdit}
                      onDelete={handleDelete}
                      onToggleStatus={handleToggleStatus}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTasks}
        taskToEdit={taskToEdit}
      />
    </div>
  );
};
