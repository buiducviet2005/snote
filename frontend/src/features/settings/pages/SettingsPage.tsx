import React, { useState, useEffect } from 'react';
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
  Fingerprint,
  Lock,
  Save,
  KeyRound,
  ShieldAlert
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile, changePassword, isAdmin } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  // Profile Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Ho_Chi_Minh');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [downloading, setDownloading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setTimezone(user.timezone || 'Asia/Ho_Chi_Minh');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Họ và tên không được để trống', 'error');
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        timezone: timezone.trim()
      });
      showToast('Cập nhật thông tin cá nhân thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi cập nhật thông tin', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showToast('Vui lòng điền đầy đủ mật khẩu cũ và mới', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('Mật khẩu mới phải có tối thiểu 6 ký tự', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Mật khẩu mới và xác nhận mật khẩu không khớp nhau', 'error');
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword({
        currentPassword,
        newPassword
      });
      showToast('Đổi mật khẩu bảo vệ tài khoản thành công!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi đổi mật khẩu', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

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
            Cài Đặt Tài Khoản & Quản Lý Dữ Liệu
          </h1>
          <span className={`badge ${isAdmin ? 'badge-rose' : 'badge-blue'}`}>
            {isAdmin ? '🛡️ QUẢN TRỊ VIÊN (ADMIN)' : '🎓 SINH VIÊN (STUDENT)'}
          </span>
        </div>
        <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
          Quản lý thông tin tài khoản, đổi mật khẩu bảo mật và sao lưu toàn vẹn dữ liệu
        </p>
      </div>

      {/* Profile Edit Section */}
      <div
        className="snote-card animate-fade-in"
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={20} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Thông Tin Hồ Sơ Cá Nhân
            </h2>
          </div>
          <span className="badge badge-neutral">
            ID: {user?.id ? `${user.id.slice(0, 8)}...` : 'N/A'}
          </span>
        </div>

        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Họ và tên sinh viên *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="snote-input"
                style={{ fontWeight: 600 }}
              />
            </div>

            {/* Email (Readonly) */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Email tài khoản (Không thể thay đổi)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="snote-input"
                style={{ opacity: 0.7, cursor: 'not-allowed', backgroundColor: 'var(--bg-primary)' }}
              />
            </div>

            {/* Timezone */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Múi giờ hoạt động
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="snote-select"
              >
                <option value="Asia/Ho_Chi_Minh">Giờ Việt Nam (Asia/Ho_Chi_Minh - GMT+7)</option>
                <option value="Asia/Bangkok">Bangkok (Asia/Bangkok - GMT+7)</option>
                <option value="Asia/Tokyo">Tokyo / Seoul (GMT+9)</option>
                <option value="UTC">Giờ Quốc Tế (UTC)</option>
              </select>
            </div>

            {/* User ID copy */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Mã tài khoản (User ID)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  disabled
                  value={user?.id || ''}
                  className="snote-input"
                  style={{ opacity: 0.7, fontSize: '11.5px', fontFamily: 'monospace' }}
                />
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="btn btn-secondary btn-icon"
                  title="Sao chép User ID"
                >
                  {copiedId ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button
              type="submit"
              disabled={savingProfile}
              className="btn btn-primary"
              style={{ fontWeight: 600 }}
            >
              <Save size={15} />
              <span>{savingProfile ? 'Đang lưu...' : 'Lưu Thay Đổi Hồ Sơ'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Section */}
      <div
        className="snote-card animate-fade-in"
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <KeyRound size={20} style={{ color: 'var(--color-warning)' }} />
          <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Đổi Mật Khẩu Bảo Vệ Tài Khoản
          </h2>
        </div>

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Mật khẩu hiện tại *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="snote-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Mật khẩu mới * (Tối thiểu 6 ký tự)
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="snote-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Xác nhận mật khẩu mới *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="snote-input"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button
              type="submit"
              disabled={savingPassword}
              className="btn btn-secondary"
              style={{ fontWeight: 600 }}
            >
              <Lock size={15} />
              <span>{savingPassword ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}</span>
            </button>
          </div>
        </form>
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
          Kiến trúc Modular Monolith • Ràng buộc chống dữ liệu rác • Bảo mật Anti-IDOR & RBAC
        </p>
      </div>
    </div>
  );
};
