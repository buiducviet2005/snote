import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, ApiResponse } from '../../../services/api';
import { MarkdownViewer } from '../../../components/common/MarkdownViewer';
import {
  Share2,
  FileText,
  CheckSquare,
  Sparkles,
  ArrowLeft,
  Calendar,
  BookOpen,
  User,
  ShieldCheck,
  Globe
} from 'lucide-react';

export const PublicShareViewPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
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
        setError(err.message || 'Không thể tải nội dung chia sẻ. Liên kết có thể đã hết hạn hoặc không tồn tại.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
        <Sparkles className="animate-spin" size={32} style={{ color: 'var(--accent-primary)', marginBottom: '12px' }} />
        <div style={{ fontSize: '15px', fontWeight: 600 }}>Đang tải nội dung chia sẻ từ SNOTE...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)', padding: '24px' }}>
        <div className="snote-card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '36px 24px', borderRadius: 'var(--radius-xl)' }}>
          <Globe size={42} style={{ color: 'var(--color-danger)', margin: '0 auto 16px auto' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
            Liên kết không khả dụng
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
            {error || 'Nội dung này không tồn tại hoặc đã bị chủ sở hữu thu hồi quyền truy cập.'}
          </p>
          <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={16} />
            <span>Đến trang SNOTE</span>
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
          <span style={{ fontSize: '18px', fontWeight: 800, background: 'linear-gradient(135deg, var(--accent-primary), #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            SNOTE
          </span>
          <span className="badge badge-primary" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Globe size={11} />
            <span>Tài liệu công khai</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/login" className="btn btn-ghost btn-sm" style={{ fontSize: '12.5px', fontWeight: 600 }}>
            Đăng nhập SNOTE
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
                  fontSize: '13px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {(owner?.fullName || 'SV').slice(0, 2).toUpperCase()}
              </span>

              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {owner?.fullName || 'Sinh viên SNOTE'}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Đã chia sẻ tài liệu học tập
                </div>
              </div>
            </div>

            {targetItem?.subject && (
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                  color: targetItem.subject.color || 'var(--accent-primary)',
                  border: '1px solid rgba(56, 189, 248, 0.25)'
                }}
              >
                📖 {targetItem.subject.code ? `[${targetItem.subject.code}] ` : ''}{targetItem.subject.name}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
            {targetItem?.title || 'Tài liệu không tên'}
          </h1>

          {/* Content Body */}
          <div style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--text-primary)' }}>
            {isNote ? (
              <MarkdownViewer content={targetItem?.content || 'Chưa có nội dung ghi chú.'} />
            ) : (
              <div>
                <p style={{ margin: '0 0 16px 0' }}>{targetItem?.description || 'Không có mô tả chi tiết.'}</p>
                {targetItem?.dueDate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-warning)' }}>
                    <Calendar size={15} />
                    <span>Hạn chót: {new Date(targetItem.dueDate).toLocaleString('vi-VN')}</span>
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
