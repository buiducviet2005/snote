import React, { useState, useEffect } from 'react';
import './workspaceLayout.css';
import { WorkspaceSummary, WorkspaceType } from './types';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { WorkspaceCommandPalette } from './WorkspaceCommandPalette';
import { WorkspaceTimer } from './WorkspaceTimer';
import { WorkspaceQuickCapture } from './WorkspaceQuickCapture';
import {
  WorkspaceArchivedBanner,
  WorkspaceForbiddenState,
  WorkspaceLoadingState
} from './WorkspaceStates';
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
  Sparkles,
  Layers
} from 'lucide-react';

interface WorkspaceLayoutProps {
  initialWorkspaceId?: string;
  children?: React.ReactNode;
  onOpenCreateNote?: (workspace: WorkspaceSummary) => void;
  onOpenCreateTask?: (workspace: WorkspaceSummary) => void;
  currentUser?: { fullName?: string; email?: string } | null;
  onLogout?: () => void;
}

// Sample academic workspaces conforming to C03 / API Contract
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
  },
  {
    id: 'ws-proj-rag',
    type: 'PROJECT',
    name: 'Nghiên cứu Tối ưu AI & RAG',
    description: 'Dự án độc lập phòng thí nghiệm AI',
    status: 'ACTIVE',
    role: 'OWNER',
    memberCount: 2,
    color: '#f43f5e'
  },
  {
    id: 'ws-proj-archive-sample',
    type: 'PROJECT',
    name: 'Đồ án Khóa trước (Lưu trữ)',
    description: 'Đồ án đã bảo vệ xong kỳ trước, lưu lại làm tài liệu tham khảo',
    status: 'ARCHIVED',
    role: 'OWNER',
    memberCount: 3,
    color: '#64748b'
  }
];

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  initialWorkspaceId,
  children,
  onOpenCreateNote,
  onOpenCreateTask,
  currentUser = { fullName: 'Nguyễn Văn Sinh Viên', email: 'sinhvien@snote.edu.vn' },
  onLogout
}) => {
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>(DEFAULT_WORKSPACES);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(
    initialWorkspaceId || DEFAULT_WORKSPACES[0].id
  );
  const [activeNavId, setActiveNavId] = useState<string>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  // Theme state: defaults to dark carbon mode (Linear style), toggleable to light
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('snote_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('snote_theme', theme);
  }, [theme]);

  // Tasks state & inline quick add
  const [sampleTasks, setSampleTasks] = useState([
    { id: 't1', title: 'Hoàn thiện kiến trúc WorkspaceLayout & Switcher', deadline: 'Hôm nay, 23:59', subject: 'INT3306', priority: 'urgent', done: true },
    { id: 't2', title: 'Soạn slide báo cáo tiến độ Sprint 1 môn Web', deadline: 'Mai, 23:59', subject: 'INT3306', priority: 'urgent', done: false },
    { id: 't3', title: 'Luyện tập đề thi giữa kỳ CSDL (Chương 3 & 4)', deadline: '30/10/2026', subject: 'INT3202', priority: 'high', done: false },
    { id: 't4', title: 'Đọc tài liệu React 19 Server Components', deadline: '02/11/2026', subject: 'Tự học', priority: 'normal', done: false }
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'ACTIVE' | 'DONE'>('ALL');

  // Live Desk Scratchpad state (persists in localStorage)
  const [deskScratch, setDeskScratch] = useState(() => {
    return localStorage.getItem('snote_quick_scratchpad') || '';
  });

  useEffect(() => {
    localStorage.setItem('snote_quick_scratchpad', deskScratch);
  }, [deskScratch]);

  // Rich Lecture Notes list
  const sampleNotes = [
    {
      id: 'n1',
      title: 'Kiến trúc Microservices, JWT Auth & REST API Design',
      subject: 'INT3306 • Web',
      category: 'Lý thuyết',
      excerpt: 'Nguyên tắc Idempotency trong HTTP methods (POST vs PUT vs PATCH). Thiết kế JWT stateless token trong memory kết hợp HttpOnly refresh cookie chống XSS/CSRF...',
      words: '1,420 từ',
      readTime: '5 phút đọc',
      updated: '2 giờ trước'
    },
    {
      id: 'n2',
      title: 'Tối ưu hóa Truy vấn PostgreSQL & Kỹ thuật Đánh Chỉ mục B-Tree',
      subject: 'INT3202 • CSDL',
      category: 'Thực hành',
      excerpt: 'Phân tích chi phí EXPLAIN ANALYZE trên bảng 5 triệu bản ghi. So sánh Sequential Scan vs Index Scan, Composite Index và Partial Index trên các trường lọc...',
      words: '2,100 từ',
      readTime: '8 phút đọc',
      updated: 'Hôm qua'
    },
    {
      id: 'n3',
      title: 'Biên bản họp Sprint 1 & Phân chia Module Đồ án SNOTE',
      subject: 'Đồ án nhóm CACLC',
      category: 'Biên bản',
      excerpt: 'Thống nhất hợp đồng API giữa Backend Express và Frontend React 19. Phân định ranh giới giữa thẻ C và thẻ A, quy ước không gian làm việc Worktrees...',
      words: '850 từ',
      readTime: '3 phút đọc',
      updated: '26/10/2026'
    }
  ];

  // Attached Resources
  const sampleResources = [
    { name: 'Slide_BaiGiang_Chuong_4_API_Architecture.pdf', size: '2.4 MB' },
    { name: 'De_cuong_on_tap_giua_ky_CSDL_2026.pdf', size: '1.1 MB' },
    { name: 'PostgreSQL_Query_Optimization_CheatSheet.md', size: '320 KB' }
  ];

  const handleQuickAddTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTaskTitle.trim()) {
      e.preventDefault();
      const newTask = {
        id: `t-${Date.now()}`,
        title: newTaskTitle.trim(),
        deadline: 'Chưa đặt hạn',
        subject: currentWorkspace.code || 'Chung',
        priority: 'normal',
        done: false
      };
      setSampleTasks((prev) => [newTask, ...prev]);
      setNewTaskTitle('');
    }
  };

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  // Global Keyboard Shortcuts (Ctrl+K, Z, Q)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInput = targetTag === 'input' || targetTag === 'textarea';

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (!isInput && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        setIsZenMode((prev) => !prev);
      } else if (!isInput && (e.key === 'q' || e.key === 'Q')) {
        e.preventDefault();
        setIsQuickCaptureOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleSelectWorkspace = (ws: WorkspaceSummary) => {
    setActiveWorkspaceId(ws.id);
    setActiveNavId('overview');
  };

  const handleReopenWorkspace = () => {
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === currentWorkspace.id ? { ...w, status: 'ACTIVE' } : w))
    );
  };

  const toggleTask = (id: string) => {
    setSampleTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const completedCount = sampleTasks.filter((t) => t.done).length;
  const progressPercent = Math.round((completedCount / sampleTasks.length) * 100);

  return (
    <div className={`ws-shell theme-${theme} ${isZenMode ? 'zen-mode' : ''}`}>
      {/* 1. Icon-Only Rail Navigation */}
      <WorkspaceSidebar
        currentWorkspace={currentWorkspace}
        workspaces={workspaces}
        activeNavId={activeNavId}
        onSelectNav={setActiveNavId}
        onSelectWorkspace={handleSelectWorkspace}
        currentUser={currentUser}
        onLogout={onLogout}
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

            {/* In Zen Mode: Provide subtle restore button */}
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
                {activeNavId === 'overview'
                  ? 'Bàn học tổng quan'
                  : activeNavId === 'kanban'
                  ? 'Bảng Kanban'
                  : activeNavId === 'gantt'
                  ? 'Dòng thời gian Gantt'
                  : activeNavId === 'notes'
                  ? 'Kho Ghi chú & Bài giảng'
                  : activeNavId === 'tasks'
                  ? 'Danh sách nhiệm vụ'
                  : activeNavId === 'documents'
                  ? 'Tài liệu & Đề thi'
                  : activeNavId === 'members'
                  ? 'Thành viên'
                  : activeNavId}
              </span>
            </div>
          </div>

          {/* Topbar Tools: Command Search, Pomodoro Timer, Quick Capture, Theme Toggle, New Item */}
          <div className="ws-topbar-tools">
            {/* Quick Command Trigger Pill */}
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

            {/* Pomodoro Focus Timer Capsule */}
            <WorkspaceTimer />

            {/* Quick Capture Scratchpad Trigger */}
            <button
              type="button"
              className={`ws-tool-btn ${isQuickCaptureOpen ? 'active' : ''}`}
              onClick={() => setIsQuickCaptureOpen(!isQuickCaptureOpen)}
              title="Bàn ghi nháp siêu tốc (Phím tắt: Q)"
            >
              <PenTool size={14} />
            </button>

            {/* Theme Toggle (Dark / Light) */}
            <button
              type="button"
              className="ws-tool-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Chuyển sang Giao diện Sáng (Light)' : 'Chuyển sang Giao diện Tối (Dark)'}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            {/* Zen Mode Toggle */}
            <button
              type="button"
              className={`ws-tool-btn ${isZenMode ? 'active' : ''}`}
              onClick={() => setIsZenMode(!isZenMode)}
              title={isZenMode ? 'Thoát Zen Mode (Z)' : 'Bật Zen Mode toàn màn hình (Z)'}
            >
              {isZenMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            {/* Quick Create Action Menu */}
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
                      onClick={() => {
                        setIsActionMenuOpen(false);
                        if (onOpenCreateNote) onOpenCreateNote(currentWorkspace);
                      }}
                    >
                      <FileText size={13} />
                      <span>Ghi chú bài học mới</span>
                    </button>
                    <button
                      type="button"
                      className="ws-new-menu-opt"
                      onClick={() => {
                        setIsActionMenuOpen(false);
                        if (onOpenCreateTask) onOpenCreateTask(currentWorkspace);
                      }}
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

        {/* Dynamic Content Canvas */}
        <main className="ws-content-scroll">
          {children ? (
            children
          ) : (
            <div className="ws-content-inner">
              {/* Workspace Header Block */}
              <div className="ws-canvas-header">
                <div>
                  <h1 className="ws-canvas-title">
                    {activeNavId === 'overview'
                      ? currentWorkspace.name
                      : activeNavId === 'kanban'
                      ? 'Bảng công việc Kanban'
                      : activeNavId === 'gantt'
                      ? 'Dòng thời gian Gantt'
                      : activeNavId === 'notes'
                      ? 'Kho Ghi chú & Bài giảng'
                      : activeNavId === 'tasks'
                      ? 'Danh sách bài tập & Nhiệm vụ'
                      : activeNavId === 'documents'
                      ? 'Tài liệu & Đề thi mẫu'
                      : activeNavId === 'members'
                      ? 'Danh sách thành viên'
                      : 'Cài đặt'}
                  </h1>
                  <p className="ws-canvas-desc">
                    {currentWorkspace.description ||
                      'Không gian làm việc học thuật chính xác cho sinh viên SNOTE.'}
                  </p>
                </div>

                <div className="ws-canvas-badge">
                  {currentWorkspace.type === 'PERSONAL'
                    ? 'Cá nhân'
                    : currentWorkspace.type === 'SUBJECT'
                    ? `Môn [${currentWorkspace.code || 'INT'}]`
                    : 'Đồ án nhóm'}
                </div>
              </div>

              {/* View Rendering based on activeNavId */}
              {activeNavId === 'kanban' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {['CẦN LÀM (TODO)', 'ĐANG LÀM (IN PROGRESS)', 'HOÀN THÀNH (DONE)'].map((col, idx) => (
                    <div
                      key={col}
                      className="ws-bento-card"
                      style={{ minHeight: '380px', display: 'flex', flexDirection: 'column' }}
                    >
                      <div className="ws-bento-card-title">
                        <span>{col}</span>
                        <span style={{ fontSize: '11px', color: 'var(--ws-text-faint)' }}>
                          {idx === 0 ? '2' : idx === 1 ? '1' : '3'}
                        </span>
                      </div>
                      <div className="ws-task-strip">
                        <div className="ws-task-item">
                          <span className="ws-task-label">
                            {idx === 0 ? 'Chuẩn bị tài liệu thuyết trình' : idx === 1 ? 'Phát triển giao diện Workspace' : 'Khởi tạo cấu trúc CSDL'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeNavId === 'gantt' ? (
                <div className="ws-bento-card" style={{ textAlign: 'center', padding: '36px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
                    Dòng Thời Gian Tiến Độ Gantt Chart
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--ws-text-muted)', maxWidth: '540px', margin: '0 auto 20px' }}>
                    Biểu đồ Gantt trực quan được đồng bộ trực tiếp với danh sách nhiệm vụ của dự án theo ranh giới thẻ A06.
                  </p>
                  <div
                    style={{
                      height: '160px',
                      background: 'var(--ws-bg-app)',
                      border: '1px dashed var(--ws-border-hairline)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--ws-text-muted)',
                      fontSize: '12.5px'
                    }}
                  >
                    <span>Lộ trình công việc sẵn sàng tiếp nhận dữ liệu thời gian</span>
                  </div>
                </div>
              ) : (
                /* High-Density 3-Column Ergonomic Academic Cockpit (Full-Bleed 100% Width) */
                <div className="ws-cockpit-grid">
                  {/* Column 1: Task Command Center & Submissions */}
                  <div className="ws-cockpit-card">
                    <div className="ws-card-header-row">
                      <h2 className="ws-card-heading">
                        <span>Bài tập & Nhiệm vụ</span>
                        <span className="ws-card-heading-count">{sampleTasks.length}</span>
                      </h2>
                      <button
                        type="button"
                        className="ws-card-action-link"
                        onClick={() => setActiveNavId('tasks')}
                      >
                        Mở bảng việc →
                      </button>
                    </div>

                    {/* Inline Quick Add Task */}
                    <div className="ws-quick-add-task-wrap">
                      <input
                        type="text"
                        className="ws-quick-add-input"
                        placeholder="+ Thêm nhanh bài tập hoặc việc cần nộp... (Enter)"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={handleQuickAddTask}
                      />
                    </div>

                    {/* Filter Chips */}
                    <div className="ws-filter-chip-row">
                      <button
                        type="button"
                        className={`ws-filter-chip ${taskFilter === 'ALL' ? 'active' : ''}`}
                        onClick={() => setTaskFilter('ALL')}
                      >
                        Tất cả ({sampleTasks.length})
                      </button>
                      <button
                        type="button"
                        className={`ws-filter-chip ${taskFilter === 'ACTIVE' ? 'active' : ''}`}
                        onClick={() => setTaskFilter('ACTIVE')}
                      >
                        Đang làm ({sampleTasks.filter((t) => !t.done).length})
                      </button>
                      <button
                        type="button"
                        className={`ws-filter-chip ${taskFilter === 'DONE' ? 'active' : ''}`}
                        onClick={() => setTaskFilter('DONE')}
                      >
                        Đã xong ({completedCount})
                      </button>
                    </div>

                    {/* Task List */}
                    <div className="ws-task-strip">
                      {sampleTasks
                        .filter((t) => {
                          if (taskFilter === 'ACTIVE') return !t.done;
                          if (taskFilter === 'DONE') return t.done;
                          return true;
                        })
                        .map((t) => (
                          <div
                            key={t.id}
                            className={`ws-task-item ${t.done ? 'done' : ''}`}
                            onClick={() => toggleTask(t.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <input
                              type="checkbox"
                              className="ws-task-checkbox"
                              checked={t.done}
                              onChange={() => toggleTask(t.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="ws-task-content">
                              <div className="ws-task-label">{t.title}</div>
                              <div className="ws-task-sub-row">
                                <span className="ws-task-subject-tag">{t.subject}</span>
                                <span className={`ws-task-priority-tag ${t.priority}`}>
                                  {t.priority === 'urgent' ? 'Gấp' : t.priority === 'high' ? 'Cao' : 'Thường'}
                                </span>
                                <span className="ws-task-deadline">{t.deadline}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Column 2: Lecture Notes & Knowledge Studio */}
                  <div className="ws-cockpit-card">
                    <div className="ws-card-header-row">
                      <h2 className="ws-card-heading">
                        <span>Kho Bài giảng & Ghi chú</span>
                        <span className="ws-card-heading-count">{sampleNotes.length}</span>
                      </h2>
                      <button
                        type="button"
                        className="ws-card-action-link"
                        onClick={() => {
                          if (onOpenCreateNote) onOpenCreateNote(currentWorkspace);
                        }}
                      >
                        + Tạo ghi chép
                      </button>
                    </div>

                    <div className="ws-notes-studio-list">
                      {sampleNotes.map((note) => (
                        <div
                          key={note.id}
                          className="ws-note-studio-item"
                          onClick={() => setActiveNavId('notes')}
                        >
                          <div className="ws-note-studio-top">
                            <span className="ws-note-studio-title">{note.title}</span>
                            <span className="ws-note-studio-tag">{note.category}</span>
                          </div>
                          <div className="ws-note-studio-excerpt">{note.excerpt}</div>
                          <div className="ws-note-studio-meta">
                            <span>{note.subject}</span>
                            <span>•</span>
                            <span>{note.words}</span>
                            <span>•</span>
                            <span>{note.readTime}</span>
                            <span>•</span>
                            <span>{note.updated}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 3: Academic Desk, Weekly Sprint & Live Scratchpad */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {/* Weekly Schedule & Progress Card */}
                    <div className="ws-cockpit-card">
                      <div className="ws-card-header-row">
                        <h2 className="ws-card-heading">
                          <span>Lịch Tuần & Tiến độ</span>
                        </h2>
                        <span style={{ fontSize: '11px', color: 'var(--ws-accent)', fontWeight: 700 }}>
                          {progressPercent}%
                        </span>
                      </div>

                      {/* 7-Day Weekly Deadline Strip */}
                      <div className="ws-week-strip">
                        {[
                          { day: 'T2', date: '26', today: false, hasDeadline: false },
                          { day: 'T3', date: '27', today: false, hasDeadline: false },
                          { day: 'T4', date: '28', today: true, hasDeadline: true },
                          { day: 'T5', date: '29', today: false, hasDeadline: true },
                          { day: 'T6', date: '30', today: false, hasDeadline: true },
                          { day: 'T7', date: '31', today: false, hasDeadline: false },
                          { day: 'CN', date: '01', today: false, hasDeadline: false }
                        ].map((d) => (
                          <div
                            key={d.day}
                            className={`ws-week-day-pill ${d.today ? 'today' : ''}`}
                          >
                            <span>{d.day}</span>
                            <strong>{d.date}</strong>
                            {d.hasDeadline && <span className="ws-week-dot" />}
                          </div>
                        ))}
                      </div>

                      {/* Hairline Progress Meter */}
                      <div className="ws-hairline-track" style={{ marginBottom: '10px' }}>
                        <div
                          className="ws-hairline-fill"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>

                      <div style={{ fontSize: '11px', color: 'var(--ws-text-muted)', lineHeight: 1.6 }}>
                        <div>• Đã hoàn thành: <b>{completedCount}/{sampleTasks.length}</b> bài tập</div>
                        <div>• Hạn nộp cận kề: <b>Hôm nay, 23:59</b> môn Web</div>
                        <div>• Phiên tập trung hôm nay: <b>3 phiên Pomodoro</b></div>
                      </div>
                    </div>

                    {/* Live Desk Scratchpad & Course Documents Card */}
                    <div className="ws-cockpit-card">
                      <div className="ws-card-header-row">
                        <h2 className="ws-card-heading">
                          <span>Bàn Ghi Nháp Trực Tiếp</span>
                        </h2>
                        <span style={{ fontSize: '10px', color: 'var(--ws-text-faint)' }}>Tự lưu</span>
                      </div>

                      {/* Direct Desk Textarea */}
                      <textarea
                        className="ws-desk-textarea"
                        placeholder="Ghi nhanh công thức toán học, đoạn trích bài giảng hoặc việc gấp..."
                        value={deskScratch}
                        onChange={(e) => setDeskScratch(e.target.value)}
                      />

                      {/* Course Resources Links */}
                      <div className="ws-resource-list">
                        <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--ws-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Tài liệu môn học đính kèm
                        </div>
                        {sampleResources.map((res) => (
                          <div key={res.name} className="ws-resource-item">
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                              📄 {res.name}
                            </span>
                            <span className="ws-resource-meta">{res.size}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* 3. Global Command Palette Modal (Ctrl + K) */}
      <WorkspaceCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onSelectWorkspace={handleSelectWorkspace}
        onSelectNav={setActiveNavId}
        onOpenCreateNote={() => {
          if (onOpenCreateNote) onOpenCreateNote(currentWorkspace);
        }}
        onOpenCreateTask={() => {
          if (onOpenCreateTask) onOpenCreateTask(currentWorkspace);
        }}
        isZenMode={isZenMode}
        onToggleZenMode={() => setIsZenMode(!isZenMode)}
        onToggleTimer={() => {
          // Timer toggle from command palette
        }}
      />

      {/* 4. Quick Capture Scratchpad Slide-over Drawer (Q) */}
      <WorkspaceQuickCapture
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        onSaveToPersonalNotes={(scratchContent) => {
          console.log('Saved scratch content to personal notes:', scratchContent);
        }}
      />
    </div>
  );
};
