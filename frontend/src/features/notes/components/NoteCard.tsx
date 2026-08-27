import React from 'react';
import { NoteType } from '@snote/shared';

interface NoteCardProps {
  note: any;
  onEdit: (note: any) => void;
  onDelete: (id: string, title: string) => void;
  onTogglePin: (id: string) => void;
  onToggleArchive: (id: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleArchive
}) => {
  const getNoteTypeBadge = (type: NoteType) => {
    switch (type) {
      case NoteType.LECTURE:
        return { label: 'Bài giảng', bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' };
      case NoteType.LAB_REPORT:
        return { label: 'Thực hành', bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399' };
      case NoteType.EXAM_PREP:
        return { label: 'Ôn thi', bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' };
      case NoteType.PROJECT_LOG:
        return { label: 'Đồ án', bg: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' };
      default:
        return { label: 'Ghi chú', bg: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1' };
    }
  };

  const badge = getNoteTypeBadge(note.noteType);

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: note.isPinned ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        boxShadow: note.isPinned ? '0 4px 16px rgba(59,130,246,0.15)' : '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: badge.bg,
                color: badge.color,
                padding: '3px 8px',
                borderRadius: '6px'
              }}
            >
              {badge.label}
            </span>
            {note.subject && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  padding: '3px 8px',
                  borderRadius: '6px'
                }}
              >
                {note.subject.name}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => onTogglePin(note.id)}
              title={note.isPinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px',
                opacity: note.isPinned ? 1 : 0.4
              }}
            >
              📌
            </button>
            <button
              onClick={() => onToggleArchive(note.id)}
              title={note.isArchived ? 'Khôi phục' : 'Lưu trữ'}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '4px',
                opacity: note.isArchived ? 1 : 0.4
              }}
            >
              📦
            </button>
          </div>
        </div>

        {/* Title */}
        <h3
          style={{
            margin: '0 0 8px 0',
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.4
          }}
        >
          {note.title}
        </h3>

        {/* Content Snippet */}
        <p
          style={{
            margin: '0 0 14px 0',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {note.content || <i>(Không có nội dung)</i>}
        </p>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {note.tags.map((tag: any) => (
              <span
                key={tag.id || tag.name}
                style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-color)',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-color)',
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}
      >
        <span>{new Date(note.updatedAt || note.createdAt).toLocaleDateString('vi-VN')}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onEdit(note)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-primary)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '12px',
              padding: '2px 6px'
            }}
          >
            Sửa
          </button>
          <button
            onClick={() => onDelete(note.id, note.title)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '12px',
              padding: '2px 6px'
            }}
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
};
