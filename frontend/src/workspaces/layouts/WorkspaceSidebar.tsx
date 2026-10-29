import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { WorkspaceSummary } from './types';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
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
  GraduationCap
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

  // Academic Core Navigation Items (Pure Monochromatic Icons & Clear Vietnamese Tooltips)
  // Quy tắc người dùng: "Dự án và lớp học nằm ở workspace, không nằm thừa thãi ở bên menu"
  const isTeacher = (currentUser as any)?.role === 'TEACHER';
  const navItems = [
    { id: 'notes', label: 'Ghi Chú Học Tập', icon: FileText, path: '/notes' },
    { id: 'tasks', label: 'Công Việc & Bài Tập', icon: CheckSquare, path: '/tasks' },
    { id: 'schedule', label: 'Thời Khóa Biểu', icon: Calendar, path: '/schedule' },
    { id: 'semesters', label: 'Kế Hoạch Học Kỳ', icon: Layers, path: '/semesters' },
    {
      id: 'classes',
      label: isTeacher ? 'Quản Lý Lớp Học' : 'Lớp Học Phần',
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

      <aside className={`ws-icon-rail ${isMobileOpen ? 'open' : ''}`} aria-label="Thanh điều hướng thu gọn">
        {/* Top: SNOTE Brand Mark */}
        <div className="ws-rail-top">
          <div className="ws-rail-brand-mark" title="SNOTE Academic Precision System">
            <span className="ws-brand-mono">S</span>
          </div>
        </div>

        <div className="ws-rail-divider" />

        {/* Center: Main Academic Navigation Icons with Rounded Floating Tooltips */}
        <nav className="ws-rail-nav">
          {navItems.map((item) => {
            const active = isItemActive(item.path);
            const Icon = item.icon;
            return (
              <div key={item.id} className="ws-rail-item-wrapper">
                <button
                  type="button"
                  className={`ws-rail-btn ${active ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.path)}
                  title={item.label}
                  aria-label={item.label}
                >
                  <span className="ws-rail-icon">
                    <Icon size={19} strokeWidth={1.8} />
                  </span>
                </button>

                {/* Floating Rounded Tooltip on Hover */}
                <div className="ws-rail-tooltip" role="tooltip">
                  <span className="ws-tooltip-text">{item.label}</span>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="ws-rail-divider" />

        {/* Bottom Utility Icons: Command Palette, Zen, Theme, Admin, Settings, User (KHÔNG CÓ AI) */}
        <div className="ws-rail-bottom">
          {/* Zen Focus Mode */}
          <div className="ws-rail-item-wrapper">
            <button
              type="button"
              className={`ws-rail-btn ${isZenMode ? 'active' : ''}`}
              onClick={onToggleZenMode}
              title={isZenMode ? 'Thoát Chế độ tập trung (Z)' : 'Chế độ tập trung (Z)'}
              aria-label="Chế độ tập trung"
            >
              {isZenMode ? <Minimize2 size={18} strokeWidth={1.8} /> : <Maximize2 size={18} strokeWidth={1.8} />}
            </button>
            <div className="ws-rail-tooltip" role="tooltip">
              <span className="ws-tooltip-text">{isZenMode ? 'Thoát Chế độ tập trung' : 'Chế độ tập trung (Zen)'}</span>
              <kbd className="ws-tooltip-kbd">Z</kbd>
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
                  {theme === 'dark' ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
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
                <span className="ws-tooltip-text">Trạng thái Hệ thống & Máy chủ</span>
              </div>
            </div>
          )}

          {/* Settings */}
          <div className="ws-rail-item-wrapper">
            <button
              type="button"
              className={`ws-rail-btn ${currentPath.startsWith('/settings') ? 'active' : ''}`}
              onClick={() => handleNavClick('/settings')}
              title="Cài đặt tài khoản"
              aria-label="Cài đặt"
            >
              <Settings size={18} strokeWidth={1.8} />
            </button>
            <div className="ws-rail-tooltip" role="tooltip">
              <span className="ws-tooltip-text">Cài đặt Tài khoản</span>
            </div>
          </div>

          <div className="ws-rail-divider" />

          {/* User Avatar with Tooltip & Logout Action */}
          <div className="ws-rail-item-wrapper">
            <div
              className="ws-rail-user-avatar"
              title={currentUser?.fullName || 'Sinh viên'}
            >
              {getUserInitial()}
            </div>
            <div className="ws-rail-tooltip user-tooltip" role="tooltip">
              <div className="ws-tooltip-user-meta">
                <div className="ws-tooltip-user-name">{currentUser?.fullName || 'Sinh viên SNOTE'}</div>
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
                  title="Đăng xuất khỏi tài khoản"
                >
                  <LogOut size={13} strokeWidth={1.8} />
                  <span>Đăng xuất</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
