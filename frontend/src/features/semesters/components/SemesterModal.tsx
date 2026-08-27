import React, { useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { api } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAppFilter } from '../../../contexts/AppFilterContext';

interface SemesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SemesterModal: React.FC<SemesterModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [isCurrent, setIsCurrent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const { refreshFilterData } = useAppFilter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/semesters', {
        name: name.trim(),
        academicYear: academicYear.trim(),
        isCurrent
      });

      showToast('Tạo học kỳ mới thành công!', 'success');
      setName('');
      await refreshFilterData();
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tạo học kỳ', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm Học Kỳ Mới">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Tên học kỳ *
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: Học kỳ 1 (2025 - 2026)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Năm học *
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: 2025-2026"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            id="isCurrent"
            checked={isCurrent}
            onChange={(e) => setIsCurrent(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label htmlFor="isCurrent" style={{ fontSize: '14px', cursor: 'pointer', color: 'var(--text-primary)' }}>
            Đặt làm học kỳ hiện tại (Active)
          </label>
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
            {loading ? 'Đang lưu...' : 'Tạo học kỳ'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
