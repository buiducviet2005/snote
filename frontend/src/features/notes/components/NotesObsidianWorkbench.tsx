import React, { useState, useEffect, useMemo, useRef } from 'react';
import './NotesObsidianWorkbench.css';
import { MarkdownViewer } from '../../../components/common/MarkdownViewer';
import {
  extractWikiLinks,
  extractTags,
  extractOutline,
  autoFormatPlainTextToMarkdown,
  OutlineHeading,
  WikiLink
} from '../utils/smartNoteParser';
import { useToast } from '../../../contexts/ToastContext';
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Edit3,
  BookOpen,
  Pin,
  Trash2,
  Share2,
  CheckSquare,
  List,
  Link,
  Clock,
  Sparkles,
  Layers,
  FileText,
  FolderGit2,
  GraduationCap
} from 'lucide-react';

interface NotesObsidianWorkbenchProps {
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

export const NotesObsidianWorkbench: React.FC<NotesObsidianWorkbenchProps> = ({
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
  const { showToast } = useToast();

  // Active note selection
  const [selectedNote, setSelectedNote] = useState<any | null>(null);

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
    } else if (selectedNote) {
      const updated = notes.find((n) => n.id === selectedNote.id);
      if (updated) setSelectedNote(updated);
    }
  }, [activeNoteId, notes]);

  // Collapsible panels
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  // Editor Mode: 'EDIT' (Live editor) or 'READ' (Reading view)
  const [editorMode, setEditorMode] = useState<'EDIT' | 'READ'>('EDIT');

  // Right Inspector Tab: 'BACKLINKS' | 'OUTGOING' | 'OUTLINE' | 'GRAPH'
  const [inspectorTab, setInspectorTab] = useState<'BACKLINKS' | 'OUTGOING' | 'OUTLINE' | 'GRAPH'>('BACKLINKS');

  // Left Explorer Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'PINNED' | 'SUBJECT' | 'PROJECT'>('ALL');

  // Editor State
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (selectedNote) {
      setEditTitle(selectedNote.title || '');
      setEditContent(selectedNote.content || '');
    } else {
      setEditTitle('');
      setEditContent('');
    }
  }, [selectedNote?.id]);

  // Autosave Debounce (750ms)
  const triggerAutosave = (newTitle: string, newContent: string) => {
    if (!selectedNote) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        await onUpdateNote(selectedNote.id, {
          title: newTitle.trim() || 'Ghi chú không tên',
          content: newContent
        });
      } catch (err: any) {
        showToast('Không thể lưu tự động', 'error');
      } finally {
        setIsSaving(false);
      }
    }, 750);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEditTitle(val);
    triggerAutosave(val, editContent);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setEditContent(val);
    triggerAutosave(editTitle, val);
  };

  // Insert helper text at cursor
  const insertText = (prefix: string, suffix: string = '', defaultVal: string = '') => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selected = editContent.substring(start, end);
    const middle = selected || defaultVal;
    const nextContent = editContent.substring(0, start) + prefix + middle + suffix + editContent.substring(end);
    setEditContent(nextContent);
    triggerAutosave(editTitle, nextContent);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + prefix.length, start + prefix.length + middle.length);
      }
    }, 20);
  };

  // Filter notes in left pane
  const filteredNotes = useMemo(() => {
    let list = notes;
    if (filterType === 'PINNED') {
      list = list.filter((n) => n.isPinned);
    } else if (filterType === 'SUBJECT') {
      list = list.filter((n) => Boolean(n.subjectId));
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

  // Obsidian Analyses for active note
  const currentTitleLower = (selectedNote?.title || '').trim().toLowerCase();

  // 1. Linked Mentions (Backlinks)
  const linkedBacklinks = useMemo(() => {
    if (!selectedNote || !currentTitleLower) return [];
    return notes.filter((other) => {
      if (other.id === selectedNote.id) return false;
      const links = extractWikiLinks(other.content || '');
      return links.some((l) => l.target.toLowerCase() === currentTitleLower || l.target === selectedNote.id);
    });
  }, [selectedNote, currentTitleLower, notes]);

  // 2. Unlinked Mentions (Obsidian Superpower: notes that have current title text but NOT in [[...]])
  const unlinkedMentions = useMemo(() => {
    if (!selectedNote || !currentTitleLower || currentTitleLower.length < 3) return [];
    return notes.filter((other) => {
      if (other.id === selectedNote.id) return false;
      const content = other.content || '';
      const contentLower = content.toLowerCase();
      // Contains the phrase
      if (!contentLower.includes(currentTitleLower)) return false;
      // But not already a [[wiki link]]
      const links = extractWikiLinks(content);
      const isAlreadyLinked = links.some((l) => l.target.toLowerCase() === currentTitleLower);
      return !isAlreadyLinked;
    });
  }, [selectedNote, currentTitleLower, notes]);

  // 3. Outgoing Links
  const outgoingLinks = useMemo(() => {
    return extractWikiLinks(editContent || '');
  }, [editContent]);

  // 4. Outline / Table of Contents
  const outlineList = useMemo(() => {
    return extractOutline(editContent || '');
  }, [editContent]);

  // 5. Tags
  const noteTags = useMemo(() => {
    return extractTags(editContent || '');
  }, [editContent]);

  // Word count & metrics
  const wordsCount = useMemo(() => {
    const text = editContent.trim();
    if (!text) return 0;
    return text.split(/\s+/).length;
  }, [editContent]);

  // 1-Click Convert Unlinked Mention to [[Wiki Link]]
  const handleLinkMention = async (sourceNote: any) => {
    try {
      const targetRegex = new RegExp(`(?<!\\[\\[)(${selectedNote.title})(?!\\]\\])`, 'gi');
      const updatedContent = (sourceNote.content || '').replace(targetRegex, `[[$1]]`);
      await onUpdateNote(sourceNote.id, { content: updatedContent });
      showToast(`Đã tạo liên kết hai chiều từ "${sourceNote.title}"!`, 'success');
    } catch {
      showToast('Không thể tạo liên kết', 'error');
    }
  };

  // Canvas Local Graph Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render Mini Local Graph in Right Pane
  useEffect(() => {
    if (inspectorTab !== 'GRAPH' || isRightCollapsed || !selectedNote || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;

    // Neighbor nodes (linked backlinks + outgoing targets)
    const neighborMap = new Map<string, { id: string; label: string }>();
    linkedBacklinks.forEach((b) => neighborMap.set(b.id, { id: b.id, label: b.title || 'Untitled' }));
    outgoingLinks.forEach((l) => {
      const match = notes.find((n) => n.title?.trim().toLowerCase() === l.target.toLowerCase());
      if (match && match.id !== selectedNote.id) {
        neighborMap.set(match.id, { id: match.id, label: match.title || 'Untitled' });
      }
    });

    const neighbors = Array.from(neighborMap.values());
    const count = neighbors.length;

    // Draw lines & orbiting nodes
    neighbors.forEach((neighbor, i) => {
      const angle = (i / Math.max(count, 1)) * Math.PI * 2;
      const radius = Math.min(width, height) * 0.35;
      const nx = centerX + Math.cos(angle) * radius;
      const ny = centerY + Math.sin(angle) * radius;

      // Draw spring line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw neighbor circle
      ctx.beginPath();
      ctx.arc(nx, ny, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#60a5fa';
      ctx.fill();

      // Label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      const truncLabel = neighbor.label.length > 10 ? neighbor.label.slice(0, 9) + '…' : neighbor.label;
      ctx.fillText(truncLabel, nx, ny + 15);
    });

    // Draw central active node
    ctx.beginPath();
    ctx.arc(centerX, centerY, 13, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Center label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Đang xem', centerX, centerY + 24);
  }, [inspectorTab, isRightCollapsed, selectedNote, linkedBacklinks, outgoingLinks, notes]);

  return (
    <div className="obs-workbench">
      {/* ====================================================================
          1. LEFT EXPLORER PANE (260px)
          ==================================================================== */}
      <aside className={`obs-left-pane ${isLeftCollapsed ? 'collapsed' : ''}`}>
        <div className="obs-left-header">
          <div className="obs-left-header-top">
            <div className="obs-left-title">
              <BookOpen size={14} style={{ color: 'var(--ws-accent)' }} />
              <span>Kho Bài Ghi ({notes.length})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                className="obs-new-note-btn"
                onClick={onCreateNote}
                title="Tạo bài ghi chép mới"
              >
                <Plus size={12} />
                <span>Mới</span>
              </button>
              <button
                type="button"
                className="obs-collapse-btn"
                onClick={() => setIsLeftCollapsed(true)}
                title="Gập thanh duyệt bài (Ctrl + \)"
              >
                <ChevronLeft size={14} />
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="obs-search-wrap">
            <Search size={12} className="obs-search-icon" />
            <input
              type="text"
              className="obs-search-input"
              placeholder="Tìm theo tên hoặc #tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Pills */}
          <div className="obs-filter-pills">
            <button
              type="button"
              className={`obs-filter-pill ${filterType === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterType('ALL')}
            >
              Tất cả
            </button>
            <button
              type="button"
              className={`obs-filter-pill ${filterType === 'PINNED' ? 'active' : ''}`}
              onClick={() => setFilterType('PINNED')}
            >
              📌 Ghim
            </button>
            <button
              type="button"
              className={`obs-filter-pill ${filterType === 'SUBJECT' ? 'active' : ''}`}
              onClick={() => setFilterType('SUBJECT')}
            >
              Lớp học
            </button>
            <button
              type="button"
              className={`obs-filter-pill ${filterType === 'PROJECT' ? 'active' : ''}`}
              onClick={() => setFilterType('PROJECT')}
            >
              Đồ án
            </button>
          </div>
        </div>

        {/* Notes List */}
        <div className="obs-notes-list">
          {filteredNotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--ws-text-faint)', fontSize: '11px' }}>
              Không tìm thấy bài ghi nào phù hợp.
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isSelected = selectedNote?.id === note.id;
              const tags = extractTags(note.content || '');
              return (
                <div
                  key={note.id}
                  className={`obs-note-item ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedNote(note);
                    onSelectNote(note);
                  }}
                >
                  <div className="obs-note-item-top">
                    <span className="obs-note-item-title">{note.title || 'Ghi chú không tên'}</span>
                    {note.isPinned && <Pin size={11} style={{ color: 'var(--ws-accent)', flexShrink: 0 }} />}
                  </div>

                  <span className="obs-note-item-snippet">
                    {note.content ? note.content.slice(0, 70).replace(/[#*`[\]]/g, '') : 'Chưa có nội dung...'}
                  </span>

                  <div className="obs-note-item-meta">
                    <span>{new Date(note.updatedAt || note.createdAt).toLocaleDateString('vi-VN')}</span>
                    {tags.slice(0, 2).map((t, idx) => (
                      <span key={idx} className="obs-tag-pill">#{t}</span>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ====================================================================
          2. CENTER WORKSPACE EDITOR & READER PANE
          ==================================================================== */}
      <main className="obs-center-pane">
        {/* Top Header Toolbar */}
        <header className="obs-center-header">
          <div className="obs-center-header-left">
            {isLeftCollapsed && (
              <button
                type="button"
                className="obs-unhide-btn"
                onClick={() => setIsLeftCollapsed(false)}
                title="Hiện lại ngăn duyệt bài"
              >
                <ChevronRight size={14} />
              </button>
            )}

            {/* Live Editable Title Input */}
            <input
              type="text"
              className="obs-title-input"
              value={editTitle}
              onChange={handleTitleChange}
              placeholder="Nhập tiêu đề ghi chú..."
              disabled={!selectedNote}
            />
          </div>

          {/* Right Header Actions */}
          <div className="obs-center-header-tools">
            {/* Live Preview vs Reading View Mode Switcher */}
            <div className="obs-mode-switcher">
              <button
                type="button"
                className={`obs-mode-btn ${editorMode === 'EDIT' ? 'active' : ''}`}
                onClick={() => setEditorMode('EDIT')}
                title="Chế độ soạn thảo trực tiếp"
              >
                <Edit3 size={12} />
                <span>Soạn thảo</span>
              </button>
              <button
                type="button"
                className={`obs-mode-btn ${editorMode === 'READ' ? 'active' : ''}`}
                onClick={() => setEditorMode('READ')}
                title="Chế độ đọc tĩnh chuẩn Markdown"
              >
                <BookOpen size={12} />
                <span>Xem đọc</span>
              </button>
            </div>

            {selectedNote && (
              <>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => onTogglePin(selectedNote.id)}
                  title={selectedNote.isPinned ? 'Bỏ ghim' : 'Ghim bài ghi'}
                >
                  <Pin size={13} style={{ color: selectedNote.isPinned ? 'var(--ws-accent)' : undefined }} />
                </button>

                {onShareNote && (
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => onShareNote(selectedNote)}
                    title="Chia sẻ ghi chú"
                  >
                    <Share2 size={13} />
                  </button>
                )}

                {onConvertToTask && (
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => onConvertToTask(selectedNote)}
                    title="Chuyển thành Công việc (Task)"
                  >
                    <CheckSquare size={13} style={{ color: 'var(--color-success)' }} />
                  </button>
                )}

                <button
                  type="button"
                  className="icon-button"
                  onClick={() => onDeleteNote(selectedNote.id)}
                  title="Xóa ghi chú"
                >
                  <Trash2 size={13} style={{ color: '#ef4444' }} />
                </button>
              </>
            )}

            {isRightCollapsed && (
              <button
                type="button"
                className="obs-unhide-btn"
                onClick={() => setIsRightCollapsed(false)}
                title="Hiện ngăn thanh tra tri thức (Inspector)"
              >
                <ChevronLeft size={14} />
              </button>
            )}
          </div>
        </header>

        {/* Quick Formatting Bar (Obsidian Style) */}
        {editorMode === 'EDIT' && (
          <div className="obs-format-bar">
            <button
              type="button"
              className="obs-fmt-btn obs-fmt-wiki"
              onClick={() => insertText('[[', ']]', 'Tên ghi chú liên kết')}
              title="Chèn liên kết hai chiều [[Tên bài ghi]]"
            >
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800 }}>[[ ]]</span>
              <span>Wiki-Link</span>
            </button>

            <button
              type="button"
              className="obs-fmt-btn obs-fmt-tag"
              onClick={() => insertText('#', '', 'tag')}
              title="Chèn thẻ phân loại #tag"
            >
              <span style={{ fontWeight: 800 }}>#</span>
              <span>Tag</span>
            </button>

            <button
              type="button"
              className="obs-fmt-btn"
              onClick={() => insertText('- [ ] ', '', 'Công việc cần làm')}
              title="Chèn hộp kiểm việc cần làm [ ]"
            >
              <CheckSquare size={12} />
              <span>Việc cần làm</span>
            </button>

            <button
              type="button"
              className="obs-fmt-btn"
              onClick={() => insertText('- ', '', 'Mục danh sách')}
              title="Chèn danh sách đầu dòng"
            >
              <List size={12} />
              <span>Danh sách</span>
            </button>

            <button
              type="button"
              className="obs-fmt-btn"
              onClick={() => insertText('**', '**', 'chữ in đậm')}
              title="In đậm chữ"
            >
              <strong>B</strong>
              <span>In đậm</span>
            </button>

            <button
              type="button"
              className="obs-fmt-btn"
              onClick={() => insertText('```\n', '\n```', 'mã code')}
              title="Chèn khối mã nguồn"
            >
              <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{'</>'}</span>
              <span>Khối mã</span>
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="obs-canvas-body">
          {!selectedNote ? (
            <div style={{ textAlign: 'center', padding: '120px 20px', color: 'var(--ws-text-muted)' }}>
              <i>Chọn một ghi chú ở cột bên trái hoặc bấm <b>"+ Mới"</b> để bắt đầu soạn thảo.</i>
            </div>
          ) : editorMode === 'EDIT' ? (
            <textarea
              ref={textareaRef}
              className="obs-editor-textarea"
              placeholder="Bắt đầu ghi chép học tập... Gõ [[ để liên kết bài khác, # để gắn thẻ..."
              value={editContent}
              onChange={handleContentChange}
            />
          ) : (
            <MarkdownViewer
              content={editContent}
              onNavigateWikiLink={(target) => {
                const targetLower = target.trim().toLowerCase();
                const found = notes.find((n) => n.title?.trim().toLowerCase() === targetLower || n.id === target);
                if (found) {
                  setSelectedNote(found);
                  onSelectNote(found);
                } else {
                  showToast(`Chưa tìm thấy ghi chú "${target}"`, 'info');
                }
              }}
              onSelectTag={(tag) => {
                setSearchQuery(`#${tag}`);
              }}
            />
          )}
        </div>

        {/* 4. Bottom Status Bar */}
        <footer className="obs-status-bar">
          <div className="obs-status-left">
            <span>📝 {wordsCount} từ</span>
            <span>🔤 {editContent.length} ký tự</span>
            <span>🔗 {linkedBacklinks.length} backlinks</span>
            <span>⏱️ ~{Math.ceil(Math.max(wordsCount, 1) / 200)} phút đọc</span>
          </div>
          <div className="obs-status-right">
            <span>{isSaving ? 'Đang lưu...' : '✓ Đã lưu'}</span>
          </div>
        </footer>
      </main>

      {/* ====================================================================
          3. RIGHT INSPECTOR PANE (280px)
          ==================================================================== */}
      <aside className={`obs-right-pane ${isRightCollapsed ? 'collapsed' : ''}`}>
        <div className="obs-right-tabs">
          <button
            type="button"
            className={`obs-right-tab ${inspectorTab === 'BACKLINKS' ? 'active' : ''}`}
            onClick={() => setInspectorTab('BACKLINKS')}
            title="Liên kết ngược (Backlinks)"
          >
            <span>Backlinks</span>
            {linkedBacklinks.length > 0 && <span className="obs-badge-count">{linkedBacklinks.length}</span>}
          </button>
          <button
            type="button"
            className={`obs-right-tab ${inspectorTab === 'OUTGOING' ? 'active' : ''}`}
            onClick={() => setInspectorTab('OUTGOING')}
            title="Liên kết trỏ đi (Outgoing)"
          >
            <span>Trỏ đi</span>
            {outgoingLinks.length > 0 && <span className="obs-badge-count">{outgoingLinks.length}</span>}
          </button>
          <button
            type="button"
            className={`obs-right-tab ${inspectorTab === 'OUTLINE' ? 'active' : ''}`}
            onClick={() => setInspectorTab('OUTLINE')}
            title="Mục lục bài viết"
          >
            <span>Mục lục</span>
          </button>
          <button
            type="button"
            className={`obs-right-tab ${inspectorTab === 'GRAPH' ? 'active' : ''}`}
            onClick={() => setInspectorTab('GRAPH')}
            title="Bản đồ mạng lưới vệ tinh (Local Graph)"
          >
            <span>Graph</span>
          </button>
          <button
            type="button"
            className="obs-collapse-btn"
            onClick={() => setIsRightCollapsed(true)}
            title="Gập ngăn thanh tra"
          >
            <ChevronRight size={13} />
          </button>
        </div>

        <div className="obs-right-content">
          {/* TAB 1: BACKLINKS (LINKED & UNLINKED MENTIONS) */}
          {inspectorTab === 'BACKLINKS' && (
            <>
              {/* Linked Mentions */}
              <div className="obs-inspector-section">
                <div className="obs-section-title">
                  <span>Liên kết ngược ({linkedBacklinks.length})</span>
                </div>
                {linkedBacklinks.length === 0 ? (
                  <div style={{ fontSize: '11px', color: 'var(--ws-text-faint)', fontStyle: 'italic' }}>
                    Chưa có bài nào liên kết đến bài này bằng <code>[[{selectedNote?.title || 'Tên'}]]</code>.
                  </div>
                ) : (
                  linkedBacklinks.map((b) => (
                    <div
                      key={b.id}
                      className="obs-link-card"
                      onClick={() => {
                        setSelectedNote(b);
                        onSelectNote(b);
                      }}
                    >
                      <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--ws-accent)' }}>
                        {b.title || 'Untitled'}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--ws-text-faint)' }}>Mở ↗</span>
                    </div>
                  ))
                )}
              </div>

              {/* Unlinked Mentions (Obsidian Superpower) */}
              <div className="obs-inspector-section" style={{ marginTop: '12px' }}>
                <div className="obs-section-title">
                  <span>Chưa liên kết ({unlinkedMentions.length})</span>
                </div>
                {unlinkedMentions.length === 0 ? (
                  <div style={{ fontSize: '11px', color: 'var(--ws-text-faint)', fontStyle: 'italic' }}>
                    Không có nhắc đến chưa liên kết.
                  </div>
                ) : (
                  unlinkedMentions.map((u) => (
                    <div key={u.id} className="obs-unlinked-card">
                      <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--ws-text-main)' }}>
                        {u.title}
                      </span>
                      <button
                        type="button"
                        className="obs-link-create-btn"
                        onClick={() => handleLinkMention(u)}
                        title="Bọc tiêu đề bài vào [[...]] để tạo liên kết hai chiều"
                      >
                        <Link size={10} />
                        <span>Tạo liên kết</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* TAB 2: OUTGOING LINKS */}
          {inspectorTab === 'OUTGOING' && (
            <div className="obs-inspector-section">
              <div className="obs-section-title">
                <span>Liên kết trỏ đi ({outgoingLinks.length})</span>
              </div>
              {outgoingLinks.length === 0 ? (
                <div style={{ fontSize: '11px', color: 'var(--ws-text-faint)', fontStyle: 'italic' }}>
                  Bài này chưa liên kết bài nào. Gõ <code>[[Tên bài]]</code> để liên kết.
                </div>
              ) : (
                outgoingLinks.map((link, idx) => (
                  <div
                    key={idx}
                    className="obs-link-card"
                    onClick={() => {
                      const match = notes.find((n) => n.title?.trim().toLowerCase() === link.target.toLowerCase());
                      if (match) {
                        setSelectedNote(match);
                        onSelectNote(match);
                      } else {
                        showToast(`Chưa có bài ghi "${link.target}"`, 'info');
                      }
                    }}
                  >
                    <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#38bdf8' }}>
                      📎 {link.alias || link.target}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--ws-text-faint)' }}>Nhảy tới ↗</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: OUTLINE (TABLE OF CONTENTS) */}
          {inspectorTab === 'OUTLINE' && (
            <div className="obs-inspector-section">
              <div className="obs-section-title">
                <span>Mục lục bài viết ({outlineList.length})</span>
              </div>
              {outlineList.length === 0 ? (
                <div style={{ fontSize: '11px', color: 'var(--ws-text-faint)', fontStyle: 'italic' }}>
                  Chưa có tiêu đề. Dùng <code># Tiêu đề 1</code> hoặc <code>## Tiêu đề 2</code>.
                </div>
              ) : (
                outlineList.map((h, idx) => (
                  <div
                    key={idx}
                    style={{
                      paddingLeft: `${(h.level - 1) * 14}px`,
                      fontSize: h.level === 1 ? '12px' : '11px',
                      fontWeight: h.level === 1 ? 700 : 500,
                      color: h.level === 1 ? 'var(--ws-text-main)' : 'var(--ws-text-muted)',
                      lineHeight: 1.4
                    }}
                  >
                    • {h.title}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: LOCAL GRAPH */}
          {inspectorTab === 'GRAPH' && (
            <div className="obs-inspector-section" style={{ alignItems: 'center' }}>
              <div className="obs-section-title" style={{ width: '100%' }}>
                <span>Mạng lưới vệ tinh (Local Graph)</span>
              </div>
              <canvas
                ref={canvasRef}
                width={260}
                height={220}
                style={{
                  width: '100%',
                  height: '220px',
                  background: 'var(--ws-bg-app)',
                  borderRadius: '6px',
                  border: '1px solid var(--ws-border-hairline)',
                  marginTop: '8px'
                }}
              />
              <span style={{ fontSize: '10px', color: 'var(--ws-text-faint)', marginTop: '6px' }}>
                Hiển thị bài đang xem và các bài liên kết trực tiếp
              </span>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
