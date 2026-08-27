import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { api } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { ProjectStatus } from '@snote/shared';
import { FolderKanban, Calendar, BookOpen, Save } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectToEdit?: any | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projectToEdit
}) => {
  const { subjects, selectedSemesterId } = useAppFilter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [status, setStatus] = useState<ProjectStatus>(ProjectStatus.ACTIVE);
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name || '');
      setDescription(projectToEdit.description || '');
      setSubjectId(projectToEdit.subjectId || '');
      setStatus(projectToEdit.status || ProjectStatus.ACTIVE);
      setDueDate(projectToEdit.dueDate ? new Date(projectToEdit.dueDate).toISOString().slice(0, 10) : '');
    } else {
      setName('');
      setDescription('');
      setSubjectId(subjects[0]?.id || '');
      setStatus(ProjectStatus.ACTIVE);
      setDueDate('');
    }
  }, [projectToEdit, subjects, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (projectToEdit) {
        await api.put(`/projects/${projectToEdit.id}`, {
          name: name.trim(),
          description: description.trim() || undefined,
          semesterId: selectedSemesterId || undefined,
          subjectId: subjectId || undefined,
          status,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined
        });
        showToast('Cập nhật đồ án thành công!', 'success');
      } else {
        await api.post('/projects', {
          name: name.trim(),
          description: description.trim() || undefined,
          semesterId: selectedSemesterId || undefined,
          subjectId: subjectId || undefined,
          status,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined
        });
        showToast('Tạo đồ án mới thành công!', 'success');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu đồ án', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={projectToEdit ? 'Chỉnh Sửa Đồ Án' : 'Thêm Đồ Án Mới'}
      maxWidth="620px"
      icon={<FolderKanban size={20} />}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Tên đề tài / Đồ án môn học *
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: Đồ án Xây dựng Ứng dụng SNOTE với Modular Monolith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="snote-input"
            style={{ fontSize: '14.5px', fontWeight: 600 }}
          />
        </div>

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
              <option value="">-- Dự án nghiên cứu độc lập --</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code ? `[${sub.code}] ` : ''}{sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Trạng thái dự án
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="snote-select"
            >
              <option value={ProjectStatus.PLANNED}>📋 Lên kế hoạch (PLANNED)</option>
              <option value={ProjectStatus.ACTIVE}>⚡ Đang triển khai (ACTIVE)</option>
              <option value={ProjectStatus.ON_HOLD}>⏸️ Tạm hoãn (ON_HOLD)</option>
              <option value={ProjectStatus.COMPLETED}>✅ Đã hoàn thành (COMPLETED)</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Hạn báo cáo / Nghiệm thu
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="snote-input"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Mô tả mục tiêu đề tài
          </label>
          <textarea
            rows={3}
            placeholder="Mô tả công nghệ sử dụng, phân công nhiệm vụ hoặc tài liệu đề tài..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="snote-textarea"
          />
        </div>

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
            <span>{loading ? 'Đang lưu...' : projectToEdit ? 'Lưu Thay Đổi' : 'Tạo Đồ Án'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
