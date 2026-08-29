import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { MarkdownViewer } from '../../../components/common/MarkdownViewer';
import { StudyDateTimePicker } from '../../../components/common/StudyDateTimePicker';
import { ShareModal } from '../../../components/common/ShareModal';
import { toggleChecklistItem } from '../../notes/utils/smartNoteParser';
import { api, ApiResponse } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { useAppFilter } from '../../../contexts/AppFilterContext';
import { useAuth } from '../../../contexts/AuthContext';
import { TaskStatus, TaskPriority } from '@snote/shared';
import {
  CheckSquare,
  Calendar,
  Layers,
  Flame,
  Tag,
  Save,
  Clock,
  FileText,
  FolderKanban,
  UserCheck,
  Users,
  Check,
  User,
  Shield,
  Edit3,
  Eye,
  CheckCircle2,
  Circle,
  Share2
} from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  taskToEdit?: any | null;
  initialMode?: 'VIEW' | 'EDIT';
  defaultProjectId?: string;
  defaultSubjectId?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  taskToEdit,
  initialMode,
  defaultProjectId,
  defaultSubjectId
}) => {
  const { user: currentUser } = useAuth();
  const { subjects, selectedSubjectId } = useAppFilter();
  const [projects, setProjects] = useState<any[]>([]);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [mode, setMode] = useState<'VIEW' | 'EDIT'>('VIEW');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Fetch available projects to link
      api.get<ApiResponse<any[]>>('/projects')
        .then((res) => setProjects(res.data || []))
        .catch(() => {});
    }
  }, [isOpen]);

  // When project changes, load its members for assignment
  useEffect(() => {
    if (projectId) {
      api.get<ApiResponse<any>>(`/projects/${projectId}/workspace`)
        .then((res) => {
          const members = res.data?.members || [];
          setProjectMembers(members);
          if (selectedAssigneeIds.length === 0 && currentUser) {
            const isMember = members.some((m: any) => m.userId === currentUser.id);
            if (isMember) {
              setSelectedAssigneeIds([currentUser.id]);
            } else if (members.length > 0) {
              setSelectedAssigneeIds([members[0].userId]);
            }
          }
        })
        .catch(() => {
          setProjectMembers([]);
        });
    } else {
      setProjectMembers([]);
    }
  }, [projectId, currentUser]);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setSubjectId(taskToEdit.subjectId || '');
      setProjectId(taskToEdit.projectId || '');

      // Multi-assignees
      const existingAssigneeIds = (taskToEdit.assignees || []).map((a: any) => a.id || a.userId);
      if (existingAssigneeIds.length > 0) {
        setSelectedAssigneeIds(existingAssigneeIds);
      } else if (taskToEdit.userId) {
        setSelectedAssigneeIds([taskToEdit.userId]);
      } else if (taskToEdit.assignee?.id) {
        setSelectedAssigneeIds([taskToEdit.assignee.id]);
      }

      setStatus(taskToEdit.status || TaskStatus.TODO);
      setPriority(taskToEdit.priority || TaskPriority.MEDIUM);
      setDueDate(taskToEdit.dueDate ? new Date(taskToEdit.dueDate).toISOString().slice(0, 16) : '');
      setTagsInput((taskToEdit.tags || []).map((t: any) => t.name).join(', '));
      setMode(initialMode || 'VIEW');
    } else {
      setTitle('');
      setDescription('');
      setSubjectId(defaultSubjectId || selectedSubjectId || '');
      setProjectId(defaultProjectId || '');
      setSelectedAssigneeIds(currentUser?.id ? [currentUser.id] : []);
      setStatus(TaskStatus.TODO);
      setPriority(TaskPriority.MEDIUM);
      setDueDate('');
      setTagsInput('');
      setMode(initialMode || 'EDIT');
    }
  }, [taskToEdit, selectedSubjectId, subjects, isOpen, defaultProjectId, defaultSubjectId, currentUser, initialMode]);

  const toggleAssignee = (userId: string) => {
    setSelectedAssigneeIds((prev) => {
      if (prev.includes(userId)) {
        const filtered = prev.filter((id) => id !== userId);
        return filtered.length > 0 ? filtered : [userId];
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleQuickToggleStatus = async () => {
    if (!taskToEdit) return;
    const nextStatus = status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;
    setStatus(nextStatus);
    try {
      await api.patch(`/tasks/${taskToEdit.id}/status`, { status: nextStatus });
      showToast(nextStatus === TaskStatus.DONE ? '🎉 Đã hoàn thành nhiệm vụ!' : 'Đã mở lại nhiệm vụ', 'success');
      onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi cập nhật trạng thái', 'error');
    }
  };

  const handleToggleTodoInTask = async (todoIndex: number) => {
    const newDesc = toggleChecklistItem(description, todoIndex);
    setDescription(newDesc);
    if (taskToEdit) {
      taskToEdit.description = newDesc;
      try {
        await api.put(`/tasks/${taskToEdit.id}`, { description: newDesc });
        onSuccess();
      } catch {
        showToast('Lỗi cập nhật tiến độ công việc', 'error');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Vui lòng nhập tên công việc', 'error');
      return;
    }

    const tagNames = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      if (taskToEdit) {
        await api.put(`/tasks/${taskToEdit.id}`, {
          title: title.trim(),
          description: description.trim() || undefined,
          subjectId: subjectId || null,
          projectId: projectId || null,
          assigneeIds: selectedAssigneeIds.length > 0 ? selectedAssigneeIds : undefined,
          status,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          tagNames
        });
        showToast('Cập nhật công việc thành công!', 'success');
      } else {
        await api.post('/tasks', {
          title: title.trim(),
          description: description.trim() || undefined,
          subjectId: subjectId || undefined,
          projectId: projectId || undefined,
          assigneeIds: selectedAssigneeIds.length > 0 ? selectedAssigneeIds : undefined,
          status,
          priority,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          tagNames
        });
        showToast('Tạo công việc và giao việc thành công!', 'success');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu công việc', 'error');
    } finally {
      setLoading(false);
    }
  };

  const currentProjectName = projects.find((p) => p.id === projectId)?.name;
  const currentSubject = subjects.find((s) => s.id === subjectId);
  const isDone = status === TaskStatus.DONE;

  return (
    <>
      <Modal
        isOpen={isOpen}
      onClose={onClose}
      title={
        taskToEdit
          ? mode === 'VIEW'
            ? 'Xem Chi Tiết Công Việc'
            : 'Chỉnh Sửa Công Việc & Phân Công'
          : 'Giao Việc & Tạo Nhiệm Vụ Mới'
      }
      maxWidth={mode === 'VIEW' ? '680px' : '720px'}
      icon={<CheckSquare size={20} />}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* VIEW / PREVIEW MODE: Minimalist, clean title, subtle metadata string, bounded description */}
        {mode === 'VIEW' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Title with Quick Complete Toggle */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              {taskToEdit && (
                <button
                  type="button"
                  onClick={handleQuickToggleStatus}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: isDone ? 'var(--color-success)' : 'var(--text-muted)',
                    padding: '2px',
                    display: 'flex',
                    marginTop: '2px'
                  }}
                  title={isDone ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
                >
                  {isDone ? <CheckCircle2 size={22} style={{ fill: 'rgba(16, 185, 129, 0.2)' }} /> : <Circle size={22} />}
                </button>
              )}

              <div style={{ flex: 1 }}>
                <h2
                  style={{
                    margin: '0 0 6px 0',
                    fontSize: '18px',
                    fontWeight: 800,
                    color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                    textDecoration: isDone ? 'line-through' : 'none',
                    lineHeight: 1.35,
                    wordBreak: 'break-word'
                  }}
                >
                  {title || 'Công việc chưa có tiêu đề'}
                </h2>

                {/* Subtle Metadata String */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '6px',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    lineHeight: 1.6,
                    paddingBottom: '10px',
                    borderBottom: '1px solid var(--border-color)'
                  }}
                >
                  {dueDate && (
                    <span>
                      📅 Hạn nộp: <b style={{ color: 'var(--text-primary)' }}>{new Date(dueDate).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}</b>
                    </span>
                  )}
                  <span>•</span>
                  <span>
                    ⚡ Độ ưu tiên:{' '}
                    <b style={{ color: priority === TaskPriority.URGENT ? 'var(--color-danger)' : priority === TaskPriority.HIGH ? 'var(--color-warning)' : 'var(--text-primary)' }}>
                      {priority === TaskPriority.URGENT ? 'Khẩn cấp' : priority === TaskPriority.HIGH ? 'Ưu tiên cao' : priority === TaskPriority.MEDIUM ? 'Trung bình' : 'Thấp'}
                    </b>
                  </span>
                  <span>•</span>
                  <span>
                    Trạng thái: <b style={{ color: isDone ? 'var(--color-success)' : 'var(--accent-primary)' }}>{isDone ? 'Đã hoàn thành' : status === TaskStatus.IN_PROGRESS ? 'Đang thực hiện' : 'Cần làm'}</b>
                  </span>
                  {currentSubject && (
                    <>
                      <span>•</span>
                      <span style={{ color: currentSubject.color || 'var(--accent-primary)', fontWeight: 600 }}>
                        📖 [{currentSubject.code || 'Môn'}] {currentSubject.name}
                      </span>
                    </>
                  )}
                  {currentProjectName && (
                    <>
                      <span>•</span>
                      <span style={{ color: 'var(--color-purple)', fontWeight: 600 }}>📁 {currentProjectName}</span>
                    </>
                  )}
                  {tagsInput.trim() && (
                    <>
                      <span>•</span>
                      <span>🏷️ {tagsInput}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Bounded Task Description to Prevent Overflow */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Nội dung chi tiết công việc:
              </div>
              <div
                className="snote-card"
                style={{
                  maxHeight: '260px',
                  minHeight: '80px',
                  overflowY: 'auto',
                  padding: '16px',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere'
                }}
              >
                {description.trim() ? (
                  <MarkdownViewer content={description} onToggleTodo={handleToggleTodoInTask} />
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                    Chưa có mô tả chi tiết cho nhiệm vụ này.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* EDIT / CREATE MODE: Full inputs and form controls */
          <>
            {/* Project Header context if inside project */}
            {defaultProjectId && currentProjectName && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(168, 85, 247, 0.1)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <FolderKanban size={16} style={{ color: 'var(--color-purple)' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Đang tạo nhiệm vụ trong dự án: <b>{currentProjectName}</b>
                </span>
              </div>
            )}

            {/* Title */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Tên công việc / Nhiệm vụ cần làm *
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Thiết kế Database & Pipeline tích hợp API"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="snote-input"
                style={{ fontSize: '14.5px', fontWeight: 600 }}
              />
            </div>

            {/* Subject & Project Linkage */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Môn học liên quan
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="snote-select"
                >
                  <option value="">📝 Việc cá nhân (Không thuộc môn học)</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.code ? `[${sub.code}] ` : ''}{sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  <FolderKanban size={13} style={{ color: 'var(--color-purple)' }} />
                  <span>Dự án / Bài tập lớn</span>
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="snote-select"
                  disabled={Boolean(defaultProjectId)}
                >
                  <option value="">-- Không gắn dự án (Việc cá nhân) --</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      📁 {proj.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Multi-Assignee Selection */}
            {projectId && projectMembers.length > 0 && (
              <div style={{ backgroundColor: 'var(--accent-subtle)', padding: '14px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--accent-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--accent-primary)', margin: 0 }}>
                    <Users size={16} />
                    <span>Thành viên tham gia thực hiện ({selectedAssigneeIds.length} người)</span>
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Click để chọn 1 hoặc nhiều người
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                  {projectMembers.map((m: any) => {
                    const isLeader = m.role === 'OWNER';
                    const isMe = m.userId === currentUser?.id;
                    const isSelected = selectedAssigneeIds.includes(m.userId);

                    return (
                      <div
                        key={m.userId}
                        onClick={() => toggleAssignee(m.userId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'var(--bg-secondary)' : 'rgba(255,255,255,0.03)',
                          border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: 'var(--radius-sm)',
                            border: isSelected ? 'none' : '1px solid var(--border-color)',
                            backgroundColor: isSelected ? 'var(--accent-primary)' : 'transparent',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '12.5px', fontWeight: isSelected ? 700 : 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {m.user?.fullName || m.user?.email}
                            </span>
                            {isMe && <span style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: 700 }}>(Tôi)</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                              {isLeader ? '👑 Trưởng nhóm' : 'Thành viên'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Status & Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Trạng thái
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="snote-select"
                >
                  <option value={TaskStatus.TODO}>⭕ Cần làm (To-Do)</option>
                  <option value={TaskStatus.IN_PROGRESS}>⚡ Đang làm (In Progress)</option>
                  <option value={TaskStatus.DONE}>✅ Đã hoàn thành (Done)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Mức độ ưu tiên
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="snote-select"
                >
                  <option value={TaskPriority.LOW}>🟢 Thấp (Low)</option>
                  <option value={TaskPriority.MEDIUM}>🔵 Trung bình (Medium)</option>
                  <option value={TaskPriority.HIGH}>🟠 Cao (High)</option>
                  <option value={TaskPriority.URGENT}>🔴 Khẩn cấp (Urgent)</option>
                </select>
              </div>
            </div>

            {/* Tactile Study DateTime Picker for Deadline */}
            <div>
              <StudyDateTimePicker
                value={dueDate}
                onChange={setDueDate}
                label="Hạn chót nộp bài / Hoàn thành (Deadline)"
                placeholder="Chọn ngày giờ hạn nộp bài tập..."
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Mô tả chi tiết công việc (Hỗ trợ Markdown)
              </label>
              <textarea
                rows={4}
                placeholder="Ghi chú chi tiết yêu cầu, tiêu chuẩn bàn giao, link tài liệu tham khảo..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="snote-textarea"
                style={{
                  lineHeight: '1.5',
                  maxHeight: '200px',
                  resize: 'vertical',
                  wordBreak: 'break-word'
                }}
              />
            </div>

            {/* Tags */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Thẻ phân loại tags (Phân cách bằng dấu phẩy)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                  <Tag size={15} />
                </span>
                <input
                  type="text"
                  placeholder="Backend, Frontend, Report, Slide"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="snote-input"
                  style={{ paddingLeft: '36px' }}
                />
              </div>
            </div>
          </>
        )}

        {/* Modal Actions Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {mode === 'VIEW' ? (
              <>
                <button
                  type="button"
                  onClick={() => setMode('EDIT')}
                  className="btn btn-primary"
                  style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Edit3 size={15} />
                  <span>Chỉnh Sửa Công Việc</span>
                </button>
                {taskToEdit && (
                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(true)}
                    className="btn btn-secondary"
                    style={{ fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}
                    title="Chia sẻ công việc này cho bạn học hoặc tạo link công khai"
                  >
                    <Share2 size={15} />
                    <span>Chia sẻ</span>
                  </button>
                )}
              </>
            ) : taskToEdit ? (
              <button
                type="button"
                onClick={() => setMode('VIEW')}
                className="btn btn-secondary btn-sm"
                style={{ fontWeight: 600 }}
              >
                <Eye size={14} />
                <span>Quay Lại Xem Chi Tiết</span>
              </button>
            ) : null}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              {mode === 'VIEW' ? 'Đóng' : 'Hủy'}
            </button>
            {mode === 'EDIT' && (
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ fontWeight: 700 }}
              >
                <Save size={15} />
                <span>{loading ? 'Đang lưu trữ...' : taskToEdit ? 'Lưu Thay Đổi' : 'Tạo Nhiệm Vụ'}</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </Modal>

    {taskToEdit && (
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        targetType="TASK"
        targetId={taskToEdit.id}
        targetTitle={taskToEdit.title || 'Công việc'}
      />
    )}
  </>
);
};
