import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { WorkspaceSummary } from './types';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  FileText,
  CheckSquare,
  Calendar,
  Layers,
  Settings,
  Command,
  Maximize2,
  Minimize2,
  Moon,
  Sun,
  LogOut,
  Shield,
  GraduationCap,
  Globe
} from 'lucide-react';

interface WorkspaceSidebarProps {
  currentWorkspace: WorkspaceSummary;
  workspaces: WorkspaceSummary[];
  activeNavId?: string;
  onSelectNav?: (navId: string) => void;
  onSelectWorkspace: (ws: WorkspaceSummary) => void;
  onRefreshWorkspaces?: () => void;
  currentUser?: { fullName?: string; email?: string } | null;
  isAdmin?: boolean;
  onLogout?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenCommandPalette?: () => void;
  onToggleZenMode?: () => void;
  isZenMode?: boolean;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  currentWorkspace,
  workspaces,
  onSelectWorkspace,
  onRefreshWorkspaces,
  currentUser,
  isAdmin = false,
  onLogout,
  isMobileOpen,
  onCloseMobile,
  onOpenCommandPalette,
  onToggleZenMode,
  isZenMode,
  theme = 'dark',
  onToggleTheme
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { t, language, toggleLanguage } = useLanguage();

  const isTeacher = (currentUser as any)?.role === 'TEACHER';
  const navItems = [
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

      <aside className={`ws-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Top: Minimal Brand Icon */}
        <div className="ws-sidebar-header">
          <div
            className="ws-logo-mark"
            onClick={() => handleNavClick('/notes')}
            title="SNOTE Workspace"
          >
            <span>S</span>
          </div>
        </div>

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

        {/* Rail Footer Controls (Command Palette, Language, Theme, Settings, User) */}
        <div className="ws-rail-footer">
          {/* Language Switcher */}
          <div className="ws-rail-item-wrapper">
            <button
              type="button"
              className="ws-rail-btn"
              onClick={toggleLanguage}
              title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
              aria-label="Language Toggle"
              style={{ fontSize: '10.5px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}
            >
              {language.toUpperCase()}
            </button>
            <div className="ws-rail-tooltip" role="tooltip">
              <span className="ws-tooltip-text">
                {language === 'vi' ? 'Đổi sang English' : 'Switch to Tiếng Việt'}
              </span>
            </div>
          </div>

          {/* Quick Command Palette Launcher */}
          {onOpenCommandPalette && (
            <div className="ws-rail-item-wrapper">
              <button
                type="button"
                className="ws-rail-btn"
                onClick={onOpenCommandPalette}
                title={t('nav.command_palette')}
                aria-label="Command Palette"
              >
                <Command size={18} strokeWidth={1.8} />
              </button>
              <div className="ws-rail-tooltip" role="tooltip">
                <span className="ws-tooltip-text">{t('nav.command_palette')}</span>
              </div>
            </div>
          )}

          {/* Zen Mode Toggle */}
          {onToggleZenMode && (
            <div className="ws-rail-item-wrapper">
              <button
                type="button"
                className={`ws-rail-btn ${isZenMode ? 'active' : ''}`}
                onClick={onToggleZenMode}
                title={isZenMode ? 'Thoát Zen Mode (Z)' : 'Bật Zen Mode tập trung (Z)'}
                aria-label="Zen Mode"
              >
                {isZenMode ? <Minimize2 size={18} strokeWidth={1.8} /> : <Maximize2 size={18} strokeWidth={1.8} />}
              </button>
              <div className="ws-rail-tooltip" role="tooltip">
                <span className="ws-tooltip-text">
                  {isZenMode ? 'Thoát Zen Mode' : 'Chế độ Tập Trung (Zen)'}
                </span>
              </div>
            </div>
          )}

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
