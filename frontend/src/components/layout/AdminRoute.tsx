import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminRoute: React.FC = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>{t('auth.verifying_admin')}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center', padding: '32px' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-danger-subtle)',
            color: 'var(--color-danger)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}
        >
          <ShieldAlert size={32} />
        </div>
        <h2 style={{ fontSize: 'var(--type-section)', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
          {t('auth.access_denied_403')}
        </h2>
        <p
          style={{ fontSize: 'var(--type-body)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}
          dangerouslySetInnerHTML={{ __html: t('auth.admin_only_desc') }}
        />
        <Link to="/notes" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} />
          <span>{t('auth.back_to_notes_btn')}</span>
        </Link>
      </div>
    );
  }

  return <Outlet />;
};
