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

  // Sample interactive task states in overview
  const [sampleTasks, setSampleTasks] = useState([
    { id: 't1', title: 'Hoàn thiện kiến trúc WorkspaceLayout & Switcher', deadline: 'Hôm nay', urgent: true, done: true },
    { id: 't2', title: 'Soạn slide báo cáo tiến độ Sprint 1 môn Web', deadline: 'Mai, 23:59', urgent: true, done: false },
    { id: 't3', title: 'Luyện tập đề thi giữa kỳ CSDL (Chương 3 & 4)', deadline: '30/10/2026', urgent: false, done: false },
    { id: 't4', title: 'Đọc tài liệu React 19 Server Components', deadline: '02/11/2026', urgent: false, done: false }
  ]);

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
      {/* 1. Academic Bookshelf Sidebar */}
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
                    ? '🏠 Cá nhân'
                    : currentWorkspace.type === 'SUBJECT'
                    ? `📚 Môn [${currentWorkspace.code || 'INT'}]`
                    : '🚀 Đồ án nhóm'}
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
                    📈 Dòng Thời Gian Tiến Độ Gantt Chart
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
                /* Overview Bento Grid */
                <div className="ws-bento-grid">
                  {/* Left Column: Deadlines & Tasks */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {/* Active Tasks & Deadlines Bento */}
                    <div className="ws-bento-card">
                      <div className="ws-bento-card-title">
                        <span>🎯 Bài tập & Việc cần nộp cận kề</span>
                        <button
                          type="button"
                          className="ws-card-action-link"
                          onClick={() => setActiveNavId('tasks')}
                        >
                          Xem tất cả →
                        </button>
                      </div>

                      <div className="ws-task-strip">
                        {sampleTasks.map((t) => (
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
                            <span className="ws-task-label">{t.title}</span>
                            <span className={`ws-task-deadline ${t.urgent ? 'urgent' : ''}`}>
                              {t.deadline}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Lecture Notes Bento */}
                    <div className="ws-bento-card">
                      <div className="ws-bento-card-title">
                        <span>📖 Ghi chú & Bài giảng gần đây</span>
                        <button
                          type="button"
                          className="ws-card-action-link"
                          onClick={() => setActiveNavId('notes')}
                        >
                          Mở kho ghi chú →
                        </button>
                      </div>

                      <div className="ws-notes-mini-list">
                        <div
                          className="ws-note-mini-item"
                          onClick={() => setActiveNavId('notes')}
                        >
                          <div className="ws-note-mini-title">
                            Kiến trúc Microservices & REST API Design
                          </div>
                          <div className="ws-note-mini-excerpt">
                            Nguyên tắc thiết kế Idempotency, JWT stateless authentication và kỹ thuật phân đoạn cơ sở dữ liệu...
                          </div>
                        </div>

                        <div
                          className="ws-note-mini-item"
                          onClick={() => setActiveNavId('notes')}
                        >
                          <div className="ws-note-mini-title">
                            Tối ưu hóa Truy vấn PostgreSQL & Chỉ mục B-Tree
                          </div>
                          <div className="ws-note-mini-excerpt">
                            Phân tích chi phí EXPLAIN ANALYZE, Sequential Scan so với Index Scan trên bảng dữ liệu lớn...
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Academic Progress & Study Session */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {/* Progress Metric Card */}
                    <div className="ws-bento-card">
                      <div className="ws-bento-card-title">
                        <span>📊 Tiến độ học tập tuần</span>
                      </div>

                      <div className="ws-progress-metric">
                        <div className="ws-progress-header">
                          <span>Tỷ lệ hoàn thành nhiệm vụ</span>
                          <span style={{ color: 'var(--ws-accent)', fontWeight: 700 }}>
                            {progressPercent}%
                          </span>
                        </div>
                        <div className="ws-hairline-track">
                          <div
                            className="ws-hairline-fill"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      <div style={{ fontSize: '11.5px', color: 'var(--ws-text-muted)', lineHeight: 1.6 }}>
                        <div>• Đã hoàn thành: <b>{completedCount}/{sampleTasks.length}</b> mục</div>
                        <div>• Hạn chót kế tiếp: <b>Mai, 23:59</b></div>
                        <div>• Phiên tập trung hôm nay: <b>3 phiên Pomodoro</b></div>
                      </div>
                    </div>

                    {/* Quick Course / Project Meta Bento */}
                    <div className="ws-bento-card">
                      <div className="ws-bento-card-title">
                        <span>ℹ️ Thông tin môn / Dự án</span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--ws-text-muted)', lineHeight: 1.7 }}>
                        {currentWorkspace.code && (
                          <div><b>Mã học phần:</b> <code className="ws-academic-code-mono">{currentWorkspace.code}</code></div>
                        )}
                        <div><b>Vai trò:</b> {currentWorkspace.role === 'OWNER' ? 'Chủ sở hữu' : 'Thành viên'}</div>
                        <div><b>Quy mô:</b> {currentWorkspace.memberCount || 1} thành viên</div>
                        <div><b>Trạng thái:</b> {currentWorkspace.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã lưu trữ'}</div>
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
