import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import './workspaceLayout.css';
import { WorkspaceSummary } from './types';
import { executeWaterDropThemeTransition } from '../utils/themeTransition';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { WorkspaceCommandPalette } from './WorkspaceCommandPalette';
import { WorkspaceQuickCapture } from './WorkspaceQuickCapture';
import { WorkspaceArchivedBanner } from './WorkspaceStates';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useAppFilter } from '../../contexts/AppFilterContext';
import { useTheme } from '../../contexts/ThemeContext';
import { api } from '../../services/api';
import {
  Menu,
  Plus,
  FileText,
  CheckSquare,
  ChevronDown
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
    initialWorkspaceId || (authUser?.id ? localStorage.getItem(`snote_workspace_${authUser.id}`) : '') || ''
  );
  const [workspacesLoading, setWorkspacesLoading] = useState(true);
  const [workspacesError, setWorkspacesError] = useState(false);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isTopbarWorkspaceOpen, setIsTopbarWorkspaceOpen] = useState(false);

  const topbarDropdownRef = useRef<HTMLDivElement>(null);
  const previousPathRef = useRef(location.pathname);

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
      const contexts = await Promise.allSettled(list.map((workspace: { id: string }) =>
        api.get<any>(`/workspaces/${workspace.id}/context`)
      ));
      const summaries: WorkspaceSummary[] = contexts.filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled').map((entry) => {
        const result = entry.value;
        const { workspace, membership } = result.data;
        return {
          id: workspace.id,
          type: workspace.type,
          name: workspace.name,
          projectId: workspace.project?.id || undefined,
          subjectId: workspace.subject?.id || undefined,
          groupId: workspace.group?.id || undefined,
          className: workspace.group?.courseClass?.name || undefined,
          status: workspace.status,
          role: membership.role,
          code: workspace.subject?.code || undefined,
          subjectCode: workspace.subject?.code || undefined,
          description: workspace.project?.description || undefined
        };
      });
      setWorkspaces(summaries);
      setWorkspacesError(contexts.some((result) => result.status === 'rejected'));
      setActiveWorkspaceId((current) => summaries.some((w) => w.id === current) ? current : (summaries.find((w) => w.type === 'PERSONAL')?.id || summaries[0]?.id || ''));
    } catch {
      setWorkspacesError(true);
      setWorkspaces([]);
    } finally {
      setWorkspacesLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshWorkspaces();
  }, [refreshWorkspaces]);

  useEffect(() => {
    window.addEventListener('snote_refresh_workspaces', refreshWorkspaces);
    return () => window.removeEventListener('snote_refresh_workspaces', refreshWorkspaces);
  }, [refreshWorkspaces]);

  useEffect(() => {
    if (location.pathname !== previousPathRef.current && location.pathname === '/workspaces') void refreshWorkspaces();
    previousPathRef.current = location.pathname;
  }, [location.pathname, refreshWorkspaces]);

  // Close topbar dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (topbarDropdownRef.current && !topbarDropdownRef.current.contains(e.target as Node)) {
        setIsTopbarWorkspaceOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsTopbarWorkspaceOpen(false);
    };
    if (isTopbarWorkspaceOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
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
    if (authUser?.id) localStorage.setItem(`snote_workspace_${authUser.id}`, ws.id);
    if (ws.type === 'SUBJECT') {
      const matched = subjects.find((s) => s.id === ws.subjectId);
      if (matched) {
        setSelectedSubjectId(matched.id);
      }
    } else {
      setSelectedSubjectId(null);
    }
    if (location.pathname === '/workspaces') navigate('/tasks');
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
    if (path.startsWith('/workspaces')) return 'Không gian';
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
        currentUser={currentUser}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
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
              className="icon-button ws-mobile-menu-btn"
              onClick={() => setIsMobileSidebarOpen(true)}
              title="Mở menu"
              aria-label="Mở menu điều hướng"
            >
              <Menu size={18} />
            </button>

            

            {/* Prominent Workspace Selector with Word 'WORKSPACE' and Dropdown Arrow */}
            <div className="ws-topbar-selector-wrap" ref={topbarDropdownRef}>
              <button
                type="button"
                className={`ws-topbar-workspace-btn ${isTopbarWorkspaceOpen ? 'active' : ''}`}
                onClick={() => setIsTopbarWorkspaceOpen(!isTopbarWorkspaceOpen)}
                title="Chọn không gian làm việc"
                aria-label={`Chọn không gian làm việc, hiện tại: ${currentWorkspace.name}`}
                aria-haspopup="listbox"
                aria-expanded={isTopbarWorkspaceOpen}
              >
                <span className={`ws-topbar-ws-tag tag-${currentWorkspace.type.toLowerCase()}`}>
                  {currentWorkspace.type === 'GROUP' ? 'NHÓM' : currentWorkspace.type === 'SUBJECT' ? 'MÔN HỌC' : currentWorkspace.type === 'PROJECT' ? 'DỰ ÁN' : 'CÁ NHÂN'}
                </span>
                <span className="ws-topbar-ws-name">
                  {workspacesLoading && workspaces.length === 0 ? 'Đang tải không gian...' :
                    workspacesError && workspaces.length === 0 ? 'Không thể tải không gian' : currentWorkspace.name}
                </span>
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
                  <div className="ws-workspace-options" role="listbox" aria-label="Chọn không gian">
                    {workspaces.map((ws) => (
                      <button key={ws.id} type="button" role="option" aria-selected={ws.id === currentWorkspace.id}
                        className={`ws-workspace-option ${ws.id === currentWorkspace.id ? 'selected' : ''}`}
                        onClick={() => { handleSelectWorkspace(ws); setIsTopbarWorkspaceOpen(false); }}>
                        <span className="ws-workspace-option-name">{ws.name}</span>
                        <span className="ws-workspace-option-type">{ws.type === 'PERSONAL' ? 'Cá nhân' : ws.type === 'PROJECT' ? 'Dự án' : ws.type === 'GROUP' ? 'Nhóm' : 'Môn học'}</span>
                      </button>
                    ))}
                    {workspaces.length === 0 && !workspacesLoading && <p className="ws-workspace-empty">Chưa có không gian nào.</p>}
                  </div>
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
            <button type="button" className="ws-new-item-btn ws-create-workspace-btn" onClick={() => navigate('/workspaces?create=1')} aria-label="Tạo không gian dự án cá nhân" title="Tạo không gian dự án cá nhân">
              <Plus size={14} /> <span>Tạo không gian</span>
            </button>
            {workspaces.length > 0 && currentWorkspace.status === 'ACTIVE' && (
              <div className="ws-new-item-wrap">
                <button
                  type="button"
                  className="ws-new-item-btn"
                  onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                  aria-label="Tạo ghi chú hoặc công việc"
                  aria-expanded={isActionMenuOpen}
                  title="Tạo ghi chú hoặc công việc"
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
        <main className={`ws-content-scroll ${location.pathname.startsWith('/notes') ? 'ws-content-fullbleed' : ''} ${location.pathname.startsWith('/tasks') ? 'ws-content-tasks' : ''}`}>
          {children || <Outlet context={{ workspaces, currentWorkspace, onSelectWorkspace: handleSelectWorkspace, refreshWorkspaces, workspacesLoading, workspacesError }} />}
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
              noteType: 'GENERAL',
              workspaceId: workspaces.find((workspace) => workspace.type === 'PERSONAL')?.id
            });
            showToast('Đã lưu vào ghi chú cá nhân', 'success');
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
