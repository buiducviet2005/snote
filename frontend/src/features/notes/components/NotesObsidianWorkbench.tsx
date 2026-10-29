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
import { handleSmartListKeyDown } from '../utils/smartKeyboard';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import {
  Link2,
  ArrowUpRight,
  ListTree,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  Pin,
  Trash2,
  Share2,
  CheckSquare,
  CheckCircle2,
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
  const { user } = useAuth();
  const { t, language, formatDate } = useLanguage();

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
    } else if (selectedNote) {
      const updated = notes.find((n) => n.id === selectedNote.id);
      if (updated) setSelectedNote(updated);
    }
  }, [activeNoteId, notes]);

  // Collapsible panels (responsive defaults: collapse right inspector on tablet, collapse both on mobile)
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [isRightCollapsed, setIsRightCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);

  // Editor Mode: 'EDIT' (Live editor) or 'READ' (Reading view)
  const [editorMode, setEditorMode] = useState<'EDIT' | 'READ'>('EDIT');

  // Right Inspector Tab: 'BACKLINKS' | 'OUTGOING' | 'OUTLINE' | 'GRAPH'
  const [inspectorTab, setInspectorTab] = useState<'BACKLINKS' | 'OUTGOING' | 'OUTLINE' | 'GRAPH'>('BACKLINKS');

  // Left Explorer Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'PINNED' | 'PROJECT'>('ALL');

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
    if (!selectedNote || !canEditSelected) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        await onUpdateNote(selectedNote.id, {
          title: newTitle.trim() || t('notes.untitled'),
          content: newContent
        });
      } catch (err: any) {
        showToast(language === 'vi' ? 'Không thể lưu tự động' : 'Auto-save failed', 'error');
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
      showToast(language === 'vi' ? `Đã tạo liên kết hai chiều từ "${sourceNote.title}"!` : `Created bidirectional link from "${sourceNote.title}"!`, 'success');
    } catch {
      showToast(language === 'vi' ? 'Không thể tạo liên kết' : 'Failed to create link', 'error');
    }
  };

  // Canvas Local Graph Ref & Hit Regions
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const neighborNodesRef = useRef<Array<{ id: string; x: number; y: number; r: number; label: string }>>([]);

  const handleJumpToHeading = (headingTitle: string) => {
    if (textareaRef.current) {
      const text = textareaRef.current.value;
      const index = text.indexOf(headingTitle);
      if (index !== -1) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(index, index + headingTitle.length);
        const lineCountBefore = text.substring(0, index).split('\n').length;
        const approxScroll = (lineCountBefore - 2) * 22;
        textareaRef.current.scrollTop = Math.max(0, approxScroll);
      }
    }
    const viewerHeadings = document.querySelectorAll(
      '.markdown-body h1, .markdown-body h2, .markdown-body h3, .obs-center-pane h1, .obs-center-pane h2, .obs-center-pane h3'
    );
    for (const h of Array.from(viewerHeadings)) {
      if (h.textContent?.includes(headingTitle)) {
        h.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hit = neighborNodesRef.current.some((node) => {
      const dist = Math.hypot(node.x - x, node.y - y);
      return dist <= node.r + 4;
    });
    canvas.style.cursor = hit ? 'pointer' : 'default';
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hit = neighborNodesRef.current.find((node) => {
      const dist = Math.hypot(node.x - x, node.y - y);
      return dist <= node.r + 6;
    });
    if (hit) {
      const targetNote = notes.find((n) => n.id === hit.id);
      if (targetNote) {
        setSelectedNote(targetNote);
        onSelectNote(targetNote);
      }
    }
  };

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

    // Store neighbor node hit regions
    const nodeCoords: Array<{ id: string; x: number; y: number; r: number; label: string }> = [];

    // Draw lines & orbiting nodes
    neighbors.forEach((neighbor, i) => {
      const angle = (i / Math.max(count, 1)) * Math.PI * 2;
      const radius = Math.min(width, height) * 0.35;
      const nx = centerX + Math.cos(angle) * radius;
      const ny = centerY + Math.sin(angle) * radius;

      nodeCoords.push({ id: neighbor.id, x: nx, y: ny, r: 7, label: neighbor.label });

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
    ctx.fillText(language === 'vi' ? 'Đang xem' : 'Viewing', centerX, centerY + 24);
    neighborNodesRef.current = nodeCoords;
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
              <FileText size={14} style={{ color: 'var(--ws-accent)' }} />
              <span>{t('notes.vault_title')} ({notes.length})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                className="obs-new-note-btn"
                onClick={onCreateNote}
                title={t('notes.new_note_tooltip')}
              >
                <Plus size={12} />
                <span>{t('notes.new_note')}</span>
              </button>
              <button
                type="button"
                className="obs-collapse-btn"
                onClick={() => setIsLeftCollapsed(true)}
                title={t('notes.collapse_left_tooltip')}
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
              placeholder={t('notes.search_placeholder')}
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
              {t('notes.all')}
            </button>
            <button
              type="button"
              className={`obs-filter-pill ${filterType === 'PINNED' ? 'active' : ''}`}
              onClick={() => setFilterType('PINNED')}
            >
              {t('notes.pinned')}
            </button>
            <button
              type="button"
              className={`obs-filter-pill ${filterType === 'PROJECT' ? 'active' : ''}`}
              onClick={() => setFilterType('PROJECT')}
            >
              {t('notes.project')}
            </button>
          </div>
        </div>

        {/* Notes List */}
        <div className="obs-notes-list">
          {filteredNotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--ws-text-faint)', fontSize: 'var(--type-caption)' }}>
              {t('notes.no_notes_found')}
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
                    <span className="obs-note-item-title">{note.title || t('notes.untitled')}</span>
                    {note.isPinned && <Pin size={11} style={{ color: 'var(--ws-accent)', flexShrink: 0 }} />}
                  </div>

                  <span className="obs-note-item-snippet">
                    {note.content ? note.content.slice(0, 70).replace(/[#*`[\]]/g, '') : t('notes.no_content')}
                  </span>

                  <div className="obs-note-item-meta">
                    <span>{formatDate(note.updatedAt || note.createdAt)}</span>
                    {tags.slice(0, 2).map((tTag, idx) => (
                      <span key={idx} className="obs-tag-pill">#{tTag}</span>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ====================================================================
          2. CENTER WORKSPACE EDITOR & READER PANE (ZERO CLUTTER)
          ==================================================================== */}
      <main className="obs-center-pane" style={{ position: 'relative' }}>
        {/* Floating Unhide Triggers */}
        {isLeftCollapsed && (
          <button
            type="button"
            className="obs-unhide-floating-left"
            onClick={() => setIsLeftCollapsed(false)}
            title={t('notes.unhide_left_tooltip')}
          >
            <ChevronRight size={13} />
          </button>
        )}

        {isRightCollapsed && (
          <button
            type="button"
            className="obs-unhide-floating-right"
            onClick={() => setIsRightCollapsed(false)}
            title={t('notes.unhide_right_tooltip')}
          >
            <ChevronLeft size={13} />
          </button>
        )}

        {/* Main Content Area */}
        <div className="obs-canvas-body">
          {!selectedNote ? (
            <div style={{ textAlign: 'center', padding: '120px 20px', color: 'var(--ws-text-muted)' }}>
              <i>{t('notes.select_prompt')}</i>
            </div>
          ) : (
            <>
              {/* Obsidian Inline Document Header */}
              <div className="obs-doc-header">
                <input
                  type="text"
                  className="obs-doc-title-input"
                  value={editTitle}
                  onChange={handleTitleChange}
                  readOnly={!canEditSelected}
                  placeholder={t('notes.title_placeholder')}
                />
                <div className="obs-doc-tools">
                  {canEditSelected && (
                    <span
                      style={{
                        fontSize: 'var(--type-micro, 11px)',
                        color: isSaving ? 'var(--accent-primary)' : 'var(--ws-text-muted)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: isSaving ? 'var(--accent-subtle)' : 'transparent',
                        whiteSpace: 'nowrap',
                        marginRight: '4px',
                        flexShrink: 0
                      }}
                      title={isSaving ? (language === 'vi' ? 'Đang lưu bài giảng...' : 'Saving note...') : (language === 'vi' ? 'Tất cả thay đổi đã được lưu' : 'All changes saved')}
                    >
                      {isSaving ? (
                        <>
                          <Sparkles size={11} className="pulse-urgent" />
                          <span>{language === 'vi' ? 'Đang lưu...' : 'Saving...'}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={11} style={{ color: 'var(--color-success)' }} />
                          <span>{language === 'vi' ? 'Đã lưu' : 'Saved'}</span>
                        </>
                      )}
                    </span>
                  )}
                  {canEditSelected && <button
                    type="button"
                    className={`obs-doc-tool-btn ${editorMode === 'READ' ? 'active' : ''}`}
                    onClick={() => setEditorMode(editorMode === 'EDIT' ? 'READ' : 'EDIT')}
                    title={editorMode === 'EDIT' ? t('notes.reading_mode') : t('notes.edit_mode')}
                    aria-label={editorMode === 'EDIT' ? t('notes.reading_mode') : t('notes.edit_mode')}
                  >
                    {editorMode === 'EDIT' ? <Eye size={14} /> : <Edit3 size={14} />}
                  </button>}
                  {canEditSelected && <button
                    type="button"
                    className={`obs-doc-tool-btn ${selectedNote.isPinned ? 'active' : ''}`}
                    onClick={() => onTogglePin(selectedNote.id)}
                    title={selectedNote.isPinned ? t('notes.unpin') : t('notes.pin')}
                    aria-label={selectedNote.isPinned ? t('notes.unpin') : t('notes.pin')}
                  >
                    <Pin size={14} style={{ color: selectedNote.isPinned ? 'var(--ws-accent)' : undefined }} />
                  </button>}
                  {canEditSelected && onConvertToTask && (
                    <button
                      type="button"
                      className="obs-doc-tool-btn"
                      onClick={() => onConvertToTask(selectedNote)}
                      title={t('notes.convert_to_task')}
                      aria-label={t('notes.convert_to_task')}
                    >
                      <CheckSquare size={14} />
                    </button>
                  )}
                  {onShareNote && (
                    <button
                      type="button"
                      className="obs-doc-tool-btn"
                      onClick={() => onShareNote(selectedNote)}
                      title={t('notes.share')}
                      aria-label={t('notes.share')}
                    >
                      <Share2 size={14} />
                    </button>
                  )}
                  {canEditSelected && <button
                    type="button"
                    className="obs-doc-tool-btn danger"
                    onClick={() => onDeleteNote(selectedNote.id)}
                    title={t('notes.delete_note')}
                    aria-label={t('notes.delete_note')}
                  >
                    <Trash2 size={14} />
                  </button>}
                </div>
              </div>

              {editorMode === 'EDIT' && canEditSelected ? (
            <textarea
              ref={textareaRef}
              className="obs-editor-textarea"
              placeholder={t('notes.content_placeholder')}
              value={editContent}
              onChange={handleContentChange}
              onKeyDown={(e) => {
                handleSmartListKeyDown(e, editContent, (newContent) => {
                  setEditContent(newContent);
                  triggerAutosave(editTitle, newContent);
                });
              }}
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
                  showToast(language === 'vi' ? `Chưa tìm thấy ghi chú "${target}"` : `Note "${target}" not found`, 'info');
                }
              }}
              onSelectTag={(tag) => {
                setSearchQuery(`#${tag}`);
              }}
            />
          )}
            </>
          )}
        </div>

        {/* 4. Bottom Status Bar */}
        <footer className="obs-status-bar">
          <div className="obs-status-left">
            <span>{t('notes.word_count', { words: wordsCount })}</span>
            <span style={{ opacity: 0.35 }}>•</span>
            <span>{t('notes.character_count', { chars: editContent.length })}</span>
            <span style={{ opacity: 0.35 }}>•</span>
            <span>{linkedBacklinks.length} {language === 'vi' ? 'liên kết' : 'links'}</span>
            <span style={{ opacity: 0.35 }}>•</span>
            <span>~{Math.ceil(Math.max(wordsCount, 1) / 200)} {language === 'vi' ? 'phút đọc' : 'min read'}</span>
          </div>
          <div className="obs-status-right">
            <span>{isSaving ? (language === 'vi' ? 'Đang lưu...' : 'Saving...') : (language === 'vi' ? 'Đã lưu' : 'Saved')}</span>
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
            title={t('notes.backlinks')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Link2 size={12} />
            <span>{t('notes.backlinks')}</span>
            {linkedBacklinks.length > 0 && <span className="obs-badge-count">{linkedBacklinks.length}</span>}
          </button>
          <button
            type="button"
            className={`obs-right-tab ${inspectorTab === 'OUTGOING' ? 'active' : ''}`}
            onClick={() => setInspectorTab('OUTGOING')}
            title={t('notes.outgoing')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <ArrowUpRight size={12} />
            <span>{t('notes.outgoing')}</span>
            {outgoingLinks.length > 0 && <span className="obs-badge-count">{outgoingLinks.length}</span>}
          </button>
          <button
            type="button"
            className={`obs-right-tab ${inspectorTab === 'OUTLINE' ? 'active' : ''}`}
            onClick={() => setInspectorTab('OUTLINE')}
            title={t('notes.outline')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <ListTree size={12} />
            <span>{t('notes.outline')}</span>
          </button>
          <button
            type="button"
            className={`obs-right-tab ${inspectorTab === 'GRAPH' ? 'active' : ''}`}
            onClick={() => setInspectorTab('GRAPH')}
            title={t('notes.graph')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Share2 size={12} />
            <span>{t('notes.graph')}</span>
          </button>
          <button
            type="button"
            className="obs-collapse-btn"
            onClick={() => setIsRightCollapsed(true)}
            title={t('common.close')}
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
                  <span>{t('notes.linked_mentions', { count: linkedBacklinks.length })}</span>
                </div>
                {linkedBacklinks.length === 0 ? (
                  <div style={{ fontSize: 'var(--type-caption)', color: 'var(--ws-text-faint)', fontStyle: 'italic' }}>
                    {t('notes.no_backlinks')}
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: 'var(--type-caption)', fontWeight: 600, color: 'var(--ws-accent)' }}>
                          {b.title || t('notes.untitled')}
                        </span>
                        <span style={{ fontSize: 'var(--type-caption)', color: 'var(--ws-text-faint)' }}>
                          {b.content ? b.content.slice(0, 50).replace(/[#*`[\]]/g, '') + '...' : ''}
                        </span>
                      </div>
                      <span style={{ fontSize: 'var(--type-caption)', color: 'var(--ws-text-faint)' }}>{language === 'vi' ? 'Mở ↗' : 'Open ↗'}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Unlinked Mentions (Obsidian Superpower) */}
              <div className="obs-inspector-section" style={{ marginTop: '12px' }}>
                <div className="obs-section-title">
                  <span>{t('notes.unlinked_mentions', { count: unlinkedMentions.length })}</span>
                </div>
                {unlinkedMentions.length === 0 ? (
                  <div style={{ fontSize: 'var(--type-caption)', color: 'var(--ws-text-faint)', fontStyle: 'italic' }}>
                    {language === 'vi' ? 'Không có nhắc đến chưa liên kết.' : 'No unlinked mentions found.'}
                  </div>
                ) : (
                  unlinkedMentions.map((u) => (
                    <div key={u.id} className="obs-unlinked-card">
                      <span style={{ fontSize: 'var(--type-caption)', fontWeight: 600, color: 'var(--ws-text-main)' }}>
                        {u.title}
                      </span>
                      <button
                        type="button"
                        className="obs-link-create-btn"
                        onClick={() => handleLinkMention(u)}
                        title={t('notes.one_click_link')}
                      >
                        <Link size={10} />
                        <span>{t('notes.one_click_link')}</span>
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
                <span>{t('notes.outgoing')} ({outgoingLinks.length})</span>
              </div>
              {outgoingLinks.length === 0 ? (
                <div style={{ fontSize: 'var(--type-caption)', color: 'var(--ws-text-faint)', fontStyle: 'italic' }}>
                  {t('notes.no_outgoing')}
                </div>
              ) : (
                outgoingLinks.map((link, idx) => {
                  const match = notes.find((n) => n.title?.trim().toLowerCase() === link.target.toLowerCase());
                  return (
                    <div
                      key={idx}
                      className="obs-link-card"
                      onClick={() => {
                        if (match) {
                          setSelectedNote(match);
                          onSelectNote(match);
                        } else {
                          onCreateNote();
                          showToast(language === 'vi' ? `Đang tạo bài ghi mới "${link.target}"` : `Creating new note "${link.target}"`, 'info');
                        }
                      }}
                    >
                      <span style={{ fontSize: 'var(--type-caption)', fontWeight: 600, color: match ? '#38bdf8' : 'var(--text-muted)' }}>
                        📎 {link.alias || link.target}
                      </span>
                      <span style={{ fontSize: 'var(--type-caption)', color: match ? 'var(--ws-text-faint)' : 'var(--ws-accent)' }}>
                        {match ? (language === 'vi' ? 'Nhảy tới ↗' : 'Jump to ↗') : `+ ${t('notes.new_note')}`}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: OUTLINE (TABLE OF CONTENTS) */}
          {inspectorTab === 'OUTLINE' && (
            <div className="obs-inspector-section">
              <div className="obs-section-title">
                <span>{t('notes.outline')} ({outlineList.length})</span>
              </div>
              {outlineList.length === 0 ? (
                <div style={{ fontSize: 'var(--type-caption)', color: 'var(--ws-text-faint)', fontStyle: 'italic' }}>
                  {t('notes.no_outline')}
                </div>
              ) : (
                outlineList.map((h, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleJumpToHeading(h.title)}
                    className="obs-outline-item"
                    style={{
                      paddingLeft: `${(h.level - 1) * 14}px`,
                      fontSize: h.level === 1 ? '12px' : '11px',
                      fontWeight: h.level === 1 ? 700 : 500,
                      color: h.level === 1 ? 'var(--ws-text-main)' : 'var(--ws-text-muted)',
                      lineHeight: 1.6,
                      cursor: 'pointer',
                      paddingTop: '3px',
                      paddingBottom: '3px',
                      borderRadius: '4px',
                      transition: 'background-color 0.1s ease'
                    }}
                    title={language === 'vi' ? 'Nhấn để cuộn đến tiêu đề này trong bài' : 'Click to jump to this heading'}
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
                <span>{t('notes.graph')}</span>
              </div>
              <canvas
                ref={canvasRef}
                width={260}
                height={220}
                onMouseMove={handleCanvasMouseMove}
                onClick={handleCanvasClick}
                style={{
                  width: '100%',
                  height: '220px',
                  background: 'var(--ws-bg-app)',
                  borderRadius: '6px',
                  border: '1px solid var(--ws-border-hairline)',
                  marginTop: '8px'
                }}
              />
              <span style={{ fontSize: 'var(--type-caption)', color: 'var(--ws-text-faint)', marginTop: '6px' }}>
                {t('notes.graph_desc')}
              </span>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
