import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  BookOpen,
  CheckSquare,
  Calendar,
  BarChart3,
  Layers,
  FolderKanban,
  Settings,
  Activity,
  LogOut,
  Sun,
  Moon,
  GraduationCap,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const baseNavItems = [
    { to: '/notes', label: 'Ghi chú', icon: BookOpen },
    { to: '/tasks', label: 'Công việc', icon: CheckSquare },
    { to: '/schedule', label: 'Lịch trình', icon: Calendar },
    { to: '/progress', label: 'Tiến độ', icon: BarChart3 },
    { to: '/semesters', label: 'Môn & Học kỳ', icon: Layers },
    { to: '/projects', label: 'Đồ án & Nhóm', icon: FolderKanban },
    { to: '/ai-chat', label: 'Trợ lý AI Copilot', icon: Sparkles, badge: 'AI' },
    { to: '/settings', label: 'Cài đặt & Sao lưu', icon: Settings }
  ];

  // Chỉ hiển thị mục Trạng thái hệ thống khi là Admin
  const adminNavItems = isAdmin
    ? [{ to: '/status', label: 'Trạng thái Hệ thống', icon: Activity, badge: 'ADMIN' }]
    : [];

  const navItems = [...baseNavItems, ...adminNavItems];

  return (
    <aside
      className="glass-panel"
      style={{
        width: '256px',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        zIndex: 50
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '20px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid var(--border-color)'
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: 'var(--shadow-accent)',
            flexShrink: 0
          }}
        >
          <GraduationCap size={22} />
        </div>
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            SNOTE
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.04em' }}>
            ACADEMIC BRAIN
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav
        style={{
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          flex: 1,
          overflowY: 'auto'
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            padding: '4px 12px 8px 12px',
            letterSpacing: '0.05em'
          }}
        >
          Không gian học tập
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 14px',
                borderRadius: 'var(--radius-md)',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
                textDecoration: 'none',
                fontSize: '13.5px',
                fontWeight: isActive ? 600 : 500,
                boxShadow: isActive ? 'var(--shadow-accent)' : 'none',
                transition: 'all var(--transition-fast)'
              })}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: item.badge === 'ADMIN' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                    color: item.badge === 'ADMIN' ? 'var(--color-danger)' : 'var(--accent-primary)',
                    border: `1px solid ${item.badge === 'ADMIN' ? 'var(--color-danger)' : 'var(--accent-primary)'}`
                  }}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Theme & User Controls Footer */}
      <div
        style={{
          padding: '14px 16px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          background: 'var(--bg-card)'
        }}
      >
        {/* Quick Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn btn-secondary btn-sm"
          style={{
            width: '100%',
            justifyContent: 'space-between',
            padding: '7px 12px'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
            {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
            <span>Giao diện: {theme === 'dark' ? 'Tối' : 'Sáng'}</span>
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Đổi</span>
        </button>

        {/* User Profile */}
        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isAdmin ? 'var(--color-danger)' : 'var(--accent-primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  flexShrink: 0
                }}
              >
                {isAdmin ? <ShieldCheck size={18} /> : (user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U')}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{user.fullName}</span>
                  {isAdmin && (
                    <span style={{ fontSize: '9px', backgroundColor: 'var(--color-danger)', color: '#fff', padding: '1px 4px', borderRadius: '3px', fontWeight: 800 }}>
                      ADMIN
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}
                >
                  {user.email}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              className="btn btn-ghost btn-icon"
              title="Đăng xuất"
              style={{ color: 'var(--text-muted)', padding: '6px' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
