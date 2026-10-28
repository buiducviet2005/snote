import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../../components/common/Modal';
import { api, ApiResponse } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import { MarkdownViewer } from '../../../components/common/MarkdownViewer';
import { NoteModal } from '../../notes/components/NoteModal';
import { TaskModal } from '../../tasks/components/TaskModal';
import { NoteType, TaskStatus, TaskPriority, ProjectMemberRole } from '@snote/shared';
import {
  FolderKanban,
  CheckSquare,
  FileText,
  Users,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Clock3,
  User,
  Crown,
  Trash2,
  Eye,
  Send,
  MessageSquare,
  Sparkles,
  Tag,
  AlertCircle,
  Lock,
  ShieldCheck,
  LogOut
} from 'lucide-react';

interface ProjectWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | null;
  onRefreshParent: () => void;
}

export const ProjectWorkspaceModal: React.FC<ProjectWorkspaceModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onRefreshParent
}) => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [workspaceData, setWorkspaceData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'TASKS' | 'NOTES' | 'MEMBERS' | 'DISCUSSION'>('TASKS');

  // Modals for creating items directly within project
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedNoteForPreview, setSelectedNoteForPreview] = useState<any | null>(null);

  // Invite member form state
  const [inviteInput, setInviteInput] = useState('');
  const [inviteRole, setInviteRole] = useState<ProjectMemberRole>(ProjectMemberRole.MEMBER);
  const [inviteLoading, setInviteLoading] = useState(false);

  // Quick Task form state
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskAssignee, setQuickTaskAssignee] = useState('');
  const [quickTaskLoading, setQuickTaskLoading] = useState(false);

  // Team Discussion state
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState('');

  const fetchWorkspace = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<any>>(`/projects/${projectId}/workspace`);
      setWorkspaceData(res.data);
    } catch (err: any) {
      showToast(err.message || 'Không thể tải không gian làm việc dự án', 'error');
    } finally {
      setLoading(false);
    }
  }, [projectId, showToast]);

  useEffect(() => {
    if (isOpen && projectId) {
      fetchWorkspace();
      setActiveTab('TASKS');
    }
  }, [isOpen, projectId, fetchWorkspace]);

  if (!isOpen || !projectId) return null;

  const project = workspaceData || {};
  const tasks: any[] = project.tasks || [];
  const notes: any[] = project.notes || [];
  const members: any[] = project.members || [];

  const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const currentMember = members.find((m) => m.userId === currentUser?.id);
  const isOwner = currentMember?.role === ProjectMemberRole.OWNER || project.userId === currentUser?.id;
  const isAdmin = currentMember?.role === ProjectMemberRole.ADMIN;
  const canManageProject = isOwner || isAdmin;
  const isClassProject = Boolean(project.classId);

  // Toggle Task Status directly with Authorization Check
  const handleToggleTaskStatus = async (task: any) => {
    const assigneesList = (task.assignees && task.assignees.length > 0)
      ? task.assignees
      : (task.assignee ? [task.assignee] : (task.user ? [task.user] : []));

    const isAssignee = assigneesList.some((u: any) => (u.id || u.userId) === currentUser?.id);
    const isCreator = task.userId === currentUser?.id;
    const canComplete = isAssignee || isCreator || isOwner || isAdmin;

    if (!canComplete) {
      showToast('🔒 Chỉ thành viên được phân công hoặc Trưởng nhóm/Quản trị viên mới có quyền hoàn thành task này', 'warning');
      return;
    }

    const nextStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    try {
      await api.patch(`/tasks/${task.id}/status`, { status: nextStatus });
      showToast(nextStatus === 'DONE' ? 'Đã hoàn thành công việc!' : 'Đã mở lại công việc', 'success');
      fetchWorkspace();
      onRefreshParent();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi cập nhật trạng thái việc', 'error');
    }
  };

  // Quick Create Task for Project
  const handleQuickCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;

    setQuickTaskLoading(true);
    try {
      await api.post('/tasks', {
        title: quickTaskTitle.trim(),
        projectId,
        assigneeIds: quickTaskAssignee ? [quickTaskAssignee] : (currentUser?.id ? [currentUser.id] : undefined),
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM
      });
      showToast('Đã thêm công việc vào dự án thành công!', 'success');
      setQuickTaskTitle('');
      fetchWorkspace();
      onRefreshParent();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tạo nhanh công việc', 'error');
    } finally {
      setQuickTaskLoading(false);
    }
  };

  // Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteInput.trim()) return;

    setInviteLoading(true);
    try {
      await api.post(`/projects/${projectId}/members`, {
        emailOrUserId: inviteInput.trim(),
        role: inviteRole
      });
      showToast('Đã thêm thành viên vào dự án thành công!', 'success');
      setInviteInput('');
      setInviteRole(ProjectMemberRole.MEMBER);
      fetchWorkspace();
      onRefreshParent();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi thêm thành viên', 'error');
    } finally {
      setInviteLoading(false);
    }
  };

  // Update Member Role
  const handleUpdateRole = async (targetUserId: string, newRole: ProjectMemberRole, name: string) => {
    if (newRole === ProjectMemberRole.OWNER) {
      if (!window.confirm(`Bạn có chắc muốn chuyển giao quyền Trưởng nhóm (OWNER) cho "${name}"?`)) return;
    }

    try {
      await api.put(`/projects/${projectId}/members/${targetUserId}`, { role: newRole });
      showToast(`Đã cập nhật vai trò của "${name}" thành ${newRole}`, 'success');
      fetchWorkspace();
      onRefreshParent();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi cập nhật vai trò', 'error');
    }
  };

  // Remove / Kick Member or Leave Project
  const handleRemoveMember = async (targetUserId: string, name: string) => {
    const isSelf = targetUserId === currentUser?.id;
    if (!window.confirm(isSelf ? 'Bạn có chắc muốn rời khỏi dự án này?' : `Bạn có chắc muốn xóa (kick) thành viên "${name}" khỏi dự án?`)) return;

    try {
      await api.delete(`/projects/${projectId}/members/${targetUserId}`);
      showToast(isSelf ? 'Bạn đã rời nhóm dự án thành công' : `Đã xóa thành viên "${name}" khỏi dự án`, 'success');
      fetchWorkspace();
      onRefreshParent();
      if (isSelf) onClose();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa thành viên', 'error');
    }
  };

  // Send Discussion Message
  const handleSendDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      senderName: currentUser?.fullName || 'Bạn',
      senderEmail: currentUser?.email || '',
      content: msgInput.trim(),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setDiscussions((prev) => [...prev, newMsg]);
    setMsgInput('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Không Gian Làm Việc Dự Án: ${project.name || '...'}`}
      maxWidth="1100px"
      icon={<FolderKanban size={22} />}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Project Header Bar */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span className="badge badge-purple" style={{ fontSize: '13px', padding: '4px 10px' }}>
                <FolderKanban size={13} />
                <span>{project.name}</span>
              </span>

              {project.subject && (
                <span
                  className="badge"
                  style={{
                    backgroundColor: project.subject.color ? `${project.subject.color}20` : 'rgba(255,255,255,0.06)',
                    color: project.subject.color || 'var(--text-secondary)',
                    border: `1px solid ${project.subject.color ? `${project.subject.color}40` : 'var(--border-color)'}`
                  }}
                >
                  {project.subject.code ? `[${project.subject.code}] ` : ''}{project.subject.name}
                </span>
              )}

              {project.semester && (
                <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                  {project.semester.name} ({project.semester.academicYear})
                </span>
              )}
            </div>

            {/* Quick stats & Member Avatars */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '-6px' }}>
                {members.slice(0, 4).map((m: any, idx: number) => (
                  <div
                    key={m.id || idx}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: m.role === 'OWNER' ? 'var(--color-warning)' : 'var(--accent-primary)',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid var(--bg-primary)',
                      marginLeft: idx > 0 ? '-8px' : 0
                    }}
                    title={`${m.user?.fullName || m.user?.email} (${m.role})`}
                  >
                    {m.role === 'OWNER' ? '👑' : (m.user?.fullName?.charAt(0) || 'U')}
                  </div>
                ))}
                {members.length > 4 && (
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-muted)',
                      fontSize: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid var(--bg-primary)',
                      marginLeft: '-8px'
                    }}
                  >
                    +{members.length - 4}
                  </div>
                )}
              </div>

              {project.dueDate && (
                <span className="badge badge-amber" style={{ fontSize: '11.5px' }}>
                  <Calendar size={12} />
                  <span>Hạn nộp: {new Date(project.dueDate).toLocaleDateString('vi-VN')}</span>
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <span>Tiến độ hoàn thành công việc:</span>
              <span><b>{completedTasks}/{tasks.length} tasks</b> ({progressPercent}%)</span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  backgroundColor: progressPercent === 100 ? 'var(--color-success)' : 'var(--accent-primary)',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          </div>
        </div>

        {/* Workspace Segmented Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-primary)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('TASKS')}
            className={`btn btn-sm ${activeTab === 'TASKS' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <CheckSquare size={15} />
            <span>Công Việc Nhóm ({tasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('NOTES')}
            className={`btn btn-sm ${activeTab === 'NOTES' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <FileText size={15} />
            <span>Ghi Chú & Tài Liệu ({notes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('MEMBERS')}
            className={`btn btn-sm ${activeTab === 'MEMBERS' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Users size={15} />
            <span>Thành Viên & Quyền ({members.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('DISCUSSION')}
            className={`btn btn-sm ${activeTab === 'DISCUSSION' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <MessageSquare size={15} />
            <span>Trao Đổi Nhóm</span>
          </button>
        </div>

        {/* TAB 1: TASKS */}
        {activeTab === 'TASKS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Quick Inline Task Creator */}
            <form
              onSubmit={handleQuickCreateTask}
              style={{
                display: 'flex',
                gap: '10px',
                backgroundColor: 'var(--bg-primary)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}
            >
              <input
                type="text"
                required
                placeholder="+ Thêm nhanh nhiệm vụ cho dự án / bài tập lớn (Ví dụ: Thiết kế giao diện Dashboard)..."
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                className="snote-input"
                style={{ flex: 3, minWidth: '220px', fontSize: '13px' }}
              />

              {members.length > 0 && (
                <select
                  value={quickTaskAssignee}
                  onChange={(e) => setQuickTaskAssignee(e.target.value)}
                  className="snote-select"
                  style={{ flex: 1.5, minWidth: '160px', fontSize: '12.5px' }}
                >
                  <option value="">👤 Phân công: Mặc định (Bạn)</option>
                  {members.map((m: any) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user?.fullName || m.user?.email} {m.userId === currentUser?.id ? '(Bạn)' : ''}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="submit"
                disabled={quickTaskLoading || !quickTaskTitle.trim()}
                className="btn btn-primary btn-sm"
                style={{ fontWeight: 700, padding: '7px 14px' }}
              >
                {quickTaskLoading ? 'Đang thêm...' : '+ Thêm Nhanh'}
              </button>

              <button
                type="button"
                onClick={() => setIsTaskModalOpen(true)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '7px 12px', fontSize: '12px' }}
                title="Mở form chi tiết có mô tả, tags, mức độ ưu tiên"
              >
                <Plus size={13} />
                <span>Form Chi Tiết</span>
              </button>
            </form>

            {/* Task list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>
                  <CheckSquare size={32} style={{ opacity: 0.4, marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '13.5px' }}>Đồ án chưa có công việc nào. Nhập tiêu đề ở trên hoặc bấm <b>"Form Chi Tiết"</b> để bắt đầu phân công nhiệm vụ.</p>
                </div>
              ) : (
                tasks.map((task) => {
                  const isDone = task.status === 'DONE';
                  const assigneesList: any[] = (task.assignees && task.assignees.length > 0)
                    ? task.assignees
                    : (task.assignee ? [task.assignee] : (task.user ? [task.user] : []));

                  const isAssignee = assigneesList.some((u: any) => (u.id || u.userId) === currentUser?.id);
                  const isCreator = task.userId === currentUser?.id;
                  const canComplete = isAssignee || isCreator || isOwner;

                  return (
                    <div
                      key={task.id}
                      className="snote-card"
                      style={{
                        padding: '12px 16px',
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <button
                          onClick={() => handleToggleTaskStatus(task)}
                          disabled={!canComplete}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: canComplete ? 'pointer' : 'not-allowed',
                            color: isDone ? 'var(--color-success)' : canComplete ? 'var(--text-muted)' : 'var(--border-color)',
                            display: 'flex',
                            padding: 0
                          }}
                          title={
                            !canComplete
                              ? '🔒 Chỉ thành viên được phân công hoặc Trưởng nhóm mới có quyền hoàn thành task này'
                              : isDone
                              ? 'Đánh dấu chưa xong'
                              : 'Đánh dấu hoàn thành'
                          }
                        >
                          {isDone ? (
                            <CheckCircle2 size={19} />
                          ) : !canComplete ? (
                            <Lock size={16} style={{ color: 'var(--text-muted)' }} />
                          ) : (
                            <Circle size={19} />
                          )}
                        </button>

                        <div>
                          <div
                            style={{
                              fontSize: '14px',
                              fontWeight: 600,
                              color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                              textDecoration: isDone ? 'line-through' : 'none'
                            }}
                          >
                            {task.title}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
                            {task.dueDate && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Clock size={11} /> {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                              </span>
                            )}
                            {task.priority && (
                              <span className={`badge ${task.priority === 'URGENT' ? 'badge-rose' : task.priority === 'HIGH' ? 'badge-amber' : 'badge-neutral'}`} style={{ fontSize: '10px', padding: '1px 5px' }}>
                                {task.priority}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Multi-Assignees Info */}
                      {assigneesList.length > 0 && (
                        <div
                          className="badge"
                          style={{
                            fontSize: '11px',
                            padding: '3px 8px',
                            backgroundColor: 'rgba(99, 102, 241, 0.12)',
                            color: 'var(--accent-primary)',
                            border: '1px solid var(--accent-border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title={`Phụ trách: ${assigneesList.map((a: any) => a.fullName || a.email).join(', ')}`}
                        >
                          <Users size={12} />
                          <span>
                            {assigneesList.length === 1
                              ? (assigneesList[0].id === currentUser?.id || assigneesList[0].userId === currentUser?.id ? 'Bạn' : assigneesList[0].fullName?.split(' ').slice(-1)[0] || 'Phụ trách')
                              : (isAssignee ? `Bạn + ${assigneesList.length - 1} người` : `${assigneesList.length} người làm`)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: NOTES */}
        {activeTab === 'NOTES' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                TÀI LIỆU KỸ THUẬT & NHẬT KÝ DỰ ÁN / BTL
              </div>
              <button
                onClick={() => setIsNoteModalOpen(true)}
                className="btn btn-primary btn-sm"
                style={{ fontWeight: 600 }}
              >
                <Plus size={14} />
                <span>Thêm Ghi Chú Dự Án</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
              {notes.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>
                  <FileText size={32} style={{ opacity: 0.4, marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '13.5px' }}>Chưa có ghi chú nào trong dự án. Bấm <b>"Thêm Ghi Chú Dự Án"</b> để viết nhật ký hoặc tài liệu.</p>
                </div>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNoteForPreview(note)}
                    className="snote-card"
                    style={{
                      padding: '14px',
                      backgroundColor: 'var(--bg-primary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '140px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                        {note.title}
                      </div>
                      <div
                        style={{
                          fontSize: '12.5px',
                          color: 'var(--text-secondary)',
                          maxHeight: '60px',
                          overflow: 'hidden',
                          marginBottom: '8px'
                        }}
                      >
                        <MarkdownViewer content={note.content} className="markdown-preview-compact" />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
                      <span>{note.author?.fullName || 'Tác giả'}</span>
                      <span>{new Date(note.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MEMBERS */}
        {activeTab === 'MEMBERS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Invite Form (Owner & Admin) */}
            {canManageProject && !isClassProject && (
              <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '10px', backgroundColor: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <input
                  type="text"
                  placeholder="Nhập email (vd: sinhvien@snote.edu.vn) hoặc User ID"
                  value={inviteInput}
                  onChange={(e) => setInviteInput(e.target.value)}
                  className="snote-input"
                  style={{ flex: 2, fontSize: '13px' }}
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as ProjectMemberRole)}
                  className="snote-select"
                  style={{ flex: 1, fontSize: '13px' }}
                >
                  {isOwner && <option value={ProjectMemberRole.ADMIN}>Quản trị viên (Admin)</option>}
                  <option value={ProjectMemberRole.MEMBER}>Thành viên (Member)</option>
                  <option value={ProjectMemberRole.VIEWER}>Chỉ xem (Viewer)</option>
                </select>
                <button type="submit" disabled={inviteLoading} className="btn btn-primary btn-sm" style={{ fontWeight: 600 }}>
                  {inviteLoading ? 'Đang thêm...' : '+ Mời'}
                </button>
              </form>
            )}

            {/* Members List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {members.map((m: any) => {
                const isMemberOwner = m.role === ProjectMemberRole.OWNER || m.userId === project.userId;
                const isMemberAdmin = m.role === ProjectMemberRole.ADMIN;
                const isMe = m.userId === currentUser?.id;

                const canKickThisMember = !isClassProject &&
                  !isMe &&
                  ((isOwner && !isMemberOwner) ||
                   (isAdmin && !isMemberOwner && !isMemberAdmin));

                const canChangeThisRole = !isClassProject &&
                  !isMe &&
                  ((isOwner && !isMemberOwner) ||
                   (isAdmin && !isMemberOwner && !isMemberAdmin));

                return (
                  <div
                    key={m.id}
                    className="snote-card"
                    style={{
                      padding: '10px 14px',
                      backgroundColor: 'var(--bg-primary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: isMemberOwner
                            ? 'var(--color-warning-subtle)'
                            : isMemberAdmin
                            ? 'rgba(168, 85, 247, 0.15)'
                            : 'var(--accent-subtle)',
                          color: isMemberOwner
                            ? 'var(--color-warning)'
                            : isMemberAdmin
                            ? '#a855f7'
                            : 'var(--accent-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '13px',
                          fontWeight: 700
                        }}
                      >
                        {isMemberOwner ? <Crown size={16} /> : isMemberAdmin ? <ShieldCheck size={16} /> : (m.user?.fullName?.charAt(0) || <User size={15} />)}
                      </div>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{m.user?.fullName || 'Thành viên'}</span>
                          {isMe && <span className="badge badge-blue" style={{ fontSize: '9.5px', padding: '1px 5px' }}>Bạn</span>}
                          {isMemberOwner && <span className="badge badge-amber" style={{ fontSize: '9.5px', padding: '1px 5px' }}>Trưởng nhóm</span>}
                          {isMemberAdmin && !isMemberOwner && <span className="badge badge-purple" style={{ fontSize: '9.5px', padding: '1px 5px' }}>Quản trị viên</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {m.user?.email || m.userId}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {canChangeThisRole ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleUpdateRole(m.userId, e.target.value as ProjectMemberRole, m.user?.fullName || 'thành viên')}
                          className="snote-select"
                          style={{ fontSize: '12px', padding: '3px 8px', width: 'auto' }}
                        >
                          {isOwner && <option value={ProjectMemberRole.OWNER}>Trưởng nhóm</option>}
                          {isOwner && <option value={ProjectMemberRole.ADMIN}>Quản trị viên</option>}
                          <option value={ProjectMemberRole.MEMBER}>Thành viên</option>
                          <option value={ProjectMemberRole.VIEWER}>Chỉ xem</option>
                        </select>
                      ) : (
                        <span
                          className={`badge ${isMemberOwner ? 'badge-amber' : isMemberAdmin ? 'badge-purple' : m.role === ProjectMemberRole.VIEWER ? 'badge-neutral' : 'badge-green'}`}
                          style={{ fontSize: '11px' }}
                        >
                          {isMemberOwner ? 'Trưởng nhóm' : isMemberAdmin ? 'Quản trị viên' : m.role === ProjectMemberRole.VIEWER ? 'Chỉ xem' : 'Thành viên'}
                        </span>
                      )}

                      {/* Kick Member */}
                      {canKickThisMember && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.userId, m.user?.fullName || 'thành viên')}
                          className="btn btn-ghost btn-icon btn-sm"
                          style={{ color: 'var(--color-danger)', padding: '4px' }}
                          title="Xóa (kick) thành viên khỏi dự án"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}

                      {/* Leave Project for Self */}
                      {isMe && !isMemberOwner && !isClassProject && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.userId, 'chính bạn')}
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-danger)', padding: '3px 6px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '3px' }}
                          title="Rời khỏi nhóm dự án"
                        >
                          <LogOut size={12} />
                          <span>Rời nhóm</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: DISCUSSION */}
        {activeTab === 'DISCUSSION' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                minHeight: '280px',
                padding: '14px',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              {discussions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <MessageSquare size={24} style={{ opacity: 0.4, marginBottom: '6px' }} />
                  <p style={{ margin: 0 }}>Bảng thảo luận nội bộ dự án. Gửi tin nhắn đầu tiên để cùng nhóm trao đổi!</p>
                </div>
              ) : (
                discussions.map((msg) => (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      <b style={{ color: 'var(--accent-primary)' }}>{msg.senderName}</b>
                      <span>•</span>
                      <span>{msg.time}</span>
                    </div>
                    <div
                      style={{
                        padding: '8px 12px',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '13px',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        width: 'fit-content',
                        maxWidth: '85%'
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendDiscussion} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Nhập tin nhắn trao đổi với nhóm dự án..."
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                className="snote-input"
                style={{ fontSize: '13px' }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0 16px', fontWeight: 600 }}>
                <Send size={15} />
                <span>Gửi</span>
              </button>
            </form>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Đóng Không Gian Làm Việc
          </button>
        </div>
      </div>

      {/* Note Modal for Project */}
      {isNoteModalOpen && (
        <NoteModal
          isOpen={isNoteModalOpen}
          onClose={() => setIsNoteModalOpen(false)}
          onSuccess={() => {
            fetchWorkspace();
            onRefreshParent();
          }}
          noteToEdit={null}
          defaultProjectId={projectId}
          defaultSubjectId={project.subjectId ?? null}
        />
      )}

      {/* Task Modal for Project */}
      {isTaskModalOpen && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onSuccess={() => {
            fetchWorkspace();
            onRefreshParent();
          }}
          taskToEdit={null}
          defaultProjectId={projectId}
          defaultSubjectId={project.subjectId ?? null}
        />
      )}

      {/* Note Preview Modal */}
      {selectedNoteForPreview && (
        <NoteModal
          isOpen={Boolean(selectedNoteForPreview)}
          onClose={() => setSelectedNoteForPreview(null)}
          onSuccess={() => {
            fetchWorkspace();
            onRefreshParent();
          }}
          noteToEdit={selectedNoteForPreview}
          initialMode="PREVIEW"
        />
      )}
    </Modal>
  );
};
