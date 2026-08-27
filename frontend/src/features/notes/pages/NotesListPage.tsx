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
  Calendar,
  Clock,
  Trash2,
  Edit3,
  Eye,
  Tag,
  Bookmark,
  Copy,
  Check,
  ArrowUpDown,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export type NoteViewDensity = 'GRID' | 'COMPACT' | 'LIST' | 'SPLIT' | 'KANBAN';

export const NotesListPage: React.FC = () => {
  const { selectedSubjectId, selectedSemesterId, subjects } = useAppFilter();
  const [notes, setNotes] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Collapsible Filter Drawer state (Mặc định thu gọn để tối ưu không gian)
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Filter & Sort State
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('ALL'); // 'ALL' | 'FREE' | `sub_${id}` | `proj_${id}`
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL'); // 'ALL' | NoteType
  const [activeTab, setActiveTab] = useState<'ALL' | 'PINNED' | 'ARCHIVED'>('ALL');
  const [sortBy, setSortBy] = useState<'PINNED_FIRST' | 'NEWEST' | 'OLDEST' | 'TITLE'>('PINNED_FIRST');
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

      setSelectedNoteForSplit((prev: any) => {
        if (prev && fetchedNotes.some((n: any) => n.id === prev.id)) {
          return prev;
        }
        return fetchedNotes[0] || null;
      });
    } catch {
      showToast('Không thể tải danh sách ghi chú bài học', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedSubjectId, search, activeTab, showToast]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes, selectedSemesterId]);

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

  // Compute Active Filters Count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedSourceFilter !== 'ALL') count++;
    if (selectedTypeFilter !== 'ALL') count++;
    if (activeTab !== 'ALL') count++;
    if (sortBy !== 'PINNED_FIRST') count++;
    return count;
  }, [selectedSourceFilter, selectedTypeFilter, activeTab, sortBy]);

  // Source Pills for Collapsible Drawer
  const sourcePills = useMemo(() => {
    const pills: { id: string; label: string; count: number; icon: any; color?: string }[] = [
      { id: 'ALL', label: 'Tất cả nguồn', count: notes.length, icon: Folder }
    ];

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
    { id: 'ALL', label: 'Tất cả loại bài' },
    { id: NoteType.LECTURE, label: '📖 Bài giảng' },
    { id: NoteType.LAB_REPORT, label: '🧪 Thực hành' },
    { id: NoteType.EXAM_PREP, label: '🎯 Ôn thi' },
    { id: NoteType.PROJECT_LOG, label: '🛠️ Đồ án' },
    { id: NoteType.MEETING_MINUTES, label: '👥 Họp nhóm' },
    { id: NoteType.GENERAL, label: '📝 Tự do' }
  ];

  const kanbanColumns = [
    { type: NoteType.LECTURE, title: '📖 Bài Giảng Lý Thuyết', color: 'var(--color-info)' },
    { type: NoteType.LAB_REPORT, title: '🧪 Báo Cáo Thực Hành', color: 'var(--color-success)' },
    { type: NoteType.EXAM_PREP, title: '🎯 Đề Cương Ôn Thi', color: 'var(--color-warning)' },
    { type: NoteType.PROJECT_LOG, title: '🛠️ Nhật Ký Đồ Án', color: 'var(--color-purple)' },
    { type: NoteType.GENERAL, title: '📝 Ghi Chú Tự Do', color: 'var(--text-muted)' }
  ];

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. Ultra-Clean Minimalist Header (Dành trọn không gian cho Note) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '4px'
        }}
      >
        {/* Title & Count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Ghi Chú
          </h1>
          <span className="badge badge-neutral" style={{ fontSize: '11px', padding: '2px 8px' }}>
            {filteredNotes.length}{filteredNotes.length !== notes.length ? ` / ${notes.length}` : ''} bài ghi
          </span>
        </div>

        {/* Right Controls: Search + Filter Toggle + View Switcher + Create Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Quick Search Input */}
          <div style={{ position: 'relative', width: '220px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Tìm ghi chú..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="snote-input"
              style={{ paddingLeft: '32px', paddingRight: search ? '30px' : '10px', height: '34px', fontSize: '13px' }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '8px',
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
                <X size={13} />
              </button>
            )}
          </div>

          {/* Toggle Advanced Filters Button */}
          <button
            onClick={() => setIsFilterPanelOpen((prev) => !prev)}
            className={`btn btn-sm ${isFilterPanelOpen || activeFiltersCount > 0 ? 'btn-secondary' : 'btn-ghost'}`}
            style={{
              height: '34px',
              padding: '0 12px',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderColor: activeFiltersCount > 0 ? 'var(--accent-border)' : 'var(--border-color)',
              color: activeFiltersCount > 0 ? 'var(--accent-primary)' : 'var(--text-primary)'
            }}
            title="Đóng / Mở bộ lọc nâng cao"
          >
            <SlidersHorizontal size={13} />
            <span>Bộ lọc</span>
            {activeFiltersCount > 0 && (
              <span
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 800,
                  borderRadius: 'var(--radius-full)',
                  padding: '1px 6px'
                }}
              >
                {activeFiltersCount}
              </span>
            )}
            {isFilterPanelOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {/* 5 View Modes Switcher */}
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '2px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', height: '34px', alignItems: 'center' }}>
            <button
              onClick={() => setViewDensity('GRID')}
              className="btn btn-ghost btn-icon"
              style={{
                padding: '5px 7px',
                color: viewDensity === 'GRID' ? 'var(--accent-primary)' : 'var(--text-muted)',
                background: viewDensity === 'GRID' ? 'var(--accent-subtle)' : 'transparent',
                borderRadius: 'var(--radius-sm)'
              }}
              title="Dạng Lưới (Grid)"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewDensity('COMPACT')}
              className="btn btn-ghost btn-icon"
              style={{
                padding: '5px 7px',
                color: viewDensity === 'COMPACT' ? 'var(--accent-primary)' : 'var(--text-muted)',
                background: viewDensity === 'COMPACT' ? 'var(--accent-subtle)' : 'transparent',
                borderRadius: 'var(--radius-sm)'
              }}
              title="Dạng Bento Gọn (Compact)"
            >
              <Grid size={14} />
            </button>
            <button
              onClick={() => setViewDensity('SPLIT')}
              className="btn btn-ghost btn-icon"
              style={{
                padding: '5px 7px',
                color: viewDensity === 'SPLIT' ? 'var(--accent-primary)' : 'var(--text-muted)',
                background: viewDensity === 'SPLIT' ? 'var(--accent-subtle)' : 'transparent',
                borderRadius: 'var(--radius-sm)'
              }}
              title="Dạng Chia Đôi Đọc Sâu (Split Reader)"
            >
              <Columns size={14} />
            </button>
            <button
              onClick={() => setViewDensity('KANBAN')}
              className="btn btn-ghost btn-icon"
              style={{
                padding: '5px 7px',
                color: viewDensity === 'KANBAN' ? 'var(--accent-primary)' : 'var(--text-muted)',
                background: viewDensity === 'KANBAN' ? 'var(--accent-subtle)' : 'transparent',
                borderRadius: 'var(--radius-sm)'
              }}
              title="Dạng Phân Luồng (Kanban)"
            >
              <Kanban size={14} />
            </button>
            <button
              onClick={() => setViewDensity('LIST')}
              className="btn btn-ghost btn-icon"
              style={{
                padding: '5px 7px',
                color: viewDensity === 'LIST' ? 'var(--accent-primary)' : 'var(--text-muted)',
                background: viewDensity === 'LIST' ? 'var(--accent-subtle)' : 'transparent',
                borderRadius: 'var(--radius-sm)'
              }}
              title="Dạng Bảng Danh Sách (List)"
            >
              <List size={14} />
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={handleOpenCreate}
            className="btn btn-primary btn-sm"
            style={{ height: '34px', padding: '0 14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} />
            <span>Thêm Ghi Chú</span>
          </button>
        </div>
      </div>

      {/* 2. Collapsible Advanced Filters Drawer (Chỉ mở khi người dùng cần) */}
      {isFilterPanelOpen && (
        <div
          className="snote-card animate-fade-in"
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {/* Row 1: Status Tabs + Sort Dropdown + Reset */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Status Segmented Control */}
              <div style={{ display: 'flex', background: 'var(--bg-primary)', padding: '2px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => setActiveTab('ALL')}
                  className={`btn btn-sm ${activeTab === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '11.5px', padding: '3px 10px' }}
                >
                  Tất cả ({notes.length})
                </button>
                <button
                  onClick={() => setActiveTab('PINNED')}
                  className={`btn btn-sm ${activeTab === 'PINNED' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '11.5px', padding: '3px 10px' }}
                >
                  <Pin size={11} style={{ fill: activeTab === 'PINNED' ? 'currentColor' : 'none' }} />
                  <span>Đã ghim</span>
                </button>
                <button
                  onClick={() => setActiveTab('ARCHIVED')}
                  className={`btn btn-sm ${activeTab === 'ARCHIVED' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '11.5px', padding: '3px 10px' }}
                >
                  <Archive size={11} />
                  <span>Lưu trữ</span>
                </button>
              </div>

              {/* Sort selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowUpDown size={13} style={{ color: 'var(--text-muted)' }} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="snote-select"
                  style={{ fontSize: '12px', padding: '4px 8px', height: '28px' }}
                >
                  <option value="PINNED_FIRST">📌 Ghim lên đầu</option>
                  <option value="NEWEST">🕒 Mới nhất</option>
                  <option value="OLDEST">⏳ Cũ nhất</option>
                  <option value="TITLE">🔤 Tiêu đề A-Z</option>
                </select>
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  setSelectedSourceFilter('ALL');
                  setSelectedTypeFilter('ALL');
                  setActiveTab('ALL');
                  setSortBy('PINNED_FIRST');
                  setSearch('');
                }}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '11.5px', padding: '2px 8px', color: 'var(--accent-primary)', fontWeight: 600 }}
              >
                Xóa tất cả bộ lọc
              </button>
            )}
          </div>

          {/* Row 2: Source Folders Filter Chips */}
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
              Nguồn môn học / Đồ án:
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {sourcePills.map((pill) => {
                const isActive = selectedSourceFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    onClick={() => setSelectedSourceFilter(pill.id)}
                    className={`filter-chip ${isActive ? 'active' : ''}`}
                    style={{ fontSize: '11.5px', padding: '4px 10px' }}
                  >
                    <span>{pill.label}</span>
                    <span style={{ opacity: 0.7, fontSize: '10px' }}>({pill.count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Note Type Filter Chips */}
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
              Loại nội dung:
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {typePills.map((pill) => {
                const isActive = selectedTypeFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    onClick={() => setSelectedTypeFilter(pill.id)}
                    className={`filter-chip ${isActive ? 'active' : ''}`}
                    style={{ fontSize: '11.5px', padding: '4px 10px' }}
                  >
                    <span>{pill.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Notes Content Area (Tập trung toàn bộ không gian cho bài ghi) */}
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
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--accent-subtle)',
              color: 'var(--accent-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px'
            }}
          >
            <BookOpen size={24} />
          </div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Không tìm thấy bài ghi chép nào
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Thử tìm kiếm với từ khóa khác hoặc tạo một ghi chú mới ngay bây giờ.
          </p>
          <button
            onClick={handleOpenCreate}
            className="btn btn-primary btn-sm"
            style={{ padding: '8px 18px', fontWeight: 700 }}
          >
            <Plus size={14} />
            <span>Tạo Ghi Chú Mới</span>
          </button>
        </div>
      ) : viewDensity === 'SPLIT' ? (
        /* SPLIT VIEW: Dual-Pane IDE Notebook Reader */
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '16px', alignItems: 'start' }}>
          {/* Left Column: Note List Tree */}
          <div
            className="snote-card"
            style={{
              padding: '10px',
              borderRadius: 'var(--radius-lg)',
              maxHeight: 'calc(100vh - 160px)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
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
                    padding: '10px 12px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--accent-subtle)' : 'var(--bg-primary)',
                    border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className="badge badge-neutral" style={{ fontSize: '9.5px', padding: '1px 5px' }}>
                      {note.noteType}
                    </span>
                    {note.subject ? (
                      <span className="badge badge-blue" style={{ fontSize: '9.5px', padding: '1px 5px' }}>
                        {note.subject.code || note.subject.name}
                      </span>
                    ) : note.project ? (
                      <span className="badge badge-purple" style={{ fontSize: '9.5px', padding: '1px 5px' }}>
                        📁 {note.project.name}
                      </span>
                    ) : (
                      <span className="badge badge-neutral" style={{ fontSize: '9.5px', padding: '1px 5px' }}>
                        📝 Tự do
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px', lineHeight: 1.3 }}>
                    {note.title}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                    {new Date(note.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Full Markdown Reader */}
          <div
            className="snote-card"
            style={{
              padding: '24px',
              borderRadius: 'var(--radius-lg)',
              minHeight: '600px',
              maxHeight: 'calc(100vh - 160px)',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-secondary)'
            }}
          >
            {selectedNoteForSplit ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
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
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {selectedNoteForSplit.title}
                    </h2>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleCopyMarkdown(selectedNoteForSplit)}
                      className="btn btn-secondary btn-sm"
                      title="Sao chép Markdown"
                      style={{ fontSize: '12px', padding: '4px 10px' }}
                    >
                      {copiedId === selectedNoteForSplit.id ? <Check size={13} style={{ color: 'var(--color-success)' }} /> : <Copy size={13} />}
                      <span>{copiedId === selectedNoteForSplit.id ? 'Đã chép' : 'Sao chép'}</span>
                    </button>
                    <button
                      onClick={() => handleOpenEdit(selectedNoteForSplit)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '12px', padding: '4px 10px', fontWeight: 600 }}
                    >
                      <Edit3 size={13} />
                      <span>Sửa</span>
                    </button>
                    <button
                      onClick={() => handleDelete(selectedNoteForSplit.id, selectedNoteForSplit.title)}
                      className="btn btn-ghost btn-icon btn-sm"
                      style={{ color: 'var(--color-danger)' }}
                      title="Xóa bài ghi"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ padding: '8px 0' }}>
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
        /* COMPACT BENTO VIEW: 4-5 Column Dense Cards */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '12px' }}>
          {filteredNotes.map((note: any) => (
            <div
              key={note.id}
              onClick={() => handleOpenView(note)}
              className="snote-card stagger-card"
              style={{
                padding: '14px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                border: note.isPinned ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '160px',
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
                <h4 style={{ margin: '0 0 4px 0', fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {note.title}
                </h4>
                <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.35 }}>
                  {note.content.replace(/[#*`_]/g, '')}
                </p>
              </div>

              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
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
        /* KANBAN FLOW VIEW: Categorized by Note Types */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px', alignItems: 'start' }}>
          {kanbanColumns.map((col) => {
            const columnNotes = filteredNotes.filter((n) => n.noteType === col.type);
            return (
              <div
                key={col.type}
                className="snote-card"
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--bg-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  minHeight: '380px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {col.title}
                  </div>
                  <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                    {columnNotes.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
                  {columnNotes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-muted)', fontSize: '11.5px' }}>
                      Chưa có bài ghi
                    </div>
                  ) : (
                    columnNotes.map((note: any) => (
                      <div
                        key={note.id}
                        onClick={() => handleOpenView(note)}
                        className="snote-card stagger-card"
                        style={{
                          padding: '10px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--bg-primary)',
                          cursor: 'pointer',
                          border: note.isPinned ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)'
                        }}
                      >
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>
                          {note.title}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
        /* GRID VIEW: 2-3 Column Rich Cards with Live Markdown Preview */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
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
        /* LIST VIEW: Full-width Table Rows */
        <div className="snote-card" style={{ padding: '0', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)' }}>
                <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-secondary)' }}>Tiêu đề ghi chú</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-secondary)' }}>Phân loại</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-secondary)' }}>Môn học / Đồ án</th>
                <th style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-secondary)' }}>Ngày tạo</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--text-secondary)' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotes.map((note: any) => (
                <tr
                  key={note.id}
                  style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'var(--transition-fast)' }}
                  className="table-row-hover"
                >
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }} onClick={() => handleOpenView(note)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {note.isPinned && <Pin size={12} style={{ color: 'var(--accent-primary)', fill: 'currentColor' }} />}
                      <span>{note.title}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className="badge badge-neutral" style={{ fontSize: '10px' }}>{note.noteType}</span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {note.subject ? (
                      <span className="badge badge-blue" style={{ fontSize: '10px' }}>
                        {note.subject.code ? `[${note.subject.code}] ` : ''}{note.subject.name}
                      </span>
                    ) : note.project ? (
                      <span className="badge badge-purple" style={{ fontSize: '10px' }}>📁 {note.project.name}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>📝 Tự do</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                    {new Date(note.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
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
                        title="Xem trước"
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
