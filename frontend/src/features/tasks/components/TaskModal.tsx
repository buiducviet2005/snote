import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { api } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { TaskStatus, TaskPriority } from '@snote/shared';

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
      showToast('Công việc bắt buộc phải gắn với một Môn học (Anti-Junk constraint)', 'error');
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
      title={taskToEdit ? 'Chỉnh Sửa Công Việc' : 'Tạo Công Việc Sinh Viên Mới'}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Tên công việc / Bài tập *
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: Hoàn thành bài tập tuần 3 về Indexing"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Môn học liên quan *
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
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
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Mức độ ưu tiên
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
            >
              <option value={TaskPriority.LOW}>🟢 Thấp (Low)</option>
              <option value={TaskPriority.MEDIUM}>🟡 Trung bình (Medium)</option>
              <option value={TaskPriority.HIGH}>🟠 Cao (High)</option>
              <option value={TaskPriority.URGENT}>🔴 Khẩn cấp (Urgent)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Hạn nộp (Deadline)
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Trạng thái
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
            >
              <option value={TaskStatus.TODO}>📋 Cần làm (TODO)</option>
              <option value={TaskStatus.IN_PROGRESS}>⚡ Đang làm (IN_PROGRESS)</option>
              <option value={TaskStatus.DONE}>✅ Đã xong (DONE)</option>
              <option value={TaskStatus.CANCELLED}>🚫 Đã hủy (CANCELLED)</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Mô tả chi tiết / Hướng dẫn
          </label>
          <textarea
            rows={3}
            placeholder="Ghi chú thêm về yêu cầu đề bài hoặc checklist phụ..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Thẻ tags (Phân cách bằng dấu phẩy)
          </label>
          <input
            type="text"
            placeholder="Assignment, Lab1, Deadline"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--accent-primary)', color: '#fff', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Đang lưu...' : taskToEdit ? 'Lưu Thay Đổi' : 'Tạo Công Việc'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
