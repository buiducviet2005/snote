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
  Bookmark
} from 'lucide-react';

export type NoteViewDensity = 'GRID' | 'COMPACT' | 'LIST' | 'SPLIT';

export const NotesListPage: React.FC = () => {
  const { selectedSubjectId, selectedSemesterId, subjects } = useAppFilter();
  const [notes, setNotes] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Unified Filter State
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('ALL'); // 'ALL' | 'FREE' | `sub_${id}` | `proj_${id}`
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL'); // 'ALL' | NoteType
  const [activeTab, setActiveTab] = useState<'ALL' | 'PINNED' | 'ARCHIVED'>('ALL');
  const [viewDensity, setViewDensity] = useState<NoteViewDensity>('GRID');
  const [selectedNoteForSplit, setSelectedNoteForSplit] = useState<any | null>(null);

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

  // Filtered Notes Calculation
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
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
  }, [notes, selectedSourceFilter, selectedTypeFilter]);

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
    { id: NoteType.LECTURE, label: '📖 Bài giảng lý thuyết', icon: BookOpen },
    { id: NoteType.LAB_REPORT, label: '🧪 Thực hành (Lab)', icon: Layers },
    { id: NoteType.EXAM_PREP, label: '🎯 Đề cương ôn thi', icon: CheckCircle2 },
    { id: NoteType.PROJECT_LOG, label: '🛠️ Nhật ký đồ án', icon: FolderKanban },
    { id: NoteType.MEETING_MINUTES, label: '👥 Họp nhóm', icon: FileText },
    { id: NoteType.GENERAL, label: '📝 Ghi chú chung', icon: Bookmark }
  ];

  // Active Filter Summary Label
  const activeSourceObj = sourcePills.find((p) => p.id === selectedSourceFilter);
  const activeTypeObj = typePills.find((p) => p.id === selectedTypeFilter);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Kho Tri Thức & Ghi Chú Bài Học
            </h1>
            <span className="badge badge-blue">{filteredNotes.length}/{notes.length} bài ghi</span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Hệ thống Second Brain cá nhân hóa: lọc tri thức thông minh theo môn học, đồ án và chủ đề
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* View Density Switcher */}
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setViewDensity('GRID')}
              className="btn btn-ghost btn-icon"
              style={{
                padding: '6px 8px',
                color: viewDensity === 'GRID' ? 'var(--accent-primary)' : 'var(--text-muted)',
                background: viewDensity === 'GRID' ? 'var(--accent-subtle)' : 'transparent',
                borderRadius: 'var(--radius-sm)'
              }}
              title="Dạng Thẻ Chi Tiết (Cards Grid)"
            >
              <LayoutGrid size={16} />
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
              title="Dạng Thẻ Gọn Xem Nhiều (Compact Grid)"
            >
              <Grid size={16} />
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
              title="Dạng Danh Sách Bảng Rộng (List Table)"
            >
              <List size={16} />
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
              title="Dạng Chia Đôi Đọc Nhanh (Split Workspace)"
            >
              <Columns size={16} />
            </button>
          </div>

          {/* Create Button */}
          <button
            onClick={handleOpenCreate}
            className="btn btn-primary"
            style={{ padding: '9px 18px', fontWeight: 700 }}
          >
            <Plus size={16} />
            <span>Tạo Ghi Chú Mới</span>
          </button>
        </div>
      </div>

      {/* 2-Tier Clean Visual Filter Deck */}
      <div
        className="snote-card"
        style={{
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-xl)'
        }}
      >
        {/* Tier 1: Search & Tab Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm nhanh tiêu đề, nội dung ghi chép..."
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

          {/* Quick Pin / Archive Status Filter */}
          <div style={{ display: 'flex', background: 'var(--bg-input)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setActiveTab('ALL')}
              className={`btn btn-sm ${activeTab === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '12.5px', padding: '5px 12px' }}
            >
              Tất cả
            </button>
            <button
              onClick={() => setActiveTab('PINNED')}
              className={`btn btn-sm ${activeTab === 'PINNED' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '12.5px', padding: '5px 12px' }}
            >
              <Pin size={12} style={{ fill: activeTab === 'PINNED' ? 'currentColor' : 'none' }} />
              <span>Đã ghim</span>
            </button>
            <button
              onClick={() => setActiveTab('ARCHIVED')}
              className={`btn btn-sm ${activeTab === 'ARCHIVED' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '12.5px', padding: '5px 12px' }}
            >
              <Archive size={12} />
              <span>Lưu trữ</span>
            </button>
          </div>
        </div>

        {/* Tier 2: Source Filter Pills (Môn học / Đồ án / Tự do) */}
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

        {/* Tier 3: Note Type Filter Pills (Loại bài) */}
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
      </div>

      {/* Clear Active Filter Banner (Làm nổi bật mục đang lọc) */}
      {(selectedSourceFilter !== 'ALL' || selectedTypeFilter !== 'ALL' || search) && (
        <div
          className="snote-card animate-fade-in"
          style={{
            marginBottom: '20px',
            padding: '10px 16px',
            backgroundColor: 'var(--accent-subtle)',
            borderLeft: '4px solid var(--accent-primary)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-primary)' }}>
            <SlidersHorizontal size={15} style={{ color: 'var(--accent-primary)' }} />
            <span>
              Đang lọc: <b>{activeSourceObj?.label}</b> • <b>{activeTypeObj?.label}</b>
              {search && <span> • Từ khóa: <i>"{search}"</i></span>}
            </span>
            <span className="badge badge-purple" style={{ fontSize: '10.5px' }}>
              Tìm thấy {filteredNotes.length} bài
            </span>
          </div>

          <button
            onClick={() => {
              setSelectedSourceFilter('ALL');
              setSelectedTypeFilter('ALL');
              setSearch('');
            }}
            className="btn btn-ghost btn-sm"
            style={{ padding: '2px 8px', fontSize: '11.5px', color: 'var(--accent-primary)' }}
          >
            Xóa tất cả bộ lọc
          </button>
        </div>
      )}

      {/* Notes Container */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <Sparkles size={18} className="pulse-urgent" style={{ color: 'var(--accent-primary)' }} />
            <span>Đang tải các bài ghi chép...</span>
          </div>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div
          className="snote-card animate-fade-in"
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
            Không tìm thấy ghi chú nào phù hợp bộ lọc
          </h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
            Thử chuyển đổi bộ lọc nguồn, loại bài ghi hoặc tạo một ghi chú mới ngay bây giờ.
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
        /* SPLIT WORKSPACE: Left tree list, Right full markdown live reader */
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px', alignItems: 'start' }}>
          {/* Left Column: Note list tree */}
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
                  className="snote-card"
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

          {/* Right Column: Full Markdown Reader */}
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
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
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
      ) : viewDensity === 'GRID' ? (
        /* GRID VIEW: 2-3 Column Rich Cards with Live Markdown Preview */
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
      ) : viewDensity === 'COMPACT' ? (
        /* COMPACT VIEW: 4-5 Column Dense Cards */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
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
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '160px',
                transition: 'var(--transition-fast)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span className="badge badge-neutral" style={{ fontSize: '9.5px', padding: '1px 5px' }}>
                    {note.noteType}
                  </span>
                  {note.isPinned && <Pin size={11} style={{ color: 'var(--accent-primary)', fill: 'currentColor' }} />}
                </div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {note.title}
                </h4>
                <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
                  {note.content.replace(/[#*`_]/g, '')}
                </p>
              </div>

              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                <span>{new Date(note.createdAt).toLocaleDateString('vi-VN')}</span>
                {note.subject ? (
                  <span style={{ color: note.subject.color || 'var(--accent-primary)' }}>{note.subject.code || note.subject.name}</span>
                ) : note.project ? (
                  <span style={{ color: 'var(--color-purple)' }}>📁 {note.project.name}</span>
                ) : (
                  <span>📝 Tự do</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW: Full-width Table Rows */
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
                        {note.subject.code || note.subject.name}
                      </span>
                    ) : note.project ? (
                      <span className="badge badge-purple" style={{ fontSize: '10.5px' }}>
                        📁 {note.project.name}
                      </span>
                    ) : (
                      <span className="badge badge-neutral" style={{ fontSize: '10.5px' }}>📝 Tự do</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '12px' }}>
                    {new Date(note.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '4px' }}>
                      <button onClick={() => handleOpenView(note)} className="btn btn-ghost btn-icon" style={{ padding: '4px' }} title="Xem">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => handleOpenEdit(note)} className="btn btn-ghost btn-icon" style={{ padding: '4px' }} title="Sửa">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDelete(note.id, note.title)} className="btn btn-ghost btn-icon" style={{ padding: '4px', color: 'var(--color-danger)' }} title="Xóa">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form with Mode Support */}
      <NoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchNotes}
        noteToEdit={noteToEdit}
        initialMode={modalMode}
      />
    </div>
  );
};
