import { useEffect, useState, useCallback } from 'react';
import { api, ApiResponse } from '../../../services/api';

export interface Note {
  id: string;
  title: string;
  content: string;
  subjectId?: string;
  projectId?: string;
  noteType: string;
  tagNames?: string[];
  createdAt: string;
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiResponse<Note[]>>('/notes');
      setNotes(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Lỗi tải danh sách ghi chú');
    } finally {
      setLoading(false);
    }
  }, []);

  const createNote = async (dto: Partial<Note>) => {
    try {
      const res = await api.post<ApiResponse<Note>>('/notes', dto);
      setNotes(prev => [res.data, ...prev]);
      return res.data;
    } catch (err: any) {
      throw new Error(err.message || 'Lỗi tạo ghi chú');
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return { notes, loading, error, refetch: fetchNotes, createNote };
}
