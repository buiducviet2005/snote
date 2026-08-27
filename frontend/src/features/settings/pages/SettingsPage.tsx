import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { api } from '../../../services/api';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const handleExportBackup = async () => {
    setDownloading(true);
    try {
      await api.download('/backup/export', `snote_backup_${user?.id || 'data'}_${Date.now()}.json`);
      showToast('Đã tải xuống file sao lưu JSON thành công!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xuất dữ liệu sao lưu', 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
          ⚙️ Cài Đặt Tài Khoản & Quản Lý Dữ Liệu
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
          Quản lý thông tin sinh viên và sao lưu dữ liệu học tập cá nhân
        </p>
      </div>

      {/* Profile Section */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '24px',
          marginBottom: '28px'
        }}
      >
        <h2 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 18px 0', color: 'var(--text-primary)' }}>
          👤 Hồ Sơ Sinh Viên
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Họ và tên
            </label>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {user?.fullName || 'Chưa cập nhật'}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Email sinh viên
            </label>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {user?.email || 'Chưa cập nhật'}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Múi giờ hoạt động
            </label>
            <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
              {user?.timezone || 'Asia/Ho_Chi_Minh'}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Mã tài khoản (User ID)
            </label>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
              {user?.id || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Backup & Export Section */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '24px',
          marginBottom: '28px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              💾 Sao Lưu & Xuất Dữ Liệu Học Tập (JSON Export)
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Tải về toàn bộ học kỳ, môn học, ghi chú bài giảng, công việc và lịch thi của bạn dưới dạng tệp JSON chuẩn kèm chữ ký mã băm SHA-256 Checksum bảo vệ toàn vẹn dữ liệu.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <button
            onClick={handleExportBackup}
            disabled={downloading}
            style={{
              padding: '12px 22px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--accent-primary)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '14px',
              cursor: downloading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              opacity: downloading ? 0.7 : 1,
              boxShadow: '0 4px 14px rgba(59,130,246,0.3)'
            }}
          >
            <span>📥</span>
            {downloading ? 'Đang đóng gói dữ liệu...' : 'Tải Về File Sao Lưu (.JSON)'}
          </button>
        </div>
      </div>

      {/* About SNOTE */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '24px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '13px'
        }}
      >
        <div style={{ fontSize: '20px', marginBottom: '8px' }}>🎓 SNOTE Academic Workspace</div>
        <p style={{ margin: '0 0 4px 0' }}>Phiên bản V1.0.0 – Phát triển trên nền tảng React 19 + Express 5 + PostgreSQL</p>
        <p style={{ margin: 0, fontSize: '12px', opacity: 0.7 }}>Tuân thủ kiến trúc Modular Monolith & Ràng buộc chống dữ liệu rác</p>
      </div>
    </div>
  );
};
