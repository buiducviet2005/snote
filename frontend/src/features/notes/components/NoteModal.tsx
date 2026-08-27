import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../../../components/common/Modal';
import { MarkdownViewer } from '../../../components/common/MarkdownViewer';
import { api } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { NoteType } from '@snote/shared';
import {
  BookOpen,
  Bold,
  Italic,
  Heading2,
  List,
  CheckSquare,
  Code,
  Quote,
  Table,
  Link as LinkIcon,
  Eye,
  Edit3,
  Sparkles,
  Save,
  Tag
} from 'lucide-react';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  // Insert markdown helper at cursor position
  const insertMarkdown = (prefix: string, suffix: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || defaultText;
    const newContent = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);

    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  };

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
        showToast('Cập nhật ghi chú bài giảng thành công!', 'success');
      } else {
        await api.post('/notes', {
          title: title.trim(),
          content,
          subjectId,
          noteType,
          tagNames
        });
        showToast('Tạo ghi chú bài học mới thành công!', 'success');
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
      title={noteToEdit ? 'Chỉnh Sửa Ghi Chú' : 'Soạn Thảo Ghi Chú Mới'}
      maxWidth="780px"
      icon={<BookOpen size={20} />}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Title Input */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Tiêu đề ghi chú bài giảng *
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: Kiến trúc Modular Monolith & ACID Boundaries"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="snote-input"
            style={{ fontSize: '15px', fontWeight: 700 }}
          />
        </div>

        {/* Subject & Note Type Selectors */}
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
                  {sub.code ? `[${sub.code}] ` : ''}{sub.name} ({sub.credits} TC)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Phân loại bài giảng
            </label>
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value as NoteType)}
              className="snote-select"
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

        {/* Tags Input */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Thẻ phân loại tags (Phân cách bằng dấu phẩy)
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
              <Tag size={15} />
            </span>
            <input
              type="text"
              placeholder="Architecture, Database, TypeScript, Security"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="snote-input"
              style={{ paddingLeft: '36px' }}
            />
          </div>
        </div>

        {/* Markdown Editor Section */}
        <div>
          {/* Header & Formatting Toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
              flexWrap: 'wrap',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => insertMarkdown('**', '**', 'chữ in đậm')}
                className="btn btn-secondary btn-sm btn-icon"
                title="In đậm (Bold)"
              >
                <Bold size={14} />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('*', '*', 'chữ in nghiêng')}
                className="btn btn-secondary btn-sm btn-icon"
                title="In nghiêng (Italic)"
              >
                <Italic size={14} />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('## ', '', 'Tiêu đề mục')}
                className="btn btn-secondary btn-sm btn-icon"
                title="Tiêu đề H2"
              >
                <Heading2 size={14} />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('- ', '', 'Mục danh sách')}
                className="btn btn-secondary btn-sm btn-icon"
                title="Danh sách gạch đầu dòng"
              >
                <List size={14} />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('- [ ] ', '', 'Công việc cần làm')}
                className="btn btn-secondary btn-sm btn-icon"
                title="Danh sách Checkbox"
              >
                <CheckSquare size={14} />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('```ts\n', '\n```', '// Mã nguồn')}
                className="btn btn-secondary btn-sm btn-icon"
                title="Khối mã nguồn (Code block)"
              >
                <Code size={14} />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('> ', '', 'Trích dẫn quan trọng')}
                className="btn btn-secondary btn-sm btn-icon"
                title="Trích dẫn (Quote)"
              >
                <Quote size={14} />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown('| Tiêu đề 1 | Tiêu đề 2 |\n| --- | --- |\n| Giá trị 1 | Giá trị 2 |', '', '')}
                className="btn btn-secondary btn-sm btn-icon"
                title="Bảng biểu (Table)"
              >
                <Table size={14} />
              </button>
            </div>

            {/* Toggle Preview Button */}
            <button
              type="button"
              onClick={() => setIsPreview(!isPreview)}
              className="btn btn-secondary btn-sm"
              style={{
                color: isPreview ? 'var(--accent-primary)' : 'var(--text-secondary)',
                borderColor: isPreview ? 'var(--accent-primary)' : 'var(--border-color)'
              }}
            >
              {isPreview ? <Edit3 size={13} /> : <Eye size={13} />}
              <span>{isPreview ? 'Chế độ Viết' : 'Xem Preview'}</span>
            </button>
          </div>

          {/* Editor / Preview Container */}
          {isPreview ? (
            <div
              className="snote-card"
              style={{
                minHeight: '260px',
                maxHeight: '380px',
                overflowY: 'auto',
                padding: '16px',
                background: 'var(--bg-input)'
              }}
            >
              <MarkdownViewer content={content} />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              rows={10}
              placeholder="Nhập nội dung bài học, mã nguồn, công thức bằng cú pháp Markdown..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="snote-textarea"
              style={{
                lineHeight: '1.6',
                fontFamily: 'inherit',
                fontSize: '13.5px',
                resize: 'vertical'
              }}
            />
          )}
        </div>

        {/* Modal Actions */}
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
            <span>{loading ? 'Đang lưu trữ...' : noteToEdit ? 'Lưu Thay Đổi' : 'Tạo Ghi Chú'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
