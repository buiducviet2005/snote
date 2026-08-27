import React, { useState, useEffect, useCallback } from 'react';
import { api, ApiResponse } from '../../../services/api';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useToast } from '../../../contexts/ToastContext';
import { NoteCard } from '../components/NoteCard';
import { NoteModal, NoteModalMode } from '../components/NoteModal';
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
  Sparkles
} from 'lucide-react';

export const NotesListPage: React.FC = () => {
  const { selectedSubjectId, selectedSemesterId, subjects } = useAppFilter();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PINNED' | 'ARCHIVED'>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<any | null>(null);
  const [modalMode, setModalMode] = useState<NoteModalMode>('PREVIEW');
  const { showToast } = useToast();

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
      setNotes(res.data || []);
    } catch {
      showToast('Không thể tải danh sách ghi chú bài học', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedSubjectId, filterType, search, activeTab, showToast]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes, selectedSemesterId]);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ghi chú "${title}" không?`)) return;

    try {
      await api.delete(`/notes/${id}`);
      showToast(`Đã xóa ghi chú "${title}"`, 'success');
      fetchNotes();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa ghi chú', 'error');
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      const res = await api.patch<ApiResponse<any>>(`/notes/${id}/pin`);
      showToast(res.message || 'Đã cập nhật trạng thái ghim ghi chú', 'success');
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
    setNoteToEdit(note);
    setModalMode('PREVIEW');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (note: any) => {
    setNoteToEdit(note);
    setModalMode('WRITE');
    setIsModalOpen(true);
  };

  const currentSubjectObj = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Ghi Chú Bài Giảng
            </h1>
            <span className="badge badge-blue">{notes.length} bài ghi</span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            {currentSubjectObj
              ? `Đang lọc theo môn: [${currentSubjectObj.code || 'CODE'}] ${currentSubjectObj.name}`
              : 'Không gian ghi chép bài học, bài thực hành và đề cương ôn tập'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setViewMode('GRID')}
              className="btn btn-ghost btn-icon"
              style={{
                padding: '6px',
                color: viewMode === 'GRID' ? 'var(--accent-primary)' : 'var(--text-muted)',
                background: viewMode === 'GRID' ? 'var(--accent-subtle)' : 'transparent'
              }}
              title="Chế độ xem dạng Lưới"
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              className="btn btn-ghost btn-icon"
              style={{
                padding: '6px',
                color: viewMode === 'LIST' ? 'var(--accent-primary)' : 'var(--text-muted)',
                background: viewMode === 'LIST' ? 'var(--accent-subtle)' : 'transparent'
              }}
              title="Chế độ xem Danh sách"
            >
              <List size={16} />
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

      {/* Filter & Search Bar */}
      <div
        className="snote-card"
        style={{
          padding: '12px 16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          flexWrap: 'wrap'
        }}
      >
        {/* Search */}
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm ghi chú theo tiêu đề hoặc nội dung..."
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

        {/* Note Type Filter */}
        <div style={{ minWidth: '180px' }}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="snote-select"
            style={{ fontSize: '13px' }}
          >
            <option value="ALL">Tất cả loại bài</option>
            <option value={NoteType.LECTURE}>📖 Bài giảng (Lecture)</option>
            <option value={NoteType.LAB_REPORT}>🧪 Thực hành (Lab)</option>
            <option value={NoteType.EXAM_PREP}>🎯 Ôn thi (Exam Prep)</option>
            <option value={NoteType.PROJECT_LOG}>🛠️ Đồ án (Project Log)</option>
            <option value={NoteType.MEETING_MINUTES}>👥 Họp nhóm (Meeting)</option>
            <option value={NoteType.GENERAL}>📝 Ghi chú chung</option>
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

      {/* Notes Container */}
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
            Chưa tìm thấy ghi chú bài học nào
          </h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
            Tạo ghi chú bài giảng đầu tiên để xây dựng Second Brain có hệ thống theo từng môn học và đồ án.
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
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: viewMode === 'GRID' ? 'repeat(auto-fill, minmax(350px, 1fr))' : '1fr',
            gap: '20px'
          }}
        >
          {notes.map((note) => (
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
