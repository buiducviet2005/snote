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
  Sparkles
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
  onCloseMobile
}) => {
  // Navigation definitions based on workspace type
  const getNavItems = (): { section: string; items: NavItemDef[] }[] => {
    switch (currentWorkspace.type) {
      case 'PERSONAL':
        return [
          {
            section: 'KHÔNG GIAN CÁ NHÂN',
            items: [
              { id: 'overview', label: 'Tổng quan ngày học', iconName: 'dashboard' },
              { id: 'notes', label: 'Ghi chú của tôi', iconName: 'notes', badge: '12' },
              { id: 'tasks', label: 'Việc cần làm hôm nay', iconName: 'tasks', badge: '3' },
              { id: 'calendar', label: 'Lịch học & Deadline', iconName: 'calendar' }
            ]
          }
        ];
      case 'SUBJECT':
        return [
          {
            section: `MÔN HỌC [${currentWorkspace.code || 'INT'}]`,
            items: [
              { id: 'overview', label: 'Bảng tin môn học', iconName: 'dashboard' },
              { id: 'notes', label: 'Bài giảng & Slide', iconName: 'notes' },
              { id: 'tasks', label: 'Bài tập & Nhiệm vụ', iconName: 'tasks', badge: '2' },
              { id: 'documents', label: 'Tài liệu & Đề thi', iconName: 'documents' },
              { id: 'members', label: 'Giảng viên & Bạn học', iconName: 'members', badge: currentWorkspace.memberCount }
            ]
          }
        ];
      case 'PROJECT':
        return [
          {
            section: 'GÓC NHÌN CÔNG VIỆC',
            items: [
              { id: 'overview', label: 'Tiến độ dự án', iconName: 'dashboard' },
              { id: 'kanban', label: 'Bảng Kanban', iconName: 'kanban' },
              { id: 'tasks', label: 'Danh sách việc', iconName: 'list' },
              { id: 'gantt', label: 'Dòng thời gian Gantt', iconName: 'gantt' }
            ]
          },
          {
            section: 'TÀI NGUYÊN & CỘNG TÁC',
            items: [
              { id: 'notes', label: 'Biên bản & Ghi chép', iconName: 'notes' },
              { id: 'documents', label: 'Tài liệu bàn giao', iconName: 'documents' },
              { id: 'members', label: 'Thành viên nhóm', iconName: 'members', badge: currentWorkspace.memberCount },
              { id: 'settings', label: 'Cài đặt dự án', iconName: 'settings' }
            ]
          }
        ];
    }
  };

  const renderIcon = (name: string) => {
    switch (name) {
      case 'dashboard':
        return <LayoutDashboard size={17} />;
      case 'notes':
        return <FileText size={17} />;
      case 'tasks':
        return <CheckSquare size={17} />;
      case 'calendar':
        return <Calendar size={17} />;
      case 'kanban':
        return <Kanban size={17} />;
      case 'list':
        return <ListTodo size={17} />;
      case 'gantt':
        return <TrendingUp size={17} />;
      case 'documents':
        return <FolderOpen size={17} />;
      case 'members':
        return <Users size={17} />;
      case 'settings':
        return <Settings size={17} />;
      default:
        return <Layers size={17} />;
    }
  };

  const sections = getNavItems();

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && <div className="ws-sidebar-backdrop" onClick={onCloseMobile} />}

      <aside className={`ws-sidebar ${isMobileOpen ? 'open' : ''}`}>
        {/* Top Header with WorkspaceSwitcher */}
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

        {/* Navigation Sections */}
        <nav className="ws-sidebar-nav" aria-label="Điều hướng không gian">
          {sections.map((sec) => (
            <div key={sec.section} className="ws-nav-section">
              <div className="ws-section-label">{sec.section}</div>
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
                    {renderIcon(item.iconName)}
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="ws-nav-badge">{item.badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Quick AI Assistant shortcut */}
          <div className="ws-nav-section" style={{ marginTop: 'auto', paddingTop: '10px' }}>
            <button
              type="button"
              className="ws-nav-link"
              onClick={() => onSelectNav('ai-assistant')}
              style={{ color: 'var(--color-purple, #9333ea)' }}
            >
              <Sparkles size={17} />
              <span style={{ fontWeight: 600 }}>Trợ lý học tập AI</span>
            </button>

            <button
              type="button"
              className="ws-nav-link"
              onClick={() => onSelectNav('inbox')}
            >
              <Bell size={17} />
              <span>Hộp thư thông báo</span>
              <span className="ws-nav-badge">1</span>
            </button>
          </div>
        </nav>

        {/* Footer with User Profile */}
        <div className="ws-sidebar-footer">
          <div className="ws-user-card">
            <div className="ws-user-avatar">
              {currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
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
              className="icon-button"
              title="Đăng xuất khỏi SNOTE"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted, #64748b)',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: 'var(--radius-sm, 6px)'
              }}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
