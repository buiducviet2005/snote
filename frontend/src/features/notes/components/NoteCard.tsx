import React from 'react';
import { NoteType } from '@snote/shared';
import { MarkdownViewer } from '../../../components/common/MarkdownViewer';
import {
  Pin,
  Archive,
  Trash2,
  Edit3,
  Eye,
  Clock,
  BookOpen,
  Tag,
  FileText,
  FlaskConical,
  GraduationCap,
  FolderKanban,
  Users
} from 'lucide-react';

interface NoteCardProps {
  note: any;
  onView: (note: any) => void;
  onEdit: (note: any) => void;
  onDelete: (id: string, title: string) => void;
  onTogglePin: (id: string) => void;
  onToggleArchive: (id: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onView,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleArchive
}) => {
  const getNoteTypeConfig = (type: NoteType) => {
    switch (type) {
      case NoteType.LECTURE:
        return { label: 'Bài giảng', badgeClass: 'badge-blue', icon: BookOpen };
      case NoteType.LAB_REPORT:
        return { label: 'Thực hành', badgeClass: 'badge-green', icon: FlaskConical };
      case NoteType.EXAM_PREP:
        return { label: 'Ôn thi', badgeClass: 'badge-amber', icon: GraduationCap };
      case NoteType.PROJECT_LOG:
        return { label: 'Đồ án', badgeClass: 'badge-purple', icon: FolderKanban };
      case NoteType.MEETING_MINUTES:
        return { label: 'Họp nhóm', badgeClass: 'badge-rose', icon: Users };
      default:
        return { label: 'Ghi chú', badgeClass: 'badge-neutral', icon: FileText };
    }
  };

  const typeConfig = getNoteTypeConfig(note.noteType);
  const TypeIcon = typeConfig.icon;

  // Calculate reading time estimate (~200 words per minute)
  const words = (note.content || '').trim().split(/\s+/).filter(Boolean).length;
  const readTimeMin = Math.max(1, Math.ceil(words / 200));

  return (
    <div
      className="snote-card stagger-card"
      style={{
        border: note.isPinned ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        boxShadow: note.isPinned ? 'var(--shadow-accent)' : 'var(--shadow-sm)',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        minHeight: '230px'
      }}
    >
      {/* Card Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className={`badge ${typeConfig.badgeClass}`}>
              <TypeIcon size={12} />
              <span>{typeConfig.label}</span>
            </span>

            {note.subject ? (
              <span
                className="badge"
                style={{
                  backgroundColor: note.subject.color ? `${note.subject.color}20` : 'rgba(255, 255, 255, 0.06)',
                  color: note.subject.color || 'var(--text-secondary)',
                  border: `1px solid ${note.subject.color ? `${note.subject.color}40` : 'var(--border-color)'}`
                }}
              >
                {note.subject.code ? `[${note.subject.code}] ` : ''}{note.subject.name}
              </span>
            ) : note.project ? (
              <span className="badge badge-purple" style={{ fontSize: '10.5px' }}>
                📁 {note.project.name}
              </span>
            ) : (
              <span className="badge badge-neutral" style={{ fontSize: '10.5px' }}>
                📝 Ghi chú tự do
              </span>
            )}
          </div>

          {/* Quick Pin / Archive Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => onTogglePin(note.id)}
              title={note.isPinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
              className="btn btn-ghost btn-icon"
              style={{
                padding: '5px',
                color: note.isPinned ? 'var(--accent-primary)' : 'var(--text-muted)'
              }}
            >
              <Pin size={15} style={{ fill: note.isPinned ? 'currentColor' : 'none' }} />
            </button>
            <button
              onClick={() => onToggleArchive(note.id)}
              title={note.isArchived ? 'Khôi phục khỏi lưu trữ' : 'Lưu trữ ghi chú'}
              className="btn btn-ghost btn-icon"
              style={{
                padding: '5px',
                color: note.isArchived ? 'var(--color-warning)' : 'var(--text-muted)'
              }}
            >
              <Archive size={15} />
            </button>
          </div>
        </div>

        {/* Note Title (Click to Preview) */}
        <h3
          onClick={() => onView(note)}
          style={{
            margin: '0 0 10px 0',
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.4,
            cursor: 'pointer',
            transition: 'color var(--transition-fast)'
          }}
          title="Nhấp để xem toàn bộ nội dung ghi chú (Preview)"
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        >
          {note.title}
        </h3>

        {/* Always Render Formatted Markdown Preview directly on Card */}
        <div
          onClick={() => onView(note)}
          style={{
            margin: '0 0 14px 0',
            maxHeight: '130px',
            overflow: 'hidden',
            cursor: 'pointer',
            position: 'relative',
            backgroundColor: 'var(--bg-primary)',
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}
          title="Nhấp để mở xem chi tiết (Preview Mode)"
        >
          {note.content ? (
            <MarkdownViewer content={note.content} className="markdown-preview-compact" />
          ) : (
            <span style={{ color: 'var(--text-muted)', fontSize: '12.5px', fontStyle: 'italic' }}>
              Chưa có nội dung ghi chép.
            </span>
          )}

          {/* Fade-out gradient at bottom for elegant clipping */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '32px',
              background: 'linear-gradient(to bottom, transparent, var(--bg-primary))',
              pointerEvents: 'none'
            }}
          />
        </div>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
            {note.tags.map((tag: any) => (
              <span
                key={tag.id || tag.name}
                className="badge badge-neutral"
                style={{ fontSize: '11px', padding: '2px 8px' }}
              >
                <Tag size={10} style={{ opacity: 0.6 }} />
                <span>{tag.name}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info & Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-color)',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{new Date(note.updatedAt || note.createdAt).toLocaleDateString('vi-VN')}</span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={11} /> {readTimeMin} phút đọc
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => onView(note)}
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--color-info)' }}
            title="Xem trước nội dung (Preview)"
          >
            <Eye size={13} />
            <span>Xem</span>
          </button>
          <button
            onClick={() => onEdit(note)}
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--accent-primary)' }}
            title="Chỉnh sửa nội dung ghi chú"
          >
            <Edit3 size={13} />
            <span>Sửa</span>
          </button>
          <button
            onClick={() => onDelete(note.id, note.title)}
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--color-danger)' }}
            title="Xóa ghi chú"
          >
            <Trash2 size={13} />
            <span>Xóa</span>
          </button>
        </div>
      </div>
    </div>
  );
};
