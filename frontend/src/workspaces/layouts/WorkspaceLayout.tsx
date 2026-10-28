import React, { useState, useEffect } from 'react';
import './workspaceLayout.css';
import { WorkspaceSummary } from './types';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { WorkspaceCommandPalette } from './WorkspaceCommandPalette';
import { WorkspaceTimer } from './WorkspaceTimer';
import { WorkspaceQuickCapture } from './WorkspaceQuickCapture';
import {
  WorkspaceArchivedBanner
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
  TrendingUp,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  Download,
  BookOpen,
  Users,
  FolderOpen,
  Calendar,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  LayoutDashboard,
  Kanban as KanbanIcon,
  ListTodo,
  ExternalLink,
  Shield,
  FileCode
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

interface AcademicTask {
  id: string;
  key: string;
  title: string;
  deadline: string;
  relativeTime: string;
  subject: string;
  priority: 'urgent' | 'high' | 'normal';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  done: boolean;
  assignee: { name: string; initial: string };
}

interface AcademicNote {
  id: string;
  title: string;
  subject: string;
  category: string;
  author: string;
  updated: string;
  readTime: string;
  words: string;
  excerpt: string;
  markdownContent: string;
}

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
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Theme state: defaults to dark carbon mode (Linear / Vercel style), toggleable to light
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('snote_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('snote_theme', theme);
  }, [theme]);

  // Robust academic tasks conforming to production Data Table schema
  const [tasks, setTasks] = useState<AcademicTask[]>([
    {
      id: 't1',
      key: 'INT-01',
      title: 'Hoàn thiện kiến trúc WorkspaceLayout & Icon Rail Navigation',
      deadline: 'Hôm nay, 23:59',
      relativeTime: 'Còn 3 giờ',
      subject: 'INT3306 Web',
      priority: 'urgent',
      status: 'IN_PROGRESS',
      done: false,
      assignee: { name: 'Nguyễn Văn Sinh Viên', initial: 'S' }
    },
    {
      id: 't2',
      key: 'INT-02',
      title: 'Soạn slide báo cáo tiến độ Sprint 1 môn Phát triển ứng dụng Web',
      deadline: 'Mai, 23:59',
      relativeTime: 'Còn 1 ngày',
      subject: 'INT3306 Web',
      priority: 'urgent',
      status: 'TODO',
      done: false,
      assignee: { name: 'Trần Thị Thu', initial: 'T' }
    },
    {
      id: 't3',
      key: 'DB-01',
      title: 'Luyện tập đề thi giữa kỳ CSDL: Chuẩn hóa 3NF/BCNF & Đánh chỉ mục B-Tree',
      deadline: '30/10/2026',
      relativeTime: 'Còn 2 ngày',
      subject: 'INT3202 CSDL',
      priority: 'high',
      status: 'TODO',
      done: false,
      assignee: { name: 'Lê Hoàng Nam', initial: 'N' }
    },
    {
      id: 't4',
      key: 'DB-02',
      title: 'Thực hành tối ưu câu lệnh truy vấn PostgreSQL với EXPLAIN ANALYZE',
      deadline: '01/11/2026',
      relativeTime: 'Còn 4 ngày',
      subject: 'INT3202 CSDL',
      priority: 'high',
      status: 'IN_PROGRESS',
      done: false,
      assignee: { name: 'Nguyễn Văn Sinh Viên', initial: 'S' }
    },
    {
      id: 't5',
      key: 'PRJ-01',
      title: 'Thiết kế kiến trúc xác thực kép: Access Token In-Memory + HttpOnly Cookie',
      deadline: '03/11/2026',
      relativeTime: 'Còn 6 ngày',
      subject: 'Đồ án SNOTE',
      priority: 'normal',
      status: 'DONE',
      done: true,
      assignee: { name: 'Phạm Đức Minh', initial: 'M' }
    },
    {
      id: 't6',
      key: 'TUT-01',
      title: 'Đọc tài liệu React 19 Actions & Server Components Deep Dive',
      deadline: '05/11/2026',
      relativeTime: 'Tuần sau',
      subject: 'Tự học',
      priority: 'normal',
      status: 'TODO',
      done: false,
      assignee: { name: 'Nguyễn Văn Sinh Viên', initial: 'S' }
    }
  ]);

  // Table filtering & search states
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState<'ALL' | 'TODO' | 'IN_PROGRESS' | 'DONE'>('ALL');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<'ALL' | 'urgent' | 'high' | 'normal'>('ALL');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Rich Lecture Notes Data
  const [notes] = useState<AcademicNote[]>([
    {
      id: 'n1',
      title: 'Kiến trúc Microservices, JWT Auth & REST API Design',
      subject: 'INT3306 • Web',
      category: 'Lý thuyết',
      author: 'Nguyễn Văn Sinh Viên',
      updated: '2 giờ trước',
      readTime: '5 phút đọc',
      words: '1,420 từ',
      excerpt:
        'Nguyên tắc Idempotency trong HTTP methods (POST vs PUT vs PATCH). Thiết kế JWT stateless token trong memory kết hợp HttpOnly refresh cookie chống XSS/CSRF...',
      markdownContent: `## 1. Nguyên Tắc Idempotency Trong HTTP Methods
Idempotency là tính chất của một hành động mà khi thực hiện nhiều lần liên tiếp sẽ đem lại cùng một kết quả như khi thực hiện một lần duy nhất:
* **GET, PUT, DELETE, HEAD, OPTIONS**: Đều có tính Idempotent.
* **POST, PATCH**: Về mặt chuẩn HTTP không bắt buộc idempotent (trừ khi kết hợp Idempotency-Key header).

### Bảng đối chiếu các phương thức RESTful:
| Phương thức | Idempotent | Safe (Chỉ đọc) | Mục đích sử dụng |
| :--- | :---: | :---: | :--- |
| **GET** | Có | Có | Truy xuất dữ liệu tài nguyên |
| **POST** | Không | Không | Tạo mới tài nguyên |
| **PUT** | Có | Không | Thay thế toàn bộ thực thể |
| **PATCH** | Tùy biến | Không | Cập nhật từng phần (Partial Update) |
| **DELETE** | Có | Không | Xóa tài nguyên |

> [!NOTE]
> Khi thiết kế API cho hệ thống hoặc đồ án SNOTE, luôn bảo đảm các endpoint POST quan trọng có cơ chế \`Idempotency-Key\` sinh từ client để tránh double-submit khi mạng lag.

## 2. Mô Hình Bảo Mật Xác Thực Kép (JWT Stateless + HttpOnly Cookie)
Trong Single Page Application (React 19), lưu Access Token ở LocalStorage là lỗ hổng bảo mật nghiêm trọng (dễ bị tấn công XSS trộm token). Giải pháp chuẩn kiến trúc:
1. **Access Token**: Thời hạn ngắn (15 phút), lưu **trong bộ nhớ RAM (In-Memory)** của React state.
2. **Refresh Token**: Thời hạn dài (7 ngày), lưu trong **Cookie HttpOnly, Secure, SameSite=Lax**.
3. Khi Access Token hết hạn, Axios/Fetch interceptor tự động gửi request đến \`/api/auth/refresh\` để nhận Access Token mới mà người dùng không bị gián đoạn.`
    },
    {
      id: 'n2',
      title: 'Tối ưu hóa Truy vấn PostgreSQL & Kỹ thuật Đánh Chỉ mục B-Tree',
      subject: 'INT3202 • CSDL',
      category: 'Thực hành',
      author: 'Lê Hoàng Nam',
      updated: 'Hôm qua',
      readTime: '8 phút đọc',
      words: '2,100 từ',
      excerpt:
        'Phân tích chi phí EXPLAIN ANALYZE trên bảng 5 triệu bản ghi. So sánh Sequential Scan vs Index Scan, Composite Index và Partial Index trên các trường lọc...',
      markdownContent: `## 1. Phân Tích Kế Hoạch Thực Thi Với EXPLAIN ANALYZE
PostgreSQL Query Planner dựa vào thống kê bảng (\`pg_statistic\`) để lựa chọn đường đi tối ưu nhất:
* **Cost estimate**: \`cost=0.00..452.12 rows=100 width=32\`
* **Actual time**: Thời gian thực tế thực thi bằng engine C.

\`\`\`sql
-- Kiểm tra chi phí thực thi trước khi đánh chỉ mục
EXPLAIN ANALYZE
SELECT id, title, created_at
FROM notes
WHERE user_id = 'usr_9981' AND is_archived = false
ORDER BY created_at DESC
LIMIT 20;
\`\`\`

## 2. Kỹ Thuật Đánh Chỉ Mục Composite & Partial Index
Nếu hệ thống có hàng triệu ghi chú, đánh chỉ mục đơn lẻ \`CREATE INDEX idx_user_id ON notes(user_id)\` vẫn bắt buộc PostgreSQL phải filter và sort:
1. **Composite Index**: Đánh theo thứ tự \`(user_id, is_archived, created_at DESC)\` để vừa filter vừa sort không tốn chi phí Disk Sort.
2. **Partial Index**: Chỉ index các ghi chú chưa lưu trữ:
\`\`\`sql
CREATE INDEX idx_active_notes_by_user 
ON notes (user_id, created_at DESC) 
WHERE is_archived = false;
\`\`\`
Kỹ thuật này giúp giảm kích thước index file trên RAM tới **65%**!`
    },
    {
      id: 'n3',
      title: 'Biên bản họp Sprint 1 & Phân chia Module Đồ án SNOTE',
      subject: 'Đồ án nhóm CACLC',
      category: 'Biên bản',
      author: 'Trần Thị Thu',
      updated: '26/10/2026',
      readTime: '3 phút đọc',
      words: '850 từ',
      excerpt:
        'Thống nhất hợp đồng API giữa Backend Express và Frontend React 19. Phân định ranh giới giữa thẻ C và thẻ A, quy ước không gian làm việc Worktrees...',
      markdownContent: `## 1. Mục Tiêu Sprint 1
* Hoàn thiện kiến trúc cơ sở: Database Schema Prisma, Authentication JWT, Workspace Layout.
* Đạt chuẩn hiệu năng: First Contentful Paint < 1.0s, Lighthouse Performance > 90.

## 2. Phân Chia Phụ Trách Kỹ Thuật
1. **Module Xác thực & DB**: Phụ trách Schema Migration, Password Hashing Argon2.
2. **Module Workspace Navigation**: Giao diện Icon Rail Minimalist, Zen Mode, Command Palette.
3. **Module Ghi chú & Bài giảng**: Trình soạn thảo Markdown, Bộ lọc học phần theo mã môn.`
    }
  ]);

  const [selectedNoteId, setSelectedNoteId] = useState<string>(notes[0].id);
  const [noteCategoryFilter, setNoteCategoryFilter] = useState<string>('ALL');
  const [noteSearchQuery, setNoteSearchQuery] = useState<string>('');

  // Course Documents Sample
  const sampleDocuments = [
    { id: 'd1', name: 'Slide_BaiGiang_Chuong_4_API_Architecture.pdf', type: 'PDF', size: '2.4 MB', updated: '28/10/2026', course: 'INT3306', uploader: 'TS. Nguyễn Văn Hướng' },
    { id: 'd2', name: 'De_cuong_on_tap_giua_ky_CSDL_2026.pdf', type: 'PDF', size: '1.1 MB', updated: '27/10/2026', course: 'INT3202', uploader: 'ThS. Trần Thu Nga' },
    { id: 'd3', name: 'PostgreSQL_Query_Optimization_CheatSheet.md', type: 'MD', size: '320 KB', updated: '25/10/2026', course: 'INT3202', uploader: 'Lê Hoàng Nam' },
    { id: 'd4', name: 'SNOTE_Software_Requirements_Specification_v1.0.pdf', type: 'PDF', size: '4.8 MB', updated: '20/10/2026', course: 'Đồ án Web', uploader: 'Nhóm CACLC' }
  ];

  // Members Sample
  const sampleMembers = [
    { id: 'm1', name: 'TS. Nguyễn Văn Hướng', role: 'Giảng viên hướng dẫn', email: 'huongnv@vnu.edu.vn', initial: 'H', isInstructor: true },
    { id: 'm2', name: 'Nguyễn Văn Sinh Viên (Bạn)', role: 'Nhóm trưởng / Developer', email: 'sinhvien@snote.edu.vn', initial: 'S', isInstructor: false },
    { id: 'm3', name: 'Trần Thị Thu', role: 'Thành viên / Frontend Lead', email: 'thutt@snote.edu.vn', initial: 'T', isInstructor: false },
    { id: 'm4', name: 'Lê Hoàng Nam', role: 'Thành viên / Backend & Database', email: 'namlh@snote.edu.vn', initial: 'N', isInstructor: false },
    { id: 'm5', name: 'Phạm Đức Minh', role: 'Thành viên / DevOps & Testing', email: 'minhpd@snote.edu.vn', initial: 'M', isInstructor: false }
  ];

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

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

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
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextDone = !t.done;
          return {
            ...t,
            done: nextDone,
            status: nextDone ? 'DONE' : 'IN_PROGRESS'
          };
        }
        return t;
      })
    );
  };

  const handleQuickAddTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTaskTitle.trim()) {
      e.preventDefault();
      const newTask: AcademicTask = {
        id: `t-${Date.now()}`,
        key: `${currentWorkspace.code || 'TASK'}-${tasks.length + 1}`,
        title: newTaskTitle.trim(),
        deadline: 'Chưa đặt hạn',
        relativeTime: 'Vừa tạo',
        subject: currentWorkspace.code || 'Chung',
        priority: 'normal',
        status: 'TODO',
        done: false,
        assignee: { name: currentUser?.fullName || 'Sinh viên', initial: 'S' }
      };
      setTasks((prev) => [newTask, ...prev]);
      setNewTaskTitle('');
    }
  };

  const handleCopyMarkdown = (content: string, noteId: string) => {
    navigator.clipboard.writeText(content);
    setCopiedNoteId(noteId);
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Metrics computation
  const completedCount = tasks.filter((t) => t.done).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);
  const urgentCount = tasks.filter((t) => t.priority === 'urgent' && !t.done).length;

  // Filtered Tasks
  const filteredTasks = tasks.filter((t) => {
    if (taskSearchQuery.trim()) {
      const q = taskSearchQuery.toLowerCase();
      const matches = t.title.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || t.key.toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (taskStatusFilter === 'TODO' && t.status !== 'TODO') return false;
    if (taskStatusFilter === 'IN_PROGRESS' && t.status !== 'IN_PROGRESS') return false;
    if (taskStatusFilter === 'DONE' && t.status !== 'DONE') return false;
    if (taskPriorityFilter !== 'ALL' && t.priority !== taskPriorityFilter) return false;
    return true;
  });

  // Filtered Notes
  const filteredNotes = notes.filter((n) => {
    if (noteSearchQuery.trim()) {
      const q = noteSearchQuery.toLowerCase();
      if (!n.title.toLowerCase().includes(q) && !n.excerpt.toLowerCase().includes(q)) return false;
    }
    if (noteCategoryFilter !== 'ALL' && n.category !== noteCategoryFilter) return false;
    return true;
  });

  const activeNote = notes.find((n) => n.id === selectedNoteId) || notes[0];

  return (
    <div className={`ws-shell theme-${theme} ${isZenMode ? 'zen-mode' : ''}`}>
      {/* 1. Icon-Only Rail Navigation with Rounded Floating Tooltips */}
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
                  ? 'Tài liệu môn học'
                  : activeNavId === 'members'
                  ? 'Thành viên'
                  : activeNavId}
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
              {/* Workspace Header Block & Linear-Style View Switcher */}
              <div className="ws-canvas-header">
                <div className="ws-canvas-title-group">
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
                      ? 'Tài liệu môn học & Đề thi'
                      : activeNavId === 'members'
                      ? 'Thành viên & Giảng viên'
                      : currentWorkspace.name}
                  </h1>
                  <p className="ws-canvas-desc">
                    {currentWorkspace.description ||
                      'Không gian làm việc học thuật chính xác cho sinh viên SNOTE.'}
                  </p>
                </div>

                <div className="ws-canvas-meta-row">
                  {currentWorkspace.code && (
                    <span className="ws-canvas-badge accent">Môn [{currentWorkspace.code}]</span>
                  )}
                  <span className="ws-canvas-badge">
                    {currentWorkspace.type === 'PERSONAL'
                      ? 'Bàn học cá nhân'
                      : currentWorkspace.type === 'SUBJECT'
                      ? `${currentWorkspace.memberCount || 48} sinh viên`
                      : 'Đồ án nhóm'}
                  </span>
                  <span className="ws-canvas-badge">HK1 2026-2027</span>
                </div>
              </div>

              {/* View Switcher Tabs (Linear standard) */}
              <div className="ws-view-tabs">
                <button
                  type="button"
                  className={`ws-view-tab-btn ${activeNavId === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveNavId('overview')}
                >
                  <LayoutDashboard size={13} />
                  <span>Tổng quan</span>
                </button>
                <button
                  type="button"
                  className={`ws-view-tab-btn ${activeNavId === 'tasks' ? 'active' : ''}`}
                  onClick={() => setActiveNavId('tasks')}
                >
                  <ListTodo size={13} />
                  <span>Nhiệm vụ ({tasks.length})</span>
                </button>
                <button
                  type="button"
                  className={`ws-view-tab-btn ${activeNavId === 'notes' ? 'active' : ''}`}
                  onClick={() => setActiveNavId('notes')}
                >
                  <BookOpen size={13} />
                  <span>Kho Bài giảng ({notes.length})</span>
                </button>
                <button
                  type="button"
                  className={`ws-view-tab-btn ${activeNavId === 'kanban' ? 'active' : ''}`}
                  onClick={() => setActiveNavId('kanban')}
                >
                  <KanbanIcon size={13} />
                  <span>Kanban</span>
                </button>
                <button
                  type="button"
                  className={`ws-view-tab-btn ${activeNavId === 'gantt' ? 'active' : ''}`}
                  onClick={() => setActiveNavId('gantt')}
                >
                  <TrendingUp size={13} />
                  <span>Tiến độ Gantt</span>
                </button>
                <button
                  type="button"
                  className={`ws-view-tab-btn ${activeNavId === 'documents' ? 'active' : ''}`}
                  onClick={() => setActiveNavId('documents')}
                >
                  <FolderOpen size={13} />
                  <span>Tài liệu ({sampleDocuments.length})</span>
                </button>
                <button
                  type="button"
                  className={`ws-view-tab-btn ${activeNavId === 'members' ? 'active' : ''}`}
                  onClick={() => setActiveNavId('members')}
                >
                  <Users size={13} />
                  <span>Thành viên</span>
                </button>
              </div>

              {/* VIEW SWITCHING LOGIC */}

              {/* 1. OVERVIEW VIEW */}
              {activeNavId === 'overview' && (
                <>
                  {/* Top 4 KPI Metric Cards (shadcn dashboard-01) */}
                  <div className="ws-kpi-grid">
                    <div className="ws-kpi-card">
                      <div className="ws-kpi-top">
                        <span className="ws-kpi-title">Nhiệm vụ cần xử lý</span>
                        <span className="ws-kpi-icon"><CheckSquare size={15} /></span>
                      </div>
                      <div className="ws-kpi-value-row">
                        <span className="ws-kpi-value">{tasks.length}</span>
                        <span className="ws-kpi-unit">bài tập</span>
                      </div>
                      <div className={`ws-kpi-footer ${urgentCount > 0 ? 'urgent' : ''}`}>
                        {urgentCount > 0 ? `🔴 ${urgentCount} việc gấp cần nộp hôm nay` : '✓ Đúng tiến độ học tập'}
                      </div>
                    </div>

                    <div className="ws-kpi-card">
                      <div className="ws-kpi-top">
                        <span className="ws-kpi-title">Tiến độ hoàn thành</span>
                        <span className="ws-kpi-icon"><TrendingUp size={15} /></span>
                      </div>
                      <div className="ws-kpi-value-row">
                        <span className="ws-kpi-value">{progressPercent}%</span>
                        <span className="ws-kpi-unit">học phần</span>
                      </div>
                      <div className="ws-kpi-progress-bar">
                        <div className="ws-kpi-progress-fill" style={{ width: `${progressPercent}%` }} />
                      </div>
                    </div>

                    <div className="ws-kpi-card">
                      <div className="ws-kpi-top">
                        <span className="ws-kpi-title">Kho bài giảng & ghi chú</span>
                        <span className="ws-kpi-icon"><FileText size={15} /></span>
                      </div>
                      <div className="ws-kpi-value-row">
                        <span className="ws-kpi-value">{notes.length}</span>
                        <span className="ws-kpi-unit">bài chép</span>
                      </div>
                      <div className="ws-kpi-footer success">
                        <span>+ 2 bài giảng mới tuần này</span>
                      </div>
                    </div>

                    <div className="ws-kpi-card">
                      <div className="ws-kpi-top">
                        <span className="ws-kpi-title">Hạn chót kế tiếp</span>
                        <span className="ws-kpi-icon"><Clock size={15} /></span>
                      </div>
                      <div className="ws-kpi-value-row">
                        <span className="ws-kpi-value">23:59</span>
                        <span className="ws-kpi-unit">Hôm nay</span>
                      </div>
                      <div className="ws-kpi-footer urgent">
                        <span>Slide Sprint 1 • INT3306</span>
                      </div>
                    </div>
                  </div>

                  {/* Full-Width Academic Task Matrix (shadcn TanStack pattern) */}
                  <div className="ws-table-container">
                    <div className="ws-table-toolbar">
                      <div className="ws-table-toolbar-left">
                        <div className="ws-table-search-wrap">
                          <Search size={13} color="var(--ws-text-faint)" />
                          <input
                            type="text"
                            placeholder="Lọc nhanh bài tập theo tiêu đề hoặc học phần..."
                            value={taskSearchQuery}
                            onChange={(e) => setTaskSearchQuery(e.target.value)}
                          />
                        </div>

                        <div className="ws-table-facet-tabs">
                          <button
                            type="button"
                            className={`ws-facet-pill ${taskStatusFilter === 'ALL' ? 'active' : ''}`}
                            onClick={() => setTaskStatusFilter('ALL')}
                          >
                            Tất cả ({tasks.length})
                          </button>
                          <button
                            type="button"
                            className={`ws-facet-pill ${taskStatusFilter === 'TODO' ? 'active' : ''}`}
                            onClick={() => setTaskStatusFilter('TODO')}
                          >
                            Cần làm ({tasks.filter((t) => t.status === 'TODO').length})
                          </button>
                          <button
                            type="button"
                            className={`ws-facet-pill ${taskStatusFilter === 'IN_PROGRESS' ? 'active' : ''}`}
                            onClick={() => setTaskStatusFilter('IN_PROGRESS')}
                          >
                            Đang làm ({tasks.filter((t) => t.status === 'IN_PROGRESS').length})
                          </button>
                          <button
                            type="button"
                            className={`ws-facet-pill ${taskStatusFilter === 'DONE' ? 'active' : ''}`}
                            onClick={() => setTaskStatusFilter('DONE')}
                          >
                            Đã nộp ({completedCount})
                          </button>
                        </div>
                      </div>

                      <div className="ws-table-toolbar-right">
                        <select
                          className="ws-table-select-filter"
                          value={taskPriorityFilter}
                          onChange={(e) => setTaskPriorityFilter(e.target.value as any)}
                        >
                          <option value="ALL">Mọi mức độ ưu tiên</option>
                          <option value="urgent">Gấp (Urgent)</option>
                          <option value="high">Cao (High)</option>
                          <option value="normal">Tiêu chuẩn (Normal)</option>
                        </select>
                      </div>
                    </div>

                    <div className="ws-table-responsive">
                      <table className="ws-data-table">
                        <thead>
                          <tr>
                            <th style={{ width: '38px', textAlign: 'center' }}>
                              <input type="checkbox" readOnly checked={completedCount === tasks.length && tasks.length > 0} />
                            </th>
                            <th style={{ width: '80px' }}>Mã việc</th>
                            <th>Tiêu đề bài tập / Nhiệm vụ</th>
                            <th style={{ width: '130px' }}>Học phần</th>
                            <th style={{ width: '110px' }}>Mức ưu tiên</th>
                            <th style={{ width: '160px' }}>Hạn nộp</th>
                            <th style={{ width: '110px' }}>Trạng thái</th>
                            <th style={{ width: '140px' }}>Phụ trách</th>
                            <th style={{ width: '40px', textAlign: 'center' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTasks.map((task) => (
                            <tr
                              key={task.id}
                              className={`ws-row-item ${task.done ? 'done' : ''}`}
                              onClick={() => toggleTask(task.id)}
                            >
                              <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={task.done}
                                  onChange={() => toggleTask(task.id)}
                                />
                              </td>
                              <td>
                                <span className="ws-task-key-tag">{task.key}</span>
                              </td>
                              <td>
                                <div className="ws-task-title-cell">{task.title}</div>
                              </td>
                              <td>
                                <span className="ws-course-badge">{task.subject}</span>
                              </td>
                              <td>
                                <span className={`ws-priority-badge ${task.priority}`}>
                                  <span className="ws-priority-dot" />
                                  {task.priority === 'urgent' ? 'Gấp' : task.priority === 'high' ? 'Cao' : 'Thường'}
                                </span>
                              </td>
                              <td>
                                <div className="ws-deadline-badge">
                                  <Clock size={11} />
                                  <span>{task.deadline}</span>
                                </div>
                              </td>
                              <td>
                                <span className={`ws-status-chip ${task.status.toLowerCase().replace('_', '-')}`}>
                                  {task.status === 'DONE' ? 'Đã xong' : task.status === 'IN_PROGRESS' ? 'Đang làm' : 'Cần làm'}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--ws-text-muted)' }}>
                                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--ws-bg-surface-elevated)', border: '1px solid var(--ws-border-hairline)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>
                                    {task.assignee.initial}
                                  </div>
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.assignee.name.split(' ').slice(-1)[0]}</span>
                                </div>
                              </td>
                              <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                <button type="button" className="ws-tool-btn" title="Tùy chọn">
                                  <MoreHorizontal size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}

                          {/* Quick Add Task Row */}
                          <tr className="ws-table-quick-add-row">
                            <td style={{ textAlign: 'center', color: 'var(--ws-accent)' }}>+</td>
                            <td colSpan={8} className="ws-table-quick-add-cell">
                              <input
                                type="text"
                                className="ws-table-quick-add-input"
                                placeholder="Thêm nhanh bài tập hoặc việc cần nộp vào bảng... (Nhập tiêu đề rồi gõ Enter)"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                onKeyDown={handleQuickAddTask}
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="ws-table-footer">
                      <div>
                        Hiển thị <strong>{filteredTasks.length}</strong> / <strong>{tasks.length}</strong> nhiệm vụ • <strong>{completedCount}</strong> đã hoàn thành
                      </div>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: '10.5px' }}>
                        Tỷ lệ hoàn thành: {progressPercent}%
                      </div>
                    </div>
                  </div>

                  {/* Recent Knowledge & Lecture Notes Strip */}
                  <div className="ws-recent-notes-section">
                    <div className="ws-section-header">
                      <h2 className="ws-section-title">
                        <BookOpen size={15} color="var(--ws-accent)" />
                        <span>Kho Bài giảng & Ghi chép học thuật gần đây</span>
                      </h2>
                      <button
                        type="button"
                        className="ws-section-action-btn"
                        onClick={() => setActiveNavId('notes')}
                      >
                        Mở toàn bộ kho bài đọc →
                      </button>
                    </div>

                    <div className="ws-notes-card-grid">
                      {notes.map((note) => (
                        <div
                          key={note.id}
                          className="ws-note-grid-card"
                          onClick={() => {
                            setSelectedNoteId(note.id);
                            setActiveNavId('notes');
                          }}
                        >
                          <div className="ws-note-card-top">
                            <span className="ws-note-card-tag">{note.category}</span>
                            <span className="ws-note-card-updated">{note.updated}</span>
                          </div>
                          <div className="ws-note-card-title">{note.title}</div>
                          <div className="ws-note-card-excerpt">{note.excerpt}</div>
                          <div className="ws-note-card-meta">
                            <span>{note.subject}</span>
                            <span>•</span>
                            <span>{note.words}</span>
                            <span>•</span>
                            <span>{note.readTime}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* 2. MASTER-DETAIL DUAL PANE NOTES VIEW (SHADCN MAIL PATTERN) */}
              {activeNavId === 'notes' && (
                <div className="ws-master-detail">
                  {/* Left Notes List Pane */}
                  <div className="ws-md-sidebar">
                    <div className="ws-md-sidebar-header">
                      <input
                        type="text"
                        className="ws-md-search-input"
                        placeholder="Tìm kiếm bài giảng, tài liệu..."
                        value={noteSearchQuery}
                        onChange={(e) => setNoteSearchQuery(e.target.value)}
                      />
                      <div className="ws-md-filter-row">
                        {['ALL', 'Lý thuyết', 'Thực hành', 'Biên bản'].map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            className={`ws-md-filter-btn ${noteCategoryFilter === cat ? 'active' : ''}`}
                            onClick={() => setNoteCategoryFilter(cat)}
                          >
                            {cat === 'ALL' ? 'Tất cả' : cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="ws-md-list">
                      {filteredNotes.map((note) => (
                        <div
                          key={note.id}
                          className={`ws-md-item ${selectedNoteId === note.id ? 'active' : ''}`}
                          onClick={() => setSelectedNoteId(note.id)}
                        >
                          <div className="ws-md-item-top">
                            <span className="ws-md-item-tag">{note.category}</span>
                            <span style={{ fontSize: '9.5px', color: 'var(--ws-text-faint)' }}>{note.updated}</span>
                          </div>
                          <div className="ws-md-item-title">{note.title}</div>
                          <div className="ws-md-item-excerpt">{note.excerpt}</div>
                          <div className="ws-md-item-meta">
                            <span>{note.subject}</span>
                            <span>•</span>
                            <span>{note.words}</span>
                            <span>•</span>
                            <span>{note.readTime}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Academic Reader Pane */}
                  <div className="ws-md-reader">
                    <div className="ws-reader-header">
                      <div className="ws-reader-title-area">
                        <h2 className="ws-reader-title">{activeNote.title}</h2>
                        <div className="ws-reader-meta-bar">
                          <span className="ws-canvas-badge accent">{activeNote.subject}</span>
                          <span>Tác giả: <strong>{activeNote.author}</strong></span>
                          <span>•</span>
                          <span>Độ dài: {activeNote.words} ({activeNote.readTime})</span>
                          <span>•</span>
                          <span>Cập nhật: {activeNote.updated}</span>
                        </div>
                      </div>

                      <div className="ws-reader-actions">
                        <button
                          type="button"
                          className="ws-reader-btn"
                          onClick={() => handleCopyMarkdown(activeNote.markdownContent, activeNote.id)}
                        >
                          {copiedNoteId === activeNote.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                          <span>{copiedNoteId === activeNote.id ? 'Đã sao chép' : 'Sao chép MD'}</span>
                        </button>
                        <button
                          type="button"
                          className="ws-reader-btn"
                          onClick={() => {
                            if (onOpenCreateNote) onOpenCreateNote(currentWorkspace);
                          }}
                        >
                          <PenTool size={12} />
                          <span>Chỉnh sửa</span>
                        </button>
                      </div>
                    </div>

                    <div className="ws-reader-body">
                      {/* Formatted Markdown Content */}
                      <div className="ws-callout-note">
                        <strong>📌 Lưu ý học thuật quan trọng:</strong> Nội dung bài giảng được trích xuất và đồng bộ trực tiếp từ giáo trình chuẩn {currentWorkspace.code || 'INT3306'}. Các đoạn mã nguồn có thể chạy trực tiếp trên môi trường thực hành.
                      </div>

                      <h2>1. Khái Niệm Cốt Lõi & Mô Hình Kiến Trúc</h2>
                      <p>
                        Trong quá trình phát triển hệ thống web quy mô lớn, việc tuân thủ các nguyên lý thiết kế API chuẩn mực đóng vai trò sống còn trong việc giảm thiểu lỗi và duy trì tính toàn vẹn của dữ liệu giữa máy chủ và trình duyệt.
                      </p>

                      <div className="ws-code-block-wrap">
                        <div className="ws-code-block-header">
                          <span>TypeScript • Token Refresh Interceptor</span>
                          <FileCode size={13} />
                        </div>
                        <pre className="ws-code-pre">
{`// Triển khai Interceptor tự động cấp lại Token trong memory
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const { accessToken } = await refreshAuthToken();
      setInMemoryAccessToken(accessToken);
      originalRequest.headers.Authorization = \`Bearer \${accessToken}\`;
      return apiClient(originalRequest);
    }
    return Promise.reject(error);
  }
);`}
                        </pre>
                      </div>

                      <h2>2. Phân Tích Thực Tiễn & Đối Chiếu Hiệu Năng</h2>
                      <p>
                        Khi so sánh chi phí giữa các giải pháp lưu trữ trạng thái người dùng, việc kết hợp giữa <strong>Access Token In-Memory</strong> và <strong>Refresh Token HttpOnly Cookie</strong> cho thấy khả năng chống tấn công Cross-Site Scripting (XSS) đạt hiệu quả 100% trong khi vẫn giữ được tính chất Stateless cần thiết cho việc Scale ngang hệ thống backend.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. TASKS VIEW (FULL-WIDTH MATRIX) */}
              {activeNavId === 'tasks' && (
                <div className="ws-table-container">
                  <div className="ws-table-toolbar">
                    <div className="ws-table-toolbar-left">
                      <div className="ws-table-search-wrap">
                        <Search size={13} color="var(--ws-text-faint)" />
                        <input
                          type="text"
                          placeholder="Lọc nhanh bài tập theo tiêu đề..."
                          value={taskSearchQuery}
                          onChange={(e) => setTaskSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="ws-table-facet-tabs">
                        <button
                          type="button"
                          className={`ws-facet-pill ${taskStatusFilter === 'ALL' ? 'active' : ''}`}
                          onClick={() => setTaskStatusFilter('ALL')}
                        >
                          Tất cả ({tasks.length})
                        </button>
                        <button
                          type="button"
                          className={`ws-facet-pill ${taskStatusFilter === 'TODO' ? 'active' : ''}`}
                          onClick={() => setTaskStatusFilter('TODO')}
                        >
                          Cần làm ({tasks.filter((t) => t.status === 'TODO').length})
                        </button>
                        <button
                          type="button"
                          className={`ws-facet-pill ${taskStatusFilter === 'IN_PROGRESS' ? 'active' : ''}`}
                          onClick={() => setTaskStatusFilter('IN_PROGRESS')}
                        >
                          Đang làm ({tasks.filter((t) => t.status === 'IN_PROGRESS').length})
                        </button>
                        <button
                          type="button"
                          className={`ws-facet-pill ${taskStatusFilter === 'DONE' ? 'active' : ''}`}
                          onClick={() => setTaskStatusFilter('DONE')}
                        >
                          Đã nộp ({completedCount})
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="ws-table-responsive">
                    <table className="ws-data-table">
                      <thead>
                        <tr>
                          <th style={{ width: '38px', textAlign: 'center' }}>
                            <input type="checkbox" readOnly checked={completedCount === tasks.length} />
                          </th>
                          <th style={{ width: '80px' }}>Mã việc</th>
                          <th>Tiêu đề bài tập / Nhiệm vụ</th>
                          <th style={{ width: '130px' }}>Học phần</th>
                          <th style={{ width: '110px' }}>Mức ưu tiên</th>
                          <th style={{ width: '160px' }}>Hạn nộp</th>
                          <th style={{ width: '110px' }}>Trạng thái</th>
                          <th style={{ width: '140px' }}>Phụ trách</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTasks.map((task) => (
                          <tr
                            key={task.id}
                            className={`ws-row-item ${task.done ? 'done' : ''}`}
                            onClick={() => toggleTask(task.id)}
                          >
                            <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={task.done}
                                onChange={() => toggleTask(task.id)}
                              />
                            </td>
                            <td><span className="ws-task-key-tag">{task.key}</span></td>
                            <td><div className="ws-task-title-cell">{task.title}</div></td>
                            <td><span className="ws-course-badge">{task.subject}</span></td>
                            <td>
                              <span className={`ws-priority-badge ${task.priority}`}>
                                <span className="ws-priority-dot" />
                                {task.priority === 'urgent' ? 'Gấp' : task.priority === 'high' ? 'Cao' : 'Thường'}
                              </span>
                            </td>
                            <td>
                              <div className="ws-deadline-badge">
                                <Clock size={11} />
                                <span>{task.deadline}</span>
                              </div>
                            </td>
                            <td>
                              <span className={`ws-status-chip ${task.status.toLowerCase().replace('_', '-')}`}>
                                {task.status === 'DONE' ? 'Đã xong' : task.status === 'IN_PROGRESS' ? 'Đang làm' : 'Cần làm'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--ws-text-muted)' }}>
                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--ws-bg-surface-elevated)', border: '1px solid var(--ws-border-hairline)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>
                                  {task.assignee.initial}
                                </div>
                                <span>{task.assignee.name}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 4. KANBAN 4-COLUMN VIEW */}
              {activeNavId === 'kanban' && (
                <div className="ws-kanban-board">
                  {[
                    { id: 'TODO', label: 'Cần làm', filter: 'TODO' },
                    { id: 'IN_PROGRESS', label: 'Đang thực hiện', filter: 'IN_PROGRESS' },
                    { id: 'REVIEW', label: 'Chờ duyệt / Test', filter: 'REVIEW' },
                    { id: 'DONE', label: 'Đã hoàn thành', filter: 'DONE' }
                  ].map((col) => {
                    const colTasks = tasks.filter((t) => t.status === col.filter);
                    return (
                      <div key={col.id} className="ws-kanban-col">
                        <div className="ws-kanban-col-header">
                          <span className="ws-kanban-col-title">{col.label}</span>
                          <span className="ws-kanban-col-count">{colTasks.length}</span>
                        </div>

                        {colTasks.map((t) => (
                          <div key={t.id} className="ws-kanban-card" onClick={() => toggleTask(t.id)}>
                            <div className="ws-kanban-card-top">
                              <span className="ws-task-key-tag">{t.key}</span>
                              <span className={`ws-priority-badge ${t.priority}`}>
                                {t.priority === 'urgent' ? 'Gấp' : t.priority === 'high' ? 'Cao' : 'Thường'}
                              </span>
                            </div>
                            <div className="ws-kanban-card-title">{t.title}</div>
                            <div className="ws-kanban-card-footer">
                              <span className="ws-course-badge">{t.subject}</span>
                              <span style={{ fontSize: '10px', color: 'var(--ws-text-faint)', fontFamily: 'JetBrains Mono' }}>
                                {t.deadline.split(',')[0]}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 5. GANTT ROADMAP VIEW */}
              {activeNavId === 'gantt' && (
                <div className="ws-gantt-board">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Lộ Trình Học Kỳ 1 (2026-2027) & Đồ Án Môn Học</h2>
                    <span className="ws-canvas-badge accent">Tuần 8 / 15</span>
                  </div>

                  <div className="ws-gantt-timeline-track">
                    {[
                      { title: 'Sprint 1: Phân tích yêu cầu & Thiết kế CSDL', course: 'INT3306', start: 10, width: 35, status: 'Đã hoàn thành' },
                      { title: 'Sprint 2: Phát triển Core REST API & Auth', course: 'INT3306', start: 35, width: 40, status: 'Đang chạy' },
                      { title: 'Thi Giữa Kỳ CSDL (Chương 1-4)', course: 'INT3202', start: 45, width: 15, status: 'Sắp diễn ra' },
                      { title: 'Sprint 3: Tối ưu hiệu năng, RAG & Kiểm thử', course: 'Đồ án nhóm', start: 65, width: 30, status: 'Kế hoạch' }
                    ].map((item, idx) => (
                      <div key={idx} className="ws-gantt-row">
                        <div className="ws-gantt-label">
                          <div>{item.title}</div>
                          <div style={{ fontSize: '10px', color: 'var(--ws-text-faint)' }}>{item.course}</div>
                        </div>
                        <div className="ws-gantt-bar-wrap">
                          <div
                            className="ws-gantt-bar"
                            style={{ left: `${item.start}%`, width: `${item.width}%` }}
                          >
                            <span>{item.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. DOCUMENTS VIEW */}
              {activeNavId === 'documents' && (
                <div className="ws-docs-view">
                  <div className="ws-table-responsive">
                    <table className="ws-data-table">
                      <thead>
                        <tr>
                          <th>Tên tài liệu / Giáo trình</th>
                          <th style={{ width: '90px' }}>Định dạng</th>
                          <th style={{ width: '100px' }}>Kích thước</th>
                          <th style={{ width: '120px' }}>Môn học</th>
                          <th style={{ width: '180px' }}>Người tải lên</th>
                          <th style={{ width: '120px' }}>Ngày tải</th>
                          <th style={{ width: '60px', textAlign: 'center' }}>Tải về</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sampleDocuments.map((doc) => (
                          <tr key={doc.id} className="ws-row-item">
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                                <FolderOpen size={14} color="var(--ws-accent)" />
                                <span>{doc.name}</span>
                              </div>
                            </td>
                            <td><span className="ws-task-key-tag">{doc.type}</span></td>
                            <td><span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: 'var(--ws-text-faint)' }}>{doc.size}</span></td>
                            <td><span className="ws-course-badge">{doc.course}</span></td>
                            <td style={{ fontSize: '12px' }}>{doc.uploader}</td>
                            <td style={{ fontSize: '11.5px', color: 'var(--ws-text-faint)', fontFamily: 'JetBrains Mono' }}>{doc.updated}</td>
                            <td style={{ textAlign: 'center' }}>
                              <button type="button" className="ws-tool-btn" title="Tải về">
                                <Download size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 7. MEMBERS VIEW */}
              {activeNavId === 'members' && (
                <div className="ws-members-view">
                  <div className="ws-members-grid">
                    {sampleMembers.map((member) => (
                      <div key={member.id} className="ws-member-card">
                        <div className="ws-member-avatar">{member.initial}</div>
                        <div className="ws-member-info">
                          <div className="ws-member-name">{member.name}</div>
                          <div className="ws-member-role">{member.role}</div>
                          <div className="ws-member-email">{member.email}</div>
                        </div>
                      </div>
                    ))}
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
        onToggleTimer={() => {}}
      />

      {/* 4. Quick Capture Scratchpad Slide-over Drawer (Q) */}
      <WorkspaceQuickCapture
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        onSaveToPersonalNotes={(scratchContent) => {
          console.log('Saved scratch content:', scratchContent);
        }}
      />
    </div>
  );
};
