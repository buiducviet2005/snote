import React, { useEffect, useState, useRef, useId } from 'react';
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

// Global stack to track open modals and enforce top-of-stack Escape behavior
const openModalStack: string[] = [];

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
  const modalId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Record previously focused element to restore on close
    previousActiveElementRef.current = document.activeElement as HTMLElement | null;

    // Push this modal to the global stack
    openModalStack.push(modalId);

    // Initial focus into modal
    const focusTimer = setTimeout(() => {
      if (dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length > 0) {
          // Focus the first interactive element (or close button if none)
          focusables[0].focus();
        } else {
          dialogRef.current.focus();
        }
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape only closes the topmost modal
      if (e.key === 'Escape') {
        const topId = openModalStack[openModalStack.length - 1];
        if (topId === modalId) {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
        return;
      }

      // Focus trap navigation
      if (e.key === 'Tab' && dialogRef.current) {
        const topId = openModalStack[openModalStack.length - 1];
        if (topId !== modalId) return;

        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null); // visible elements only

        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !dialogRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement || !dialogRef.current.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);

      // Remove from stack
      const index = openModalStack.lastIndexOf(modalId);
      if (index !== -1) {
        openModalStack.splice(index, 1);
      }

      // Restore focus
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        try {
          previousActiveElementRef.current.focus();
        } catch {
          // Ignore if unmounted
        }
      }
    };
  }, [isOpen, modalId, onClose]);

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
    <div
      className="modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
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
              aria-label="Đóng hộp thoại"
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
