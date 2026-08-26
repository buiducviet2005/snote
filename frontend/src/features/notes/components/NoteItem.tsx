import React from 'react';
import { Note } from '../hooks/useNotes';

interface NoteItemProps {
  note: Note;
}

export const NoteItem: React.FC<NoteItemProps> = ({ note }) => {
  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{note.title}</h3>
        <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: '#eff6ff', color: '#2563eb', borderRadius: 4 }}>
          {note.noteType}
        </span>
      </div>
      <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        {note.content}
      </p>
      {note.tagNames && note.tagNames.length > 0 && (
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
          {note.tagNames.map((tag, idx) => (
            <span key={idx} style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: 4 }}>
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
