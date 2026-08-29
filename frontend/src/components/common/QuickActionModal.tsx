import React from 'react';
import { Modal } from './Modal';
import { BookOpen, CheckSquare, Calendar, Sparkles } from 'lucide-react';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: 'NOTE' | 'TASK' | 'EVENT') => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  onSelectAction
}) => {
  const actions = [
    {
      id: 'NOTE' as const,
      title: 'Ghi Chú Bài Giảng Mới',
      desc: 'Tạo ghi chú mới gắn với môn học, tự động định dạng thông minh.',
      icon: BookOpen,
      color: 'var(--color-info)',
      bg: 'var(--color-info-subtle)'
    },
    {
      id: 'TASK' as const,
      title: 'Công Việc / Bài Tập Mới',
      desc: 'Giao việc mới, đặt hạn nộp và mức độ ưu tiên trên bảng Kanban.',
      icon: CheckSquare,
      color: 'var(--color-success)',
      bg: 'var(--color-success-subtle)'
    },
    {
      id: 'EVENT' as const,
      title: 'Sự Kiện Thời Khóa Biểu',
      desc: 'Lên lịch tiết học, buổi thi hoặc lịch họp nhóm trong tuần.',
      icon: Calendar,
      color: 'var(--color-warning)',
      bg: 'var(--color-warning-subtle)'
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo Nhanh (Quick Actions)"
      maxWidth="480px"
      icon={<Sparkles size={18} />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              onClick={() => {
                onClose();
                onSelectAction(act.id);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = act.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: act.bg,
                  color: act.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Icon size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>
                  {act.title}
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {act.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
};
