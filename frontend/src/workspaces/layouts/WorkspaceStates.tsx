import React from 'react';
import { ShieldAlert, Archive, Inbox, ArrowLeft, RefreshCw, Plus } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface ForbiddenProps {
  onBackToPersonal?: () => void;
}

export const WorkspaceForbiddenState: React.FC<ForbiddenProps> = ({ onBackToPersonal }) => {
  const { t } = useLanguage();
  return (
    <div className="ws-state-screen">
      <div className="ws-state-icon forbidden">
        <ShieldAlert size={28} />
      </div>
      <h2 className="ws-state-title">{t('workspaces.forbidden_title')}</h2>
      <p className="ws-state-desc">
        {t('workspaces.forbidden_desc')}
      </p>
      {onBackToPersonal && (
        <button
          type="button"
          onClick={onBackToPersonal}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
        >
          <ArrowLeft size={16} />
          <span>{t('workspaces.back_to_personal')}</span>
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
  const { t } = useLanguage();
  return (
    <div className="ws-archived-banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Archive size={16} />
        <span>
          {t('workspaces.archived_banner')}
        </span>
      </div>
      {isOwner && onReopen && (
        <button
          type="button"
          onClick={onReopen}
          className="btn btn-secondary btn-sm"
          style={{
            fontSize: 'var(--type-caption)',
            padding: '3px 10px',
            background: 'var(--bg-card)',
            borderColor: '#d97706',
            color: 'var(--text-primary)',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <RefreshCw size={12} />
          <span>{t('workspaces.reopen_workspace')}</span>
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
  title,
  description,
  actionLabel,
  onAction
}) => {
  const { t } = useLanguage();
  const displayTitle = title || t('workspaces.empty_title');
  const displayDesc = description || t('workspaces.empty_desc');
  return (
    <div className="ws-state-screen">
      <div className="ws-state-icon empty">
        <Inbox size={28} />
      </div>
      <h3 className="ws-state-title" style={{ fontSize: 'var(--type-body)' }}>{displayTitle}</h3>
      <p className="ws-state-desc">{displayDesc}</p>
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
  const { t } = useLanguage();
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
      <div style={{ fontSize: 'var(--type-small)', color: 'var(--text-muted, #64748b)', fontWeight: 500 }}>
        {t('common.loading')}
      </div>
    </div>
  );
};

