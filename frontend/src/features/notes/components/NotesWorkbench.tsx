import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { SnoteEditor } from './editor/SnoteEditor';
import { draftStorage } from '../utils/draftStorage';
import { noteHistoryStorage, NoteVersionSnapshot, NoteVersionType } from '../utils/noteHistoryStorage';
import { NoteHistoryModal } from './NoteHistoryModal';
import { extractOutline, extractWikiLinks, extractTags } from '../utils/smartNoteParser';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useToast } from '../../../contexts/ToastContext';
import {
  BookOpen,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Pin,
  Trash2,
  Share2,
  CheckSquare,
  ListTree,
  Link2,
  Maximize2,
  Minimize2,
  Tag,
  ArrowUpRight,
  History,
  Save
} from 'lucide-react';
import './NotesWorkbench.css';

export interface NotesWorkbenchProps {
  notes: any[];
  subjects: any[];
  projects: any[];
  activeNoteId?: string;
  onSelectNote: (note: any) => void;
  onUpdateNote: (id: string, payload: { title?: string; content?: string }) => Promise<void>;
  onCreateNote: () => void;
  onDeleteNote: (id: string) => Promise<void>;
  onTogglePin: (id: string) => Promise<void>;
  onConvertToTask?: (note: any) => void;
  onShareNote?: (note: any) => void;
}

export const NotesWorkbench: React.FC<NotesWorkbenchProps> = ({
  notes,
  subjects,
  projects,
  activeNoteId,
  onSelectNote,
  onUpdateNote,
  onCreateNote,
  onDeleteNote,
  onTogglePin,
  onConvertToTask,
  onShareNote
}) => {
  const { user } = useAuth();
  const { t, language, formatDate } = useLanguage();
  const { showToast } = useToast();

  // Active note selection
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const canEditSelected = !selectedNote || selectedNote.userId === user?.id;

  useEffect(() => {
    if (activeNoteId) {
      const found = notes.find((n) => n.id === activeNoteId);
      if (found) {
        setSelectedNote(found);
        return;
      }
    }
    if (!selectedNote && notes.length > 0) {
      setSelectedNote(notes[0]);
    }
  }, [activeNoteId, notes]);

  // View Layout Modes
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(true); // Default collapsed for extra space
  const [rightTab, setRightTab] = useState<'OUTLINE' | 'BACKLINKS' | 'HISTORY' | 'TAGS'>('OUTLINE');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'PINNED' | 'PROJECT'>('ALL');

  // Auto-Save Mode Setting (Persistent in localStorage, default true)
  const [isAutoSave, setIsAutoSave] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('snote_autosave_setting');
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  // History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Editor Content State
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [syncStatus, setSyncStatus] = useState<'SYNCED' | 'SAVING' | 'DRAFT'>('SYNCED');

  const editTitleRef = useRef('');
  const editContentRef = useRef('');
  const lastSavedTitleRef = useRef('');
  const lastSavedContentRef = useRef('');
  const saveTimeoutRef = useRef<any>(null);

  // Toggle Auto-save quietly (no intrusive toast)
  const handleToggleAutoSave = () => {
    setIsAutoSave((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('snote_autosave_setting', String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  // Sync state when selected note changes
  useEffect(() => {
    if (selectedNote) {
      const title = selectedNote.title || '';
      const content = selectedNote.content || '';
      setEditTitle(title);
      setEditContent(content);
      editTitleRef.current = title;
      editContentRef.current = content;
      lastSavedTitleRef.current = title;
      lastSavedContentRef.current = content;
      setSyncStatus('SYNCED');

      // Bootstrap history snapshot if none exists
      const snaps = noteHistoryStorage.getSnapshots(selectedNote.id);
      if (snaps.length === 0 && (title || content)) {
        noteHistoryStorage.saveSnapshot(
          selectedNote.id,
          title,
          content,
          'INITIAL',
          language === 'vi' ? 'Bản nạp ban đầu' : 'Initial load'
        );
        setHistoryCount(1);
      } else {
        setHistoryCount(snaps.length);
      }
    } else {
      setEditTitle('');
      setEditContent('');
      editTitleRef.current = '';
      editContentRef.current = '';
      lastSavedTitleRef.current = '';
      lastSavedContentRef.current = '';
      setHistoryCount(0);
    }
  }, [selectedNote?.id]);

  // Is content dirty compared to last saved
  const isDirty = useMemo(() => {
    if (!selectedNote) return false;
    const currentT = editTitle.trim() || (language === 'vi' ? 'Ghi chú không tên' : 'Untitled Note');
    return currentT !== lastSavedTitleRef.current || editContent !== lastSavedContentRef.current;
  }, [selectedNote, editTitle, editContent, language]);

  // Resilient Save with Version Checkpointing & Instant User Feedback
  const performSave = useCallback(
    async (
      targetNoteId: string,
      newTitle: string,
      newContent: string,
      versionType: NoteVersionType = 'AUTO_SAVE',
      description?: string
    ) => {
      if (!targetNoteId || !canEditSelected) return;

      const trimmedTitle = newTitle.trim() || (language === 'vi' ? 'Ghi chú không tên' : 'Untitled Note');
      const hasChanged = trimmedTitle !== lastSavedTitleRef.current || newContent !== lastSavedContentRef.current;

      if (!hasChanged && versionType !== 'MANUAL_SAVE' && versionType !== 'RESTORE_POINT') {
        setSyncStatus('SYNCED');
        return;
      }

      try {
        setSyncStatus('SAVING');
        await onUpdateNote(targetNoteId, {
          title: trimmedTitle,
          content: newContent
        });

        lastSavedTitleRef.current = trimmedTitle;
        lastSavedContentRef.current = newContent;
        draftStorage.remove(targetNoteId);

        // Record snapshot in version history
        const savedSnap = noteHistoryStorage.saveSnapshot(
          targetNoteId,
          trimmedTitle,
          newContent,
          versionType,
          description
        );
        if (savedSnap) {
          const snaps = noteHistoryStorage.getSnapshots(targetNoteId);
          setHistoryCount(snaps.length);
        }

        const now = new Date();
        const nowTime = now.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit'
        });
        setLastSavedTime(nowTime);
        setSyncStatus('SYNCED');

        if (versionType === 'MANUAL_SAVE' || versionType === 'RESTORE_POINT') {
          showToast(language === 'vi' ? 'Đã lưu bài ghi thành công' : 'Note saved successfully', 'success');
        }
      } catch (err: any) {
        setSyncStatus('DRAFT');
        if (versionType === 'MANUAL_SAVE' || versionType === 'RESTORE_POINT') {
          showToast(err?.message || (language === 'vi' ? 'Lỗi khi lưu bài ghi' : 'Failed to save note'), 'error');
        }
      }
    },
    [canEditSelected, language, onUpdateNote, showToast]
  );

  // Trigger Autosave Debounce
  const triggerAutosave = useCallback(
    (targetId: string, newTitle: string, newContent: string) => {
      setSyncStatus('DRAFT');
      if (!isAutoSave) return;

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        performSave(targetId, newTitle, newContent, 'AUTO_SAVE');
      }, 1500);
    },
    [isAutoSave, performSave]
  );

  // Global Ctrl + S / Cmd + S Keydown Listener
  useEffect(() => {
    const handleGlobalSaveKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (selectedNote?.id) {
          performSave(selectedNote.id, editTitleRef.current, editContentRef.current, 'MANUAL_SAVE', language === 'vi' ? 'Lưu thủ công (Ctrl+S)' : 'Manual save (Ctrl+S)');
        }
      }
    };

    window.addEventListener('keydown', handleGlobalSaveKey);
    return () => window.removeEventListener('keydown', handleGlobalSaveKey);
  }, [performSave, selectedNote?.id, language]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEditTitle(val);
    editTitleRef.current = val;
    if (selectedNote?.id) {
      triggerAutosave(selectedNote.id, val, editContentRef.current);
    }
  };

  const handleContentChange = useCallback(
    (newMarkdown: string) => {
      setEditContent(newMarkdown);
      editContentRef.current = newMarkdown;
      if (selectedNote?.id) {
        triggerAutosave(selectedNote.id, editTitleRef.current, newMarkdown);
      }
    },
    [selectedNote?.id, triggerAutosave]
  );

  // Restore Note from Version History
  const handleRestoreSnapshot = async (snapshot: NoteVersionSnapshot) => {
    if (!selectedNote?.id) return;
    setEditTitle(snapshot.title);
    setEditContent(snapshot.content);
    editTitleRef.current = snapshot.title;
    editContentRef.current = snapshot.content;
    await performSave(
      selectedNote.id,
      snapshot.title,
      snapshot.content,
      'RESTORE_POINT',
      language === 'vi'
        ? `Khôi phục từ bản ${snapshot.formattedTime} (${snapshot.formattedDate})`
        : `Restored from ${snapshot.formattedTime} (${snapshot.formattedDate})`
    );
  };

  // Safe Note Switch with Flush Pending Changes
  const handleSelectNoteWithFlush = async (note: any) => {
    if (selectedNote?.id === note.id) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (selectedNote?.id && isDirty && canEditSelected) {
      await performSave(
        selectedNote.id,
        editTitleRef.current,
        editContentRef.current,
        'AUTO_SAVE',
        language === 'vi' ? 'Tự động lưu trước khi chuyển bài' : 'Autosave before switching'
      );
    }

    setSelectedNote(note);
    onSelectNote(note);
  };

  // Convert selected text or current note to task
  const handleConvertToTaskInline = (selectedText: string) => {
    if (!onConvertToTask || !selectedNote) return;
    onConvertToTask({
      title: selectedText.slice(0, 100),
      content: selectedText,
      subjectId: selectedNote.subjectId,
      projectId: selectedNote.projectId
    });
  };

  // Word count metrics
  const wordsCount = useMemo(() => {
    const text = editContent.trim();
    if (!text) return 0;
    return text.split(/\s+/).length;
  }, [editContent]);

  // Lazy analyses: only compute heavy string parses when the right drawer is actually open!
  const outlineList = useMemo(() => {
    if (isRightCollapsed || rightTab !== 'OUTLINE') return [];
    return extractOutline(editContent || '');
  }, [editContent, isRightCollapsed, rightTab]);

  const currentTitleLower = (selectedNote?.title || '').trim().toLowerCase();

  const linkedBacklinks = useMemo(() => {
    if (isRightCollapsed || rightTab !== 'BACKLINKS' || !selectedNote || !currentTitleLower) return [];
    return notes.filter((other) => {
      if (other.id === selectedNote.id) return false;
      const links = extractWikiLinks(other.content || '');
      return links.some((l) => l.target.toLowerCase() === currentTitleLower || l.target === selectedNote.id);
    });
  }, [selectedNote, currentTitleLower, notes, isRightCollapsed, rightTab]);

  const noteTags = useMemo(() => {
    if (isRightCollapsed || rightTab !== 'TAGS') return [];
    return extractTags(editContent || '');
  }, [editContent, isRightCollapsed, rightTab]);

  const snapshotsList = useMemo(() => {
    if (isRightCollapsed || rightTab !== 'HISTORY' || !selectedNote?.id) return [];
    return noteHistoryStorage.getSnapshots(selectedNote.id);
  }, [selectedNote?.id, historyCount, isRightCollapsed, rightTab]);

  // Filtered Notes List
  const filteredNotes = useMemo(() => {
    let list = notes;
    if (filterType === 'PINNED') {
      list = list.filter((n) => n.isPinned);
    } else if (filterType === 'PROJECT') {
      list = list.filter((n) => Boolean(n.projectId));
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;

    if (q.startsWith('#')) {
      const tagQuery = q.slice(1);
      return list.filter((n) => {
        const tags = extractTags(n.content || '');
        return tags.some((t) => t.toLowerCase().includes(tagQuery));
      });
    }

    return list.filter(
      (n) =>
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.content && n.content.toLowerCase().includes(q))
    );
  }, [notes, filterType, searchQuery]);

  return (
    <div className={`snote-workbench ${isFocusMode ? 'focus-mode' : ''}`}>
      {/* ====================================================================
          1. LEFT SIDEBAR: STUDY VAULT EXPLORER
          ==================================================================== */}
      {!isFocusMode && (
        <aside className={`snote-wb-left ${isLeftCollapsed ? 'collapsed' : ''}`}>
          <div className="snote-wb-left-header">
            <div className="snote-wb-left-top">
              <div className="snote-wb-title">
                <BookOpen size={14} style={{ color: 'var(--ws-accent)' }} />
                <span>{t('notes.vault_title')} ({notes.length})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  className="snote-wb-new-btn"
                  onClick={onCreateNote}
                  title={t('notes.new_note_tooltip')}
                >
                  <Plus size={12} />
                  <span>{t('notes.new_note')}</span>
                </button>
                <button
                  type="button"
                  className="snote-wb-icon-btn"
                  onClick={() => setIsLeftCollapsed(true)}
                  title={t('notes.collapse_left_tooltip')}
                >
                  <ChevronLeft size={14} />
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="snote-wb-search-wrap">
              <Search size={12} className="snote-wb-search-icon" />
              <input
                type="text"
                className="snote-wb-search-input"
                placeholder={t('notes.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Pills */}
            <div className="snote-wb-filter-pills">
              <button
                type="button"
                className={`snote-wb-pill ${filterType === 'ALL' ? 'active' : ''}`}
                onClick={() => setFilterType('ALL')}
              >
                {t('notes.all')}
              </button>
              <button
                type="button"
                className={`snote-wb-pill ${filterType === 'PINNED' ? 'active' : ''}`}
                onClick={() => setFilterType('PINNED')}
              >
                {t('notes.pinned')}
              </button>
              <button
                type="button"
                className={`snote-wb-pill ${filterType === 'PROJECT' ? 'active' : ''}`}
                onClick={() => setFilterType('PROJECT')}
              >
                {t('notes.project')}
              </button>
            </div>
          </div>

          {/* Notes List */}
          <div className="snote-wb-notes-list">
            {filteredNotes.length === 0 ? (
              <div className="snote-wb-empty-text">
                {t('notes.no_notes_found')}
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isSelected = selectedNote?.id === note.id;
                const tags = extractTags(note.content || '');
                return (
                  <div
                    key={note.id}
                    className={`snote-wb-note-item ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      handleSelectNoteWithFlush(note);
                    }}
                  >
                    <div className="snote-wb-item-top">
                      <span className="snote-wb-item-title">{note.title || t('notes.untitled')}</span>
                      {note.isPinned && <Pin size={11} style={{ color: 'var(--ws-accent)', flexShrink: 0 }} />}
                    </div>

                    <span className="snote-wb-item-snippet">
                      {note.content ? note.content.slice(0, 75).replace(/[#*`[\]]/g, '') : t('notes.no_content')}
                    </span>

                    <div className="snote-wb-item-meta">
                      <span>{formatDate(note.updatedAt || note.createdAt)}</span>
                      {tags.slice(0, 2).map((tTag, idx) => (
                        <span key={idx} className="snote-wb-tag-pill">#{tTag}</span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      )}

      {/* ====================================================================
          2. MAIN CENTER: LIVE-INLINE DOCUMENT ENGINE
          ==================================================================== */}
      <main className="snote-wb-center">
        {/* Unhide Floating Triggers */}
        {!isFocusMode && isLeftCollapsed && (
          <button
            type="button"
            className="snote-wb-unhide-left"
            onClick={() => setIsLeftCollapsed(false)}
            title={t('notes.unhide_left_tooltip')}
          >
            <ChevronRight size={13} />
          </button>
        )}

        {!isFocusMode && isRightCollapsed && (
          <button
            type="button"
            className="snote-wb-unhide-right"
            onClick={() => setIsRightCollapsed(false)}
            title={language === 'vi' ? 'Mở bảng mục lục và lịch sử phiên bản' : 'Open table of contents and version history'}
          >
            <ListTree size={13} />
          </button>
        )}

        <div className="snote-wb-document-area">
          {!selectedNote ? (
            <div className="snote-wb-empty-canvas">
              <BookOpen size={36} style={{ opacity: 0.35, marginBottom: '12px' }} />
              <i>{t('notes.select_prompt')}</i>
            </div>
          ) : (
            <div className="snote-wb-page-container">
              {/* Document Header (100% Static Layout - Zero Jumps) */}
              <div className="snote-wb-doc-header">
                <input
                  type="text"
                  className="snote-wb-doc-title-input"
                  value={editTitle}
                  onChange={handleTitleChange}
                  readOnly={!canEditSelected}
                  placeholder={t('notes.title_placeholder')}
                />

                <div className="snote-wb-doc-actions">
                  {/* Stable Save Icon Button (Always present, no jumping) */}
                  {canEditSelected && (
                    <button
                      type="button"
                      className={`snote-wb-tool-btn ${isDirty ? 'is-dirty' : ''}`}
                      onClick={() => selectedNote?.id && performSave(selectedNote.id, editTitleRef.current, editContentRef.current, 'MANUAL_SAVE', language === 'vi' ? 'Lưu thủ công (Ctrl+S)' : 'Manual save (Ctrl+S)')}
                      title={language === 'vi' ? 'Lưu bài ghi (Ctrl + S)' : 'Save note (Ctrl + S)'}
                    >
                      <Save size={14} style={{ color: isDirty ? 'var(--ws-accent)' : undefined }} />
                    </button>
                  )}

                  {/* Version History Button */}
                  <button
                    type="button"
                    className="snote-wb-tool-btn history-btn"
                    onClick={() => setIsHistoryModalOpen(true)}
                    title={language === 'vi' ? 'Xem lịch sử phiên bản & khôi phục bài ghi (Rollback)' : 'View version history & restore note (Rollback)'}
                  >
                    <History size={14} />
                    {historyCount > 0 && <span className="snote-wb-history-count">{historyCount}</span>}
                  </button>

                  {/* Focus Mode Toggle */}
                  <button
                    type="button"
                    className={`snote-wb-tool-btn ${isFocusMode ? 'active' : ''}`}
                    onClick={() => setIsFocusMode(!isFocusMode)}
                    title={isFocusMode ? (language === 'vi' ? 'Thoát chế độ tập trung' : 'Exit focus mode') : (language === 'vi' ? 'Chế độ tập trung (Zen Focus)' : 'Focus mode (Zen Focus)')}
                  >
                    {isFocusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  </button>

                  {/* Pin Toggle */}
                  {canEditSelected && (
                    <button
                      type="button"
                      className={`snote-wb-tool-btn ${selectedNote.isPinned ? 'active' : ''}`}
                      onClick={() => onTogglePin(selectedNote.id)}
                      title={selectedNote.isPinned ? t('notes.unpin') : t('notes.pin')}
                    >
                      <Pin size={14} style={{ color: selectedNote.isPinned ? 'var(--ws-accent)' : undefined }} />
                    </button>
                  )}

                  {/* Convert to Task */}
                  {canEditSelected && onConvertToTask && (
                    <button
                      type="button"
                      className="snote-wb-tool-btn"
                      onClick={() => onConvertToTask(selectedNote)}
                      title={t('notes.convert_to_task')}
                    >
                      <CheckSquare size={14} />
                    </button>
                  )}

                  {/* Share / Copy */}
                  {onShareNote && (
                    <button
                      type="button"
                      className="snote-wb-tool-btn"
                      onClick={() => onShareNote(selectedNote)}
                      title={t('notes.share')}
                    >
                      <Share2 size={14} />
                    </button>
                  )}

                  {/* Delete */}
                  {canEditSelected && (
                    <button
                      type="button"
                      className="snote-wb-tool-btn danger"
                      onClick={() => onDeleteNote(selectedNote.id)}
                      title={t('notes.delete_note')}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* TipTap Live-Inline Editor */}
              <div className="snote-wb-editor-wrapper">
                <SnoteEditor
                  noteId={selectedNote.id}
                  content={editContent}
                  onChange={handleContentChange}
                  readOnly={!canEditSelected}
                  onConvertToTask={handleConvertToTaskInline}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Status Bar: Completely calm, quiet, zero spinning icons */}
        <footer className="snote-wb-status-bar">
          <div className="snote-wb-status-left">
            <span>{t('notes.word_count', { words: wordsCount })}</span>
            <span className="dot-divider">•</span>
            <span>{t('notes.character_count', { chars: editContent.length })}</span>
            <span className="dot-divider">•</span>
            <span>~{Math.ceil(Math.max(wordsCount, 1) / 200)} {language === 'vi' ? 'phút đọc' : 'min read'}</span>
          </div>

          <div className="snote-wb-status-right">
            <button
              type="button"
              className="snote-wb-quiet-autosave"
              onClick={handleToggleAutoSave}
              title={
                isAutoSave
                  ? (language === 'vi' ? 'Tự động lưu: BẬT (Bấm để tắt)' : 'Auto-save: ON (Click to turn off)')
                  : (language === 'vi' ? 'Tự động lưu: TẮT (Bấm để bật)' : 'Auto-save: OFF (Click to turn on)')
              }
            >
              <span className={`quiet-dot ${syncStatus === 'SAVING' ? 'saving' : (syncStatus === 'DRAFT' || isDirty) ? 'draft' : 'synced'} ${isAutoSave ? 'on' : 'off'}`} />
              <span className="quiet-status-text">
                {syncStatus === 'SAVING'
                  ? (language === 'vi' ? 'Đang lưu...' : 'Saving...')
                  : (syncStatus === 'DRAFT' || isDirty)
                  ? (language === 'vi' ? 'Chưa lưu (Ctrl+S)' : 'Unsaved (Ctrl+S)')
                  : (lastSavedTime ? (language === 'vi' ? `Đã lưu ${lastSavedTime}` : `Saved ${lastSavedTime}`) : (language === 'vi' ? 'Đã lưu' : 'Saved'))}
              </span>
            </button>
          </div>
        </footer>
      </main>

      {/* ====================================================================
          3. RIGHT DRAWER: OUTLINE, HISTORY & CONTEXT
          ==================================================================== */}
      {!isFocusMode && (
        <aside className={`snote-wb-right ${isRightCollapsed ? 'collapsed' : ''}`}>
          <div className="snote-wb-right-tabs">
            <button
              type="button"
              className={`snote-wb-rtab ${rightTab === 'OUTLINE' ? 'active' : ''}`}
              onClick={() => setRightTab('OUTLINE')}
            >
              <ListTree size={12} />
              <span>{t('notes.outline')}</span>
            </button>
            <button
              type="button"
              className={`snote-wb-rtab ${rightTab === 'HISTORY' ? 'active' : ''}`}
              onClick={() => setRightTab('HISTORY')}
            >
              <History size={12} />
              <span>{language === 'vi' ? 'Lịch sử' : 'History'}</span>
              {historyCount > 0 && <span className="snote-wb-badge">{historyCount}</span>}
            </button>
            <button
              type="button"
              className={`snote-wb-rtab ${rightTab === 'BACKLINKS' ? 'active' : ''}`}
              onClick={() => setRightTab('BACKLINKS')}
            >
              <Link2 size={12} />
              <span>{t('notes.backlinks')}</span>
              {linkedBacklinks.length > 0 && <span className="snote-wb-badge">{linkedBacklinks.length}</span>}
            </button>
            <button
              type="button"
              className={`snote-wb-rtab ${rightTab === 'TAGS' ? 'active' : ''}`}
              onClick={() => setRightTab('TAGS')}
            >
              <Tag size={12} />
              <span>{language === 'vi' ? 'Thẻ' : 'Tags'}</span>
            </button>
            <button
              type="button"
              className="snote-wb-icon-btn"
              onClick={() => setIsRightCollapsed(true)}
              title={t('common.close')}
            >
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="snote-wb-right-content">
            {rightTab === 'OUTLINE' && (
              <div className="snote-wb-outline-list">
                {outlineList.length === 0 ? (
                  <div className="snote-wb-empty-text">{language === 'vi' ? 'Chưa có tiêu đề mục (H1, H2, H3)' : 'No headings yet (H1, H2, H3)'}</div>
                ) : (
                  outlineList.map((item, idx) => (
                    <div
                      key={idx}
                      className={`snote-wb-outline-item depth-${item.level}`}
                    >
                      {item.title}
                    </div>
                  ))
                )}
              </div>
            )}

            {rightTab === 'HISTORY' && (
              <div className="snote-wb-history-quick">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ws-text-muted)' }}>
                    {snapshotsList.length} {language === 'vi' ? 'phiên bản' : 'versions'}
                  </span>
                  <button
                    type="button"
                    className="snote-wb-full-history-btn"
                    onClick={() => setIsHistoryModalOpen(true)}
                  >
                    {language === 'vi' ? 'Xem chi tiết ↗' : 'View details ↗'}
                  </button>
                </div>

                {snapshotsList.length === 0 ? (
                  <div className="snote-wb-empty-text">{language === 'vi' ? 'Chưa có mốc lịch sử nào' : 'No history checkpoints yet'}</div>
                ) : (
                  snapshotsList.slice(0, 10).map((snap) => (
                    <div
                      key={snap.id}
                      className="snote-wb-snap-mini-card"
                      onClick={() => setIsHistoryModalOpen(true)}
                    >
                      <div className="snote-wb-snap-mini-top">
                        <span className="snote-wb-snap-mini-time">{snap.formattedTime}</span>
                        <span className="snote-wb-snap-mini-date">{snap.formattedDate}</span>
                      </div>
                      <div className="snote-wb-snap-mini-sub">
                        <span>{snap.wordCount} {language === 'vi' ? 'từ' : 'words'}</span>
                        <span>•</span>
                        <span style={{ color: 'var(--ws-accent)' }}>{snap.type}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {rightTab === 'BACKLINKS' && (
              <div className="snote-wb-backlinks-list">
                {linkedBacklinks.length === 0 ? (
                  <div className="snote-wb-empty-text">{language === 'vi' ? 'Chưa có bài ghi nào liên kết tới bài này' : 'No notes linking to this one yet'}</div>
                ) : (
                  linkedBacklinks.map((b) => (
                    <div
                      key={b.id}
                      className="snote-wb-link-card"
                      onClick={() => {
                        setSelectedNote(b);
                        onSelectNote(b);
                      }}
                    >
                      <span className="snote-wb-link-title">{b.title || t('notes.untitled')}</span>
                      <ArrowUpRight size={12} style={{ color: 'var(--ws-text-faint)' }} />
                    </div>
                  ))
                )}
              </div>
            )}

            {rightTab === 'TAGS' && (
              <div className="snote-wb-tags-list">
                {noteTags.length === 0 ? (
                  <div className="snote-wb-empty-text">{language === 'vi' ? 'Chưa có thẻ gắn (#tag)' : 'No tags added yet (#tag)'}</div>
                ) : (
                  noteTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="snote-wb-tag-badge"
                      onClick={() => setSearchQuery(`#${tag}`)}
                    >
                      #{tag}
                    </span>
                  ))
                )}
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Note Version History & Restore Modal */}
      {selectedNote && (
        <NoteHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          noteId={selectedNote.id}
          currentTitle={editTitle}
          currentContent={editContent}
          onRestore={handleRestoreSnapshot}
        />
      )}
    </div>
  );
};
