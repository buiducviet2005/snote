import React, { useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { api } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { Layers, Calendar, Save } from 'lucide-react';

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm Học Kỳ Mới"
      maxWidth="500px"
      icon={<Layers size={20} />}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Tên học kỳ *
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: Học kỳ 1 (2025 - 2026)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="snote-input"
            style={{ fontSize: '14.5px', fontWeight: 600 }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Năm học *
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: 2025-2026"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="snote-input"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}>
          <input
            type="checkbox"
            id="isCurrent"
            checked={isCurrent}
            onChange={(e) => setIsCurrent(e.target.checked)}
            style={{ width: '17px', height: '17px', cursor: 'pointer' }}
          />
          <label htmlFor="isCurrent" style={{ fontSize: '13.5px', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 500 }}>
            Đặt làm học kỳ hiện tại (Active Semester)
          </label>
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
            <span>{loading ? 'Đang lưu...' : 'Tạo Học Kỳ'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
