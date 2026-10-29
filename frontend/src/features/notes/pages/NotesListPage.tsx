import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import type { WorkspaceSummary } from '../../../workspaces/layouts/types';
import { api, ApiResponse } from '../../../services/api';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useToast } from '../../../contexts/ToastContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { NoteModal, NoteModalMode } from '../components/NoteModal';
import { TaskModal } from '../../tasks/components/TaskModal';
import { Sparkles } from 'lucide-react';
import { NotesWorkbench } from '../components/NotesWorkbench';

export const NotesListPage: React.FC = () => {
  const { currentWorkspace } = useOutletContext<{ currentWorkspace: WorkspaceSummary }>();
  const { selectedSubjectId, selectedSemesterId, subjects } = useAppFilter();
  const { t, language } = useLanguage();
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
        showToast(t('notes.deep_link_error'), 'error');
      });
  }, [deepNoteId, showToast, t]);

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
      if (currentWorkspace.id) params.append('workspaceId', currentWorkspace.id);
      else if (selectedSubjectId) params.append('subjectId', selectedSubjectId);
      params.append('isArchived', 'false');

      const res = await api.get<ApiResponse<any[]>>(`/notes?${params.toString()}`);
      const fetchedNotes = res.data || [];
      setNotes(fetchedNotes);

      setSelectedNote((prev: any) => {
        return fetchedNotes.find((n: any) => n.id === prev?.id) || fetchedNotes[0] || null;
      });
    } catch {
      showToast(t('notes.fetch_error'), 'error');
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace.id, selectedSubjectId, showToast, t]);

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
    if (!window.confirm(language === 'vi' ? `Bạn có chắc chắn muốn xóa bài ghi "${title}" không?` : `Are you sure you want to delete note "${title}"?`)) return;

    try {
      await api.delete(`/notes/${id}`);
      showToast(language === 'vi' ? `Đã xóa bài ghi "${title}"` : `Deleted note "${title}"`, 'success');
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (selectedNote?.id === id) {
        setSelectedNote(null);
      }
    } catch (err: any) {
      showToast(err.message || (language === 'vi' ? 'Lỗi khi xóa bài ghi' : 'Error deleting note'), 'error');
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      const res = await api.patch<ApiResponse<any>>(`/notes/${id}/pin`);
      showToast(res.message || (language === 'vi' ? 'Đã cập nhật trạng thái ghim' : 'Updated pin status'), 'success');
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n))
      );
    } catch (err: any) {
      showToast(err.message || (language === 'vi' ? 'Lỗi cập nhật ghim' : 'Error updating pin'), 'error');
    }
  };

  const handleCopyContent = async (note: any) => {
    if (!note?.content && !note?.title) return;
    try {
      await navigator.clipboard.writeText(`${note.title || ''}\n\n${note.content || ''}`);
      showToast(language === 'vi' ? 'Đã sao chép nội dung bài ghi!' : 'Note content copied!', 'success');
    } catch {
      showToast(language === 'vi' ? 'Không thể sao chép nội dung bài ghi' : 'Failed to copy note content', 'error');
    }
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
        title: language === 'vi' ? 'Ghi chú mới' : 'New Note',
        content: '',
        noteType: 'GENERAL',
        workspaceId: currentWorkspace.id || undefined,
        subjectId: currentWorkspace.type === 'SUBJECT' ? currentWorkspace.subjectId : undefined,
        projectId: currentWorkspace.type === 'PROJECT' ? currentWorkspace.projectId : undefined
      });
      if (res.data) {
        setNotes((prev) => [res.data, ...prev]);
        setSelectedNote(res.data);
        showToast(language === 'vi' ? 'Đã tạo bài ghi mới' : 'Created new note', 'success');
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
      // Quietly update notes list in background
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...payload } : n)));
    } catch (err: any) {
      console.error('Save error:', err);
      throw err;
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', margin: '0', display: 'flex', flexDirection: 'column' }}>
      {loading && notes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: 'var(--type-body)' }}>
            <Sparkles size={18} className="pulse-urgent" style={{ color: 'var(--accent-primary)' }} />
            <span>{t('common.loading')}</span>
          </div>
        </div>
      ) : (
        <NotesWorkbench
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
        defaultProjectId={currentWorkspace.type === 'PROJECT' ? currentWorkspace.projectId : undefined}
        defaultWorkspaceId={currentWorkspace.type === 'GROUP' ? currentWorkspace.id : undefined}
        defaultSubjectId={currentWorkspace.type === 'SUBJECT' ? currentWorkspace.subjectId : undefined}
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
          showToast(language === 'vi' ? 'Đã tạo công việc từ ghi chú thành công!' : 'Task created from note successfully!', 'success');
        }}
        taskToEdit={taskPrefillData}
        initialMode="EDIT"
      />
    </div>
  );
};
