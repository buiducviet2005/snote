import React from 'react';
import { ShieldAlert, Archive, Inbox, ArrowLeft, RefreshCw, Plus } from 'lucide-react';

interface ForbiddenProps {
  onBackToPersonal?: () => void;
}

export const WorkspaceForbiddenState: React.FC<ForbiddenProps> = ({ onBackToPersonal }) => {
  return (
    <div className="ws-state-screen">
      <div className="ws-state-icon forbidden">
        <ShieldAlert size={28} />
      </div>
      <h2 className="ws-state-title">Truy Cập Bị Từ Chối (403)</h2>
      <p className="ws-state-desc">
        Tài khoản của bạn chưa phải là thành viên chính thức của không gian này, hoặc lời mời tham gia đã hết hạn.
      </p>
      {onBackToPersonal && (
        <button
          type="button"
          onClick={onBackToPersonal}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
        >
          <ArrowLeft size={16} />
          <span>Quay về Không gian Cá nhân</span>
        </button>
      )}
    </div>
  );
};

interface ArchivedBannerProps {
  isOwner?: boolean;
  onReopen?: () => void;
}

export const WorkspaceArchivedBanner: React.FC<ArchivedBannerProps> = ({ isOwner, onReopen }) => {
  return (
    <div className="ws-archived-banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Archive size={16} />
        <span>
          Không gian này đang ở chế độ <b>Lưu trữ (Archived)</b>. Nội dung chỉ có thể đọc, toàn bộ thao tác sửa và tạo mới đều tạm khóa.
        </span>
      </div>
      {isOwner && onReopen && (
        <button
          type="button"
          onClick={onReopen}
          className="btn btn-secondary btn-sm"
          style={{
            fontSize: '11.5px',
            padding: '3px 10px',
            background: '#ffffff',
            borderColor: '#d97706',
            color: '#92400e',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <RefreshCw size={12} />
          <span>Mở lại không gian</span>
        </button>
      )}
    </div>
  );
};

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const WorkspaceEmptyState: React.FC<EmptyStateProps> = ({
  title = 'Chưa có dữ liệu trong không gian này',
  description = 'Bắt đầu bằng cách tạo mục đầu tiên để quản lý học tập và kế hoạch hiệu quả.',
  actionLabel,
  onAction
}) => {
  return (
    <div className="ws-state-screen">
      <div className="ws-state-icon empty">
        <Inbox size={28} />
      </div>
      <h3 className="ws-state-title" style={{ fontSize: '16px' }}>{title}</h3>
      <p className="ws-state-desc">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="btn btn-primary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
        >
          <Plus size={14} />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};

export const WorkspaceLoadingState: React.FC = () => {
  return (
    <div className="ws-state-screen">
      <div
        style={{
          width: '36px',
          height: '36px',
          border: '3px solid rgba(59, 130, 246, 0.2)',
          borderTopColor: 'var(--accent-primary, #3b82f6)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '14px'
        }}
      />
      <div style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', fontWeight: 500 }}>
        Đang nạp không gian làm việc...
      </div>
    </div>
  );
};
