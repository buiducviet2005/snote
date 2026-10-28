import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Modal } from '../../../components/common/Modal';
import { MarkdownViewer } from '../../../components/common/MarkdownViewer';
import { ShareModal } from '../../../components/common/ShareModal';
import { api, ApiResponse } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { NoteType } from '@snote/shared';
import { autoFormatPlainTextToMarkdown, detectNoteType, extractNoteFeatures, toggleChecklistItem } from '../utils/smartNoteParser';
import { handleSmartListKeyDown } from '../utils/smartKeyboard';
import {
  BookOpen,
  List,
  CheckSquare,
  Edit3,
  Sparkles,
  Save,
  Tag,
  Link,
  Trash2,
  Share2,
  AlertCircle
} from 'lucide-react';

export type NoteModalMode = 'VIEW' | 'EDIT' | 'WRITE' | 'PREVIEW' | 'SPLIT';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  noteToEdit?: any | null;
  initialMode?: NoteModalMode;
  defaultProjectId?: string | null;
  defaultSubjectId?: string | null;
  onConvertToTask?: (note: any) => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  noteToEdit,
  initialMode,
  defaultProjectId,
  defaultSubjectId,
  onConvertToTask
}) => {
  const { subjects, selectedSubjectId } = useAppFilter();
  const [projects, setProjects] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [noteType, setNoteType] = useState<NoteType>(NoteType.GENERAL);
  const [tagsInput, setTagsInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isSavedRef = useRef(false);
  const { showToast } = useToast();

  const initialValuesRef = useRef({
    title: '',
    content: '',
    subjectId: '',
    projectId: '',
    noteType: NoteType.GENERAL,
    tagsInput: ''
  });

  useEffect(() => {
    if (isOpen) {
      api.get<ApiResponse<any[]>>('/projects')
        .then((res) => setProjects(res.data || []))
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    isSavedRef.current = false;
    if (noteToEdit) {
      const initTitle = noteToEdit.title || '';
      const initContent = noteToEdit.content || '';
      const initSubjectId = noteToEdit.subjectId || '';
      const initProjectId = noteToEdit.projectId || '';
      const initNoteType = noteToEdit.noteType || NoteType.GENERAL;
      const initTags = (noteToEdit.tags || []).map((t: any) => t.name).join(', ');
      const initEditing = initialMode === 'WRITE' || initialMode === 'EDIT';

      setTitle(initTitle);
      setContent(initContent);
      setSubjectId(initSubjectId);
      setProjectId(initProjectId);
      setNoteType(initNoteType);
      setTagsInput(initTags);
      setIsEditing(initEditing);

      initialValuesRef.current = {
        title: initTitle,
        content: initContent,
        subjectId: initSubjectId,
        projectId: initProjectId,
        noteType: initNoteType,
        tagsInput: initTags
      };
    } else {
      // In project context: defaultProjectId is defined. Do not fall back to selectedSubjectId if defaultSubjectId is null/empty
      const initProjectId = defaultProjectId || '';
      const initSubjectId = defaultProjectId ? (defaultSubjectId || '') : (defaultSubjectId || selectedSubjectId || '');
      const initNoteType = initProjectId ? NoteType.PROJECT_LOG : (initSubjectId ? NoteType.LECTURE : NoteType.GENERAL);

      setTitle('');
      setContent('');
      setSubjectId(initSubjectId);
      setProjectId(initProjectId);
      setNoteType(initNoteType);
      setTagsInput('');
      setIsEditing(true);

      initialValuesRef.current = {
        title: '',
        content: '',
        subjectId: initSubjectId,
        projectId: initProjectId,
        noteType: initNoteType,
        tagsInput: ''
      };
    }
  }, [isOpen, noteToEdit, defaultProjectId, defaultSubjectId, initialMode]);

  const isDirty = useMemo(() => {
    if (!isEditing) return false;
    const initial = initialValuesRef.current;
    return (
      title !== initial.title ||
      content !== initial.content ||
      subjectId !== initial.subjectId ||
      projectId !== initial.projectId ||
      noteType !== initial.noteType ||
      tagsInput !== initial.tagsInput
    );
  }, [isEditing, title, content, subjectId, projectId, noteType, tagsInput]);

  const handleRequestClose = useCallback(() => {
    if (isEditing && isDirty && !isSavedRef.current) {
      const confirmDiscard = window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn đóng và hủy bỏ các thay đổi này không?');
      if (!confirmDiscard) return;
    }
    onClose();
  }, [isEditing, isDirty, onClose]);

  const handleCancelEdit = () => {
    if (isDirty) {
      const confirmDiscard = window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn hủy chỉnh sửa không?');
      if (!confirmDiscard) return;
    }
    if (noteToEdit) {
      const initial = initialValuesRef.current;
      setTitle(initial.title);
      setContent(initial.content);
      setSubjectId(initial.subjectId);
      setProjectId(initial.projectId);
      setNoteType(initial.noteType);
      setTagsInput(initial.tagsInput);
    }
    setIsEditing(false);
  };

  // Insert natural plain text helper at cursor position
  const insertPlainText = (prefix: string, suffix: string = '', defaultText: string = '') => {
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

    if (!content.trim()) {
      showToast('Vui lòng nhập nội dung ghi chú', 'warning');
      return;
    }

    setLoading(true);
    try {
      const finalTitle = title.trim() || undefined;
      if (noteToEdit) {
        await api.put(`/notes/${noteToEdit.id}`, {
          title: finalTitle,
          content,
          subjectId: subjectId || null,
          projectId: projectId || null,
          noteType,
          tagNames
        });
        showToast('Đã lưu ghi chú thành công!', 'success');
      } else {
        await api.post('/notes', {
          title: finalTitle,
          content,
          subjectId: subjectId || undefined,
          projectId: projectId || undefined,
          noteType,
          tagNames
        });
        showToast('Tạo ghi chú mới thành công!', 'success');
      }

      isSavedRef.current = true;
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu ghi chú', 'error');
    } finally {
      setLoading(false);
    }
  };

  const words = (content || '').trim().split(/\s+/).filter(Boolean).length;
  const features = useMemo(() => extractNoteFeatures(content), [content]);

  const handleToggleTodoInModal = async (todoIndex: number) => {
    const newContent = toggleChecklistItem(content, todoIndex);
    setContent(newContent);
    if (noteToEdit) {
      noteToEdit.content = newContent;
      try {
        await api.put(`/notes/${noteToEdit.id}`, { content: newContent });
        onSuccess();
      } catch {
        showToast('Lỗi cập nhật tiến độ công việc', 'error');
      }
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleRequestClose}
        title={
          noteToEdit
            ? isEditing
              ? 'Chỉnh Sửa Ghi Chú'
              : 'Chi Tiết Ghi Chú'
            : 'Tạo Ghi Chú Mới'
        }
        maxWidth="850px"
        icon={<BookOpen size={20} />}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* VIEW MODE: Direct clean note reader with metadata */}
          {!isEditing ? (
            <div>
              <h2
                style={{
                  margin: '0 0 8px 0',
                  fontSize: '20px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.35
                }}
              >
                {title || 'Ghi chú chưa đặt tiêu đề'}
              </h2>

              {/* Subtle Metadata String */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                  paddingBottom: '12px',
                  borderBottom: '1px solid var(--border-color)',
                  marginBottom: '14px'
                }}
              >
                <span>
                  📅 {noteToEdit?.createdAt ? new Date(noteToEdit.createdAt).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Vừa tạo'}
                </span>
                {noteToEdit?.updatedAt && noteToEdit.updatedAt !== noteToEdit.createdAt && (
                  <>
                    <span>•</span>
                    <span>✏️ Cập nhật: {new Date(noteToEdit.updatedAt).toLocaleDateString('vi-VN')}</span>
                  </>
                )}
                {subjectId && (
                  <>
                    <span>•</span>
                    <span style={{ color: subjects.find((s) => s.id === subjectId)?.color || 'var(--accent-primary)', fontWeight: 600 }}>
                      📖 {subjects.find((s) => s.id === subjectId)?.code ? `[${subjects.find((s) => s.id === subjectId)?.code}] ` : ''}
                      {subjects.find((s) => s.id === subjectId)?.name}
                    </span>
                  </>
                )}
                {projectId && (
                  <>
                    <span>•</span>
                    <span style={{ color: 'var(--color-purple)', fontWeight: 600 }}>
                      📁 {projects.find((p) => p.id === projectId)?.name}
                    </span>
                  </>
                )}
                <span>•</span>
                <span className="badge badge-neutral" style={{ fontSize: '10.5px' }}>
                  {noteType === NoteType.LECTURE ? 'Bài giảng' : noteType === NoteType.LAB_REPORT ? 'Thực hành' : noteType === NoteType.EXAM_PREP ? 'Ôn thi' : noteType === NoteType.PROJECT_LOG ? 'Dự án / BTL' : noteType === NoteType.MEETING_MINUTES ? 'Họp nhóm' : 'Ghi chú'}
                </span>
                <span>•</span>
                <span>📝 {words} từ</span>
                {tagsInput.trim() && (
                  <>
                    <span>•</span>
                    <span>🏷️ {tagsInput}</span>
                  </>
                )}
              </div>

              {/* Reader Body with Markdown formatting & checklist toggles */}
              <div
                style={{
                  minHeight: '220px',
                  maxHeight: '52vh',
                  overflowY: 'auto',
                  padding: '16px 18px',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  lineHeight: 1.7
                }}
              >
                <MarkdownViewer
                  content={content}
                  onToggleTodo={handleToggleTodoInModal}
                />
              </div>

              {/* View Mode Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="btn btn-primary btn-sm"
                    style={{ fontWeight: 600 }}
                  >
                    <Edit3 size={14} />
                    <span>Chỉnh Sửa Ghi Chú</span>
                  </button>

                  {onConvertToTask && (
                    <button
                      type="button"
                      onClick={() => onConvertToTask(noteToEdit)}
                      className="btn btn-secondary btn-sm"
                      title="Chuyển ghi chú thành thẻ công việc Todo"
                    >
                      <CheckSquare size={14} />
                      <span>Chuyển Thành Việc</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(true)}
                    className="btn btn-secondary btn-sm"
                    title="Chia sẻ ghi chú hoặc tạo link công khai"
                  >
                    <Share2 size={14} />
                    <span>Chia sẻ</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary btn-sm"
                >
                  Đóng
                </button>
              </div>
            </div>
          ) : (
            /* WRITE / EDIT MODE: Clean ergonomic workspace */
            <>
              {/* Note Title Input */}
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Tiêu đề ghi chú</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập tiêu đề hoặc để trống (hệ thống sẽ tự nhận diện theo nội dung)..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ fontSize: '15px', fontWeight: 600 }}
                />
              </div>

              {/* Context Relations: Subject & Project */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                <div>
                  <label className="form-label">Môn học liên quan</label>
                  <select
                    className="form-select"
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                  >
                    <option value="">-- Không gắn môn học --</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.code ? `[${sub.code}] ` : ''}{sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Dự án / Nhóm BTL</label>
                  <select
                    className="form-select"
                    value={projectId}
                    onChange={(e) => {
                      const newProjId = e.target.value;
                      setProjectId(newProjId);
                      if (newProjId && !subjectId) {
                        const linkedProj = projects.find((p) => p.id === newProjId);
                        if (linkedProj?.subjectId) {
                          setSubjectId(linkedProj.subjectId);
                        }
                      }
                    }}
                  >
                    <option value="">-- Không gắn dự án --</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Note Type & Tags */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label className="form-label">Phân loại ghi chú</label>
                  <select
                    className="form-select"
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value as NoteType)}
                  >
                    <option value={NoteType.GENERAL}>Ghi chú thông thường</option>
                    <option value={NoteType.LECTURE}>Bài giảng trên lớp</option>
                    <option value={NoteType.LAB_REPORT}>Báo cáo thực hành / Lab</option>
                    <option value={NoteType.EXAM_PREP}>Tài liệu ôn thi / Trọng tâm</option>
                    <option value={NoteType.PROJECT_LOG}>Nhật ký đồ án / Tiến độ</option>
                    <option value={NoteType.MEETING_MINUTES}>Biên bản họp nhóm</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Thẻ nhãn (cách nhau bởi dấu phẩy)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="toan-roi-rac, chuong-1, btl..."
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                  />
                </div>
              </div>

              {/* Markdown Content Area */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>
                    Nội dung ghi chú <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '6px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    <span>{words} từ</span>
                    {features.checklist.active && <span>• {features.checklist.total} việc</span>}
                    {content.includes('$') && <span>• Có công thức KaTeX</span>}
                  </div>
                </div>

                {/* Plain-text Quick Insert Toolbar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '4px',
                    padding: '6px 8px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                    border: '1px solid var(--border-color)',
                    borderBottom: 'none'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => insertPlainText('- [ ] ', '', 'Việc cần làm')}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '12px', padding: '3px 7px', height: 'auto' }}
                    title="Chèn việc cần làm có thể tick chọn"
                  >
                    <CheckSquare size={13} style={{ marginRight: '4px' }} /> Việc cần làm
                  </button>

                  <button
                    type="button"
                    onClick={() => insertPlainText('### ', '', 'Tiêu đề mục')}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '12px', padding: '3px 7px', height: 'auto' }}
                  >
                    Tiêu đề ###
                  </button>

                  <button
                    type="button"
                    onClick={() => insertPlainText('**', '**', 'Chữ đậm')}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '12px', padding: '3px 7px', height: 'auto', fontWeight: 700 }}
                  >
                    Đậm
                  </button>

                  <button
                    type="button"
                    onClick={() => insertPlainText('*', '*', 'Nghiêng')}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '12px', padding: '3px 7px', height: 'auto', fontStyle: 'italic' }}
                  >
                    Nghiêng
                  </button>

                  <button
                    type="button"
                    onClick={() => insertPlainText('- ', '', 'Mục danh sách')}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '12px', padding: '3px 7px', height: 'auto' }}
                  >
                    <List size={13} style={{ marginRight: '4px' }} /> Danh sách
                  </button>

                  <button
                    type="button"
                    onClick={() => insertPlainText('$$\n', '\n$$', 'f(x) = \\int_{0}^{\\infty} e^{-x} dx')}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '12px', padding: '3px 7px', height: 'auto' }}
                    title="Chèn công thức toán LaTeX"
                  >
                    Công thức $$
                  </button>

                  <button
                    type="button"
                    onClick={() => insertPlainText('```\n', '\n```', '// Mã nguồn')}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '12px', padding: '3px 7px', height: 'auto' }}
                  >
                    Code block
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const formatted = autoFormatPlainTextToMarkdown(content);
                      setContent(formatted);
                      showToast('Đã tự động định dạng Markdown', 'info');
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '12px', padding: '3px 7px', height: 'auto', color: 'var(--accent-primary)', marginLeft: 'auto' }}
                    title="Tự động chuẩn hóa văn bản thường thành cấu trúc Markdown"
                  >
                    <Sparkles size={13} style={{ marginRight: '4px' }} /> Tự chuẩn hóa
                  </button>
                </div>

                <textarea
                  ref={textareaRef}
                  className="form-input"
                  style={{
                    minHeight: '240px',
                    maxHeight: '48vh',
                    fontFamily: 'monospace',
                    fontSize: '13.5px',
                    lineHeight: 1.6,
                    borderRadius: '0 0 var(--radius-sm) var(--radius-sm)'
                  }}
                  placeholder="Viết ghi chú tự do... Hỗ trợ Markdown, công thức toán $$, danh sách việc - [ ], mã nguồn code block..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => handleSmartListKeyDown(e, content, setContent)}
                  required
                />
              </div>

              {/* Edit Mode Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                <div>
                  {noteToEdit && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="btn btn-ghost btn-sm"
                      style={{ fontWeight: 600, color: 'var(--text-secondary)' }}
                    >
                      ← Quay lại xem chi tiết
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleRequestClose}
                    className="btn btn-secondary"
                  >
                    Hủy
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
            </>
          )}
        </form>
      </Modal>

      {noteToEdit && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          targetType="NOTE"
          targetId={noteToEdit.id}
          targetTitle={noteToEdit.title || 'Ghi chú'}
        />
      )}
    </>
  );
};
