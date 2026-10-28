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
  Bell,
  LogOut,
  Sparkles,
  Command,
  Maximize2
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
  isZenMode
}) => {
  // Navigation definitions based on workspace type
  const getNavSections = (): { title: string; items: NavItemDef[] }[] => {
    switch (currentWorkspace.type) {
      case 'PERSONAL':
        return [
          {
            title: 'HỌC TẬP CÁ NHÂN',
            items: [
              { id: 'overview', label: 'Bàn học tổng quan', iconName: 'dashboard' },
              { id: 'notes', label: 'Ghi chú & Bài đọc', iconName: 'notes', badge: '12' },
              { id: 'tasks', label: 'Việc cần làm hôm nay', iconName: 'tasks', badge: '3' },
              { id: 'calendar', label: 'Lịch học & Deadline', iconName: 'calendar' }
            ]
          }
        ];
      case 'SUBJECT':
        return [
          {
            title: `MÔN HỌC ${currentWorkspace.code ? `[${currentWorkspace.code}]` : ''}`,
            items: [
              { id: 'overview', label: 'Bảng tin môn học', iconName: 'dashboard' },
              { id: 'notes', label: 'Bài giảng & Slide', iconName: 'notes', badge: '8' },
              { id: 'tasks', label: 'Bài tập & Nhiệm vụ', iconName: 'tasks', badge: '2' },
              { id: 'documents', label: 'Tài liệu & Đề thi mẫu', iconName: 'documents' },
              { id: 'members', label: 'Giảng viên & Bạn học', iconName: 'members', badge: currentWorkspace.memberCount }
            ]
          }
        ];
      case 'PROJECT':
        return [
          {
            title: 'TIẾN ĐỘ & NHIỆM VỤ',
            items: [
              { id: 'overview', label: 'Tổng quan đồ án', iconName: 'dashboard' },
              { id: 'kanban', label: 'Bảng Kanban', iconName: 'kanban' },
              { id: 'tasks', label: 'Danh sách công việc', iconName: 'list', badge: '5' },
              { id: 'gantt', label: 'Dòng thời gian Gantt', iconName: 'gantt' }
            ]
          },
          {
            title: 'TÀI NGUYÊN & CỘNG TÁC',
            items: [
              { id: 'notes', label: 'Biên bản & Ghi chép', iconName: 'notes', badge: '4' },
              { id: 'documents', label: 'Tài liệu bàn giao', iconName: 'documents' },
              { id: 'members', label: 'Thành viên nhóm', iconName: 'members', badge: currentWorkspace.memberCount },
              { id: 'settings', label: 'Cài đặt dự án', iconName: 'settings' }
            ]
          }
        ];
    }
  };

  const renderNavIcon = (name: string) => {
    switch (name) {
      case 'dashboard':
        return <LayoutDashboard size={15} />;
      case 'notes':
        return <FileText size={15} />;
      case 'tasks':
        return <CheckSquare size={15} />;
      case 'calendar':
        return <Calendar size={15} />;
      case 'kanban':
        return <Kanban size={15} />;
      case 'list':
        return <ListTodo size={15} />;
      case 'gantt':
        return <TrendingUp size={15} />;
      case 'documents':
        return <FolderOpen size={15} />;
      case 'members':
        return <Users size={15} />;
      case 'settings':
        return <Settings size={15} />;
      default:
        return <Layers size={15} />;
    }
  };

  const sections = getNavSections();

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && <div className="ws-sidebar-backdrop" onClick={onCloseMobile} />}

      <aside className={`ws-sidebar ${isMobileOpen ? 'open' : ''}`}>
        {/* Workspace Switcher Header */}
        <div className="ws-sidebar-header">
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

        {/* Quick Search / Command Palette shortcut trigger in sidebar */}
        <div className="ws-sidebar-quick-cmd">
          <button
            type="button"
            className="ws-sidebar-cmd-btn"
            onClick={onOpenCommandPalette}
            title="Mở bảng lệnh nhanh (Ctrl + K)"
          >
            <Command size={13} />
            <span>Tìm kiếm & Lệnh nhanh</span>
            <kbd>Ctrl K</kbd>
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="ws-sidebar-nav" aria-label="Điều hướng không gian làm việc">
          {sections.map((sec) => (
            <div key={sec.title} className="ws-nav-section">
              <div className="ws-section-label">{sec.title}</div>
              {sec.items.map((item) => {
                const isActive = activeNavId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`ws-nav-link ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      onSelectNav(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                  >
                    <span className="ws-nav-icon">{renderNavIcon(item.iconName)}</span>
                    <span className="ws-nav-text">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="ws-nav-badge">{item.badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Quick study aids */}
          <div className="ws-nav-section ws-sidebar-study-aids">
            <button
              type="button"
              className="ws-nav-link ai-link"
              onClick={() => onSelectNav('ai-assistant')}
            >
              <span className="ws-nav-icon"><Sparkles size={15} /></span>
              <span className="ws-nav-text">Gia sư AI học thuật</span>
            </button>

            <button
              type="button"
              className="ws-nav-link zen-link"
              onClick={onToggleZenMode}
              title="Phím tắt: Z"
            >
              <span className="ws-nav-icon"><Maximize2 size={15} /></span>
              <span className="ws-nav-text">Chế độ tập trung (Zen)</span>
              <kbd className="ws-nav-kbd">Z</kbd>
            </button>
          </div>
        </nav>

        {/* User Card Footer */}
        <div className="ws-sidebar-footer">
          <div className="ws-user-card">
            <div className="ws-user-avatar">
              {currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="ws-user-info">
              <div className="ws-user-name">{currentUser?.fullName || 'Sinh viên SNOTE'}</div>
              <div className="ws-user-email">{currentUser?.email || 'sinhvien@snote.edu.vn'}</div>
            </div>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="ws-logout-btn"
              title="Đăng xuất khỏi SNOTE"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
