import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { Modal } from '../../../components/common/Modal';
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowRight, HelpCircle, ShieldCheck, Globe } from 'lucide-react';

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
  const { t, language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate('/notes');
    } catch (err: any) {
      setError(err.message || t('auth.invalid_credentials'));
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
          borderRadius: 'var(--radius-xl)',
          position: 'relative'
        }}
      >
        {/* Language Switcher in Card Header */}
        <div style={{ position: 'absolute', top: '18px', right: '18px' }}>
          <button
            type="button"
            onClick={toggleLanguage}
            className="btn btn-ghost btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: 'var(--type-small)',
              padding: '3px 8px',
              borderRadius: '6px'
            }}
            title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
          >
            <Globe size={14} />
            <span style={{ fontWeight: 700 }}>{language.toUpperCase()}</span>
          </button>
        </div>

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
              fontSize: 'var(--type-display)',
              fontWeight: 800,
              margin: '0 0 6px 0',
              letterSpacing: '-0.03em'
            }}
          >
            {t('auth.login_heading')}{' '}
            <span style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              SNOTE
            </span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--type-small)', margin: 0 }}>
            {t('auth.subtitle')}
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
              fontSize: 'var(--type-small)',
              lineHeight: 1.4
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Email Input */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              {t('auth.email')}
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

          {/* Password Input */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {t('auth.password')}
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
                  fontSize: 'var(--type-small)',
                  cursor: 'pointer',
                  padding: 0,
                  fontWeight: 600
                }}
              >
                {t('auth.forgot_password')}
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
              fontSize: 'var(--type-body)',
              fontWeight: 700,
              marginTop: '6px'
            }}
          >
            {loading ? t('auth.logging_in') : t('auth.login_btn')}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0 16px 0', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
          <span style={{ fontSize: 'var(--type-caption)', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {language === 'vi' ? 'Hoặc tiếp tục với' : 'Or continue with'}
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
        </div>

        {/* Google Sign-In */}
        <GoogleSignInButton onSuccess={() => navigate('/notes')} text={t('auth.google_login')} />

        <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid var(--border-color)', textAlign: 'center', fontSize: 'var(--type-small)', color: 'var(--text-secondary)' }}>
          {t('auth.no_account')}{' '}
          <Link to="/register" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 700 }}>
            {t('auth.register')}
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title={t('auth.forgot_password_title')}
        maxWidth="500px"
        icon={<HelpCircle size={20} />}
      >
        {!forgotSubmitted ? (
          <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ margin: 0, fontSize: 'var(--type-small)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {t('auth.forgot_password_desc')}
            </p>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {t('auth.email')}
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
                {t('common.close')}
              </button>
              <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                {t('auth.send_reset_link')}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'center', padding: '10px 0' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-success-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <ShieldCheck size={24} strokeWidth={1.5} />
            </div>
            <h4 style={{ margin: 0, fontSize: 'var(--type-body)', fontWeight: 700, color: 'var(--text-primary)' }}>
              {t('auth.reset_link_sent')}
            </h4>
            <p style={{ margin: 0, fontSize: 'var(--type-small)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {language === 'vi'
                ? `Nếu email ${forgotEmail} tồn tại trên hệ thống SNOTE, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.`
                : `If ${forgotEmail} is registered in SNOTE, you will receive password reset instructions shortly.`}
            </p>
            <div style={{ marginTop: '8px' }}>
              <button type="button" onClick={() => setIsForgotModalOpen(false)} className="btn btn-primary" style={{ width: '100%', fontWeight: 700 }}>
                {t('common.confirm')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
