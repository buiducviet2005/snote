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
  GraduationCap
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { to: '/notes', label: 'Ghi chú', icon: BookOpen },
    { to: '/tasks', label: 'Công việc', icon: CheckSquare },
    { to: '/schedule', label: 'Lịch trình', icon: Calendar },
    { to: '/progress', label: 'Tiến độ', icon: BarChart3 },
    { to: '/semesters', label: 'Môn & Học kỳ', icon: Layers },
    { to: '/projects', label: 'Đồ án', icon: FolderKanban },
    { to: '/settings', label: 'Cài đặt & Sao lưu', icon: Settings },
    { to: '/status', label: 'Trạng thái Hệ thống', icon: Activity }
  ];

  return (
    <aside
      className="glass-panel"
      style={{
        width: '250px',
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
                gap: '12px',
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
              <Icon size={18} />
              <span>{item.label}</span>
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
            <span>Giao diện: {theme === 'dark' ? 'Tối (Dark)' : 'Sáng (Light)'}</span>
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Chuyển</span>
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
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--accent-primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  flexShrink: 0
                }}
              >
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}
                >
                  {user.fullName}
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
              style={{ color: 'var(--text-muted)' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
