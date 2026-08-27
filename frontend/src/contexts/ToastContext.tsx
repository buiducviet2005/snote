import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '400px',
          pointerEvents: 'none'
        }}
      >
        {toasts.map((toast) => {
          let bg = 'var(--bg-secondary)';
          let border = 'var(--border-color)';
          let iconColor = 'var(--color-info)';
          let IconComponent = Info;

          if (toast.type === 'success') {
            bg = 'var(--bg-secondary)';
            border = 'rgba(16, 185, 129, 0.35)';
            iconColor = 'var(--color-success)';
            IconComponent = CheckCircle2;
          } else if (toast.type === 'error') {
            bg = 'var(--bg-secondary)';
            border = 'rgba(239, 68, 68, 0.35)';
            iconColor = 'var(--color-danger)';
            IconComponent = AlertCircle;
          } else if (toast.type === 'warning') {
            bg = 'var(--bg-secondary)';
            border = 'rgba(245, 158, 11, 0.35)';
            iconColor = 'var(--color-warning)';
            IconComponent = AlertTriangle;
          }

          return (
            <div
              key={toast.id}
              className="animate-fade-in"
              style={{
                background: bg,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: `1px solid ${border}`,
                color: 'var(--text-primary)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                fontSize: '13.5px',
                fontWeight: 500,
                pointerEvents: 'auto'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: iconColor, display: 'flex', flexShrink: 0 }}>
                  <IconComponent size={18} />
                </span>
                <span style={{ lineHeight: 1.4 }}>{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="btn btn-ghost btn-icon"
                style={{ padding: '4px', color: 'var(--text-muted)' }}
                title="Đóng"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
