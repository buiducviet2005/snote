import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Modal } from '../../../components/common/Modal';
import { MarkdownViewer } from '../../../components/common/MarkdownViewer';
import { ShareModal } from '../../../components/common/ShareModal';
import { api, ApiResponse } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { NoteType } from '@snote/shared';
import { autoFormatPlainTextToMarkdown, detectNoteType, extractNoteFeatures, toggleChecklistItem, extractWikiLinks, extractTags, extractOutline } from '../utils/smartNoteParser';
import { handleSmartListKeyDown } from '../utils/smartKeyboard';
import { SnoteEditor } from './editor/SnoteEditor';
import {
  FileText,
  List,
  CheckSquare,
  Edit3,
  Sparkles,
  Save,
  Tag,
  Link,
  Trash2,
  Share2
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
  defaultWorkspaceId?: string | null;
  onConvertToTask?: (note: any) => void;
  allNotes?: any[];
  onOpenNote?: (note: any) => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  noteToEdit,
  initialMode,
  defaultProjectId,
  defaultSubjectId,
  defaultWorkspaceId,
  onConvertToTask,
  allNotes,
  onOpenNote
}) => {
  const { subjects, selectedSubjectId } = useAppFilter();
  const { t, language, formatDate, formatDateTime } = useLanguage();
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
  const wasOpenRef = useRef(false);
  const lastNoteIdRef = useRef<string | null | undefined>(undefined);
  const { showToast } = useToast();
  const [obsidianTab, setObsidianTab] = useState<'PREVIEW' | 'LINKS' | 'OUTLINE' | 'TAGS'>('PREVIEW');

  const backlinks = useMemo(() => {
    if (!noteToEdit?.title || !allNotes) return [];
    const targetTitle = noteToEdit.title.trim().toLowerCase();
    return allNotes.filter((other) => {
      if (other.id === noteToEdit.id) return false;
      const links = extractWikiLinks(other.content || '');
      return links.some((l) => l.target.toLowerCase() === targetTitle || l.target === noteToEdit.id);
    });
  }, [noteToEdit, allNotes]);

  const outgoingLinks = useMemo(() => {
    return extractWikiLinks(content || '');
  }, [content]);

  const tagsList = useMemo(() => {
    return extractTags(content || '');
  }, [content]);

  const outlineList = useMemo(() => {
    return extractOutline(content || '');
  }, [content]);

  const handleNavigateWiki = (target: string) => {
    if (!allNotes || !onOpenNote) {
      showToast(language === 'vi' ? `Liên kết tới: ${target}` : `Link to: ${target}`, 'info');
      return;
    }
    const targetLower = target.trim().toLowerCase();
    const found = allNotes.find((n) => n.title?.trim().toLowerCase() === targetLower || n.id === target);
    if (found) {
      onOpenNote(found);
    } else {
      showToast(language === 'vi' ? `Chưa tìm thấy ghi chú "${target}" trong kho` : `Note "${target}" not found in vault`, 'info');
    }
  };

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
    if (!isOpen) {
      wasOpenRef.current = false;
      lastNoteIdRef.current = undefined;
      return;
    }

    const noteId = noteToEdit?.id ?? null;
    const isNewOpen = !wasOpenRef.current;
    const isNoteChanged = noteId !== lastNoteIdRef.current;

    if (!isNewOpen && !isNoteChanged) {
      return;
    }

    wasOpenRef.current = true;
    lastNoteIdRef.current = noteId;
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
  }, [isOpen, noteToEdit, defaultProjectId, defaultSubjectId, initialMode, selectedSubjectId]);

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
      const confirmDiscard = window.confirm(t('notes.unsaved_confirm'));
      if (!confirmDiscard) {
        return;
      }
    }
    onClose();
  }, [isEditing, isDirty, onClose, t]);

  const handleCancelEdit = useCallback(() => {
    if (isDirty) {
      const confirmDiscard = window.confirm(t('notes.unsaved_back_confirm'));
      if (!confirmDiscard) {
        return;
      }
    }
    if (noteToEdit) {
      const initial = initialValuesRef.current;
      setTitle(initial.title);
      setContent(initial.content);
      setSubjectId(initial.subjectId);
      setProjectId(initial.projectId);
      setNoteType(initial.noteType);
      setTagsInput(initial.tagsInput);
      setIsEditing(false);
    } else {
      onClose();
    }
  }, [isDirty, noteToEdit, onClose]);

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
      showToast(t('notes.empty_content_warning'), 'warning');
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
        showToast(t('notes.save_success'), 'success');
      } else {
        await api.post('/notes', {
          title: finalTitle,
          content,
          subjectId: subjectId || undefined,
          projectId: projectId || undefined,
          workspaceId: defaultWorkspaceId || undefined,
          noteType,
          tagNames
        });
        showToast(t('notes.create_success'), 'success');
      }

      isSavedRef.current = true;
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || t('notes.save_error'), 'error');
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
        showToast(t('tasks.update_error'), 'error');
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
            ? (language === 'vi' ? 'Chỉnh Sửa Ghi Chú' : 'Edit Note')
            : (language === 'vi' ? 'Chi Tiết Ghi Chú' : 'Note Details')
          : (language === 'vi' ? 'Tạo Ghi Chú Mới' : 'Create New Note')
      }
      maxWidth="850px"
      icon={<FileText size={20} />}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* VIEW MODE: Direct clean note reader with metadata */}
        {!isEditing ? (
          <div>
            <h2
              style={{
                margin: '0 0 8px 0',
                fontSize: 'var(--type-section)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.35
              }}
            >
              {title || t('notes.untitled')}
            </h2>

            {/* Subtle Metadata String */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                fontSize: 'var(--type-small)',
                color: 'var(--text-muted)',
                lineHeight: 1.6,
                paddingBottom: '12px',
                borderBottom: '1px solid var(--border-color)',
                marginBottom: '14px'
              }}
            >
              <span>
                {noteToEdit?.createdAt ? formatDateTime(noteToEdit.createdAt) : (language === 'vi' ? 'Vừa tạo' : 'Just created')}
              </span>
              {noteToEdit?.updatedAt && noteToEdit.updatedAt !== noteToEdit.createdAt && (
                <>
                  <span>•</span>
                  <span>{language === 'vi' ? 'Cập nhật' : 'Updated'}: {formatDate(noteToEdit.updatedAt)}</span>
                </>
              )}
              {subjectId && (
                <>
                  <span>•</span>
                  <span style={{ color: subjects.find((s) => s.id === subjectId)?.color || 'var(--accent-primary)', fontWeight: 600 }}>
                    {subjects.find((s) => s.id === subjectId)?.code ? `[${subjects.find((s) => s.id === subjectId)?.code}] ` : ''}
                    {subjects.find((s) => s.id === subjectId)?.name}
                  </span>
                </>
              )}
              {projectId && (
                <>
                  <span>•</span>
                  <span style={{ color: 'var(--color-purple)', fontWeight: 600 }}>
                    {projects.find((p) => p.id === projectId)?.name}
                  </span>
                </>
              )}
              <span>•</span>
              <span className="badge badge-neutral" style={{ fontSize: 'var(--type-caption)' }}>
                {noteType === NoteType.LECTURE ? t('notes.type_lecture') : noteType === NoteType.LAB_REPORT ? t('notes.type_lab_report') : noteType === NoteType.EXAM_PREP ? t('notes.type_exam_prep') : noteType === NoteType.PROJECT_LOG ? t('notes.type_project_log') : noteType === NoteType.MEETING_MINUTES ? t('notes.type_meeting_minutes') : t('notes.type_general')}
              </span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <FileText size={12} strokeWidth={1.5} />
                <span>{t('notes.word_count', { words })}</span>
              </span>
              {tagsInput.trim() && (
                <>
                  <span>•</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Tag size={12} strokeWidth={1.5} />
                    <span>{tagsInput}</span>
                  </span>
                </>
              )}
            </div>

            {/* List Progress Bar (If note contains checklist items) */}
            {features.checklist.active && (
              <div className="note-progress-container" style={{ marginBottom: '12px' }}>
                <CheckSquare size={13} style={{ color: 'var(--color-success)' }} />
                <span style={{ fontSize: 'var(--type-caption)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {t('notes.checklist_progress', {
                    done: features.checklist.done,
                    total: features.checklist.total,
                    percent: Math.round((features.checklist.done / features.checklist.total) * 100)
                  })}
                </span>
                <div className="note-progress-bar-bg">
                  <div
                    className="note-progress-bar-fill"
                    style={{ width: `${(features.checklist.done / features.checklist.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Formatted Content Body with interactive checklist */}
            <div
              className="snote-card"
              style={{
                minHeight: '260px',
                maxHeight: '480px',
                overflowY: 'auto',
                padding: '20px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              {content.trim() ? (
                <MarkdownViewer content={content} onToggleTodo={handleToggleTodoInModal} />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 'var(--type-small)' }}>
                  <i dangerouslySetInnerHTML={{ __html: t('notes.no_content_edit_prompt') }} />
                </div>
              )}
            </div>

            {/* View Mode Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="btn btn-primary"
                  style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Edit3 size={15} />
                  <span>{language === 'vi' ? 'Chỉnh Sửa Ghi Chú' : 'Edit Note'}</span>
                </button>
                {noteToEdit && (
                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(true)}
                    className="btn btn-secondary"
                    style={{ fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}
                    title={t('notes.share')}
                  >
                    <Share2 size={15} />
                    <span>{t('notes.share')}</span>
                  </button>
                )}
                {onConvertToTask && noteToEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onConvertToTask(noteToEdit);
                    }}
                    className="btn btn-secondary"
                    style={{ fontWeight: 600, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '6px' }}
                    title={t('notes.convert_to_task')}
                  >
                    <CheckSquare size={15} />
                    <span>{t('notes.convert_to_task')}</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        ) : (
          /* EDIT / CREATE MODE: Natural Plaintext Note Editor */
          <>
            {/* Title Input (Optional - Google Keep / Apple Notes style) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {t('common.title')}
                </label>
                <span style={{ fontSize: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                  {language === 'vi' ? 'Tùy chọn (để trống sẽ tự lấy dòng đầu tiên)' : 'Optional (empty defaults to first line)'}
                </span>
              </div>
              <input
                type="text"
                placeholder={t('notes.title_placeholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="snote-input"
                style={{ fontSize: 'var(--type-body)', fontWeight: 600 }}
              />
            </div>

            {/* Subject & Project Selectors */}
            {defaultWorkspaceId ? <p style={{ margin: 0, color: 'var(--text-muted)' }}>{language === 'vi' ? 'Ghi chú được lưu trong nhóm hiện tại.' : 'Note will be saved in current group.'}</p> : <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {language === 'vi' ? 'Môn học liên quan (Tùy chọn)' : 'Related Subject (Optional)'}
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="snote-select"
                >
                  <option value="">{language === 'vi' ? 'Ghi chú tự do / Cá nhân (Không thuộc môn học)' : 'Personal Note (Not tied to subject)'}</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.code ? `[${sub.code}] ` : ''}{sub.name} ({sub.credits} TC)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {language === 'vi' ? 'Dự án / Đồ án liên kết (Tùy chọn)' : 'Linked Project (Optional)'}
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  disabled={Boolean(defaultProjectId)}
                  className="snote-select"
                >
                  <option value="">-- {language === 'vi' ? 'Không gắn dự án' : 'No project linked'} --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>}

            {/* Note Type & Tags */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {t('common.type')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const detected = detectNoteType(title, content);
                      setNoteType(detected);
                      showToast(t('notes.detect_type_success', { type: detected }), 'info');
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 'var(--type-caption)', padding: '1px 6px', color: 'var(--accent-primary)', fontWeight: 600 }}
                    title={t('notes.detect_type_tooltip')}
                  >
                    {t('notes.detect_type_btn')}
                  </button>
                </div>
                <select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value as NoteType)}
                  className="snote-select"
                >
                  <option value={NoteType.GENERAL}>{t('notes.type_general')}</option>
                  <option value={NoteType.LECTURE}>{t('notes.type_lecture')}</option>
                  <option value={NoteType.LAB_REPORT}>{t('notes.type_lab')}</option>
                  <option value={NoteType.EXAM_PREP}>{t('notes.type_exam')}</option>
                  <option value={NoteType.PROJECT_LOG}>{t('notes.type_project')}</option>
                  <option value={NoteType.MEETING_MINUTES}>{t('notes.type_meeting')}</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {t('notes.tags_label')}
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                    <Tag size={15} />
                  </span>
                  <input
                    type="text"
                    placeholder={t('notes.tags_placeholder')}
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="snote-input"
                    style={{ paddingLeft: '36px' }}
                  />
                </div>
              </div>
            </div>

            {/* Plaintext Content Field with Natural Quick Actions */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  backgroundColor: 'var(--bg-primary)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                {/* Natural Plaintext Quick Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => insertPlainText('• ', '', language === 'vi' ? 'Mục danh sách' : 'List item')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 'var(--type-small)', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title={t('notes.insert_bullet')}
                  >
                    <List size={13} />
                    <span>{language === 'vi' ? 'Danh sách' : 'Bullet'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => insertPlainText('1. ', '', language === 'vi' ? 'Mục đầu tiên' : 'First item')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 'var(--type-small)', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title={t('notes.insert_numbered')}
                  >
                    <span style={{ fontWeight: 800, fontSize: 'var(--type-caption)' }}>1.</span>
                    <span>{language === 'vi' ? 'Thứ tự' : 'Numbered'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => insertPlainText('[ ] ', '', language === 'vi' ? 'Công việc cần làm' : 'Task to do')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 'var(--type-small)', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title={t('notes.insert_todo')}
                  >
                    <CheckSquare size={13} />
                    <span>{language === 'vi' ? 'Việc cần làm' : 'To-do'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => insertPlainText('https://', '', '')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 'var(--type-small)', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title={t('notes.insert_link')}
                  >
                    <Link size={13} />
                    <span>{language === 'vi' ? 'Liên kết' : 'Link'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const formatted = autoFormatPlainTextToMarkdown(content);
                      setContent(formatted);
                      showToast(t('notes.auto_recognize_success'), 'success');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{
                      fontSize: 'var(--type-small)',
                      padding: '3px 10px',
                      color: 'var(--accent-primary)',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title={t('notes.auto_recognize_tooltip')}
                  >
                    <List size={12} />
                    <span>{t('notes.detect_type_btn')}</span>
                  </button>
                </div>

                <div style={{ fontSize: 'var(--type-small)', color: 'var(--text-muted)' }}>
                  <span>{t('notes.words_count', { count: words })}</span>
                </div>
              </div>

              {/* TipTap Live WYSIWYM Editor */}
              <div
                style={{
                  minHeight: '260px',
                  maxHeight: '420px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  backgroundColor: 'var(--bg-primary)'
                }}
              >
                <SnoteEditor
                  content={content}
                  onChange={setContent}
                  placeholder={t('notes.editor_placeholder')}
                />
              </div>
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
                    ← {language === 'vi' ? 'Quay lại xem chi tiết' : 'Back to details'}
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleRequestClose}
                  className="btn btn-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ fontWeight: 700 }}
                >
                  <Save size={15} />
                  <span>{loading ? t('common.saving') : noteToEdit ? (language === 'vi' ? 'Lưu Thay Đổi' : 'Save Changes') : t('common.save')}</span>
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
        targetTitle={noteToEdit.title || t('notes.untitled')}
      />
    )}
  </>
);
};
