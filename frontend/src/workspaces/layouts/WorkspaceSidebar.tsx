import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  FileText,
  CheckSquare,
  Calendar,
  Layers,
  Settings,
  Moon,
  Sun,
  LogOut,
  Shield,
  GraduationCap,
  Globe
} from 'lucide-react';

interface WorkspaceSidebarProps {
  currentUser?: { fullName?: string; email?: string } | null;
  isAdmin?: boolean;
  onLogout?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  currentUser,
  isAdmin = false,
  onLogout,
  isMobileOpen,
  onCloseMobile,
  theme = 'dark',
  onToggleTheme
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { t, language, toggleLanguage } = useLanguage();

  const isTeacher = (currentUser as any)?.role === 'TEACHER';
  const navItems = [
    { id: 'workspaces', label: 'Không gian', icon: Layers, path: '/workspaces' },
    { id: 'notes', label: t('nav.notes'), icon: FileText, path: '/notes' },
    { id: 'tasks', label: t('nav.tasks'), icon: CheckSquare, path: '/tasks' },
    { id: 'schedule', label: t('nav.schedule'), icon: Calendar, path: '/schedule' },
    {
      id: 'classes',
      label: isTeacher ? (language === 'vi' ? 'Quản Lý Lớp Học' : 'Manage Classes') : t('nav.classes'),
      icon: GraduationCap,
      path: '/classes'
    }
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    if (onCloseMobile) onCloseMobile();
  };

  const isItemActive = (path: string) => {
    if (path === '/notes') {
      return currentPath === '/' || currentPath === '/notes' || currentPath.startsWith('/notes/');
    }
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  const getUserInitial = () => {
    if (currentUser?.fullName && currentUser.fullName.trim().length > 0) {
      const parts = currentUser.fullName.trim().split(/\s+/);
      const lastWord = parts[parts.length - 1];
      return lastWord.charAt(0).toUpperCase();
    }
    return 'S';
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && <div className="ws-sidebar-backdrop" onClick={onCloseMobile} />}

      <aside className={`ws-icon-rail ws-sidebar ${isMobileOpen ? 'open mobile-open' : ''}`} aria-label="Thanh điều hướng">
        {/* Top: Minimal Brand Icon */}
        <div className="ws-rail-top ws-sidebar-header">
          <button
            type="button"
            className="ws-rail-brand-mark ws-logo-mark"
            onClick={() => handleNavClick('/notes')}
            title="Về trang ghi chú"
            aria-label="Về trang ghi chú"
          >
            <span className="ws-brand-mono">S</span>
          </button>
        </div>

        <div className="ws-rail-divider" />

        {/* Rail Navigation Icon Items */}
        <nav className="ws-rail-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.path);

            return (
              <div key={item.id} className="ws-rail-item-wrapper">
                <button
                  type="button"
                  className={`ws-rail-btn ${active ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.path)}
                  title={item.label}
                  aria-label={item.label}
                >
                  <Icon size={18} strokeWidth={1.8} />
                </button>
                {/* Floating Tooltip */}
                <div className="ws-rail-tooltip" role="tooltip">
                  <span className="ws-tooltip-text">{item.label}</span>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Rail Bottom Footer Controls (Theme, Admin, Settings, User - Pinned to bottom) */}
        <div className="ws-rail-bottom ws-rail-footer">
          <div className="ws-rail-item-wrapper">
            <button
              type="button"
              className="ws-rail-btn ws-lang-toggle-btn"
              onClick={toggleLanguage}
              title={language === 'vi' ? 'Chuyển sang tiếng Anh' : 'Switch to Vietnamese'}
              aria-label={language === 'vi' ? 'Chuyển sang tiếng Anh' : 'Switch to Vietnamese'}
            >
              <Globe size={17} strokeWidth={1.8} aria-hidden="true" />
              <span className="ws-rail-language-code" aria-hidden="true">{language.toUpperCase()}</span>
            </button>
            <div className="ws-rail-tooltip" role="tooltip">
              <span className="ws-tooltip-text">{language === 'vi' ? 'Ngôn ngữ: Tiếng Việt' : 'Language: English'}</span>
            </div>
          </div>

          {/* Dark / Light Theme Toggle */}
          {onToggleTheme && (
            <div className="ws-rail-item-wrapper">
              <button
                type="button"
                className="ws-rail-btn"
                onClick={onToggleTheme}
                title={theme === 'dark' ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
                aria-label="Đổi giao diện sáng/tối"
              >
                {theme === 'dark' ? <Sun size={18} strokeWidth={1.8} /> : <Moon size={18} strokeWidth={1.8} />}
              </button>
              <div className="ws-rail-tooltip" role="tooltip">
                <span className="ws-tooltip-text">
                  {theme === 'dark' ? 'Giao diện Sáng' : 'Giao diện Tối'}
                </span>
              </div>
            </div>
          )}

          {/* Admin System Status (Only visible if admin) */}
          {isAdmin && (
            <div className="ws-rail-item-wrapper">
              <button
                type="button"
                className={`ws-rail-btn ${currentPath.startsWith('/status') ? 'active' : ''}`}
                onClick={() => handleNavClick('/status')}
                title="Trạng thái hệ thống máy chủ"
                aria-label="Trạng thái hệ thống"
              >
                <Shield size={18} strokeWidth={1.8} />
              </button>
              <div className="ws-rail-tooltip" role="tooltip">
                <span className="ws-tooltip-text">Hệ Thống</span>
              </div>
            </div>
          )}

          {/* Settings */}
          <div className="ws-rail-item-wrapper">
            <button
              type="button"
              className={`ws-rail-btn ${currentPath.startsWith('/settings') ? 'active' : ''}`}
              onClick={() => handleNavClick('/settings')}
              title={t('nav.settings')}
              aria-label="Settings"
            >
              <Settings size={18} strokeWidth={1.8} />
            </button>
            <div className="ws-rail-tooltip" role="tooltip">
              <span className="ws-tooltip-text">{t('nav.settings')}</span>
            </div>
          </div>

          <div className="ws-rail-divider" />

          {/* User Avatar with Tooltip & Logout Action */}
          <div className="ws-rail-item-wrapper">
            <div
              className="ws-rail-user-avatar"
              title={currentUser?.fullName || (isTeacher ? t('classes.role_teacher') : t('classes.role_student'))}
            >
              {getUserInitial()}
            </div>
            <div className="ws-rail-tooltip user-tooltip" role="tooltip">
              <div className="ws-tooltip-user-meta">
                <div className="ws-tooltip-user-name">{currentUser?.fullName || 'SNOTE User'}</div>
                <div className="ws-tooltip-user-email">{currentUser?.email || ''}</div>
                {isAdmin && (
                  <span style={{ fontSize: '9.5px', color: 'var(--ws-accent-blue)', marginTop: '2px', fontWeight: 600 }}>
                    Quản trị viên
                  </span>
                )}
              </div>
              {onLogout && (
                <button
                  type="button"
                  className="ws-tooltip-logout-btn"
                  onClick={onLogout}
                  title={t('auth.logout')}
                >
                  <LogOut size={13} strokeWidth={1.8} />
                  <span>{t('auth.logout')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
