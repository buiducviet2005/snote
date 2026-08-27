import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../../../components/common/Modal';
import { MarkdownViewer } from '../../../components/common/MarkdownViewer';
import { api, ApiResponse } from '../../../services/api';
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
  Eye,
  Edit3,
  Sparkles,
  Save,
  Tag,
  Columns,
  Clock,
  Calendar,
  FolderKanban
} from 'lucide-react';

export type NoteModalMode = 'WRITE' | 'PREVIEW' | 'SPLIT';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  noteToEdit?: any | null;
  initialMode?: NoteModalMode;
  defaultProjectId?: string;
  defaultSubjectId?: string;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  noteToEdit,
  initialMode,
  defaultProjectId,
  defaultSubjectId
}) => {
  const { subjects, selectedSubjectId } = useAppFilter();
  const [projects, setProjects] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [noteType, setNoteType] = useState<NoteType>(NoteType.GENERAL);
  const [tagsInput, setTagsInput] = useState('');
  const [mode, setMode] = useState<NoteModalMode>('PREVIEW');
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      api.get<ApiResponse<any[]>>('/projects')
        .then((res) => setProjects(res.data || []))
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title || '');
      setContent(noteToEdit.content || '');
      setSubjectId(noteToEdit.subjectId || '');
      setProjectId(noteToEdit.projectId || '');
      setNoteType(noteToEdit.noteType || NoteType.GENERAL);
      setTagsInput((noteToEdit.tags || []).map((t: any) => t.name).join(', '));
      // Mở ghi chú đã có: Mặc định vào chế độ PREVIEW
      setMode(initialMode || 'PREVIEW');
    } else {
      setTitle('');
      setContent('');
      setSubjectId(defaultSubjectId || selectedSubjectId || '');
      setProjectId(defaultProjectId || '');
      setNoteType(defaultProjectId ? NoteType.PROJECT_LOG : (selectedSubjectId ? NoteType.LECTURE : NoteType.GENERAL));
      setTagsInput('');
      // Tạo ghi chú mới: Mặc định vào chế độ WRITE
      setMode(initialMode || 'WRITE');
    }
  }, [noteToEdit, selectedSubjectId, subjects, isOpen, initialMode, defaultProjectId, defaultSubjectId]);

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
          subjectId: subjectId || null,
          projectId: projectId || null,
          noteType,
          tagNames
        });
        showToast('Cập nhật ghi chú thành công!', 'success');
      } else {
        await api.post('/notes', {
          title: title.trim(),
          content,
          subjectId: subjectId || undefined,
          projectId: projectId || undefined,
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

  const words = (content || '').trim().split(/\s+/).filter(Boolean).length;
  const readTimeMin = Math.max(1, Math.ceil(words / 200));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        noteToEdit
          ? mode === 'PREVIEW'
            ? 'Xem Chi Tiết Bài Ghi (Preview)'
            : 'Chỉnh Sửa Ghi Chú'
          : 'Soạn Thảo Ghi Chú Mới'
      }
      maxWidth={mode === 'SPLIT' ? '1200px' : '900px'}
      icon={<BookOpen size={20} />}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Title Input */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Tiêu đề ghi chú *
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: Ý tưởng nghiên cứu Modular Monolith hoặc Ghi chép cá nhân..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="snote-input"
            style={{ fontSize: '15px', fontWeight: 700 }}
          />
        </div>

        {/* Subject & Project Selectors (Flexible / Free note support) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Môn học liên quan (Tùy chọn)
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="snote-select"
            >
              <option value="">📝 Ghi chú tự do / Cá nhân (Không thuộc môn học)</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code ? `[${sub.code}] ` : ''}{sub.name} ({sub.credits} TC)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              <FolderKanban size={13} style={{ color: 'var(--color-purple)' }} />
              <span>Đồ án / Dự án liên kết (Tùy chọn)</span>
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="snote-select"
            >
              <option value="">-- Không gắn đồ án --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  📁 {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Note Type & Tags */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Phân loại ghi chú
            </label>
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value as NoteType)}
              className="snote-select"
            >
              <option value={NoteType.GENERAL}>📝 Ghi chú chung / Ý tưởng tự do (General)</option>
              <option value={NoteType.LECTURE}>📖 Bài giảng lý thuyết (Lecture)</option>
              <option value={NoteType.LAB_REPORT}>🧪 Báo cáo thực hành (Lab)</option>
              <option value={NoteType.EXAM_PREP}>🎯 Ôn thi / Đề cương (Exam Prep)</option>
              <option value={NoteType.PROJECT_LOG}>🛠️ Nhật ký đồ án (Project Log)</option>
              <option value={NoteType.MEETING_MINUTES}>👥 Biên bản họp nhóm (Meeting)</option>
            </select>
          </div>

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
                placeholder="Architecture, Ideas, Database, Research"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="snote-input"
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>
        </div>

        {/* Markdown Mode Switcher & Formatting Toolbar */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
              flexWrap: 'wrap',
              gap: '10px',
              backgroundColor: 'var(--bg-primary)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)'
            }}
          >
            {/* View Mode Segmented Control (WRITE / PREVIEW / SPLIT) */}
            <div style={{ display: 'flex', background: 'var(--bg-input)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => setMode('WRITE')}
                className={`btn btn-sm ${mode === 'WRITE' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '12px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                title="Chế độ soạn thảo toàn màn hình"
              >
                <Edit3 size={13} />
                <span>Viết (Write)</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('PREVIEW')}
                className={`btn btn-sm ${mode === 'PREVIEW' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '12px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                title="Chế độ xem trước Markdown đã render"
              >
                <Eye size={13} />
                <span>Xem trước (Preview)</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('SPLIT')}
                className={`btn btn-sm ${mode === 'SPLIT' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '12px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                title="Chế độ chia đôi: Vừa gõ vừa xem kết quả real-time"
              >
                <Columns size={13} />
                <span>Chia đôi (Split)</span>
              </button>
            </div>

            {/* Formatting Toolbar (Active in WRITE and SPLIT modes) */}
            {mode !== 'PREVIEW' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => insertMarkdown('**', '**', 'chữ in đậm')}
                  className="btn btn-secondary btn-sm btn-icon"
                  title="In đậm (Bold)"
                >
                  <Bold size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('*', '*', 'chữ in nghiêng')}
                  className="btn btn-secondary btn-sm btn-icon"
                  title="In nghiêng (Italic)"
                >
                  <Italic size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('## ', '', 'Tiêu đề mục')}
                  className="btn btn-secondary btn-sm btn-icon"
                  title="Tiêu đề H2"
                >
                  <Heading2 size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('- ', '', 'Mục danh sách')}
                  className="btn btn-secondary btn-sm btn-icon"
                  title="Danh sách gạch đầu dòng"
                >
                  <List size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('- [ ] ', '', 'Công việc cần làm')}
                  className="btn btn-secondary btn-sm btn-icon"
                  title="Danh sách Checkbox"
                >
                  <CheckSquare size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('```ts\n', '\n```', '// Mã nguồn')}
                  className="btn btn-secondary btn-sm btn-icon"
                  title="Khối mã nguồn (Code block)"
                >
                  <Code size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('> ', '', 'Trích dẫn quan trọng')}
                  className="btn btn-secondary btn-sm btn-icon"
                  title="Trích dẫn (Quote)"
                >
                  <Quote size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('| Tiêu đề 1 | Tiêu đề 2 |\n| --- | --- |\n| Giá trị 1 | Giá trị 2 |', '', '')}
                  className="btn btn-secondary btn-sm btn-icon"
                  title="Bảng biểu (Table)"
                >
                  <Table size={13} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> {readTimeMin} phút đọc
                </span>
                <span>•</span>
                <span>{words} từ</span>
              </div>
            )}
          </div>

          {/* Content Area Rendering according to Mode */}
          {mode === 'WRITE' && (
            <textarea
              ref={textareaRef}
              rows={12}
              placeholder="Nhập nội dung bài học, ý tưởng nghiên cứu, mã nguồn bằng cú pháp Markdown..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="snote-textarea"
              style={{
                lineHeight: '1.6',
                fontFamily: 'inherit',
                fontSize: '14px',
                resize: 'vertical',
                minHeight: '280px'
              }}
            />
          )}

          {mode === 'PREVIEW' && (
            <div
              className="snote-card"
              style={{
                minHeight: '280px',
                maxHeight: '440px',
                overflowY: 'auto',
                padding: '20px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)'
              }}
            >
              {content.trim() ? (
                <MarkdownViewer content={content} />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
                  <i>Chưa có nội dung ghi chú. Bấm vào <b>"Viết (Write)"</b> để bắt đầu soạn bài.</i>
                </div>
              )}
            </div>
          )}

          {mode === 'SPLIT' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  MÃ NGUỒN MARKDOWN:
                </div>
                <textarea
                  ref={textareaRef}
                  rows={14}
                  placeholder="Gõ mã Markdown tại đây..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="snote-textarea"
                  style={{
                    lineHeight: '1.6',
                    fontFamily: 'inherit',
                    fontSize: '13.5px',
                    minHeight: '320px',
                    maxHeight: '440px'
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={12} />
                  <span>KẾT QUẢ HIỂN THỊ REAL-TIME:</span>
                </div>
                <div
                  className="snote-card"
                  style={{
                    minHeight: '320px',
                    maxHeight: '440px',
                    overflowY: 'auto',
                    padding: '16px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {content.trim() ? (
                    <MarkdownViewer content={content} />
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                      <i>Kết quả render xem trước sẽ hiển thị trực tiếp tại đây khi bạn gõ...</i>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
          <div>
            {mode === 'PREVIEW' && (
              <button
                type="button"
                onClick={() => setMode('WRITE')}
                className="btn btn-secondary btn-sm"
                style={{ fontWeight: 600 }}
              >
                <Edit3 size={14} />
                <span>Chuyển Sang Chế Độ Sửa</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ fontWeight: 700 }}
            >
              <Save size={15} />
              <span>{loading ? 'Đang lưu trữ...' : noteToEdit ? 'Lưu Thay Đổi' : 'Tạo Ghi Chú'}</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
