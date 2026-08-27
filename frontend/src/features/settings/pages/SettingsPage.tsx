import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useToast } from '../../../contexts/ToastContext';
import { api } from '../../../services/api';
import {
  Settings,
  User,
  Copy,
  Check,
  Sun,
  Moon,
  Download,
  ShieldCheck,
  Database,
  Sparkles,
  GraduationCap,
  Clock,
  Mail,
  Fingerprint
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme, setTheme } = useTheme();
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const handleExportBackup = async () => {
    setDownloading(true);
    try {
      await api.download('/backup/export', `snote_backup_${user?.id || 'data'}_${Date.now()}.json`);
      showToast('Đã tải xuống file sao lưu JSON kèm SHA-256 Checksum thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xuất dữ liệu sao lưu', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      showToast('Đã sao chép Mã tài khoản sinh viên!', 'info');
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Cài Đặt & Quản Lý Dữ Liệu
          </h1>
          <span className="badge badge-blue">SNOTE V1.0</span>
        </div>
        <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
          Quản lý thông tin tài khoản sinh viên, giao diện hiển thị và sao lưu toàn vẹn dữ liệu
        </p>
      </div>

      {/* Profile Section */}
      <div
        className="snote-card animate-fade-in"
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <User size={20} style={{ color: 'var(--accent-primary)' }} />
          <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Hồ Sơ Sinh Viên
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {/* Full name */}
          <div className="snote-card" style={{ padding: '16px', background: 'var(--bg-primary)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <User size={13} />
              Họ và tên
            </span>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {user?.fullName || 'Chưa cập nhật'}
            </div>
          </div>

          {/* Email */}
          <div className="snote-card" style={{ padding: '16px', background: 'var(--bg-primary)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Mail size={13} />
              Email sinh viên
            </span>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {user?.email || 'Chưa cập nhật'}
            </div>
          </div>

          {/* Timezone */}
          <div className="snote-card" style={{ padding: '16px', background: 'var(--bg-primary)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Clock size={13} />
              Múi giờ hoạt động
            </span>
            <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {user?.timezone || 'Asia/Ho_Chi_Minh'}
            </div>
          </div>

          {/* User ID with Copy button */}
          <div className="snote-card" style={{ padding: '16px', background: 'var(--bg-primary)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Fingerprint size={13} />
              Mã định danh (User ID)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <code style={{ fontSize: '11.5px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.id ? `${user.id.slice(0, 16)}...` : 'N/A'}
              </code>
              <button
                onClick={handleCopyId}
                className="btn btn-ghost btn-icon btn-sm"
                title="Sao chép User ID"
                style={{ padding: '4px' }}
              >
                {copiedId ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Appearance & Theme Section */}
      <div
        className="snote-card animate-fade-in"
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Sun size={20} style={{ color: 'var(--color-warning)' }} />
          <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Giao Diện & Chủ Đề Hiển Thị (Appearance)
          </h2>
        </div>

        <p style={{ margin: '0 0 16px 0', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
          Tùy chỉnh chế độ hiển thị phù hợp với điều kiện học tập ban ngày hoặc ban đêm
        </p>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setTheme('dark')}
            className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '12px 20px', borderRadius: 'var(--radius-lg)', flex: 1, minWidth: '180px', justifyContent: 'flex-start' }}
          >
            <Moon size={18} />
            <div style={{ textAlign: 'left', marginLeft: '6px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700 }}>Chủ đề Tối (Dark Slate)</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>Tối ưu dịu mắt khi học đêm</div>
            </div>
          </button>

          <button
            onClick={() => setTheme('light')}
            className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '12px 20px', borderRadius: 'var(--radius-lg)', flex: 1, minWidth: '180px', justifyContent: 'flex-start' }}
          >
            <Sun size={18} />
            <div style={{ textAlign: 'left', marginLeft: '6px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700 }}>Chủ đề Sáng (Light Clean)</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>Rõ ràng trong môi trường nhiều sáng</div>
            </div>
          </button>
        </div>
      </div>

      {/* Backup & Export Section */}
      <div
        className="snote-card animate-fade-in"
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <Database size={20} style={{ color: 'var(--color-info)' }} />
          <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Sao Lưu & Xuất Dữ Liệu Học Tập (1-Click JSON Backup)
          </h2>
        </div>

        <p style={{ margin: '0 0 18px 0', fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Tải về toàn bộ học kỳ, môn học, ghi chú bài giảng Markdown, danh sách công việc và lịch thi của bạn dưới dạng file JSON chuẩn hóa. File sao lưu đính kèm chữ ký mã băm <b>SHA-256 Checksum</b> để đảm bảo tính toàn vẹn 100% khi cần khôi phục.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportBackup}
            disabled={downloading}
            className="btn btn-primary"
            style={{ padding: '11px 22px', fontWeight: 700 }}
          >
            <Download size={16} />
            <span>{downloading ? 'Đang đóng gói dữ liệu...' : 'Tải Về File Sao Lưu (.JSON)'}</span>
          </button>

          <span className="badge badge-green" style={{ padding: '6px 12px' }}>
            <ShieldCheck size={13} />
            <span>Đính kèm SHA-256 Checksum</span>
          </span>
        </div>
      </div>

      {/* Footer info */}
      <div
        style={{
          textAlign: 'center',
          padding: '20px',
          color: 'var(--text-muted)',
          fontSize: '12.5px'
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
          <GraduationCap size={16} style={{ color: 'var(--accent-primary)' }} />
          <span>SNOTE Academic Flow</span>
        </div>
        <p style={{ margin: 0 }}>
          Kiến trúc Modular Monolith • Ràng buộc chống dữ liệu rác • Bảo mật Anti-IDOR
        </p>
      </div>
    </div>
  );
};
