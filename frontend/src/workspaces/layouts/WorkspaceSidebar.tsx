import React from 'react';
import { WorkspaceSummary, NavItemDef } from './types';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  Calendar,
  Layers,
  Kanban,
  ListTodo,
  TrendingUp,
  FolderOpen,
  Users,
  Settings,
  Sparkles,
  Command,
  Maximize2,
  Minimize2,
  Moon,
  Sun,
  LogOut
} from 'lucide-react';

interface WorkspaceSidebarProps {
  currentWorkspace: WorkspaceSummary;
  workspaces: WorkspaceSummary[];
  activeNavId: string;
  onSelectNav: (navId: string) => void;
  onSelectWorkspace: (ws: WorkspaceSummary) => void;
  onCreateWorkspace?: () => void;
  currentUser?: { fullName?: string; email?: string } | null;
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
  activeNavId,
  onSelectNav,
  onSelectWorkspace,
  onCreateWorkspace,
  currentUser,
  onLogout,
  isMobileOpen,
  onCloseMobile,
  onOpenCommandPalette,
  onToggleZenMode,
  isZenMode,
  theme = 'dark',
  onToggleTheme
}) => {
  // Navigation definitions based on workspace type (flat list of icons)
  const getNavItems = (): NavItemDef[] => {
    switch (currentWorkspace.type) {
      case 'PERSONAL':
        return [
          { id: 'overview', label: 'Bàn học tổng quan', iconName: 'dashboard' },
          { id: 'notes', label: 'Ghi chú & Bài đọc', iconName: 'notes', badge: '12' },
          { id: 'tasks', label: 'Việc cần làm hôm nay', iconName: 'tasks', badge: '3' },
          { id: 'calendar', label: 'Lịch học & Deadline', iconName: 'calendar' }
        ];
      case 'SUBJECT':
        return [
          { id: 'overview', label: `Bảng tin môn ${currentWorkspace.code || ''}`, iconName: 'dashboard' },
          { id: 'notes', label: 'Bài giảng & Slide', iconName: 'notes', badge: '8' },
          { id: 'tasks', label: 'Bài tập & Nhiệm vụ', iconName: 'tasks', badge: '2' },
          { id: 'documents', label: 'Tài liệu & Đề thi mẫu', iconName: 'documents' },
          { id: 'members', label: `Giảng viên & Bạn học (${currentWorkspace.memberCount || 1})`, iconName: 'members' }
        ];
      case 'PROJECT':
        return [
          { id: 'overview', label: 'Tổng quan đồ án', iconName: 'dashboard' },
          { id: 'kanban', label: 'Bảng Kanban', iconName: 'kanban' },
          { id: 'tasks', label: 'Danh sách công việc', iconName: 'list', badge: '5' },
          { id: 'gantt', label: 'Dòng thời gian Gantt', iconName: 'gantt' },
          { id: 'notes', label: 'Biên bản & Ghi chép', iconName: 'notes', badge: '4' },
          { id: 'documents', label: 'Tài liệu bàn giao', iconName: 'documents' },
          { id: 'members', label: `Thành viên (${currentWorkspace.memberCount || 1})`, iconName: 'members' }
        ];
    }
  };

  const renderNavIcon = (name: string) => {
    switch (name) {
      case 'dashboard':
        return <LayoutDashboard size={19} />;
      case 'notes':
        return <FileText size={19} />;
      case 'tasks':
        return <CheckSquare size={19} />;
      case 'calendar':
        return <Calendar size={19} />;
      case 'kanban':
        return <Kanban size={19} />;
      case 'list':
        return <ListTodo size={19} />;
      case 'gantt':
        return <TrendingUp size={19} />;
      case 'documents':
        return <FolderOpen size={19} />;
      case 'members':
        return <Users size={19} />;
      case 'settings':
        return <Settings size={19} />;
      default:
        return <Layers size={19} />;
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && <div className="ws-sidebar-backdrop" onClick={onCloseMobile} />}

      <aside className={`ws-icon-rail ${isMobileOpen ? 'open' : ''}`} aria-label="Thanh điều hướng thu gọn">
        {/* Top: Workspace Switcher Mark */}
        <div className="ws-rail-top">
          <WorkspaceSwitcher
            currentWorkspace={currentWorkspace}
            workspaces={workspaces}
            onSelectWorkspace={(ws) => {
              onSelectWorkspace(ws);
              if (onCloseMobile) onCloseMobile();
            }}
            onCreateWorkspace={onCreateWorkspace}
          />
        </div>

        <div className="ws-rail-divider" />

        {/* Center: Main Navigation Icons with Rounded Floating Tooltips */}
        <nav className="ws-rail-nav">
          {navItems.map((item) => {
            const isActive = activeNavId === item.id;
            return (
              <div key={item.id} className="ws-rail-item-wrapper">
                <button
                  type="button"
                  className={`ws-rail-btn ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    onSelectNav(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  title={item.label}
                  aria-label={item.label}
                >
                  <span className="ws-rail-icon">{renderNavIcon(item.iconName)}</span>
                  {item.badge !== undefined && (
                    <span className="ws-rail-badge-dot" />
                  )}
                </button>

                {/* Floating Rounded Tooltip on Hover (Direct sibling of button) */}
                <div className="ws-rail-tooltip" role="tooltip">
                  <span className="ws-tooltip-text">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="ws-tooltip-badge">{item.badge}</span>
                  )}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="ws-rail-divider" />

        {/* Bottom Utility Icons: Command Palette, AI, Zen, Theme, User */}
        <div className="ws-rail-bottom">
          {/* Command Palette Trigger */}
          <div className="ws-rail-item-wrapper">
            <button
              type="button"
              className="ws-rail-btn"
              onClick={onOpenCommandPalette}
              title="Tìm kiếm & Bảng lệnh (Ctrl + K)"
              aria-label="Tìm kiếm và lệnh nhanh"
            >
              <Command size={18} />
            </button>
            <div className="ws-rail-tooltip" role="tooltip">
              <span className="ws-tooltip-text">Tìm kiếm & Bảng lệnh</span>
              <kbd className="ws-tooltip-kbd">Ctrl K</kbd>
            </div>
          </div>

          {/* AI Assistant */}
          <div className="ws-rail-item-wrapper">
            <button
              type="button"
              className="ws-rail-btn"
              onClick={() => onSelectNav('ai-assistant')}
              title="Gia sư AI học thuật"
              aria-label="Gia sư AI học thuật"
            >
              <Sparkles size={18} />
            </button>
            <div className="ws-rail-tooltip" role="tooltip">
              <span className="ws-tooltip-text">Gia sư AI học thuật</span>
            </div>
          </div>

          {/* Zen Focus Mode */}
          <div className="ws-rail-item-wrapper">
            <button
              type="button"
              className={`ws-rail-btn ${isZenMode ? 'active' : ''}`}
              onClick={onToggleZenMode}
              title={isZenMode ? 'Thoát Chế độ tập trung (Z)' : 'Chế độ tập trung (Z)'}
              aria-label="Chế độ tập trung"
            >
              {isZenMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
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
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <div className="ws-rail-tooltip" role="tooltip">
                <span className="ws-tooltip-text">
                  {theme === 'dark' ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
                </span>
              </div>
            </div>
          )}

          <div className="ws-rail-divider" />

          {/* User Avatar with Tooltip & Logout Action */}
          <div className="ws-rail-item-wrapper">
            <div
              className="ws-rail-user-avatar"
              title={currentUser?.fullName || 'Sinh viên'}
            >
              {currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="ws-rail-tooltip user-tooltip" role="tooltip">
              <div className="ws-tooltip-user-meta">
                <div className="ws-tooltip-user-name">{currentUser?.fullName || 'Sinh viên SNOTE'}</div>
                <div className="ws-tooltip-user-email">{currentUser?.email || 'sinhvien@snote.edu.vn'}</div>
              </div>
              {onLogout && (
                <button
                  type="button"
                  className="ws-tooltip-logout-btn"
                  onClick={onLogout}
                  title="Đăng xuất khỏi tài khoản"
                >
                  <LogOut size={13} />
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
