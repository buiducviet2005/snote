import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { api } from '../../../services/api';
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
  FileText
} from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  taskToEdit?: any | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  taskToEdit
}) => {
  const { subjects, selectedSubjectId } = useAppFilter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setSubjectId(taskToEdit.subjectId || '');
      setStatus(taskToEdit.status || TaskStatus.TODO);
      setPriority(taskToEdit.priority || TaskPriority.MEDIUM);
      setDueDate(taskToEdit.dueDate ? new Date(taskToEdit.dueDate).toISOString().slice(0, 16) : '');
      setTagsInput((taskToEdit.tags || []).map((t: any) => t.name).join(', '));
    } else {
      setTitle('');
      setDescription('');
      setSubjectId(selectedSubjectId || (subjects[0]?.id || ''));
      setStatus(TaskStatus.TODO);
      setPriority(TaskPriority.MEDIUM);
      setDueDate('');
      setTagsInput('');
    }
  }, [taskToEdit, selectedSubjectId, subjects, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) {
      showToast('Công việc bắt buộc phải gắn với một Môn học (Ràng buộc chống rác)', 'error');
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
          subjectId,
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
          subjectId,
          status,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          tagNames
        });
        showToast('Tạo công việc bài tập mới thành công!', 'success');
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
      title={taskToEdit ? 'Chỉnh Sửa Công Việc' : 'Giao Việc / Bài Tập Mới'}
      maxWidth="620px"
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

        {/* Subject & Priority */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Môn học liên quan * (Anti-Junk)
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              required
              className="snote-select"
            >
              <option value="">-- Chọn môn học --</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code ? `[${sub.code}] ` : ''}{sub.name}
                </option>
              ))}
            </select>
          </div>

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
        </div>

        {/* Due date & Initial status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Hạn chót nộp bài (Deadline)
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="snote-input"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Trạng thái ban đầu
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="snote-select"
            >
              <option value={TaskStatus.TODO}>📋 Cần làm (TODO)</option>
              <option value={TaskStatus.IN_PROGRESS}>⚡ Đang làm (IN_PROGRESS)</option>
              <option value={TaskStatus.DONE}>✅ Đã hoàn thành (DONE)</option>
              <option value={TaskStatus.CANCELLED}>🚫 Đã hủy (CANCELLED)</option>
            </select>
          </div>
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
            Thẻ tags phân loại
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
            <span>{loading ? 'Đang lưu...' : taskToEdit ? 'Lưu Thay Đổi' : 'Giao Việc Mới'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
