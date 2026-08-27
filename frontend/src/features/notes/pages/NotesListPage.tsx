import React, { useState, useEffect, useCallback } from 'react';
import { api, ApiResponse } from '../../../services/api';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useToast } from '../../../contexts/ToastContext';
import { NoteCard } from '../components/NoteCard';
import { NoteModal } from '../components/NoteModal';
import { NoteType } from '@snote/shared';

export const NotesListPage: React.FC = () => {
  const { selectedSubjectId, selectedSemesterId } = useAppFilter();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PINNED' | 'ARCHIVED'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<any | null>(null);
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
      showToast('Không thể tải danh sách ghi chú', 'error');
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
      showToast(res.message || 'Đã cập nhật ghim ghi chú', 'success');
      fetchNotes();
    } catch (err: any) {
      showToast(err.message || 'Lỗi cập nhật ghim', 'error');
    }
  };

  const handleToggleArchive = async (id: string) => {
    try {
      const res = await api.patch<ApiResponse<any>>(`/notes/${id}/archive`);
      showToast(res.message || 'Đã cập nhật lưu trữ ghi chú', 'success');
      fetchNotes();
    } catch (err: any) {
      showToast(err.message || 'Lỗi cập nhật lưu trữ', 'error');
    }
  };

  const handleOpenCreate = () => {
    setNoteToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (note: any) => {
    setNoteToEdit(note);
    setIsModalOpen(true);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
            📚 Ghi Chú Bài Giảng
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
            Không gian ghi chép bài học, thực hành và đề cương ôn tập
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          style={{
            padding: '11px 20px',
            borderRadius: '8px',
            border: 'none',
            background: 'var(--accent-primary)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(59,130,246,0.3)'
          }}
        >
          <span>+</span> Tạo Ghi Chú Mới
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}
      >
        {/* Search */}
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            placeholder="🔍 Tìm kiếm ghi chú theo tiêu đề hoặc nội dung..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Note Type Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="ALL">Tất cả loại bài</option>
          <option value={NoteType.LECTURE}>Bài giảng (Lecture)</option>
          <option value={NoteType.LAB_REPORT}>Báo cáo thực hành (Lab)</option>
          <option value={NoteType.EXAM_PREP}>Ôn thi (Exam Prep)</option>
          <option value={NoteType.PROJECT_LOG}>Đồ án (Project Log)</option>
          <option value={NoteType.MEETING_MINUTES}>Họp nhóm (Meeting)</option>
          <option value={NoteType.GENERAL}>Ghi chú chung</option>
        </select>

        {/* Tabs: All / Pinned / Archived */}
        <div style={{ display: 'flex', backgroundColor: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('ALL')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'ALL' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'ALL' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Tất cả
          </button>
          <button
            onClick={() => setActiveTab('PINNED')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'PINNED' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'PINNED' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            📌 Đã ghim
          </button>
          <button
            onClick={() => setActiveTab('ARCHIVED')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'ARCHIVED' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'ARCHIVED' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            📦 Lưu trữ
          </button>
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          Đang tải ghi chú...
        </div>
      ) : notes.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--bg-secondary)',
            border: '1px dashed var(--border-color)',
            borderRadius: '16px',
            color: 'var(--text-secondary)'
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📝</div>
          <h3 style={{ margin: '0 0 6px 0', color: 'var(--text-primary)' }}>Chưa có ghi chú nào phù hợp</h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '14px' }}>
            Tạo ghi chú bài học đầu tiên để bắt đầu lưu trữ kiến thức có hệ thống.
          </p>
          <button
            onClick={handleOpenCreate}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--accent-primary)',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            + Tạo Ghi Chú Đầu Tiên
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
              onTogglePin={handleTogglePin}
              onToggleArchive={handleToggleArchive}
            />
          ))}
        </div>
      )}

      {/* Modal Form */}
      <NoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchNotes}
        noteToEdit={noteToEdit}
      />
    </div>
  );
};
