import React, { useEffect, useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  icon?: React.ReactNode;
  allowExpand?: boolean;
  headerActions?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '680px',
  icon,
  allowExpand = true,
  headerActions
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Reset expansion when closed
  useEffect(() => {
    if (!isOpen) {
      setIsExpanded(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const resolvedMaxWidth = isExpanded
    ? 'calc(100vw - 32px)'
    : maxWidth.startsWith('min')
    ? maxWidth
    : `min(96vw, ${maxWidth})`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-dialog ${isExpanded ? 'modal-expanded' : ''} animate-fade-in`}
        style={{ maxWidth: resolvedMaxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            {icon && <span style={{ color: 'var(--accent-primary)', display: 'flex', flexShrink: 0 }}>{icon}</span>}
            <h3
              style={{
                margin: 0,
                fontSize: '17px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {title}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {headerActions}

            {allowExpand && (
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="btn btn-ghost btn-icon"
                style={{ padding: '6px', color: 'var(--text-secondary)' }}
                title={isExpanded ? 'Thu nhỏ kích thước tiêu chuẩn' : 'Phóng to toàn màn hình'}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-icon"
              style={{ padding: '6px', color: 'var(--text-secondary)' }}
              title="Đóng (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};
