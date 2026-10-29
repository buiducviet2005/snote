import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { UserRole } from '@snote/shared';
import { GraduationCap, Users, User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp, vui lòng kiểm tra lại');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có độ dài tối thiểu từ 6 ký tự trở lên');
      return;
    }

    setLoading(true);

    try {
      await register(fullName.trim(), email.trim(), password, undefined, role);
      navigate(role === UserRole.TEACHER ? '/classes' : '/notes');
    } catch (err: any) {
      setError(err.message || 'Đăng ký tài khoản không thành công, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        padding: '24px'
      }}
    >
      <div
        className="snote-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '36px',
          boxShadow: 'var(--shadow-lg)',
          borderRadius: 'var(--radius-xl)'
        }}
      >
        {/* Brand Banner */}
        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              marginBottom: '14px',
              boxShadow: 'var(--shadow-accent)'
            }}
          >
            <GraduationCap size={28} />
          </div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 800,
              margin: '0 0 6px 0',
              letterSpacing: '-0.03em'
            }}
          >
            {role === UserRole.TEACHER ? 'Đăng Ký Tài Khoản Giảng Viên' : 'Đăng Ký Tài Khoản Sinh Viên'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: 0 }}>
            {role === UserRole.TEACHER ? 'Tạo không gian quản lý lớp học và giám sát đồ án sinh viên' : 'Tạo không gian Second Brain cá nhân hóa cho học kỳ mới'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            className="animate-fade-in"
            style={{
              background: 'var(--color-danger-subtle)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--color-danger)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              fontSize: '13.5px',
              lineHeight: 1.4
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Role Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Vai trò sử dụng SNOTE <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setRole(UserRole.STUDENT)}
                style={{
                  padding: '12px 10px',
                  borderRadius: 'var(--radius-lg)',
                  border: `2px solid ${role === UserRole.STUDENT ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                  backgroundColor: role === UserRole.STUDENT ? 'var(--accent-subtle)' : 'var(--bg-primary)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '14px', color: role === UserRole.STUDENT ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                  <GraduationCap size={18} />
                  <span>Sinh viên</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                  Học tập, join lớp, nhận task và làm đồ án
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRole(UserRole.TEACHER)}
                style={{
                  padding: '12px 10px',
                  borderRadius: 'var(--radius-lg)',
                  border: `2px solid ${role === UserRole.TEACHER ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                  backgroundColor: role === UserRole.TEACHER ? 'var(--accent-subtle)' : 'var(--bg-primary)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '14px', color: role === UserRole.TEACHER ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                  <Users size={18} />
                  <span>Giảng viên</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                  Tạo lớp, chia nhóm, theo dõi năng suất
                </span>
              </button>
            </div>
          </div>

          
          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Họ và tên sinh viên
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <User size={16} />
              </span>
              <input
                type="text"
                required
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="snote-input"
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Email sinh viên / học tập
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                placeholder="sinhvien@snote.edu.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="snote-input"
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Mật khẩu
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="snote-input"
                style={{ paddingLeft: '38px', paddingRight: '38px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Xác nhận lại mật khẩu
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Nhập lại mật khẩu trên"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="snote-input"
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              padding: '12px',
              fontSize: '14.5px',
              fontWeight: 700,
              marginTop: '6px'
            }}
          >
            {loading ? 'Đang tạo tài khoản...' : 'Hoàn Tất Đăng Ký'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0 16px 0', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Hoặc đăng ký nhanh với
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
        </div>

        {/* Google Sign-In / Sign-Up */}
        <GoogleSignInButton onSuccess={() => navigate('/notes')} text="Đăng ký nhanh bằng Google" />

        {/* Login Link */}
        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-color)', textAlign: 'center', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
          Đã có tài khoản sinh viên?{' '}
          <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 700 }}>
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
};
