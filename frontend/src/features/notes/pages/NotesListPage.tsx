import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, ApiResponse } from '../../../services/api';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useToast } from '../../../contexts/ToastContext';
import { NoteModal, NoteModalMode } from '../components/NoteModal';
import { TaskModal } from '../../tasks/components/TaskModal';
import { Sparkles } from 'lucide-react';
import { NotesObsidianWorkbench } from '../components/NotesObsidianWorkbench';

export const NotesListPage: React.FC = () => {
  const { selectedSubjectId, selectedSemesterId, subjects } = useAppFilter();
  const [notes, setNotes] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<any | null>(null);
  const [modalMode, setModalMode] = useState<NoteModalMode>('PREVIEW');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskPrefillData, setTaskPrefillData] = useState<any | null>(null);
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const deepNoteId = searchParams.get('noteId');
  const actionParam = searchParams.get('action');

  // Deep link note loading
  useEffect(() => {
    if (!deepNoteId) return;
    api.get<ApiResponse<any>>(`/notes/${deepNoteId}`)
      .then((res) => {
        if (res.data) {
          setSelectedNote(res.data);
        }
      })
      .catch(() => {
        showToast('Không tìm thấy bài ghi hoặc bạn không có quyền truy cập', 'error');
      });
  }, [deepNoteId, showToast]);

  // Load Projects
  useEffect(() => {
    api.get<ApiResponse<any[]>>('/projects')
      .then((res) => setProjects(res.data || []))
      .catch(() => {});
  }, []);

  // Fetch Notes
  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSubjectId) params.append('subjectId', selectedSubjectId);
      params.append('isArchived', 'false');

      const res = await api.get<ApiResponse<any[]>>(`/notes?${params.toString()}`);
      const fetchedNotes = res.data || [];
      setNotes(fetchedNotes);

      setSelectedNote((prev: any) => {
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
  }, [selectedSubjectId, showToast]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes, selectedSemesterId]);

  // Keyboard shortcut: '/' focuses the Obsidian search input
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isInput) return;

      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('.obs-search-input') as HTMLInputElement | null;
        searchInput?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài ghi "${title}" không?`)) return;

    try {
      await api.delete(`/notes/${id}`);
      showToast(`Đã xóa bài ghi "${title}"`, 'success');
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (selectedNote?.id === id) {
        setSelectedNote(null);
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa bài ghi', 'error');
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      const res = await api.patch<ApiResponse<any>>(`/notes/${id}/pin`);
      showToast(res.message || 'Đã cập nhật trạng thái ghim', 'success');
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n))
      );
    } catch (err: any) {
      showToast(err.message || 'Lỗi cập nhật ghim', 'error');
    }
  };

  const handleCopyContent = (note: any) => {
    if (!note?.content && !note?.title) return;
    navigator.clipboard.writeText(`${note.title || ''}\n\n${note.content || ''}`);
    showToast('Đã sao chép nội dung bài ghi!', 'success');
  };

  const handleOpenCreate = () => {
    setNoteToEdit(null);
    setModalMode('WRITE');
    setIsModalOpen(true);
  };

  const handleConvertToTask = (note: any) => {
    if (!note) return;
    setTaskPrefillData({
      title: note.title,
      description: note.content || '',
      subjectId: note.subjectId || '',
      projectId: note.projectId || '',
      tags: note.tags || []
    });
    setIsTaskModalOpen(true);
  };

  const handleCreateObsidianNote = async () => {
    try {
      const res = await api.post<ApiResponse<any>>('/notes', {
        title: 'Ghi chú mới',
        content: '',
        noteType: 'GENERAL',
        subjectId: selectedSubjectId || undefined
      });
      if (res.data) {
        setNotes((prev) => [res.data, ...prev]);
        setSelectedNote(res.data);
        showToast('Đã tạo bài ghi mới', 'success');
      } else {
        fetchNotes();
      }
    } catch {
      handleOpenCreate();
    }
  };

  // Handle ?action=new from topbar
  useEffect(() => {
    if (actionParam === 'new') {
      handleCreateObsidianNote();
      const next = new URLSearchParams(searchParams);
      next.delete('action');
      setSearchParams(next, { replace: true });
    }
  }, [actionParam]);

  // Listen for refresh events (from QuickCapture or other components)
  useEffect(() => {
    const handleRefresh = () => fetchNotes();
    window.addEventListener('snote_refresh_notes', handleRefresh);
    return () => window.removeEventListener('snote_refresh_notes', handleRefresh);
  }, [fetchNotes]);

  const handleUpdateNote = async (id: string, payload: { title?: string; content?: string }) => {
    try {
      await api.put(`/notes/${id}`, payload);
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...payload } : n)));
      if (selectedNote?.id === id) {
        setSelectedNote((prev: any) => ({ ...prev, ...payload }));
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu bài ghi', 'error');
      throw err;
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', margin: '0', display: 'flex', flexDirection: 'column' }}>
      {loading && notes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <Sparkles size={18} className="pulse-urgent" style={{ color: 'var(--accent-primary)' }} />
            <span>Đang tải kho tri thức Obsidian...</span>
          </div>
        </div>
      ) : (
        <NotesObsidianWorkbench
          notes={notes}
          subjects={subjects}
          projects={projects}
          activeNoteId={selectedNote?.id || deepNoteId || undefined}
          onSelectNote={(note) => {
            setSelectedNote(note);
          }}
          onUpdateNote={handleUpdateNote}
          onCreateNote={handleCreateObsidianNote}
          onDeleteNote={async (id) => {
            const target = notes.find((n) => n.id === id);
            if (target) handleDelete(id, target.title);
          }}
          onTogglePin={handleTogglePin}
          onConvertToTask={handleConvertToTask}
          onShareNote={handleCopyContent}
        />
      )}

      {/* Note Modal (Fallback for detailed metadata editing) */}
      <NoteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setNoteToEdit(null);
          if (searchParams.has('noteId')) {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('noteId');
            setSearchParams(nextParams, { replace: true });
          }
        }}
        onSuccess={() => {
          fetchNotes();
        }}
        noteToEdit={noteToEdit}
        initialMode={modalMode}
        allNotes={notes}
        onOpenNote={(n: any) => {
          setSelectedNote(n);
        }}
      />

      {/* Convert Note to Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskPrefillData(null);
        }}
        onSuccess={() => {
          setIsTaskModalOpen(false);
          setTaskPrefillData(null);
          showToast('Đã tạo công việc từ ghi chú thành công!', 'success');
        }}
        taskToEdit={taskPrefillData}
        initialMode="EDIT"
      />
    </div>
  );
};
