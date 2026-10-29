import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './workspaceLayout.css';
import { WorkspaceSummary } from './types';
import { executeWaterDropThemeTransition } from '../utils/themeTransition';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { WorkspaceCommandPalette } from './WorkspaceCommandPalette';
import { WorkspaceQuickCapture } from './WorkspaceQuickCapture';
import { WorkspaceArchivedBanner } from './WorkspaceStates';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useAppFilter } from '../../contexts/AppFilterContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
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
  CheckSquare,
  ChevronDown,
  Globe
} from 'lucide-react';

interface WorkspaceLayoutProps {
  initialWorkspaceId?: string;
  children?: React.ReactNode;
  onOpenCreateNote?: (workspace: WorkspaceSummary) => void;
  onOpenCreateTask?: (workspace: WorkspaceSummary) => void;
  currentUser?: { fullName?: string; email?: string } | null;
  onLogout?: () => void;
}

const UNAVAILABLE_WORKSPACE: WorkspaceSummary = {
  id: '', type: 'PERSONAL', name: 'Không gian làm việc', status: 'ACTIVE', role: 'MEMBER'
};

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  initialWorkspaceId,
  children,
  onOpenCreateNote,
  onOpenCreateTask,
  currentUser: propUser,
  onLogout: propLogout
}) => {
  const { user: authUser, logout: authLogout, isAdmin } = useAuth();
  const { showToast } = useToast();
  const { subjects, setSelectedSubjectId } = useAppFilter();
  const { t, language, toggleLanguage } = useLanguage();
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

  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(
    initialWorkspaceId || ''
  );
  const [workspacesLoading, setWorkspacesLoading] = useState(true);
  const [workspacesError, setWorkspacesError] = useState(false);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isTopbarWorkspaceOpen, setIsTopbarWorkspaceOpen] = useState(false);
  const [invitationsCount, setInvitationsCount] = useState(0);

  const topbarDropdownRef = useRef<HTMLDivElement>(null);

  // Theme state: defaults to dark carbon mode (Linear / Vercel style), toggleable to light
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    executeWaterDropThemeTransition(next, () => {
      setTheme(next);
    });
  };

  // Fetch workspaces from API on mount
  const refreshWorkspaces = useCallback(async () => {
    setWorkspacesLoading(true);
    try {
      const list: { id: string }[] = [];
      let cursor: string | null = null;
      do {
        const res: any = await api.get(`/workspaces?limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
        if (!Array.isArray(res.data)) throw new Error('Invalid workspace response');
        list.push(...res.data);
        cursor = res.meta?.hasMore ? res.meta.nextCursor : null;
      } while (cursor);
      // The list endpoint omits membership role; context is the authority for UI permissions.
      const contexts = await Promise.all(list.map((workspace: { id: string }) =>
        api.get<any>(`/workspaces/${workspace.id}/context`)
      ));
      const summaries: WorkspaceSummary[] = contexts.map((result) => {
        const { workspace, membership } = result.data;
        return {
          id: workspace.id,
          type: workspace.type,
          name: workspace.name,
          status: workspace.status,
          role: membership.role,
          code: workspace.subject?.code || undefined,
          subjectCode: workspace.subject?.code || undefined,
          description: workspace.project?.description || undefined
        };
      });
      setWorkspaces(summaries);
      setWorkspacesError(false);
      setActiveWorkspaceId((current) => summaries.some((w) => w.id === current) ? current : (summaries[0]?.id || ''));
    } catch {
      setWorkspacesError(true);
      setWorkspaces([]);
    } finally {
      setWorkspacesLoading(false);
    }
  }, []);

  const fetchInvitationsCount = useCallback(async () => {
    try {
      const res = await api.get<any>('/workspaces/invitations');
      const list = res.data?.data || res.data || [];
      if (Array.isArray(list)) {
        setInvitationsCount(list.length);
      }
    } catch {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    refreshWorkspaces();
    fetchInvitationsCount();
  }, [refreshWorkspaces, fetchInvitationsCount]);

  // Close topbar dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (topbarDropdownRef.current && !topbarDropdownRef.current.contains(e.target as Node)) {
        setIsTopbarWorkspaceOpen(false);
      }
    };
    if (isTopbarWorkspaceOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isTopbarWorkspaceOpen]);

  const currentWorkspace = useMemo(() => {
    return (
      workspaces.find((w) => w.id === activeWorkspaceId) ||
      workspaces[0] ||
      UNAVAILABLE_WORKSPACE
    );
  }, [workspaces, activeWorkspaceId]);

  const handleSelectWorkspace = (ws: WorkspaceSummary) => {
    setActiveWorkspaceId(ws.id);
    if (ws.type === 'SUBJECT') {
      const matched = subjects.find((s) => (ws.code && s.code === ws.code) || s.name === ws.name || s.id === ws.id);
      if (matched) {
        setSelectedSubjectId(matched.id);
      }
    } else {
      setSelectedSubjectId(null);
    }
  };

  // Keyboard Shortcuts (Ctrl+K: Command, Z: Zen, Q: Quick Capture)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);

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
    if (path.startsWith('/notes')) return 'Ghi chú';
    if (path.startsWith('/tasks')) return 'Công việc';
    if (path.startsWith('/schedule')) return 'Thời khóa biểu';
    if (path.startsWith('/classes')) return 'Lớp học';
    if (path.startsWith('/semesters')) return 'Học kỳ';
    if (path.startsWith('/projects')) return 'Đồ án';
    if (path.startsWith('/progress')) return 'Tiến độ';
    if (path.startsWith('/settings')) return 'Cài đặt';
    if (path.startsWith('/status')) return 'Trạng thái';
    return 'Bàn học';
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
    <div className={`ws-shell theme-${theme} `}>
      {/* 1. Icon-Only Rail Navigation with Rounded Floating Tooltips */}
      <WorkspaceSidebar
        currentWorkspace={currentWorkspace}
        workspaces={workspaces}
        onSelectWorkspace={handleSelectWorkspace}
        onRefreshWorkspaces={() => {
          refreshWorkspaces();
          fetchInvitationsCount();
        }}
        currentUser={currentUser}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
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

            

            {/* Prominent Workspace Selector with Word 'WORKSPACE' and Dropdown Arrow */}
            <div className="ws-topbar-selector-wrap" ref={topbarDropdownRef}>
              <button
                type="button"
                className={`ws-topbar-workspace-btn ${isTopbarWorkspaceOpen ? 'active' : ''}`}
                onClick={() => setIsTopbarWorkspaceOpen(!isTopbarWorkspaceOpen)}
                title="Chọn và quản lý Không gian làm việc (Workspace)"
                aria-haspopup="true"
                aria-expanded={isTopbarWorkspaceOpen}
              >
                <span className={`ws-topbar-ws-tag tag-${currentWorkspace.type.toLowerCase()}`}>
                  {currentWorkspace.type === 'SUBJECT' ? 'LỚP HỌC' : currentWorkspace.type === 'PROJECT' ? 'ĐỒ ÁN' : 'CÁ NHÂN'}
                </span>
                <span className="ws-topbar-ws-name">
                  {workspacesLoading && workspaces.length === 0 ? 'Đang tải không gian...' :
                    workspacesError ? 'Không thể tải không gian' : currentWorkspace.name}
                </span>
                {invitationsCount > 0 && (
                  <span className="ws-topbar-ws-badge">{invitationsCount} lời mời</span>
                )}
                <ChevronDown size={14} className={`ws-topbar-ws-arrow ${isTopbarWorkspaceOpen ? 'open' : ''}`} />
              </button>

              {/* Dropdown Popover */}
              {isTopbarWorkspaceOpen && (
                <div className="ws-topbar-dropdown-popover">
                  {workspacesError && (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={refreshWorkspaces}>
                      Tải lại danh sách không gian
                    </button>
                  )}
                  <WorkspaceSwitcher
                    currentWorkspace={currentWorkspace}
                    workspaces={workspaces}
                    onSelectWorkspace={(ws) => {
                      handleSelectWorkspace(ws);
                      setIsTopbarWorkspaceOpen(false);
                    }}
                    onRefreshWorkspaces={() => {
                      refreshWorkspaces();
                      fetchInvitationsCount();
                    }}
                    isOpen={true}
                    onOpenChange={(open) => setIsTopbarWorkspaceOpen(open)}
                    triggerMode="none"
                  />
                </div>
              )}
            </div>

            {/* Breadcrumb Hierarchy */}
            <div className="ws-breadcrumbs">
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

            

            {/* Language Toggle (VI / EN) */}
            <button
              type="button"
              className="ws-tool-btn ws-lang-toggle-btn"
              onClick={toggleLanguage}
              title={language === 'vi' ? 'Chuyển sang Tiếng Anh (English)' : 'Switch to Vietnamese (Tiếng Việt)'}
              style={{
                fontSize: '11px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '0 8px',
                fontFamily: 'var(--font-mono)'
              }}
            >
              <Globe size={13} />
              <span>{language.toUpperCase()}</span>
            </button>

            <button
              type="button"
              className={`ws-tool-btn ${isQuickCaptureOpen ? 'active' : ''}`}
              onClick={() => setIsQuickCaptureOpen(!isQuickCaptureOpen)}
              title="Bàn ghi nháp siêu tốc (Phím tắt: Q)"
            >
              <PenTool size={14} />
            </button>

            

            {workspaces.length > 0 && currentWorkspace.status === 'ACTIVE' && (
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
                      <span>{currentWorkspace.type === 'SUBJECT' ? 'Ghi chép bài giảng môn' : 'Ghi chú mới'}</span>
                    </button>
                    {(currentWorkspace.type !== 'SUBJECT' || currentWorkspace.role === 'OWNER' || currentWorkspace.role === 'MANAGER') && (
                      <button
                        type="button"
                        className="ws-new-menu-opt"
                        onClick={handleCreateTask}
                      >
                        <CheckSquare size={13} />
                        <span>{currentWorkspace.type === 'SUBJECT' ? 'Ra đề bài tập môn' : 'Bài tập / Nhiệm vụ mới'}</span>
                      </button>
                    )}
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
          />
        )}

        {/* Dynamic Content Canvas - Edge-to-Edge Full Bleed */}
        <main className={`ws-content-scroll ${location.pathname.startsWith('/notes') ? 'ws-content-fullbleed' : ''}`}>
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
          else if (navId === 'tasks' || navId === 'kanban' || navId === 'gantt') navigate('/tasks');
          else if (navId === 'overview') navigate('/notes');
          else if (navId === 'calendar') navigate('/schedule');
          else if (navId === 'classes') navigate('/classes');
          else if (navId === 'semesters') navigate('/semesters');
          else if (navId === 'projects') navigate('/projects');
        }}
        onOpenCreateNote={handleCreateNote}
        onOpenCreateTask={handleCreateTask}
      />

      {/* Global Quick Capture Scratchpad (Q) */}
      <WorkspaceQuickCapture
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        onSaveToPersonalNotes={async (noteContent) => {
          try {
            const firstLine = noteContent.trim().split('\n')[0].replace(/^[#*`_\-\s]+/, '').slice(0, 50);
            await api.post('/notes', {
              title: firstLine || 'Ghi chép nhanh',
              content: noteContent,
              noteType: 'GENERAL'
            });
            showToast('Đã lưu bài ghi vào Kho ghi chú!', 'success');
            setIsQuickCaptureOpen(false);
            window.dispatchEvent(new CustomEvent('snote_refresh_notes'));
          } catch (err: any) {
            showToast(err.message || 'Lỗi lưu ghi chú', 'error');
          }
        }}
      />
    </div>
  );
};
