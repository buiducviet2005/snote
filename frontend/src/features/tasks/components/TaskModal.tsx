import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { api, ApiResponse } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { TaskStatus, TaskPriority } from '@snote/shared';
import {
  CheckSquare,
  Calendar,
  Layers,
  Flame,
  Tag,
  Save,
  Clock,
  FileText,
  FolderKanban
} from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  taskToEdit?: any | null;
  defaultProjectId?: string;
  defaultSubjectId?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  taskToEdit,
  defaultProjectId,
  defaultSubjectId
}) => {
  const { subjects, selectedSubjectId } = useAppFilter();
  const [projects, setProjects] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Fetch available projects to link
      api.get<ApiResponse<any[]>>('/projects')
        .then((res) => setProjects(res.data || []))
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setSubjectId(taskToEdit.subjectId || '');
      setProjectId(taskToEdit.projectId || '');
      setStatus(taskToEdit.status || TaskStatus.TODO);
      setPriority(taskToEdit.priority || TaskPriority.MEDIUM);
      setDueDate(taskToEdit.dueDate ? new Date(taskToEdit.dueDate).toISOString().slice(0, 16) : '');
      setTagsInput((taskToEdit.tags || []).map((t: any) => t.name).join(', '));
    } else {
      setTitle('');
      setDescription('');
      setSubjectId(defaultSubjectId || selectedSubjectId || (subjects[0]?.id || ''));
      setProjectId(defaultProjectId || '');
      setStatus(TaskStatus.TODO);
      setPriority(TaskPriority.MEDIUM);
      setDueDate('');
      setTagsInput('');
    }
  }, [taskToEdit, selectedSubjectId, subjects, isOpen, defaultProjectId, defaultSubjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId && !projectId) {
      showToast('Công việc phải gắn với một Môn học hoặc một Đồ án', 'error');
      return;
    }

    const tagNames = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      if (taskToEdit) {
        await api.put(`/tasks/${taskToEdit.id}`, {
          title: title.trim(),
          description: description.trim() || undefined,
          subjectId: subjectId || undefined,
          projectId: projectId || undefined,
          status,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          tagNames
        });
        showToast('Cập nhật công việc thành công!', 'success');
      } else {
        await api.post('/tasks', {
          title: title.trim(),
          description: description.trim() || undefined,
          subjectId: subjectId || undefined,
          projectId: projectId || undefined,
          status,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          tagNames
        });
        showToast('Tạo công việc mới thành công!', 'success');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu công việc', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? 'Chỉnh Sửa Công Việc' : 'Giao Việc / Nhiệm Vụ Mới'}
      maxWidth="640px"
      icon={<CheckSquare size={20} />}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Title */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Tên công việc / Bài tập cần làm *
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: Hoàn thành bài tập tuần 3 về ACID Database & Migrations"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="snote-input"
            style={{ fontSize: '14.5px', fontWeight: 600 }}
          />
        </div>

        {/* Subject & Project Linkage */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Môn học liên quan
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="snote-select"
            >
              <option value="">-- Không chọn môn học --</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code ? `[${sub.code}] ` : ''}{sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              <FolderKanban size={13} style={{ color: 'var(--color-purple)' }} />
              <span>Đồ án / Dự án nhóm liên kết</span>
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="snote-select"
            >
              <option value="">-- Không gắn đồ án (Việc cá nhân) --</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  📁 {proj.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Priority & Due date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Mức độ ưu tiên
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="snote-select"
            >
              <option value={TaskPriority.LOW}>🟢 Thấp (Low)</option>
              <option value={TaskPriority.MEDIUM}>🟡 Trung bình (Medium)</option>
              <option value={TaskPriority.HIGH}>🟠 Cao (High)</option>
              <option value={TaskPriority.URGENT}>🔴 Khẩn cấp (Urgent)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Hạn chót hoàn thành (Deadline)
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="snote-input"
            />
          </div>
        </div>

        {/* Initial status */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Trạng thái thực hiện
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="snote-select"
          >
            <option value={TaskStatus.TODO}>📋 Cần làm (TODO)</option>
            <option value={TaskStatus.IN_PROGRESS}>⚡ Đang thực hiện (IN_PROGRESS)</option>
            <option value={TaskStatus.DONE}>✅ Đã hoàn thành (DONE)</option>
            <option value={TaskStatus.CANCELLED}>🚫 Đã hủy (CANCELLED)</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Mô tả chi tiết / Ghi chú yêu cầu
          </label>
          <textarea
            rows={3}
            placeholder="Mô tả tóm tắt nội dung bài tập, tiêu chí chấm hoặc ghi chú..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="snote-textarea"
          />
        </div>

        {/* Tags */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Thẻ tags phân loại (Phân cách bằng dấu phẩy)
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
              <Tag size={15} />
            </span>
            <input
              type="text"
              placeholder="Assignment, Lab1, Deadline, GroupWork"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="snote-input"
              style={{ paddingLeft: '36px' }}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            <Save size={15} />
            <span>{loading ? 'Đang lưu...' : taskToEdit ? 'Lưu Thay Đổi' : 'Tạo Nhiệm Vụ'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
