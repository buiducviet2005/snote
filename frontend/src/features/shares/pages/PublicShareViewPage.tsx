import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, ApiResponse } from '../../../services/api';
import { useLanguage } from '../../../contexts/LanguageContext';
import { MarkdownViewer } from '../../../components/common/MarkdownViewer';
import {
  Share2,
  FileText,
  CheckSquare,
  Sparkles,
  ArrowLeft,
  Calendar,
  User,
  ShieldCheck,
  Globe
} from 'lucide-react';

export const PublicShareViewPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { t, formatDateTime, language } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);

    api.get<ApiResponse<any>>(`/shares/public/${token}`)
      .then((res) => {
        setData(res.data);
      })
      .catch((err: any) => {
        setError(err.message || t('shares.link_unavailable_desc'));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, t]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
        <Sparkles className="animate-spin" size={32} style={{ color: 'var(--accent-primary)', marginBottom: '12px' }} />
        <div style={{ fontSize: 'var(--type-body)', fontWeight: 600 }}>{t('shares.public_loading')}</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)', padding: '24px' }}>
        <div className="snote-card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '36px 24px', borderRadius: 'var(--radius-xl)' }}>
          <Globe size={42} style={{ color: 'var(--color-danger)', margin: '0 auto 16px auto' }} />
          <h2 style={{ fontSize: 'var(--type-section)', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
            {t('shares.link_unavailable')}
          </h2>
          <p style={{ fontSize: 'var(--type-small)', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
            {error || t('shares.link_unavailable_desc')}
          </p>
          <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={16} />
            <span>{t('shares.go_to_snote')}</span>
          </Link>
        </div>
      </div>
    );
  }

  const { targetType, owner, targetItem } = data;
  const isNote = targetType === 'NOTE';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Bar */}
      <header
        style={{
          height: '60px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 30
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: 'var(--type-section)', fontWeight: 800, background: 'linear-gradient(135deg, var(--accent-primary), #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            SNOTE
          </span>
          <span className="badge badge-primary" style={{ fontSize: 'var(--type-caption)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Globe size={11} />
            <span>{t('shares.public_doc')}</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/login" className="btn btn-ghost btn-sm" style={{ fontSize: 'var(--type-small)', fontWeight: 600 }}>
            {t('shares.login_snote')}
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, maxWidth: '840px', width: '100%', margin: '0 auto', padding: '32px 20px' }}>
        <div className="snote-card" style={{ padding: '28px', borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          {/* Author info banner */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-primary)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 'var(--type-small)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {(owner?.fullName || 'SV').slice(0, 2).toUpperCase()}
              </span>

              <div>
                <div style={{ fontSize: 'var(--type-small)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {owner?.fullName || (language === 'vi' ? 'Sinh viên SNOTE' : 'SNOTE Student')}
                </div>
                <div style={{ fontSize: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                  {t('shares.shared_study_doc')}
                </div>
              </div>
            </div>

            {targetItem?.subject && (
              <span
                style={{
                  fontSize: 'var(--type-small)',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                  color: targetItem.subject.color || 'var(--accent-primary)',
                  border: '1px solid rgba(56, 189, 248, 0.25)'
                }}
              >
                {targetItem.subject.code ? `[${targetItem.subject.code}] ` : ''}{targetItem.subject.name}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 style={{ fontSize: 'var(--type-title)', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
            {targetItem?.title || t('shares.untitled_doc')}
          </h1>

          {/* Content Body */}
          <div style={{ fontSize: 'var(--type-body)', lineHeight: 1.7, color: 'var(--text-primary)' }}>
            {isNote ? (
              <MarkdownViewer content={targetItem?.content || t('shares.no_note_content')} />
            ) : (
              <div>
                <p style={{ margin: '0 0 16px 0' }}>{targetItem?.description || t('shares.no_description')}</p>
                {targetItem?.dueDate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--type-small)', color: 'var(--color-warning)' }}>
                    <Calendar size={15} />
                    <span>{t('shares.deadline', { date: formatDateTime(targetItem.dueDate) })}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
