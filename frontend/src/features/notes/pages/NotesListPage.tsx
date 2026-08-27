import React, { useState, useEffect, useCallback } from 'react';
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
  ChevronDown,
  ChevronRight,
  Folder,
  FolderKanban,
  FileText,
  Calendar,
  Clock,
  Trash2,
  Edit3,
  Eye,
  Tag
} from 'lucide-react';

export type NoteViewDensity = 'GRID' | 'COMPACT' | 'LIST' | 'SPLIT';
export type NoteGrouping = 'NONE' | 'BY_SUBJECT' | 'BY_TYPE';

export const NotesListPage: React.FC = () => {
  const { selectedSubjectId, selectedSemesterId, subjects } = useAppFilter();
  const [notes, setNotes] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PINNED' | 'ARCHIVED'>('ALL');
  const [viewDensity, setViewDensity] = useState<NoteViewDensity>('GRID');
  const [grouping, setGrouping] = useState<NoteGrouping>('BY_SUBJECT');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
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
      if (filterType !== 'ALL') params.append('noteType', filterType);
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

      // Auto-select first note for split mode if none selected
      if (fetchedNotes.length > 0 && !selectedNoteForSplit) {
        setSelectedNoteForSplit(fetchedNotes[0]);
      }
    } catch {
      showToast('Không thể tải danh sách ghi chú bài học', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedSubjectId, filterType, search, activeTab, showToast, selectedNoteForSplit]);

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

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Grouping Logic
  const getGroupedNotes = () => {
    if (grouping === 'NONE') {
      return [{ id: 'all', title: 'Tất cả bài ghi', icon: FileText, items: notes }];
    }

    if (grouping === 'BY_SUBJECT') {
      const groups: { id: string; title: string; subtitle?: string; icon: any; color?: string; items: any[] }[] = [];

      // 1. By Subjects
      subjects.forEach((sub) => {
        const subNotes = notes.filter((n) => n.subjectId === sub.id);
        if (subNotes.length > 0) {
          groups.push({
            id: `sub_${sub.id}`,
            title: sub.name,
            subtitle: sub.code ? `[${sub.code}]` : undefined,
            icon: Folder,
            color: sub.color || 'var(--accent-primary)',
            items: subNotes
          });
        }
      });

      // 2. By Projects
      projects.forEach((proj) => {
        const projNotes = notes.filter((n) => n.projectId === proj.id);
        if (projNotes.length > 0) {
          groups.push({
            id: `proj_${proj.id}`,
            title: `Đồ án: ${proj.name}`,
            icon: FolderKanban,
            color: 'var(--color-purple)',
            items: projNotes
          });
        }
      });

      // 3. Free Notes (Unassigned)
      const freeNotes = notes.filter((n) => !n.subjectId && !n.projectId);
      if (freeNotes.length > 0) {
        groups.push({
          id: 'free_notes',
          title: '📝 Ghi Chú Tự Do & Ý Tưởng Cá Nhân',
          icon: FileText,
          color: 'var(--text-muted)',
          items: freeNotes
        });
      }

      return groups;
    }

    if (grouping === 'BY_TYPE') {
      const typeLabels: Record<string, { label: string; icon: any; color: string }> = {
        LECTURE: { label: '📖 Bài Giảng Lý Thuyết', icon: BookOpen, color: 'var(--color-info)' },
        LAB_REPORT: { label: '🧪 Báo Cáo Thực Hành', icon: Layers, color: 'var(--color-success)' },
        EXAM_PREP: { label: '🎯 Đề Cương Ôn Thi', icon: Sparkles, color: 'var(--color-danger)' },
        PROJECT_LOG: { label: '🛠️ Nhật Ký Đồ Án', icon: FolderKanban, color: 'var(--color-purple)' },
        MEETING_MINUTES: { label: '👥 Biên Bản Họp Nhóm', icon: FileText, color: 'var(--color-warning)' },
        GENERAL: { label: '📝 Ghi Chú Tự Do & Khác', icon: FileText, color: 'var(--text-secondary)' }
      };

      const groups: any[] = [];
      Object.entries(typeLabels).forEach(([typeKey, meta]) => {
        const matchingNotes = notes.filter((n) => n.noteType === typeKey);
        if (matchingNotes.length > 0) {
          groups.push({
            id: `type_${typeKey}`,
            title: meta.label,
            icon: meta.icon,
            color: meta.color,
            items: matchingNotes
          });
        }
      });

      return groups;
    }

    return [{ id: 'all', title: 'Tất cả bài ghi', icon: FileText, items: notes }];
  };

  const groupedNotes = getGroupedNotes();
  const currentSubjectObj = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Không Gian Ghi Chú Bài Học & Ý Tưởng
            </h1>
            <span className="badge badge-blue">{notes.length} bài ghi</span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            {currentSubjectObj
              ? `Đang lọc theo môn: [${currentSubjectObj.code || 'CODE'}] ${currentSubjectObj.name}`
              : 'Tổ chức tri thức Second Brain linh hoạt theo môn học, đồ án nhóm và ghi chú tự do'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* View Density Switcher (4 Modes) */}
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
              title="Dạng Thẻ To Chi Tiết (Cards Grid)"
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

      {/* Filter, Search & Grouping Control Bar */}
      <div
        className="snote-card"
        style={{
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          flexWrap: 'wrap'
        }}
      >
        {/* Search */}
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm nhanh tiêu đề, nội dung ghi chú..."
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

        {/* Grouping Selector */}
        <div style={{ minWidth: '190px' }}>
          <select
            value={grouping}
            onChange={(e) => setGrouping(e.target.value as NoteGrouping)}
            className="snote-select"
            style={{ fontSize: '13px', fontWeight: 600 }}
          >
            <option value="BY_SUBJECT">📁 Gom nhóm: Môn học & Đồ án</option>
            <option value="BY_TYPE">🏷️ Gom nhóm: Phân loại bài</option>
            <option value="NONE">🗃️ Không gom nhóm (Hiển thị phẳng)</option>
          </select>
        </div>

        {/* Note Type Filter */}
        <div style={{ minWidth: '170px' }}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="snote-select"
            style={{ fontSize: '13px' }}
          >
            <option value="ALL">Tất cả loại bài</option>
            <option value={NoteType.LECTURE}>📖 Bài giảng lý thuyết</option>
            <option value={NoteType.LAB_REPORT}>🧪 Thực hành (Lab)</option>
            <option value={NoteType.EXAM_PREP}>🎯 Ôn thi / Đề cương</option>
            <option value={NoteType.PROJECT_LOG}>🛠️ Đồ án môn học</option>
            <option value={NoteType.MEETING_MINUTES}>👥 Họp nhóm</option>
            <option value={NoteType.GENERAL}>📝 Ghi chú tự do</option>
          </select>
        </div>

        {/* Tab Switcher */}
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

      {/* Main Content Area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <Sparkles size={18} className="pulse-urgent" style={{ color: 'var(--accent-primary)' }} />
            <span>Đang tải các bài ghi chép...</span>
          </div>
        </div>
      ) : notes.length === 0 ? (
        <div
          className="snote-card"
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
            Chưa tìm thấy ghi chú nào
          </h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
            Tạo ghi chú mới để lưu lại kiến thức môn học, đồ án hoặc các ý tưởng cá nhân tự do.
          </p>
          <button
            onClick={handleOpenCreate}
            className="btn btn-primary"
            style={{ padding: '10px 20px', fontWeight: 700 }}
          >
            <Plus size={16} />
            <span>Tạo Ghi Chú Đầu Tiên</span>
          </button>
        </div>
      ) : viewDensity === 'SPLIT' ? (
        /* SPLIT WORKSPACE: Master list on left, Full markdown reader on right */
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
            {notes.map((note) => {
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
                    {note.subject && (
                      <span className="badge badge-blue" style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {note.subject.code || note.subject.name}
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
      ) : (
        /* CATEGORIZED SECTIONS / ACCORDIONS */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {groupedNotes.map((group) => {
            const isCollapsed = Boolean(collapsedSections[group.id]);
            const GroupIcon = group.icon;

            return (
              <div key={group.id} className="animate-fade-in">
                {/* Section Header Accordion Toggle */}
                {grouping !== 'NONE' && (
                  <div
                    onClick={() => toggleSection(group.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-color)',
                      marginBottom: '14px',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'var(--transition-fast)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: group.color || 'var(--accent-primary)', display: 'flex' }}>
                        <GroupIcon size={18} />
                      </span>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {group.title} {group.subtitle && <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{group.subtitle}</span>}
                      </h3>
                      <span className="badge badge-neutral" style={{ fontSize: '11px', fontWeight: 700 }}>
                        {group.items.length} bài
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                      <span style={{ fontSize: '12px' }}>{isCollapsed ? 'Mở rộng' : 'Thu gọn'}</span>
                      {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                )}

                {/* Section Items Grid / Compact / List */}
                {!isCollapsed && (
                  <>
                    {viewDensity === 'GRID' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '18px' }}>
                        {group.items.map((note: any) => (
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
                    )}

                    {viewDensity === 'COMPACT' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '14px' }}>
                        {group.items.map((note: any) => (
                          <div
                            key={note.id}
                            onClick={() => handleOpenView(note)}
                            className="snote-card"
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
                              {note.subject && <span style={{ color: note.subject.color || 'var(--accent-primary)' }}>{note.subject.code || note.subject.name}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {viewDensity === 'LIST' && (
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
                            {group.items.map((note: any) => (
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
                  </>
                )}
              </div>
            );
          })}
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
