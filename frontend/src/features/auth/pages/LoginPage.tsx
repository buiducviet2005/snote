import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { Modal } from '../../../components/common/Modal';
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowRight, HelpCircle, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate('/notes');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập không thành công, vui lòng kiểm tra lại email hoặc mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSubmitted(true);
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
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
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
              fontSize: '26px',
              fontWeight: 800,
              margin: '0 0 6px 0',
              letterSpacing: '-0.03em'
            }}
          >
            Đăng nhập <span style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SNOTE</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: 0 }}>
            Nền tảng Quản lý Học tập, Ghi chú & Đồ án cho Sinh viên
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Email Input */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Email tài khoản
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                placeholder="sinhvien@snote.edu.vn hoặc admin@snote.edu.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="snote-input"
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Mật khẩu
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotSubmitted(false);
                  setIsForgotModalOpen(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  padding: 0,
                  fontWeight: 600
                }}
              >
                Quên mật khẩu?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
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

          {/* Submit Button */}
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
            {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0 16px 0', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Hoặc tiếp tục với
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
        </div>

        {/* Google Sign-In */}
        <GoogleSignInButton onSuccess={() => navigate('/notes')} text="Đăng nhập bằng Google" />

        <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid var(--border-color)', textAlign: 'center', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
          Chưa có tài khoản sinh viên?{' '}
          <Link to="/register" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 700 }}>
            Đăng ký ngay
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Khôi phục Mật khẩu Sinh viên"
        maxWidth="500px"
        icon={<HelpCircle size={20} />}
      >
        {!forgotSubmitted ? (
          <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Nhập email tài khoản học tập của bạn. Hệ thống sẽ tiếp nhận yêu cầu đặt lại mật khẩu và gửi thông tin hướng dẫn về hộp thư của bạn.
            </p>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Email tài khoản
              </label>
              <input
                type="email"
                required
                placeholder="sinhvien@snote.edu.vn"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="snote-input"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={() => setIsForgotModalOpen(false)} className="btn btn-secondary">
                Đóng
              </button>
              <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                Gửi Yêu Cầu
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'center', padding: '10px 0' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <ShieldCheck size={28} />
            </div>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Đã ghi nhận yêu cầu khôi phục
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Nếu email <b>{forgotEmail}</b> tồn tại trên hệ thống SNOTE, bạn sẽ nhận được hướng dẫn cấp lại mật khẩu. Trong trường hợp cần hỗ trợ khẩn cấp, vui lòng liên hệ Ban Quản trị qua email <b>admin@snote.edu.vn</b>.
            </p>
            <div style={{ marginTop: '8px' }}>
              <button type="button" onClick={() => setIsForgotModalOpen(false)} className="btn btn-primary" style={{ width: '100%', fontWeight: 700 }}>
                Đã Hiểu
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
