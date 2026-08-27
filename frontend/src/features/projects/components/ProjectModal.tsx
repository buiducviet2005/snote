import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { api } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { ProjectStatus } from '@snote/shared';

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
      title={projectToEdit ? 'Chỉnh Sửa Đồ Án' : 'Thêm Đồ Án / Dự Án Môn Học Mới'}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Tên đồ án / Dự án *
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: Đồ án Xây dựng Ứng dụng SNOTE"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Môn học liên quan
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
            >
              <option value="">-- Dự án độc lập --</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code ? `[${sub.code}] ` : ''}{sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Trạng thái
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
            >
              <option value={ProjectStatus.PLANNED}>📋 Lên kế hoạch (PLANNED)</option>
              <option value={ProjectStatus.ACTIVE}>⚡ Đang triển khai (ACTIVE)</option>
              <option value={ProjectStatus.ON_HOLD}>⏸️ Tạm hoãn (ON_HOLD)</option>
              <option value={ProjectStatus.COMPLETED}>✅ Đã hoàn thành (COMPLETED)</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Hạn báo cáo / Deadline
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Mô tả mục tiêu đồ án
          </label>
          <textarea
            rows={3}
            placeholder="Mô tả công nghệ sử dụng, phân công nhiệm vụ hoặc tài liệu đề tài..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
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
            {loading ? 'Đang lưu...' : projectToEdit ? 'Lưu Thay Đổi' : 'Tạo Đồ Án'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
