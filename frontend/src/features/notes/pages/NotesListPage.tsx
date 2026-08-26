import React from 'react';
import { useNotes } from '../hooks/useNotes';
import { NoteItem } from '../components/NoteItem';

export const NotesListPage: React.FC = () => {
  const { notes, loading, error } = useNotes();

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ghi chú Bài giảng (Notes)</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Tổ chức theo môn học, chống note rác và chuẩn bị ôn thi
          </p>
        </div>
        <button className="btn" onClick={() => alert('Chức năng tạo ghi chú sẽ được hoàn thiện ở Bước 5!')}>
          + Thêm Ghi chú
        </button>
      </div>

      {loading && <p>Đang tải dữ liệu từ backend...</p>}
      {error && <div style={{ color: 'red', padding: '1rem', background: '#fef2f2', borderRadius: 6 }}>{error}</div>}

      {!loading && !error && notes.length === 0 && (
        <div className="card empty-state">
          <p style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>📭 Chưa có ghi chú nào</p>
          <p style={{ fontSize: '0.875rem' }}>Hãy chọn môn học và tạo ghi chú bài giảng đầu tiên của bạn!</p>
        </div>
      )}

      <div>
        {notes.map(note => (
          <NoteItem key={note.id} note={note} />
        ))}
      </div>
    </div>
  );
};
