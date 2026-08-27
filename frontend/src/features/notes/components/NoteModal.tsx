import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { api } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { NoteType } from '@snote/shared';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  noteToEdit?: any | null;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  noteToEdit
}) => {
  const { subjects, selectedSubjectId } = useAppFilter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [noteType, setNoteType] = useState<NoteType>(NoteType.LECTURE);
  const [tagsInput, setTagsInput] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title || '');
      setContent(noteToEdit.content || '');
      setSubjectId(noteToEdit.subjectId || '');
      setNoteType(noteToEdit.noteType || NoteType.LECTURE);
      setTagsInput((noteToEdit.tags || []).map((t: any) => t.name).join(', '));
    } else {
      setTitle('');
      setContent('');
      setSubjectId(selectedSubjectId || (subjects[0]?.id || ''));
      setNoteType(NoteType.LECTURE);
      setTagsInput('');
    }
    setIsPreview(false);
  }, [noteToEdit, selectedSubjectId, subjects, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) {
      showToast('Ghi chú bắt buộc phải gắn với một Môn học (Ràng buộc chống rác)', 'error');
      return;
    }

    const tagNames = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      if (noteToEdit) {
        await api.put(`/notes/${noteToEdit.id}`, {
          title: title.trim(),
          content,
          subjectId,
          noteType,
          tagNames
        });
        showToast('Cập nhật ghi chú thành công!', 'success');
      } else {
        await api.post('/notes', {
          title: title.trim(),
          content,
          subjectId,
          noteType,
          tagNames
        });
        showToast('Tạo ghi chú mới thành công!', 'success');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu ghi chú', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={noteToEdit ? 'Chỉnh Sửa Ghi Chú' : 'Tạo Ghi Chú Bài Giảng Mới'}
      maxWidth="720px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Tiêu đề ghi chú *
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: Kiến trúc Modular Monolith & ACID Boundaries"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '15px', fontWeight: 600, boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Môn học liên quan * (Anti-Junk)
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
              Loại nội dung
            </label>
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value as NoteType)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
            >
              <option value={NoteType.LECTURE}>📖 Bài giảng (Lecture)</option>
              <option value={NoteType.LAB_REPORT}>🧪 Báo cáo thực hành (Lab)</option>
              <option value={NoteType.EXAM_PREP}>🎯 Ôn thi / Đề cương (Exam Prep)</option>
              <option value={NoteType.PROJECT_LOG}>🛠️ Nhật ký đồ án (Project Log)</option>
              <option value={NoteType.MEETING_MINUTES}>👥 Biên bản họp nhóm (Meeting)</option>
              <option value={NoteType.GENERAL}>📝 Ghi chú chung (General)</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Thẻ tags (Phân cách bằng dấu phẩy)
          </label>
          <input
            type="text"
            placeholder="Architecture, Database, CleanCode"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Nội dung bài học (Markdown hỗ trợ)
            </label>
            <button
              type="button"
              onClick={() => setIsPreview(!isPreview)}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '4px 10px',
                color: 'var(--accent-primary)',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {isPreview ? '✏️ Chế độ Viết' : '👁️ Xem Preview'}
            </button>
          </div>

          {isPreview ? (
            <div
              style={{
                minHeight: '220px',
                maxHeight: '340px',
                overflowY: 'auto',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}
            >
              {content || <i>(Nội dung trống)</i>}
            </div>
          ) : (
            <textarea
              rows={8}
              placeholder="Nhập nội dung bài giảng, công thức hoặc ghi chú ở đây..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.6', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }}
            />
          )}
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
            {loading ? 'Đang lưu...' : noteToEdit ? 'Lưu Thay Đổi' : 'Tạo Ghi Chú'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
