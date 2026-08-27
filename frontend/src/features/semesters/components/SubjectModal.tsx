import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { api } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAppFilter } from '../../../contexts/AppFilterContext';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultSemesterId?: string | null;
}

export const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultSemesterId
}) => {
  const { semesters, refreshFilterData } = useAppFilter();
  const [semesterId, setSemesterId] = useState<string>('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [credits, setCredits] = useState<number>(3);
  const [lecturer, setLecturer] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (defaultSemesterId) {
      setSemesterId(defaultSemesterId);
    } else if (semesters.length > 0) {
      setSemesterId(semesters[0].id);
    }
  }, [defaultSemesterId, semesters, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!semesterId) {
      showToast('Vui lòng chọn học kỳ', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post('/subjects', {
        semesterId,
        name: name.trim(),
        code: code.trim() || undefined,
        credits: Number(credits),
        lecturer: lecturer.trim() || undefined,
        color
      });

      showToast('Tạo môn học mới thành công!', 'success');
      setName('');
      setCode('');
      setLecturer('');
      await refreshFilterData();
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tạo môn học', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm Môn Học Mới">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Học kỳ *
          </label>
          <select
            value={semesterId}
            onChange={(e) => setSemesterId(e.target.value)}
            required
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
          >
            {semesters.map((sem) => (
              <option key={sem.id} value={sem.id}>
                {sem.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Tên môn học *
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: Cơ sở dữ liệu nâng cao"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Mã môn học
            </label>
            <input
              type="text"
              placeholder="IT4020"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Số tín chỉ *
            </label>
            <input
              type="number"
              min="1"
              max="10"
              required
              value={credits}
              onChange={(e) => setCredits(parseInt(e.target.value, 10))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Giảng viên phụ trách
          </label>
          <input
            type="text"
            placeholder="TS. Nguyễn Văn B"
            value={lecturer}
            onChange={(e) => setLecturer(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Mã màu nhận diện
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ width: '42px', height: '38px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{color}</span>
          </div>
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
            {loading ? 'Đang lưu...' : 'Tạo môn học'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
