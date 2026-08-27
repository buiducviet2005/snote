import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
  icon?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '640px',
  icon
}) => {
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

  if (!isOpen) return null;

  const resolvedMaxWidth = maxWidth.startsWith('min') ? maxWidth : `min(96vw, ${maxWidth})`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog animate-scale-in"
        style={{ maxWidth: resolvedMaxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {icon && <span style={{ color: 'var(--accent-primary)', display: 'flex' }}>{icon}</span>}
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            style={{ padding: '6px', color: 'var(--text-secondary)' }}
            title="Đóng (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};
