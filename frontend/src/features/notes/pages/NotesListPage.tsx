import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api, ApiResponse } from '../../../services/api';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useToast } from '../../../contexts/ToastContext';
import { NoteCard } from '../components/NoteCard';
import { NoteModal, NoteModalMode } from '../components/NoteModal';
import { MarkdownViewer } from '../../../components/common/MarkdownViewer';
import { NoteType } from '@snote/shared';
import {
  BookOpen,
  Plus,
  Search,
  Pin,
  Archive,
  Layers,
  Filter,
  X,
  Grid,
  List,
  LayoutGrid,
  Columns,
  Kanban,
  Sparkles,
  Folder,
  FolderKanban,
  FileText,
  Calendar,
  Clock,
  Trash2,
  Edit3,
  Eye,
  Tag,
  CheckCircle2,
  SlidersHorizontal,
  Bookmark,
  Send,
  Copy,
  Check,
  Flame,
  Zap,
  ArrowUpDown,
  BookMarked
} from 'lucide-react';

export type NoteViewDensity = 'GRID' | 'COMPACT' | 'LIST' | 'SPLIT' | 'KANBAN';

export const NotesListPage: React.FC = () => {
  const { selectedSubjectId, selectedSemesterId, subjects } = useAppFilter();
  const [notes, setNotes] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Quick Capture State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickSubjectId, setQuickSubjectId] = useState('');
  const [quickNoteType, setQuickNoteType] = useState<NoteType>(NoteType.GENERAL);
  const [quickLoading, setQuickLoading] = useState(false);

  // Unified Filter State
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('ALL'); // 'ALL' | 'FREE' | `sub_${id}` | `proj_${id}`
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL'); // 'ALL' | NoteType
  const [activeTab, setActiveTab] = useState<'ALL' | 'PINNED' | 'ARCHIVED'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'TITLE' | 'PINNED_FIRST'>('PINNED_FIRST');
  const [viewDensity, setViewDensity] = useState<NoteViewDensity>('GRID');
  const [selectedNoteForSplit, setSelectedNoteForSplit] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<any | null>(null);
  const [modalMode, setModalMode] = useState<NoteModalMode>('PREVIEW');
  const { showToast } = useToast();

  useEffect(() => {
    api.get<ApiResponse<any[]>>('/projects')
      .then((res) => setProjects(res.data || []))
      .catch(() => {});
  }, []);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSubjectId) params.append('subjectId', selectedSubjectId);
      if (search.trim()) params.append('search', search.trim());
      if (activeTab === 'PINNED') params.append('isPinned', 'true');
      if (activeTab === 'ARCHIVED') {
        params.append('isArchived', 'true');
      } else {
        params.append('isArchived', 'false');
      }

      const res = await api.get<ApiResponse<any[]>>(`/notes?${params.toString()}`);
      const fetchedNotes = res.data || [];
      setNotes(fetchedNotes);

      if (fetchedNotes.length > 0 && !selectedNoteForSplit) {
        setSelectedNoteForSplit(fetchedNotes[0]);
      }
    } catch {
      showToast('Không thể tải danh sách ghi chú bài học', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedSubjectId, search, activeTab, showToast, selectedNoteForSplit]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes, selectedSemesterId]);

  // Quick Capture Note Action
  const handleQuickCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    setQuickLoading(true);
    try {
      await api.post('/notes', {
        title: quickTitle.trim(),
        content: `*Ghi nhanh ngày ${new Date().toLocaleDateString('vi-VN')}*\n\n- Nội dung ghi chép...`,
        subjectId: quickSubjectId || (selectedSubjectId || undefined),
        noteType: quickNoteType
      });
      showToast('Đã lưu nhanh bài ghi thành công!', 'success');
      setQuickTitle('');
      fetchNotes();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu nhanh bài ghi', 'error');
    } finally {
      setQuickLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ghi chú "${title}" không?`)) return;

    try {
      await api.delete(`/notes/${id}`);
      showToast(`Đã xóa ghi chú "${title}"`, 'success');
      if (selectedNoteForSplit?.id === id) {
        setSelectedNoteForSplit(null);
      }
      fetchNotes();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa ghi chú', 'error');
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      const res = await api.patch<ApiResponse<any>>(`/notes/${id}/pin`);
      showToast(res.message || 'Đã cập nhật trạng thái ghim', 'success');
      fetchNotes();
    } catch (err: any) {
      showToast(err.message || 'Lỗi cập nhật ghim', 'error');
    }
  };

  const handleToggleArchive = async (id: string) => {
    try {
      const res = await api.patch<ApiResponse<any>>(`/notes/${id}/archive`);
      showToast(res.message || 'Đã cập nhật trạng thái lưu trữ', 'success');
      fetchNotes();
    } catch (err: any) {
      showToast(err.message || 'Lỗi cập nhật lưu trữ', 'error');
    }
  };

  const handleCopyMarkdown = (note: any) => {
    if (!note?.content) return;
    navigator.clipboard.writeText(`# ${note.title}\n\n${note.content}`);
    setCopiedId(note.id);
    showToast('Đã sao chép toàn bộ mã nguồn Markdown!', 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenCreate = () => {
    setNoteToEdit(null);
    setModalMode('WRITE');
    setIsModalOpen(true);
  };

  const handleOpenView = (note: any) => {
    if (viewDensity === 'SPLIT') {
      setSelectedNoteForSplit(note);
    } else {
      setNoteToEdit(note);
      setModalMode('PREVIEW');
      setIsModalOpen(true);
    }
  };

  const handleOpenEdit = (note: any) => {
    setNoteToEdit(note);
    setModalMode('WRITE');
    setIsModalOpen(true);
  };

  // Filtered and Sorted Notes Calculation
  const filteredNotes = useMemo(() => {
    const list = notes.filter((n) => {
      // 1. Source Filter (Môn học / Đồ án / Tự do)
      if (selectedSourceFilter !== 'ALL') {
        if (selectedSourceFilter === 'FREE') {
          if (n.subjectId || n.projectId) return false;
        } else if (selectedSourceFilter.startsWith('sub_')) {
          const subId = selectedSourceFilter.replace('sub_', '');
          if (n.subjectId !== subId) return false;
        } else if (selectedSourceFilter.startsWith('proj_')) {
          const projId = selectedSourceFilter.replace('proj_', '');
          if (n.projectId !== projId) return false;
        }
      }

      // 2. Note Type Filter
      if (selectedTypeFilter !== 'ALL') {
        if (n.noteType !== selectedTypeFilter) return false;
      }

      return true;
    });

    // Sort Calculation
    return list.sort((a, b) => {
      if (sortBy === 'PINNED_FIRST') {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'NEWEST') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'OLDEST') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'TITLE') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });
  }, [notes, selectedSourceFilter, selectedTypeFilter, sortBy]);

  // Compute Stats
  const totalNotes = notes.length;
  const pinnedNotesCount = notes.filter((n) => n.isPinned).length;
  const totalWords = useMemo(() => {
    return notes.reduce((acc, curr) => acc + ((curr.content || '').trim().split(/\s+/).filter(Boolean).length || 0), 0);
  }, [notes]);
  const estimatedReadHours = Math.max(0.1, (totalWords / 200 / 60)).toFixed(1);

  // Compute Source Counts
  const sourcePills = useMemo(() => {
    const pills: { id: string; label: string; count: number; icon: any; color?: string }[] = [
      { id: 'ALL', label: 'Tất cả bài ghi', count: notes.length, icon: FileText }
    ];

    // Subjects
    subjects.forEach((sub) => {
      const count = notes.filter((n) => n.subjectId === sub.id).length;
      if (count > 0 || selectedSubjectId === sub.id) {
        pills.push({
          id: `sub_${sub.id}`,
          label: sub.code ? `[${sub.code}] ${sub.name}` : sub.name,
          count,
          icon: Folder,
          color: sub.color || 'var(--color-info)'
        });
      }
    });

    // Projects
    projects.forEach((proj) => {
      const count = notes.filter((n) => n.projectId === proj.id).length;
      if (count > 0) {
        pills.push({
          id: `proj_${proj.id}`,
          label: `📁 ${proj.name}`,
          count,
          icon: FolderKanban,
          color: 'var(--color-purple)'
        });
      }
    });

    // Free notes
    const freeCount = notes.filter((n) => !n.subjectId && !n.projectId).length;
    if (freeCount > 0) {
      pills.push({
        id: 'FREE',
        label: '📝 Ghi chú tự do',
        count: freeCount,
        icon: Bookmark,
        color: 'var(--text-muted)'
      });
    }

    return pills;
  }, [notes, subjects, projects, selectedSubjectId]);

  const typePills = [
    { id: 'ALL', label: 'Tất cả loại bài', icon: Sparkles },
    { id: NoteType.LECTURE, label: '📖 Bài giảng', icon: BookOpen },
    { id: NoteType.LAB_REPORT, label: '🧪 Thực hành', icon: Layers },
    { id: NoteType.EXAM_PREP, label: '🎯 Ôn thi', icon: CheckCircle2 },
    { id: NoteType.PROJECT_LOG, label: '🛠️ Đồ án', icon: FolderKanban },
    { id: NoteType.MEETING_MINUTES, label: '👥 Họp nhóm', icon: FileText },
    { id: NoteType.GENERAL, label: '📝 Chung', icon: Bookmark }
  ];

  const kanbanColumns = [
    { type: NoteType.LECTURE, title: '📖 Bài Giảng Lý Thuyết', color: 'var(--color-info)' },
    { type: NoteType.LAB_REPORT, title: '🧪 Báo Cáo Thực Hành', color: 'var(--color-success)' },
    { type: NoteType.EXAM_PREP, title: '🎯 Đề Cương Ôn Thi', color: 'var(--color-warning)' },
    { type: NoteType.PROJECT_LOG, title: '🛠️ Nhật Ký Đồ Án', color: 'var(--color-purple)' },
    { type: NoteType.GENERAL, title: '📝 Ghi Chú Tự Do', color: 'var(--text-muted)' }
  ];

  // Active Filter Summary Label
  const activeSourceObj = sourcePills.find((p) => p.id === selectedSourceFilter);
  const activeTypeObj = typePills.find((p) => p.id === selectedTypeFilter);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Academic Hub Metric Banner */}
      <div
        className="snote-card"
        style={{
          padding: '20px 24px',
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.05) 50%, var(--bg-card) 100%)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent-subtle)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <BookMarked size={18} />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Kho Tri Thức & Ghi Chép Bài Học
            </h1>
            <span className="badge badge-purple" style={{ fontSize: '11px', padding: '2px 8px' }}>
              Second Brain
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
            Hệ thống quản trị tri thức hàn lâm: Markdown thời gian thực, mục lục tự động, và liên kết đồ án thông minh
          </p>
        </div>

        {/* Quick Knowledge Metrics Strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <FileText size={15} style={{ color: 'var(--accent-primary)' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{totalNotes}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Bài ghi</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <Pin size={15} style={{ color: 'var(--color-warning)' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{pinnedNotesCount}</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Đã ghim</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <Clock size={15} style={{ color: 'var(--color-info)' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{estimatedReadHours}h</div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Thời lượng đọc</div>
            </div>
          </div>

          <button
            onClick={handleOpenCreate}
            className="btn btn-primary"
            style={{ padding: '10px 20px', fontWeight: 700, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            <span>Tạo Bài Ghi Mới</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Quick Capture Dock (Thanh Ghi Nhanh Ý Tưởng) */}
      <form
        onSubmit={handleQuickCapture}
        className="snote-card"
        style={{
          padding: '12px 18px',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          border: '1px solid var(--accent-border)',
          boxShadow: '0 4px 20px -4px rgba(99, 102, 241, 0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', flexShrink: 0 }}>
          <Zap size={18} />
          <span style={{ fontSize: '12.5px', fontWeight: 700 }}>Ghi Nhanh:</span>
        </div>

        <input
          type="text"
          required
          placeholder="Nhập nhanh ý tưởng, công thức hoặc ghi chú bài giảng (vd: Định lý Bayes & Ứng dụng)..."
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          className="snote-input"
          style={{ flex: 3, minWidth: '240px', fontSize: '13.5px', padding: '8px 12px' }}
        />

        {subjects.length > 0 && (
          <select
            value={quickSubjectId}
            onChange={(e) => setQuickSubjectId(e.target.value)}
            className="snote-select"
            style={{ flex: 1.2, minWidth: '160px', fontSize: '12.5px', padding: '8px 12px' }}
          >
            <option value="">📁 Ghi chú tự do</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code ? `[${s.code}] ` : ''}{s.name}
              </option>
            ))}
          </select>
        )}

        <select
          value={quickNoteType}
          onChange={(e) => setQuickNoteType(e.target.value as NoteType)}
          className="snote-select"
          style={{ flex: 1, minWidth: '140px', fontSize: '12.5px', padding: '8px 12px' }}
        >
          <option value={NoteType.GENERAL}>📝 Ghi chú chung</option>
          <option value={NoteType.LECTURE}>📖 Bài giảng</option>
          <option value={NoteType.LAB_REPORT}>🧪 Thực hành</option>
          <option value={NoteType.EXAM_PREP}>🎯 Ôn thi</option>
          <option value={NoteType.PROJECT_LOG}>🛠️ Đồ án</option>
        </select>

        <button
          type="submit"
          disabled={quickLoading || !quickTitle.trim()}
          className="btn btn-primary btn-sm"
          style={{ fontWeight: 700, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Send size={13} />
          <span>{quickLoading ? 'Đang lưu...' : 'Lưu Nhanh'}</span>
        </button>
      </form>

      {/* 3. Smart Omnibar & 2-Tier Visual Filter Deck */}
      <div
        className="snote-card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-xl)'
        }}
      >
        {/* Tier 1: Search, Sort & Multi-View Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ flex: 2, minWidth: '260px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề, nội dung Markdown, môn học..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="snote-input"
              style={{ paddingLeft: '38px', paddingRight: search ? '36px' : '14px' }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  padding: 0
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sắp xếp Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '170px' }}>
            <ArrowUpDown size={14} style={{ color: 'var(--text-muted)' }} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="snote-select"
              style={{ fontSize: '12.5px', padding: '6px 10px' }}
            >
              <option value="PINNED_FIRST">📌 Ghim lên đầu</option>
              <option value="NEWEST">🕒 Mới nhất</option>
              <option value="OLDEST">⏳ Cũ nhất</option>
              <option value="TITLE">🔤 Tiêu đề A-Z</option>
            </select>
          </div>

          {/* Quick Status Filter (All / Pinned / Archived) */}
          <div style={{ display: 'flex', background: 'var(--bg-input)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setActiveTab('ALL')}
              className={`btn btn-sm ${activeTab === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '12px', padding: '5px 12px' }}
            >
              Tất cả ({notes.length})
            </button>
            <button
              onClick={() => setActiveTab('PINNED')}
              className={`btn btn-sm ${activeTab === 'PINNED' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '12px', padding: '5px 12px' }}
            >
              <Pin size={12} style={{ fill: activeTab === 'PINNED' ? 'currentColor' : 'none' }} />
              <span>Đã ghim ({pinnedNotesCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('ARCHIVED')}
              className={`btn btn-sm ${activeTab === 'ARCHIVED' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '12px', padding: '5px 12px' }}
            >
              <Archive size={12} />
              <span>Lưu trữ</span>
            </button>
          </div>

          {/* 5 View Modes Switcher */}
          <div style={{ display: 'flex', background: 'var(--bg-input)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setViewDensity('GRID')}
              className="btn btn-ghost btn-icon"
              style={{
                padding: '6px 8px',
                color: viewDensity === 'GRID' ? 'var(--accent-primary)' : 'var(--text-muted)',
                background: viewDensity === 'GRID' ? 'var(--accent-subtle)' : 'transparent',
                borderRadius: 'var(--radius-sm)'
              }}
              title="Chế độ Lưới Chi Tiết (Cards Grid)"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewDensity('COMPACT')}
              className="btn btn-ghost btn-icon"
              style={{
                padding: '6px 8px',
                color: viewDensity === 'COMPACT' ? 'var(--accent-primary)' : 'var(--text-muted)',
                background: viewDensity === 'COMPACT' ? 'var(--accent-subtle)' : 'transparent',
                borderRadius: 'var(--radius-sm)'
              }}
              title="Chế độ Bento Gọn (Bento Matrix)"
            >
              <Grid size={15} />
            </button>
            <button
              onClick={() => setViewDensity('SPLIT')}
              className="btn btn-ghost btn-icon"
              style={{
                padding: '6px 8px',
                color: viewDensity === 'SPLIT' ? 'var(--accent-primary)' : 'var(--text-muted)',
                background: viewDensity === 'SPLIT' ? 'var(--accent-subtle)' : 'transparent',
                borderRadius: 'var(--radius-sm)'
              }}
              title="Chế độ Chia Đôi Đọc Sâu (Split Reader)"
            >
              <Columns size={15} />
            </button>
            <button
              onClick={() => setViewDensity('KANBAN')}
              className="btn btn-ghost btn-icon"
              style={{
                padding: '6px 8px',
                color: viewDensity === 'KANBAN' ? 'var(--accent-primary)' : 'var(--text-muted)',
                background: viewDensity === 'KANBAN' ? 'var(--accent-subtle)' : 'transparent',
                borderRadius: 'var(--radius-sm)'
              }}
              title="Chế độ Phân Luồng Thể Loại (Kanban Flow)"
            >
              <Kanban size={15} />
            </button>
            <button
              onClick={() => setViewDensity('LIST')}
              className="btn btn-ghost btn-icon"
              style={{
                padding: '6px 8px',
                color: viewDensity === 'LIST' ? 'var(--accent-primary)' : 'var(--text-muted)',
                background: viewDensity === 'LIST' ? 'var(--accent-subtle)' : 'transparent',
                borderRadius: 'var(--radius-sm)'
              }}
              title="Chế độ Danh Sách Bảng Rộng (Data Table)"
            >
              <List size={15} />
            </button>
          </div>
        </div>

        {/* Tier 2: Source Filter Pills */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Folder size={12} />
            <span>1. NGUỒN BÀI HỌC / THƯ MỤC LIÊN KẾT:</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {sourcePills.map((pill) => {
              const isActive = selectedSourceFilter === pill.id;
              const Icon = pill.icon;
              return (
                <button
                  key={pill.id}
                  onClick={() => setSelectedSourceFilter(pill.id)}
                  className={`filter-chip ${isActive ? 'active' : ''}`}
                >
                  <span style={{ color: isActive ? 'inherit' : (pill.color || 'inherit'), display: 'flex' }}>
                    <Icon size={13} />
                  </span>
                  <span>{pill.label}</span>
                  <span style={{ opacity: 0.7, fontSize: '11px' }}>({pill.count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tier 3: Note Type Filter Pills */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Tag size={12} />
            <span>2. PHÂN LOẠI NỘI DUNG:</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {typePills.map((pill) => {
              const isActive = selectedTypeFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => setSelectedTypeFilter(pill.id)}
                  className={`filter-chip ${isActive ? 'active' : ''}`}
                >
                  <span>{pill.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Filter Summary Strip */}
        {(selectedSourceFilter !== 'ALL' || selectedTypeFilter !== 'ALL' || search) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 14px',
              backgroundColor: 'var(--accent-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--accent-border)',
              fontSize: '12.5px',
              color: 'var(--text-primary)',
              flexWrap: 'wrap',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={13} style={{ color: 'var(--accent-primary)' }} />
              <span>Đang lọc theo:</span>
              {selectedSourceFilter !== 'ALL' && (
                <span className="badge badge-purple" style={{ fontSize: '11px' }}>{activeSourceObj?.label}</span>
              )}
              {selectedTypeFilter !== 'ALL' && (
                <span className="badge badge-blue" style={{ fontSize: '11px' }}>{activeTypeObj?.label}</span>
              )}
              {search && (
                <span className="badge badge-amber" style={{ fontSize: '11px' }}>"{search}"</span>
              )}
              <span>• Tìm thấy <b>{filteredNotes.length}</b> bài ghi</span>
            </div>

            <button
              onClick={() => {
                setSelectedSourceFilter('ALL');
                setSelectedTypeFilter('ALL');
                setSearch('');
              }}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '11.5px', padding: '2px 8px', color: 'var(--accent-primary)', fontWeight: 700 }}
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* 4. Main Content Views */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <Sparkles size={18} className="pulse-urgent" style={{ color: 'var(--accent-primary)' }} />
            <span>Đang tải các bài ghi chép...</span>
          </div>
        </div>
      ) : filteredNotes.length === 0 ? (
        /* Empty State */
        <div
          className="snote-card stagger-card"
          style={{
            textAlign: 'center',
            padding: '60px 24px',
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--bg-secondary)'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--accent-subtle)',
              color: 'var(--accent-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}
          >
            <BookOpen size={28} />
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Không tìm thấy bài ghi chép nào
          </h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
            Thử chuyển đổi bộ lọc nguồn, loại bài ghi hoặc sử dụng thanh Ghi Nhanh ở trên để bắt đầu!
          </p>
          <button
            onClick={handleOpenCreate}
            className="btn btn-primary"
            style={{ padding: '10px 20px', fontWeight: 700 }}
          >
            <Plus size={16} />
            <span>Tạo Ghi Chú Mới</span>
          </button>
        </div>
      ) : viewDensity === 'SPLIT' ? (
        /* 4.1 SPLIT WORKSPACE: Dual-Pane IDE Notebook Reader */
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px', alignItems: 'start' }}>
          {/* Left Column: Note List Tree */}
          <div
            className="snote-card"
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-xl)',
              maxHeight: 'calc(100vh - 220px)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            {filteredNotes.map((note) => {
              const isSelected = selectedNoteForSplit?.id === note.id;
              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNoteForSplit(note)}
                  className="snote-card stagger-card"
                  style={{
                    padding: '12px 14px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--accent-subtle)' : 'var(--bg-primary)',
                    border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className="badge badge-neutral" style={{ fontSize: '10px', padding: '1px 6px' }}>
                      {note.noteType}
                    </span>
                    {note.subject ? (
                      <span className="badge badge-blue" style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {note.subject.code || note.subject.name}
                      </span>
                    ) : note.project ? (
                      <span className="badge badge-purple" style={{ fontSize: '10px', padding: '1px 6px' }}>
                        📁 {note.project.name}
                      </span>
                    ) : (
                      <span className="badge badge-neutral" style={{ fontSize: '10px', padding: '1px 6px' }}>
                        📝 Tự do
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.35 }}>
                    {note.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={11} />
                    <span>{new Date(note.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Full Markdown Reader with Toolbar */}
          <div
            className="snote-card"
            style={{
              padding: '24px',
              borderRadius: 'var(--radius-xl)',
              minHeight: '600px',
              maxHeight: 'calc(100vh - 220px)',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-secondary)'
            }}
          >
            {selectedNoteForSplit ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span className="badge badge-purple">{selectedNoteForSplit.noteType}</span>
                      {selectedNoteForSplit.subject && (
                        <span className="badge badge-blue">
                          [{selectedNoteForSplit.subject.code}] {selectedNoteForSplit.subject.name}
                        </span>
                      )}
                      {selectedNoteForSplit.project && (
                        <span className="badge badge-purple">📁 {selectedNoteForSplit.project.name}</span>
                      )}
                    </div>
                    <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {selectedNoteForSplit.title}
                    </h2>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleCopyMarkdown(selectedNoteForSplit)}
                      className="btn btn-secondary btn-sm"
                      title="Sao chép toàn bộ Markdown"
                    >
                      {copiedId === selectedNoteForSplit.id ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} />}
                      <span>{copiedId === selectedNoteForSplit.id ? 'Đã chép' : 'Sao chép'}</span>
                    </button>
                    <button
                      onClick={() => handleOpenEdit(selectedNoteForSplit)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontWeight: 600 }}
                    >
                      <Edit3 size={14} />
                      <span>Sửa</span>
                    </button>
                    <button
                      onClick={() => handleDelete(selectedNoteForSplit.id, selectedNoteForSplit.title)}
                      className="btn btn-ghost btn-icon"
                      style={{ color: 'var(--color-danger)' }}
                      title="Xóa bài ghi"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div style={{ padding: '10px 0' }}>
                  <MarkdownViewer content={selectedNoteForSplit.content} />
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
                Chọn một ghi chú ở cột bên trái để xem nội dung chi tiết
              </div>
            )}
          </div>
        </div>
      ) : viewDensity === 'COMPACT' ? (
        /* 4.2 COMPACT BENTO VIEW: Dense Grid Matrix */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {filteredNotes.map((note: any) => (
            <div
              key={note.id}
              onClick={() => handleOpenView(note)}
              className="snote-card stagger-card"
              style={{
                padding: '16px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                border: note.isPinned ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '170px',
                boxShadow: note.isPinned ? 'var(--shadow-accent)' : 'var(--shadow-sm)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span className="badge badge-neutral" style={{ fontSize: '9.5px', padding: '1px 5px' }}>
                    {note.noteType}
                  </span>
                  {note.isPinned && <Pin size={11} style={{ color: 'var(--accent-primary)', fill: 'currentColor' }} />}
                </div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {note.title}
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
                  {note.content.replace(/[#*`_]/g, '')}
                </p>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                <span>{new Date(note.createdAt).toLocaleDateString('vi-VN')}</span>
                {note.subject ? (
                  <span style={{ color: note.subject.color || 'var(--accent-primary)', fontWeight: 600 }}>{note.subject.code || note.subject.name}</span>
                ) : note.project ? (
                  <span style={{ color: 'var(--color-purple)' }}>📁 {note.project.name}</span>
                ) : (
                  <span>📝 Tự do</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : viewDensity === 'KANBAN' ? (
        /* 4.3 KANBAN FLOW VIEW: Categorized by Note Types */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', alignItems: 'start' }}>
          {kanbanColumns.map((col) => {
            const columnNotes = filteredNotes.filter((n) => n.noteType === col.type);
            return (
              <div
                key={col.type}
                className="snote-card"
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-xl)',
                  backgroundColor: 'var(--bg-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  minHeight: '400px'
                }}
              >
                {/* Column Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {col.title}
                  </div>
                  <span className="badge badge-neutral" style={{ fontSize: '10.5px' }}>
                    {columnNotes.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: 'calc(100vh - 360px)' }}>
                  {columnNotes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      Chưa có bài ghi loại này
                    </div>
                  ) : (
                    columnNotes.map((note: any) => (
                      <div
                        key={note.id}
                        onClick={() => handleOpenView(note)}
                        className="snote-card stagger-card"
                        style={{
                          padding: '12px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--bg-primary)',
                          cursor: 'pointer',
                          border: note.isPinned ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)'
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                          {note.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>{new Date(note.createdAt).toLocaleDateString('vi-VN')}</span>
                          {note.subject && <span style={{ color: 'var(--accent-primary)' }}>{note.subject.code || note.subject.name}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewDensity === 'GRID' ? (
        /* 4.4 GRID VIEW: 2-3 Column Rich Cards with Live Markdown Preview */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {filteredNotes.map((note: any) => (
            <NoteCard
              key={note.id}
              note={note}
              onView={handleOpenView}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
              onTogglePin={handleTogglePin}
              onToggleArchive={handleToggleArchive}
            />
          ))}
        </div>
      ) : (
        /* 4.5 LIST VIEW: Full-width Table Rows */
        <div className="snote-card" style={{ padding: '0', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>Tiêu đề ghi chú</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>Phân loại</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>Môn học / Đồ án</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-secondary)' }}>Ngày tạo</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--text-secondary)' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotes.map((note: any) => (
                <tr
                  key={note.id}
                  style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'var(--transition-fast)' }}
                  className="table-row-hover"
                >
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }} onClick={() => handleOpenView(note)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {note.isPinned && <Pin size={12} style={{ color: 'var(--accent-primary)', fill: 'currentColor' }} />}
                      <span>{note.title}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="badge badge-neutral" style={{ fontSize: '10.5px' }}>{note.noteType}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {note.subject ? (
                      <span className="badge badge-blue" style={{ fontSize: '10.5px' }}>
                        {note.subject.code ? `[${note.subject.code}] ` : ''}{note.subject.name}
                      </span>
                    ) : note.project ? (
                      <span className="badge badge-purple" style={{ fontSize: '10.5px' }}>📁 {note.project.name}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>📝 Tự do</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                    {new Date(note.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                      <button
                        onClick={() => handleTogglePin(note.id)}
                        className="btn btn-ghost btn-icon btn-sm"
                        title={note.isPinned ? 'Bỏ ghim' : 'Ghim bài ghi'}
                        style={{ color: note.isPinned ? 'var(--accent-primary)' : 'var(--text-muted)' }}
                      >
                        <Pin size={13} style={{ fill: note.isPinned ? 'currentColor' : 'none' }} />
                      </button>
                      <button
                        onClick={() => handleOpenView(note)}
                        className="btn btn-ghost btn-icon btn-sm"
                        title="Xem trước nội dung"
                        style={{ color: 'var(--color-info)' }}
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(note)}
                        className="btn btn-ghost btn-icon btn-sm"
                        title="Chỉnh sửa"
                        style={{ color: 'var(--accent-primary)' }}
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id, note.title)}
                        className="btn btn-ghost btn-icon btn-sm"
                        title="Xóa"
                        style={{ color: 'var(--color-danger)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Note Edit / Create / View Modal */}
      <NoteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setNoteToEdit(null);
        }}
        onSuccess={() => {
          fetchNotes();
          setIsModalOpen(false);
          setNoteToEdit(null);
        }}
        noteToEdit={noteToEdit}
        initialMode={modalMode}
      />
    </div>
  );
};
