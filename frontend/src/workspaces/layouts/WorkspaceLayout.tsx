import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './workspaceLayout.css';
import { WorkspaceSummary } from './types';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { WorkspaceCommandPalette } from './WorkspaceCommandPalette';
import { WorkspaceTimer } from './WorkspaceTimer';
import { WorkspaceQuickCapture } from './WorkspaceQuickCapture';
import { WorkspaceArchivedBanner } from './WorkspaceStates';
import { useAuth } from '../../contexts/AuthContext';
import { FloatingAiChatbot } from '../../features/ai';
import { api } from '../../services/api';
import {
  Menu,
  Search,
  Plus,
  PenTool,
  Maximize2,
  Minimize2,
  Moon,
  Sun,
  FileText,
  CheckSquare
} from 'lucide-react';

interface WorkspaceLayoutProps {
  initialWorkspaceId?: string;
  children?: React.ReactNode;
  onOpenCreateNote?: (workspace: WorkspaceSummary) => void;
  onOpenCreateTask?: (workspace: WorkspaceSummary) => void;
  currentUser?: { fullName?: string; email?: string } | null;
  onLogout?: () => void;
}

// Default Personal Workspace
const DEFAULT_WORKSPACES: WorkspaceSummary[] = [
  {
    id: 'ws-personal',
    type: 'PERSONAL',
    name: 'Không gian Cá nhân',
    description: 'Bàn học riêng tư: Quản lý kế hoạch ôn tập, ghi chép cá nhân',
    status: 'ACTIVE',
    role: 'OWNER'
  },
  {
    id: 'ws-sub-web',
    type: 'SUBJECT',
    name: 'Phát triển ứng dụng Web',
    code: 'INT3306',
    description: 'Học kỳ 1 năm học 2026-2027 • Giảng đường 301-G2',
    status: 'ACTIVE',
    role: 'MEMBER',
    memberCount: 48,
    color: '#6366f1'
  },
  {
    id: 'ws-sub-db',
    type: 'SUBJECT',
    name: 'Cơ sở dữ liệu nâng cao',
    code: 'INT3202',
    description: 'Học kỳ 1 năm học 2026-2027 • Giảng đường 205-G2',
    status: 'ACTIVE',
    role: 'MEMBER',
    memberCount: 52,
    color: '#10b981'
  },
  {
    id: 'ws-proj-snote',
    type: 'PROJECT',
    name: 'Đồ án Xây dựng Website SNOTE',
    description: 'Đồ án lớn môn Web - Nhóm 4 sinh viên K66-CACLC',
    status: 'ACTIVE',
    role: 'OWNER',
    memberCount: 4,
    color: '#f59e0b'
  }
];

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  initialWorkspaceId,
  children,
  onOpenCreateNote,
  onOpenCreateTask,
  currentUser: propUser,
  onLogout: propLogout
}) => {
  const { user: authUser, logout: authLogout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentUser = propUser || authUser;
  const handleLogout = useCallback(async () => {
    if (propLogout) {
      propLogout();
      return;
    }
    try {
      await authLogout();
    } finally {
      navigate('/login');
    }
  }, [propLogout, authLogout, navigate]);

  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>(DEFAULT_WORKSPACES);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(
    initialWorkspaceId || DEFAULT_WORKSPACES[0].id
  );

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  // Theme state: defaults to dark carbon mode (Linear / Vercel style), toggleable to light
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('snote_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('snote_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Fetch workspaces from API on mount
  useEffect(() => {
    let isMounted = true;
    api.get<any>('/workspaces')
      .then((res) => {
        if (!isMounted) return;
        const list = res.data?.data || res.data;
        if (Array.isArray(list) && list.length > 0) {
          setWorkspaces(list);
          if (!list.some((w: WorkspaceSummary) => w.id === activeWorkspaceId)) {
            setActiveWorkspaceId(list[0].id);
          }
        }
      })
      .catch(() => {
        // Keep default workspaces on fallback
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const currentWorkspace = useMemo(() => {
    return (
      workspaces.find((w) => w.id === activeWorkspaceId) ||
      workspaces[0] ||
      DEFAULT_WORKSPACES[0]
    );
  }, [workspaces, activeWorkspaceId]);

  const handleSelectWorkspace = (ws: WorkspaceSummary) => {
    setActiveWorkspaceId(ws.id);
  };

  const handleReopenWorkspace = () => {
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === currentWorkspace.id ? { ...w, status: 'ACTIVE' } : w))
    );
  };

  // Keyboard Shortcuts (Ctrl+K: Command, Z: Zen, Q: Quick Capture)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (!isInput && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        setIsZenMode((prev) => !prev);
      } else if (!isInput && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        setIsQuickCaptureOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute Breadcrumb Title from current route
  const getBreadcrumbTitle = (path: string) => {
    if (path.startsWith('/notes')) return 'Kho Ghi Chú & Bài Giảng';
    if (path.startsWith('/tasks')) return 'Việc Cần Làm & Bài Tập';
    if (path.startsWith('/schedule')) return 'Thời Khóa Biểu & Lịch Thi';
    if (path.startsWith('/classes')) return 'Lớp Học Học Phần';
    if (path.startsWith('/semesters')) return 'Kế Hoạch Học Kỳ';
    if (path.startsWith('/projects')) return 'Đồ Án & Dự Án';
    if (path.startsWith('/ai-chat')) return 'Trợ Lý AI Học Thuật';
    if (path.startsWith('/progress')) return 'Tiến Độ Học Tập';
    if (path.startsWith('/settings')) return 'Cài Đặt Hệ Thống';
    if (path.startsWith('/status')) return 'Trạng Thái Máy Chủ';
    return 'Bàn Học Cá Nhân';
  };

  const handleCreateNote = () => {
    setIsActionMenuOpen(false);
    if (onOpenCreateNote) {
      onOpenCreateNote(currentWorkspace);
    } else {
      navigate('/notes?action=new');
    }
  };

  const handleCreateTask = () => {
    setIsActionMenuOpen(false);
    if (onOpenCreateTask) {
      onOpenCreateTask(currentWorkspace);
    } else {
      navigate('/tasks?action=new');
    }
  };

  return (
    <div className={`ws-shell theme-${theme} ${isZenMode ? 'zen-mode' : ''}`}>
      {/* 1. Icon-Only Rail Navigation with Rounded Floating Tooltips */}
      <WorkspaceSidebar
        currentWorkspace={currentWorkspace}
        workspaces={workspaces}
        onSelectWorkspace={handleSelectWorkspace}
        currentUser={currentUser}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onToggleZenMode={() => setIsZenMode(!isZenMode)}
        isZenMode={isZenMode}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* 2. Main Workstation Arena */}
      <div className="ws-main">
        {/* Topbar Precision Navigation */}
        <header className="ws-topbar">
          <div className="ws-topbar-left">
            <button
              type="button"
              className="icon-button"
              onClick={() => setIsMobileSidebarOpen(true)}
              style={{ display: 'none' }}
              title="Mở menu"
            >
              <Menu size={18} />
            </button>

            {isZenMode && (
              <button
                type="button"
                className="ws-zen-exit-btn"
                onClick={() => setIsZenMode(false)}
                title="Hiện lại thanh bên (Z)"
              >
                <Minimize2 size={13} />
                <span>Thoát Zen Mode</span>
              </button>
            )}

            {/* Breadcrumb Hierarchy */}
            <div className="ws-breadcrumbs">
              <span className="ws-breadcrumb-parent">{currentWorkspace.name}</span>
              <span>/</span>
              <span className="ws-breadcrumb-current">
                {getBreadcrumbTitle(location.pathname)}
              </span>
            </div>
          </div>

          {/* Topbar Tools */}
          <div className="ws-topbar-tools">
            <button
              type="button"
              className="ws-quick-search-pill"
              onClick={() => setIsCommandPaletteOpen(true)}
              title="Tìm kiếm & Mở bảng lệnh (Ctrl + K)"
            >
              <Search size={13} />
              <span>Tìm kiếm & Lệnh...</span>
              <kbd>Ctrl K</kbd>
            </button>

            <WorkspaceTimer />

            <button
              type="button"
              className={`ws-tool-btn ${isQuickCaptureOpen ? 'active' : ''}`}
              onClick={() => setIsQuickCaptureOpen(!isQuickCaptureOpen)}
              title="Bàn ghi nháp siêu tốc (Phím tắt: Q)"
            >
              <PenTool size={14} />
            </button>

            <button
              type="button"
              className="ws-tool-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            <button
              type="button"
              className={`ws-tool-btn ${isZenMode ? 'active' : ''}`}
              onClick={() => setIsZenMode(!isZenMode)}
              title={isZenMode ? 'Thoát Zen Mode (Z)' : 'Bật Zen Mode (Z)'}
            >
              {isZenMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            {currentWorkspace.status === 'ACTIVE' && (
              <div className="ws-new-item-wrap">
                <button
                  type="button"
                  className="ws-new-item-btn"
                  onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                >
                  <Plus size={13} />
                  <span>Tạo mới</span>
                </button>

                {isActionMenuOpen && (
                  <div className="ws-new-item-dropdown">
                    <button
                      type="button"
                      className="ws-new-menu-opt"
                      onClick={handleCreateNote}
                    >
                      <FileText size={13} />
                      <span>Ghi chú bài học mới</span>
                    </button>
                    <button
                      type="button"
                      className="ws-new-menu-opt"
                      onClick={handleCreateTask}
                    >
                      <CheckSquare size={13} />
                      <span>Bài tập / Nhiệm vụ mới</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Persistent Archived Notice Banner */}
        {currentWorkspace.status === 'ARCHIVED' && (
          <WorkspaceArchivedBanner
            isOwner={currentWorkspace.role === 'OWNER'}
            onReopen={handleReopenWorkspace}
          />
        )}

        {/* Dynamic Content Canvas - Edge-to-Edge Full Bleed */}
        <main className="ws-content-scroll">
          {children || <Outlet />}
        </main>
      </div>

      {/* Global Command Palette (Ctrl+K) */}
      <WorkspaceCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onSelectWorkspace={handleSelectWorkspace}
        onSelectNav={(navId) => {
          setIsCommandPaletteOpen(false);
          if (navId === 'notes') navigate('/notes');
          else if (navId === 'tasks') navigate('/tasks');
          else if (navId === 'calendar') navigate('/schedule');
          else if (navId === 'classes') navigate('/classes');
          else if (navId === 'semesters') navigate('/semesters');
          else if (navId === 'projects') navigate('/projects');
          else if (navId === 'ai-assistant') navigate('/ai-chat');
        }}
        onOpenCreateNote={handleCreateNote}
        onOpenCreateTask={handleCreateTask}
        isZenMode={isZenMode}
        onToggleZenMode={() => setIsZenMode(!isZenMode)}
        onToggleTimer={() => {}}
      />

      {/* Global Quick Capture Scratchpad (Q) */}
      <WorkspaceQuickCapture
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
      />

      {/* Global Floating AI Copilot */}
      <FloatingAiChatbot />
    </div>
  );
};
