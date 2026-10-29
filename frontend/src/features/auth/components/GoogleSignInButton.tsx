import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { useLanguage } from '../../../contexts/LanguageContext';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  text?: string;
}

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleTokenClient {
  requestAccessToken: (options: { prompt: string }) => void;
}

interface GoogleIdentity {
  accounts: {
    oauth2: {
      initTokenClient: (options: {
        client_id: string;
        scope: string;
        callback: (response: GoogleTokenResponse) => void;
      }) => GoogleTokenClient;
    };
  };
}

export function GoogleSignInButton({ onSuccess, onError, text }: GoogleSignInButtonProps) {
  const { loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const tokenClientRef = useRef<GoogleTokenClient | null>(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) {
      setReady(true);
      return;
    }
    let active = true;
    const initialize = () => {
      const google = (window as Window & { google?: GoogleIdentity }).google;
      if (!active || !google) return;
      tokenClientRef.current = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: async (response) => {
          if (response.error || !response.access_token) {
            const message = response.error_description || response.error || t('auth.google_error');
            onError?.(message);
            showToast(message, 'error');
            setLoading(false);
            return;
          }
          try {
            await loginWithGoogle({ accessToken: response.access_token });
            onSuccess?.();
          } catch (error) {
            const message = error instanceof Error ? error.message : t('auth.google_error');
            onError?.(message);
            showToast(message, 'error');
          } finally {
            setLoading(false);
          }
        }
      });
      setReady(true);
    };

    let script = document.getElementById('google-gsi-script') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      document.body.appendChild(script);
    }
    script.addEventListener('load', initialize);
    initialize();
    return () => {
      active = false;
      script?.removeEventListener('load', initialize);
    };
  }, [clientId, loginWithGoogle, onError, onSuccess, showToast]);

  const handleClick = async (e: React.MouseEvent) => {
    if (clientId) {
      if (!tokenClientRef.current) {
        showToast('Đang khởi tạo kết nối Google, vui lòng thử lại sau vài giây...', 'info');
        return;
      }
      setLoading(true);
      tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
      return;
    }

    // Dev fallback if Client ID is not yet configured in .env
    setLoading(true);
    try {
      let email = 'naverworke.address@gmail.com';
      if (e.altKey) {
        const input = window.prompt('Môi trường Dev: Nhập email Google muốn thử nghiệm:', email);
        if (input === null) {
          setLoading(false);
          return;
        }
        if (input.trim()) email = input.trim();
      }
      await loginWithGoogle({
        accessToken: 'dev-mock-google-token',
        devEmail: email
      });
      showToast(`Đăng nhập thành công với tài khoản Google: ${email}`, 'success');
      onSuccess?.();
    } catch (err: any) {
      const message = err.message || t('auth.google_error');
      onError?.(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={handleClick}
        disabled={loading}
        style={{ width: '100%', justifyContent: 'center', gap: 10, fontWeight: 600 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        {loading ? t('auth.logging_in') : (text || t('auth.google_login'))}
      </button>
      {!clientId && (
        <small style={{ display: 'block', textAlign: 'center', marginTop: '6px', fontSize: 'var(--type-caption)', color: 'var(--text-muted)' }}>
          {t('auth.google_login')}
        </small>
      )}
    </div>
  );
}
