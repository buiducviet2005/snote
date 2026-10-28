import React, { useState, useEffect } from 'react';
import './workspaceLayout.css';
import { WorkspaceSummary, WorkspaceType } from './types';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import {
  WorkspaceArchivedBanner,
  WorkspaceForbiddenState,
  WorkspaceLoadingState
} from './WorkspaceStates';
import {
  Menu,
  Search,
  Plus,
  Sparkles,
  Command,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface WorkspaceLayoutProps {
  initialWorkspaceId?: string;
  children?: React.ReactNode;
  onOpenCreateNote?: (workspace: WorkspaceSummary) => void;
  onOpenCreateTask?: (workspace: WorkspaceSummary) => void;
  currentUser?: { fullName?: string; email?: string } | null;
  onLogout?: () => void;
}

// Mock initial workspaces conforming to C03 / API Contract
const DEFAULT_WORKSPACES: WorkspaceSummary[] = [
  {
    id: 'ws-personal',
    type: 'PERSONAL',
    name: 'Không gian Cá nhân',
    description: 'Quản lý việc học và ghi chú riêng',
    status: 'ACTIVE',
    role: 'OWNER'
  },
  {
    id: 'ws-sub-web',
    type: 'SUBJECT',
    name: 'Phát triển ứng dụng Web',
    code: 'INT3306',
    description: 'Học kỳ 1 năm học 2026-2027',
    status: 'ACTIVE',
    role: 'MEMBER',
    memberCount: 48,
    color: '#3b82f6'
  },
  {
    id: 'ws-sub-db',
    type: 'SUBJECT',
    name: 'Cơ sở dữ liệu nâng cao',
    code: 'INT3202',
    description: 'Học kỳ 1 năm học 2026-2027',
    status: 'ACTIVE',
    role: 'MEMBER',
    memberCount: 52,
    color: '#10b981'
  },
  {
    id: 'ws-proj-snote',
    type: 'PROJECT',
    name: 'Đồ án Xây dựng Website SNOTE',
    description: 'Bài tập lớn môn Web - Nhóm 4 sinh viên',
    status: 'ACTIVE',
    role: 'OWNER',
    memberCount: 4,
    color: '#7c3aed'
  },
  {
    id: 'ws-proj-rag',
    type: 'PROJECT',
    name: 'Nghiên cứu Tối ưu AI & RAG',
    description: 'Dự án độc lập (không thuộc môn học)',
    status: 'ACTIVE',
    role: 'OWNER',
    memberCount: 2,
    color: '#f59e0b'
  },
  {
    id: 'ws-proj-archive-sample',
    type: 'PROJECT',
    name: 'Đồ án Khóa trước (Lưu trữ)',
    description: 'Đồ án đã bảo vệ xong kỳ trước',
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
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  // Shortcut Ctrl + K for quick search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        alert('Phím tắt tìm kiếm nhanh toàn hệ thống (Ctrl + K) đang hoạt động');
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

  return (
    <div className="ws-shell">
      {/* Modern Workspace Sidebar */}
      <WorkspaceSidebar
        currentWorkspace={currentWorkspace}
        workspaces={workspaces}
        activeNavId={activeNavId}
        onSelectNav={setActiveNavId}
        onSelectWorkspace={handleSelectWorkspace}
        onCreateWorkspace={() => setIsCreatingNew(true)}
        currentUser={currentUser}
        onLogout={onLogout}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="ws-main">
        {/* Top Navigation Bar */}
        <header className="ws-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              className="icon-button"
              onClick={() => setIsMobileSidebarOpen(true)}
              style={{ display: 'none', background: 'transparent', border: 'none', cursor: 'pointer' }}
              title="Mở menu"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb Hierarchy */}
            <div className="ws-breadcrumbs">
              <span style={{ fontWeight: 600 }}>{currentWorkspace.name}</span>
              <span>/</span>
              <b style={{ textTransform: 'capitalize' }}>
                {activeNavId === 'overview'
                  ? 'Tổng quan'
                  : activeNavId === 'kanban'
                  ? 'Bảng Kanban'
                  : activeNavId === 'gantt'
                  ? 'Dòng thời gian Gantt'
                  : activeNavId === 'notes'
                  ? 'Ghi chú'
                  : activeNavId === 'tasks'
                  ? 'Công việc'
                  : activeNavId === 'documents'
                  ? 'Tài liệu'
                  : activeNavId === 'members'
                  ? 'Thành viên'
                  : activeNavId}
              </b>
            </div>
          </div>

          {/* Quick Action Topbar Tools */}
          <div className="ws-topbar-actions">
            {/* Quick Search Pill */}
            <button
              type="button"
              onClick={() => alert('Mở thanh tìm kiếm Command Palette')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-md, 8px)',
                border: '1px solid var(--border-color, #e2e8f0)',
                background: 'var(--bg-secondary, #f8fafc)',
                color: 'var(--text-muted, #64748b)',
                fontSize: '12.5px',
                cursor: 'pointer'
              }}
            >
              <Search size={14} />
              <span>Tìm kiếm...</span>
              <kbd
                style={{
                  fontSize: '10px',
                  padding: '2px 5px',
                  borderRadius: '4px',
                  background: 'var(--bg-primary, #ffffff)',
                  border: '1px solid var(--border-color, #cbd5e1)'
                }}
              >
                Ctrl K
              </kbd>
            </button>

            {/* New Item Action Button */}
            {currentWorkspace.status === 'ACTIVE' && (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 600,
                    fontSize: '13px',
                    padding: '6px 12px'
                  }}
                >
                  <Plus size={15} />
                  <span>Tạo mới</span>
                </button>

                {isActionMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '100%',
                      marginTop: '6px',
                      background: 'var(--bg-primary, #ffffff)',
                      border: '1px solid var(--border-color, #e2e8f0)',
                      borderRadius: 'var(--radius-md, 8px)',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
                      minWidth: '160px',
                      zIndex: 50,
                      padding: '4px'
                    }}
                  >
                    <button
                      type="button"
                      className="ws-item-btn"
                      onClick={() => {
                        setIsActionMenuOpen(false);
                        if (onOpenCreateNote) onOpenCreateNote(currentWorkspace);
                      }}
                    >
                      📝 Tạo ghi chú mới
                    </button>
                    <button
                      type="button"
                      className="ws-item-btn"
                      onClick={() => {
                        setIsActionMenuOpen(false);
                        if (onOpenCreateTask) onOpenCreateTask(currentWorkspace);
                      }}
                    >
                      ✅ Tạo nhiệm vụ mới
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
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
              {/* Header card for the active section */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  paddingBottom: '20px',
                  marginBottom: '20px',
                  borderBottom: '1px solid var(--border-color, #e2e8f0)'
                }}
              >
                <div>
                  <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px 0' }}>
                    {activeNavId === 'overview'
                      ? `Tổng quan: ${currentWorkspace.name}`
                      : activeNavId === 'kanban'
                      ? 'Bảng công việc Kanban'
                      : activeNavId === 'gantt'
                      ? 'Dòng thời gian Gantt Chart'
                      : activeNavId === 'notes'
                      ? 'Kho Ghi chú & Bài giảng'
                      : activeNavId === 'tasks'
                      ? 'Danh sách nhiệm vụ'
                      : activeNavId === 'documents'
                      ? 'Tài liệu & Thư viện đính kèm'
                      : activeNavId === 'members'
                      ? 'Danh sách thành viên'
                      : 'Cài đặt'}
                  </h1>
                  <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-muted, #64748b)' }}>
                    {currentWorkspace.description || 'Không gian làm việc cộng tác và quản lý học tập SNOTE.'}
                  </p>
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor:
                      currentWorkspace.type === 'PERSONAL'
                        ? 'rgba(59, 130, 246, 0.1)'
                        : currentWorkspace.type === 'SUBJECT'
                        ? 'rgba(16, 185, 129, 0.1)'
                        : 'rgba(168, 85, 247, 0.1)',
                    color:
                      currentWorkspace.type === 'PERSONAL'
                        ? '#2563eb'
                        : currentWorkspace.type === 'SUBJECT'
                        ? '#059669'
                        : '#7c3aed'
                  }}
                >
                  <span>
                    {currentWorkspace.type === 'PERSONAL'
                      ? '🏠 Không gian Cá nhân'
                      : currentWorkspace.type === 'SUBJECT'
                      ? '📚 Môn học'
                      : '🚀 Dự án nhóm'}
                  </span>
                </div>
              </div>

              {/* Sample view demonstration based on active nav */}
              {activeNavId === 'kanban' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {['CẦN LÀM (TODO)', 'ĐANG THỰC HIỆN (IN PROGRESS)', 'HOÀN THÀNH (DONE)'].map((col, idx) => (
                    <div
                      key={col}
                      style={{
                        background: 'var(--bg-secondary, #f8fafc)',
                        borderRadius: 'var(--radius-lg, 12px)',
                        padding: '14px',
                        border: '1px solid var(--border-color, #e2e8f0)',
                        minHeight: '380px'
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px' }}>
                        {col} • {idx === 1 ? '2' : idx === 0 ? '1' : '3'}
                      </div>
                      <div
                        style={{
                          background: 'var(--bg-primary, #ffffff)',
                          padding: '12px',
                          borderRadius: 'var(--radius-md, 8px)',
                          border: '1px solid var(--border-color, #e2e8f0)',
                          marginBottom: '10px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                        }}
                      >
                        <div style={{ fontSize: '13.5px', fontWeight: 600, marginBottom: '6px' }}>
                          {idx === 0 ? 'Phân tích yêu cầu kiến trúc' : idx === 1 ? 'Xây dựng WorkspaceLayout' : 'Kiểm thử bảo mật v3'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Hạn chót: 30/10/2026</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeNavId === 'gantt' ? (
                <div
                  style={{
                    background: 'var(--bg-secondary, #f8fafc)',
                    borderRadius: 'var(--radius-lg, 12px)',
                    padding: '24px',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
                    📈 Dòng thời gian tiến độ (Gantt View)
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 16px' }}>
                    Biểu đồ Gantt trực quan kết nối trực tiếp với danh sách nhiệm vụ của dự án mà không tạo bản sao dữ liệu.
                  </p>
                  <div
                    style={{
                      height: '180px',
                      background: 'var(--bg-primary, #ffffff)',
                      borderRadius: '8px',
                      border: '1px dashed var(--border-color, #cbd5e1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <span>Timeline Gantt Engine sẵn sàng cho thẻ A06</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                  <div
                    style={{
                      background: 'var(--bg-primary, #ffffff)',
                      borderRadius: 'var(--radius-lg, 12px)',
                      padding: '20px',
                      border: '1px solid var(--border-color, #e2e8f0)'
                    }}
                  >
                    <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px 0' }}>
                      📌 Hoạt động gần đây trong không gian
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ fontSize: '13px', padding: '10px', background: 'var(--bg-secondary, #f8fafc)', borderRadius: '6px' }}>
                        ✅ <b>Nguyễn Văn Sinh Viên</b> vừa cập nhật công việc <i>"Thiết kế CSDL và luồng Auth"</i>
                      </div>
                      <div style={{ fontSize: '13px', padding: '10px', background: 'var(--bg-secondary, #f8fafc)', borderRadius: '6px' }}>
                        📝 <b>Trần Thị Bạn Học</b> vừa tạo ghi chú <i>"Biên bản họp Sprint 1"</i>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'var(--bg-secondary, #f8fafc)',
                      borderRadius: 'var(--radius-lg, 12px)',
                      padding: '20px',
                      border: '1px solid var(--border-color, #e2e8f0)'
                    }}
                  >
                    <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 10px 0' }}>
                      ℹ️ Thông tin không gian
                    </h3>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      <div><b>Loại:</b> {currentWorkspace.type}</div>
                      <div><b>Vai trò của bạn:</b> {currentWorkspace.role}</div>
                      <div><b>Trạng thái:</b> {currentWorkspace.status}</div>
                      <div><b>Số thành viên:</b> {currentWorkspace.memberCount || 1} người</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
