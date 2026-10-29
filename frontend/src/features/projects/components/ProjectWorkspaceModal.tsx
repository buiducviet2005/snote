import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../../components/common/Modal';
import { api, ApiResponse } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
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
  Shield,
  ShieldCheck,
  LogOut,
  Pin
} from 'lucide-react';

interface ProjectWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | null;
  onRefreshParent: () => void;
  initialTab?: 'TASKS' | 'NOTES' | 'MEMBERS' | 'DISCUSSION';
}

export const ProjectWorkspaceModal: React.FC<ProjectWorkspaceModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onRefreshParent,
  initialTab = 'TASKS'
}) => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const { t, language, formatDate, formatTime, formatDateTime } = useLanguage();

  const [workspaceData, setWorkspaceData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'TASKS' | 'NOTES' | 'MEMBERS' | 'DISCUSSION'>(initialTab);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab, projectId]);

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
      showToast(t('tasks.locked_complete_tooltip'), 'warning');
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
      if (!window.confirm(t('projects.transfer_owner_confirm', { name }))) return;
    }

    try {
      await api.put(`/projects/${projectId}/members/${targetUserId}`, { role: newRole });
      showToast(t('projects.transfer_role_success', { name, role: newRole }), 'success');
      fetchWorkspace();
      onRefreshParent();
    } catch (err: any) {
      showToast(err.message || t('projects.update_role_error'), 'error');
    }
  };

  // Remove / Kick Member or Leave Project
  const handleRemoveMember = async (targetUserId: string, name: string) => {
    const isSelf = targetUserId === currentUser?.id;
    if (!window.confirm(isSelf ? t('projects.leave_self_confirm') : t('projects.kick_member_confirm', { name }))) return;

    try {
      await api.delete(`/projects/${projectId}/members/${targetUserId}`);
      showToast(isSelf ? t('projects.leave_self_success') : t('projects.kick_member_success', { name }), 'success');
      fetchWorkspace();
      onRefreshParent();
      if (isSelf) onClose();
    } catch (err: any) {
      showToast(err.message || t('projects.kick_member_error'), 'error');
    }
  };

  // Send Discussion Message
  const handleSendDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      senderName: currentUser?.fullName || t('projects.role_you'),
      senderEmail: currentUser?.email || '',
      content: msgInput.trim(),
      time: formatTime(new Date())
    };

    setDiscussions((prev) => [...prev, newMsg]);
    setMsgInput('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('projects.workspace_title', { name: project.name || '...' })}
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
              <span className="badge badge-purple" style={{ fontSize: 'var(--type-small)', padding: '4px 10px' }}>
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
                <span className="badge badge-neutral" style={{ fontSize: 'var(--type-caption)' }}>
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
                      fontSize: 'var(--type-caption)',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid var(--bg-primary)',
                      marginLeft: idx > 0 ? '-8px' : 0
                    }}
                    title={`${m.user?.fullName || m.user?.email} (${m.role})`}
                  >
                    {m.role === 'OWNER' ? <Crown size={12} strokeWidth={1.5} /> : (m.user?.fullName?.charAt(0) || 'U')}
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
                      fontSize: 'var(--type-caption)',
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
                <span className="badge badge-amber" style={{ fontSize: 'var(--type-caption)' }}>
                  <Calendar size={12} />
                  <span>{t('classes.due_prefix', { date: formatDate(project.dueDate) })}</span>
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--type-small)', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <span>{t('projects.completed_tasks_progress', { completed: completedTasks, total: tasks.length, percent: progressPercent })}</span>
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
            style={{ flex: 1, fontSize: 'var(--type-small)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <CheckSquare size={15} />
            <span>{t('projects.tab_tasks', { count: tasks.length })}</span>
          </button>

          <button
            onClick={() => setActiveTab('NOTES')}
            className={`btn btn-sm ${activeTab === 'NOTES' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, fontSize: 'var(--type-small)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <FileText size={15} />
            <span>{t('projects.tab_notes', { count: notes.length })}</span>
          </button>

          <button
            onClick={() => setActiveTab('MEMBERS')}
            className={`btn btn-sm ${activeTab === 'MEMBERS' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, fontSize: 'var(--type-small)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Users size={15} />
            <span>{t('projects.tab_members', { count: members.length })}</span>
          </button>

          <button
            onClick={() => setActiveTab('DISCUSSION')}
            className={`btn btn-sm ${activeTab === 'DISCUSSION' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, fontSize: 'var(--type-small)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <MessageSquare size={15} />
            <span>{t('projects.tab_discussion')}</span>
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
                placeholder={t('projects.quick_task_placeholder')}
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                className="snote-input"
                style={{ flex: 3, minWidth: '220px', fontSize: 'var(--type-small)' }}
              />

              {members.length > 0 && (
                <select
                  value={quickTaskAssignee}
                  onChange={(e) => setQuickTaskAssignee(e.target.value)}
                  className="snote-select"
                  style={{ flex: 1.5, minWidth: '160px', fontSize: 'var(--type-small)' }}
                >
                  <option value="">{t('projects.assign_default')}</option>
                  {members.map((m: any) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user?.fullName || m.user?.email} {m.userId === currentUser?.id ? `(${t('projects.role_you')})` : ''}
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
                {quickTaskLoading ? t('common.saving') : t('projects.add_quick_btn')}
              </button>

              <button
                type="button"
                onClick={() => setIsTaskModalOpen(true)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '7px 12px', fontSize: 'var(--type-small)' }}
                title={t('projects.detailed_form_tooltip')}
              >
                <Plus size={13} />
                <span>{language === 'vi' ? 'Form Chi Tiết' : 'Detailed Form'}</span>
              </button>
            </form>

            {/* Task list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>
                  <CheckSquare size={32} style={{ opacity: 0.4, marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: 'var(--type-small)' }}>
                    {language === 'vi'
                      ? 'Đồ án chưa có công việc nào. Nhập tiêu đề ở trên hoặc bấm "Form Chi Tiết" để bắt đầu phân công nhiệm vụ.'
                      : 'No tasks in this project yet. Enter a title above or click "Detailed Form" to start assigning tasks.'}
                  </p>
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
                              ? t('tasks.locked_complete_tooltip')
                              : isDone
                              ? t('tasks.mark_as_open')
                              : t('tasks.mark_as_done')
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
                              fontSize: 'var(--type-body)',
                              fontWeight: 600,
                              color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                              textDecoration: isDone ? 'line-through' : 'none'
                            }}
                          >
                            {task.title}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--type-caption)', color: 'var(--text-muted)', marginTop: '3px' }}>
                            {task.dueDate && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Clock size={11} /> {formatDate(task.dueDate)}
                              </span>
                            )}
                            {task.priority && (
                              <span className={`badge ${task.priority === 'URGENT' ? 'badge-rose' : task.priority === 'HIGH' ? 'badge-amber' : 'badge-neutral'}`} style={{ fontSize: 'var(--type-caption)', padding: '1px 5px' }}>
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
                            fontSize: 'var(--type-caption)',
                            padding: '3px 8px',
                            backgroundColor: 'rgba(99, 102, 241, 0.12)',
                            color: 'var(--accent-primary)',
                            border: '1px solid var(--accent-border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title={t('tasks.assigned_to', { name: assigneesList.map((a: any) => a.fullName || a.email).join(', ') })}
                        >
                          <Users size={12} />
                          <span>
                            {assigneesList.length === 1
                              ? (assigneesList[0].id === currentUser?.id || assigneesList[0].userId === currentUser?.id ? t('projects.role_you') : assigneesList[0].fullName?.split(' ').slice(-1)[0] || t('tasks.assignee'))
                              : (isAssignee ? (language === 'vi' ? `Bạn + ${assigneesList.length - 1} người` : `You + ${assigneesList.length - 1} others`) : (language === 'vi' ? `${assigneesList.length} người làm` : `${assigneesList.length} assignees`))}
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
              <div style={{ fontSize: 'var(--type-body)', fontWeight: 700, color: 'var(--text-primary)' }}>
                {language === 'vi' ? 'TÀI LIỆU KỸ THUẬT & NHẬT KÝ DỰ ÁN / BTL' : 'PROJECT DOCUMENTATION & LOGS'}
              </div>
              <button
                onClick={() => setIsNoteModalOpen(true)}
                className="btn btn-primary btn-sm"
                style={{ fontWeight: 600 }}
              >
                <Plus size={14} />
                <span>{language === 'vi' ? 'Thêm Ghi Chú Dự Án' : 'Add Project Note'}</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
              {notes.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>
                  <FileText size={32} style={{ opacity: 0.4, marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: 'var(--type-small)' }}>
                    {language === 'vi'
                      ? 'Chưa có ghi chú nào trong dự án. Bấm "Thêm Ghi Chú Dự Án" để viết nhật ký hoặc tài liệu.'
                      : 'No notes in this project yet. Click "Add Project Note" to write logs or documentation.'}
                  </p>
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
                      <div style={{ fontSize: 'var(--type-body)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                        {note.title}
                      </div>
                      <div
                        style={{
                          fontSize: 'var(--type-small)',
                          color: 'var(--text-secondary)',
                          maxHeight: '60px',
                          overflow: 'hidden',
                          marginBottom: '8px'
                        }}
                      >
                        <MarkdownViewer content={note.content} className="markdown-preview-compact" />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--type-caption)', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
                      <span>{note.author?.fullName || (language === 'vi' ? 'Tác giả' : 'Author')}</span>
                      <span>{formatDate(note.createdAt)}</span>
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
            {canManageProject && (
              <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '10px', backgroundColor: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <input
                  type="text"
                  placeholder={language === 'vi' ? 'Nhập email (vd: sinhvien@snote.edu.vn) hoặc User ID' : 'Enter email (e.g. student@snote.edu.vn) or User ID'}
                  value={inviteInput}
                  onChange={(e) => setInviteInput(e.target.value)}
                  className="snote-input"
                  style={{ flex: 2, fontSize: 'var(--type-small)' }}
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as ProjectMemberRole)}
                  className="snote-select"
                  style={{ flex: 1, fontSize: 'var(--type-small)' }}
                >
                  {isOwner && <option value={ProjectMemberRole.ADMIN}>{t('projects.role_admin')} (Admin)</option>}
                  <option value={ProjectMemberRole.MEMBER}>{t('projects.role_member')} (Member)</option>
                  <option value={ProjectMemberRole.VIEWER}>{t('projects.role_viewer')} (Viewer)</option>
                </select>
                <button type="submit" disabled={inviteLoading} className="btn btn-primary btn-sm" style={{ fontWeight: 600 }}>
                  {inviteLoading ? t('common.loading') : `+ ${t('projects.role_member')}`}
                </button>
              </form>
            )}

            {isClassProject && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--type-small)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Shield size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                <span>
                  {language === 'vi'
                    ? 'Dự án lớp học: thành viên được quản lý trực tiếp trong tab này, độc lập với nhóm học tập.'
                    : 'Class project: members are managed directly in this tab, independent of study groups.'}
                </span>
              </div>
            )}

            {/* Members List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {members.map((m: any) => {
                const isMemberOwner = m.role === ProjectMemberRole.OWNER || m.userId === project.userId;
                const isMemberAdmin = m.role === ProjectMemberRole.ADMIN;
                const isMe = m.userId === currentUser?.id;

                const canKickThisMember =
                  !isMe &&
                  ((isOwner && !isMemberOwner) ||
                   (isAdmin && !isMemberOwner && !isMemberAdmin));

                const canChangeThisRole =
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
                          fontSize: 'var(--type-small)',
                          fontWeight: 700
                        }}
                      >
                        {isMemberOwner ? <Crown size={16} /> : isMemberAdmin ? <ShieldCheck size={16} /> : (m.user?.fullName?.charAt(0) || <User size={15} />)}
                      </div>
                      <div>
                        <div style={{ fontSize: 'var(--type-small)', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{m.user?.fullName || t('projects.role_member')}</span>
                          {isMe && <span className="badge badge-blue" style={{ fontSize: 'var(--type-caption)', padding: '1px 5px' }}>{t('projects.role_you')}</span>}
                          {isMemberOwner && <span className="badge badge-amber" style={{ fontSize: 'var(--type-caption)', padding: '1px 5px' }}>{t('projects.role_owner')}</span>}
                          {isMemberAdmin && !isMemberOwner && <span className="badge badge-purple" style={{ fontSize: 'var(--type-caption)', padding: '1px 5px' }}>{t('projects.role_admin')}</span>}
                        </div>
                        <div style={{ fontSize: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                          {m.user?.email || m.userId}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {canChangeThisRole ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleUpdateRole(m.userId, e.target.value as ProjectMemberRole, m.user?.fullName || t('projects.role_member'))}
                          className="snote-select"
                          style={{ fontSize: 'var(--type-small)', padding: '3px 8px', width: 'auto' }}
                        >
                          {isOwner && <option value={ProjectMemberRole.OWNER}>{t('projects.role_owner')}</option>}
                          {isOwner && <option value={ProjectMemberRole.ADMIN}>{t('projects.role_admin')}</option>}
                          <option value={ProjectMemberRole.MEMBER}>{t('projects.role_member')}</option>
                          <option value={ProjectMemberRole.VIEWER}>{t('projects.role_viewer')}</option>
                        </select>
                      ) : (
                        <span
                          className={`badge ${isMemberOwner ? 'badge-amber' : isMemberAdmin ? 'badge-purple' : m.role === ProjectMemberRole.VIEWER ? 'badge-neutral' : 'badge-green'}`}
                          style={{ fontSize: 'var(--type-caption)' }}
                        >
                          {isMemberOwner ? t('projects.role_owner') : isMemberAdmin ? t('projects.role_admin') : m.role === ProjectMemberRole.VIEWER ? t('projects.role_viewer') : t('projects.role_member')}
                        </span>
                      )}

                      {/* Kick Member */}
                      {canKickThisMember && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.userId, m.user?.fullName || t('projects.role_member'))}
                          className="btn btn-ghost btn-icon btn-sm"
                          style={{ color: 'var(--color-danger)', padding: '4px' }}
                          title={t('projects.kick_member_confirm', { name: m.user?.fullName || t('projects.role_member') })}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}

                      {/* Leave Project for Self */}
                      {isMe && !isMemberOwner && !isClassProject && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.userId, t('projects.role_you'))}
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-danger)', padding: '3px 6px', fontSize: 'var(--type-caption)', display: 'flex', alignItems: 'center', gap: '3px' }}
                          title={t('projects.leave_self_confirm')}
                        >
                          <LogOut size={12} />
                          <span>{t('projects.leave_project_btn')}</span>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                minHeight: '240px',
                padding: '24px',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: '12px'
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'var(--bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)'
                }}
              >
                <MessageSquare size={22} />
              </div>
              <h4 style={{ margin: 0, fontSize: 'var(--type-body)', fontWeight: 700 }}>
                {language === 'vi' ? 'Kênh Thảo Luận Dự Án Đang Được Đồng Bộ' : 'Project Discussion Channel is Syncing'}
              </h4>
              <p style={{ margin: 0, fontSize: 'var(--type-small)', color: 'var(--text-secondary)', maxWidth: '440px', lineHeight: 1.5 }}>
                {language === 'vi'
                  ? 'Tính năng thảo luận nhóm và trao đổi trực tuyến theo thời gian thực (WebSocket) đang trong lộ trình tích hợp backend. Dữ liệu tin nhắn chưa được lưu trữ vĩnh viễn trên bản pilot.'
                  : 'Real-time WebSocket team discussion is scheduled in the backend roadmap. Messages are temporary in the pilot build.'}
              </p>
              <div
                style={{
                  fontSize: 'var(--type-caption)',
                  color: 'var(--text-muted)',
                  background: 'var(--bg-secondary)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Pin size={13} strokeWidth={1.5} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                <span>
                  {language === 'vi'
                    ? 'Đề xuất: Hãy quản lý công việc và phân công qua tab Công việc và Tài liệu ghi chú.'
                    : 'Tip: Coordinate assignments through the Tasks and Notes tabs.'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', opacity: 0.6 }}>
              <input
                type="text"
                disabled
                placeholder={t('projects.discussion_locked_placeholder')}
                className="snote-input"
                style={{ fontSize: 'var(--type-small)', cursor: 'not-allowed' }}
              />
              <button type="button" disabled className="btn btn-primary" style={{ padding: '0 16px', fontWeight: 600, cursor: 'not-allowed' }}>
                <Send size={15} />
                <span>{language === 'vi' ? 'Gửi' : 'Send'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            {t('common.close')}
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
