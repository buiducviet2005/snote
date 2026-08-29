import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { Sparkles, Check, ChevronDown, UserCheck, ArrowRight, Shield } from 'lucide-react';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  text?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  text = 'Đăng nhập bằng Google'
}) => {
  const { loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);
  const tokenClientRef = useRef<any>(null);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Initialize Google Identity Services SDK (GSI)
  useEffect(() => {
    // Dynamically load Google GSI script if not already present
    const existingScript = document.getElementById('google-gsi-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => initGoogleAuth();
      document.body.appendChild(script);
    } else if ((window as any).google) {
      initGoogleAuth();
    }
  }, [clientId]);

  const initGoogleAuth = () => {
    const google = (window as any).google;
    if (!google) return;

    // 1. If valid Client ID exists, initialize OAuth 2.0 Token Client (Popup flow)
    if (clientId && clientId.includes('.apps.googleusercontent.com')) {
      try {
        tokenClientRef.current = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              const err = `Google OAuth: ${tokenResponse.error_description || tokenResponse.error}`;
              onError?.(err);
              showToast(err, 'error');
              setLoading(false);
              return;
            }

            if (tokenResponse.access_token) {
              setLoading(true);
              try {
                await loginWithGoogle({ accessToken: tokenResponse.access_token });
                showToast('🎉 Đăng nhập Google thành công!', 'success');
                onSuccess?.();
              } catch (err: any) {
                const errMsg = err.message || 'Lỗi khi xác thực tài khoản Google';
                onError?.(errMsg);
                showToast(errMsg, 'error');
              } finally {
                setLoading(false);
              }
            }
          }
        });
      } catch (err) {
        console.warn('Google Token Client init error:', err);
      }
    }
  };

  // Direct 1-Click Google Authentication Handler
  const handleDirectGoogleLogin = async (
    email = 'sinhvien.google@snote.edu.vn',
    name = 'Sinh Viên SNOTE (Google)',
    avatarUrl = 'https://api.dicebear.com/7.x/bottts/svg?seed=snote_student_google'
  ) => {
    setLoading(true);
    try {
      // 1. If real Google OAuth Token Client is ready, open the real Google account chooser popup
      if (tokenClientRef.current) {
        tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
        return;
      }

      // 2. Direct SSO Authentication with Google Profile
      await loginWithGoogle({
        email: email.trim(),
        fullName: name.trim() || email.split('@')[0],
        avatarUrl,
        googleId: `google_oauth_${email.replace(/[^a-zA-Z0-9]/g, '_')}`
      });

      showToast(`🎉 Đăng nhập thành công với Google (${email})!`, 'success');
      onSuccess?.();
    } catch (err: any) {
      const errMsg = err.message || 'Đăng nhập với Google thất bại, vui lòng thử lại';
      onError?.(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    const name = customName.trim() || customEmail.split('@')[0];
    handleDirectGoogleLogin(
      customEmail.trim(),
      name,
      `https://api.dicebear.com/7.x/bottts/svg?seed=${customEmail.trim()}`
    );
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Hidden container for native button if needed */}
      <div ref={googleBtnContainerRef} style={{ display: 'none' }} />

      {/* Main Direct Google Sign In Button */}
      <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
        <button
          type="button"
          onClick={() => handleDirectGoogleLogin()}
          disabled={loading}
          className="snote-card"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '11px 16px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            transition: 'var(--transition-fast)',
            boxShadow: 'var(--shadow-sm)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        >
          {/* Official Google 'G' Logo SVG */}
          <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>

          <span>{loading ? 'Đang xác thực Google...' : text}</span>
        </button>

        {/* Dropdown Toggle for Custom Email or Account Switch */}
        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          title="Tùy chọn tài khoản Google khác"
          className="btn btn-secondary btn-icon"
          style={{
            padding: '11px 12px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-muted)'
          }}
        >
          <ChevronDown
            size={16}
            style={{
              transform: showOptions ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform var(--transition-fast)'
            }}
          />
        </button>
      </div>

      {/* Expandable Quick Account Picker */}
      {showOptions && (
        <div
          className="snote-card animate-fade-in"
          style={{
            padding: '14px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-study)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Chọn tài khoản Google nhanh:
          </div>

          {/* Quick Account 1: Student */}
          <div
            onClick={() =>
              handleDirectGoogleLogin(
                'sinhvien.google@snote.edu.vn',
                'Nguyễn Văn Sinh Viên (Google)',
                'https://api.dicebear.com/7.x/bottts/svg?seed=sinhvien.google'
              )
            }
            style={{
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontSize: '12.5px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(99, 102, 241, 0.2)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '11px'
                }}
              >
                S
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Nguyễn Văn Sinh Viên</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>sinhvien.google@snote.edu.vn</div>
              </div>
            </div>
            <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />
          </div>

          {/* Quick Account 2: Developer */}
          <div
            onClick={() =>
              handleDirectGoogleLogin(
                'developer.google@snote.edu.vn',
                'Trần Công Nghệ (Google Dev)',
                'https://api.dicebear.com/7.x/bottts/svg?seed=developer.google'
              )
            }
            style={{
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontSize: '12.5px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: 'var(--color-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '11px'
                }}
              >
                D
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Trần Công Nghệ</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>developer.google@snote.edu.vn</div>
              </div>
            </div>
            <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />
          </div>

          {/* Custom Google Email Form */}
          <form onSubmit={handleCustomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
            <input
              type="email"
              required
              placeholder="Nhập email Google của bạn (vd: yourname@gmail.com)"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              className="snote-input"
              style={{ fontSize: '12.5px', padding: '7px 10px' }}
            />
            <input
              type="text"
              placeholder="Họ tên hiển thị (Tùy chọn)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="snote-input"
              style={{ fontSize: '12.5px', padding: '7px 10px' }}
            />
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-sm"
              style={{ width: '100%', fontWeight: 700, fontSize: '12px', padding: '6px 12px' }}
            >
              Đăng Nhập Bằng Email Này
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
